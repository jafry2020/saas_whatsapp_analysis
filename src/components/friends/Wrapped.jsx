import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Download, Share2, Sparkles } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { computeAwards } from '../../lib/awards.js'
import { downloadShareCard } from '../../lib/shareCanvas.js'
import { Avatar, Button } from '../ui/primitives.jsx'
import { ShareCard } from './ShareCard.jsx'
import { CountUp } from './CountUp.jsx'
import { comma, compact, fmtDate, fmtHour } from '../../lib/format.js'

/** Full-screen, swipeable "Wrapped" story. Tap/drag/keys to move; the last
 *  card exports to PNG for sharing. */
export function Wrapped() {
  const { wrappedOpen, closeWrapped, analytics } = useApp()
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const [busy, setBusy] = useState(false)

  const awards = useMemo(() => computeAwards(analytics), [analytics])
  const top = analytics.perPerson[0]
  const share = useMemo(() => ({
    messages: analytics.totals.messages, days: analytics.totals.days,
    topPerson: top, topEmoji: analytics.topEmojis[0],
    streak: analytics.streak.longest, balance: analytics.balanceIndex, awards,
    range: `${fmtDate(analytics.totals.first)} – ${fmtDate(analytics.totals.last)}`,
  }), [analytics, awards, top])

  const slides = useMemo(() => buildSlides(analytics, awards), [analytics, awards])
  const n = slides.length + 1 // + share card

  useEffect(() => { if (wrappedOpen) setI(0) }, [wrappedOpen])
  useEffect(() => {
    if (!wrappedOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeWrapped()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // eslint-disable-line

  function go(d) {
    setDir(d)
    setI((x) => Math.max(0, Math.min(n - 1, x + d)))
  }

  async function downloadPNG() {
    setBusy(true)
    try {
      await downloadShareCard(share, 'subtext-wrapped.png')
    } catch (e) {
      console.warn('Share export failed', e)
    } finally { setBusy(false) }
  }

  if (!wrappedOpen) return null
  const isShare = i === slides.length
  // Per-slide accent shift across Friends' 3 accent tokens — a quiet sense
  // of momentum as you move through the story, off on the share slide
  // (which has its own deliberate composition).
  const ACCENT_VARS = ['--accent', '--accent-2', '--accent-3']
  const tintVar = isShare ? null : ACCENT_VARS[i % ACCENT_VARS.length]

  return (
    <div className="fixed inset-0 z-[90] grain" style={{ background: 'rgb(var(--canvas))' }}>
      {tintVar && (
        <div className="absolute inset-0 transition-[background] duration-700 pointer-events-none"
          style={{ background: `radial-gradient(circle at 30% 18%, rgb(var(${tintVar}) / 0.16) 0%, transparent 60%)` }} />
      )}
      {/* progress segments */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-1.5 p-3">
        {Array.from({ length: n }).map((_, s) => (
          <div key={s} className="h-1.5 flex-1 rounded-full overflow-hidden glass-pop">
            <div className="h-full bg-accent transition-all duration-300" style={{ width: s < i ? '100%' : s === i ? '100%' : '0%' }} />
          </div>
        ))}
      </div>

      <button onClick={closeWrapped}
        className="absolute top-5 right-4 z-30 grid place-items-center h-9 w-9 rounded-full glass-pop text-ink hover:brightness-95 transition">
        <X size={18} />
      </button>

      {/* tap zones (not on the share slide, so its buttons stay clickable) */}
      {!isShare && (
        <>
          <button className="absolute inset-y-0 left-0 w-1/3 z-20" aria-label="Previous" onClick={() => go(-1)} />
          <button className="absolute inset-y-0 right-0 w-2/3 z-20" aria-label="Next" onClick={() => go(1)} />
        </>
      )}

      <div className="absolute inset-0 grid place-items-center px-6 overflow-hidden">
        <motion.div key={i}
          initial={{ x: dir > 0 ? 80 : -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.38, ease: [0.2, 0.7, 0.2, 1] }}
          className="w-full max-w-md text-center"
        >
            {isShare ? (
              <div className="flex flex-col items-center">
                <ShareCard data={share} />
                <div className="flex gap-2 mt-5 z-30 relative">
                  <Button variant="primary" size="lg" onClick={downloadPNG} disabled={busy}>
                    <Download size={17} /> {busy ? 'Rendering…' : 'Download PNG'}
                  </Button>
                  <Button variant="secondary" size="lg" onClick={downloadPNG}><Share2 size={17} /> Share</Button>
                </div>
              </div>
            ) : slides[i].node}
        </motion.div>
      </div>

      {/* bottom controls */}
      <div className="absolute bottom-5 left-0 right-0 z-30 flex items-center justify-center gap-4">
        <button onClick={() => go(-1)} disabled={i === 0}
          className="grid place-items-center h-10 w-10 rounded-full glass-pop text-ink disabled:opacity-30 hover:brightness-95 transition">
          <ChevronLeft size={18} />
        </button>
        <span className="text-xs text-muted tnum w-12 text-center glass-pop rounded-full py-1">{i + 1} / {n}</span>
        <button onClick={() => go(1)} disabled={i === n - 1}
          className="grid place-items-center h-10 w-10 rounded-full glass-pop text-ink disabled:opacity-30 hover:brightness-95 transition">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

/* ---- Slide builders ------------------------------------------------------ */
function Big({ children, className = '' }) {
  return <div className={`font-display font-semibold tracking-tightest text-ink leading-[0.95] ${className}`}>{children}</div>
}
function Kicker({ children }) {
  return <div className="eyebrow text-accent-text mb-5">{children}</div>
}

function buildSlides(a, awards) {
  const top = a.perPerson[0]
  const topWord = a.topWords[0]
  const topEmoji = a.topEmojis[0]
  const owl = awards.find((x) => x.id === 'owl')

  const slides = []

  slides.push({
    node: (
      <div>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
          <Sparkles className="mx-auto text-accent-text mb-6" size={40} />
        </motion.div>
        <Kicker>{fmtDate(a.totals.first)} – {fmtDate(a.totals.last)}</Kicker>
        <Big className="text-5xl sm:text-6xl">Your group chat,<br />wrapped.</Big>
        <p className="text-muted mt-6">Tap to relive the year →</p>
      </div>
    ),
  })

  slides.push({
    node: (
      <div>
        <Kicker>You sent</Kicker>
        <Big className="text-[5.5rem] sm:text-[7rem] text-accent-text tnum">
          <CountUp value={a.totals.messages} format={compact} />
        </Big>
        <Big className="text-4xl sm:text-5xl mt-1">messages.</Big>
        <p className="text-muted mt-6">That's about <b className="text-ink tnum">{a.totals.perDay.toFixed(0)}</b> every single day.</p>
      </div>
    ),
  })

  if (top) slides.push({
    node: (
      <div className="flex flex-col items-center">
        <Kicker>Your chat MVP</Kicker>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Avatar name={top.name} size={120} />
        </motion.div>
        <Big className="text-5xl sm:text-6xl mt-6">{top.name}</Big>
        <p className="text-muted mt-4 max-w-xs">carried <b className="text-accent-text tnum"><CountUp value={top.sharePct} format={(n) => `${Math.round(n)}%`} /></b> of every message sent. Someone give them a medal. 🏅</p>
      </div>
    ),
  })

  slides.push({
    node: (
      <div>
        <Kicker>Between you, that's</Kicker>
        <Big className="text-6xl sm:text-7xl text-accent-text tnum">
          <CountUp value={a.totals.words} format={compact} />
        </Big>
        <Big className="text-3xl sm:text-4xl mt-2">words typed.</Big>
        {topWord && <p className="text-muted mt-6">The word you couldn't stop saying? <span className="chip-accent text-base">{topWord.value}</span></p>}
      </div>
    ),
  })

  if (topEmoji) slides.push({
    node: (
      <div>
        <Kicker>Your love language</Kicker>
        <motion.div initial={{ scale: 0.4, rotate: -10, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 12 }} className="text-[7rem] leading-none my-4">
          {topEmoji.value}
        </motion.div>
        <Big className="text-3xl sm:text-4xl">used <span className="text-accent-text tnum"><CountUp value={topEmoji.count} format={comma} /></span> times</Big>
      </div>
    ),
  })

  slides.push({
    node: (
      <div>
        <Kicker>The chat never sleeps</Kicker>
        <Big className="text-5xl sm:text-6xl">Peak hour was<br /><span className="text-accent-text">{fmtHour(a.peaks.hour)}</span></Big>
        {owl && <p className="text-muted mt-6">{owl.winner} is your designated night owl 🦉</p>}
      </div>
    ),
  })

  slides.push({
    node: (
      <div>
        <Kicker>Dedication level</Kicker>
        <Big className="text-[6rem] sm:text-[8rem] text-accent-text tnum">
          <CountUp value={a.streak.longest} format={(n) => Math.round(n)} />
        </Big>
        <Big className="text-3xl sm:text-4xl">days in a row.</Big>
        <p className="text-muted mt-6">Not a single day of silence. Impressive. Or concerning.</p>
      </div>
    ),
  })

  if (awards.length) slides.push({
    node: (
      <div>
        <Kicker>And the awards go to…</Kicker>
        <div className="space-y-3 mt-2">
          {awards.slice(0, 4).map((aw, k) => (
            <motion.div key={aw.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: k * 0.1 }}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left">
              <span className="text-3xl">{aw.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="eyebrow">{aw.title}</div>
                <div className="font-display text-lg text-ink">{aw.winner}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  })

  return slides
}
