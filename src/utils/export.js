// Dependency-free export helpers (CSV / Excel / PDF) for report & table UIs.

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function toRows(data, columns) {
  const cols = columns || Object.keys(data[0] || {}).map((k) => ({ key: k, label: k }))
  const header = cols.map((c) => c.label ?? c.key)
  const rows = data.map((row) => cols.map((c) => row[c.key]))
  return { cols, header, rows }
}

const escapeCsv = (v) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportToCSV(data = [], filename = 'export.csv', columns) {
  if (!data.length) return
  const { header, rows } = toRows(data, columns)
  const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n')
  downloadBlob('﻿' + csv, filename, 'text/csv;charset=utf-8;')
}

// Excel-compatible: HTML table with .xls extension opens cleanly in Excel.
export function exportToExcel(data = [], filename = 'export.xls', columns) {
  if (!data.length) return
  const { header, rows } = toRows(data, columns)
  const thead = `<tr>${header.map((h) => `<th>${h}</th>`).join('')}</tr>`
  const tbody = rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')
  const html = `<html><head><meta charset="utf-8"></head><body><table border="1">${thead}${tbody}</table></body></html>`
  downloadBlob(html, filename, 'application/vnd.ms-excel')
}

// PDF via the browser print dialog (Save as PDF). No external dependency.
export function exportToPDF(data = [], title = 'Report', columns) {
  if (!data.length) return
  const { header, rows } = toRows(data, columns)
  const styles = `
    body{font-family:Inter,Arial,sans-serif;color:#1f2937;padding:32px}
    h1{color:#2a9d97;font-size:20px;margin:0 0 4px}
    .sub{color:#6b7280;font-size:12px;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#36bab3;color:#fff;text-align:left;padding:8px 10px}
    td{padding:8px 10px;border-bottom:1px solid #e5e7eb}
    tr:nth-child(even) td{background:#f8fafc}`
  const thead = `<tr>${header.map((h) => `<th>${h}</th>`).join('')}</tr>`
  const tbody = rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(
    `<html><head><title>${title}</title><style>${styles}</style></head><body>
     <h1>ACTIZO CRM — ${title}</h1><div class="sub">Generated ${new Date().toLocaleString()}</div>
     <table>${thead}${tbody}</table>
     <script>window.onload=()=>{window.print()}</script></body></html>`,
  )
  win.document.close()
}

export function exportData(format, data, name, columns) {
  const map = { csv: exportToCSV, excel: exportToExcel, pdf: exportToPDF }
  const ext = { csv: 'csv', excel: 'xls', pdf: 'pdf' }[format]
  const fn = map[format]
  if (!fn) return
  if (format === 'pdf') fn(data, name, columns)
  else fn(data, `${name}.${ext}`, columns)
}
