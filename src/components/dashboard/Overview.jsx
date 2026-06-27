import { MessageSquare, Users, CalendarDays, Activity, Type, Image, Smile, Scale, Flame, Clock, Timer, Percent } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card } from '../ui/Card.jsx'
import { compact, comma, duration, fmtHour } from '../../lib/format.js'

/** The headline numbers. Reacts to the focused participant when one is set. */
export function Overview() {
  const { analytics, focus } = useApp()
  const a = analytics
  const person = focus ? a.perPerson.find((p) => p.name === focus) : null

  const tiles = person ? [
    { icon: MessageSquare, label: 'Messages', value: comma(person.messages) },
    { icon: Percent, label: 'Share of chat', value: `${person.sharePct.toFixed(1)}%`, accent: true },
    { icon: Type, label: 'Words', value: compact(person.words) },
    { icon: Activity, label: 'Avg words/msg', value: person.avgWords.toFixed(1) },
    { icon: Image, label: 'Media sent', value: comma(person.media) },
    { icon: Smile, label: 'Emojis', value: comma(person.emojis) },
    { icon: Clock, label: 'Peak hour', value: fmtHour(person.peakHour) },
    { icon: Timer, label: 'Median reply', value: duration(person.medianResponseSec) },
  ] : [
    { icon: MessageSquare, label: 'Messages', value: comma(a.totals.messages) },
    { icon: Users, label: 'Participants', value: comma(a.totals.participants) },
    { icon: CalendarDays, label: 'Active span', value: `${comma(a.totals.days)} days` },
    { icon: Activity, label: 'Messages/day', value: a.totals.perDay.toFixed(1) },
    { icon: Type, label: 'Words', value: compact(a.totals.words) },
    { icon: Image, label: 'Media', value: comma(a.totals.media) },
    { icon: Scale, label: 'Balance', value: `${a.balanceIndex}/100`, accent: true },
    { icon: Flame, label: 'Longest streak', value: `${a.streak.longest}d` },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {tiles.map((t, i) => (
        <Card key={t.label} padded={false} className="p-4 md:p-5 animate-fade-up" hover
          style={{ animationDelay: `${i * 30}ms` }}>
          <div className="flex items-center gap-1.5 text-faint mb-2">
            <t.icon size={14} strokeWidth={2} />
            <span className="eyebrow">{t.label}</span>
          </div>
          <div className={`font-display text-2xl md:text-[26px] leading-none tnum tracking-tight ${t.accent ? 'text-accent-text' : 'text-ink'}`}>
            {t.value}
          </div>
        </Card>
      ))}
    </div>
  )
}
