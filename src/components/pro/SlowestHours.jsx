import { useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader } from '../ui/Card.jsx'
import { duration, fmtHour, cn } from '../../lib/format.js'

const BUSINESS_HOURS = new Set([9, 10, 11, 12, 13, 14, 15, 16, 17])

/**
 * "Do replies get slower outside business hours?" — bucketed by the hour
 * the client's message actually arrived (analytics.js's hourlyResponseSeries),
 * not the hour it got answered. The staffing-relevant number is the ratio
 * between business-hours and after-hours median response time.
 */
export function SlowestHours() {
  const { analytics } = useApp()
  const { hourlyResponseSeries } = analytics
  const [hover, setHover] = useState(null)

  const { max, insight } = useMemo(() => {
    const withData = hourlyResponseSeries.filter((h) => h.count > 0)
    const max = Math.max(1, ...withData.map((h) => h.median))
    const biz = withData.filter((h) => BUSINESS_HOURS.has(h.hour))
    const after = withData.filter((h) => !BUSINESS_HOURS.has(h.hour))
    const wavg = (arr) => {
      const totalN = arr.reduce((s, h) => s + h.count, 0)
      return totalN ? arr.reduce((s, h) => s + h.median * h.count, 0) / totalN : 0
    }
    const bizAvg = wavg(biz), afterAvg = wavg(after)
    const ratio = bizAvg > 0 ? afterAvg / bizAvg : 0
    return { max, insight: bizAvg > 0 && afterAvg > 0 ? { bizAvg, afterAvg, ratio } : null }
  }, [hourlyResponseSeries])

  if (!hourlyResponseSeries.some((h) => h.count > 0)) return null

  return (
    <Card>
      <CardHeader icon={Clock} title="Response time by hour"
        subtitle="When the wait started — spot the coverage gaps"
        action={<div className="text-xs text-muted h-5">{hover != null
          ? <span className="tnum">{fmtHour(hover)} · <b className="text-ink">{duration(hourlyResponseSeries[hover].median)}</b></span>
          : <span className="text-faint">hover a bar</span>}</div>} />

      <div className="flex items-end gap-[3px] h-32">
        {hourlyResponseSeries.map((h) => {
          const empty = h.count === 0
          const biz = BUSINESS_HOURS.has(h.hour)
          return (
            <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full gap-1"
              onMouseEnter={() => !empty && setHover(h.hour)} onMouseLeave={() => setHover(null)}>
              <div className="w-full rounded-t transition-all duration-300"
                style={{
                  height: empty ? '3%' : `${Math.max(4, (h.median / max) * 100)}%`,
                  background: empty ? 'rgb(var(--line))' : hover === h.hour ? 'rgb(var(--accent))'
                    : biz ? 'rgb(var(--accent) / 0.35)' : 'rgb(var(--accent-3) / 0.55)',
                }} />
              {h.hour % 3 === 0 && (
                <span className="text-[9px] text-faint tnum">{h.hour === 0 ? '12a' : h.hour === 12 ? '12p' : h.hour > 12 ? h.hour - 12 : h.hour}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 text-[11px] text-faint">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: 'rgb(var(--accent) / 0.35)' }} /> business hours (9–5)</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: 'rgb(var(--accent-3) / 0.55)' }} /> after hours</span>
      </div>

      {insight && insight.ratio > 1.15 && (
        <div className="mt-4 rounded-xl bg-warning/10 px-3.5 py-2.5 text-[13px] text-ink">
          Messages that land after hours take <b className="tnum">{insight.ratio.toFixed(1)}×</b> longer
          to get a reply ({duration(insight.afterAvg)} vs {duration(insight.bizAvg)} during business hours).
        </div>
      )}
    </Card>
  )
}
