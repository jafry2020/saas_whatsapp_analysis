import { useMemo, useState } from 'react'
import { UserCheck, Timer, Gauge, AlertTriangle, Tag } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { computeClientSLA } from '../../lib/roleAnalytics.js'
import { Card, CardHeader } from '../ui/Card.jsx'
import { Avatar, Button, ProgressRing } from '../ui/primitives.jsx'
import { RoleTagger } from './RoleTagger.jsx'
import { duration, comma, fmtDate } from '../../lib/format.js'

/**
 * The client-facing SLA — how fast the TEAM replies to the CLIENT, not the
 * generic "anyone replies to anyone" number the rest of the app shows.
 * Needs roles tagged first (see RoleTagger); shows a prompt until then.
 */
export function ClientSLA() {
  const { viewParsed, roles, openEvidence } = useApp()
  const [taggerOpen, setTaggerOpen] = useState(false)
  const sla = useMemo(() => computeClientSLA(viewParsed.messages, roles), [viewParsed, roles])

  if (!sla.ready) {
    return (
      <Card className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <span className="grid place-items-center h-14 w-14 rounded-2xl bg-accent/10 text-accent-text shrink-0">
          <Tag size={24} />
        </span>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-ink">Get your real client SLA</h3>
          <p className="text-sm text-muted mt-1">
            Tag who's your team and who's the client to see actual first-response times —
            not just "how fast does anyone reply."
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setTaggerOpen(true)}>Tag participants</Button>
        <RoleTagger open={taggerOpen} onClose={() => setTaggerOpen(false)} />
      </Card>
    )
  }

  const cards = [
    { label: 'Client-facing response', value: duration(sla.median), icon: Timer, accent: true },
    { label: 'Under 15 min', value: `${Math.round(sla.under15 * 100)}%`, ring: sla.under15 },
    { label: 'Under 1 hour', value: `${Math.round(sla.under60 * 100)}%`, ring: sla.under60 },
    { label: 'Unanswered', value: comma(sla.unanswered.length), icon: AlertTriangle, warn: sla.unanswered.length > 0 },
  ]

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="eyebrow flex items-center gap-1.5"><UserCheck size={12} /> Client SLA · {sla.teamCount} team · {sla.clientCount} client</div>
        <Button variant="ghost" size="sm" onClick={() => setTaggerOpen(true)}>Edit tags</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="flex items-center gap-4">
            {c.ring != null ? (
              <ProgressRing value={c.ring} size={52}>{Math.round(c.ring * 100)}%</ProgressRing>
            ) : (
              <span className={`grid place-items-center h-11 w-11 rounded-xl shrink-0 ${c.warn ? 'bg-negative/10 text-negative' : 'bg-accent/10 text-accent-text'}`}>
                <c.icon size={19} />
              </span>
            )}
            <div className="min-w-0">
              <div className={`font-display text-xl tnum leading-none ${c.accent ? 'text-accent-text' : 'text-ink'}`}>{c.value}</div>
              <div className="text-[11px] text-faint uppercase tracking-wide mt-1.5">{c.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader icon={UserCheck} title="Per-agent response time" subtitle="Median time to reply to a client" />
          {sla.perAgent.length ? (
            <div className="space-y-2.5">
              {sla.perAgent.map((a) => (
                <div key={a.name} className="flex items-center gap-3">
                  <Avatar name={a.name} size={26} />
                  <span className="text-sm text-ink flex-1 truncate">{a.name}</span>
                  <span className="text-xs text-faint tnum">{comma(a.count)} replies</span>
                  <span className="text-sm font-medium text-ink tnum w-16 text-right">{duration(a.median)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted">No team replies to clients found yet.</p>}
        </Card>

        <Card>
          <CardHeader icon={AlertTriangle} title="Unanswered from clients" subtitle="Still waiting on a reply" />
          {sla.unanswered.length ? (
            <div className="space-y-2">
              {sla.unanswered.slice(0, 6).map((u, i) => (
                <button key={i} onClick={() => {
                  const windowMs = 10 * 60 * 1000
                  const matches = viewParsed.messages.filter(
                    (m) => m.ts >= new Date(u.ts.getTime() - 60 * 1000) && m.ts <= new Date(u.ts.getTime() + windowMs),
                  )
                  openEvidence(`Unanswered — ${u.name}`, matches)
                }} className="w-full text-left rounded-lg bg-surface-2 px-3 py-2 hover:bg-surface transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-ink">{u.name}</span>
                    <span className="text-[11px] text-faint tnum shrink-0">{fmtDate(u.ts)}</span>
                  </div>
                  <p className="text-[13px] text-muted mt-0.5 truncate">{u.body || '(media)'}</p>
                </button>
              ))}
              {sla.unanswered.length > 6 && (
                <p className="text-xs text-faint text-center pt-1">+{sla.unanswered.length - 6} more</p>
              )}
            </div>
          ) : <p className="text-sm text-positive">Every client message got a reply. 🎉</p>}
        </Card>
      </div>

      <RoleTagger open={taggerOpen} onClose={() => setTaggerOpen(false)} />
    </section>
  )
}
