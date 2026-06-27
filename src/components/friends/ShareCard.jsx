import { forwardRef } from 'react'
import { LogoMark } from '../common/Logo.jsx'
import { Avatar } from '../ui/primitives.jsx'
import { comma, compact } from '../../lib/format.js'

/**
 * The shareable poster — a 9:16 card distilled from the chat, designed to be
 * exported to PNG and dropped into a story. Pure presentation; the parent
 * captures `ref` with html-to-image.
 */
export const ShareCard = forwardRef(function ShareCard({ data }, ref) {
  const { messages, days, topPerson, topEmoji, streak, balance, awards, range } = data
  return (
    <div ref={ref} className="w-[360px] shrink-0 rounded-3xl overflow-hidden relative grain"
      style={{ background: 'rgb(var(--canvas))', border: '1px solid rgb(var(--line))' }}>
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent)), transparent 60%)' }} />
      <div className="relative p-7">
        <div className="flex items-center justify-between">
          <LogoMark size={30} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">Wrapped</span>
        </div>

        <h2 className="font-display text-3xl font-semibold text-ink leading-[1.05] mt-7">
          Our group chat,<br /><span className="text-accent-text">by the numbers.</span>
        </h2>
        <p className="text-xs text-muted mt-2">{range}</p>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <Tile big label="Messages" value={comma(messages)} />
          <Tile label="Active days" value={comma(days)} />
          <Tile label="Longest streak" value={`${streak}d`} />
          <Tile label="Balance" value={`${balance}/100`} />
        </div>

        <div className="mt-4 rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'rgb(var(--accent) / 0.10)', border: '1px solid rgb(var(--accent) / 0.25)' }}>
          {topPerson && <Avatar name={topPerson.name} size={40} />}
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-faint">Chat MVP</div>
            <div className="font-display text-lg text-ink leading-tight truncate">{topPerson?.name}</div>
            <div className="text-xs text-accent-text">{topPerson ? `${topPerson.sharePct.toFixed(0)}% of all messages` : ''}</div>
          </div>
          <div className="ml-auto text-center shrink-0">
            <div className="text-3xl">{topEmoji?.value}</div>
            <div className="text-[10px] text-faint mt-0.5">{topEmoji ? `${compact(topEmoji.count)}×` : ''}</div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          {awards.slice(0, 3).map((aw) => (
            <div key={aw.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2"
              style={{ background: 'rgb(var(--surface-2))' }}>
              <span className="text-xl">{aw.emoji}</span>
              <span className="text-[11px] uppercase tracking-wide text-faint flex-1">{aw.title}</span>
              <span className="text-sm font-semibold text-ink truncate max-w-[120px]">{aw.winner}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-faint">
          made with <span className="font-display font-semibold text-ink">Subtext</span> · private by design
        </div>
      </div>
    </div>
  )
})

function Tile({ label, value, big }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))' }}>
      <div className={`font-display tnum text-ink leading-none ${big ? 'text-4xl' : 'text-2xl'}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-faint mt-1.5">{label}</div>
    </div>
  )
}
