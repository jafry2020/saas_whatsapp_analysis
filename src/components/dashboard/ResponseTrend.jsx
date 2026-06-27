import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Timer } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader } from '../ui/Card.jsx'
import { useChartColors } from '../ui/useChartColors.js'
import { fmtMonth, duration } from '../../lib/format.js'

/**
 * Pro-only: median reply time per month — "are we getting slower?". Mirrors
 * Timeline's restrained Pro line treatment (thin line, mono ticks, no fill).
 * Months with no replies are null in `responseSeries`, so connectNulls bridges
 * the gap rather than dropping to a misleading zero.
 */
export function ResponseTrend() {
  const { analytics } = useApp()
  const c = useChartColors()
  const data = analytics.responseSeries.map((r) => ({ label: fmtMonth(r.date), value: r.value }))
  const hasAny = data.some((d) => d.value != null)

  return (
    <Card>
      <CardHeader icon={Timer} title="Reply-time trend"
        subtitle="Median first response by month · lower is better" />
      {hasAny ? (
        <div className="h-56 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={c.line} strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: c.faint, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={{ fill: c.faint, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickLine={false} axisLine={false} width={44} tickFormatter={(v) => duration(v)} />
              <Tooltip content={<RespTip />} cursor={{ stroke: c.line }} />
              <Line type="monotone" dataKey="value" stroke={c.accent} strokeWidth={1.75} connectNulls
                dot={false} activeDot={{ r: 3.5, fill: c.accent, stroke: c.surface, strokeWidth: 2 }} animationDuration={500} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-56 grid place-items-center text-sm text-faint">Not enough replies to chart a trend.</div>
      )}
    </Card>
  )
}

function RespTip({ active, payload }) {
  if (!active || !payload?.length || payload[0].value == null) return null
  return (
    <div className="card shadow-pop px-3 py-2">
      <div className="text-xs text-muted">{payload[0].payload.label}</div>
      <div className="text-sm font-semibold text-ink tnum">{duration(payload[0].value)} median reply</div>
    </div>
  )
}
