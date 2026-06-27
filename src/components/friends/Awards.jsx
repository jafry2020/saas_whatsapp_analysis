import { useMemo } from 'react'
import { Trophy } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { computeAwards } from '../../lib/awards.js'
import { SectionTitle } from '../ui/Card.jsx'
import { Avatar } from '../ui/primitives.jsx'
import { Reveal } from '../ui/Reveal.jsx'
import { nameColor } from '../../lib/format.js'

/** The superlatives wall — the heart of Friends mode. */
export function Awards() {
  const { analytics } = useApp()
  const awards = useMemo(() => computeAwards(analytics), [analytics])
  if (!awards.length) return null

  return (
    <section>
      <SectionTitle eyebrow="The Subtext Awards" title="Superlatives nobody asked for"
        description="Generated from the actual data. Screenshot away." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {awards.map((a, i) => (
          <Reveal key={a.id} delay={i * 0.04}>
            <div className="relative h-full card p-5 overflow-hidden group hover:shadow-card transition-shadow grain">
              <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full blur-2xl opacity-20"
                style={{ background: nameColor(a.winner || '?') }} />
              <div className="relative flex items-start justify-between">
                <span className="text-4xl drop-shadow-sm">{a.emoji}</span>
                <Trophy size={16} className="text-faint group-hover:text-accent-text transition-colors" />
              </div>
              <div className="relative mt-4">
                <div className="eyebrow">{a.title}</div>
                <div className="flex items-center gap-2 mt-2">
                  {a.winner && <Avatar name={a.winner} size={26} />}
                  <span className="font-display text-lg font-semibold text-ink">{a.winner}</span>
                </div>
                <div className="text-sm text-accent-text font-medium mt-1">{a.stat}</div>
                <p className="text-[13px] text-muted mt-2 leading-snug">{a.blurb}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
