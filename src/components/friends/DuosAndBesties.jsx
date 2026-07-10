import { useMemo } from 'react'
import { Heart, Scale } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader } from '../ui/Card.jsx'
import { Avatar } from '../ui/primitives.jsx'
import { duration } from '../../lib/format.js'

/**
 * Pair-level content the per-person views can't show: who actually talks to
 * whom the most, and — the funnier one — whose reply speed to each other is
 * wildly lopsided. Built from analytics.js's pairResponses.
 */
export function DuosAndBesties() {
  const { analytics } = useApp()
  const { pairResponses } = analytics
  if (pairResponses.length < 1) return null

  const bestDuo = pairResponses[0] // already sorted by interactions desc

  const lopsided = useMemo(() => {
    const eligible = pairResponses.filter((p) => p.aToBCount >= 3 && p.bToACount >= 3)
    if (!eligible.length) return null
    return eligible.reduce((worst, p) => {
      const ratio = Math.max(p.aToBMedian, p.bToAMedian) / Math.max(1, Math.min(p.aToBMedian, p.bToAMedian))
      const worstRatio = worst ? Math.max(worst.aToBMedian, worst.bToAMedian) / Math.max(1, Math.min(worst.aToBMedian, worst.bToAMedian)) : 0
      return ratio > worstRatio ? p : worst
    }, null)
  }, [pairResponses])

  return (
    <Card>
      <CardHeader icon={Heart} title="Duos & besties" subtitle="Who actually talks to whom" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="clay-well p-4">
          <div className="flex items-center gap-1.5 text-faint mb-2">
            <Heart size={13} />
            <span className="eyebrow">Tightest duo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <Avatar name={bestDuo.a} size={32} ring />
              <Avatar name={bestDuo.b} size={32} ring />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold text-ink truncate">{bestDuo.a} &amp; {bestDuo.b}</div>
              <div className="text-xs text-muted">{bestDuo.interactions} exchanges back and forth</div>
            </div>
          </div>
        </div>

        {lopsided && (
          <div className="clay-well p-4">
            <div className="flex items-center gap-1.5 text-faint mb-2">
              <Scale size={13} />
              <span className="eyebrow">Most one-sided</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex -space-x-2">
                <Avatar name={lopsided.a} size={32} ring />
                <Avatar name={lopsided.b} size={32} ring />
              </div>
              <div className="font-display text-sm font-semibold text-ink truncate">{lopsided.a} &amp; {lopsided.b}</div>
            </div>
            <p className="text-xs text-muted leading-snug">
              {lopsided.aToBMedian < lopsided.bToAMedian ? (
                <>{lopsided.a} replies in <b className="text-ink tnum">{duration(lopsided.aToBMedian)}</b>, but {lopsided.b} takes <b className="text-ink tnum">{duration(lopsided.bToAMedian)}</b>.</>
              ) : (
                <>{lopsided.b} replies in <b className="text-ink tnum">{duration(lopsided.bToAMedian)}</b>, but {lopsided.a} takes <b className="text-ink tnum">{duration(lopsided.aToBMedian)}</b>.</>
              )}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
