/**
 * dateFilter.js — narrows a parsed chat to a date window before analytics
 * run over it. This is what makes "Wrapped 2025" or "last quarter's report"
 * actually mean something instead of always showing the whole chat's
 * lifetime. Presets are anchored to the CHAT's own last message, not
 * real-world `Date.now()` — a business analyzing a 6-month-old export needs
 * "last 30 days" to mean the last 30 days of data, not an empty result.
 */

/** @returns {{value:string,label:string}[]} preset options, newest-window first */
export const RANGE_PRESETS = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 3 months' },
  { value: 'year', label: 'This year' },
]

/**
 * Resolve a preset id to a concrete {start,end} range, anchored on the
 * chat's last message date. `end` is always the chat's actual last message
 * (not "today") so a filtered view never clips off real trailing data.
 */
export function resolvePreset(id, lastDate) {
  if (id === 'all' || !lastDate) return { start: null, end: null }
  const end = lastDate
  const start = new Date(end)
  if (id === '7d') start.setDate(start.getDate() - 7)
  else if (id === '30d') start.setDate(start.getDate() - 30)
  else if (id === '90d') start.setDate(start.getDate() - 90)
  else if (id === 'year') { start.setMonth(0, 1); start.setHours(0, 0, 0, 0) }
  else return { start: null, end: null }
  return { start, end }
}

/**
 * @param {object} parsed — parser.js output ({ messages, participants, stats })
 * @param {{start: Date|null, end: Date|null}} range
 * @returns {object} a parsed-shaped object with messages restricted to the
 *   window and `stats` recomputed for that window. File-level facts
 *   (platform, dateFormat, malformed) are kept as-is — those describe the
 *   export itself, not the time slice.
 */
export function filterParsed(parsed, range) {
  if (!range || (!range.start && !range.end)) return parsed
  const { start, end } = range
  const inRange = (ts) => (!start || ts >= start) && (!end || ts <= end)
  const messages = parsed.messages.filter((m) => inRange(m.ts))

  let media = 0, deleted = 0, edited = 0, system = 0, userMessages = 0
  let first = null, last = null
  for (const m of messages) {
    if (m.type === 'system') system++
    else {
      userMessages++
      if (m.type === 'media') media++
      if (m.type === 'deleted') deleted++
      if (m.isEdited) edited++
    }
    if (!first || m.ts < first) first = m.ts
    if (!last || m.ts > last) last = m.ts
  }
  const dayCount = first && last ? Math.max(1, Math.round((last - first) / 86400000) + 1) : 0

  return {
    ...parsed,
    messages,
    stats: {
      ...parsed.stats,
      totalMessages: messages.length,
      userMessages,
      systemMessages: system,
      mediaMessages: media,
      deletedMessages: deleted,
      editedMessages: edited,
      firstDate: first,
      lastDate: last,
      dayCount,
    },
  }
}
