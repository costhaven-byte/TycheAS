// Compact pipeline summary — a single strip of counts, not a hero-metric wall.
import { parseDate } from './shared.jsx'

function sameMonth(value, ref) {
  const d = parseDate(value)
  return d && d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
}

export default function StatCards({ potential, closed }) {
  const now = new Date()
  const open = potential.filter((p) => p.Status === 'Open').length
  const inProgress = potential.filter((p) => p.Status === 'In Progress').length
  const completed = potential.filter((p) => p.Status === 'Completed').length
  const canceled = potential.filter((p) => p.Status === 'Canceled').length
  const closedThisMonth = closed.filter((c) => sameMonth(c['Activation Date'], now)).length

  const stats = [
    { label: 'Open prospects', value: open, accent: 'text-clay-ink' },
    { label: 'In progress', value: inProgress, accent: 'text-[oklch(0.45_0.12_255)]' },
    { label: 'Marked completed', value: completed, accent: 'text-win' },
    { label: 'Closed deals', value: closed.length, accent: 'text-ink' },
    { label: 'Activated this month', value: closedThisMonth, accent: 'text-ink' },
    { label: 'Canceled', value: canceled, accent: 'text-muted' },
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
