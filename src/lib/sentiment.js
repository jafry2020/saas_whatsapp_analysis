/**
 * sentiment.js — lightweight lexicon sentiment. No API, no model download.
 * A compact AFINN-flavoured word list (valence -5..+5) plus emoji valence,
 * with negation flipping and intensifier scaling. Good enough to surface
 * relative mood trends per person and over time — never billed as clinical.
 */

// Word → valence. Trimmed to the vocabulary that actually shows up in chats.
const LEX = {
  // strong positive
  amazing: 4, awesome: 4, love: 3, loved: 3, fantastic: 4, perfect: 3, excellent: 4,
  wonderful: 4, brilliant: 4, incredible: 4, best: 3, congrats: 3, congratulations: 3,
  thrilled: 4, ecstatic: 5, delighted: 3, grateful: 3, blessed: 3, proud: 3,
  // positive
  good: 2, great: 3, nice: 2, happy: 3, glad: 2, fun: 2, cool: 2, thanks: 2, thank: 2,
  thankyou: 2, yay: 3, hooray: 3, win: 2, won: 2, winning: 2, success: 2, beautiful: 3,
  sweet: 2, cute: 2, lovely: 3, enjoy: 2, enjoyed: 2, excited: 3, exciting: 3, hope: 1,
  hopeful: 2, like: 1, likes: 1, liked: 1, agree: 1, support: 2, yes: 1, sure: 1,
  haha: 2, lol: 2, lmao: 2, lmfao: 2, rofl: 2, hehe: 1, congrat: 3, gg: 2, dope: 2,
  fire: 2, lit: 2, goat: 2, clutch: 2, blessing: 3, peace: 2, safe: 1, calm: 1,
  // mild positive
  okay: 1, ok: 1, fine: 1, alright: 1, decent: 1, better: 1, improve: 1, improved: 1,
  // negative
  bad: -2, sad: -3, hate: -3, hated: -3, angry: -3, mad: -2, annoyed: -2, annoying: -2,
  upset: -3, worried: -2, worry: -2, anxious: -2, scared: -2, afraid: -2, fear: -2,
  hurt: -2, pain: -2, painful: -3, tired: -1, exhausted: -2, sick: -2, ill: -2,
  bored: -1, boring: -2, lonely: -3, alone: -1, cry: -2, crying: -2, cried: -2,
  sorry: -1, apologise: -1, apologize: -1, fail: -2, failed: -2, failure: -3,
  lose: -2, lost: -2, losing: -2, problem: -2, problems: -2, issue: -1, issues: -1,
  wrong: -2, terrible: -4, horrible: -4, awful: -4, worst: -4, ugly: -2, stupid: -3,
  dumb: -2, idiot: -3, hell: -2, damn: -1, ugh: -2, meh: -1, nope: -1, no: -1,
  cant: -1, never: -1, nothing: -1, broke: -2, broken: -2, disappointed: -3,
  disappointing: -3, frustrated: -3, frustrating: -3, stress: -2, stressed: -2,
  hard: -1, difficult: -1, miss: -1, missing: -1, regret: -2, guilty: -2, ashamed: -2,
  // strong negative
  furious: -4, devastated: -5, miserable: -4, hopeless: -4, depressed: -4, suicidal: -5,
  disgusting: -4, pathetic: -3, betrayed: -4, heartbroken: -4,
}

// Emoji → valence (covers the workhorses of group chats).
const EMOJI_LEX = {
  '😀': 2, '😃': 2, '😄': 3, '😁': 2, '😆': 2, '😊': 3, '🙂': 1, '😉': 1, '😍': 4,
  '🥰': 4, '😘': 3, '😗': 2, '🤗': 3, '🤩': 4, '😎': 2, '🥳': 4, '😇': 2, '👍': 2,
  '👏': 2, '🙌': 3, '💪': 2, '🔥': 2, '✨': 2, '🎉': 4, '❤️': 4, '🧡': 3, '💛': 3,
  '💚': 3, '💙': 3, '💜': 3, '💖': 4, '💕': 3, '😂': 3, '🤣': 3, '😹': 3, '🥲': 0,
  '😭': -1, '😢': -2, '😞': -3, '😔': -3, '😟': -2, '😕': -1, '🙁': -2, '☹️': -2,
  '😣': -2, '😖': -2, '😫': -2, '😩': -2, '😤': -2, '😠': -3, '😡': -4, '🤬': -4,
  '😨': -2, '😰': -2, '😱': -3, '😴': 0, '🤮': -3, '🤢': -3, '💀': -1, '👎': -2,
  '💔': -4, '😒': -2, '🙄': -2, '😬': -1, '😅': 1, '🤔': 0, '😐': 0, '😑': -1,
}

const NEGATORS = new Set(['not', 'no', 'never', 'cant', 'cannot', 'wont', 'dont', "don't",
  'isnt', 'arent', 'aint', 'neither', 'nor', 'without', 'hardly'])
const INTENSIFIERS = { very: 1.5, really: 1.5, so: 1.4, super: 1.6, extremely: 1.8,
  totally: 1.4, absolutely: 1.7, incredibly: 1.7, freaking: 1.6, damn: 1.4, 'kinda': 0.6,
  slightly: 0.5, somewhat: 0.6 }

const WORD_SPLIT = /[^\p{L}']+/u

/**
 * Score a single message body.
 * @returns {{score:number, comparative:number, tokens:number}}
 *   score = summed valence; comparative = score / tokens (−1..+1-ish).
 */
export function scoreText(text) {
  if (!text) return { score: 0, comparative: 0, tokens: 0 }
  const words = text.toLowerCase().split(WORD_SPLIT).filter(Boolean)
  let score = 0
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    let v = LEX[w]
    if (v === undefined) continue
    // Look back up to 2 tokens for negation / intensification.
    const p1 = words[i - 1]
    const p2 = words[i - 2]
    if (NEGATORS.has(p1) || NEGATORS.has(p2)) v = -v * 0.85
    if (INTENSIFIERS[p1]) v *= INTENSIFIERS[p1]
    score += v
  }
  // Emoji valence (independent of word tokenisation).
  const emojis = text.match(/\p{Extended_Pictographic}/gu) || []
  for (const e of emojis) {
    const base = e.replace(/️/g, '')
    if (EMOJI_LEX[e] !== undefined) score += EMOJI_LEX[e]
    else if (EMOJI_LEX[base] !== undefined) score += EMOJI_LEX[base]
  }
  const tokens = words.length + emojis.length
  return { score, comparative: tokens ? score / tokens : 0, tokens }
}

/** Bucket a comparative score into a label for badges. */
export function moodLabel(comparative) {
  if (comparative > 0.18) return { label: 'Very positive', tone: 'positive' }
  if (comparative > 0.04) return { label: 'Positive', tone: 'positive' }
  if (comparative < -0.18) return { label: 'Very negative', tone: 'negative' }
  if (comparative < -0.04) return { label: 'Negative', tone: 'negative' }
  return { label: 'Neutral', tone: 'muted' }
}
