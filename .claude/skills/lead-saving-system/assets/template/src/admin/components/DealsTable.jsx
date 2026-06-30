// One table for Leads / Bookings / Sales. Column spec per kind keeps the markup,
// empty state, and responsive behavior identical across screens. Toolbar adds
// search, an optional status filter, and sort. Per-row actions are supplied by
// the parent via menuItems(row).
import { useState, useRef, useEffect, useMemo } from 'react'
import {
  StatusPill, AdminButton, Input, Select,
  IconDots, IconSearch, IconSort, fmtDate, parseDate,
} from './shared.jsx'
import { COLS } from '../config.js'

const COLSPEC = {
  leads: [
    { key: COLS.leads.name, label: 'Name', strong: true },
    { key: COLS.leads.contact, label: 'Contact' },
    { key: COLS.leads.source, label: 'Source', hideSm: true },
    { key: COLS.leads.interest, label: 'Interest', hideMd: true },
    { key: COLS.leads.notes, label: 'Notes', hideMd: true },
    { key: COLS.leads.date, label: 'Date', date: true, hideSm: true },
    { key: COLS.leads.status, label: 'Status', status: true },
  ],
  bookings: [
    { key: COLS.bookings.name, label: 'Name', strong: true },
    { key: COLS.bookings.contact, label: 'Contact', hideSm: true },
    { key: COLS.bookings.service, label: 'Service' },
    { key: COLS.bookings.date, label: 'Date', date: true },
    { key: COLS.bookings.time, label: 'Time', hideSm: true },
    { key: COLS.bookings.status, label: 'Status', status: true },
    { key: COLS.bookings.notes, label: 'Notes', hideMd: true },
  ],
  sales: [
    { key: COLS.sales.name, label: 'Name', strong: true },
    { key: COLS.sales.contact, label: 'Contact', hideSm: true },
    { key: COLS.sales.item, label: 'Item' },
    { key: COLS.sales.amount, label: 'Amount' },
    { key: COLS.sales.date, label: 'Date', date: true },
    { key: COLS.sales.notes, label: 'Notes', hideMd: true },
  ],
}

// Which column the toolbar filter facets on (none for sales).
const FILTER = {
  leads: { col: COLS.leads.status, label: 'statuses' },
  bookings: { col: COLS.bookings.status, label: 'statuses' },
}

function hideClass(c) {
  return `${c.hideSm ? 'hidden sm:table-cell' : ''} ${c.hideMd ? 'hidden md:table-cell' : ''}`
}

function compareVals(a, b, col) {
  if (col?.date) return (parseDate(a)?.getTime() ?? 0) - (parseDate(b)?.getTime() ?? 0)
  const na = Number(a)
  const nb = Number(b)
  if (a !== '' && b !== '' && !Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
  return String(a ?? '').localeCompare(String(b ?? ''))
}

function Cell({ col, value }) {
  if (col.status) return <StatusPill status={value} />
  if (col.date) return <span className="whitespace-nowrap text-ink-soft">{fmtDate(value)}</span>
  if (col.strong) return <span className="font-semibold text-ink">{value || '—'}</span>
  return <span className="text-ink-soft">{value || '—'}</span>
}

function RowActions({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (!items || !items.length) return <span className="text-xs text-muted">—</span>

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <AdminButton variant="secondary" className="px-2 py-1.5" aria-label="Row actions" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <IconDots className="h-4 w-4" />
      </AdminButton>
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-line bg-surface py-1 text-left shadow-lift">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setOpen(false); it.onClick() }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-sm font-medium transition-colors ${it.danger ? 'text-alert hover:bg-[oklch(0.96_0.03_27)]' : 'text-ink hover:bg-sunken'}`}
            >
              {it.Icon && <it.Icon className="h-4 w-4" />}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Toolbar({ search, setSearch, filter, filterValue, setFilterValue, cols, sortKey, setSortKey, sortDir, setSortDir }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-line bg-sunken/40 px-3 py-3">
      <div className="relative min-w-[200px] flex-1">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9" aria-label="Search" />
      </div>
      {filter && (
        <div className="w-40">
          <Select value={filterValue} onChange={(e) => setFilterValue(e.target.value)} aria-label={`Filter by ${filter.label}`}>
            <option value="">All {filter.label}</option>
            {filter.options.map((o) => (<option key={o} value={o}>{o}</option>))}
          </Select>
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <div className="w-40">
          <Select value={sortKey} onChange={(e) => setSortKey(e.target.value)} aria-label="Sort by">
            <option value="">Sort by…</option>
            {cols.map((c) => (<option key={c.key} value={c.key}>{c.label}</option>))}
          </Select>
        </div>
        <AdminButton variant="secondary" className="px-2.5 py-2.5" onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))} disabled={!sortKey} title={sortDir === 'asc' ? 'Ascending' : 'Descending'}>
          <IconSort className="h-4 w-4" />
          <span className="text-xs">{sortDir === 'asc' ? 'A→Z' : 'Z→A'}</span>
        </AdminButton>
      </div>
    </div>
  )
}

export default function DealsTable({ kind, rows, menuItems, emptyState }) {
  const cols = COLSPEC[kind] || COLSPEC.leads
  const filterDef = FILTER[kind]
  const showAction = typeof menuItems === 'function'

  const [search, setSearch] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState('asc')

  const filterOptions = useMemo(() => {
    if (!filterDef) return []
    const set = new Set()
    rows.forEach((r) => r[filterDef.col] && set.add(r[filterDef.col]))
    return [...set].sort()
  }, [rows, filterDef])

  useEffect(() => {
    if (filterValue && !filterOptions.includes(filterValue)) setFilterValue('')
  }, [filterOptions, filterValue])

  const viewRows = useMemo(() => {
    let out = rows
    const q = search.trim().toLowerCase()
    if (q) out = out.filter((r) => cols.some((c) => String(r[c.key] ?? '').toLowerCase().includes(q)))
    if (filterDef && filterValue) out = out.filter((r) => String(r[filterDef.col] ?? '') === filterValue)
    if (sortKey) {
      const col = cols.find((c) => c.key === sortKey)
      out = [...out].sort((a, b) => compareVals(a[sortKey], b[sortKey], col))
      if (sortDir === 'desc') out.reverse()
    }
    return out
  }, [rows, cols, search, filterDef, filterValue, sortKey, sortDir])

  if (!rows.length) return emptyState

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <Toolbar
        search={search} setSearch={setSearch}
        filter={filterDef ? { label: filterDef.label, options: filterOptions } : null}
        filterValue={filterValue} setFilterValue={setFilterValue}
        cols={cols} sortKey={sortKey} setSortKey={setSortKey} sortDir={sortDir} setSortDir={setSortDir}
      />

      {viewRows.length === 0 ? (
        <div className="px-4 py-14 text-center text-sm text-muted">
          Nothing matches your search or filter.
          <button type="button" onClick={() => { setSearch(''); setFilterValue('') }} className="ml-1 font-semibold text-clay-ink underline">Clear</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {cols.map((c) => {
                  const active = sortKey === c.key
                  return (
                    <th key={c.key} className={`px-4 py-3 ${hideClass(c)}`}>
                      <button type="button" onClick={() => toggleSort(c.key)} className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors hover:text-ink ${active ? 'text-ink' : 'text-muted'}`}>
                        {c.label}
                        {active && <span aria-hidden>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </button>
                    </th>
                  )
                })}
                {showAction && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {viewRows.map((r) => (
                <tr key={r.row} className="border-b border-line last:border-0 transition-colors hover:bg-sunken/60">
                  {cols.map((c) => (
                    <td key={c.key} className={`px-4 py-3 align-middle ${hideClass(c)}`}>
                      <Cell col={c} value={r[c.key]} />
                    </td>
                  ))}
                  {showAction && (
                    <td className="px-4 py-3 text-right">
                      <RowActions items={menuItems(r)} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
