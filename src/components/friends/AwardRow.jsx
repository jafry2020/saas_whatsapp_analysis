import { Avatar } from '../ui/primitives.jsx'
import { nameColor } from '../../lib/format.js'

/**
 * One trophy — shared between the Wrapped awards slide (`lg`, full blurb +
 * avatar) and the ShareCard (`sm`, compact). Tinted per-winner so the trophy
 * case reads as colorful and personal, not a settings list.
 */
export function AwardRow({ award, size = 'lg' }) {
  // hsl(h s% l%) -> hsl(h s% l% / a) — CSS Color 4 slash-alpha syntax,
  // supported everywhere current. Cheaper than parsing into rgba().
  const tintAlpha = (hsl, a) => hsl.replace(/\)$/, ` / ${a})`)
  const tint = award.winner ? nameColor(award.winner) : 'hsl(220 70% 55%)'
  const lg = size === 'lg'
  return (
    <div
      className={lg ? 'flex items-center gap-3.5 rounded-2xl px-4 py-3.5 clay' : 'flex items-center gap-2.5 rounded-xl px-3 py-2'}
      style={{ background: `linear-gradient(135deg, ${tintAlpha(tint, 0.16)}, transparent)` }}
    >
      <span className={lg ? 'text-3xl shrink-0' : 'text-xl shrink-0'}>{award.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className={lg ? 'eyebrow' : 'text-[10px] font-semibold uppercase tracking-wide text-faint'}>{award.title}</div>
        <div className={lg ? 'font-display text-lg text-ink leading-tight' : 'text-sm font-semibold text-ink truncate'}>{award.winner}</div>
        {lg && award.blurb && <div className="text-xs text-muted mt-0.5 leading-snug">{award.blurb}</div>}
      </div>
      {lg && award.winner && <Avatar name={award.winner} size={38} className="shrink-0" />}
    </div>
  )
}
