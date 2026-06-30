// Shared admin building blocks: modal, form controls, status pills, icons,
// and date helpers. One vocabulary reused across every dashboard screen.
import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1]

// ---- Date helpers -----------------------------------------------------------

// Sheet dates arrive as 'yyyy-MM-dd' strings. Parse as local (no TZ shift).
export function parseDate(value) {
  if (!value) return null
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const d = new Date(value)
  return isNaN(d) ? null : d
}

export function fmtDate(value) {
  const d = parseDate(value)
  if (!d) return value || '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function toISODate(d) {
  if (!d) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ---- Status pill ------------------------------------------------------------
// Keyed to the STATUSES in config.js. If you add a status, add a style here.

const STATUS_STYLE = {
  // Lead statuses
  New: 'bg-clay-tint text-clay-ink',
  Contacted: 'bg-[oklch(0.95_0.03_255)] text-[oklch(0.45_0.12_255)]',
  Won: 'bg-win-tint text-win',
  Lost: 'bg-[oklch(0.95_0.04_27)] text-alert',
  // Booking statuses
  Booked: 'bg-clay-tint text-clay-ink',
  Done: 'bg-win-tint text-win',
  Cancelled: 'bg-[oklch(0.95_0.04_27)] text-alert',
}

export function StatusPill({ status }) {
  const cls = STATUS_STYLE[status] || 'bg-sunken text-ink-soft'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status || '—'}
    </span>
  )
}

// ---- Form controls ----------------------------------------------------------

const controlBase =
  'w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted transition-colors focus:outline-none focus:border-clay focus:ring-2 focus:ring-clay/20'

export function Field({ label, hint, error, required, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.8rem] font-semibold text-ink">
        {label}
        {required && <span className="text-clay-ink"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="text-xs font-medium text-alert">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  )
}

export function Input(props) {
  return <input {...props} className={`${controlBase} ${props.className || ''}`} />
}

export function Select({ children, placeholder, value, ...props }) {
  return (
    <select
      {...props}
      value={value}
      className={`${controlBase} ${value ? 'text-ink' : 'text-muted'} appearance-none bg-[length:1.1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239a8f86' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
      }}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  )
}

export function Textarea(props) {
  return <textarea {...props} className={`${controlBase} resize-none ${props.className || ''}`} />
}

// ---- Modal ------------------------------------------------------------------

export function Modal({ open, onClose, title, subtitle, children, footer }) {
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Render only while open. We intentionally don't use AnimatePresence for the
  // exit transition — its exit-unmount is unreliable under React StrictMode in
  // dev, which can leave the dialog stuck on screen. Enter animation only.
  if (!open) return null

  return (
    <motion.div
      className="fixed inset-0 z-modal flex items-end justify-center p-0 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-lg overflow-hidden rounded-t-3xl border border-line bg-surface shadow-lift sm:rounded-3xl"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: EASE }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-line bg-sunken px-6 py-4">{footer}</div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ---- Buttons (admin-scoped, dense) ------------------------------------------

const BTN = {
  primary: 'bg-clay text-white hover:bg-clay-strong active:translate-y-px disabled:opacity-50',
  secondary:
    'border border-line-strong bg-surface text-ink hover:border-clay hover:text-clay-ink active:translate-y-px disabled:opacity-50',
  ghost: 'text-ink-soft hover:bg-sunken hover:text-ink',
}

export function AdminButton({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${BTN[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

// ---- Icons (1.7 stroke) -----------------------------------------------------

const ic = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const IconX = (p) => (
  <svg {...ic} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
export const IconPlus = (p) => (
  <svg {...ic} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const IconRefresh = (p) => (
  <svg {...ic} {...p}>
    <path d="M21 12a9 9 0 11-2.64-6.36M21 4v4h-4" />
  </svg>
)
export const IconArrowRight = (p) => (
  <svg {...ic} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
export const IconTable = (p) => (
  <svg {...ic} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M3 14.5h18M9 9v11" />
  </svg>
)
export const IconCheckCircle = (p) => (
  <svg {...ic} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </svg>
)
export const IconCalendar = (p) => (
  <svg {...ic} {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </svg>
)
export const IconLock = (p) => (
  <svg {...ic} {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </svg>
)
export const IconChevronLeft = (p) => (
  <svg {...ic} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
)
export const IconChevronRight = (p) => (
  <svg {...ic} {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)
export const IconDots = (p) => (
  <svg {...ic} {...p}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </svg>
)
export const IconPlay = (p) => (
  <svg {...ic} {...p}>
    <path d="M7 5l11 7-11 7V5z" />
  </svg>
)
export const IconXCircle = (p) => (
  <svg {...ic} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
)
export const IconSearch = (p) => (
  <svg {...ic} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
)
export const IconTrash = (p) => (
  <svg {...ic} {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13M10 11v6M14 11v6" />
  </svg>
)
export const IconSort = (p) => (
  <svg {...ic} {...p}>
    <path d="M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l3 3M17 20l-3-3" />
  </svg>
)
export const IconCheck = (p) => (
  <svg {...ic} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
)
