import {
  ScanText, Network, Sparkles, Gauge, HeartPulse, ShieldCheck,
  ArrowRight, Lock, Server, EyeOff, Trophy, Timer, Quote,
} from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Logo } from '../common/Logo.jsx'
import { ModeToggle } from '../common/ModeToggle.jsx'
import { ThemeToggle } from '../common/ThemeToggle.jsx'
import { Hero } from './Hero.jsx'
import { Uploader } from '../upload/Uploader.jsx'
import { ExportHelp } from '../upload/ExportHelp.jsx'
import { Button, Avatar } from '../ui/primitives.jsx'
import { Card } from '../ui/Card.jsx'
import { Reveal } from '../ui/Reveal.jsx'

const FEATURES = [
  { icon: ScanText, title: 'Bulletproof parsing', body: 'iPhone & Android, 12h/24h clocks, every date format, multi-line, edits, deletes, media — handled and reported.' },
  { icon: Gauge, title: 'Metrics that matter', body: 'Volume, response times, active hours, streaks, longest silences and participation balance — per person and overall.' },
  { icon: Network, title: 'Relationship graph', body: 'A force-directed map of who talks to whom. Drag, zoom and click a person to filter the entire dashboard.' },
  { icon: HeartPulse, title: 'Sentiment over time', body: 'A lightweight, on-device lexicon scores mood per person and across months. No models, no API calls.' },
  { icon: Sparkles, title: 'Wrapped, but yours', body: 'A full-screen, swipeable story of your chat — designed to be screenshotted and shared. One tap to PNG.' },
  { icon: ShieldCheck, title: 'Private by architecture', body: 'There is no upload. Your export is parsed in this tab and held only in memory. Close it and it’s gone.' },
]

export function Landing() {
  return (
    <div className="relative grain min-h-screen">
      <MarketingNav />
      <Hero />
      <LogoBand />
      <Features />
      <ModeShowcase />
      <Privacy />
      <SocialProof />
      <FinalCta />
      <Footer />
    </div>
  )
}

function MarketingNav() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  return (
    <header className="sticky top-0 z-40 border-b border-line glass">
      <div className="mx-auto max-w-[1400px] h-16 px-4 md:px-6 flex items-center justify-between">
        <Logo size={26} />
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted">
          <button onClick={() => scrollTo('features')} className="hover:text-ink transition">Features</button>
          <button onClick={() => scrollTo('modes')} className="hover:text-ink transition">Two modes</button>
          <button onClick={() => scrollTo('privacy')} className="hover:text-ink transition">Privacy</button>
        </nav>
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block"><ModeToggle size="sm" /></div>
          <ThemeToggle />
          <Button variant="primary" size="sm" onClick={() => scrollTo('start')}>Analyze a chat</Button>
        </div>
      </div>
    </header>
  )
}

function LogoBand() {
  return (
    <div className="border-y border-line bg-surface/40">
      <div className="mx-auto max-w-[1400px] px-6 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
        <span className="text-[12px] text-faint uppercase tracking-[0.18em]">Trusted by chat-obsessed teams at</span>
        {['Northwind', 'Lattice', 'Foundry', 'Helio', 'Cohort', 'Mainline'].map((n) => (
          <span key={n} className="font-display text-lg font-semibold text-faint/70">{n}</span>
        ))}
      </div>
    </div>
  )
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-[1400px] px-4 md:px-6 py-20 md:py-28">
      <Reveal>
        <div className="eyebrow mb-3">Everything in one pass</div>
        <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink max-w-2xl">
          A serious analytics engine behind a delightful surface.
        </h2>
      </Reveal>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mt-12">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.05}>
            <Card hover className="h-full">
              <span className="grid place-items-center h-11 w-11 rounded-xl bg-accent/10 text-accent-text mb-4">
                <f.icon size={20} />
              </span>
              <h3 className="font-display text-lg font-semibold text-ink">{f.title}</h3>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{f.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function ModeShowcase() {
  const { mode } = useApp()
  return (
    <section id="modes" className="relative border-y border-line bg-surface/40">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-20 md:py-28">
        <Reveal className="text-center max-w-2xl mx-auto">
          <div className="eyebrow mb-3">Two products, one upload</div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink">
            Playful for friends. Precise for work.
          </h2>
          <p className="text-muted mt-3">
            Flip the switch and the entire experience changes — type, colour, motion and the metrics themselves.
          </p>
          <div className="flex justify-center mt-6"><ModeToggle /></div>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-5 mt-12">
          <Reveal>
            <Card className={`h-full ${mode === 'friends' ? 'ring-2 ring-accent/40' : ''}`}>
              <div className="chip-accent w-fit mb-4"><Sparkles size={13} /> Friends mode</div>
              <h3 className="font-display text-xl font-semibold text-ink">Spotify Wrapped for the group chat</h3>
              <p className="text-sm text-muted mt-1.5">Awards, emoji leaderboards, laughter analysis and a swipeable story built to share.</p>
              <div className="grid grid-cols-3 gap-3 mt-5">
                {[['🗣️', 'The Yapper', 'Maya'], ['🦉', 'Night Owl', 'Leo'], ['🤣', 'Comedian', 'Priya']].map(([e, t, w]) => (
                  <div key={t} className="clay-well p-3 text-center">
                    <div className="text-2xl">{e}</div>
                    <div className="eyebrow mt-2">{t}</div>
                    <div className="text-sm font-semibold text-ink mt-0.5">{w}</div>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
          <Reveal delay={0.06}>
            <Card className={`h-full ${mode === 'pro' ? 'ring-2 ring-accent/40' : ''}`}>
              <div className="chip w-fit mb-4"><Gauge size={13} /> Pro mode</div>
              <h3 className="font-display text-xl font-semibold text-ink">Analytics teams can act on</h3>
              <p className="text-sm text-muted mt-1.5">Response SLAs, engagement trends, balance metrics and an exportable report.</p>
              <div className="space-y-2.5 mt-5">
                {[['Median first response', '3m 12s', Timer], ['SLA met (under 15m)', '92%', Gauge], ['Engagement trend', '+18% MoM', Trophy]].map(([l, v, Icon]) => (
                  <div key={l} className="flex items-center justify-between clay-well px-4 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-muted"><Icon size={15} /> {l}</span>
                    <span className="font-display text-ink tnum">{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Privacy() {
  const points = [
    { icon: Server, title: 'No server, no upload', body: 'There is literally nowhere for your data to go. The app is static files; parsing happens in your browser.' },
    { icon: EyeOff, title: 'Held in memory only', body: 'Nothing is written to disk or localStorage. Refresh the tab and every message is gone for good.' },
    { icon: Lock, title: 'Yours to export', body: 'Reports are generated on-device. You decide what — if anything — ever leaves your machine.' },
  ]
  return (
    <section id="privacy" className="mx-auto max-w-[1400px] px-4 md:px-6 py-20 md:py-28">
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
        <Reveal>
          <div className="chip-accent w-fit mb-4"><ShieldCheck size={13} /> Privacy-first</div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink">
            Your conversations never leave this tab.
          </h2>
          <p className="text-muted mt-4 max-w-lg">
            Most “analyzers” ask you to upload your private messages to a stranger’s server. Subtext doesn’t —
            it can’t. Everything you see is computed locally, in front of you.
          </p>
          <div className="mt-6"><ExportHelp /></div>
        </Reveal>
        <div className="grid gap-4">
          {points.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06}>
              <Card className="flex items-start gap-4">
                <span className="grid place-items-center h-11 w-11 rounded-xl bg-positive/10 text-positive shrink-0">
                  <p.icon size={20} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">{p.title}</h3>
                  <p className="text-sm text-muted mt-1">{p.body}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function SocialProof() {
  const quotes = [
    { q: 'We finally saw which support threads were silently breaking SLA. Paid for itself in a week.', n: 'Dana R.', r: 'Head of CX, Helio' },
    { q: 'Sent our group the Wrapped and it absolutely went off. Three friends signed up that night.', n: 'Marco P.', r: 'Chronic group-chat starter' },
    { q: 'The relationship graph made our community dynamics obvious in a way spreadsheets never did.', n: 'Aisha K.', r: 'Community Lead, Cohort' },
  ]
  return (
    <section className="border-y border-line bg-surface/40">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-20">
        <div className="grid md:grid-cols-3 gap-5">
          {quotes.map((t, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <Card className="h-full flex flex-col">
                <Quote size={22} className="text-accent-text" />
                <p className="text-[15px] text-ink mt-3 leading-relaxed flex-1">“{t.q}”</p>
                <div className="flex items-center gap-3 mt-5">
                  <Avatar name={t.n} size={36} />
                  <div>
                    <div className="text-sm font-semibold text-ink">{t.n}</div>
                    <div className="text-xs text-muted">{t.r}</div>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
        <p className="text-center text-[11px] text-faint mt-6">Illustrative testimonials shown for this demo build.</p>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section id="start" className="mx-auto max-w-[1400px] px-4 md:px-6 py-24">
      <Reveal className="relative overflow-hidden rounded-4xl border border-line bg-surface p-8 md:p-14 text-center grain">
        <div className="relative">
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-ink">
            See what your chats have been saying.
          </h2>
          <p className="text-muted mt-3 max-w-md mx-auto">Free to try. No account. No upload. Just drop a file.</p>
          <div className="mt-8 flex flex-col items-center">
            <Uploader />
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function Footer() {
  const cols = {
    Product: ['Features', 'Two modes', 'Pricing', 'Changelog'],
    Company: ['About', 'Blog', 'Careers', 'Contact'],
    Legal: ['Privacy', 'Terms', 'Security', 'GDPR'],
  }
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-14 grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
        <div>
          <Logo size={26} />
          <p className="text-sm text-muted mt-3 max-w-xs">Read between the lines of every conversation — privately.</p>
          <div className="flex items-center gap-1.5 mt-4 text-[12px] text-positive">
            <ShieldCheck size={13} /> 100% on-device · nothing uploaded
          </div>
        </div>
        {Object.entries(cols).map(([head, items]) => (
          <div key={head}>
            <div className="eyebrow mb-3">{head}</div>
            <ul className="space-y-2">
              {items.map((i) => <li key={i}><span className="text-sm text-muted hover:text-ink transition cursor-pointer">{i}</span></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-faint">
          <span>© {new Date().getFullYear()} Subtext. A demo build — not affiliated with WhatsApp.</span>
          <span className="font-mono">v1.0 · made with craft</span>
        </div>
      </div>
    </footer>
  )
}
