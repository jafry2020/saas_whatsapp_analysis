import { Lock, Sparkles } from 'lucide-react'
import { Button } from '../ui/primitives.jsx'
import { useApp } from '../../context/AppContext.jsx'

/**
 * Wraps premium content. For free users it shows a teaser: the real component
 * rendered behind a blur, with a single, non-nagging upgrade prompt on top.
 */
export function Locked({ children, title = 'A Pro insight', blurb }) {
  const { isPro, openUpgrade } = useApp()
  if (isPro) return children
  return (
    <div className="relative overflow-hidden rounded-[var(--radius)]">
      <div className="pointer-events-none select-none blur-[6px] saturate-[0.8] opacity-60" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-canvas/30 to-canvas/80">
        <div className="text-center px-6 max-w-xs">
          <span className="grid place-items-center h-11 w-11 rounded-xl bg-accent/12 text-accent-text mx-auto mb-3">
            <Lock size={18} />
          </span>
          <div className="font-display font-semibold text-ink">{title}</div>
          {blurb && <p className="text-[13px] text-muted mt-1">{blurb}</p>}
          <Button variant="primary" size="sm" className="mt-4" onClick={openUpgrade}>
            <Sparkles size={14} /> Unlock with Pro
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Inline "Pro" tag for locked section titles. */
export const ProTag = () => (
  <span className="chip-accent text-[10px] py-0.5"><Sparkles size={10} /> Pro</span>
)
