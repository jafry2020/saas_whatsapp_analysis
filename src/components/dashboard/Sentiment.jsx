import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { HeartPulse } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader } from '../ui/Card.jsx'
import { Avatar } from '../ui/primitives.jsx'
import { useChartColors } from '../ui/useChartColors.js'
import { moodLabel } from '../../lib/sentiment.js'
import { fmtMonth, cn } from '../../lib/format.js'

/** Lexicon sentiment: a monthly trend line plus a per-person diverging scale. */
export function Sentiment() {
  const { analytics, mode } = useApp()
  const pro = mode === 'pro'
  const c = useChartColors()
  const data = analytics.sentimentSeries.map((s) => ({ label: fmtMonth(s.date), value: +(s.value).toFixed(3) }))
  const people = [...analytics.perPerson].sort((a, b) => b.sentiment - a.sentiment)
  const maxAbs = Math.max(0.05, ...people.map((p) => Math.abs(p.sentiment)))

  return (
    <Card>
      <CardHeader icon={HeartPulse} title="Mood over time"
        subtitle="On-device lexicon scoring — directional, not clinical" />

      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray={pro ? '0' : '3 3'} stroke={c.line} strokeOpacity={pro ? 0.5 : 1} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: c.faint, fontSize: 11, fontFamily: pro ? 'JetBrains Mono' : undefined }} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={{ fill: c.faint, fontSize: 11, fontFamily: pro ? 'JetBrains Mono' : undefined }} tickLine={false} axisLine={false} width={36} domain={[-0.6, 0.6]} />
            <ReferenceLine y={0} stroke={c.line} />
            <Tooltip content={<MoodTip />} cursor={{ stroke: c.line }} />
            <Line type="monotone" dataKey="value" stroke={c.accent} strokeWidth={pro ? 1.75 : 2.5} dot={false}
              activeDot={{ r: pro ? 3.5 : 4, fill: c.accent, stroke: c.surface, strokeWidth: 2 }} animationDuration={pro ? 500 : 700} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 space-y-2.5">
        {people.map((p) => {
          const mood = moodLabel(p.sentiment)
          const w = (Math.abs(p.sentiment) / maxAbs) * 50
          const pos = p.sentiment >= 0
          return (
            <div key={p.name} className="flex items-center gap-3">
              <Avatar name={p.name} size={26} />
              <span className="text-sm text-ink w-20 truncate">{p.name}</span>
              <div className="relative flex-1 h-2.5 rounded-full bg-surface-2">
                <span className="absolute left-1/2 top-0 bottom-0 w-px bg-line" />
                <span className={cn('absolute top-0 bottom-0 rounded-full', pos ? 'bg-positive' : 'bg-negative')}
                  style={{ left: pos ? '50%' : `${50 - w}%`, width: `${w}%` }} />
              </div>
              <span className={cn('text-xs w-24 text-right',
                mood.tone === 'positive' ? 'text-positive' : mood.tone === 'negative' ? 'text-negative' : 'text-muted')}>
                {mood.label}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function MoodTip({ active, payload }) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  const mood = moodLabel(v)
  return (
    <div className="card shadow-pop px-3 py-2">
      <div className="text-xs text-muted">{payload[0].payload.label}</div>
      <div className="text-sm font-semibold text-ink">{mood.label} <span className="tnum text-muted">({v > 0 ? '+' : ''}{v})</span></div>
    </div>
  )
}
