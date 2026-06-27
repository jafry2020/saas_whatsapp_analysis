/**
 * Logo — the Subtext mark: a speech bubble whose contents are an ascending
 * bar chart (chat × analytics, in one glyph). Uses theme tokens so it adapts
 * to mode + light/dark automatically.
 */
export function LogoMark({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* Bubble */}
      <path
        d="M9 3.5h14A5.5 5.5 0 0 1 28.5 9v9a5.5 5.5 0 0 1-5.5 5.5h-8.6l-5 4.1A1 1 0 0 1 7.8 26v-2.6A5.5 5.5 0 0 1 3.5 18V9A5.5 5.5 0 0 1 9 3.5Z"
        className="fill-accent/12 stroke-accent/30"
        strokeWidth="1.25"
      />
      {/* Ascending bars */}
      <rect x="10.5" y="15" width="2.6" height="5" rx="1.3" className="fill-ink/45" />
      <rect x="14.7" y="11.5" width="2.6" height="8.5" rx="1.3" className="fill-ink/70" />
      <rect x="18.9" y="8" width="2.6" height="12" rx="1.3" className="fill-accent" />
    </svg>
  )
}

export function Logo({ size = 28, className = '', wordmark = true }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {wordmark && (
        <span className="font-display font-semibold tracking-tight text-ink" style={{ fontSize: size * 0.66 }}>
          Subtext<span className="text-accent">.</span>
        </span>
      )}
    </span>
  )
}
