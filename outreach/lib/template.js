import { env } from '../config.js'

// The personalized opening line. Prefer the LLM-written, evidence-grounded hook
// stored on the lead; otherwise fall back to a line that uses ONLY real data
// (never invents specifics — that's what trips humanizer/AI checks).
function opener(lead) {
  if (lead.hook && lead.hook.trim()) return lead.hook.trim()
  const rating = Number(lead.rating)
  if (rating >= 4.6 && Number(lead.reviews) >= 40)
    return `Came across ${lead.business} in ${lead.city} — those ${rating}★ reviews are hard to miss.`
  return `Came across ${lead.business} while looking through ${lead.city} ${lead.industryLabel} spots.`
}

const sig = () => `— ${env.senderName}, Lucrator\n${env.replyTo}`

// Two variants for A/B testing. Guidelines: < 100 words, subject < 6 words,
// semi-formal + friendly + a touch of charisma, no sales-pitch AI slop.
export const VARIANTS = {
  A: {
    subject: 'Losing leads without noticing?',
    build: (l) => `Hi there,

${opener(l)}

Quick question though — how many leads slip past on a busy week? A missed call, a slow reply, a quote that drags. It adds up fast.

Lucrator catches them: one pipeline, hot/warm/cold scoring, and a chatbot that books jobs while you work.

Worth a free 15-minute audit? No pitch — just where the money’s leaking.

${sig()}

Not for you? Reply “stop” and I’ll vanish. ${env.mailingAddress}`,
  },
  B: {
    subject: 'Free audit, zero pressure',
    build: (l) => `Hi there,

${opener(l)}

Most ${l.industryLabel} owners lose a few good leads every week without clocking it — a call missed here, a reply too late there.

Lucrator keeps them all in one place: scored, tracked, followed up automatically. The chatbot even books appointments for you.

Want to see where ${l.business} might be leaking leads? Free, fifteen minutes, no strings.

${sig()}

Rather not? A quick “stop” and I’m gone. ${env.mailingAddress}`,
  },
}

export function assignVariant(i) {
  // Deterministic alternating split keeps A/B volumes balanced per run.
  return i % 2 === 0 ? 'A' : 'B'
}

export function compose(lead, variantKey) {
  const v = VARIANTS[variantKey]
  const text = v.build(lead)
  return {
    subject: v.subject,
    text,
    html: text
      .split('\n')
      .map((line) => (line.trim() === '' ? '<br>' : `<div>${escapeHtml(line)}</div>`))
      .join(''),
  }
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
