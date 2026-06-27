/**
 * sampleData.js — generates a realistic WhatsApp export string so the product
 * can be previewed with zero upload. It emits real export syntax (Android, 12h,
 * D/M/YYYY) and is fed through the actual parser — nothing is faked downstream.
 *
 * People are given distinct personalities (chattiness, emoji love, night-owl
 * tendency, reply speed, positivity) so the awards, graph and sentiment views
 * all have something meaningful to show.
 */

// Deterministic RNG so the demo looks identical every load.
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PEOPLE = [
  { name: 'Maya', chat: 1.6, emoji: 0.55, night: 0.2, speed: 0.85, pos: 0.75, laugh: 0.5 },
  { name: 'Leo', chat: 1.2, emoji: 0.12, night: 0.85, speed: 0.3, pos: 0.4, laugh: 0.3 },
  { name: 'Priya', chat: 1.0, emoji: 0.85, night: 0.35, speed: 0.95, pos: 0.9, laugh: 0.75 },
  { name: 'Sam', chat: 0.65, emoji: 0.08, night: 0.5, speed: 0.45, pos: 0.5, laugh: 0.2 },
  { name: 'Jordan', chat: 0.5, emoji: 0.35, night: 0.7, speed: 0.4, pos: 0.6, laugh: 0.45 },
]

// Diurnal base curve (per hour 0..23): low overnight, lunch + evening peaks.
const DIURNAL = [3, 2, 1, 1, 1, 1, 2, 4, 7, 9, 10, 11, 13, 11, 9, 9, 10, 13, 16, 18, 17, 14, 10, 6]

const POOLS = {
  opener: ['morning!', 'yo', 'hey hey', 'guys', 'ok so', 'update:', 'quick q', 'anyone up?',
    'wait', 'omg', 'so', 'breaking news'],
  plan: ['dinner at 8?', 'who\'s coming friday', 'movie tonight?', 'lets do brunch sunday',
    'booking the table now', 'i\'ll grab the tickets', 'meet at the usual spot',
    'can someone pick up snacks', 'flat meeting later?', 'rent is due btw'],
  react: ['that\'s wild', 'no wayyy', 'so good', 'i\'m crying', 'this is amazing', 'love it',
    'ok that\'s actually genius', 'wholesome', 'iconic', 'unreal', 'i can\'t', 'stop it'],
  agree: ['agreed', 'yep', 'same', 'fair', 'true', 'makes sense', 'i\'m in', 'count me in',
    'sounds good', 'works for me', 'deal'],
  question: ['what time though?', 'did you see this?', 'is everyone free?', 'how was it?',
    'who\'s driving?', 'should we split it?', 'wait what happened?', 'you ok?',
    'can you send the address?', 'what do you think?'],
  laugh: ['hahaha', 'lmaooo', 'i\'m dead 😂', 'lol stop', 'hahahaha no', 'crying 🤣',
    'lmfao', 'ok that got me'],
  long: ['honestly the whole week has been a lot but i think this weekend will reset everything, i really need it',
    'so the plan is: we leave around 6, grab food on the way, then head straight to the venue. sound good to everyone?',
    'i\'ve been thinking and i actually feel like we should just go for it, life is short and we keep talking ourselves out of stuff',
    'quick recap from the call:\n- budget approved\n- timeline is tight\n- we present friday\nlet me know if i missed anything'],
  link: ['check this https://example.com/thing', 'https://maps.app/loc found the place',
    'tickets here https://example.com/tix', 'https://youtu.be/clip watch till the end'],
  posEmoji: ['😂', '😍', '🔥', '🙌', '✨', '😎', '🥳', '❤️', '👍', '😭'],
  negEmoji: ['😩', '😭', '😬', '🙄', '😤', '💀'],
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)] }

function pickPerson(rng, exclude) {
  const pool = PEOPLE.filter((p) => p.name !== exclude)
  const total = pool.reduce((s, p) => s + p.chat, 0)
  let r = rng() * total
  for (const p of pool) { if ((r -= p.chat) <= 0) return p }
  return pool[0]
}

function pickHour(rng, person) {
  const w = DIURNAL.map((base, h) => {
    const nightBoost = h < 6 || h >= 23 ? person.night * 14 : 0
    return base + nightBoost
  })
  const total = w.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let h = 0; h < 24; h++) { if ((r -= w[h]) <= 0) return h }
  return 20
}

function composeBody(rng, person, intent) {
  let body
  switch (intent) {
    case 'long': body = pick(rng, POOLS.long); break
    case 'link': body = pick(rng, POOLS.link); break
    case 'question': body = pick(rng, POOLS.question); break
    case 'laugh': body = pick(rng, POOLS.laugh); break
    case 'plan': body = pick(rng, POOLS.plan); break
    case 'react': body = pick(rng, POOLS.react); break
    case 'agree': body = pick(rng, POOLS.agree); break
    default: body = pick(rng, POOLS.opener)
  }
  // Sprinkle emoji by personality.
  if (rng() < person.emoji && intent !== 'laugh') {
    const e = rng() < person.pos ? pick(rng, POOLS.posEmoji) : pick(rng, POOLS.negEmoji)
    body += ' ' + e
  }
  return body
}

function fmt(d, name, body) {
  const D = d.getDate(), M = d.getMonth() + 1, Y = d.getFullYear()
  let h = d.getHours()
  const ap = h < 12 ? 'AM' : 'PM'
  h = ((h + 11) % 12) + 1
  const mm = String(d.getMinutes()).padStart(2, '0')
  const head = `${D}/${M}/${Y}, ${h}:${mm} ${ap} - `
  return name ? `${head}${name}: ${body}` : `${head}${body}`
}

/**
 * @param {number} target approximate number of user messages to generate
 * @returns {string} a raw WhatsApp export
 */
export function generateSampleChat(target = 1500) {
  const rng = mulberry32(20240901)
  const start = new Date(2024, 8, 1, 10, 2) // 1 Sep 2024
  const days = 300
  const lines = []

  // System preamble.
  lines.push(fmt(start, null, 'Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Tap to learn more.'))
  lines.push(fmt(start, null, 'Maya created group "Roomies 🏠"'))
  lines.push(fmt(new Date(start.getTime() + 60000), null, 'Maya added Leo, Priya, Sam and Jordan'))

  let produced = 0
  const perDay = target / days

  for (let day = 0; day < days && produced < target; day++) {
    const date = new Date(start.getTime() + day * 86400000)
    const weekend = date.getDay() === 0 || date.getDay() === 6
    const dayIntensity = perDay * (weekend ? 1.5 : 0.85) * (0.5 + rng())
    let sessions = Math.max(0, Math.round(dayIntensity / 6))

    for (let s = 0; s < sessions && produced < target; s++) {
      const opener = pickPerson(rng, null)
      const hour = pickHour(rng, opener)
      const cursor = new Date(date)
      cursor.setHours(hour, Math.floor(rng() * 60), Math.floor(rng() * 60))

      let speaker = opener
      const turns = 3 + Math.floor(rng() * 12)
      for (let t = 0; t < turns && produced < target; t++) {
        // Advance time by speaker's reply speed (fast repliers = small gaps).
        const gapSec = Math.round((1 - speaker.speed) * 600 + rng() * 240 + 8)
        cursor.setTime(cursor.getTime() + gapSec * 1000)

        const roll = rng()
        let body, name = speaker.name
        if (roll < 0.05) { body = '<Media omitted>' }
        else if (roll < 0.07) { body = 'This message was deleted' }
        else {
          let intent = 'opener'
          if (t === 0) intent = rng() < 0.5 ? 'opener' : 'plan'
          else {
            const r = rng()
            intent = r < 0.16 ? 'react' : r < 0.32 ? 'agree' : r < 0.46 ? 'question'
              : r < 0.46 + speaker.laugh * 0.3 ? 'laugh' : r < 0.78 ? 'plan'
              : r < 0.88 ? 'link' : r < 0.95 ? 'opener' : 'long'
          }
          body = composeBody(rng, speaker, intent)
          if (rng() < 0.02) body += ' <This message was edited>'
        }
        lines.push(fmt(cursor, name, body))
        produced++

        // Occasional system event.
        if (rng() < 0.004) {
          lines.push(fmt(new Date(cursor.getTime() + 30000), null,
            pick(rng, ['Sam changed the group description', 'Priya pinned a message',
              'Jordan changed this group\'s icon', 'Leo changed the subject to "Roomies 🏠✨"'])))
        }

        // Next speaker: usually someone else (a reply), sometimes double-text.
        speaker = rng() < 0.2 ? speaker : pickPerson(rng, speaker.name)
      }
    }
  }

  return lines.join('\n')
}

/** Larger preset to demonstrate 50k-scale performance. */
export const generateLargeSample = () => generateSampleChat(12000)
