import { useState } from 'react'
import { HelpCircle, Apple, Smartphone } from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { cn } from '../../lib/format.js'

const STEPS = {
  ios: [
    'Open the chat you want to analyse',
    'Tap the contact or group name at the top',
    'Scroll down and tap “Export Chat”',
    'Choose “Without Media” for a faster, smaller file',
    'Save the .txt to Files, then drop it into Subtext',
  ],
  android: [
    'Open the chat you want to analyse',
    'Tap ⋮ (top-right) → More → Export chat',
    'Choose “Without media”',
    'Save or share the .txt to your computer',
    'Drop the .txt into Subtext',
  ],
}

/** Self-contained "How to export" helper — button + modal. */
export function ExportHelp({ trigger }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('ios')
  return (
    <>
      {trigger ? (
        <button onClick={() => setOpen(true)} className="contents">{trigger}</button>
      ) : (
        <button onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition">
          <HelpCircle size={15} /> How do I export my chat?
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} size="md">
        <div className="p-6 md:p-7">
          <h3 className="font-display text-xl font-semibold text-ink">Export your WhatsApp chat</h3>
          <p className="text-sm text-muted mt-1">It takes about 20 seconds. Pick “Without media” for the cleanest analysis.</p>

          <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 p-1 mt-5">
            {[['ios', 'iPhone', Apple], ['android', 'Android', Smartphone]].map(([k, label, Icon]) => (
              <button key={k} onClick={() => setTab(k)}
                className={cn('inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-sm font-medium transition',
                  tab === k ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink')}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <ol className="mt-5 space-y-3">
            {STEPS[tab].map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid place-items-center h-6 w-6 rounded-full bg-accent/12 text-accent-text text-xs font-semibold shrink-0 tnum">
                  {i + 1}
                </span>
                <span className="text-sm text-ink pt-0.5">{s}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-xl border border-line bg-surface-2 px-4 py-3 text-[13px] text-muted">
            <span className="text-positive font-medium">Private by design.</span> Your file is read in this
            browser tab and never leaves your device — there's no server to send it to.
          </div>
        </div>
      </Modal>
    </>
  )
}
