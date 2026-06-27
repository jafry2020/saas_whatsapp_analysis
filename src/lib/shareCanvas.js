/**
 * shareCanvas.js — renders the shareable "Wrapped" poster straight to a
 * <canvas> and exports a PNG. Deliberately avoids DOM-rasterising libraries
 * (html-to-image et al.) whose foreignObject→Image step is unreliable across
 * browsers and offline. This is pure 2D drawing: deterministic, crisp at any
 * scale, and dependency-free.
 */
import { initials, nameColor } from './format.js'

const W = 1080
const H = 1920

function readTokens() {
  const s = getComputedStyle(document.documentElement)
  const arr = (n) => s.getPropertyValue(n).trim().split(/\s+/).map(Number)
  const rgb = (n) => { const [r, g, b] = arr(n); return `rgb(${r},${g},${b})` }
  const a = arr('--accent')
  return {
    canvas: rgb('--canvas'), surface: rgb('--surface'), surface2: rgb('--surface-2'),
    line: rgb('--line'), ink: rgb('--ink'), muted: rgb('--muted'), faint: rgb('--faint'),
    accent: rgb('--accent'), accentText: rgb('--accent-text'), onAccent: rgb('--on-accent'),
    accentTint: `rgba(${a[0]},${a[1]},${a[2]},0.10)`,
    accentLine: `rgba(${a[0]},${a[1]},${a[2]},0.30)`,
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

/** Draw the whole poster onto a freshly created canvas and return it. */
function paint(data) {
  const t = readTokens()
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')
  ctx.textBaseline = 'alphabetic'

  // Background
  ctx.fillStyle = t.canvas
  ctx.fillRect(0, 0, W, H)
  // Accent glow top-right
  const grd = ctx.createRadialGradient(W - 80, 120, 0, W - 80, 120, 520)
  grd.addColorStop(0, t.accentTint)
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, W, H)

  const P = 84
  // --- Logo mark (bars in a bubble) + WRAPPED label ---
  drawMark(ctx, P, P, 64, t)
  ctx.fillStyle = t.faint
  ctx.font = `600 26px ${SANS}`
  ctx.textAlign = 'right'
  ctx.fillText('W R A P P E D', W - P, P + 42)
  ctx.textAlign = 'left'

  // --- Headline ---
  ctx.fillStyle = t.ink
  ctx.font = `600 104px ${DISPLAY}`
  ctx.fillText('Our group chat,', P, 380)
  ctx.fillStyle = t.accentText
  ctx.fillText('by the numbers.', P, 500)

  // --- Range ---
  ctx.fillStyle = t.muted
  ctx.font = `400 34px ${SANS}`
  ctx.fillText(data.range, P, 566)

  // --- Stat tiles (2x2) ---
  const gap = 28
  const tw = (W - 2 * P - gap) / 2
  const th = 196
  const tiles = [
    { label: 'MESSAGES', value: data.messages, big: true },
    { label: 'ACTIVE DAYS', value: data.days },
    { label: 'LONGEST STREAK', value: `${data.streak}d` },
    { label: 'BALANCE', value: `${data.balance}/100` },
  ]
  let ty = 640
  tiles.forEach((tile, i) => {
    const x = P + (i % 2) * (tw + gap)
    const y = ty + Math.floor(i / 2) * (th + gap)
    ctx.fillStyle = t.surface
    rr(ctx, x, y, tw, th, 36); ctx.fill()
    ctx.strokeStyle = t.line; ctx.lineWidth = 2; ctx.stroke()
    ctx.fillStyle = t.ink
    ctx.font = `600 ${tile.big ? 88 : 72}px ${DISPLAY}`
    ctx.fillText(String(tile.value), x + 40, y + (tile.big ? 118 : 110))
    ctx.fillStyle = t.faint
    ctx.font = `600 24px ${SANS}`
    ctx.fillText(spaced(tile.label), x + 42, y + th - 36)
  })

  // --- MVP strip ---
  const my = ty + 2 * th + gap + 36
  const mh = 200
  ctx.fillStyle = t.accentTint
  rr(ctx, P, my, W - 2 * P, mh, 40); ctx.fill()
  ctx.strokeStyle = t.accentLine; ctx.lineWidth = 2; ctx.stroke()
  if (data.topPerson) {
    drawAvatar(ctx, P + 50, my + mh / 2, 56, data.topPerson.name)
    ctx.fillStyle = t.faint
    ctx.font = `600 24px ${SANS}`
    ctx.fillText('CHAT MVP', P + 170, my + 70)
    ctx.fillStyle = t.ink
    ctx.font = `600 60px ${DISPLAY}`
    ctx.fillText(clip(ctx, data.topPerson.name, 480), P + 170, my + 130)
    ctx.fillStyle = t.accentText
    ctx.font = `500 30px ${SANS}`
    ctx.fillText(`${data.topPerson.sharePct.toFixed(0)}% of all messages`, P + 170, my + 172)
  }
  if (data.topEmoji) {
    ctx.textAlign = 'center'
    ctx.font = `400 92px ${SANS}`
    ctx.fillText(data.topEmoji.value, W - P - 90, my + 118)
    ctx.fillStyle = t.faint
    ctx.font = `500 26px ${SANS}`
    ctx.fillText(`${shortNum(data.topEmoji.count)}×`, W - P - 90, my + 162)
    ctx.textAlign = 'left'
  }

  // --- Award rows ---
  let ay = my + mh + 44
  const awH = 96
  data.awards.slice(0, 3).forEach((aw) => {
    ctx.fillStyle = t.surface2
    rr(ctx, P, ay, W - 2 * P, awH, 28); ctx.fill()
    ctx.textAlign = 'left'
    ctx.font = `400 52px ${SANS}`
    ctx.fillText(aw.emoji, P + 36, ay + 64)
    ctx.fillStyle = t.faint
    ctx.font = `600 26px ${SANS}`
    ctx.fillText(spaced(aw.title.toUpperCase()), P + 120, ay + 60)
    ctx.fillStyle = t.ink
    ctx.font = `600 40px ${DISPLAY}`
    ctx.textAlign = 'right'
    ctx.fillText(clip(ctx, aw.winner || '', 340), W - P - 36, ay + 62)
    ctx.textAlign = 'left'
    ay += awH + 22
  })

  // --- Footer ---
  ctx.textAlign = 'center'
  ctx.fillStyle = t.faint
  ctx.font = `400 30px ${SANS}`
  ctx.fillText('made with Subtext · private by design', W / 2, H - 90)
  ctx.textAlign = 'left'

  return c
}

/* drawing helpers ---------------------------------------------------------- */
function drawMark(ctx, x, y, s, t) {
  // bubble
  ctx.fillStyle = t.accentTint
  rr(ctx, x, y, s, s, s * 0.28); ctx.fill()
  // bars
  const bw = s * 0.13
  const base = y + s * 0.74
  const bars = [[0.26, 0.3], [0.45, 0.5], [0.64, 0.72]]
  bars.forEach(([bx, bh], i) => {
    ctx.fillStyle = i === 2 ? t.accent : t.ink
    const h = s * bh
    rr(ctx, x + s * bx, base - h, bw, h, bw / 2); ctx.fill()
  })
}

function drawAvatar(ctx, cx, cy, r, name) {
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath()
  ctx.fillStyle = nameColor(name); ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = `700 ${r * 0.74}px ${SANS}`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(initials(name), cx, cy + 2)
  ctx.restore()
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'
}

const spaced = (s) => s.split('').join(' ')
const shortNum = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n))
function clip(ctx, s, maxW) {
  if (ctx.measureText(s).width <= maxW) return s
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1)
  return s + '…'
}

/**
 * Render the poster and trigger a PNG download.
 * @returns {Promise<boolean>} true on success.
 */
export async function downloadShareCard(data, filename = 'subtext-wrapped.png') {
  // Make sure the display/text fonts are ready so the canvas uses them.
  if (document.fonts?.ready) { try { await document.fonts.ready } catch { /* ignore */ } }
  const canvas = paint(data)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(false)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      resolve(true)
    }, 'image/png')
  })
}
