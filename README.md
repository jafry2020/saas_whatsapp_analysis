# Subtext — read between the lines

Turn a WhatsApp chat export into a beautiful, **private** analytics experience.
Two products in one upload:

- **Friends mode** — "Spotify Wrapped" for your group chat: awards, emoji leaderboards,
  laughter analysis and a full-screen, swipeable **Wrapped** story you can export to PNG.
- **Pro mode** — clean analytics for teams, support, sales and community managers:
  response-time SLAs, engagement trends, sentiment, participation balance and an
  exportable report.

> **Privacy by architecture.** There is no backend and no upload. Your `.txt` is parsed
> in the browser and held only in React state — refresh the tab and it's gone.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

Click **“Try with sample data”** to explore the full experience with built-in synthetic
data — no file required. Or **“Load 12k-message demo”** to feel the performance at scale.

```bash
npm run build    # production bundle in dist/
npm run preview  # serve the production build
```

Requires Node 18+ (built and tested on Node 22).

---

## What it does

**Parsing** (`src/lib/parser.js`) — robust against real-world exports:
iOS *and* Android, 12h/24h clocks, `D/M/Y` · `M/D/Y` · `Y-M-D` with `/ . -` separators,
multi-line messages, system notices, deleted & edited markers, media-omitted placeholders,
emoji/Unicode and the invisible bidi marks iOS injects. The day/month order is inferred
from the whole file and reported back. Large files are parsed in chunks with a progress bar.

**Insights** (`src/lib/analytics.js`) — per-person volume, words, media, emoji, top words,
active hours; temporal timelines, a day×hour heatmap, streaks, longest silences, peaks;
dynamics like response times, conversation starters/closers and participation balance;
plus a lightweight, on-device lexicon **sentiment** model (`src/lib/sentiment.js`).

**Relationship graph** (`src/components/dashboard/Graph.jsx`) — a from-scratch `d3-force`
simulation rendered to canvas: nodes sized by volume, edges by interaction strength, with
hover-highlight, drag, zoom/pan and **click-to-filter the whole dashboard**.

**Friends Wrapped** (`src/components/friends/`) — animated, swipeable stat cards and a
**share-card PNG export** drawn directly to a `<canvas>` (`src/lib/shareCanvas.js`) so it
works offline and in every browser.

**Pro report** (`src/components/pro/ProReport.jsx`) — SLA cards, engagement trend and
CSV / print-to-PDF export.

A mocked **freemium gate** keeps Friends mode fully free (the growth engine) while gating
advanced Pro analytics and unlimited participants behind a non-nagging upsell.

---

## Tech

React + Vite + Tailwind (CSS-variable design system, four distinct mode×theme identities),
Recharts for standard charts, custom `d3-force` canvas for the network, Framer Motion for
the motion language, `lucide-react` for icons. Display type is Clash Display, text is
Satoshi, numerals are JetBrains Mono — all with system fallbacks.

```
src/
  lib/            parser · analytics · sentiment · awards · sampleData · shareCanvas · format
  context/        AppContext (mode · theme · tier · data · focus)
  components/
    ui/           Button · Card · Modal · primitives · chart colours
    common/       Logo · Navbar · Mode/Theme toggles · Upgrade · Locked
    landing/      marketing site + hero
    upload/       drag-drop uploader + export helper
    dashboard/    Overview · Timeline · Heatmap · People · Graph · Sentiment · Dynamics · Extras
    friends/      Wrapped story · ShareCard · Awards
    pro/          ProReport
```

## Notes

- No `localStorage`, no cookies, no analytics SDK — parsed data lives in memory only.
- The PNG share-card is rendered with a hand-written canvas painter rather than a
  DOM-rasterising library, which avoids the `foreignObject` font/CORS failures those
  libraries hit (notably in Safari and offline).
- This is a demo build: the "Upgrade to Pro" flow takes no payment, it just flips an
  in-memory flag to unlock the gated views. Not affiliated with WhatsApp.
