import { useMemo, useState } from 'react'
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader } from '../ui/Card.jsx'
import { Segmented } from '../ui/primitives.jsx'
import { useChartColors } from '../ui/useChartColors.js'
import { fmtMonth, fmtDate, comma } from '../../lib/format.js'

/** Messages over time. Monthly by default, daily for a finer view; respects
 *  the focused participant. Pro renders a restrained line (no fill, mono
 *  ticks); Friends keeps the bold gradient-filled area — same data shape,
 *  deliberately different rendering register per mode. */
export function Timeline() {
  const { analytics, focus, mode } = useApp()
  const pro = mode === 'pro'
  const c = useChartColors()
  const [gran, setGran] = useState('month')

  const data = useMemo(() => {
    if (gran === 'month') {
      const person = focus ? analytics.perPerson.find((p) => p.name === focus) : null
      return analytics.monthlySeries.map((m) => ({
        label: fmtMonth(m.date),
        full: fmtMonth(m.date),
        count: person ? (person.monthly.get(m.ym) || 0) : m.count,
      }))
    }
    return analytics.dailySeries.map((d) => ({ label: fmtDate(d.date), full: fmtDate(d.date), count: d.count }))
  }, [analytics, gran, focus])

  return (
    <Card>
      <CardHeader icon={TrendingUp} title="Activity over time"
        subtitle={focus ? `Messages from ${focus}` : 'Messages across the whole conversation'}
        action={<Segmented size="sm" value={gran} onChange={setGran}
          options={[{ value: 'month', label: 'Month' }, { value: 'day', label: 'Day' }]} />} />
      <div className="h-64 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="tl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray={pro ? '0' : '3 3'} stroke={c.line}
              strokeOpacity={pro ? 0.5 : 1} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: c.faint, fontSize: 11, fontFamily: pro ? 'JetBrains Mono' : undefined }}
              tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={{ fill: c.faint, fontSize: 11, fontFamily: pro ? 'JetBrains Mono' : undefined }}
              tickLine={false} axisLine={false} width={36} tickFormatter={(v) => comma(v)} />
            <Tooltip content={<ChartTip />} cursor={{ stroke: c.line }} />
            {pro ? (
              <Line type="monotone" dataKey="count" stroke={c.accent} strokeWidth={1.75}
                animationDuration={500} dot={false} activeDot={{ r: 3.5, fill: c.accent, stroke: c.surface, strokeWidth: 2 }} />
            ) : (
              <Area type="monotone" dataKey="count" stroke={c.accent} strokeWidth={2.5} fill="url(#tl)"
                animationDuration={700} dot={false} activeDot={{ r: 4, fill: c.accent, stroke: c.surface, strokeWidth: 2 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="card shadow-pop px-3 py-2">
      <div className="text-xs text-muted">{p.payload.full}</div>
      <div className="text-sm font-semibold text-ink tnum">{comma(p.value)} messages</div>
    </div>
  )
}
