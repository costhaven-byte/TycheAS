import fs from 'node:fs'

function escapeField(v) {
  const s = v === null || v === undefined ? '' : String(v)
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

export function toCsv(rows, columns) {
  const header = columns.join(',')
  const lines = rows.map((r) => columns.map((c) => escapeField(r[c])).join(','))
  return [header, ...lines].join('\n') + '\n'
}

export function writeCsv(path, rows, columns) {
  fs.writeFileSync(path, toCsv(rows, columns), 'utf8')
}

export function appendCsv(path, row, columns) {
  const exists = fs.existsSync(path)
  const line = columns.map((c) => escapeField(row[c])).join(',') + '\n'
  if (!exists) {
    fs.writeFileSync(path, columns.join(',') + '\n' + line, 'utf8')
  } else {
    fs.appendFileSync(path, line, 'utf8')
  }
}

// Minimal RFC-4180-ish parser (handles quoted fields, commas, newlines).
export function parseCsv(text) {
  const rows = []
  let field = ''
  let row = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      field = ''
      row = []
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  if (rows.length === 0) return []
  const header = rows[0]
  return rows
    .slice(1)
    .filter((r) => r.some((v) => v !== ''))
    .map((r) => Object.fromEntries(header.map((h, idx) => [h, r[idx] ?? ''])))
}

export function readCsv(path) {
  if (!fs.existsSync(path)) return []
  return parseCsv(fs.readFileSync(path, 'utf8'))
}
