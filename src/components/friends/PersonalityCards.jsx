import { useMemo, useState } from 'react'
import { Download, Sparkles } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { assignArchetypes } from '../../lib/personality.js'
import { downloadPersonalityCard } from '../../lib/personalityCanvas.js'
import { SectionTitle } from '../ui/Card.jsx'
import { Reveal } from '../ui/Reveal.jsx'
import { nameColor } from '../../lib/format.js'

/**
 * Every participant gets their own archetype card — the point being that
 * the chattiest person isn't the only one with something worth sharing.
 * Each card downloads independently, so the share loop scales with group
 * size instead of being capped at one image per chat.
 */
export function PersonalityCards() {
  const { analytics } = useApp()
  const people = useMemo(() => assignArchetypes(analytics), [analytics])
  if (!people.length) return null

  return (
    <section>
      <SectionTitle eyebrow="Your personality cards" title="Everyone gets one"
        description="Your own trading card, built from how you actually text. Download and send it." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {people.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.04}>
            <PersonalityCard person={p} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function PersonalityCard({ person }) {
  const [busy, setBusy] = useState(false)
  const tint = nameColor(person.name)

  const download = async () => {
    setBusy(true)
    try { await downloadPersonalityCard(person) } finally { setBusy(false) }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl clay p-6 text-center grain">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full blur-3xl opacity-25"
        style={{ background: tint }} />
      <div className="relative">
        <div className="mx-auto grid place-items-center h-20 w-20 rounded-full text-4xl clay-well"
          style={{ background: `${tint.replace(/\)$/, ' / 0.14)')}` }}>
          {person.archetype.emoji}
        </div>
        <h3 className="font-display text-xl font-semibold text-ink mt-4 leading-tight">{person.archetype.title}</h3>
        <p className="text-[13px] text-muted mt-1.5 leading-snug min-h-[2.4em]">{person.archetype.tagline}</p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
          style={{ background: `${tint.replace(/\)$/, ' / 0.14)')}` }}>
          <span className="font-display text-sm font-semibold text-ink">{person.name}</span>
        </div>
        <p className="text-xs text-faint mt-2">{person.statLine}</p>

        <button onClick={download} disabled={busy}
          className="mt-5 w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-accent text-on-accent text-sm font-semibold shadow-clay-accent hover:brightness-[1.04] active:translate-y-px transition disabled:opacity-60">
          {busy ? <><Sparkles size={14} className="animate-pulse" /> Rendering…</> : <><Download size={14} /> Download card</>}
        </button>
      </div>
    </div>
  )
}
