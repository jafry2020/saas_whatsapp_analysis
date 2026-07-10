/**
 * personalityCanvas.js — paints ONE person's personality card straight to a
 * <canvas> and downloads it as a PNG. Same rationale as shareCanvas.js and
 * summaryCanvas.js: pure 2D drawing, no DOM-rasterising library (one hung on
 * a trivial div earlier in this project — canvas painting is the hardened
 * pattern here). Deliberately a small self-contained sibling rather than a
 * shared module, so a change to one export can't regress another.
 */
import { initials, nameColor } from './format.js'

const W = 1000
const H = 1250

function readTokens() {
  const s = getComputedStyle(document.documentElement)
  const arr = (n) => s.getPropertyValue(n).trim().split(/\s+/).map(Number)
  const rgb = (n) => { const [r, g, b] = arr(n); return `rgb(${r},${g},${b})` }
  return {
    canvas: rgb('--canvas'), surface: rgb('--surface'),
    ink: rgb('--ink'), muted: rgb('--muted'), faint: rgb('--faint'),
  }
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const DISPLAY = '"Clash Display", "Satoshi", system-ui, sans-serif'
const SANS = 'Satoshi, system-ui, sans-serif'

function paint(person) {
  const t = readTokens()
  const tint = nameColor(person.name) // hsl(...)
  const tintSoft = tint.replace(/\)$/, ' / 0.22)')
  const tintFaint = tint.replace(/\)$/, ' / 0.08)')

  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')
  ctx.textBaseline = 'alphabetic'

  // Background — tinted toward the person's own colour so every card in a
  // group looks like a distinct trading-card, not a template.
  ctx.fillStyle = t.canvas
  ctx.fillRect(0, 0, W, H)
  const grd = ctx.createRadialGradient(W / 2, 160, 0, W / 2, 160, W * 0.75)
  grd.addColorStop(0, tintSoft)
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, W, H)

  const P = 70
  // Header
  ctx.textAlign = 'left'
  ctx.fillStyle = t.faint
  ctx.font = `600 22px ${SANS}`
  ctx.fillText('S U B T E X T   W R A P P E D', P, P + 10)

  // Big emoji medallion
  ctx.beginPath(); ctx.arc(W / 2, 320, 130, 0, Math.PI * 2)
  ctx.fillStyle = tintFaint; ctx.fill()
  ctx.beginPath(); ctx.arc(W / 2, 320, 130, 0, Math.PI * 2)
  ctx.strokeStyle = tint; ctx.lineWidth = 3; ctx.stroke()
  ctx.textAlign = 'center'
  ctx.font = `400 148px ${SANS}`
  ctx.fillText(person.archetype.emoji, W / 2, 372)

  // Archetype title
  ctx.font = `600 74px ${DISPLAY}`
  ctx.fillStyle = t.ink
  wrapCentered(ctx, person.archetype.title, W / 2, 540, W - P * 2, 78)

  // Tagline
  ctx.font = `400 32px ${SANS}`
  ctx.fillStyle = t.muted
  wrapCentered(ctx, person.archetype.tagline, W / 2, 630, W - P * 2 - 60, 42)

  // Name pill
  const nameY = 760
  ctx.font = `600 40px ${DISPLAY}`
  const nameW = ctx.measureText(person.name).width + 80
  rr(ctx, W / 2 - nameW / 2, nameY - 54, nameW, 76, 38)
  ctx.fillStyle = tintSoft; ctx.fill()
  ctx.strokeStyle = tint; ctx.lineWidth = 2; ctx.stroke()
  ctx.fillStyle = t.ink
  ctx.fillText(person.name, W / 2, nameY)

  // Stat line
  ctx.font = `500 30px ${SANS}`
  ctx.fillStyle = t.muted
  ctx.fillText(person.statLine, W / 2, nameY + 70)

  // Footer
  ctx.font = `400 24px ${SANS}`
  ctx.fillStyle = t.faint
  ctx.fillText('made with Subtext · private by design', W / 2, H - 60)
  ctx.textAlign = 'left'

  return c
}

function wrapCentered(ctx, text, cx, startY, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = '', y = startY
  const lines = []
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w }
    else line = test
  }
  if (line) lines.push(line)
  // vertically balance a 1-2 line block around startY
  const offset = ((lines.length - 1) * lineHeight) / 2
  lines.forEach((l, i) => ctx.fillText(l, cx, y - offset + i * lineHeight))
}

/** Render one person's card and trigger a PNG download. */
export async function downloadPersonalityCard(person, filename) {
  if (document.fonts?.ready) { try { await document.fonts.ready } catch { /* ignore */ } }
  const canvas = paint(person)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(false)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `subtext-${person.name.toLowerCase().replace(/\s+/g, '-')}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      resolve(true)
    }, 'image/png')
  })
}
