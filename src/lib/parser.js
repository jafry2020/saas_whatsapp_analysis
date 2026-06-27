/**
 * parser.js — WhatsApp chat export parser
 * ----------------------------------------------------------------------------
 * Turns a raw `.txt` WhatsApp export into structured messages, 100% in the
 * browser. Nothing here touches the network.
 *
 * It copes with the real-world mess of exports:
 *   • Android  →  `12/03/2021, 9:41 PM - Alice: hi`   (also 24h, no seconds)
 *   • iOS      →  `[12/03/2021, 9:41:05 PM] Alice: hi` (bracketed, seconds)
 *   • Date orders: D/M/Y, M/D/Y, Y-M-D, 2- or 4-digit years, / . - separators
 *   • 12h (AM/PM, incl. narrow no-break space) and 24h clocks
 *   • Multi-line messages (continuation lines have no date header)
 *   • System notices, deleted & edited messages, media-omitted placeholders
 *   • Invisible LTR/RTL marks (‎ …) that iOS sprinkles everywhere
 *
 * The day/month ambiguity (the eternal 03/04 problem) is resolved by scanning
 * the whole file: if any first field exceeds 12 it must be the day, etc. The
 * detected format is reported back so the UI can show it.
 */

// Invisible bidi / BOM marks WhatsApp injects — strip before anything else.
const STRIP_MARKS = /[‎‏‪-‮⁦-⁩﻿]/g
// Exotic spaces (narrow no-break, NBSP …) normalised to a plain space.
const ODD_SPACES = /[   ⁠​]/g

/**
 * One regex to rule both platforms. Capture groups:
 *  1,2,3 = date fields   4 = hour   5 = min   6 = sec(optional)
 *  7 = am/pm(optional)   8 = the rest of the line (author + body, or system)
 */
const HEADER = new RegExp(
  '^\\[?\\s*' + // optional iOS opening bracket
  '(\\d{1,4})[./-](\\d{1,2})[./-](\\d{1,4}),?\\s+' + // date
  '(\\d{1,2}):(\\d{2})(?::(\\d{2}))?' + // time h:m(:s)
  '\\s*([AaPp][Mm])?' + // optional meridiem
  '\\]?\\s*' + // optional iOS closing bracket
  '(?:-\\s+)?' + // optional Android " - " divider
  '(.*)$'
)

// Placeholder bodies ---------------------------------------------------------
const DELETED = /^(this message was deleted\.?|you deleted this message\.?)$/i
const EDITED = /\s*<this message was edited>\s*$/i
const MEDIA_OMITTED = /^<media omitted>$/i
const MEDIA_TYPED = /^(image|photo|video|audio|voice message|gif|sticker|document|contact card) omitted$/i
const MEDIA_ATTACHED = /^<attached:\s*(.+)>$/i

const EXT_KIND = {
  jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', heic: 'image',
  mp4: 'video', mov: 'video', '3gp': 'video',
  opus: 'audio', m4a: 'audio', mp3: 'audio', ogg: 'audio', aac: 'audio',
  pdf: 'document', doc: 'document', docx: 'document', xlsx: 'document', txt: 'document',
  webp_sticker: 'sticker', vcf: 'contact card', gif: 'gif',
}

function kindFromFile(name) {
  const ext = (name.split('.').pop() || '').toLowerCase()
  return EXT_KIND[ext] || 'document'
}

/** Classify a raw body string into a message kind + cleaned content. */
function classifyBody(raw) {
  let body = raw
  let isEdited = false
  if (EDITED.test(body)) {
    isEdited = true
    body = body.replace(EDITED, '')
  }
  if (DELETED.test(body.trim())) {
    return { type: 'deleted', body: body.trim(), isEdited, mediaKind: null }
  }
  if (MEDIA_OMITTED.test(body.trim())) {
    return { type: 'media', body: '', isEdited, mediaKind: 'media' }
  }
  const typed = body.trim().match(MEDIA_TYPED)
  if (typed) {
    return { type: 'media', body: '', isEdited, mediaKind: typed[1].toLowerCase() }
  }
  const attached = body.trim().match(MEDIA_ATTACHED)
  if (attached) {
    return { type: 'media', body: '', isEdited, mediaKind: kindFromFile(attached[1]) }
  }
  return { type: 'text', body, isEdited, mediaKind: null }
}

// Words & emoji --------------------------------------------------------------
// Broad emoji range incl. supplementary symbols, dingbats, ZWJ sequences.
export const EMOJI_RE =
  /(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)/gu

function countWords(text) {
  const t = text.trim()
  if (!t) return 0
  return t.split(/\s+/).filter(Boolean).length
}

/**
 * Core line walker. Accepts an array of already-split lines and an emit window
 * so it can run synchronously or be sliced across animation frames.
 * Returns intermediate records carrying raw date parts (finalised later once
 * the day/month order is known).
 */
function walk(lines) {
  const records = []
  let dashHits = 0
  let bracketHits = 0
  let current = null

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].replace(STRIP_MARKS, '').replace(ODD_SPACES, ' ')
    if (rawLine === '' && !current) continue

    const m = HEADER.exec(rawLine)
    if (!m) {
      // Continuation of the previous message (multi-line body).
      if (current) current.raw += '\n' + lines[i].replace(STRIP_MARKS, '')
      // else: stray pre-amble line before first header — ignored as malformed.
      else records.malformed = (records.malformed || 0) + 1
      continue
    }

    // Flush the previous message before starting a new one.
    if (current) records.push(current)

    const [, a, b, c, hh, mm, ss, ap, rest] = m
    if (rawLine.startsWith('[')) bracketHits++
    else dashHits++

    // Split "Author: body" — but only treat as authored if the name segment is
    // sane (short, single line). Otherwise it's a system notice (group events,
    // encryption notices, "Missed call", …).
    let author = null
    let bodyRaw = rest
    const colon = rest.indexOf(': ')
    if (colon > -1 && colon <= 60) {
      const name = rest.slice(0, colon)
      if (name.length && !name.includes('\n')) {
        author = name.trim()
        bodyRaw = rest.slice(colon + 2)
      }
    }

    current = {
      a: +a, b: +b, c: +c,
      hh: +hh, mm: +mm, ss: ss ? +ss : 0,
      ap: ap ? ap.toLowerCase() : null,
      author,
      raw: bodyRaw,
    }
  }
  if (current) records.push(current)
  return { records, dashHits, bracketHits, malformed: records.malformed || 0 }
}

/**
 * Decide whether dates are day-first (D/M/Y) or month-first (M/D/Y) by looking
 * for any unambiguous evidence across the whole conversation.
 */
function detectDayFirst(records) {
  let dayFirst = null
  for (const r of records) {
    // 4-digit leading field ⇒ ISO (Y-M-D); doesn't inform D vs M order.
    if (String(r.a).length === 4) continue
    if (r.a > 12) { dayFirst = true; break }
    if (r.b > 12) { dayFirst = false; break }
  }
  return dayFirst === null ? true : dayFirst // sensible international default
}

/** Build a real Date from raw parts given the resolved field order. */
function toDate(r, dayFirst) {
  let year, month, day
  if (String(r.a).length === 4) {
    // ISO-ish: YYYY-MM-DD
    year = r.a; month = r.b; day = r.c
  } else {
    year = r.c
    if (year < 100) year += 2000
    if (dayFirst) { day = r.a; month = r.b }
    else { month = r.a; day = r.b }
  }
  let hour = r.hh
  if (r.ap) {
    if (r.ap === 'pm' && hour < 12) hour += 12
    if (r.ap === 'am' && hour === 12) hour = 0
  }
  return new Date(year, month - 1, day, hour, r.mm, r.ss)
}

/** Finalise raw records into the public message shape. */
function finalise(parsed) {
  const { records, dashHits, bracketHits } = parsed
  const dayFirst = detectDayFirst(records)

  const messages = []
  const participants = new Set()
  let media = 0, deleted = 0, edited = 0, system = 0

  for (let i = 0; i < records.length; i++) {
    const r = records[i]
    const ts = toDate(r, dayFirst)
    if (isNaN(ts.getTime())) { parsed.malformed++; continue }

    if (r.author === null) {
      messages.push({ id: i, ts, author: null, body: r.raw.trim(), type: 'system',
        isEdited: false, mediaKind: null, wordCount: 0, charCount: 0 })
      system++
      continue
    }

    const cls = classifyBody(r.raw)
    if (cls.isEdited) edited++
    if (cls.type === 'media') media++
    if (cls.type === 'deleted') deleted++
    participants.add(r.author)

    messages.push({
      id: i,
      ts,
      author: r.author,
      body: cls.body,
      type: cls.type,
      isEdited: cls.isEdited,
      mediaKind: cls.mediaKind,
      wordCount: cls.type === 'text' ? countWords(cls.body) : 0,
      charCount: cls.type === 'text' ? cls.body.length : 0,
    })
  }

  const platform = bracketHits > dashHits ? 'iOS' : dashHits > 0 ? 'Android' : 'unknown'
  const dated = messages.filter((m) => m.ts)
  const first = dated.length ? dated[0].ts : null
  const last = dated.length ? dated[dated.length - 1].ts : null
  const dayCount = first && last ? Math.max(1, Math.round((last - first) / 86400000) + 1) : 0

  return {
    messages,
    participants: [...participants],
    stats: {
      totalMessages: messages.length,
      userMessages: messages.length - system,
      systemMessages: system,
      mediaMessages: media,
      deletedMessages: deleted,
      editedMessages: edited,
      malformed: parsed.malformed,
      participants: participants.size,
      dateFormat: String(records[0]?.a).length === 4 ? 'YYYY-MM-DD'
        : dayFirst ? 'DD/MM/YYYY' : 'MM/DD/YYYY',
      platform,
      firstDate: first,
      lastDate: last,
      dayCount,
    },
  }
}

/** Synchronous parse — used for sample data and tests. */
export function parseChat(text) {
  const clean = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
  return finalise(walk(clean.split('\n')))
}

/**
 * Async, chunked parse for large files. Yields to the event loop between
 * batches so the UI can paint a progress bar (handles 50k+ lines smoothly).
 * @param {string} text
 * @param {(fraction:number)=>void} [onProgress]
 */
export async function parseChatAsync(text, onProgress) {
  const clean = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
  const lines = clean.split('\n')
  const CHUNK = 4000

  // Walk in chunks, carrying the open multi-line message across boundaries.
  const records = []
  let dashHits = 0, bracketHits = 0, malformed = 0, current = null

  for (let start = 0; start < lines.length; start += CHUNK) {
    const slice = lines.slice(start, start + CHUNK)
    for (let i = 0; i < slice.length; i++) {
      const rawLine = slice[i].replace(STRIP_MARKS, '').replace(ODD_SPACES, ' ')
      if (rawLine === '' && !current) continue
      const m = HEADER.exec(rawLine)
      if (!m) {
        if (current) current.raw += '\n' + slice[i].replace(STRIP_MARKS, '')
        else malformed++
        continue
      }
      if (current) records.push(current)
      const [, a, b, c, hh, mm, ss, ap, rest] = m
      rawLine.startsWith('[') ? bracketHits++ : dashHits++
      let author = null, bodyRaw = rest
      const colon = rest.indexOf(': ')
      if (colon > -1 && colon <= 60) {
        const name = rest.slice(0, colon)
        if (name.length && !name.includes('\n')) { author = name.trim(); bodyRaw = rest.slice(colon + 2) }
      }
      current = { a: +a, b: +b, c: +c, hh: +hh, mm: +mm, ss: ss ? +ss : 0,
        ap: ap ? ap.toLowerCase() : null, author, raw: bodyRaw }
    }
    if (onProgress) onProgress(Math.min(0.98, (start + CHUNK) / lines.length))
    // Yield so the browser can paint.
    await new Promise((r) => setTimeout(r, 0))
  }
  if (current) records.push(current)

  const result = finalise({ records, dashHits, bracketHits, malformed })
  if (onProgress) onProgress(1)
  return result
}
