import { useEffect, useRef, useState } from 'react'

const EASE_OUT = (t) => 1 - Math.pow(1 - t, 3) // matches the app's swift-out feel

/**
 * Animates a number counting up from 0 on mount — used for the big Wrapped
 * stats so they land with a little momentum instead of just appearing.
 * Re-triggers automatically since each slide remounts via `key={i}` in the
 * parent, so no IntersectionObserver/visibility plumbing is needed here.
 */
export function CountUp({ value, duration = 900, format = (n) => Math.round(n).toLocaleString(), className }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      setDisplay(value * EASE_OUT(t))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])

  return <span className={className}>{format(display)}</span>
}
