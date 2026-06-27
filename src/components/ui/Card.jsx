import { cn } from '../../lib/format.js'

/** A surface panel with an optional header row. The workhorse container. */
export function Card({ children, className, padded = true, hover = false, as: As = 'div', ...rest }) {
  return (
    <As
      className={cn(
        'card relative overflow-hidden',
        padded && 'p-5 md:p-6',
        // box-shadow excluded on purpose: animating between two multi-layer
        // shadow lists (e.g. across a mode switch) can leave Chrome stuck
        // mid-interpolation — shadow snaps instantly, border/bg stay smooth.
        hover && 'transition-[border-color,background-color] duration-200 hover:border-hairline hover:shadow-card',
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  )
}

export function CardHeader({ title, subtitle, icon: Icon, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-accent/10 text-accent-text shrink-0">
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-ink leading-tight">{title}</h3>
          {subtitle && <p className="text-[13px] text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

/** Big section heading used between dashboard blocks. */
export function SectionTitle({ eyebrow, title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-ink">{title}</h2>
        {description && <p className="text-sm text-muted mt-1 max-w-xl">{description}</p>}
      </div>
      {action}
    </div>
  )
}
