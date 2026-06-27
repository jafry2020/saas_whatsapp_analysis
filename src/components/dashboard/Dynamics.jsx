import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Timer, Scale, GitCompareArrows, Sparkle, Flame, MoonStar, Trophy } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader } from '../ui/Card.jsx'
import { Avatar } from '../ui/primitives.jsx'
import { duration, comma, fmtDate, fmtHour, nameColor, cn, DOW } from '../../lib/format.js'

/* ----------------------------------------------------- Response time ranking */
export function ResponseTimes() {
  const { analytics } = useApp()
  const ranked = analytics.perPerson.filter((p) => p.replyCount > 2)
    .sort((a, b) => a.medianResponseSec - b.medianResponseSec)
  const max = Math.max(1, ...ranked.map((p) => p.medianResponseSec))
  if (!ranked.length) return null
  return (
    <Card>
      <CardHeader icon={Timer} title="Who replies fastest" subtitle="Median time to respond to someone else" />
      <div className="space-y-3">
        {ranked.map((p) => (
          <div key={p.name} className="flex items-center gap-3">
            <Avatar name={p.name} size={28} />
            <span className="text-sm text-ink w-20 truncate">{p.name}</span>
            <div className="flex-1 h-6 rounded-lg bg-surface-2 overflow-hidden relative clay-inset">
              <div className="h-full rounded-lg bg-accent/70 transition-all duration-700"
                style={{ width: `${Math.max(4, (p.medianResponseSec / max) * 100)}%` }} />
            </div>
            <span className="text-sm font-medium text-ink tnum w-20 text-right">{duration(p.medianResponseSec)}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------- Participation donut */
export function Balance() {
  const { analytics } = useApp()
  const data = analytics.perPerson.map((p) => ({ name: p.name, value: p.messages }))
  return (
    <Card>
      <CardHeader icon={Scale} title="Participation balance" subtitle="Share of all messages sent" />
      <div className="flex items-center gap-4">
        <div className="relative h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}
                stroke="rgb(var(--surface))" strokeWidth={2} animationDuration={700}>
                {data.map((d) => <Cell key={d.name} fill={nameColor(d.name)} />)}
              </Pie>
              <Tooltip content={<DonutTip total={analytics.totals.messages} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-center">
              <div className="font-display text-2xl text-ink tnum leading-none">{analytics.balanceIndex}</div>
              <div className="text-[10px] text-faint uppercase tracking-wide mt-1">balance</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          {analytics.perPerson.slice(0, 8).map((p) => (
            <div key={p.name} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: nameColor(p.name) }} />
              <span className="text-sm text-ink truncate flex-1">{p.name}</span>
              <span className="text-xs text-muted tnum">{p.sharePct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function DonutTip({ active, payload, total }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="card shadow-pop px-3 py-2">
      <div className="text-sm font-semibold text-ink">{d.name}</div>
      <div className="text-xs text-muted tnum">{comma(d.value)} msgs · {((d.value / total) * 100).toFixed(1)}%</div>
    </div>
  )
}

/* -------------------------------------------------- Starters vs enders flow */
export function ConversationFlow() {
  const { analytics } = useApp()
  const P = analytics.perPerson
  const maxStart = Math.max(1, ...P.map((p) => p.starts))
  const maxEnd = Math.max(1, ...P.map((p) => p.ends))
  return (
    <Card>
      <CardHeader icon={GitCompareArrows} title="Starters & closers"
        subtitle="Who breaks the silence — and who gets the last word" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
        <div className="eyebrow flex items-center gap-1"><Sparkle size={11} /> Starts conversations</div>
        <div className="eyebrow flex items-center gap-1 justify-end">Ends conversations <Trophy size={11} /></div>
        {P.slice(0, 6).map((p) => (
          <div key={p.name} className="contents">
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink w-16 truncate">{p.name}</span>
              <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(p.starts / maxStart) * 100}%` }} />
              </div>
              <span className="text-xs text-muted tnum w-7 text-right">{p.starts}</span>
            </div>
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="text-sm text-ink w-16 truncate text-right">{p.name}</span>
              <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden flex justify-end">
                <div className="h-full rounded-full bg-accent-3" style={{ width: `${(p.ends / maxEnd) * 100}%` }} />
              </div>
              <span className="text-xs text-muted tnum w-7">{p.ends}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ----------------------------------------------------------- Quick facts */
export function Highlights() {
  const { analytics } = useApp()
  const { peaks, streak, longestSilences, totals } = analytics
  const silence = longestSilences[0]
  const facts = [
    { icon: Flame, label: 'Longest streak', value: `${streak.longest} days`, sub: 'consecutive days chatting' },
    { icon: Trophy, label: 'Busiest day', value: peaks.day ? fmtDate(new Date(peaks.day + 'T00:00:00')) : '—', sub: `${comma(peaks.dayCount)} messages` },
    { icon: MoonStar, label: 'Peak hour', value: fmtHour(peaks.hour), sub: `busiest on ${DOW[peaks.dow]}` },
    { icon: Timer, label: 'Longest silence', value: silence ? duration(silence.seconds) : '—', sub: 'between two messages' },
  ]
  return (
    <Card>
      <CardHeader icon={Sparkle} title="Highlights" subtitle="The records worth bragging about" />
      <div className="grid grid-cols-2 gap-3">
        {facts.map((f) => (
          <div key={f.label} className="clay-well p-4">
            <f.icon size={16} className="text-accent-text" />
            <div className="font-display text-lg text-ink mt-2 leading-tight">{f.value}</div>
            <div className="text-[11px] text-faint uppercase tracking-wide mt-1">{f.label}</div>
            <div className="text-xs text-muted mt-0.5">{f.sub}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
