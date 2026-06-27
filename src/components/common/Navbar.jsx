import { Play, RotateCcw, Sparkles, Crown } from 'lucide-react'
import { Logo } from './Logo.jsx'
import { ModeToggle } from './ModeToggle.jsx'
import { ThemeToggle } from './ThemeToggle.jsx'
import { Button } from '../ui/primitives.jsx'
import { useApp } from '../../context/AppContext.jsx'

/** Top bar shown inside the analytics app (not the landing page). */
export function Navbar() {
  const { mode, reset, isPro, openUpgrade, openWrapped } = useApp()
  return (
    <header className="sticky top-0 z-40 border-b border-line glass">
      <div className="mx-auto max-w-[1400px] h-16 px-4 md:px-6 flex items-center justify-between gap-4">
        <button onClick={reset} className="flex items-center shrink-0" title="Start over">
          <Logo size={26} />
        </button>

        <div className="hidden md:block"><ModeToggle /></div>

        <div className="flex items-center gap-2">
          {mode === 'friends' && (
            <Button variant="primary" size="sm" onClick={openWrapped} className="hidden sm:inline-flex">
              <Play size={14} /> Play Wrapped
            </Button>
          )}
          {isPro ? (
            <span className="chip-accent"><Crown size={12} /> Pro</span>
          ) : (
            <Button variant="outline" size="sm" onClick={openUpgrade}>
              <Sparkles size={14} /> Upgrade
            </Button>
          )}
          <ThemeToggle />
          <button onClick={reset} title="New chat"
            className="grid place-items-center h-9 w-9 rounded-xl bg-surface text-muted hover:text-ink clay-sm hover:brightness-95 active:translate-y-px transition">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <div className="md:hidden border-t border-line px-4 py-2 flex justify-center"><ModeToggle size="sm" /></div>
    </header>
  )
}
