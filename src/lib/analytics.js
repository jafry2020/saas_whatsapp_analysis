/**
 * analytics.js — turns parsed messages into every metric the dashboard shows.
 * One mostly-linear pass builds per-person accumulators; a few small derived
 * loops produce timelines, the relationship graph, streaks and dynamics.
 * Pure & deterministic, so callers can wrap it in useMemo.
 */
import { scoreText } from './sentiment.js'
import { STOPWORDS, normalizeWord } from './stopwords.js'

const SESSION_GAP = 6 * 3600 * 1000 // a >6h silence starts a new "conversation"
const RESPONSE_CAP = 8 * 3600 * 1000 // ignore replies slower than this (overnight)

const EMOJI_RE = /\p{Extended_Pictographic}/gu
const LAUGH_RE = /(\bl+o+l+\b|\bl+m+f?a+o+\b|\bro?fl\b|\bha(?:ha)+h?\b|\bhe(?:he)+\b|😂|🤣|😹)/gi
const LINK_RE = /https?:\/\/\S+/gi

const blankPerson = (name) => ({
  name,
  messages: 0, words: 0, chars: 0, media: 0, emojis: 0, links: 0, questions: 0,
  edited: 0, deleted: 0, laughs: 0,
  hours: new Array(24).fill(0),
  dow: new Array(7).fill(0),
  heatmap: Array.from({ length: 7 }, () => new Array(24).fill(0)),
  monthly: new Map(),
  wordFreq: new Map(),
  emojiFreq: new Map(),
  sentSum: 0, sentTokens: 0, sentMsgs: 0,
  responseTimes: [],
  starts: 0, ends: 0,
  longestMonologue: 0,
  firstTs: null, lastTs: null,
})

const topN = (map, n, { skipStop = false } = {}) =>
  [...map.entries()]
    .filter(([k]) => (skipStop ? !STOPWORDS.has(k) && k.length > 1 && !/^\d+$/.test(k) : true))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ value, count }))

const median = (arr) => {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const ymKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

function gini(values) {
  const v = values.filter((x) => x > 0).sort((a, b) => a - b)
  const n = v.length
  if (n === 0) return 0
  let cum = 0
  for (let i = 0; i < n; i++) cum += (i + 1) * v[i]
  const sum = v.reduce((a, b) => a + b, 0)
  return sum === 0 ? 0 : (2 * cum) / (n * sum) - (n + 1) / n
}

export function computeAnalytics(parsed) {
  const msgs = parsed.messages.filter((m) => m.type !== 'system')
  const people = new Map()
  const ensure = (name) => {
    let p = people.get(name)
    if (!p) people.set(name, (p = blankPerson(name)))
    return p
  }

  // Global accumulators
  const heatmap = Array.from({ length: 7 }, () => new Array(24).fill(0))
  const hours = new Array(24).fill(0)
  const dow = new Array(7).fill(0)
  const monthly = new Map()
  const daily = new Map()
  const globalWords = new Map()
  const globalEmojis = new Map()
  const pairCounts = new Map() // "a|b" (sorted) → interactions, for the graph
  const sentSeries = new Map() // ym → {sum, tokens}

  let totalWords = 0, totalChars = 0, totalEmojis = 0, totalMedia = 0, totalLinks = 0, totalQuestions = 0

  // Conversation/session + response/monologue trackers
  let sessionStartAuthor = null
  let runAuthor = null, runLen = 0
  const gaps = [] // silences between consecutive messages
  const allResponses = [] // every reply gap (seconds), for SLA aggregates
  const respByMonth = new Map() // ym → reply gaps (seconds), for the SLA trend

  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i]
    const p = ensure(m.author)
    const d = m.ts
    const h = d.getHours()
    const wd = d.getDay()
    const ym = ymKey(d)
    const dayKey = `${ym}-${String(d.getDate()).padStart(2, '0')}`

    // Volume
    p.messages++
    heatmap[wd][h]++; hours[h]++; dow[wd]++
    p.hours[h]++; p.dow[wd]++; p.heatmap[wd][h]++
    monthly.set(ym, (monthly.get(ym) || 0) + 1)
    daily.set(dayKey, (daily.get(dayKey) || 0) + 1)
    p.monthly.set(ym, (p.monthly.get(ym) || 0) + 1)
    if (!p.firstTs) p.firstTs = d
    p.lastTs = d

    // Body-derived
    if (m.type === 'media') { p.media++; totalMedia++ }
    if (m.isEdited) p.edited++
    if (m.type === 'deleted') p.deleted++
    if (m.type === 'text') {
      p.words += m.wordCount; p.chars += m.charCount
      totalWords += m.wordCount; totalChars += m.charCount
      if (m.body.includes('?')) { p.questions++; totalQuestions++ }

      const links = m.body.match(LINK_RE)
      if (links) { p.links += links.length; totalLinks += links.length }

      const laughs = m.body.match(LAUGH_RE)
      if (laughs) p.laughs += laughs.length

      // Emoji frequency
      const ems = m.body.match(EMOJI_RE)
      if (ems) {
        p.emojis += ems.length; totalEmojis += ems.length
        for (const e of ems) {
          p.emojiFreq.set(e, (p.emojiFreq.get(e) || 0) + 1)
          globalEmojis.set(e, (globalEmojis.get(e) || 0) + 1)
        }
      }
      // Word frequency (URLs stripped so links don't masquerade as words)
      for (const raw of m.body.replace(LINK_RE, ' ').split(/\s+/)) {
        const w = normalizeWord(raw)
        if (w.length > 1 && w.length <= 18) {
          p.wordFreq.set(w, (p.wordFreq.get(w) || 0) + 1)
          globalWords.set(w, (globalWords.get(w) || 0) + 1)
        }
      }
      // Sentiment
      const s = scoreText(m.body)
      if (s.tokens) {
        p.sentSum += s.score; p.sentTokens += s.tokens; p.sentMsgs++
        const cell = sentSeries.get(ym) || { sum: 0, tokens: 0 }
        cell.sum += s.score; cell.tokens += s.tokens
        sentSeries.set(ym, cell)
      }
    }

    // Dynamics: sessions, starters/enders, responses, graph edges, monologues
    const prev = msgs[i - 1]
    const gap = prev ? d - prev.ts : Infinity
    if (gap > SESSION_GAP) {
      // New conversation. Close the previous one (prev author ended it).
      if (prev) ensure(prev.author).ends++
      p.starts++
      sessionStartAuthor = m.author
      runAuthor = m.author; runLen = 1
    } else {
      if (prev && prev.author !== m.author) {
        // A reply: edge + response time
        const a = prev.author, b = m.author
        const key = a < b ? `${a}|${b}` : `${b}|${a}`
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1)
        if (gap < RESPONSE_CAP) {
          const secs = gap / 1000
          p.responseTimes.push(secs); allResponses.push(secs)
          const bucket = respByMonth.get(ym) || []
          bucket.push(secs); respByMonth.set(ym, bucket)
        }
        runAuthor = m.author; runLen = 1
      } else {
        runLen++
      }
      if (prev) gaps.push({ from: prev.ts, to: d, seconds: gap / 1000, between: [prev.author, m.author] })
    }
    if (runAuthor) {
      const ra = ensure(runAuthor)
      if (runLen > ra.longestMonologue) ra.longestMonologue = runLen
    }
  }
  // Final session's last author ended it.
  if (msgs.length) ensure(msgs[msgs.length - 1].author).ends++

  // ---- Build per-person public objects -------------------------------------
  const total = msgs.length || 1
  const perPerson = [...people.values()].map((p) => ({
    name: p.name,
    messages: p.messages,
    sharePct: (p.messages / total) * 100,
    words: p.words,
    chars: p.chars,
    avgWords: p.messages ? p.words / p.messages : 0,
    media: p.media,
    emojis: p.emojis,
    emojiRate: p.messages ? p.emojis / p.messages : 0,
    links: p.links,
    questions: p.questions,
    edited: p.edited,
    deleted: p.deleted,
    laughs: p.laughs,
    hours: p.hours,
    dow: p.dow,
    heatmap: p.heatmap,
    monthly: p.monthly,
    peakHour: p.hours.indexOf(Math.max(...p.hours)),
    topWords: topN(p.wordFreq, 12, { skipStop: true }),
    topEmojis: topN(p.emojiFreq, 8),
    sentiment: p.sentTokens ? p.sentSum / p.sentTokens : 0,
    medianResponseSec: median(p.responseTimes),
    avgResponseSec: p.responseTimes.length ? p.responseTimes.reduce((a, b) => a + b, 0) / p.responseTimes.length : 0,
    replyCount: p.responseTimes.length,
    starts: p.starts,
    ends: p.ends,
    longestMonologue: p.longestMonologue,
    firstTs: p.firstTs,
    lastTs: p.lastTs,
  })).sort((a, b) => b.messages - a.messages)

  // ---- Timelines -----------------------------------------------------------
  const monthlySeries = [...monthly.entries()].sort().map(([ym, count]) => {
    const [y, mo] = ym.split('-').map(Number)
    return { ym, date: new Date(y, mo - 1, 1), count }
  })
  const dailySeries = [...daily.entries()].sort().map(([day, count]) => {
    const [y, mo, dd] = day.split('-').map(Number)
    return { day, date: new Date(y, mo - 1, dd), count }
  })
  const sentimentSeries = monthlySeries.map(({ ym, date }) => {
    const c = sentSeries.get(ym)
    return { ym, date, value: c && c.tokens ? c.sum / c.tokens : 0 }
  })
  // Monthly median reply time — the "are we getting slower?" SLA trend (Pro).
  // null (not 0) for months with no replies, so the line shows a gap.
  const responseSeries = monthlySeries.map(({ ym, date }) => ({
    ym, date, value: respByMonth.has(ym) ? median(respByMonth.get(ym)) : null,
  }))

  // ---- Streaks & silences --------------------------------------------------
  const activeDays = [...daily.keys()].sort()
  const { longest: longestStreak, current: currentStreak } = streaks(activeDays)
  const longestSilences = [...gaps]
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 5)

  // ---- Relationship graph --------------------------------------------------
  const nameToVal = new Map(perPerson.map((p) => [p.name, p.messages]))
  const nodes = perPerson.map((p) => ({ id: p.name, value: p.messages, sentiment: p.sentiment }))
  const links = [...pairCounts.entries()]
    .map(([key, value]) => {
      const [source, target] = key.split('|')
      return { source, target, value }
    })
    .filter((l) => nameToVal.has(l.source) && nameToVal.has(l.target))

  // ---- Peaks & balance -----------------------------------------------------
  const peakHour = hours.indexOf(Math.max(...hours))
  const peakDow = dow.indexOf(Math.max(...dow))
  let peakDay = null, peakDayCount = 0
  for (const { day, count } of dailySeries) if (count > peakDayCount) { peakDayCount = count; peakDay = day }
  const balanceIndex = Math.round((1 - gini(perPerson.map((p) => p.messages))) * 100)

  // SLA aggregates across all replies (Pro report).
  const sortedResp = [...allResponses].sort((a, b) => a - b)
  const under = (t) => (sortedResp.length ? sortedResp.filter((x) => x <= t).length / sortedResp.length : 0)
  const sla = {
    count: sortedResp.length,
    median: median(sortedResp),
    p90: sortedResp.length ? sortedResp[Math.min(sortedResp.length - 1, Math.floor(sortedResp.length * 0.9))] : 0,
    under15: under(900),
    under60: under(3600),
  }

  const stats = parsed.stats
  const days = stats.dayCount || dailySeries.length || 1

  // Overall group mood: message-weighted mean of per-person sentiment.
  const sentWeight = perPerson.reduce((s, p) => s + p.messages, 0) || 1
  const overallSentiment = perPerson.reduce((s, p) => s + p.sentiment * p.messages, 0) / sentWeight
  // Engagement month-over-month (latest full month vs the previous).
  const lastM = monthlySeries[monthlySeries.length - 1]
  const prevM = monthlySeries[monthlySeries.length - 2]
  const engagementMoM = prevM && prevM.count ? ((lastM.count - prevM.count) / prevM.count) * 100 : 0

  return {
    stats,
    totals: {
      messages: msgs.length,
      words: totalWords,
      chars: totalChars,
      media: totalMedia,
      emojis: totalEmojis,
      links: totalLinks,
      questions: totalQuestions,
      participants: perPerson.length,
      days,
      perDay: msgs.length / days,
      avgWords: msgs.length ? totalWords / msgs.length : 0,
      sentiment: overallSentiment,
      engagementMoM,
      first: stats.firstDate,
      last: stats.lastDate,
    },
    perPerson,
    heatmap,
    hours,
    dow,
    monthlySeries,
    dailySeries,
    sentimentSeries,
    responseSeries,
    streak: { longest: longestStreak, current: currentStreak },
    longestSilences,
    graph: { nodes, links },
    peaks: { hour: peakHour, dow: peakDow, day: peakDay, dayCount: peakDayCount },
    balanceIndex,
    sla,
    topWords: topN(globalWords, 40, { skipStop: true }),
    topEmojis: topN(globalEmojis, 20),
  }
}

/** Longest run of consecutive calendar days present in a sorted key list. */
function streaks(dayKeys) {
  if (!dayKeys.length) return { longest: 0, current: 0 }
  const toNum = (k) => {
    const [y, m, d] = k.split('-').map(Number)
    return Math.floor(new Date(y, m - 1, d).getTime() / 86400000)
  }
  let longest = 1, run = 1
  for (let i = 1; i < dayKeys.length; i++) {
    run = toNum(dayKeys[i]) - toNum(dayKeys[i - 1]) === 1 ? run + 1 : 1
    if (run > longest) longest = run
  }
  // "current" = trailing run length ending on the last active day.
  let current = 1
  for (let i = dayKeys.length - 1; i > 0; i--) {
    if (toNum(dayKeys[i]) - toNum(dayKeys[i - 1]) === 1) current++
    else break
  }
  return { longest, current }
}
