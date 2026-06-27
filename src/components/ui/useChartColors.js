import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'

/** Resolve design-system CSS variables to concrete rgb() strings for Recharts
 *  (SVG presentation attributes can't read CSS vars), refreshed on theme/mode. */
function read() {
  const s = getComputedStyle(document.documentElement)
  const t = (n) => {
    const [a, b, c] = s.getPropertyValue(n).trim().split(/\s+/).map(Number)
    return `rgb(${a},${b},${c})`
  }
  return {
    accent: t('--accent'), accent2: t('--accent-2'), accent3: t('--accent-3'),
    ink: t('--ink'), muted: t('--muted'), faint: t('--faint'), line: t('--line'),
    positive: t('--positive'), negative: t('--negative'), surface: t('--surface'),
  }
}

export function useChartColors() {
  const { theme, mode } = useApp()
  const [c, setC] = useState(read)
  useEffect(() => { setC(read()) }, [theme, mode])
  return c
}
