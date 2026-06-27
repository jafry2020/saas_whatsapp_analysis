import { MessageCircle, Smile } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader } from '../ui/Card.jsx'
import { comma } from '../../lib/format.js'

/** A frequency-sized word cloud (stop-words already removed upstream). */
export function TopWords() {
  const { analytics, focus } = useApp()
  const words = focus
    ? (analytics.perPerson.find((p) => p.name === focus)?.topWords || [])
    : analytics.topWords
  const list = words.slice(0, 30)
  if (!list.length) return null
  const max = list[0].count, min = list[list.length - 1].count
  const size = (c) => 13 + ((c - min) / Math.max(1, max - min)) * 22

  return (
    <Card>
      <CardHeader icon={MessageCircle} title="Most-used words" subtitle={focus ? `What ${focus} says most` : 'Across everyone'} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {list.map((w, i) => (
          <span key={w.value} title={`${comma(w.count)}×`}
            className="font-display leading-tight transition-colors hover:text-accent-text"
            style={{ fontSize: size(w.count), color: i < 3 ? 'rgb(var(--accent-text))' : i < 12 ? 'rgb(var(--ink))' : 'rgb(var(--muted))' }}>
            {w.value}
          </span>
        ))}
      </div>
    </Card>
  )
}

/** Emoji leaderboard with proportional bars. */
export function EmojiLeaderboard() {
  const { analytics, focus } = useApp()
  const emojis = focus
    ? (analytics.perPerson.find((p) => p.name === focus)?.topEmojis || [])
    : analytics.topEmojis
  const list = emojis.slice(0, 10)
  if (!list.length) return null
  const max = list[0].count

  return (
    <Card>
      <CardHeader icon={Smile} title="Emoji leaderboard" subtitle={focus ? `${focus}'s favourites` : 'The chat\'s signature reactions'} />
      <div className="space-y-2">
        {list.map((e, i) => (
          <div key={e.value} className="flex items-center gap-3">
            <span className="text-xs text-faint tnum w-4">{i + 1}</span>
            <span className="text-2xl w-8 text-center">{e.value}</span>
            <div className="flex-1 h-3 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full bg-accent/70 transition-all duration-700" style={{ width: `${(e.count / max) * 100}%` }} />
            </div>
            <span className="text-sm text-muted tnum w-12 text-right">{comma(e.count)}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
