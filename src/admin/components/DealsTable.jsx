// One table component for both pipeline tabs. Driven by a column spec so the
// markup, empty state, and responsive behavior stay identical across screens.
import { useState, useRef, useEffect } from 'react'
import {
  StatusPill,
  AdminButton,
  IconDots,
  IconPlay,
  IconCheckCircle,
  IconXCircle,
  fmtDate,
} from './shared.jsx'
import { COLS } from '../config.js'

const POTENTIAL_COLS = [
  { key: COLS.potential.name, label: 'Client', strong: true },
  { key: COLS.potential.id, label: 'ID', mono: true, hideSm: true },
  { key: COLS.potential.industry, label: 'Industry', hideSm: true },
  { key: COLS.potential.interest, label: 'Interest' },
  { key: COLS.potential.need, label: 'Need (prototype)', hideMd: true },
  { key: COLS.potential.due, label: 'Due', date: true },
  { key: COLS.potential.status, label: 'Status', status: true },
  { key: COLS.potential.assignee, label: 'Owner', closer: true, hideSm: true },
]

const CLOSED_COLS = [
  { key: COLS.closed.name, label: 'Client', strong: true },
  { key: COLS.closed.industry, label: 'Industry', hideSm: true },
  { key: COLS.closed.pkg, label: 'Package' },
  { key: COLS.closed.duration, label: 'Duration', hideSm: true },
  { key: COLS.closed.closer, label: 'Closer', closer: true },
  { key: COLS.closed.activation, label: 'Activated', date: true, hideMd: true },
  { key: COLS.closed.end, label: 'Ends', date: true },
]

const CLOSER_STYLE = {
  Ahmed: 'bg-[oklch(0.95_0.03_255)] text-[oklch(0.45_0.12_255)]',
  Selim: 'bg-clay-tint text-clay-ink',
}

function hideClass(c) {
  return `${c.hideSm ? 'hidden sm:table-cell' : ''} ${c.hideMd ? 'hidden md:table-cell' : ''}`
}

function Cell({ col, value }) {
  if (col.status) return <StatusPill status={value} />
  if (col.date) return <span className="whitespace-nowrap text-ink-soft">{fmtDate(value)}</span>
  if (col.closer)
    return (
      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${CLOSER_STYLE[value] || 'bg-sunken text-ink-soft'}`}>
        {value || '—'}
      </span>
    )
  if (col.mono) return <span className="font-mono text-xs text-muted">{value || '—'}</span>
  if (col.strong) return <span className="font-semibold text-ink">{value || '—'}</span>
  return <span className="text-ink-soft">{value || '—'}</span>
}

// Per-row actions for a prospect. A small popover so the row stays uncluttered
// while still offering start / close / cancel. Closes on outside click or Esc.
function RowActions({ row, onStart, onMove, onCancel }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const done = row.Status === 'Completed' || row.Status === 'Canceled'

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (done) return <span className="text-xs text-muted">—</span>

  const pick = (fn) => () => {
    setOpen(false)
    fn(row)
  }

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <AdminButton
        variant="secondary"
        className="px-2 py-1.5"
        aria-label="Deal actions"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <IconDots className="h-4 w-4" />
      </AdminButton>
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-line bg-surface py-1 text-left shadow-lift">
          {row.Status !== 'In Progress' && (
            <MenuItem onClick={pick(onStart)} Icon={IconPlay}>
              Set in progress…
            </MenuItem>
          )}
          <MenuItem onClick={pick(onMove)} Icon={IconCheckCircle}>
            Move to closed…
          </MenuItem>
          <MenuItem onClick={pick(onCancel)} Icon={IconXCircle} danger>
            Cancel deal…
          </MenuItem>
        </div>
      )}
    </div>
  )
}

function MenuItem({ onClick, Icon, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-sm font-medium transition-colors ${
        danger ? 'text-alert hover:bg-[oklch(0.96_0.03_27)]' : 'text-ink hover:bg-sunken'
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}

export default function DealsTable({ kind, rows, onMove, onStart, onCancel, emptyState }) {
  const cols = kind === 'closed' ? CLOSED_COLS : POTENTIAL_COLS
  const showAction = kind === 'potential' && typeof onMove === 'function'

  if (!rows.length) return emptyState

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {cols.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted ${hideClass(c)}`}
              >
                {c.label}
              </th>
            ))}
            {showAction && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.row} className="border-b border-line last:border-0 transition-colors hover:bg-sunken/60">
              {cols.map((c) => (
                <td key={c.key} className={`px-4 py-3 align-middle ${hideClass(c)}`}>
                  <Cell col={c} value={r[c.key]} />
                </td>
              ))}
              {showAction && (
                <td className="px-4 py-3 text-right">
                  <RowActions row={r} onStart={onStart} onMove={onMove} onCancel={onCancel} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
