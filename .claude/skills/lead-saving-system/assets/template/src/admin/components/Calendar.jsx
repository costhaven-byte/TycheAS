// Month calendar card — the booking calendar. Every booking date becomes a clay
// event; sales show as green markers. Tap a day to read its events below the grid.
import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { parseDate, toISODate, fmtDate, IconChevronLeft, IconChevronRight } from './shared.jsx'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TYPES = {
  booking: { dot: 'bg-clay', label: 'Booking' },
  sale: { dot: 'bg-win', label: 'Sale' },
}

function buildEvents(bookings, sales) {
  const map = {} // isoDate -> [{ type, title, sub }]
  const push = (value, ev) => {
    const d = parseDate(value)
    if (!d) return
    const key = toISODate(d)
    ;(map[key] ||= []).push(ev)
  }
  ;(bookings || []).forEach((b) => {
    if (b.Status === 'Cancelled') return
    const time = b.Time ? ` · ${b.Time}` : ''
    push(b.Date, { type: 'booking', title: b.Name || 'Booking', sub: `${b.Service || 'Appointment'}${time}` })
  })
  ;(sales || []).forEach((s) => {
    push(s.Date, { type: 'sale', title: s.Name || 'Sale', sub: `${s.Item || 'Sale'}${s.Amount ? ` · ${s.Amount}` : ''}` })
  })
  return map
}

function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay()) // back up to Sunday
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export default function Calendar({ bookings, sales }) {
  const reduce = useReducedMotion()
  const today = new Date()
  const todayKey = toISODate(today)
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [selected, setSelected] = useState(todayKey)

  const events = useMemo(() => buildEvents(bookings, sales), [bookings, sales])
  const days = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor])
  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const selectedEvents = events[selected] || []

  const shift = (delta) => {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-lift">
          <div className="px-4 pb-5 pt-4 sm:px-5">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-xl font-bold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
                {monthLabel}
              </h3>
              <div className="flex items-center gap-1">
                <button onClick={() => shift(-1)} aria-label="Previous month" className="grid h-8 w-8 place-items-center rounded-full text-clay-ink transition-colors hover:bg-clay-tint">
                  <IconChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={() => { setCursor({ y: today.getFullYear(), m: today.getMonth() }); setSelected(todayKey) }} className="rounded-full px-2.5 py-1 text-xs font-semibold text-clay-ink transition-colors hover:bg-clay-tint">
                  Today
                </button>
                <button onClick={() => shift(1)} aria-label="Next month" className="grid h-8 w-8 place-items-center rounded-full text-clay-ink transition-colors hover:bg-clay-tint">
                  <IconChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center">
              {WEEKDAYS.map((d) => (
                <div key={d} className="pb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
                  {d.slice(0, 1)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {days.map((d) => {
                const key = toISODate(d)
                const inMonth = d.getMonth() === cursor.m
                const isToday = key === todayKey
                const isSelected = key === selected
                const dayEvents = events[key] || []
                const types = [...new Set(dayEvents.map((e) => e.type))]
                return (
                  <button key={key} onClick={() => setSelected(key)} className="flex flex-col items-center py-1" aria-label={`${fmtDate(key)}${dayEvents.length ? `, ${dayEvents.length} events` : ''}`}>
                    <span className={[
                      'grid h-9 w-9 place-items-center rounded-full text-sm transition-colors',
                      !inMonth ? 'text-muted/50' : 'text-ink',
                      isToday ? 'bg-clay font-bold text-white' : '',
                      isSelected && !isToday ? 'bg-clay-tint font-semibold text-clay-ink' : '',
                      !isSelected && !isToday ? 'hover:bg-sunken' : '',
                    ].join(' ')}>
                      {d.getDate()}
                    </span>
                    <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                      {types.slice(0, 3).map((t) => (
                        <span key={t} className={`h-1.5 w-1.5 rounded-full ${TYPES[t].dot}`} />
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-line bg-sunken px-5 py-4">
            <p className="mb-2 text-xs font-semibold text-ink-soft">
              {new Date(selected).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <AnimatePresence mode="wait">
              <motion.div key={selected} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-2">
                {selectedEvents.length === 0 ? (
                  <p className="py-2 text-sm text-muted">No bookings.</p>
                ) : (
                  selectedEvents.map((e, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TYPES[e.type].dot}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{e.title}</p>
                        <p className="truncate text-xs text-ink-soft">{e.sub}</p>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h4 className="text-sm font-bold text-ink">Legend</h4>
          <ul className="mt-3 flex flex-col gap-2.5">
            {Object.entries(TYPES).map(([k, v]) => (
              <li key={k} className="flex items-center gap-2.5 text-sm text-ink-soft">
                <span className={`h-2.5 w-2.5 rounded-full ${v.dot}`} />
                {v.label}
              </li>
            ))}
          </ul>
        </div>
        <UpcomingList events={events} todayKey={todayKey} onPick={(key) => {
          const d = parseDate(key)
          setCursor({ y: d.getFullYear(), m: d.getMonth() })
          setSelected(key)
        }} />
      </div>
    </div>
  )
}

function UpcomingList({ events, todayKey, onPick }) {
  const items = Object.entries(events)
    .filter(([key]) => key >= todayKey)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([key, evs]) => evs.map((e) => ({ key, ...e })))
    .slice(0, 6)

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h4 className="text-sm font-bold text-ink">Upcoming</h4>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing scheduled ahead.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {items.map((e, i) => (
            <li key={i}>
              <button onClick={() => onPick(e.key)} className="group flex w-full items-start gap-2.5 text-left">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TYPES[e.type].dot}`} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink group-hover:text-clay-ink">{e.title}</p>
                  <p className="truncate text-xs text-ink-soft">{fmtDate(e.key)} · {e.sub}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
