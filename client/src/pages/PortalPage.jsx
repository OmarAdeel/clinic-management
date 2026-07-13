import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CalendarPlus, CalendarDays, Pill, Receipt, FlaskConical, AlertTriangle, Loader2, CalendarX } from 'lucide-react'
import api, { fetcher } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Page, PageHeader } from '../components/ui/Page'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { Field, Input } from '../components/ui/Field'
import BookAppointmentForm from '../components/appointments/BookAppointmentForm'
import { formatDate, formatTime, formatMoney, todayISO } from '../lib/format'

export default function PortalPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [booking, setBooking] = useState(false)
  const [rescheduleAppt, setRescheduleAppt] = useState(null)
  const [tab, setTab] = useState('appointments')

  const { data: profile } = useSWR('/portal/me', fetcher)
  const { data: appts, isLoading: apptsLoading, mutate: mutateAppts } = useSWR('/portal/appointments', fetcher)
  const { data: rx, isLoading: rxLoading } = useSWR(tab === 'prescriptions' ? '/portal/prescriptions' : null, fetcher)
  const { data: invoices, isLoading: invLoading } = useSWR(tab === 'invoices' ? '/portal/invoices' : null, fetcher)
  const { data: labs, isLoading: labsLoading } = useSWR(tab === 'labs' ? '/portal/lab-results' : null, fetcher)

  const appointments = appts?.data || []
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = appointments.filter(
    (a) => a.date.slice(0, 10) >= today && !['cancelled', 'no_show', 'completed'].includes(a.status)
  )
  const past = appointments.filter((a) => !upcoming.includes(a))

  const cancelAppt = async (appt) => {
    if (!window.confirm(t('portal.cancelConfirm'))) return
    try {
      await api.delete(`/portal/appointments/${appt.id}`)
      mutateAppts()
    } catch (err) {
      alert(err.response?.data?.message || err.message || t('common.error'))
    }
  }

  const tabs = [
    { id: 'appointments', label: t('nav.myAppointments'), icon: CalendarDays },
    { id: 'labs', label: t('nav.labResults'), icon: FlaskConical },
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
                  <AppointmentCard
                    key={a.id}
                    appt={a}
                    index={i}
                    highlight
                    onCancel={cancelAppt}
                    onReschedule={(appt) => setRescheduleAppt(appt)}
                  />
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

      {tab === 'labs' &&
        (labsLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : (labs?.data || []).length === 0 ? (
          <EmptyState icon={FlaskConical} title={t('portal.noLabResults')} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {(labs?.data || []).map((l, i) => (
              <motion.li
                key={l.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <Card>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{l.test_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(l.resulted_at)}</p>
                    </div>
                    {l.abnormal && (
                      <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        {t('lab.abnormal')}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                    <p className="text-foreground" dir="ltr">
                      <span className="font-medium">{l.result_value}</span>
                      {l.unit && <span className="text-muted-foreground"> {l.unit}</span>}
                    </p>
                    {l.reference_range && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('lab.referenceRange')}: <span dir="ltr">{l.reference_range}</span>
                      </p>
                    )}
                  </div>
                  {l.notes && <p className="mt-2 text-sm text-muted-foreground">{l.notes}</p>}
                </Card>
              </motion.li>
            ))}
          </ul>
        ))}

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
                    <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
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
                      <p className="font-semibold text-foreground" dir="ltr">
                        {inv.invoice_number}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(inv.created_at)}</p>
                    </div>
                    <Badge status={inv.status}>{t(`billing.statuses.${inv.status}`)}</Badge>
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

      {rescheduleAppt && (
        <RescheduleModal
          appt={rescheduleAppt}
          onClose={() => setRescheduleAppt(null)}
          onDone={() => {
            setRescheduleAppt(null)
            mutateAppts()
          }}
        />
      )}
    </Page>
  )
}

function AppointmentCard({ appt, index, highlight = false, onCancel, onReschedule }) {
  const { t } = useTranslation()
  const canAct = !['completed', 'cancelled', 'no_show'].includes(appt.status)
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
          <Badge status={appt.status}>{t(`appointments.statuses.${appt.status}`)}</Badge>
        </div>
        <p className="mt-3 text-sm text-foreground">
          {formatDate(appt.date)} · {formatTime(appt.start_time)}
        </p>
        {appt.reason && <p className="mt-1 text-sm text-muted-foreground">{appt.reason}</p>}
        {highlight && canAct && (
          <div className="mt-3 flex gap-3 border-t border-border pt-3">
            <button
              onClick={() => onReschedule?.(appt)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {t('portal.reschedule')}
            </button>
            <span className="text-border" aria-hidden="true">|</span>
            <button
              onClick={() => onCancel?.(appt)}
              className="text-sm font-medium text-destructive hover:underline"
            >
              {t('portal.cancelAppointment')}
            </button>
          </div>
        )}
      </Card>
    </motion.li>
  )
}

/** Pick a new date + free slot for an existing appointment, then PUT it. */
function RescheduleModal({ appt, onClose, onDone }) {
  const { t } = useTranslation()
  const [date, setDate] = useState(todayISO())
  const [slot, setSlot] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { data: slotsData, isLoading: slotsLoading } = useSWR(
    `/appointments/slots?doctor_id=${appt.doctor_id}&date=${date}`,
    fetcher
  )
  const slots = slotsData?.slots || []

  const submit = async (e) => {
    e.preventDefault()
    if (!slot) return
    setError('')
    setSaving(true)
    try {
      await api.put(`/portal/appointments/${appt.id}`, {
        date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      })
      onDone()
    } catch (err) {
      setError(
        err.response?.status === 409
          ? t('appointments.slotTaken')
          : err.response?.data?.message || t('common.error')
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={t('portal.reschedule')} wide>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {appt.doctor_name} · {appt.specialty}
        </p>
        <Field label={t('appointments.selectDate')} htmlFor="r-date">
          <Input
            id="r-date"
            type="date"
            required
            min={todayISO()}
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setSlot(null)
            }}
          />
        </Field>

        <Field label={t('appointments.availableSlots')}>
          {slotsLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('common.loading')}
            </div>
          ) : slots.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
              <CalendarX className="h-4 w-4" aria-hidden="true" />
              {t('appointments.noSlots')}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((s, i) => {
                const selected = slot?.start_time === s.start_time
                return (
                  <motion.button
                    key={s.start_time}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    onClick={() => setSlot(s)}
                    aria-pressed={selected}
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition-all active:scale-95 ${
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    {formatTime(s.start_time)}
                  </motion.button>
                )
              })}
            </div>
          )}
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={saving || !slot}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {t('portal.reschedule')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
