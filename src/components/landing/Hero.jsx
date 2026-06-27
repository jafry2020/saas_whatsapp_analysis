import { motion } from 'framer-motion'
import { ShieldCheck, ArrowDown, Trophy, Timer, Zap } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Uploader } from '../upload/Uploader.jsx'
import { ExportHelp } from '../upload/ExportHelp.jsx'
import { ModeToggle } from '../common/ModeToggle.jsx'
import { Avatar } from '../ui/primitives.jsx'

const COPY = {
  friends: {
    eyebrow: 'Spotify Wrapped — for your group chat',
    title: ['Your group chat,', 'finally explained.'],
    sub: 'See who really carries the conversation, your funniest moments, late-night philosophers and the superlatives nobody asked for. Made to be screenshotted.',
  },
  pro: {
    eyebrow: 'Conversation analytics, privacy-first',
    title: ['Turn conversations', 'into clarity.'],
    sub: 'Understand the chats that run your business — response-time SLAs, engagement trends, sentiment and participation balance. Exportable in a click.',
  },
}

export function Hero() {
  const { mode } = useApp()
  const c = COPY[mode]
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] opacity-60" />
      <div className="absolute -top-40 -right-32 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent)), transparent 60%)' }} />

      <div className="relative mx-auto max-w-[1400px] px-4 md:px-6 pt-10 md:pt-16 pb-16 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
        {/* Left — message */}
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="chip-accent w-fit mb-5">{c.eyebrow}</motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display text-ink leading-[0.98] text-[2.6rem] sm:text-6xl">
            {c.title[0]}<br />
            <span className="text-gradient">{c.title[1]}</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-5 text-base md:text-lg text-muted max-w-xl">{c.sub}</motion.p>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-7">
            <Uploader compact />
          </motion.div>

          <div className="mt-5 flex items-center gap-4">
            <div className="md:hidden"><ModeToggle size="sm" /></div>
            <ExportHelp />
          </div>
        </div>

        {/* Right — product visual */}
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.2, 0.7, 0.2, 1] }}>
          <HeroVisual mode={mode} />
        </motion.div>
      </div>

      <div className="relative flex justify-center pb-6 text-faint">
        <ArrowDown size={18} className="animate-float" />
      </div>
    </section>
  )
}

/* A faux product surface — static but believable, themed via tokens. */
function HeroVisual({ mode }) {
  const bars = [38, 52, 44, 70, 58, 84, 62, 96, 72, 60, 88, 54, 76, 48, 66, 40]
  const max = Math.max(...bars)
  return (
    <div className="relative">
      {/* floating accents */}
      <motion.div className="absolute -left-5 top-10 z-20 glass-pop px-3.5 py-2.5 flex items-center gap-2.5"
        animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
        {mode === 'friends'
          ? <><span className="grid place-items-center h-8 w-8 rounded-lg bg-accent/15 text-accent-text"><Trophy size={16} /></span>
              <div><div className="text-[10px] eyebrow">The Yapper</div><div className="text-sm font-semibold text-ink">Maya · 28%</div></div></>
          : <><span className="grid place-items-center h-8 w-8 rounded-lg bg-accent/15 text-accent-text"><Timer size={16} /></span>
              <div><div className="text-[10px] eyebrow">Median reply</div><div className="text-sm font-semibold text-ink tnum">3m 12s</div></div></>}
      </motion.div>

      <motion.div className="absolute -right-3 bottom-16 z-20 glass-pop px-3.5 py-2.5 flex items-center gap-2.5"
        animate={{ y: [0, 12, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}>
        <span className="grid place-items-center h-8 w-8 rounded-lg bg-accent text-on-accent"><Zap size={16} /></span>
        <div><div className="text-[10px] eyebrow">Balance</div><div className="text-sm font-semibold text-ink tnum">84 / 100</div></div>
      </motion.div>

      <div className="card shadow-pop p-5 grain">
        <div className="flex items-center gap-1.5 mb-4">
          <span className="h-3 w-3 rounded-full bg-line" /><span className="h-3 w-3 rounded-full bg-line" /><span className="h-3 w-3 rounded-full bg-line" />
          <span className="ml-2 text-[11px] text-faint font-mono">roomies-chat.txt</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[['Messages', '14,212'], ['Words', '92.4k'], ['Active days', '187']].map(([l, v]) => (
            <div key={l} className="clay-well p-3">
              <div className="eyebrow">{l}</div>
              <div className="font-display text-lg text-ink tnum mt-1">{v}</div>
            </div>
          ))}
        </div>

        {/* mini chart */}
        <div className="clay-well p-3 mb-4">
          <div className="flex items-end gap-1.5 h-24">
            {bars.map((b, i) => (
              <motion.div key={i} className="flex-1 rounded-t-sm"
                style={{ background: i === 7 ? 'rgb(var(--accent))' : 'rgb(var(--accent) / 0.28)' }}
                initial={{ height: 0 }} animate={{ height: `${(b / max) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.03 }} />
            ))}
          </div>
        </div>

        {/* mini network */}
        <div className="flex items-center justify-between clay-well p-3">
          <MiniNetwork />
          <div className="flex -space-x-2">
            {['Maya', 'Leo', 'Priya', 'Sam'].map((n) => <Avatar key={n} name={n} size={28} ring />)}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniNetwork() {
  const nodes = [[18, 22], [60, 12], [92, 34], [44, 46], [80, 56]]
  const edges = [[0, 1], [0, 3], [1, 2], [1, 3], [3, 4], [2, 4]]
  return (
    <svg width="116" height="68" viewBox="0 0 116 68" className="overflow-visible">
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="rgb(var(--accent) / 0.35)" strokeWidth="1.5" />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 1 ? 7 : 5}
          fill={i === 1 ? 'rgb(var(--accent))' : 'rgb(var(--surface))'}
          stroke="rgb(var(--accent))" strokeWidth="1.5" />
      ))}
    </svg>
  )
}
