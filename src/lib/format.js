/** format.js — tiny presentation helpers shared across the UI. */

export const cn = (...xs) => xs.filter(Boolean).join(' ')

/** 12345 → "12.3k", 2_400_000 → "2.4M". */
export function compact(n) {
  if (n == null || isNaN(n)) return '0'
  const abs = Math.abs(n)
  if (abs < 1000) return String(Math.round(n))
  if (abs < 1e6) return (n / 1e3).toFixed(abs < 1e4 ? 1 : 0).replace(/\.0$/, '') + 'k'
  return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
}

/** 1234567 → "1,234,567" */
export const comma = (n) => (n == null ? '0' : Math.round(n).toLocaleString('en-US'))

/** seconds → "2h 14m", "3m 12s", "45s" */
export function duration(sec) {
  if (sec == null || !isFinite(sec)) return '—'
  sec = Math.round(sec)
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  if (m < 60) return sec % 60 ? `${m}m ${sec % 60}s` : `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return m % 60 ? `${h}h ${m % 60}m` : `${h}h`
  const d = Math.floor(h / 24)
  return h % 24 ? `${d}d ${h % 24}h` : `${d}d`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const fmtDate = (d) => (d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : '—')
export const fmtMonth = (d) => (d ? `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` : '')
export const fmtHour = (h) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`

/** "Alice Smith" → "AS" */
export function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Deterministic, theme-agnostic accent for a participant (HSL wheel).
const HUES = [8, 28, 48, 96, 152, 188, 210, 248, 286, 324]
export function nameHue(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return HUES[h % HUES.length]
}
export const nameColor = (name, s = 70, l = 55) => `hsl(${nameHue(name)} ${s}% ${l}%)`

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
