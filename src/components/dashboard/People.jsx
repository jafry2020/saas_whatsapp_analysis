import { Users, Crown, Lock } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader } from '../ui/Card.jsx'
import { Avatar, Button } from '../ui/primitives.jsx'
import { moodLabel } from '../../lib/sentiment.js'
import { comma, compact, duration, fmtHour, cn } from '../../lib/format.js'

/** Per-person leaderboard. Click a row to filter the whole dashboard.
 *  Free tier is capped at 5 participants — the rest sit behind an upsell. */
export function People() {
  const { analytics, focus, toggleFocus, isPro, openUpgrade } = useApp()
  const all = analytics.perPerson
  const cap = isPro ? all.length : 5
  const shown = all.slice(0, cap)
  const hidden = all.length - shown.length

  return (
    <Card>
      <CardHeader icon={Users} title="The cast"
        subtitle={`${all.length} ${all.length === 1 ? 'person' : 'people'} · click anyone to filter everything`} />
      <div className="space-y-2">
        {shown.map((p, i) => (
          <PersonRow key={p.name} p={p} rank={i} max={all[0].messages}
            active={focus === p.name} dimmed={focus && focus !== p.name}
            onClick={() => toggleFocus(p.name)} />
        ))}
      </div>

      {hidden > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-line bg-surface-2/50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Lock size={15} className="text-accent-text" />
            {hidden} more {hidden === 1 ? 'participant' : 'participants'} hidden on the free plan
          </div>
          <Button size="sm" variant="primary" onClick={openUpgrade}>Unlock all</Button>
        </div>
      )}
    </Card>
  )
}

function PersonRow({ p, rank, max, active, dimmed, onClick }) {
  const mood = moodLabel(p.sentiment)
  const hourMax = Math.max(1, ...p.hours)
  return (
    <button
      onClick={onClick}
      className={cn(
        // box-shadow excluded — see Card.jsx comment (clay/clay-inset swap
        // snaps instantly instead of risking a stuck mid-interpolation).
        'w-full text-left rounded-2xl px-3 py-3 md:px-4 transition-[background-color,opacity] duration-200',
        active ? 'bg-accent/[0.07] clay' : 'bg-surface-2 clay-inset hover:bg-surface',
        dimmed && 'opacity-55',
      )}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className="relative shrink-0">
          <Avatar name={p.name} size={40} />
          {rank === 0 && <span className="absolute -top-1.5 -right-1.5 grid place-items-center h-5 w-5 rounded-full bg-accent text-on-accent"><Crown size={11} /></span>}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink truncate">{p.name}</span>
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0',
              mood.tone === 'positive' ? 'bg-positive' : mood.tone === 'negative' ? 'bg-negative' : 'bg-faint')}
              title={mood.label} />
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-line overflow-hidden max-w-[180px]">
              <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${(p.messages / max) * 100}%` }} />
            </div>
            <span className="text-xs text-muted tnum">{p.sharePct.toFixed(0)}%</span>
          </div>
        </div>

        {/* mini stats */}
        <div className="hidden md:flex items-center gap-5 text-right">
          <Metric label="messages" value={comma(p.messages)} />
          <Metric label="avg words" value={p.avgWords.toFixed(1)} />
          <Metric label="reply" value={duration(p.medianResponseSec)} />
          <Metric label="peak" value={fmtHour(p.peakHour)} />
        </div>

        {/* activity sparkline */}
        <div className="hidden lg:flex items-end gap-[2px] h-9 w-[120px] shrink-0">
          {p.hours.map((v, h) => (
            <div key={h} className="flex-1 rounded-[1px] bg-accent/30" style={{ height: `${Math.max(6, (v / hourMax) * 100)}%` }} />
          ))}
        </div>

        {/* top emojis */}
        <div className="hidden sm:flex items-center gap-0.5 text-lg w-16 justify-end">
          {p.topEmojis.slice(0, 3).map((e) => <span key={e.value}>{e.value}</span>)}
        </div>
      </div>

      {/* top words on focus */}
      {active && p.topWords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 animate-fade-up">
          {p.topWords.slice(0, 10).map((w) => (
            <span key={w.value} className="chip text-[11px] py-0.5">{w.value} <span className="text-faint tnum">{w.count}</span></span>
          ))}
        </div>
      )}
    </button>
  )
}

const Metric = ({ label, value }) => (
  <div>
    <div className="font-display text-sm text-ink tnum leading-none">{value}</div>
    <div className="text-[10px] text-faint uppercase tracking-wide mt-1">{label}</div>
  </div>
)
