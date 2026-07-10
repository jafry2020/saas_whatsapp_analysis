import { useEffect, useRef, useState } from 'react'
import { CalendarRange, Check, ChevronDown } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { RANGE_PRESETS } from '../../lib/dateFilter.js'
import { cn } from '../../lib/format.js'

/**
 * Narrows the whole dashboard to a time window — "Wrapped 2025" or "last
 * quarter's report" only mean something once this exists. Presets are
 * resolved against the chat's own last message (see lib/dateFilter.js), not
 * today's real date, so "last 30 days" works on a chat from any point in time.
 */
export function DateRangeFilter() {
  const { rangePreset, setRangePreset } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open])

  const current = RANGE_PRESETS.find((p) => p.value === rangePreset) || RANGE_PRESETS[0]

  return (
    <div className="relative print:hidden" ref={ref}>
      <button onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-surface text-sm text-ink clay-sm hover:brightness-95 active:translate-y-px transition',
          rangePreset !== 'all' && 'text-accent-text',
        )}>
        <CalendarRange size={14} />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 sm:left-0 top-full mt-2 w-44 rounded-xl bg-surface clay p-1.5 z-50 animate-scale-in origin-top-right sm:origin-top-left">
          {RANGE_PRESETS.map((p) => (
            <button key={p.value} onClick={() => { setRangePreset(p.value); setOpen(false) }}
              className={cn(
                'w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-left transition',
                p.value === rangePreset ? 'bg-accent/10 text-accent-text font-medium' : 'text-muted hover:text-ink hover:bg-surface-2',
              )}>
              {p.label}
              {p.value === rangePreset && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
