import { useMemo } from 'react'
import { Users, Crown, Lock, Clock } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { computeAwards } from '../../lib/awards.js'
import { Card, CardHeader } from '../ui/Card.jsx'
import { Avatar, Button } from '../ui/primitives.jsx'
import { moodLabel } from '../../lib/sentiment.js'
import { comma, duration, fmtHour, cn } from '../../lib/format.js'

/** Per-person leaderboard. Click a row to filter the whole dashboard.
 *  Friends gets a playful, identity-forward variant (personality tags +
 *  emoji); Pro keeps the dense metric columns. Free tier caps at 5. */
export function People() {
  const { analytics, focus, toggleFocus, isPro, openUpgrade, mode } = useApp()
  const friends = mode === 'friends'
  const all = analytics.perPerson
  const cap = isPro ? all.length : 5
  const shown = all.slice(0, cap)
  const hidden = all.length - shown.length

  // First superlative each person wins becomes their "personality" (Friends).
  const tagByName = useMemo(() => {
    const map = new Map()
    if (!friends) return map
    for (const aw of computeAwards(analytics)) {
      if (aw.winner && !map.has(aw.winner)) map.set(aw.winner, { emoji: aw.emoji, title: aw.title })
    }
    return map
  }, [analytics, friends])

  return (
    <Card>
      <CardHeader icon={Users} title="The cast"
        subtitle={friends ? 'Who\'s who in your chat — tap anyone to dig in'
          : `${all.length} ${all.length === 1 ? 'person' : 'people'} · click anyone to filter everything`} />
      <div className="space-y-2">
        {shown.map((p, i) => (
          <PersonRow key={p.name} p={p} rank={i} max={all[0].messages} friends={friends}
            tag={tagByName.get(p.name)} active={focus === p.name} dimmed={focus && focus !== p.name}
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

function PersonRow({ p, rank, max, active, dimmed, friends, tag, onClick }) {
  const mood = moodLabel(p.sentiment)
  return (
    <button
      onClick={onClick}
      className={cn(
        // box-shadow excluded — see Card.jsx comment.
        'w-full text-left rounded-2xl px-3 py-3 md:px-4 transition-[background-color,opacity] duration-200',
        active ? 'bg-accent/[0.07] clay' : 'bg-surface-2 clay-inset hover:bg-surface',
        dimmed && 'opacity-55',
      )}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className="relative shrink-0">
          <Avatar name={p.name} size={friends ? 46 : 40} />
          {rank === 0 && <span className="absolute -top-1.5 -right-1.5 grid place-items-center h-5 w-5 rounded-full bg-accent text-on-accent"><Crown size={11} /></span>}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink truncate">{p.name}</span>
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0',
              mood.tone === 'positive' ? 'bg-positive' : mood.tone === 'negative' ? 'bg-negative' : 'bg-faint')}
              title={mood.label} />
          </div>
          {friends && tag ? (
            <div className="mt-1 text-[13px] text-muted truncate">{tag.emoji} {tag.title}</div>
          ) : (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-line overflow-hidden max-w-[180px]">
                <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${(p.messages / max) * 100}%` }} />
              </div>
              <span className="text-xs text-muted tnum">{p.sharePct.toFixed(0)}%</span>
            </div>
          )}
        </div>

        {friends ? (
          <>
            {/* identity-forward: share% hero + peak + big emojis */}
            <div className="text-right shrink-0">
              <div className="font-display text-2xl text-accent-text tnum leading-none">{p.sharePct.toFixed(0)}%</div>
              <div className="text-[10px] text-faint uppercase tracking-wide mt-1">of chat</div>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted w-16 justify-end shrink-0">
              <Clock size={12} /> {fmtHour(p.peakHour)}
            </div>
            <div className="hidden sm:flex items-center gap-0.5 text-2xl w-20 justify-end">
              {p.topEmojis.slice(0, 3).map((e) => <span key={e.value}>{e.value}</span>)}
            </div>
          </>
        ) : (
          <>
            <div className="hidden md:flex items-center gap-5 text-right">
              <Metric label="messages" value={comma(p.messages)} />
              <Metric label="avg words" value={p.avgWords.toFixed(1)} />
              <Metric label="reply" value={duration(p.medianResponseSec)} />
              <Metric label="peak" value={fmtHour(p.peakHour)} />
            </div>
            <div className="hidden sm:flex items-center gap-0.5 text-lg w-16 justify-end">
              {p.topEmojis.slice(0, 3).map((e) => <span key={e.value}>{e.value}</span>)}
            </div>
          </>
        )}
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
