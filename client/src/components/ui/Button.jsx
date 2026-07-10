const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-muted text-foreground hover:bg-border',
  outline: 'border border-border bg-transparent text-foreground hover:bg-muted',
  danger: 'bg-destructive text-destructive-foreground hover:opacity-90',
  ghost: 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
