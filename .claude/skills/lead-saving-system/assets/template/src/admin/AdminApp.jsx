// Admin dashboard shell: password gate → Leads / Bookings / Sales + Calendar.
// The client's Google Sheet (via the shared Platform) is the only datastore.
import { useState, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { listData, addLead, updateLeadStatus, updateBookingStatus, deleteLead } from './api.js'
import { BRAND, SESSION_KEY, ADMIN_PASSWORD, IS_LIVE, LEAD_STATUSES } from './config.js'
import StatCards from './components/StatCards.jsx'
import DealsTable from './components/DealsTable.jsx'
import Calendar from './components/Calendar.jsx'
import AddLeadModal from './components/AddProspectModal.jsx'
import DeleteLeadModal from './components/DeleteDealModal.jsx'
import {
  AdminButton, IconPlus, IconRefresh, IconTable, IconCheckCircle, IconCalendar, IconLock, IconCheck, IconXCircle, IconTrash,
} from './components/shared.jsx'

const VIEWS = [
  { id: 'leads', label: 'Leads', Icon: IconTable },
  { id: 'bookings', label: 'Bookings', Icon: IconCalendar },
  { id: 'sales', label: 'Sales', Icon: IconCheckCircle },
  { id: 'calendar', label: 'Calendar', Icon: IconCalendar },
]

function Gate({ onUnlock }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const submit = (e) => {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onUnlock()
    } else setError(true)
  }
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-5">
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 shadow-lift">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-clay-tint text-clay-ink"><IconLock className="h-6 w-6" /></span>
        <h1 className="mt-5 text-2xl font-bold text-ink">{BRAND.name} Admin</h1>
        <p className="mt-1.5 text-sm text-ink-soft">Enter the dashboard password to continue.</p>
        <input type="password" autoFocus value={pw} onChange={(e) => { setPw(e.target.value); setError(false) }} placeholder="Password" className={`mt-6 w-full rounded-xl border bg-surface px-4 py-3 text-sm text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-clay/20 ${error ? 'border-alert' : 'border-line-strong focus:border-clay'}`} />
        {error && <p className="mt-2 text-xs font-medium text-alert">Wrong password.</p>}
        <AdminButton type="submit" className="mt-5 w-full">Unlock dashboard</AdminButton>
      </motion.form>
    </div>
  )
}

function EmptyState({ kind, onAdd }) {
  const copy = {
    leads: { title: 'No leads yet', body: 'Leads from your website, chatbot, and DMs land here automatically.' },
    bookings: { title: 'No bookings yet', body: 'Appointments your chatbot makes show up here and on the calendar.' },
    sales: { title: 'No sales yet', body: 'Sales your chatbot closes are recorded here.' },
  }[kind] || { title: 'Nothing yet', body: '' }
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sunken text-muted"><IconTable className="h-6 w-6" /></span>
      <h3 className="mt-4 text-base font-bold text-ink">{copy.title}</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-ink-soft">{copy.body}</p>
      {kind === 'leads' && (
        <AdminButton className="mx-auto mt-5" onClick={onAdd}><IconPlus className="h-4 w-4" />Add lead</AdminButton>
      )}
    </div>
  )
}

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

export default function AdminApp() {
  const reduce = useReducedMotion()
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [view, setView] = useState('leads')
  const [data, setData] = useState({ leads: [], bookings: [], sales: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncedAt, setSyncedAt] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await listData())
      setSyncedAt(new Date())
    } catch (e) {
      setError(e.message || 'Could not reach the backend.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (authed) load() }, [authed, load])

  if (!authed) return <Gate onUnlock={() => setAuthed(true)} />

  const handleAdd = async (values) => { await addLead(values); await load() }
  const handleLeadStatus = async (row, status) => { await updateLeadStatus({ id: row['Lead ID'], status }); await load() }
  const handleBookingStatus = async (row, status) => { await updateBookingStatus({ id: row['Booking ID'], status }); await load() }
  const handleDelete = async (values) => { await deleteLead(values); await load() }

  // Per-row action menus, supplied to the table per kind.
  const leadMenu = (row) => [
    ...LEAD_STATUSES.filter((s) => s !== row.Status).map((s) => ({
      label: `Mark ${s}`, Icon: s === 'Lost' ? IconXCircle : IconCheck, danger: s === 'Lost', onClick: () => handleLeadStatus(row, s),
    })),
    { label: 'Delete lead', Icon: IconTrash, danger: true, onClick: () => setDeleteTarget(row) },
  ]
  const bookingMenu = (row) => [
    ...(row.Status !== 'Done' ? [{ label: 'Mark done', Icon: IconCheck, onClick: () => handleBookingStatus(row, 'Done') }] : []),
    ...(row.Status !== 'Cancelled' ? [{ label: 'Cancel booking', Icon: IconXCircle, danger: true, onClick: () => handleBookingStatus(row, 'Cancelled') }] : []),
  ]

  const headings = {
    leads: { title: 'Leads', sub: 'Everyone who reached out — from your site, chatbot, and DMs.' },
    bookings: { title: 'Bookings', sub: 'Appointments your chatbot booked, plus any you add.' },
    sales: { title: 'Sales', sub: 'Sales your chatbot closed.' },
    calendar: { title: 'Calendar', sub: 'Your bookings at a glance.' },
  }[view]

  return (
    <div className="min-h-screen bg-bg pb-20">
      <header className="sticky top-0 z-sticky border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-clay text-sm font-bold text-white">{BRAND.initial}</span>
            <div className="leading-tight">
              <div className="text-sm font-bold text-ink">{BRAND.name}</div>
              <div className="text-xs text-muted">{BRAND.tagline}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
              <span className={`h-1.5 w-1.5 rounded-full ${IS_LIVE ? 'bg-win' : 'bg-line-strong'}`} />
              {IS_LIVE ? 'Live' : 'Demo data'}
              {syncedAt && <span className="text-muted">· synced {syncedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>}
            </span>
            <AdminButton variant="secondary" onClick={load} disabled={loading} className="px-3">
              <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </AdminButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink sm:text-[1.75rem]">{headings.title}</h1>
            <p className="mt-1 text-sm text-ink-soft">{headings.sub}</p>
          </div>
          <AdminButton onClick={() => setAddOpen(true)}><IconPlus className="h-4 w-4" />Add lead</AdminButton>
        </div>

        <div className="mt-6">
          <StatCards leads={data.leads} bookings={data.bookings} sales={data.sales} />
        </div>

        <nav className="mt-7 inline-flex rounded-xl border border-line bg-surface p-1">
          {VIEWS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setView(id)} className={`relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors sm:px-4 ${view === id ? 'text-white' : 'text-ink-soft hover:text-ink'}`}>
              {view === id && <motion.span layoutId="view-pill" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-lg bg-clay" />}
              <span className="relative flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span>
            </button>
          ))}
        </nav>

        {error && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-alert/30 bg-[oklch(0.96_0.03_27)] px-4 py-3 text-sm text-alert">
            <span>{error}</span>
            <button onClick={load} className="font-semibold underline">Retry</button>
          </div>
        )}

        <div className="mt-5">
          <motion.div key={view} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            {loading ? (
              view === 'calendar' ? <div className="h-96 animate-pulse rounded-3xl border border-line bg-surface" /> : <TableSkeleton />
            ) : view === 'calendar' ? (
              <Calendar bookings={data.bookings} sales={data.sales} />
            ) : view === 'leads' ? (
              <DealsTable kind="leads" rows={data.leads} menuItems={leadMenu} emptyState={<EmptyState kind="leads" onAdd={() => setAddOpen(true)} />} />
            ) : view === 'bookings' ? (
              <DealsTable kind="bookings" rows={data.bookings} menuItems={bookingMenu} emptyState={<EmptyState kind="bookings" />} />
            ) : (
              <DealsTable kind="sales" rows={data.sales} emptyState={<EmptyState kind="sales" />} />
            )}
          </motion.div>
        </div>
      </main>

      <AddLeadModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />
      <DeleteLeadModal lead={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  )
}
