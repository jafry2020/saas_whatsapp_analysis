import { useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader } from '../ui/Card.jsx'
import { DOW, comma, cn } from '../../lib/format.js'

const ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon → Sun

/**
 * Which weekday the chat lives on. Reuses the already-computed `dow[7]`
 * (global, or the focused person's). Friends framing is playful; Pro framing
 * is staffing/coverage. Custom bars (not Recharts) to match the heatmap's
 * crisp, token-driven look and keep both modes visually distinct.
 */
export function WeekdayActivity() {
  const { analytics, focus, mode } = useApp()
  const pro = mode === 'pro'
  const dow = focus ? analytics.perPerson.find((p) => p.name === focus)?.dow : analytics.dow
  const [hover, setHover] = useState(null)
  if (!dow) return null

  const max = Math.max(1, ...dow)
  const peak = dow.indexOf(max)
  const total = dow.reduce((s, n) => s + n, 0) || 1

  return (
    <Card>
      <CardHeader icon={CalendarRange}
        title={pro ? 'Activity by weekday' : 'Your busiest day'}
        subtitle={pro ? 'Volume distribution — where to put coverage'
          : focus ? `When ${focus} shows up` : 'Which day the chat goes off'}
        action={<div className="text-xs text-muted h-5">{hover != null
          ? <span className="tnum">{DOW[hover]} · <b className="text-ink">{comma(dow[hover])}</b> · {Math.round((dow[hover] / total) * 100)}%</span>
          : <span className="text-faint">hover a bar</span>}</div>} />

      <div className="flex items-end gap-2 md:gap-3 h-44">
        {ORDER.map((d) => {
          const isPeak = d === peak
          return (
            <div key={d} className="flex-1 flex flex-col items-center justify-end h-full gap-2"
              onMouseEnter={() => setHover(d)} onMouseLeave={() => setHover(null)}>
              <span className={cn('text-[11px] tnum transition-opacity',
                hover === d ? 'text-ink opacity-100' : 'text-faint opacity-0')}>{comma(dow[d])}</span>
              <div className="w-full rounded-t-lg transition-all duration-500"
                style={{
                  height: `${Math.max(3, (dow[d] / max) * 100)}%`,
                  background: isPeak ? 'rgb(var(--accent))'
                    : pro ? 'rgb(var(--accent) / 0.32)' : 'rgb(var(--accent) / 0.45)',
                }} />
              <span className={cn('text-xs font-medium', isPeak ? 'text-accent-text' : 'text-muted')}>
                {DOW[d]}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
