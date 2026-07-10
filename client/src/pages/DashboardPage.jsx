import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CalendarDays, Users, Wallet, FileWarning } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { fetcher } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Page, PageHeader, staggerContainer } from '../components/ui/Page'
import { StatCard, Card } from '../components/ui/Card'
import { StatsSkeleton, TableSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import { formatDate, formatTime, formatMoney, formatNumber, todayISO } from '../lib/format'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const today = todayISO()

  const { data: summary } = useSWR('/reports/summary', fetcher)
  const { data: trend } = useSWR('/reports/appointments-per-day?days=14', fetcher)
  const { data: todayAppts } = useSWR(`/appointments?from=${today}&to=${today}&limit=50`, fetcher)

  const chartData = (trend?.data || []).map((r) => ({
    date: formatDate(r.date, { month: 'numeric', day: 'numeric', year: undefined }),
    count: r.count,
  }))

  const appts = (todayAppts?.data || [])
    .slice()
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))

  return (
    <Page>
      <PageHeader
        title={t('dashboard.greeting', { name: user?.full_name?.split(' ')[0] || '' })}
        subtitle={t('dashboard.overview')}
      />

      {!summary ? (
        <StatsSkeleton />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            icon={CalendarDays}
            label={t('dashboard.appointmentsToday')}
            value={formatNumber(summary.appointments_today)}
          />
          <StatCard
            icon={Users}
            label={t('dashboard.totalPatients')}
            value={formatNumber(summary.total_patients)}
            accent="bg-success/10 text-success"
          />
          <StatCard
            icon={Wallet}
            label={t('dashboard.revenueThisMonth')}
            value={formatMoney(summary.revenue_this_month)}
            accent="bg-primary/10 text-primary"
          />
          <StatCard
            icon={FileWarning}
            label={t('dashboard.pendingInvoices')}
            value={formatNumber(summary.pending_invoices)}
            accent="bg-warning/10 text-warning"
          />
        </motion.div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Trend chart */}
        <Card className="lg:col-span-3">
          <h2 className="mb-4 text-base font-medium text-foreground">
            {t('dashboard.appointmentsTrend')}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="apptFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#apptFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Today's schedule */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-base font-medium text-foreground">{t('dashboard.todaySchedule')}</h2>
          {!todayAppts ? (
            <TableSkeleton rows={4} />
          ) : appts.length === 0 ? (
            <EmptyState icon={CalendarDays} title={t('dashboard.noAppointmentsToday')} />
          ) : (
            <ul className="space-y-3">
              {appts.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <span
                    className="h-10 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: a.doctor_color || 'var(--color-primary)' }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.patient_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.doctor_name} · {formatTime(a.start_time)}
                    </p>
                  </div>
                  <Badge status={a.status}>{t(`appointments.statuses.${a.status}`)}</Badge>
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  )
}
