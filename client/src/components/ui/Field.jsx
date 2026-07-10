export function Field({ label, htmlFor, error, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function Input({ id, className = '', ...props }) {
  return (
    <input
      id={id}
      className={`w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${className}`}
      {...props}
    />
  )
}

export function Select({ id, className = '', children, ...props }) {
  return (
    <select
      id={id}
      className={`w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ id, className = '', ...props }) {
  return (
    <textarea
      id={id}
      className={`w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${className}`}
      {...props}
    />
  )
}
