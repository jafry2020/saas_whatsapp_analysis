import {
  MessageSquare, Users, CalendarDays, Activity, Type, Image, Smile, Scale, Flame,
  Clock, Timer, Percent, Crown, Gauge, TrendingUp, TrendingDown,
} from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card } from '../ui/Card.jsx'
import { moodLabel } from '../../lib/sentiment.js'
import { compact, comma, duration, fmtHour } from '../../lib/format.js'

/**
 * Headline numbers. Three tile sets:
 *  - a focused participant (either mode) → that person's stats
 *  - Friends default → identity & vibe (who's the main character, group mood)
 *  - Pro default → decision metrics (response time, SLA, engagement trend)
 */
export function Overview() {
  const { analytics, focus, mode } = useApp()
  const a = analytics
  const person = focus ? a.perPerson.find((p) => p.name === focus) : null

  let tiles
  if (person) {
    tiles = [
      { icon: MessageSquare, label: 'Messages', value: comma(person.messages) },
      { icon: Percent, label: 'Share of chat', value: `${person.sharePct.toFixed(1)}%`, accent: true },
      { icon: Type, label: 'Words', value: compact(person.words) },
      { icon: Activity, label: 'Avg words/msg', value: person.avgWords.toFixed(1) },
      { icon: Image, label: 'Media sent', value: comma(person.media) },
      { icon: Smile, label: 'Emojis', value: comma(person.emojis) },
      { icon: Clock, label: 'Peak hour', value: fmtHour(person.peakHour) },
      { icon: Timer, label: 'Median reply', value: duration(person.medianResponseSec) },
    ]
  } else if (mode === 'friends') {
    const top = a.perPerson[0]
    const mood = moodLabel(a.totals.sentiment)
    tiles = [
      { icon: MessageSquare, label: 'Messages', value: comma(a.totals.messages) },
      { icon: Users, label: 'Participants', value: comma(a.totals.participants) },
      { icon: Activity, label: 'Messages/day', value: a.totals.perDay.toFixed(1) },
      { icon: Type, label: 'Words', value: compact(a.totals.words) },
      { icon: Smile, label: 'Emojis', value: comma(a.totals.emojis) },
      { icon: Flame, label: 'Longest streak', value: `${a.streak.longest}d` },
      { icon: Crown, label: 'Top chatter', value: top ? `${top.name} · ${top.sharePct.toFixed(0)}%` : '—', accent: true },
      { icon: Smile, label: 'Group vibe', value: mood.label, accent: true },
    ]
  } else {
    const mom = a.totals.engagementMoM
    tiles = [
      { icon: MessageSquare, label: 'Messages', value: comma(a.totals.messages) },
      { icon: Users, label: 'Participants', value: comma(a.totals.participants) },
      { icon: CalendarDays, label: 'Active span', value: `${comma(a.totals.days)} days` },
      { icon: Activity, label: 'Messages/day', value: a.totals.perDay.toFixed(1) },
      { icon: Timer, label: 'Median response', value: duration(a.sla.median), accent: true },
      { icon: Gauge, label: 'SLA · under 15m', value: `${Math.round(a.sla.under15 * 100)}%` },
      { icon: mom >= 0 ? TrendingUp : TrendingDown, label: 'Engagement MoM', value: `${mom >= 0 ? '+' : ''}${mom.toFixed(0)}%` },
      { icon: Scale, label: 'Balance', value: `${a.balanceIndex}/100`, accent: true },
    ]
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {tiles.map((t, i) => (
        <Card key={t.label} padded={false} className="p-4 md:p-5 animate-fade-up" hover
          style={{ animationDelay: `${i * 30}ms` }}>
          <div className="flex items-center gap-1.5 text-faint mb-2">
            <t.icon size={14} strokeWidth={2} />
            <span className="eyebrow">{t.label}</span>
          </div>
          <div className={`font-display text-2xl md:text-[26px] leading-none tnum tracking-tight truncate ${t.accent ? 'text-accent-text' : 'text-ink'}`}>
            {t.value}
          </div>
        </Card>
      ))}
    </div>
  )
}
