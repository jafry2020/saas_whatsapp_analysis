import { useMemo, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader } from '../ui/Card.jsx'
import { DOW, fmtHour } from '../../lib/format.js'

const ROW_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon → Sun

/** A 7×24 punch-card of when the chat is alive. */
export function Heatmap() {
  const { analytics, focus } = useApp()
  const grid = focus ? analytics.perPerson.find((p) => p.name === focus)?.heatmap : analytics.heatmap
  const max = useMemo(() => Math.max(1, ...(grid || []).flat()), [grid])
  const [hover, setHover] = useState(null)

  if (!grid) return null

  return (
    <Card>
      <CardHeader icon={CalendarRange} title="When the chat comes alive"
        subtitle={focus ? `${focus}'s rhythm by day & hour` : 'Activity by day of week and hour'}
        action={<div className="text-xs text-muted h-5">{hover
          ? <span className="tnum">{DOW[hover.d]} · {fmtHour(hover.h)} · <b className="text-ink">{hover.v}</b> msgs</span>
          : <span className="text-faint">hover a cell</span>}</div>} />

      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="flex">
            <div className="w-10 shrink-0" />
            <div className="grid grid-cols-24 gap-[3px] flex-1">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-center text-[9px] text-faint tnum h-4">
                  {h % 3 === 0 ? (h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? h : h - 12) : ''}
                </div>
              ))}
            </div>
          </div>

          {ROW_ORDER.map((d) => (
            <div key={d} className="flex items-center">
              <div className="w-10 shrink-0 text-[11px] text-muted font-medium pr-2 text-right">{DOW[d]}</div>
              <div className="grid grid-cols-24 gap-[3px] flex-1">
                {grid[d].map((v, h) => {
                  const alpha = v === 0 ? 0 : 0.12 + 0.88 * (v / max)
                  return (
                    <div key={h}
                      onMouseEnter={() => setHover({ d, h, v })}
                      onMouseLeave={() => setHover(null)}
                      className="aspect-square rounded-[3px] border border-line/40 transition-transform hover:scale-[1.35] hover:ring-1 hover:ring-accent"
                      style={{ background: v === 0 ? 'rgb(var(--surface-2))' : `rgb(var(--accent) / ${alpha})` }}
                      title={`${DOW[d]} ${fmtHour(h)} — ${v} messages`} />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 text-[11px] text-faint">
        <span>Less</span>
        <div className="flex gap-[3px]">
          {[0.12, 0.34, 0.56, 0.78, 1].map((a) => (
            <span key={a} className="h-3 w-3 rounded-[3px]" style={{ background: `rgb(var(--accent) / ${a})` }} />
          ))}
        </div>
        <span>More</span>
      </div>
    </Card>
  )
}
