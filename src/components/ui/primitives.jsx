import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn, initials, nameColor } from '../../lib/format.js'

/* ----------------------------------------------------------------- Button */
const BTN = {
  primary: 'bg-accent text-on-accent shadow-clay-accent hover:brightness-[1.04] active:translate-y-px active:shadow-clay-sm',
  secondary: 'bg-surface text-ink border border-line shadow-clay hover:brightness-[0.99] active:translate-y-px active:shadow-clay-sm',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2',
  outline: 'bg-surface text-ink border border-line shadow-clay-sm hover:shadow-clay active:translate-y-px',
  danger: 'bg-negative/10 text-negative border border-negative/20 shadow-clay-sm hover:bg-negative/15 active:translate-y-px',
}
const SIZE = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-[var(--radius-btn)]',
  md: 'h-10 px-4 text-sm gap-2 rounded-[var(--radius-btn)]',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-[var(--radius-btn)]',
}
export function Button({ as: As = 'button', variant = 'secondary', size = 'md', className, children, ...rest }) {
  return (
    <As
      className={cn(
        // box-shadow deliberately excluded — see Card.jsx comment.
        'inline-flex items-center justify-center font-medium transition-[color,background-color,border-color,filter,transform] duration-150',
        'focus-visible:outline-2 disabled:opacity-50 disabled:pointer-events-none select-none',
        BTN[variant], SIZE[size], className,
      )}
      {...rest}
    >
      {children}
    </As>
  )
}

/* ------------------------------------------------------------------- Chip */
export function Chip({ children, accent, className }) {
  return <span className={cn(accent ? 'chip-accent' : 'chip', className)}>{children}</span>
}

/* ----------------------------------------------------------------- Avatar */
export function Avatar({ name, size = 36, className, ring }) {
  const color = nameColor(name)
  return (
    <span
      className={cn('inline-grid place-items-center rounded-full font-semibold text-white shrink-0', className)}
      style={{
        width: size, height: size, fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${color}, ${nameColor(name, 64, 42)})`,
        boxShadow: ring ? `0 0 0 2px rgb(var(--surface)), 0 0 0 4px ${color}` : undefined,
      }}
      title={name}
    >
      {initials(name)}
    </span>
  )
}

/* ------------------------------------------------------------------- Stat */
export function Stat({ label, value, sub, icon: Icon, accent, className }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-1.5 text-faint">
        {Icon && <Icon size={14} strokeWidth={2} />}
        <span className="eyebrow">{label}</span>
      </div>
      <div className={cn('font-display text-2xl md:text-[28px] leading-none tnum',
        accent ? 'text-accent-text' : 'text-ink')}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  )
}

/* -------------------------------------------------------------- Segmented */
export function Segmented({ options, value, onChange, size = 'md' }) {
  const instanceId = useId()
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full bg-surface-2 p-1 clay-inset',
      size === 'sm' && 'p-0.5')}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
              size === 'sm' ? 'h-7 px-3 text-xs' : 'h-9 px-4 text-sm',
              active ? 'text-on-accent' : 'text-muted hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={`${instanceId}-thumb`}
                className="absolute inset-0 rounded-full bg-accent shadow-clay-accent"
                style={{ zIndex: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {o.icon}
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ----------------------------------------------------------------- Toggle */
export function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('inline-flex items-center gap-2 group')}
    >
      <span className={cn('relative h-6 w-10 rounded-full transition-colors duration-200',
        checked ? 'bg-accent' : 'bg-line')}>
        <span className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
          checked && 'translate-x-4')} />
      </span>
      {label && <span className="text-sm text-muted group-hover:text-ink">{label}</span>}
    </button>
  )
}

/* ------------------------------------------------------------ ProgressRing */
export function ProgressRing({ value, size = 56, stroke = 6, color = 'rgb(var(--accent))', children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(1, value)))
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.7,.2,1)' }} />
      </svg>
      <span className="absolute text-xs font-semibold tnum text-ink">{children}</span>
    </div>
  )
}

/* --------------------------------------------------------------- Skeleton */
export const Skeleton = ({ className }) => <div className={cn('skeleton', className)} />

/* ---------------------------------------------------------------- Divider */
export const Divider = ({ className }) => <div className={cn('h-px w-full bg-line', className)} />

/* --------------------------------------------------------------- Bar (mini) */
export function MiniBar({ value, max, color = 'rgb(var(--accent))', className }) {
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-line overflow-hidden', className)}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${max ? (value / max) * 100 : 0}%`, background: color }} />
    </div>
  )
}
