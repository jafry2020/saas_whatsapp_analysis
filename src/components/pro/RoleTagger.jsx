import { Users, Building2 } from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { Avatar, Segmented, Button } from '../ui/primitives.jsx'
import { useApp } from '../../context/AppContext.jsx'

/**
 * Lets the user mark who's "us" and who's "the client" — the one piece of
 * context computeAnalytics() can't infer from the transcript alone, and the
 * thing that turns a generic response-time number into a real business SLA.
 * Assignments live in AppContext only (in-memory, reset on new chat).
 */
export function RoleTagger({ open, onClose }) {
  const { analytics, roles, setRole, clearRoles } = useApp()
  const people = analytics.perPerson

  const tagged = Object.keys(roles).length
  const teamCount = Object.values(roles).filter((r) => r === 'team').length
  const clientCount = Object.values(roles).filter((r) => r === 'client').length

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="p-6 md:p-7">
        <h3 className="font-display text-xl font-semibold text-ink">Who's who in this chat?</h3>
        <p className="text-sm text-muted mt-1">
          Tag each person as your team or the client. This unlocks a real first-response SLA —
          "how fast do we reply to them" instead of just "how fast does anyone reply."
        </p>

        <div className="mt-5 space-y-2 max-h-[360px] overflow-y-auto -mx-1 px-1">
          {people.map((p) => (
            <div key={p.name} className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5">
              <Avatar name={p.name} size={32} />
              <span className="text-sm font-medium text-ink flex-1 truncate">{p.name}</span>
              <Segmented
                size="sm"
                value={roles[p.name] || 'none'}
                onChange={(v) => setRole(p.name, v === 'none' ? null : v)}
                options={[
                  { value: 'team', label: 'Team', icon: <Users size={12} /> },
                  { value: 'client', label: 'Client', icon: <Building2 size={12} /> },
                  { value: 'none', label: '—' },
                ]}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-xs text-muted">
            {tagged === 0 ? 'Nobody tagged yet' : `${teamCount} team · ${clientCount} client · ${people.length - tagged} untagged`}
          </div>
          <div className="flex gap-2">
            {tagged > 0 && <Button variant="ghost" size="sm" onClick={clearRoles}>Clear all</Button>}
            <Button variant="primary" size="sm" onClick={onClose}>Done</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
