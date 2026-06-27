import { useEffect, useRef, useState, useMemo } from 'react'
import {
  forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide, forceX, forceY,
} from 'd3-force'
import { Maximize2, Hand } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { nameColor, initials } from '../../lib/format.js'

/**
 * The relationship graph — a from-scratch d3-force simulation rendered to a
 * canvas so every pixel is ours. Nodes are people (sized by message volume),
 * edges are interaction strength. Hover highlights a neighbourhood, click
 * filters the whole dashboard, and you can drag nodes, pan and zoom.
 */
export function Graph() {
  const { analytics, focus, toggleFocus, theme, mode } = useApp()
  const pro = mode === 'pro'
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const simRef = useRef(null)
  const stateRef = useRef({ nodes: [], links: [], transform: { k: 1, x: 0, y: 0 }, hover: null, drag: null, size: { w: 0, h: 0 } })
  const [hoverInfo, setHoverInfo] = useState(null)

  // Stable copies for the simulation (d3 mutates these).
  const data = useMemo(() => ({
    nodes: analytics.graph.nodes.map((n) => ({ ...n })),
    links: analytics.graph.links.map((l) => ({ ...l })),
  }), [analytics])

  // Read live theme tokens for canvas painting; refresh on theme/mode change.
  const tokens = useThemeTokens([theme, mode])

  // Build / rebuild the simulation when the dataset changes.
  useEffect(() => {
    const st = stateRef.current
    st.nodes = data.nodes
    st.links = data.links
    const maxV = Math.max(1, ...st.nodes.map((n) => n.value))
    st.radius = (v) => 8 + 26 * Math.sqrt(v / maxV)
    const maxE = Math.max(1, ...st.links.map((l) => l.value))
    st.edgeW = (v) => 0.6 + 5 * (v / maxE)

    const sim = forceSimulation(st.nodes)
      .force('charge', forceManyBody().strength(-260))
      .force('link', forceLink(st.links).id((d) => d.id).distance((l) => 60 + 120 * (1 - l.value / maxE)).strength(0.4))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide((d) => st.radius(d.value) + 6))
      .force('x', forceX(0).strength(0.04))
      .force('y', forceY(0).strength(0.04))
      .alpha(1).alphaDecay(0.028)

    sim.on('tick', draw)
    simRef.current = sim
    return () => sim.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // Keep canvas sized to its container (retina-aware).
  useEffect(() => {
    const wrap = wrapRef.current
    const ro = new ResizeObserver(() => {
      const r = wrap.getBoundingClientRect()
      const st = stateRef.current
      const first = st.size.w === 0
      st.size = { w: r.width, h: r.height }
      const c = canvasRef.current
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.width = r.width * dpr; c.height = r.height * dpr
      c.style.width = r.width + 'px'; c.style.height = r.height + 'px'
      st.dpr = dpr
      if (first) st.transform = { k: 1, x: r.width / 2, y: r.height / 2 }
      draw()
    })
    ro.observe(wrap)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redraw when hover/focus/theme change (no simulation tick needed).
  useEffect(() => { draw() })

  const neighbors = useMemo(() => {
    const map = new Map()
    for (const l of data.links) {
      const s = id(l.source), t = id(l.target)
      ;(map.get(s) || map.set(s, new Set()).get(s)).add(t)
      ;(map.get(t) || map.set(t, new Set()).get(t)).add(s)
    }
    return map
  }, [data])

  function draw() {
    const st = stateRef.current
    const c = canvasRef.current
    if (!c || !st.nodes.length) return
    const ctx = c.getContext('2d')
    const { k, x, y } = st.transform
    const dpr = st.dpr || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, st.size.w, st.size.h)
    ctx.setTransform(k * dpr, 0, 0, k * dpr, x * dpr, y * dpr)

    const active = st.hover || focus
    const activeSet = active ? (neighbors.get(active) || new Set()) : null

    // Edges — Pro stays thin/restrained (one accent, neutral elsewhere);
    // Friends keeps fuller-bodied, more energetic lines.
    const edgeScale = pro ? 0.65 : 1
    for (const l of st.links) {
      const s = l.source, t = l.target
      const on = active ? (id(s) === active || id(t) === active) : true
      ctx.strokeStyle = on ? rgba(tokens.accent, pro ? 0.55 : 0.45) : rgba(tokens.line, 0.5)
      ctx.lineWidth = (on ? st.edgeW(l.value) : st.edgeW(l.value) * 0.6) * edgeScale / k
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); ctx.stroke()
    }

    // Nodes — soft radial sheen + a thin rim-light catch top-left, so they
    // read as lit spheres rather than flat widget discs. Pro keeps people
    // near-monochrome (identity lives in the label, not a rainbow of hues)
    // and reserves color for whichever node is actually focused; Friends
    // keeps the full per-person hue map, the louder/more playful register.
    for (const n of st.nodes) {
      const r = st.radius(n.value)
      const isActive = active === n.id
      const dim = active && !isActive && !(activeSet && activeSet.has(n.id))
      ctx.globalAlpha = dim ? 0.28 : 1

      // halo for the focused/hovered node
      if (isActive) {
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 7 / k, 0, Math.PI * 2)
        ctx.fillStyle = rgba(tokens.accent, 0.18); ctx.fill()
      }

      const useAccent = pro && isActive
      const hi = useAccent ? rgba(tokens.accent, 1) : pro ? lighten(tokens.accent3, 0.3) : nameColor(n.id, 75, 70)
      const lo = useAccent ? rgba(tokens.accent, 0.8) : pro ? rgba(tokens.accent3, 0.9) : nameColor(n.id, 68, 50)

      const grad = ctx.createRadialGradient(n.x - r * 0.35, n.y - r * 0.4, r * 0.1, n.x, n.y, r)
      grad.addColorStop(0, hi)
      grad.addColorStop(1, lo)
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = grad; ctx.fill()

      // rim-light: a thin bright arc catching the upper-left edge
      ctx.beginPath(); ctx.arc(n.x, n.y, r - 0.75 / k, Math.PI * 1.05, Math.PI * 1.65)
      ctx.lineWidth = 1.5 / k
      ctx.strokeStyle = rgba(tokens.surface, dim ? 0.25 : 0.55)
      ctx.stroke()

      // separation ring (keeps overlapping nodes from muddying together)
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.lineWidth = 2 / k; ctx.strokeStyle = rgba(tokens.surface, 1); ctx.stroke()

      // label inside / below depending on size
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      if (r > 16) {
        ctx.globalAlpha = dim ? 0.5 : 1
        ctx.fillStyle = pro && !useAccent ? rgba(tokens.ink, 0.85) : '#fff'
        ctx.font = `600 ${Math.max(9, r * 0.6) / 1}px Satoshi, system-ui`
        ctx.fillText(initials(n.id), n.x, n.y)
      }
      if (r > 12 || isActive || !active) {
        ctx.globalAlpha = dim ? 0.4 : 0.9
        ctx.fillStyle = rgba(tokens.ink, 1)
        ctx.font = `600 ${12 / k}px Satoshi, system-ui`
        ctx.fillText(n.id, n.x, n.y + r + 11 / k)
      }
      ctx.globalAlpha = 1
    }
  }

  // ---- Interaction ---------------------------------------------------------
  function toWorld(e) {
    const st = stateRef.current
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top
    return { x: (sx - st.transform.x) / st.transform.k, y: (sy - st.transform.y) / st.transform.k, sx, sy }
  }
  function pick(wx, wy) {
    const st = stateRef.current
    for (let i = st.nodes.length - 1; i >= 0; i--) {
      const n = st.nodes[i]
      if (Math.hypot(n.x - wx, n.y - wy) <= st.radius(n.value) + 3) return n
    }
    return null
  }
  function onMove(e) {
    const st = stateRef.current
    const p = toWorld(e)
    if (st.drag) {
      st.drag.fx = p.x; st.drag.fy = p.y; st.drag.node.fx = p.x; st.drag.node.fy = p.y
      simRef.current?.alphaTarget(0.2).restart()
      return
    }
    if (st.panning) {
      st.transform.x = st.panStart.tx + (e.clientX - st.panStart.x)
      st.transform.y = st.panStart.ty + (e.clientY - st.panStart.y)
      draw(); return
    }
    const n = pick(p.x, p.y)
    st.hover = n ? n.id : null
    canvasRef.current.style.cursor = n ? 'pointer' : 'grab'
    setHoverInfo(n ? { name: n.id, value: n.value, x: p.sx, y: p.sy } : null)
    draw()
  }
  function onDown(e) {
    const st = stateRef.current
    const p = toWorld(e)
    const n = pick(p.x, p.y)
    if (n) {
      st.drag = { node: n }; n.fx = n.x; n.fy = n.y
      canvasRef.current.style.cursor = 'grabbing'
    } else {
      st.panning = true
      st.panStart = { x: e.clientX, y: e.clientY, tx: st.transform.x, ty: st.transform.y }
      st.moved = false
      canvasRef.current.style.cursor = 'grabbing'
    }
  }
  function onUp(e) {
    const st = stateRef.current
    if (st.drag) {
      const n = st.drag.node; n.fx = null; n.fy = null
      simRef.current?.alphaTarget(0)
      st.drag = null
    } else if (st.panning) {
      const moved = Math.hypot(e.clientX - st.panStart.x, e.clientY - st.panStart.y)
      st.panning = false
      if (moved < 4) {
        const p = toWorld(e); const n = pick(p.x, p.y)
        if (!n && focus) toggleFocus(focus) // click empty space clears filter
      }
    } else {
      const p = toWorld(e); const n = pick(p.x, p.y)
      if (n) toggleFocus(n.id)
    }
    canvasRef.current.style.cursor = 'grab'
  }
  function onWheel(e) {
    e.preventDefault()
    const st = stateRef.current
    const p = toWorld(e)
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    const k2 = Math.max(0.3, Math.min(3.5, st.transform.k * factor))
    // zoom around cursor
    st.transform.x = p.sx - p.x * k2
    st.transform.y = p.sy - p.y * k2
    st.transform.k = k2
    draw()
  }
  function reset() {
    const st = stateRef.current
    st.transform = { k: 1, x: st.size.w / 2, y: st.size.h / 2 }
    simRef.current?.alpha(0.6).restart()
    draw()
  }

  return (
    <div className="relative">
      <div ref={wrapRef} className="relative h-[440px] md:h-[520px] rounded-[var(--radius)] overflow-hidden bg-surface-2/40 bg-dots">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none"
          onPointerMove={onMove}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerLeave={() => { const st = stateRef.current; st.hover = null; st.panning = false; st.drag = null; setHoverInfo(null); draw() }}
          onWheel={onWheel}
        />
        {hoverInfo && (
          <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[140%] glass-pop px-3 py-2"
            style={{ left: hoverInfo.x, top: hoverInfo.y }}>
            <div className="text-sm font-semibold text-ink">{hoverInfo.name}</div>
            <div className="text-xs text-muted tnum">{hoverInfo.value.toLocaleString()} messages</div>
          </div>
        )}

        <div className="absolute top-3 left-3 glass-pop rounded-full px-2.5 py-1 text-[11px] text-muted inline-flex items-center gap-1.5">
          <Hand size={12} /> drag · scroll to zoom · click to filter
        </div>
        <button onClick={reset}
          className="absolute top-3 right-3 grid place-items-center h-8 w-8 glass-pop text-muted hover:text-ink transition">
          <Maximize2 size={14} />
        </button>
        {focus && (
          <div className="absolute bottom-3 left-3 glass-pop rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ color: 'rgb(var(--accent-text))' }}>
            Filtering: {focus} · click empty space to clear
          </div>
        )}
      </div>
    </div>
  )
}

/* helpers ------------------------------------------------------------------ */
const id = (v) => (typeof v === 'object' ? v.id : v)
const rgba = (t, a = 1) => `rgba(${t[0]},${t[1]},${t[2]},${a})`
/** Mixes an [r,g,b] token toward white by `amt` (0-1) — used for the Pro
 *  monochrome node sheen, since there's no per-person hue to lighten there. */
const lighten = (t, amt) => rgba(t.map((c) => c + (255 - c) * amt))

function useThemeTokens(deps) {
  const [tokens, setTokens] = useState(() => readTokens())
  useEffect(() => { setTokens(readTokens()) }, deps) // eslint-disable-line
  return tokens
}
function readTokens() {
  if (typeof window === 'undefined') return {}
  const s = getComputedStyle(document.documentElement)
  const t = (n) => s.getPropertyValue(n).trim().split(/\s+/).map(Number)
  return {
    ink: t('--ink'), surface: t('--surface'), line: t('--line'), accent: t('--accent'),
    muted: t('--muted'), accent2: t('--accent-2'), accent3: t('--accent-3'),
  }
}
