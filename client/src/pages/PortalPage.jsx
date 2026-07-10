import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CalendarPlus, CalendarDays, Pill, Receipt, Stethoscope } from 'lucide-react'
import { fetcher } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Page, PageHeader } from '../components/ui/Page'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import BookAppointmentForm from '../components/appointments/BookAppointmentForm'
import { formatDate, formatTime, formatMoney } from '../lib/format'

export default function PortalPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [booking, setBooking] = useState(false)
  const [tab, setTab] = useState('appointments')

  const { data: profile } = useSWR('/portal/me', fetcher)
  const { data: appts, isLoading: apptsLoading, mutate: mutateAppts } = useSWR('/portal/appointments', fetcher)
  const { data: rx, isLoading: rxLoading } = useSWR(tab === 'prescriptions' ? '/portal/prescriptions' : null, fetcher)
  const { data: invoices, isLoading: invLoading } = useSWR(tab === 'invoices' ? '/portal/invoices' : null, fetcher)

  const appointments = appts?.data || []
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = appointments.filter(
    (a) => a.date.slice(0, 10) >= today && !['cancelled', 'no_show', 'completed'].includes(a.status)
  )
  const past = appointments.filter((a) => !upcoming.includes(a))

  const tabs = [
    { id: 'appointments', label: t('nav.myAppointments'), icon: CalendarDays },
    { id: 'prescriptions', label: t('nav.myPrescriptions'), icon: Pill },
    { id: 'invoices', label: t('nav.myInvoices'), icon: Receipt },
  ]

  return (
    <Page>
      <PageHeader
        title={t('portal.welcome', { name: user?.name })}
        subtitle={t('portal.subtitle')}
        actions={
          <Button onClick={() => setBooking(true)}>
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            {t('nav.bookAppointment')}
          </Button>
        }
      />

      <div role="tablist" aria-label={t('portal.myRecords')} className="mb-6 flex gap-2 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-primary/10'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'appointments' && (
        <div className="flex flex-col gap-6">
          <section aria-label={t('portal.upcoming')}>
            <h2 className="mb-3 text-sm font-semibold text-foreground">{t('portal.upcoming')}</h2>
            {apptsLoading ? (
              <Skeleton className="h-24 rounded-2xl" />
            ) : upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title={t('portal.noUpcoming')}
                action={
                  <Button variant="outline" onClick={() => setBooking(true)}>
                    {t('portal.bookNew')}
                  </Button>
                }
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {upcoming.map((a, i) => (
                  <AppointmentCard key={a.id} appt={a} index={i} highlight />
                ))}
              </ul>
            )}
          </section>

          {past.length > 0 && (
            <section aria-label={t('portal.past')}>
              <h2 className="mb-3 text-sm font-semibold text-foreground">{t('portal.past')}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {past.slice(0, 8).map((a, i) => (
                  <AppointmentCard key={a.id} appt={a} index={i} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {tab === 'prescriptions' &&
        (rxLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : (rx?.data || []).length === 0 ? (
          <EmptyState icon={Pill} title={t('common.noResults')} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {(rx?.data || []).map((p, i) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <Card>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{p.medication}</p>
                      <p className="text-sm text-muted-foreground">
                        {[p.dosage, p.frequency, p.duration].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(p.date)}</span>
                  </div>
                  {p.instructions && <p className="mt-2 text-sm text-muted-foreground">{p.instructions}</p>}
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
                    {p.doctor_name}
                    {p.diagnosis ? ` — ${p.diagnosis}` : ''}
                  </p>
                </Card>
              </motion.li>
            ))}
          </ul>
        ))}

      {tab === 'invoices' &&
        (invLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : (invoices?.data || []).length === 0 ? (
          <EmptyState icon={Receipt} title={t('common.noResults')} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {(invoices?.data || []).map((inv, i) => (
              <motion.li
                key={inv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <Card>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(inv.created_at)}</p>
                    </div>
                    <Badge status={inv.status}>{t(`billing.status.${inv.status}`)}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('billing.paid')}</span>
                    <span className="font-medium text-foreground">
                      {formatMoney(inv.paid_amount)} / {formatMoney(inv.total)}
                    </span>
                  </div>
                </Card>
              </motion.li>
            ))}
          </ul>
        ))}

      <Modal open={booking} onClose={() => setBooking(false)} title={t('nav.bookAppointment')} wide>
        <BookAppointmentForm
          fixedPatientId={profile?.patient?.id}
          onCancel={() => setBooking(false)}
          onDone={() => {
            setBooking(false)
            mutateAppts()
          }}
        />
      </Modal>
    </Page>
  )
}

function AppointmentCard({ appt, index, highlight = false }) {
  const { t } = useTranslation()
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
    >
      <Card className={highlight ? 'border-primary/40' : ''}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
              style={{ backgroundColor: appt.doctor_color || 'var(--color-primary)' }}
              aria-hidden="true"
            >
              {appt.doctor_name?.charAt(0)}
            </span>
            <div>
              <p className="font-medium text-foreground">{appt.doctor_name}</p>
              <p className="text-xs text-muted-foreground">{appt.specialty}</p>
            </div>
          </div>
          <Badge status={appt.status}>{t(`appointments.status.${appt.status}`)}</Badge>
        </div>
        <p className="mt-3 text-sm text-foreground">
          {formatDate(appt.date)} · {formatTime(appt.start_time)}
        </p>
        {appt.reason && <p className="mt-1 text-sm text-muted-foreground">{appt.reason}</p>}
      </Card>
    </motion.li>
  )
}
