/**
 * quiz.js — picks messages for "Guess who said it," the group activity that
 * turns Subtext from something you look AT into something you play together.
 * Selection favors mid-length, text-only messages (not "ok", not a wall of
 * text) and spreads picks across participants so it's not just guessing the
 * chattiest person over and over.
 */
const MIN_WORDS = 3
const MAX_WORDS = 24
const MAX_PER_AUTHOR = 2

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * @param {Array} messages parsed.messages (raw — system/media rows are
 *   filtered internally)
 * @param {number} n desired question count
 * @returns {Array<{body, author, ts}>} — empty if there isn't enough
 *   suitable material (too few candidates or only one real participant)
 */
export function buildQuiz(messages, n = 8) {
  const candidates = messages.filter(
    (m) => m.type === 'text' && m.author && m.wordCount >= MIN_WORDS && m.wordCount <= MAX_WORDS,
  )
  const authors = new Set(candidates.map((m) => m.author))
  if (authors.size < 2 || candidates.length < n) return []

  const shuffled = shuffle(candidates)
  const picked = []
  const perAuthor = new Map()

  for (const m of shuffled) {
    if (picked.length >= n) break
    const c = perAuthor.get(m.author) || 0
    if (c >= MAX_PER_AUTHOR) continue
    perAuthor.set(m.author, c + 1)
    picked.push(m)
  }
  // Small/lopsided chats might not fill up under the per-author cap —
  // top up from the remaining shuffled pool regardless of the cap.
  if (picked.length < n) {
    for (const m of shuffled) {
      if (picked.length >= n) break
      if (!picked.includes(m)) picked.push(m)
    }
  }

  return shuffle(picked).map((m) => ({ body: m.body, author: m.author, ts: m.ts }))
}
