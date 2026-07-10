import { MessageSquareText, Image as ImageIcon } from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { Avatar } from '../ui/primitives.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { comma } from '../../lib/format.js'

const CAP = 100
const fmtTime = (d) => d.toLocaleString(undefined, {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
})

/**
 * "Show me the receipts" — every stat in this app boils down to specific
 * messages. This is the generic viewer for them: call openEvidence(title,
 * messages) from anywhere with the exact messages that back a number, and
 * the user can actually read what happened instead of just trusting a stat.
 */
export function EvidenceModal() {
  const { evidence, closeEvidence } = useApp()
  const open = !!evidence
  const messages = evidence?.messages || []
  const shown = messages.slice(0, CAP)

  return (
    <Modal open={open} onClose={closeEvidence} size="lg">
      <div className="p-6 md:p-7 flex flex-col max-h-[80vh]">
        <div className="flex items-center gap-2 shrink-0">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-accent/10 text-accent-text">
            <MessageSquareText size={17} />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink leading-tight">{evidence?.title || 'Messages'}</h3>
            <p className="text-xs text-muted">{comma(messages.length)} {messages.length === 1 ? 'message' : 'messages'}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5 overflow-y-auto -mx-1 px-1">
          {shown.length === 0 && (
            <p className="text-sm text-muted text-center py-8">No messages found for this.</p>
          )}
          {shown.map((m, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl bg-surface-2 px-3.5 py-2.5">
              <Avatar name={m.author} size={28} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-ink">{m.author}</span>
                  <span className="text-[11px] text-faint shrink-0">{fmtTime(m.ts)}</span>
                </div>
                {m.type === 'media' ? (
                  <div className="flex items-center gap-1.5 text-sm text-muted mt-0.5"><ImageIcon size={13} /> media</div>
                ) : (
                  <p className="text-sm text-ink mt-0.5 leading-snug whitespace-pre-wrap break-words">{m.body || '(deleted)'}</p>
                )}
              </div>
            </div>
          ))}
          {messages.length > CAP && (
            <p className="text-xs text-faint text-center pt-1">+{comma(messages.length - CAP)} more messages not shown</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
