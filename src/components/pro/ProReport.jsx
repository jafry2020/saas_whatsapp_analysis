import { FileDown, Printer, Timer, Gauge, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, SectionTitle } from '../ui/Card.jsx'
import { Button, ProgressRing } from '../ui/primitives.jsx'
import { duration, comma, fmtMonth, cn } from '../../lib/format.js'

/** Pro-grade SLA + engagement summary with one-click export. */
export function ProReport() {
  const { analytics, isPro, openUpgrade } = useApp()
  const { sla } = analytics

  // Month-over-month engagement (shared with the Overview tile).
  const ms = analytics.monthlySeries
  const last = ms[ms.length - 1]
  const mom = analytics.totals.engagementMoM

  const exportCSV = () => {
    if (!isPro) return openUpgrade()
    download('subtext-report.csv', toCSV(analytics), 'text/csv')
  }
  const exportPDF = () => {
    if (!isPro) return openUpgrade()
    window.print()
  }

  const slaCards = [
    { label: 'Median first response', value: duration(sla.median), icon: Timer },
    { label: 'Replies under 15 min', value: `${Math.round(sla.under15 * 100)}%`, ring: sla.under15 },
    { label: 'Replies under 1 hour', value: `${Math.round(sla.under60 * 100)}%`, ring: sla.under60 },
    { label: '90th percentile', value: duration(sla.p90), icon: Gauge },
  ]

  return (
    <section className="space-y-6">
      <SectionTitle eyebrow="Professional report" title="Service levels & engagement"
        description="The metrics that matter when conversations are part of the job."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportCSV}><FileDown size={15} /> CSV</Button>
            <Button variant="primary" size="sm" onClick={exportPDF}><Printer size={15} /> Export report</Button>
          </div>
        } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {slaCards.map((c) => (
          <Card key={c.label} className="flex items-center gap-4">
            {c.ring != null ? (
              <ProgressRing value={c.ring} size={56}>{Math.round(c.ring * 100)}%</ProgressRing>
            ) : (
              <span className="grid place-items-center h-12 w-12 rounded-xl bg-accent/10 text-accent-text shrink-0"><c.icon size={20} /></span>
            )}
            <div className="min-w-0">
              <div className="font-display text-xl text-ink tnum leading-none">{c.value}</div>
              <div className="text-[11px] text-faint uppercase tracking-wide mt-1.5">{c.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader icon={mom >= 0 ? TrendingUp : TrendingDown} title="Engagement trend" subtitle="Latest month vs previous" />
          <div className={cn('font-display text-4xl tnum', mom >= 0 ? 'text-positive' : 'text-negative')}>
            {mom >= 0 ? '+' : ''}{mom.toFixed(0)}%
          </div>
          <div className="text-sm text-muted mt-2">
            {last && <>{comma(last.count)} messages in {fmtMonth(last.date)}</>}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader icon={BarChart3} title="Per-person summary" subtitle="Included in the exported report" />
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-faint">
                  {['Person', 'Messages', 'Share', 'Med. reply', 'Starts', 'Sentiment'].map((h) => (
                    <th key={h} className="font-medium uppercase tracking-wide text-[10px] py-2 px-1">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics.perPerson.map((p) => (
                  <tr key={p.name} className="border-t border-line">
                    <td className="py-2 px-1 font-medium text-ink">{p.name}</td>
                    <td className="py-2 px-1 tnum text-muted">{comma(p.messages)}</td>
                    <td className="py-2 px-1 tnum text-muted">{p.sharePct.toFixed(1)}%</td>
                    <td className="py-2 px-1 tnum text-muted">{duration(p.medianResponseSec)}</td>
                    <td className="py-2 px-1 tnum text-muted">{p.starts}</td>
                    <td className="py-2 px-1 tnum">
                      <span className={p.sentiment > 0.04 ? 'text-positive' : p.sentiment < -0.04 ? 'text-negative' : 'text-muted'}>
                        {p.sentiment > 0 ? '+' : ''}{p.sentiment.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  )
}

/* ---- export helpers ---- */
function toCSV(a) {
  const head = ['Name', 'Messages', 'Share %', 'Words', 'Avg words/msg', 'Media', 'Emojis', 'Links', 'Questions', 'Median reply (s)', 'Starts', 'Ends', 'Sentiment']
  const rows = a.perPerson.map((p) => [p.name, p.messages, p.sharePct.toFixed(1), p.words, p.avgWords.toFixed(2),
    p.media, p.emojis, p.links, p.questions, Math.round(p.medianResponseSec), p.starts, p.ends, p.sentiment.toFixed(3)])
  return [head, ...rows].map((r) => r.map(cell).join(',')).join('\n')
}
const cell = (v) => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
function download(name, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}
