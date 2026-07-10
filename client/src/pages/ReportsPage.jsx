import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../lib/api';
import { Page, PageHeader } from '../components/ui/Page';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { formatMoney } from '../lib/format';

const STATUS_COLORS = {
  scheduled: 'var(--color-primary)',
  confirmed: '#0e9f6e',
  completed: '#3f83f8',
  cancelled: '#f05252',
  no_show: '#c27803',
};

function monthLabel(monthIndex, language) {
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  return new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2026, monthIndex, 1));
}

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState([]);
  const [perDay, setPerDay] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/reports/revenue-per-month'),
      api.get('/reports/appointments-per-day', { params: { days: 30 } }),
      api.get('/reports/status-breakdown'),
      api.get('/reports/top-doctors'),
    ])
      .then(([rev, days, st, docs]) => {
        if (!active) return;
        const months = Array.from({ length: 12 }, (_, i) => ({
          month: monthLabel(i, i18n.language),
          total: 0,
        }));
        rev.data.data.forEach((r) => {
          months[r.month - 1].total = r.total;
        });
        setRevenue(months);
        setPerDay(
          days.data.data.map((d) => ({
            date: new Date(d.date).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }),
            count: d.count,
          }))
        );
        setStatuses(
          st.data.data.map((s) => ({
            name: t(`appointments.status.${s.status}`),
            value: s.count,
            color: STATUS_COLORS[s.status] || 'var(--color-muted-foreground)',
          }))
        );
        setTopDoctors(docs.data.data.slice(0, 5));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [t, i18n.language]);

  if (loading) {
    return (
      <Page>
        <PageHeader title={t('reports.title')} />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title={t('reports.title')} />
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title={t('reports.revenuePerMonth')} delay={0}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} reversed={isRTL} />
              <YAxis tick={{ fontSize: 12 }} orientation={isRTL ? 'right' : 'left'} />
              <Tooltip formatter={(v) => formatMoney(v)} />
              <Bar dataKey="total" name={t('reports.revenue')} fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reports.lastDays', { count: 30 })} delay={0.05}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={perDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} reversed={isRTL} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} orientation={isRTL ? 'right' : 'left'} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                name={t('reports.appointmentsPerDay')}
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reports.statusBreakdown')} delay={0.1}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statuses} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                {statuses.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reports.topDoctors')} delay={0.15}>
          <ul className="flex flex-col gap-3">
            {topDoctors.map((d, i) => (
              <motion.li
                key={d.id}
                initial={{ opacity: 0, x: isRTL ? 16 : -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
                  style={{ backgroundColor: d.color || 'var(--color-primary)' }}
                  aria-hidden="true"
                >
                  {d.name?.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{d.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{d.specialty}</p>
                </div>
                <div className="text-end">
                  <p className="text-sm font-semibold text-foreground">
                    {formatMoney(d.revenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.completed_appointments} {t('reports.completedAppointments').toLowerCase()}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </Page>
  );
}

function ChartCard({ title, delay, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
        {children}
      </Card>
    </motion.div>
  );
}
