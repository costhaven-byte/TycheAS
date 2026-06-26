// Admin dashboard shell: password gate → pipeline board + calendar.
// The Google Sheet (via Apps Script) is the only datastore; this is its face.
import { useState, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { listDeals, addProspect, moveToClosed, updateDeal } from './api.js'
import { ADMIN_PASSWORD, IS_LIVE } from './config.js'
import StatCards from './components/StatCards.jsx'
import DealsTable from './components/DealsTable.jsx'
import Calendar from './components/Calendar.jsx'
import AddProspectModal from './components/AddProspectModal.jsx'
import MoveToClosedModal from './components/MoveToClosedModal.jsx'
import DealStatusModal from './components/DealStatusModal.jsx'
import {
  AdminButton,
  IconPlus,
  IconRefresh,
  IconTable,
  IconCheckCircle,
  IconCalendar,
  IconLock,
} from './components/shared.jsx'

const SESSION_KEY = 'lucrator_admin_ok'

const VIEWS = [
  { id: 'potential', label: 'Potential', Icon: IconTable },
  { id: 'closed', label: 'Closed', Icon: IconCheckCircle },
  { id: 'calendar', label: 'Calendar', Icon: IconCalendar },
]

// ---- Gate -------------------------------------------------------------------

function Gate({ onUnlock }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const submit = (e) => {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onUnlock()
    } else {
      setError(true)
    }
  }
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-5">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 shadow-lift"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-clay-tint text-clay-ink">
          <IconLock className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-ink">Lucrator Admin</h1>
        <p className="mt-1.5 text-sm text-ink-soft">Enter the dashboard password to continue.</p>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => {
            setPw(e.target.value)
            setError(false)
          }}
          placeholder="Password"
          className={`mt-6 w-full rounded-xl border bg-surface px-4 py-3 text-sm text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-clay/20 ${
            error ? 'border-alert' : 'border-line-strong focus:border-clay'
          }`}
        />
        {error && <p className="mt-2 text-xs font-medium text-alert">Wrong password.</p>}
        <AdminButton type="submit" className="mt-5 w-full">
          Unlock dashboard
        </AdminButton>
      </motion.form>
    </div>
  )
}

// ---- Empty state ------------------------------------------------------------

function EmptyState({ kind, onAdd }) {
  const isPotential = kind === 'potential'
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sunken text-muted">
        {isPotential ? <IconTable className="h-6 w-6" /> : <IconCheckCircle className="h-6 w-6" />}
      </span>
      <h3 className="mt-4 text-base font-bold text-ink">
        {isPotential ? 'No prospects yet' : 'No closed deals yet'}
      </h3>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-ink-soft">
        {isPotential
          ? 'Leads from the website land here automatically. Add an outside prospect to get started.'
          : 'Close a prospect from the Potential tab and it appears here.'}
      </p>
      {isPotential && (
        <AdminButton className="mx-auto mt-5" onClick={onAdd}>
          <IconPlus className="h-4 w-4" />
          Add prospect
        </AdminButton>
      )}
    </div>
  )
}

// ---- Skeleton ---------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="h-11 border-b border-line bg-sunken" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-4 last:border-0">
          <div className="h-3 w-32 animate-pulse rounded bg-line" />
          <div className="h-3 w-24 animate-pulse rounded bg-line" />
          <div className="ml-auto h-6 w-20 animate-pulse rounded-full bg-line" />
        </div>
      ))}
    </div>
  )
}

// ---- Shell ------------------------------------------------------------------

export default function AdminApp() {
  const reduce = useReducedMotion()
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [view, setView] = useState('potential')
  const [data, setData] = useState({ potential: [], closed: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncedAt, setSyncedAt] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [moveTarget, setMoveTarget] = useState(null)
  // { mode: 'start' | 'cancel', deal } — drives the status-change modal.
  const [statusTarget, setStatusTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await listDeals()
      setData(next)
      setSyncedAt(new Date())
    } catch (e) {
      setError(e.message || 'Could not reach the backend.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) load()
  }, [authed, load])

  if (!authed) return <Gate onUnlock={() => setAuthed(true)} />

  const handleAdd = async (values) => {
    await addProspect(values)
    await load()
  }
  const handleMove = async (values) => {
    await moveToClosed(values)
    await load()
  }
  const handleStatus = async (values) => {
    await updateDeal(values)
    await load()
  }

  const tableProps = {
    potential: {
      kind: 'potential',
      rows: data.potential,
      onMove: (row) => setMoveTarget(row),
      onStart: (row) => setStatusTarget({ mode: 'start', deal: row }),
      onCancel: (row) => setStatusTarget({ mode: 'cancel', deal: row }),
      emptyState: <EmptyState kind="potential" onAdd={() => setAddOpen(true)} />,
    },
    closed: {
      kind: 'closed',
      rows: data.closed,
      emptyState: <EmptyState kind="closed" />,
    },
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* top bar */}
      <header className="sticky top-0 z-sticky border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-clay text-sm font-bold text-white">L</span>
            <div className="leading-tight">
              <div className="text-sm font-bold text-ink">Lucrator</div>
              <div className="text-xs text-muted">Pipeline</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
              <span className={`h-1.5 w-1.5 rounded-full ${IS_LIVE ? 'bg-win' : 'bg-line-strong'}`} />
              {IS_LIVE ? 'Live' : 'Demo data'}
              {syncedAt && (
                <span className="text-muted">
                  · synced {syncedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </span>
            <AdminButton variant="secondary" onClick={load} disabled={loading} className="px-3">
              <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </AdminButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-8">
        {/* heading + add */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink sm:text-[1.75rem]">Sales pipeline</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Inbound briefs land in Potential automatically. Add outside prospects and close deals here.
            </p>
          </div>
          <AdminButton onClick={() => setAddOpen(true)}>
            <IconPlus className="h-4 w-4" />
            Add prospect
          </AdminButton>
        </div>

        {/* stats */}
        <div className="mt-6">
          <StatCards potential={data.potential} closed={data.closed} />
        </div>

        {/* view switch */}
        <nav className="mt-7 inline-flex rounded-xl border border-line bg-surface p-1">
          {VIEWS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors sm:px-4 ${
                view === id ? 'text-white' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {view === id && (
                <motion.span
                  layoutId="view-pill"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-lg bg-clay"
                />
              )}
              <span className="relative flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </span>
            </button>
          ))}
        </nav>

        {/* error banner */}
        {error && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-alert/30 bg-[oklch(0.96_0.03_27)] px-4 py-3 text-sm text-alert">
            <span>{error}</span>
            <button onClick={load} className="font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {/* content — keyed remount plays the enter animation on each view switch */}
        <div className="mt-5">
          <motion.div
            key={view}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {loading ? (
              view === 'calendar' ? (
                <div className="h-96 animate-pulse rounded-3xl border border-line bg-surface" />
              ) : (
                <TableSkeleton />
              )
            ) : view === 'calendar' ? (
              <Calendar potential={data.potential} closed={data.closed} />
            ) : (
              <DealsTable {...tableProps[view]} />
            )}
          </motion.div>
        </div>
      </main>

      <AddProspectModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />
      <MoveToClosedModal
        open={Boolean(moveTarget)}
        prospect={moveTarget}
        onClose={() => setMoveTarget(null)}
        onSubmit={handleMove}
      />
      <DealStatusModal
        mode={statusTarget?.mode}
        deal={statusTarget?.deal}
        onClose={() => setStatusTarget(null)}
        onSubmit={handleStatus}
      />
    </div>
  )
}
