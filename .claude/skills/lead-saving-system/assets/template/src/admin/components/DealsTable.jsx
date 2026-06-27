// One table component for both pipeline tabs. Driven by a column spec so the
// markup, empty state, and responsive behavior stay identical across screens.
// Includes a toolbar: search across columns, filter by status/closer, and sort.
import { useState, useRef, useEffect, useMemo } from 'react'
import {
  StatusPill,
  AdminButton,
  Input,
  Select,
  IconDots,
  IconPlay,
  IconCheckCircle,
  IconXCircle,
  IconSearch,
  IconTrash,
  IconSort,
  fmtDate,
  parseDate,
} from './shared.jsx'
import { COLS, CLOSERS, CLOSER_TINTS } from '../config.js'

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

// Assign each team member a tint by their position in CLOSERS, cycling the
// palette. Keeps closer chips colorful without hardcoding names.
function closerClass(name) {
  const i = CLOSERS.indexOf(name)
  if (i === -1) return 'bg-sunken text-ink-soft'
  return CLOSER_TINTS[i % CLOSER_TINTS.length]
}

function hideClass(c) {
  return `${c.hideSm ? 'hidden sm:table-cell' : ''} ${c.hideMd ? 'hidden md:table-cell' : ''}`
}

// Compare two cell values for sorting: dates by time, numbers numerically,
// everything else alphabetically.
function compareVals(a, b, col) {
  if (col?.date) {
    return (parseDate(a)?.getTime() ?? 0) - (parseDate(b)?.getTime() ?? 0)
  }
  const na = Number(a)
  const nb = Number(b)
  if (a !== '' && b !== '' && !Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
  return String(a ?? '').localeCompare(String(b ?? ''))
}

function Cell({ col, value }) {
  if (col.status) return <StatusPill status={value} />
  if (col.date) return <span className="whitespace-nowrap text-ink-soft">{fmtDate(value)}</span>
  if (col.closer)
    return (
      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${closerClass(value)}`}>
        {value || '—'}
      </span>
    )
  if (col.mono) return <span className="font-mono text-xs text-muted">{value || '—'}</span>
  if (col.strong) return <span className="font-semibold text-ink">{value || '—'}</span>
  return <span className="text-ink-soft">{value || '—'}</span>
}

// Per-row actions for a prospect. A small popover so the row stays uncluttered.
// Open prospects get start/close/cancel; canceled ones get a delete option.
function RowActions({ row, onStart, onMove, onCancel, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const canceled = row.Status === 'Canceled'
  const completed = row.Status === 'Completed'

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

  // Completed rows shouldn't appear in Potential anymore, but guard anyway.
  if (completed) return <span className="text-xs text-muted">—</span>

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
          {canceled ? (
            <MenuItem onClick={pick(onDelete)} Icon={IconTrash} danger>
              Delete from database…
            </MenuItem>
          ) : (
            <>
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
            </>
          )}
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

// Search + filter + sort controls shown above the table.
function Toolbar({ search, setSearch, filterLabel, filterOptions, filterValue, setFilterValue, cols, sortKey, setSortKey, sortDir, setSortDir }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-line bg-sunken/40 px-3 py-3">
      {/* Search */}
      <div className="relative min-w-[200px] flex-1">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="pl-9"
          aria-label="Search deals"
        />
      </div>
      {/* Filter */}
      <div className="w-40">
        <Select
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          aria-label={`Filter by ${filterLabel}`}
        >
          <option value="">All {filterLabel}</option>
          {filterOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      </div>
      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <div className="w-40">
          <Select value={sortKey} onChange={(e) => setSortKey(e.target.value)} aria-label="Sort by">
            <option value="">Sort by…</option>
            {cols.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <AdminButton
          variant="secondary"
          className="px-2.5 py-2.5"
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          disabled={!sortKey}
          aria-label={`Sort direction: ${sortDir === 'asc' ? 'ascending' : 'descending'}`}
          title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
        >
          <IconSort className="h-4 w-4" />
          <span className="text-xs">{sortDir === 'asc' ? 'A→Z' : 'Z→A'}</span>
        </AdminButton>
      </div>
    </div>
  )
}

export default function DealsTable({ kind, rows, onMove, onStart, onCancel, onDelete, emptyState }) {
  const cols = kind === 'closed' ? CLOSED_COLS : POTENTIAL_COLS
  const showAction = kind === 'potential' && typeof onMove === 'function'

  const [search, setSearch] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState('asc')

  // Filter facet: status for prospects, closer for closed deals.
  const filterCol = kind === 'closed' ? COLS.closed.closer : COLS.potential.status
  const filterLabel = kind === 'closed' ? 'closers' : 'statuses'
  const filterOptions = useMemo(() => {
    const set = new Set()
    rows.forEach((r) => r[filterCol] && set.add(r[filterCol]))
    return [...set].sort()
  }, [rows, filterCol])

  // Reset a stale filter selection if the underlying options change.
  useEffect(() => {
    if (filterValue && !filterOptions.includes(filterValue)) setFilterValue('')
  }, [filterOptions, filterValue])

  const view = useMemo(() => {
    let out = rows
    const q = search.trim().toLowerCase()
    if (q) {
      out = out.filter((r) => cols.some((c) => String(r[c.key] ?? '').toLowerCase().includes(q)))
    }
    if (filterValue) {
      out = out.filter((r) => String(r[filterCol] ?? '') === filterValue)
    }
    if (sortKey) {
      const col = cols.find((c) => c.key === sortKey)
      out = [...out].sort((a, b) => compareVals(a[sortKey], b[sortKey], col))
      if (sortDir === 'desc') out.reverse()
    }
    return out
  }, [rows, cols, search, filterValue, filterCol, sortKey, sortDir])

  if (!rows.length) return emptyState

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <Toolbar
        search={search}
        setSearch={setSearch}
        filterLabel={filterLabel}
        filterOptions={filterOptions}
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        cols={cols}
        sortKey={sortKey}
        setSortKey={setSortKey}
        sortDir={sortDir}
        setSortDir={setSortDir}
      />

      {view.length === 0 ? (
        <div className="px-4 py-14 text-center text-sm text-muted">
          No deals match your search or filter.
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setFilterValue('')
            }}
            className="ml-1 font-semibold text-clay-ink underline"
          >
            Clear
          </button>
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
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors hover:text-ink ${
                          active ? 'text-ink' : 'text-muted'
                        }`}
                      >
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
              {view.map((r) => (
                <tr key={r.row} className="border-b border-line last:border-0 transition-colors hover:bg-sunken/60">
                  {cols.map((c) => (
                    <td key={c.key} className={`px-4 py-3 align-middle ${hideClass(c)}`}>
                      <Cell col={c} value={r[c.key]} />
                    </td>
                  ))}
                  {showAction && (
                    <td className="px-4 py-3 text-right">
                      <RowActions row={r} onStart={onStart} onMove={onMove} onCancel={onCancel} onDelete={onDelete} />
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
