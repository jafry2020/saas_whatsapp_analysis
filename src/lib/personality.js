/**
 * personality.js — assigns every participant a single "archetype" based on
 * which trait they lead the group in, relative to everyone else. Unlike
 * awards.js (which picks one WINNER per category), this guarantees every
 * person gets a card — the point is that everyone in the group has
 * something to screenshot, not just the chattiest one.
 */
import { duration, compact } from './format.js'

// Late-night weighting (midnight–5am heaviest) — mirrors awards.js's private
// nightScore so Night Owl scoring is consistent across the app.
function nightScore(hours) {
  const w = [5, 5, 4, 4, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3]
  return hours.reduce((s, c, h) => s + c * w[h], 0)
}
const norm = (v, max) => (max > 0 ? Math.min(1, v / max) : 0)

/**
 * Each trait: a score fn (0..1, relative to the group max) and a minimum
 * eligibility gate so low-signal people (e.g. 2 messages) don't get a
 * misleading archetype. Order matters as a tie-break — earlier wins ties.
 */
function buildTraits(P) {
  const maxMsg = Math.max(1, ...P.map((p) => p.messages))
  const maxWords = Math.max(1, ...P.map((p) => p.avgWords))
  const maxEmoji = Math.max(1, ...P.map((p) => p.emojiRate))
  const maxLaughRate = Math.max(0.001, ...P.map((p) => (p.messages ? p.laughs / p.messages : 0)))
  const maxStarts = Math.max(1, ...P.map((p) => p.starts))
  const maxQ = Math.max(1, ...P.map((p) => p.questions))
  const maxNight = Math.max(1, ...P.map((p) => nightScore(p.hours)))
  const maxMonologue = Math.max(1, ...P.map((p) => p.longestMonologue))
  const maxLinks = Math.max(1, ...P.map((p) => p.links))
  const repliers = P.filter((p) => p.replyCount > 3)
  const minReply = Math.min(Infinity, ...repliers.map((p) => p.medianResponseSec))
  const maxReply = Math.max(1, ...repliers.map((p) => p.medianResponseSec))

  return [
    {
      id: 'chatty', emoji: '🗣️', title: 'The Main Character',
      tagline: 'Carries the group chat on their back.',
      gate: (p) => p.messages > 3,
      score: (p) => norm(p.messages, maxMsg),
      stat: (p) => `${Math.round(p.sharePct)}% of all messages`,
    },
    {
      id: 'wordy', emoji: '✍️', title: 'The Novelist',
      tagline: 'Never sends a one-word reply when a paragraph will do.',
      gate: (p) => p.messages > 5,
      score: (p) => norm(p.avgWords, maxWords),
      stat: (p) => `${p.avgWords.toFixed(1)} words / message`,
    },
    {
      id: 'emoji', emoji: '🎨', title: 'Emoji Royalty',
      tagline: 'Communicates fluently in emoji.',
      gate: (p) => p.messages > 5 && p.emojis > 0,
      score: (p) => norm(p.emojiRate, maxEmoji),
      stat: (p) => `${p.emojiRate.toFixed(2)} emoji / message`,
    },
    {
      id: 'comedian', emoji: '🤣', title: 'The Comedian',
      tagline: 'Either hilarious, or laughs at their own jokes. Possibly both.',
      gate: (p) => p.laughs > 2,
      score: (p) => norm(p.laughs / Math.max(1, p.messages), maxLaughRate),
      stat: (p) => `${compact(p.laughs)} laughs triggered`,
    },
    {
      id: 'speed', emoji: '⚡', title: 'Speed Demon',
      tagline: 'Types faster than you can hit send.',
      gate: (p) => p.replyCount > 3,
      score: (p) => (maxReply > minReply ? 1 - (p.medianResponseSec - minReply) / (maxReply - minReply) : 0),
      stat: (p) => `replies in ${duration(p.medianResponseSec)}`,
    },
    {
      id: 'ghost', emoji: '👻', title: 'The Ghost',
      tagline: 'Will reply. Eventually. Maybe.',
      gate: (p) => p.replyCount > 3,
      score: (p) => (maxReply > minReply ? (p.medianResponseSec - minReply) / (maxReply - minReply) : 0),
      stat: (p) => `takes ${duration(p.medianResponseSec)} to reply`,
    },
    {
      id: 'starter', emoji: '🚀', title: 'The Igniter',
      tagline: "Breaks every silence so nobody else has to.",
      gate: (p) => p.starts > 0,
      score: (p) => norm(p.starts, maxStarts),
      stat: (p) => `${compact(p.starts)} conversations started`,
    },
    {
      id: 'owl', emoji: '🦉', title: 'The 2am Philosopher',
      tagline: 'The late-night deep talks exist because of this person.',
      gate: (p) => nightScore(p.hours) > 0,
      score: (p) => norm(nightScore(p.hours), maxNight),
      stat: (p) => `most active around ${fmtH(p.peakHour)}`,
    },
    {
      id: 'monologue', emoji: '🎤', title: 'The Monologuer',
      tagline: 'Double, triple, quadruple texting is a lifestyle.',
      gate: (p) => p.longestMonologue > 3,
      score: (p) => norm(p.longestMonologue, maxMonologue),
      stat: (p) => `${p.longestMonologue} messages in a row, once`,
    },
    {
      id: 'interrogator', emoji: '🧐', title: 'The Interrogator',
      tagline: 'So many questions. So few answers.',
      gate: (p) => p.questions > 2,
      score: (p) => norm(p.questions, maxQ),
      stat: (p) => `${compact(p.questions)} questions asked`,
    },
    {
      id: 'linker', emoji: '🔗', title: 'The Link Lord',
      tagline: "The group's personal content algorithm.",
      gate: (p) => p.links > 2,
      score: (p) => norm(p.links, maxLinks),
      stat: (p) => `${compact(p.links)} links shared`,
    },
    {
      id: 'sunshine', emoji: '🌞', title: 'Ray of Sunshine',
      tagline: "Keeps the group's morale afloat, single-handedly.",
      gate: (p) => p.messages > 5 && p.sentiment > 0.04,
      score: (p) => norm(p.sentiment, Math.max(0.01, ...P.map((x) => x.sentiment))),
      stat: () => 'consistently positive energy',
    },
    {
      // Fallback — always eligible, so no one is ever left without a card.
      id: 'regular', emoji: '💬', title: 'The Steady One',
      tagline: 'Quietly present, every single day.',
      gate: () => true,
      score: (p) => norm(p.messages, maxMsg) * 0.15, // low weight — only wins if nothing else fits
      stat: (p) => `${compact(p.messages)} messages, rain or shine`,
    },
  ]
}

const fmtH = (h) => (h == null ? '' : `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`)

/**
 * @param {object} analytics — the full computeAnalytics() result
 * @returns {Array<{name, archetype: {id,emoji,title,tagline}, statLine}>}
 */
export function assignArchetypes(analytics) {
  const P = analytics.perPerson
  if (!P.length) return []
  const traits = buildTraits(P)

  return P.map((p) => {
    let best = null, bestScore = -1
    for (const t of traits) {
      if (!t.gate(p)) continue
      const s = t.score(p)
      if (s > bestScore) { bestScore = s; best = t }
    }
    // buildTraits() always includes the 'regular' fallback (gate always
    // true), so `best` is guaranteed non-null here.
    return {
      name: p.name,
      archetype: { id: best.id, emoji: best.emoji, title: best.title, tagline: best.tagline },
      statLine: best.stat(p),
      sharePct: p.sharePct,
    }
  })
}
