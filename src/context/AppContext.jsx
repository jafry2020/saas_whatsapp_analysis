import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { computeAnalytics } from '../lib/analytics.js'

/**
 * AppContext — the single source of truth for everything cross-cutting:
 * which product mode we're in, the colour theme, the (mocked) plan tier, the
 * parsed dataset, the focused participant, and modal state. All parsed data is
 * held here in memory only — never persisted, never sent anywhere.
 */
const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [mode, setMode] = useState('pro') // 'friends' | 'pro'
  const [theme, setTheme] = useState('dark') // 'light' | 'dark'
  const [tier, setTier] = useState('free') // 'free' | 'pro'  (mocked billing)
  const [stage, setStage] = useState('landing') // 'landing' | 'app'
  const [parsed, setParsed] = useState(null)
  const [focus, setFocus] = useState(null) // participant name to filter by
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [wrappedOpen, setWrappedOpen] = useState(false)

  // Reflect mode/theme onto <html> so the CSS-variable design system cascades.
  useEffect(() => {
    const el = document.documentElement
    el.setAttribute('data-mode', mode)
    el.classList.toggle('dark', theme === 'dark')
    el.style.colorScheme = theme
  }, [mode, theme])

  // Heavy computation, memoised against the dataset.
  const analytics = useMemo(() => (parsed ? computeAnalytics(parsed) : null), [parsed])

  const loadParsed = useCallback((p) => {
    setParsed(p)
    setFocus(null)
    setStage('app')
  }, [])

  const reset = useCallback(() => {
    setParsed(null)
    setFocus(null)
    setStage('landing')
  }, [])

  const value = {
    mode, setMode,
    theme, setTheme,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    tier, setTier,
    upgrade: () => { setTier('pro'); setUpgradeOpen(false) },
    isPro: tier === 'pro',
    stage, setStage,
    parsed, analytics, loadParsed, reset,
    focus, setFocus,
    toggleFocus: (name) => setFocus((f) => (f === name ? null : name)),
    upgradeOpen, openUpgrade: () => setUpgradeOpen(true), closeUpgrade: () => setUpgradeOpen(false),
    wrappedOpen, openWrapped: () => setWrappedOpen(true), closeWrapped: () => setWrappedOpen(false),
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
