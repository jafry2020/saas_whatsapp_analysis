/**
 * summaryCanvas.js — renders a one-image "report card" PNG of the current
 * results (mode-aware) straight to a <canvas>, mirroring shareCanvas.js's
 * approach: pure 2D drawing, no DOM-rasterising library. That choice isn't
 * cosmetic — html-to-image was tried for the Wrapped share card earlier and
 * hung even on a trivial div in some browsers/offline; canvas painting is
 * deterministic and dependency-free. Deliberately a small, self-contained
 * sibling to shareCanvas.js rather than sharing helpers, so this new feature
 * can't regress the already-hardened Wrapped export.
 */
import { initials, nameColor, fmtDate, duration, compact, comma } from './format.js'
import { moodLabel } from './sentiment.js'

const W = 1200
const H = 675

function readTokens() {
  const s = getComputedStyle(document.documentElement)
  const arr = (n) => s.getPropertyValue(n).trim().split(/\s+/).map(Number)
  const rgb = (n) => { const [r, g, b] = arr(n); return `rgb(${r},${g},${b})` }
  const a = arr('--accent')
  return {
    canvas: rgb('--canvas'), surface: rgb('--surface'), surface2: rgb('--surface-2'),
    line: rgb('--line'), ink: rgb('--ink'), muted: rgb('--muted'), faint: rgb('--faint'),
    accent: rgb('--accent'), accentText: rgb('--accent-text'),
    accentTint: `rgba(${a[0]},${a[1]},${a[2]},0.10)`,
    accentLine: `rgba(${a[0]},${a[1]},${a[2]},0.28)`,
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
function clip(ctx, s, maxW) {
  if (ctx.measureText(s).width <= maxW) return s
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1)
  return s + '…'
}
const spaced = (s) => s.split('').join(' ')

const DISPLAY = '"Clash Display", "Satoshi", system-ui, sans-serif'
const SANS = 'Satoshi, system-ui, sans-serif'

function drawMark(ctx, x, y, s, t) {
  ctx.fillStyle = t.accentTint
  rr(ctx, x, y, s, s, s * 0.28); ctx.fill()
  const bw = s * 0.13, base = y + s * 0.74
  ;[[0.26, 0.3], [0.45, 0.5], [0.64, 0.72]].forEach(([bx, bh], i) => {
    ctx.fillStyle = i === 2 ? t.accent : t.ink
    const h = s * bh
    rr(ctx, x + s * bx, base - h, bw, h, bw / 2); ctx.fill()
  })
}
function drawAvatar(ctx, cx, cy, r, name) {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = nameColor(name); ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = `700 ${r * 0.7}px ${SANS}`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(initials(name), cx, cy + 1)
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'
}

function tile(ctx, t, x, y, w, h, label, value, accent) {
  ctx.fillStyle = t.surface
  rr(ctx, x, y, w, h, 22); ctx.fill()
  ctx.strokeStyle = t.line; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.fillStyle = accent ? t.accentText : t.ink
  ctx.font = `600 40px ${DISPLAY}`
  ctx.fillText(clip(ctx, String(value), w - 36), x + 20, y + h - 48)
  ctx.fillStyle = t.faint
  ctx.font = `600 15px ${SANS}`
  ctx.fillText(spaced(label.toUpperCase()), x + 21, y + 30)
}

/** Build the per-mode tile + highlight content from `analytics`. */
function buildContent(analytics, mode) {
  const friends = mode === 'friends'
  const top = analytics.perPerson[0]
  if (friends) {
    const vibe = moodLabel(analytics.totals.sentiment)
    return {
      badge: 'FRIENDS RECAP',
      tiles: [
        ['MESSAGES', compact(analytics.totals.messages)],
        ['TOP CHATTER', top ? `${top.name} ${top.sharePct.toFixed(0)}%` : '—'],
        ['LONGEST STREAK', `${analytics.streak.longest}d`],
        ['GROUP VIBE', vibe.label],
      ],
      highlightLabel: 'FAVOURITE REACTION',
      highlightValue: analytics.topEmojis[0]?.value || '✨',
      highlightSub: analytics.topEmojis[0] ? `used ${comma(analytics.topEmojis[0].count)} times` : '',
    }
  }
  return {
    badge: 'PRO REPORT',
    tiles: [
      ['MESSAGES', compact(analytics.totals.messages)],
      ['MEDIAN RESPONSE', duration(analytics.sla.median)],
      ['SLA · UNDER 15M', `${Math.round(analytics.sla.under15 * 100)}%`],
      ['BALANCE', `${analytics.balanceIndex}/100`],
    ],
    highlightLabel: 'MOST ACTIVE',
    highlightValue: top?.name || '—',
    highlightSub: top ? `${top.sharePct.toFixed(0)}% of all messages` : '',
  }
}

function paint(analytics, mode) {
  const t = readTokens()
  const content = buildContent(analytics, mode)
  const top = analytics.perPerson[0]
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = t.canvas
  ctx.fillRect(0, 0, W, H)

  const P = 56
  drawMark(ctx, P, P, 40, t)
  ctx.fillStyle = t.ink
  ctx.font = `600 24px ${DISPLAY}`
  ctx.fillText('Subtext', P + 52, P + 28)

  ctx.textAlign = 'right'
  ctx.fillStyle = t.accentText
  ctx.font = `600 15px ${SANS}`
  ctx.fillText(spaced(content.badge), W - P, P + 18)
  ctx.fillStyle = t.faint
  ctx.font = `400 16px ${SANS}`
  ctx.fillText(`${fmtDate(analytics.totals.first)} – ${fmtDate(analytics.totals.last)}`, W - P, P + 44)
  ctx.textAlign = 'left'

  // 4 stat tiles
  const gap = 18, ty = P + 76
  const tw = (W - 2 * P - 3 * gap) / 4, th = 132
  content.tiles.forEach(([label, value], i) => {
    tile(ctx, t, P + i * (tw + gap), ty, tw, th, label, value, i === 1 || i === 3)
  })

  // highlight strip
  const hy = ty + th + gap, hh = 130
  ctx.fillStyle = t.accentTint
  rr(ctx, P, hy, W - 2 * P, hh, 26); ctx.fill()
  ctx.strokeStyle = t.accentLine; ctx.lineWidth = 1.5; ctx.stroke()
  if (mode === 'friends') {
    ctx.textAlign = 'center'
    ctx.font = `400 64px ${SANS}`
    ctx.fillText(content.highlightValue, P + 90, hy + 78)
    ctx.textAlign = 'left'
  } else if (top) {
    drawAvatar(ctx, P + 70, hy + hh / 2, 38, top.name)
  }
  ctx.fillStyle = t.faint
  ctx.font = `600 15px ${SANS}`
  ctx.fillText(spaced(content.highlightLabel), P + 150, hy + 48)
  ctx.fillStyle = t.ink
  ctx.font = `600 34px ${DISPLAY}`
  ctx.fillText(clip(ctx, mode === 'friends' ? content.highlightSub : (top?.name || '—'), 600), P + 150, hy + 88)
  if (mode === 'pro' && top) {
    ctx.fillStyle = t.accentText
    ctx.font = `500 18px ${SANS}`
    ctx.fillText(content.highlightSub, P + 150, hy + 114)
  }

  // mini weekday bars
  const wy = hy + hh + gap, wh = 90
  const dow = analytics.dow
  const max = Math.max(1, ...dow)
  const order = [1, 2, 3, 4, 5, 6, 0]
  const bw = (W - 2 * P - 6 * 10) / 7
  order.forEach((d, i) => {
    const x = P + i * (bw + 10)
    const barH = Math.max(4, (dow[d] / max) * (wh - 20))
    ctx.fillStyle = t.accent
    rr(ctx, x, wy + (wh - 20) - barH, bw, barH, 4); ctx.fill()
  })

  // footer
  ctx.textAlign = 'center'
  ctx.fillStyle = t.faint
  ctx.font = `400 16px ${SANS}`
  ctx.fillText('Generated with Subtext · private by design', W / 2, H - 28)
  ctx.textAlign = 'left'

  return c
}

/** Render the summary and trigger a PNG download. @returns {Promise<boolean>} */
export async function downloadSummaryPNG(analytics, mode, filename = 'subtext-summary.png') {
  if (document.fonts?.ready) { try { await document.fonts.ready } catch { /* ignore */ } }
  const canvas = paint(analytics, mode)
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
