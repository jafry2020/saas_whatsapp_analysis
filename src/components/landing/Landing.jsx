import { ShieldCheck } from 'lucide-react'
import { Logo } from '../common/Logo.jsx'
import { ModeToggle } from '../common/ModeToggle.jsx'
import { ThemeToggle } from '../common/ThemeToggle.jsx'
import { Hero } from './Hero.jsx'
import { Button } from '../ui/primitives.jsx'

/**
 * Deliberately short: headline, one line of context, the uploader, gone.
 * No feature grid, no fake logos, no fake testimonials — the product mock
 * in the hero shows what it does; the privacy line is inline, not a pitch.
 */
export function Landing() {
  return (
    <div className="relative grain min-h-screen">
      <MarketingNav />
      <Hero />
      <MinimalFooter />
    </div>
  )
}

function MarketingNav() {
  const scrollToHero = () => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })
  return (
    <header className="sticky top-0 z-40 border-b border-line glass">
      <div className="mx-auto max-w-[1400px] h-16 px-4 md:px-6 flex items-center justify-between">
        <Logo size={26} />
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block"><ModeToggle size="sm" /></div>
          <ThemeToggle />
          <Button variant="primary" size="sm" onClick={scrollToHero}>Analyze a chat</Button>
        </div>
      </div>
    </header>
  )
}

function MinimalFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size={24} />
        <div className="flex items-center gap-1.5 text-[12px] text-positive">
          <ShieldCheck size={13} /> 100% on-device · nothing uploaded
        </div>
        <span className="text-xs text-faint">© {new Date().getFullYear()} Subtext</span>
      </div>
    </footer>
  )
}
