import { Sun, Moon } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

export function ThemeToggle() {
  const { theme, toggleTheme } = useApp()
  const dark = theme === 'dark'
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="grid place-items-center h-9 w-9 rounded-xl bg-surface text-muted hover:text-ink clay-sm hover:brightness-95 active:translate-y-px transition"
    >
      <span className="relative block h-[18px] w-[18px]">
        <Sun size={18} className={`absolute inset-0 transition-all duration-300 ${dark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100'}`} />
        <Moon size={18} className={`absolute inset-0 transition-all duration-300 ${dark ? 'opacity-100' : 'opacity-0 -rotate-90 scale-50'}`} />
      </span>
    </button>
  )
}
