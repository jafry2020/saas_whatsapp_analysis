import { PartyPopper, Laugh } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader } from '../ui/Card.jsx'
import { Avatar } from '../ui/primitives.jsx'
import { comma, fmtDate } from '../../lib/format.js'

const CONTEXT_WINDOW_MS = 5 * 60 * 1000

/**
 * Nostalgia bait: the Nth-message markers and whoever said the thing that
 * made everyone lose it. Both computed once in analytics.js (milestones,
 * funniestMessage) and just presented here. Clicking either opens the
 * actual surrounding messages — a milestone number means more once you can
 * see what was actually happening at the time.
 */
export function Milestones() {
  const { analytics, viewParsed, openEvidence } = useApp()
  const { milestones, funniestMessage } = analytics
  if (!milestones.length && !funniestMessage) return null

  const showContextAround = (title, ts, msBefore, msAfter) => {
    const matches = viewParsed.messages.filter(
      (m) => m.ts >= new Date(ts.getTime() - msBefore) && m.ts <= new Date(ts.getTime() + msAfter),
    )
    openEvidence(title, matches)
  }

  return (
    <Card>
      <CardHeader icon={PartyPopper} title="Milestones" subtitle="The moments worth scrolling back for" />

      {milestones.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {milestones.slice(-6).map((m) => (
            <button key={m.count} onClick={() => showContextAround(`Message #${comma(m.count)}`, m.ts, CONTEXT_WINDOW_MS, CONTEXT_WINDOW_MS)}
              className="clay-well p-4 text-left hover:brightness-95 transition">
              <div className="font-display text-lg text-ink leading-tight tnum">#{comma(m.count)}</div>
              <div className="text-[11px] text-faint uppercase tracking-wide mt-1">message milestone</div>
              <div className="flex items-center gap-1.5 mt-2">
                <Avatar name={m.author} size={18} />
                <span className="text-xs font-medium text-ink truncate">{m.author}</span>
              </div>
              <div className="text-[11px] text-muted mt-1">{fmtDate(m.ts)}</div>
            </button>
          ))}
        </div>
      )}

      {funniestMessage && (
        <div className={milestones.length ? 'mt-4' : ''}>
          <button
            onClick={() => showContextAround('The message that broke the chat', funniestMessage.ts, 60 * 1000, CONTEXT_WINDOW_MS)}
            className="w-full text-left rounded-2xl clay p-4 flex items-start gap-3 hover:brightness-95 transition"
            style={{ background: 'rgb(var(--accent) / 0.08)' }}>
            <span className="grid place-items-center h-10 w-10 rounded-xl bg-accent/15 text-accent-text shrink-0">
              <Laugh size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-faint">The message that broke the chat</div>
              <p className="text-sm text-ink mt-1 leading-snug">"{funniestMessage.body}"</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Avatar name={funniestMessage.author} size={18} />
                <span className="text-xs text-muted">{funniestMessage.author} · {fmtDate(funniestMessage.ts)} · {funniestMessage.score} laugh{funniestMessage.score === 1 ? '' : 's'} triggered</span>
              </div>
            </div>
          </button>
        </div>
      )}
    </Card>
  )
}
