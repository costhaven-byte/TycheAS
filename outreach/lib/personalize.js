import { env } from '../config.js'

// Assemble ONLY real, verifiable facts. The model is told to use nothing else,
// so it can't invent a "new location" or "new hire" that isn't here.
export function buildEvidence(lead, details, signals) {
  const lines = []
  lines.push(`Business: ${lead.business} — a ${lead.industryLabel} in ${lead.city}, TX`)
  if (lead.rating) lines.push(`Google rating: ${lead.rating}★ (${lead.reviews || '?'} reviews)`)
  if (details?.summary) lines.push(`Google summary: ${details.summary}`)
  if (details?.reviews?.length) {
    lines.push('Recent Google reviews:')
    for (const r of details.reviews) {
      lines.push(`  - "${r.text.replace(/\s+/g, ' ').slice(0, 240)}" (${r.when || 'recent'})`)
    }
  }
  if (signals) lines.push(`Website text: ${signals}`)
  return lines.join('\n')
}

const SYSTEM = `You write the FIRST line of a warm cold-email to a local business owner.
Rules:
- Use ONLY the facts given. Never invent or assume anything not stated.
- Reference ONE concrete, specific detail — prefer something recent (a new hire, a new location/opening, an award, an anniversary, a launch) or, if none, a genuine detail from a recent review or the business itself (a signature dish, a service, a standout in the reviews).
- Sound like a real person wrote it: semi-formal, friendly, a touch of charisma. Direct, not salesy.
- One sentence, max 18 words. No greeting, no emojis, no "I hope this finds you", no hashtags.
- If there is nothing concrete and specific worth commenting on, reply with exactly: NONE`

async function callLLM(evidence) {
  const res = await fetch(`${env.llm.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.llm.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.llm.model,
      temperature: 0.7,
      // Gemini 2.5 spends tokens "thinking" first; disable it and leave headroom
      // so the actual one-liner isn't truncated.
      reasoning_effort: 'none',
      max_tokens: 200,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: evidence },
      ],
    }),
  })
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 160)}`)
  const data = await res.json()
  return (data.choices?.[0]?.message?.content || '').trim()
}

// Returns a personalized opening sentence, or '' if there's no real hook /
// no LLM configured (caller falls back to a safe, non-fabricated opener).
export async function writeHook(lead, details, signals) {
  if (!env.llm.apiKey) return ''
  const evidence = buildEvidence(lead, details, signals)
  try {
    let hook = await callLLM(evidence)
    hook = hook.replace(/^["'`]|["'`]$/g, '').trim()
    if (!hook || /^none$/i.test(hook)) return ''
    // Guard against the model ignoring the length rule.
    if (hook.split(/\s+/).length > 24) return ''
    return hook
  } catch {
    return ''
  }
}
