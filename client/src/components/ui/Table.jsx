import { motion } from 'framer-motion'

export function Table({ headers, children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-start font-medium text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Row({ children, index = 0, onClick }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.25 }}
      onClick={onClick}
      className={`border-b border-border last:border-0 ${
        onClick ? 'cursor-pointer transition-colors hover:bg-muted/50' : ''
      }`}
    >
      {children}
    </motion.tr>
  )
}

export function Cell({ children, className = '' }) {
  return <td className={`px-4 py-3 text-foreground ${className}`}>{children}</td>
}
