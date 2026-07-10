import { useState } from 'react'
import { FileText, Image as ImageIcon, ShieldCheck } from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/primitives.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { downloadSummaryPNG } from '../../lib/summaryCanvas.js'

/** Lets the user take the results with them — a full print-style PDF of the
 *  whole dashboard, or a one-image PNG summary for sharing. */
export function ExportModal({ open, onClose }) {
  const { analytics, mode } = useApp()
  const [busy, setBusy] = useState(false)

  const exportPDF = () => {
    // Close first so the modal/backdrop never ends up in the printout —
    // print:hidden on Modal's root is a second safety net for this.
    onClose?.()
    setTimeout(() => window.print(), 60)
  }
  const exportPNG = async () => {
    setBusy(true)
    try {
      await downloadSummaryPNG(analytics, mode, `subtext-${mode}-summary.png`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="p-6 md:p-7">
        <h3 className="font-display text-xl font-semibold text-ink">Export your results</h3>
        <p className="text-sm text-muted mt-1">Take the dashboard with you — print it, or share a quick snapshot.</p>

        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          <button onClick={exportPDF}
            className="text-left rounded-2xl border border-line bg-surface-2 p-4 hover:border-hairline transition">
            <span className="grid place-items-center h-10 w-10 rounded-xl bg-accent/10 text-accent-text mb-3">
              <FileText size={18} />
            </span>
            <div className="font-display font-semibold text-ink">PDF report</div>
            <p className="text-[13px] text-muted mt-1">The full dashboard, ready to print or save as PDF.</p>
          </button>

          <button onClick={exportPNG} disabled={busy}
            className="text-left rounded-2xl border border-line bg-surface-2 p-4 hover:border-hairline transition disabled:opacity-60">
            <span className="grid place-items-center h-10 w-10 rounded-xl bg-accent/10 text-accent-text mb-3">
              <ImageIcon size={18} />
            </span>
            <div className="font-display font-semibold text-ink">{busy ? 'Rendering…' : 'PNG summary'}</div>
            <p className="text-[13px] text-muted mt-1">One shareable image with your key stats.</p>
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-5 text-[12px] text-faint">
          <ShieldCheck size={13} className="text-positive" /> Generated on-device — nothing is uploaded.
        </div>
      </div>
    </Modal>
  )
}
