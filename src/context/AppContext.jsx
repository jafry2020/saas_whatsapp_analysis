import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { computeAnalytics } from '../lib/analytics.js'
import { filterParsed, resolvePreset } from '../lib/dateFilter.js'

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
  const [roles, setRoles] = useState({}) // { [participantName]: 'team' | 'client' } — Pro-only, in-memory
  const [rangePreset, setRangePreset] = useState('all') // see lib/dateFilter.js RANGE_PRESETS
  const [evidence, setEvidence] = useState(null) // { title, messages } | null — "show me the receipts" drill-down
  const [quizOpen, setQuizOpen] = useState(false)

  // Reflect mode/theme onto <html> so the CSS-variable design system cascades.
  useEffect(() => {
    const el = document.documentElement
    el.setAttribute('data-mode', mode)
    el.classList.toggle('dark', theme === 'dark')
    el.style.colorScheme = theme
  }, [mode, theme])

  // The date-range preset narrows the whole app to a time window — resolved
  // against this chat's own last message, not real-world "today" (see
  // lib/dateFilter.js). `viewParsed` is what every downstream consumer
  // (analytics, the parse-summary chip, role-based SLA) should read instead
  // of raw `parsed`, so a filter selection is reflected everywhere at once.
  const currentRange = useMemo(
    () => resolvePreset(rangePreset, parsed?.stats.lastDate ?? null),
    [rangePreset, parsed],
  )
  const viewParsed = useMemo(
    () => (parsed ? filterParsed(parsed, currentRange) : null),
    [parsed, currentRange],
  )

  // Heavy computation, memoised against the (possibly filtered) dataset.
  const analytics = useMemo(() => (viewParsed ? computeAnalytics(viewParsed) : null), [viewParsed])

  const loadParsed = useCallback((p) => {
    setParsed(p)
    setFocus(null)
    setRoles({})
    setRangePreset('all')
    setStage('app')
  }, [])

  const reset = useCallback(() => {
    setParsed(null)
    setFocus(null)
    setRoles({})
    setRangePreset('all')
    setStage('landing')
  }, [])

  const setRole = useCallback((name, role) => {
    setRoles((r) => {
      if (role == null) { const n = { ...r }; delete n[name]; return n }
      return { ...r, [name]: role }
    })
  }, [])

  const value = {
    mode, setMode,
    theme, setTheme,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    tier, setTier,
    upgrade: () => { setTier('pro'); setUpgradeOpen(false) },
    isPro: tier === 'pro',
    stage, setStage,
    parsed, viewParsed, analytics, loadParsed, reset,
    rangePreset, setRangePreset, currentRange,
    focus, setFocus,
    toggleFocus: (name) => setFocus((f) => (f === name ? null : name)),
    upgradeOpen, openUpgrade: () => setUpgradeOpen(true), closeUpgrade: () => setUpgradeOpen(false),
    wrappedOpen, openWrapped: () => setWrappedOpen(true), closeWrapped: () => setWrappedOpen(false),
    roles, setRole, clearRoles: () => setRoles({}),
    evidence, openEvidence: (title, messages) => setEvidence({ title, messages }), closeEvidence: () => setEvidence(null),
    quizOpen, openQuiz: () => setQuizOpen(true), closeQuiz: () => setQuizOpen(false),
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
