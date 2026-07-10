const STYLES = {
  scheduled: 'bg-primary/10 text-primary',
  confirmed: 'bg-success/10 text-success',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  no_show: 'bg-warning/10 text-warning',
  pending: 'bg-warning/10 text-warning',
  paid: 'bg-success/10 text-success',
  partial: 'bg-warning/10 text-warning',
  unpaid: 'bg-destructive/10 text-destructive',
  active: 'bg-success/10 text-success',
  inactive: 'bg-muted text-muted-foreground',
  default: 'bg-muted text-muted-foreground',
}

export default function Badge({ status, children }) {
  const style = STYLES[status] || STYLES.default
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {children}
    </span>
  )
}
