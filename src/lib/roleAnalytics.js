/**
 * roleAnalytics.js — the metric that actually matters for a business chat:
 * not "how fast does anyone reply" (computed generically in analytics.js),
 * but "how fast does OUR team reply to THE CLIENT." Requires the user to
 * tag participants as team/client first (see AppContext's `roles` state) —
 * until that happens this has nothing to compute.
 *
 * Deliberately separate from computeAnalytics(): roles are assigned after
 * parsing, in the UI, and change independently of the parsed chat, so this
 * is its own memoizable function keyed on [messages, roles].
 */
const median = (arr) => {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const ymKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

const EMPTY = {
  ready: false, teamCount: 0, clientCount: 0, responseCount: 0,
  median: 0, p90: 0, under15: 0, under60: 0,
  perAgent: [], unanswered: [], monthlySeries: [],
}

/**
 * @param {Array} messages parsed.messages (unfiltered — system rows are
 *   skipped internally)
 * @param {Record<string,'team'|'client'>} roles
 */
export function computeClientSLA(messages, roles) {
  const teamCount = Object.values(roles).filter((r) => r === 'team').length
  const clientCount = Object.values(roles).filter((r) => r === 'client').length
  if (!teamCount || !clientCount) return EMPTY

  const roleOf = (name) => roles[name] || null

  // Deliberately NOT capped like the general RESPONSE_CAP in analytics.js —
  // an overnight gap between a client message and a team reply is real SLA
  // signal for a business, not noise to discard.
  let pending = null // the earliest unanswered client message, {author, ts, body}
  const responses = [] // {seconds, agent, ts}
  const respByMonth = new Map()
  const unresolved = [] // client messages that never got a reply, most recent last

  for (const m of messages) {
    if (m.type === 'system') continue
    const role = roleOf(m.author)
    if (role === 'client') {
      if (!pending) pending = m
      // If a client sends several messages before the team replies, we keep
      // measuring from the FIRST one — that's the honest wait time.
    } else if (role === 'team') {
      if (pending) {
        const seconds = (m.ts - pending.ts) / 1000
        responses.push({ seconds, agent: m.author, ts: m.ts })
        const ym = ymKey(m.ts)
        const bucket = respByMonth.get(ym) || []
        bucket.push(seconds); respByMonth.set(ym, bucket)
        pending = null
      }
    }
    // Untagged participants (role === null) don't start or resolve the
    // pending clock — they're bystanders for this specific metric.
  }
  // Whatever's still pending at the end of the chat never got answered.
  if (pending) unresolved.push(pending)

  const seconds = responses.map((r) => r.seconds)
  const sorted = [...seconds].sort((a, b) => a - b)
  const under = (t) => (sorted.length ? sorted.filter((x) => x <= t).length / sorted.length : 0)

  // Per-agent breakdown, busiest first.
  const byAgent = new Map()
  for (const r of responses) {
    const a = byAgent.get(r.agent) || { name: r.agent, times: [] }
    a.times.push(r.seconds)
    byAgent.set(r.agent, a)
  }
  const perAgent = [...byAgent.values()]
    .map((a) => ({ name: a.name, count: a.times.length, median: median(a.times) }))
    .sort((a, b) => b.count - a.count)

  // Monthly trend, reusing the same {ym,date,value} shape as the app's
  // other timeseries so it can go straight into the existing chart pattern.
  const monthlySeries = [...respByMonth.keys()].sort().map((ym) => {
    const [y, mo] = ym.split('-').map(Number)
    return { ym, date: new Date(y, mo - 1, 1), value: median(respByMonth.get(ym)) }
  })

  // Unanswered list for the UI — most recent first, questions prioritised,
  // capped so a badly-tagged chat can't dump hundreds of rows on screen.
  const unanswered = unresolved
    .slice()
    .sort((a, b) => (b.body?.includes('?') ? 1 : 0) - (a.body?.includes('?') ? 1 : 0) || b.ts - a.ts)
    .slice(0, 20)
    .map((m) => ({ name: m.author, body: m.body, ts: m.ts }))

  return {
    ready: true, teamCount, clientCount, responseCount: seconds.length,
    median: median(seconds),
    p90: sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))] : 0,
    under15: under(900), under60: under(3600),
    perAgent, unanswered, monthlySeries,
  }
}
