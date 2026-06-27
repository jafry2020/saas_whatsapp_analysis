/**
 * awards.js — Friends-mode superlatives derived from analytics.
 * Each award scans `perPerson` for an argmax/argmin and returns a tidy card.
 */
import { duration, compact } from './format.js'

const by = (arr, fn, dir = 1) =>
  arr.reduce((best, p) => (best == null || (fn(p) - fn(best)) * dir > 0 ? p : best), null)

export function computeAwards(a) {
  const P = a.perPerson
  if (!P.length) return []
  const multi = P.length > 1
  const out = []
  const push = (cond, card) => { if (cond) out.push(card) }

  const yapper = by(P, (p) => p.messages)
  push(yapper, {
    id: 'yapper', emoji: '🗣️', title: 'The Yapper',
    winner: yapper.name, stat: `${compact(yapper.messages)} messages`,
    blurb: `Carried ${Math.round(yapper.sharePct)}% of the entire chat.`,
  })

  const wordsmith = by(P.filter((p) => p.messages > 5), (p) => p.avgWords)
  push(wordsmith, {
    id: 'wordsmith', emoji: '✍️', title: 'The Wordsmith',
    winner: wordsmith?.name, stat: `${(wordsmith?.avgWords || 0).toFixed(1)} words / msg`,
    blurb: 'Never sends a one-word reply when a paragraph will do.',
  })

  const emojiKing = by(P.filter((p) => p.messages > 5), (p) => p.emojiRate)
  push(emojiKing && emojiKing.emojis > 0, {
    id: 'emoji', emoji: emojiKing?.topEmojis?.[0]?.value || '😎', title: 'Emoji Royalty',
    winner: emojiKing?.name, stat: `${(emojiKing?.emojiRate || 0).toFixed(2)} per msg`,
    blurb: `Favourite weapon: ${emojiKing?.topEmojis?.[0]?.value || '✨'}`,
  })

  const comedian = by(P, (p) => p.laughs)
  push(comedian && comedian.laughs > 0, {
    id: 'comedian', emoji: '🤣', title: 'The Comedian',
    winner: comedian?.name, stat: `${compact(comedian?.laughs || 0)} laughs`,
    blurb: 'Either hilarious or laughs at their own jokes. Possibly both.',
  })

  const fastest = by(P.filter((p) => p.replyCount > 3 && p.medianResponseSec > 0), (p) => p.medianResponseSec, -1)
  push(multi && fastest, {
    id: 'speed', emoji: '⚡', title: 'Speed Demon',
    winner: fastest?.name, stat: `replies in ${duration(fastest?.medianResponseSec)}`,
    blurb: 'Types faster than you can hit send.',
  })

  const ghost = by(P.filter((p) => p.replyCount > 3), (p) => p.medianResponseSec)
  push(multi && ghost && ghost.name !== fastest?.name, {
    id: 'ghost', emoji: '👻', title: 'The Ghoster',
    winner: ghost?.name, stat: `takes ${duration(ghost?.medianResponseSec)}`,
    blurb: 'Will reply. Eventually. Maybe.',
  })

  const starter = by(P, (p) => p.starts)
  push(starter && starter.starts > 0, {
    id: 'starter', emoji: '🚀', title: 'Conversation Starter',
    winner: starter?.name, stat: `${compact(starter?.starts || 0)} cold opens`,
    blurb: 'Breaks every silence so you don\'t have to.',
  })

  const owl = by(P, (p) => nightScore(p.hours))
  push(owl && nightScore(owl.hours) > 0, {
    id: 'owl', emoji: '🦉', title: 'Night Owl',
    winner: owl?.name, stat: `peaks at ${fmtH(owl?.peakHour)}`,
    blurb: 'The 2am philosophy sessions are sponsored by this person.',
  })

  const positive = by(P.filter((p) => p.messages > 5), (p) => p.sentiment)
  push(positive, {
    id: 'sunshine', emoji: '🌞', title: 'Ray of Sunshine',
    winner: positive?.name, stat: 'most positive vibes',
    blurb: 'Single-handedly keeps the group\'s morale above water.',
  })

  const monologue = by(P, (p) => p.longestMonologue)
  push(monologue && monologue.longestMonologue > 3, {
    id: 'monologue', emoji: '🎤', title: 'The Monologuer',
    winner: monologue?.name, stat: `${monologue?.longestMonologue} in a row`,
    blurb: 'Double, triple, quadruple texting is a lifestyle.',
  })

  const linker = by(P, (p) => p.links)
  push(linker && linker.links > 2, {
    id: 'links', emoji: '🔗', title: 'The Link Lord',
    winner: linker?.name, stat: `${compact(linker?.links || 0)} links shared`,
    blurb: 'Group\'s personal content algorithm.',
  })

  const questioner = by(P, (p) => p.questions)
  push(questioner && questioner.questions > 2, {
    id: 'questions', emoji: '🧐', title: 'The Interrogator',
    winner: questioner?.name, stat: `${compact(questioner?.questions || 0)} questions`,
    blurb: 'So many questions. So few answers.',
  })

  return out
}

// Late-night weighting (midnight–5am heaviest).
function nightScore(hours) {
  const w = [5, 5, 4, 4, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3]
  return hours.reduce((s, c, h) => s + c * w[h], 0)
}
const fmtH = (h) => (h == null ? '' : `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`)
