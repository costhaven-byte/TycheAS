// Compact summary strip — leads, bookings, and sales at a glance.
import { parseDate, toISODate } from './shared.jsx'

function sameMonth(value, ref) {
  const d = parseDate(value)
  return d && d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
}

export default function StatCards({ leads, bookings, sales }) {
  const now = new Date()
  const todayKey = toISODate(now)

  const newLeads = leads.filter((l) => l.Status === 'New').length
  const upcoming = bookings.filter((b) => b.Status !== 'Cancelled' && toISODate(parseDate(b.Date)) >= todayKey).length
  const bookingsToday = bookings.filter((b) => b.Status !== 'Cancelled' && toISODate(parseDate(b.Date)) === todayKey).length
  const salesThisMonth = sales.filter((s) => sameMonth(s.Date, now)).length
  const revenueThisMonth = sales
    .filter((s) => sameMonth(s.Date, now))
    .reduce((sum, s) => sum + (Number(String(s.Amount).replace(/[^\d.]/g, '')) || 0), 0)

  const stats = [
    { label: 'Total leads', value: leads.length, accent: 'text-ink' },
    { label: 'New leads', value: newLeads, accent: 'text-clay-ink' },
    { label: 'Upcoming bookings', value: upcoming, accent: 'text-[oklch(0.45_0.12_255)]' },
    { label: 'Bookings today', value: bookingsToday, accent: 'text-clay-ink' },
    { label: 'Sales this month', value: salesThisMonth, accent: 'text-win' },
    { label: 'Revenue this month', value: revenueThisMonth ? revenueThisMonth.toLocaleString() : '—', accent: 'text-win' },
  ]

  return (
    <div className="grid grid-cols-2 divide-y divide-line rounded-2xl border border-line bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-6">
      {stats.map((s) => (
        <div key={s.label} className="px-5 py-4">
          <div className={`text-[1.75rem] font-bold leading-none ${s.accent}`} style={{ fontFamily: 'var(--font-display)' }}>
            {s.value}
          </div>
          <div className="mt-1.5 text-xs font-medium text-ink-soft">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
