import { Smartphone, FileCheck2, CalendarDays, X, Play, Sparkles } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Overview } from './Overview.jsx'
import { Timeline } from './Timeline.jsx'
import { Heatmap } from './Heatmap.jsx'
import { WeekdayActivity } from './WeekdayActivity.jsx'
import { ResponseTrend } from './ResponseTrend.jsx'
import { People } from './People.jsx'
import { Graph } from './Graph.jsx'
import { Sentiment } from './Sentiment.jsx'
import { ResponseTimes, Balance, ConversationFlow, Highlights } from './Dynamics.jsx'
import { TopWords, EmojiLeaderboard } from './Extras.jsx'
import { Awards } from '../friends/Awards.jsx'
import { ProReport } from '../pro/ProReport.jsx'
import { Locked } from '../common/Locked.jsx'
import { Card, SectionTitle } from '../ui/Card.jsx'
import { Button, Avatar } from '../ui/primitives.jsx'
import { fmtDate, comma } from '../../lib/format.js'

/** Pulls every visualisation together. Layout & emphasis change with mode;
 *  advanced cards are gated for free users. */
export function Dashboard() {
  const { analytics, parsed, mode, focus, setFocus, isPro, openWrapped } = useApp()
  const a = analytics
  const friends = mode === 'friends'

  return (
    <main className="mx-auto max-w-[1400px] px-4 md:px-6 py-6 md:py-10 space-y-10 md:space-y-14 grain">
      <ParseSummary stats={parsed.stats} totals={a.totals} />

      {focus && (
        <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-accent/[0.05] px-4 py-2.5 -mb-4 animate-fade-up">
          <div className="flex items-center gap-2.5">
            <Avatar name={focus} size={26} />
            <span className="text-sm text-ink">Filtering the dashboard to <b>{focus}</b></span>
          </div>
          <button onClick={() => setFocus(null)} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <X size={14} /> Clear
          </button>
        </div>
      )}

      <Overview />

      {friends ? (
        /* -------- FRIENDS: identity-first, narrative, fully free ---------- */
        <>
          <WrappedBanner onPlay={openWrapped} />
          <Awards />
          <People />
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            <EmojiLeaderboard />
            <TopWords />
          </div>
          {/* Mood is fun + shareable — ungated in Friends mode. */}
          <Sentiment />
          <GraphSection />
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            <Heatmap />
            <WeekdayActivity />
          </div>
          <Timeline />
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            <Balance />
            <Highlights />
          </div>
        </>
      ) : (
        /* -------- PRO: decision-first (response → SLA → trend → load) ----- */
        <>
          <Gate title="Professional report" blurb="SLA tracking, engagement trends and exports.">
            <ProReport />
          </Gate>
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            <ResponseTrend />
            <Timeline />
          </div>
          <Gate title="Sentiment trends" blurb="Track conversation tone month over month.">
            <Sentiment />
          </Gate>
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            <Heatmap />
            <WeekdayActivity />
          </div>
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            <Gate title="Response times" blurb="Median reply speed for every participant.">
              <ResponseTimes />
            </Gate>
            <Balance />
          </div>
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            <Gate title="Conversation flow" blurb="Who opens threads and who closes them.">
              <ConversationFlow />
            </Gate>
            <Highlights />
          </div>
          <GraphSection />
          <TopWords />
        </>
      )}
    </main>
  )
}

/** Wrap a section so free users see a blurred teaser + single upsell. */
function Gate({ children, title, blurb }) {
  return <Locked title={title} blurb={blurb}>{children}</Locked>
}

function GraphSection() {
  return (
    <section>
      <SectionTitle eyebrow="Relationship graph" title="Who talks to whom"
        description="Bubbles are people, sized by volume. Lines are interaction strength. Click anyone to filter everything above." />
      <Card className="mt-6 p-2 md:p-3" padded={false}>
        <Graph />
      </Card>
    </section>
  )
}

function WrappedBanner({ onPlay }) {
  return (
    <div className="relative overflow-hidden rounded-4xl border border-line bg-surface p-6 md:p-8 grain">
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="chip-accent w-fit mb-3"><Sparkles size={13} /> New</div>
          <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-ink">Your chat, Wrapped.</h3>
          <p className="text-muted mt-1.5 max-w-md">A full-screen, swipeable story of your year in the group chat — built to be screenshotted.</p>
        </div>
        <Button variant="primary" size="lg" onClick={onPlay} className="shrink-0">
          <Play size={17} /> Play Wrapped
        </Button>
      </div>
    </div>
  )
}

function ParseSummary({ stats, totals }) {
  const items = [
    { icon: Smartphone, label: stats.platform },
    { icon: CalendarDays, label: `${fmtDate(totals.first)} → ${fmtDate(totals.last)}` },
    { icon: FileCheck2, label: `${comma(stats.totalMessages)} parsed · ${stats.dateFormat}` },
  ]
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="eyebrow mb-1.5">Your conversation</div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {items.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-sm text-muted">
              <it.icon size={14} className="text-faint" /> {it.label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {stats.mediaMessages > 0 && <span className="chip">{comma(stats.mediaMessages)} media</span>}
        {stats.editedMessages > 0 && <span className="chip">{comma(stats.editedMessages)} edited</span>}
        {stats.deletedMessages > 0 && <span className="chip">{comma(stats.deletedMessages)} deleted</span>}
        {stats.malformed > 0 && <span className="chip text-warning">{comma(stats.malformed)} skipped</span>}
        {stats.systemMessages > 0 && <span className="chip">{comma(stats.systemMessages)} system</span>}
      </div>
    </div>
  )
}
