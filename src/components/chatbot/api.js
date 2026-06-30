// Talks to the backend FAQ chatbot. The 5-questions-per-IP cap lives on the
// server; we just send the chat history and surface what comes back.
//
// Set VITE_API_BASE_URL to the deployed backend (e.g. the Render URL). In dev it
// defaults to the local backend on :5000.

const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')

// Which client this widget books/sells for. Set VITE_CHATBOT_CLIENT_ID per client
// deploy so one backend can serve many clients. Optional — the backend falls back
// to its own default client when omitted.
const CLIENT_ID = import.meta.env.VITE_CHATBOT_CLIENT_ID || undefined

/**
 * Ask the assistant. Besides answering, the bot may book an appointment or record
 * a sale — those land in `actions`, which the widget surfaces as a confirmation.
 * @param {Array<{role:'user'|'assistant', content:string}>} messages  full history, oldest first
 * @param {'en'|'ar'} lang
 * @returns {Promise<{reply:string, actions:Array<object>, limitReached:boolean, questionsRemaining:number|null}>}
 */
export async function askChatbot(messages, lang) {
  const res = await fetch(`${BASE}/api/chatbot/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, lang, clientId: CLIENT_ID }),
  })

  // The limit handler also returns 200, so a non-OK response is a real error.
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.success) {
    const message = data?.error?.message || data?.message || 'Request failed'
    throw new Error(message)
  }
  return data.data
}
