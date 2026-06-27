import { Check, Sparkles, Zap } from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/primitives.jsx'
import { useApp } from '../../context/AppContext.jsx'

const FREE = ['Core stats & overview', 'Activity timeline', 'Up to 5 participants', 'Friends Wrapped story']
const PRO = [
  'Unlimited participants',
  'Response-time SLAs & dynamics',
  'Sentiment trends over time',
  'Relationship graph filtering',
  'Full PDF / CSV report export',
  'Professional-grade dashboards',
]

/** Mocked upsell. The "upgrade" just flips the in-memory tier flag. */
export function UpgradeModal() {
  const { upgradeOpen, closeUpgrade, upgrade } = useApp()
  return (
    <Modal open={upgradeOpen} onClose={closeUpgrade} size="lg">
      <div className="p-6 md:p-8">
        <div className="chip-accent w-fit mb-4"><Sparkles size={13} /> Subtext Pro</div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-ink">
          Go deeper than the headline numbers
        </h2>
        <p className="text-muted mt-2 max-w-lg">
          Unlock the analytics that turn a chat export into a decision-making tool —
          built for teams, support, sales and community managers.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mt-7">
          <div className="rounded-xl2 border border-line p-5">
            <div className="text-sm font-semibold text-ink">Free</div>
            <div className="font-display text-3xl mt-1 text-ink">$0</div>
            <ul className="mt-4 space-y-2">
              {FREE.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted">
                  <Check size={16} className="text-faint mt-0.5 shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl2 border-2 border-accent/40 bg-accent/[0.04] p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 chip-accent rounded-none rounded-bl-xl">Most popular</div>
            <div className="text-sm font-semibold text-accent-text">Pro</div>
            <div className="font-display text-3xl mt-1 text-ink">$12<span className="text-base text-muted font-sans">/mo</span></div>
            <ul className="mt-4 space-y-2">
              {PRO.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink">
                  <Check size={16} className="text-accent-text mt-0.5 shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-7">
          <Button variant="primary" size="lg" className="flex-1" onClick={upgrade}>
            <Zap size={16} /> Upgrade to Pro
          </Button>
          <Button variant="ghost" size="lg" onClick={closeUpgrade}>Maybe later</Button>
        </div>
        <p className="text-[11px] text-faint text-center mt-3">
          Demo build — no payment is taken. Upgrading simply unlocks the features locally.
        </p>
      </div>
    </Modal>
  )
}
