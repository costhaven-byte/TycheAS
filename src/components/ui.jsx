import { motion, useReducedMotion } from 'framer-motion'
import { IconArrow } from './icons.jsx'

const EASE = [0.22, 1, 0.36, 1]

export function Container({ className = '', children }) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  )
}

// Scroll reveal that degrades to fully-visible when motion is reduced.
export function Reveal({ children, delay = 0, y = 22, className = '' }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

// Small deliberate label — sentence case, leading tick. Used sparingly, not as
// a per-section eyebrow.
export function Kicker({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-semibold text-clay-ink ${className}`}
    >
      <span className="h-px w-6 bg-clay" />
      {children}
    </span>
  )
}

export function SectionHeading({
  kicker,
  title,
  subtitle,
  align = 'center',
  className = '',
}) {
  const isCenter = align === 'center'
  return (
    <div
      className={`flex max-w-2xl flex-col gap-4 ${
        isCenter ? 'mx-auto items-center text-center' : 'items-start text-start'
      } ${className}`}
    >
      {kicker && <Kicker>{kicker}</Kicker>}
      <h2 className="text-[2rem] font-bold leading-[1.05] tracking-tight sm:text-[2.6rem] md:text-[3rem]">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-xl text-pretty text-[1.05rem] leading-relaxed text-ink-soft">
          {subtitle}
        </p>
      )}
    </div>
  )
}

const VARIANTS = {
  primary:
    'bg-clay text-white shadow-clay hover:bg-clay-strong active:translate-y-px',
  secondary:
    'border border-line-strong bg-surface text-ink hover:border-clay hover:text-clay-ink active:translate-y-px',
  ghost: 'text-ink hover:text-clay-ink',
}

const SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-[0.95rem]',
  lg: 'px-7 py-3.5 text-base',
}

export function Button({
  as = 'a',
  variant = 'primary',
  size = 'md',
  withArrow = false,
  className = '',
  children,
  ...props
}) {
  const Tag = as
  return (
    <Tag
      className={`group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
      {withArrow && (
        <IconArrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
      )}
    </Tag>
  )
}
