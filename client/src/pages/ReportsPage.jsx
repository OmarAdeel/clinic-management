import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, BarChart3, CalendarDays, Download, FileText, Sparkles, Target, TrendingUp, Wallet } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
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
import { Card, StatCard } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Field, Input } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { formatMoney, todayISO } from '../lib/format';

const STATUS_COLORS = {
  scheduled: '#8b5cf6',
  confirmed: '#0e9f6e',
  completed: '#3f83f8',
  cancelled: '#f05252',
  no_show: '#f59e0b',
};

const RANGE_OPTIONS = [14, 30, 60, 90];

function monthLabel(monthIndex, language) {
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  return new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2026, monthIndex, 1));
}

function pct(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);
  const [revenue, setRevenue] = useState([]);
  const [perDay, setPerDay] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [productivity, setProductivity] = useState([]);
  const [noShowTrend, setNoShowTrend] = useState([]);

  const [revFrom, setRevFrom] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
  const [revTo, setRevTo] = useState(todayISO());
  const [revenueReport, setRevenueReport] = useState(null);
  const [revLoading, setRevLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api.get('/reports/revenue-per-month'),
      api.get('/reports/appointments-per-day', { params: { days: rangeDays } }),
      api.get('/reports/status-breakdown'),
      api.get('/reports/top-doctors'),
      api.get('/reports/doctor-productivity'),
      api.get('/reports/no-show-rate', { params: { months: 6 } }),
    ])
      .then(([rev, days, st, docs, prod, ns]) => {
        if (!active) return;
        const months = Array.from({ length: 12 }, (_, i) => ({ month: monthLabel(i, i18n.language), total: 0 }));
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
            name: t(`appointments.statuses.${s.status}`),
            value: s.count,
            color: STATUS_COLORS[s.status] || 'var(--color-muted-foreground)',
          }))
        );
        setTopDoctors(docs.data.data.slice(0, 5));
        setProductivity(prod.data.data.slice(0, 5));
        setNoShowTrend(
          ns.data.data.map((d) => ({
            month: new Date(`${d.month}-01`).toLocaleDateString(i18n.language, { month: 'short', year: '2-digit' }),
            rate: d.rate,
            total: d.total,
          }))
        );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [t, i18n.language, rangeDays]);

  useEffect(() => {
    let active = true;
    setRevLoading(true);
    api
      .get('/reports/revenue', { params: { from: revFrom, to: revTo } })
      .then((res) => active && setRevenueReport(res.data))
      .finally(() => active && setRevLoading(false));
    return () => {
      active = false;
    };
  }, [revFrom, revTo]);

  const insights = useMemo(() => {
    const totalAppointments = perDay.reduce((sum, d) => sum + Number(d.count || 0), 0);
    const busiestDay = perDay.reduce((max, d) => (Number(d.count || 0) > Number(max?.count || 0) ? d : max), null);
    const totalRevenue = revenue.reduce((sum, d) => sum + Number(d.total || 0), 0);
    const bestMonth = revenue.reduce((max, d) => (Number(d.total || 0) > Number(max?.total || 0) ? d : max), null);
    const statusTotal = statuses.reduce((sum, d) => sum + Number(d.value || 0), 0);
    const completed = statuses.find((s) => s.name === t('appointments.statuses.completed'))?.value || 0;
    return { totalAppointments, busiestDay, totalRevenue, bestMonth, completionRate: statusTotal ? (completed / statusTotal) * 100 : 0 };
  }, [perDay, revenue, statuses, t]);

  const exportRevenueCsv = () => {
    if (!revenueReport) return;
    const rows = [['Doctor', 'Specialty', 'Collected', 'Appointments'], ...revenueReport.by_doctor.map((d) => [d.name, d.specialty, d.collected, d.appointments])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue-${revFrom}-${revTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Page>
        <PageHeader title={t('reports.title')} />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title={t('reports.title')} />

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-sky-500 to-violet-600 p-6 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur"><Sparkles className="h-4 w-4" /> {t('reports.commandCenter')}</p>
            <h1 className="text-2xl font-bold md:text-4xl">{formatMoney(insights.totalRevenue)}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">{t('reports.commandCenterSubtitle')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
            <HeroMetric icon={CalendarDays} label={t('reports.rangeAppointments')} value={insights.totalAppointments} />
            <HeroMetric icon={Target} label={t('reports.completionRate')} value={pct(insights.completionRate)} />
            <HeroMetric icon={TrendingUp} label={t('reports.bestMonth')} value={insights.bestMonth?.month || '—'} />
            <HeroMetric icon={Activity} label={t('reports.busiestDay')} value={insights.busiestDay?.date || '—'} />
          </div>
        </div>
      </motion.section>

      <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-br from-card to-muted/60 shadow-lg">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><BarChart3 className="h-4 w-4 text-primary" /> {t('reports.revenueReport')}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t('reports.revenueReportHint')}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Field label={t('common.from')} htmlFor="rev-from"><Input id="rev-from" type="date" value={revFrom} onChange={(e) => setRevFrom(e.target.value)} className="w-auto" /></Field>
            <Field label={t('common.to')} htmlFor="rev-to"><Input id="rev-to" type="date" value={revTo} onChange={(e) => setRevTo(e.target.value)} className="w-auto" /></Field>
            <Button type="button" variant="secondary" onClick={exportRevenueCsv} disabled={!revenueReport}><Download className="h-4 w-4" /> {t('reports.exportCsv')}</Button>
          </div>
        </div>

        {revLoading || !revenueReport ? <Skeleton className="h-24 rounded-xl" /> : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={TrendingUp} label={t('reports.invoiced')} value={formatMoney(revenueReport.summary.invoiced)} />
              <StatCard icon={Wallet} label={t('reports.collected')} value={formatMoney(revenueReport.summary.collected)} accent="bg-success/10 text-success" />
              <StatCard icon={AlertCircle} label={t('reports.outstanding')} value={formatMoney(revenueReport.summary.outstanding)} accent="bg-warning/10 text-warning" />
              <StatCard icon={FileText} label={t('reports.invoicesCount')} value={revenueReport.summary.invoice_count} accent="bg-accent/10 text-accent" />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="mb-3 text-sm font-medium text-foreground">{t('reports.revenueByDoctor')}</p>
                <ul className="space-y-3">
                  {revenueReport.by_doctor.map((d) => {
                    const max = Math.max(...revenueReport.by_doctor.map((doc) => Number(doc.collected || 0)), 1);
                    return <DoctorRevenueRow key={d.id} doctor={d} max={max} />;
                  })}
                </ul>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-foreground">{t('reports.paymentMix')}</p>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={revenueReport.by_method} dataKey="total" nameKey="method" innerRadius={55} outerRadius={90} paddingAngle={4}>
                      {revenueReport.by_method.map((_, i) => <Cell key={i} fill={['#14b8a6', '#38bdf8', '#8b5cf6', '#f59e0b'][i % 4]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v)} contentStyle={tooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">{t('reports.timelineRange')}</span>
        {RANGE_OPTIONS.map((days) => <button key={days} type="button" onClick={() => setRangeDays(days)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${rangeDays === days ? 'bg-primary text-primary-foreground shadow-lg shadow-teal-500/20' : 'bg-card text-muted-foreground hover:bg-muted'}`}>{t('reports.days', { count: days })}</button>)}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title={t('reports.revenuePerMonth')} delay={0}>
          <ResponsiveContainer width="100%" height={280}><BarChart data={revenue}><defs><linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#14b8a6" /><stop offset="100%" stopColor="#38bdf8" /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="month" tick={{ fontSize: 12 }} reversed={isRTL} /><YAxis tick={{ fontSize: 12 }} orientation={isRTL ? 'right' : 'left'} /><Tooltip formatter={(v) => formatMoney(v)} contentStyle={tooltipStyle} /><Bar dataKey="total" name={t('reports.revenue')} fill="url(#revenueGradient)" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reports.lastDays', { count: rangeDays })} delay={0.05}>
          <ResponsiveContainer width="100%" height={280}><AreaChart data={perDay}><defs><linearGradient id="appointmentsGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="date" tick={{ fontSize: 11 }} reversed={isRTL} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} orientation={isRTL ? 'right' : 'left'} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="count" name={t('reports.appointmentsPerDay')} stroke="#8b5cf6" strokeWidth={3} fill="url(#appointmentsGradient)" /></AreaChart></ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reports.statusBreakdown')} delay={0.1}>
          <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={statuses} dataKey="value" nameKey="name" innerRadius={65} outerRadius={102} paddingAngle={4}>{statuses.map((s, i) => <Cell key={i} fill={s.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend /></PieChart></ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reports.noShowRateOverTime')} delay={0.15}>
          <ResponsiveContainer width="100%" height={280}><LineChart data={noShowTrend}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="month" tick={{ fontSize: 11 }} reversed={isRTL} /><YAxis tick={{ fontSize: 12 }} orientation={isRTL ? 'right' : 'left'} unit=" %" /><Tooltip formatter={(v) => `${v}%`} contentStyle={tooltipStyle} /><Line type="monotone" dataKey="rate" name={t('reports.noShowRate')} stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 7 }} /></LineChart></ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reports.topDoctors')} delay={0.2}><DoctorList doctors={topDoctors} isRTL={isRTL} t={t} /></ChartCard>
        <ChartCard title={t('reports.doctorProductivity')} delay={0.25}><ProductivityList doctors={productivity} isRTL={isRTL} t={t} /></ChartCard>
      </div>
    </Page>
  );
}

const tooltipStyle = { border: '1px solid var(--color-border)', borderRadius: 14, background: 'var(--color-card)', color: 'var(--color-foreground)', boxShadow: '0 18px 45px rgb(15 23 42 / 0.15)' };

function HeroMetric({ icon: Icon, label, value }) {
  return <div className="rounded-2xl bg-white/15 p-3 backdrop-blur"><Icon className="mb-2 h-5 w-5 text-white/80" /><p className="text-xs text-white/70">{label}</p><p className="mt-1 truncate text-lg font-bold">{value}</p></div>;
}

function DoctorRevenueRow({ doctor, max }) {
  const width = `${Math.max(4, (Number(doctor.collected || 0) / max) * 100)}%`;
  return <li className="rounded-2xl border border-border bg-card/80 p-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground" style={{ backgroundColor: doctor.color || 'var(--color-primary)' }}>{doctor.name?.charAt(0)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{doctor.name}</p><p className="truncate text-xs text-muted-foreground">{doctor.specialty}</p></div><span className="text-end text-sm font-semibold text-foreground">{formatMoney(doctor.collected)}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-400" style={{ width }} /></div></li>;
}

function DoctorList({ doctors, isRTL, t }) {
  return <ul className="flex flex-col gap-3">{doctors.map((d, i) => <motion.li key={d.id} initial={{ opacity: 0, x: isRTL ? 16 : -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-lg"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground ring-4 ring-muted" style={{ backgroundColor: d.color || 'var(--color-primary)' }}>{d.name?.charAt(0)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{d.name}</p><p className="truncate text-xs text-muted-foreground">{d.specialty}</p></div><div className="text-end"><p className="text-sm font-semibold text-foreground">{formatMoney(d.revenue)}</p><p className="text-xs text-muted-foreground">{d.completed_appointments} {t('reports.completedAppointments').toLowerCase()}</p></div></motion.li>)}</ul>;
}

function ProductivityList({ doctors, isRTL, t }) {
  return <ul className="flex flex-col gap-3">{doctors.map((d, i) => <motion.li key={d.id} initial={{ opacity: 0, x: isRTL ? 16 : -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }} className="rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground" style={{ backgroundColor: d.color || 'var(--color-primary)' }}>{d.name?.charAt(0)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{d.name}</p><p className="truncate text-xs text-muted-foreground">{d.specialty}</p></div><div className="text-end text-xs"><p className="font-semibold text-foreground">{d.total_appointments} {t('reports.totalAppointments')}</p><p className="text-muted-foreground">{d.completed} {t('reports.completed')} · {d.no_shows} {t('reports.noShows')}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><ProgressPill label={t('reports.noShowRate')} value={d.no_show_rate} color="bg-amber-500" /><ProgressPill label={t('reports.cancelRate')} value={d.cancel_rate} color="bg-rose-500" /></div></motion.li>)}</ul>;
}

function ProgressPill({ label, value, color }) {
  return <div><div className="mb-1 flex justify-between text-muted-foreground"><span>{label}</span><span>{pct(value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Number(value || 0))}%` }} /></div></div>;
}

function ChartCard({ title, delay, children }) {
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}><Card className="h-full overflow-hidden bg-card/90 shadow-sm transition hover:shadow-lg"><h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>{children}</Card></motion.div>;
}
