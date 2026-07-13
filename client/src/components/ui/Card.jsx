import { motion } from 'framer-motion'
import { staggerItem } from './Page'

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 shadow-sm shadow-[var(--shadow-color)]/5 ${className}`}>
      {children}
    </div>
  )
}

export function AnimatedCard({ children, className = '' }) {
  return (
    <motion.div
      variants={staggerItem}
      className={`rounded-xl border border-border bg-card p-5 shadow-sm shadow-[var(--shadow-color)]/5 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function StatCard({ icon: Icon, label, value, hint, accent = 'bg-primary/10 text-primary' }) {
  return (
    <AnimatedCard>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </AnimatedCard>
  )
}
