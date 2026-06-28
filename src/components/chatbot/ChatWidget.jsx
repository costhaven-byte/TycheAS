import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useI18n } from '../../i18n/context.jsx'
import { IconChat } from '../icons.jsx'
import { askChatbot } from './api.js'

const STORAGE_KEY = 'lucrator-chat'
const EASE = [0.22, 1, 0.36, 1]

// Restore a prior conversation so a refresh doesn't reset the (server-enforced)
// question count out from under the visitor.
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!Array.isArray(s.messages)) return null
    return s
  } catch {
    return null
  }
}

function CloseIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function Bubble({ role, children }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[0.92rem] leading-relaxed ${
          isUser
            ? 'rounded-br-md bg-clay text-white'
            : 'rounded-bl-md border border-line bg-bg text-ink'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export default function ChatWidget() {
  const { t, lang } = useI18n()
  const c = t.chatbot
  const reduce = useReducedMotion()

  const saved = typeof window !== 'undefined' ? loadState() : null
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(saved?.messages || [])
  const [remaining, setRemaining] = useState(
    typeof saved?.remaining === 'number' ? saved.remaining : null,
  )
  const [limited, setLimited] = useState(Boolean(saved?.limited))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [input, setInput] = useState('')

  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Persist across refreshes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, remaining, limited }))
    } catch {
      /* storage unavailable — non-fatal */
    }
  }, [messages, remaining, limited])

  // Keep the latest message in view.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading, limited, open])

  useEffect(() => {
    if (open && !limited) inputRef.current?.focus()
  }, [open, limited])

  const hasAsked = messages.some((m) => m.role === 'user')

  async function send(text) {
    const content = text.trim()
    if (!content || loading || limited) return

    setError(false)
    setInput('')
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setLoading(true)

    try {
      const data = await askChatbot(next, lang)
      setMessages((m) => [...m, { role: 'assistant', content: data.reply, actions: data.actions || [] }])
      if (typeof data.questionsRemaining === 'number') setRemaining(data.questionsRemaining)
      if (data.limitReached) setLimited(true)
    } catch {
      setError(true)
      // Roll the unanswered question back so the visitor can retry it.
      setMessages((m) => m.slice(0, -1))
      setInput(content)
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    send(input)
  }

  const panel = (
    <motion.div
      key="panel"
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="pointer-events-auto flex h-[min(70vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-soft"
      role="dialog"
      aria-label={c.title}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-line bg-clay px-4 py-3.5 text-white">
        <div className="min-w-0">
          <p className="truncate text-[0.95rem] font-bold">{c.title}</p>
          <p className="truncate text-xs text-white/75">{c.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={c.close}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <Bubble role="assistant">{c.greeting}</Bubble>

        {messages.map((m, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Bubble role={m.role}>{m.content}</Bubble>
            {/* Confirmations for anything the agent actually booked or sold. */}
            {m.actions?.map((a, j) => (
              <div
                key={j}
                className="self-start rounded-xl border border-win/30 bg-win-tint/50 px-3 py-1.5 text-xs font-semibold text-win"
              >
                {a.type === 'sale'
                  ? c.sold(a.package)
                  : c.booked(a.date)}
              </div>
            ))}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-line bg-bg px-3.5 py-2.5 text-[0.92rem] text-muted">
              {c.thinking}
            </div>
          </div>
        )}

        {error && <p className="text-center text-xs text-clay-ink">{c.error}</p>}

        {/* Suggestion chips — only before the first question. */}
        {!hasAsked && !loading && !limited && (
          <div className="mt-1 flex flex-wrap gap-2">
            {c.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-line-strong bg-bg px-3 py-1.5 text-start text-xs font-medium text-ink-soft transition-colors hover:border-clay hover:text-clay-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Limit reached — end the chat, point to audit / FAQ. */}
        {limited && (
          <div className="mt-1 rounded-2xl border border-clay/30 bg-clay-tint/40 p-4">
            <p className="text-sm font-bold text-ink">{c.limitTitle}</p>
            <p className="mt-1 text-[0.85rem] leading-relaxed text-ink-soft">{c.limitBody}</p>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-clay-strong"
              >
                {c.bookAudit}
              </a>
              <a
                href="#faq"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-clay hover:text-clay-ink"
              >
                {c.viewFaq}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      {!limited && (
        <form onSubmit={onSubmit} className="border-t border-line bg-surface px-3 py-3">
          <div className="flex items-end gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={c.placeholder}
              maxLength={1000}
              disabled={loading}
              className="min-w-0 flex-1 rounded-full border border-line-strong bg-bg px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-clay focus:ring-2 focus:ring-clay/20 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-clay text-white transition-colors hover:bg-clay-strong disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={c.send}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="rtl:-scale-x-100">
                <path d="M2 9l13-6-4 13-2.5-4.5L2 9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[0.7rem] text-muted">
            <span>{c.disclaimer}</span>
            {typeof remaining === 'number' && <span>{c.remaining(remaining)}</span>}
          </div>
        </form>
      )}
    </motion.div>
  )

  return (
    <div className="fixed bottom-5 end-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>{open && panel}</AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={reduce ? undefined : { scale: 0.94 }}
        aria-expanded={open}
        aria-label={c.title}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-clay py-3 ps-4 pe-5 text-white shadow-clay transition-colors hover:bg-clay-strong"
      >
        <IconChat className="h-5 w-5" />
        {!open && <span className="text-sm font-semibold">{c.launcher}</span>}
      </motion.button>
    </div>
  )
}
