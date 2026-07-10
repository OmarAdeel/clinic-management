import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { Plus, CalendarDays, Check, X, UserX, Stethoscope } from 'lucide-react'
import api, { fetcher } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Page, PageHeader } from '../components/ui/Page'
import { Table, Row, Cell } from '../components/ui/Table'
import { TableSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import BookAppointmentForm from '../components/appointments/BookAppointmentForm'
import VisitFormModal from '../components/visits/VisitFormModal'
import { Select } from '../components/ui/Field'
import { formatDate, formatTime, todayISO } from '../lib/format'

const STATUSES = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']

export default function AppointmentsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [doctorId, setDoctorId] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState(todayISO())
  const [bookOpen, setBookOpen] = useState(false)
  const [visitAppt, setVisitAppt] = useState(null)

  const params = new URLSearchParams({ page, limit: 15 })
  if (doctorId) params.set('doctor_id', doctorId)
  if (status) params.set('status', status)
  if (from) params.set('from', from)

  const { data, isLoading, mutate } = useSWR(`/appointments?${params}`, fetcher, {
    keepPreviousData: true,
  })
  const { data: doctors } = useSWR('/doctors', fetcher)

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1
  const canBook = ['admin', 'receptionist'].includes(user?.role)
  const isDoctor = user?.role === 'doctor'

  const setApptStatus = async (id, newStatus) => {
    await api.patch(`/appointments/${id}/status`, { status: newStatus })
    mutate()
  }

  return (
    <Page>
      <PageHeader
        title={t('appointments.title')}
        actions={
          canBook && (
            <Button onClick={() => setBookOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('appointments.book')}
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            setPage(1)
          }}
          aria-label={t('common.date')}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {!isDoctor && (
          <Select
            aria-label={t('appointments.filterByDoctor')}
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value)
              setPage(1)
            }}
            className="w-auto"
          >
            <option value="">{t('appointments.filterByDoctor')}</option>
            {(doctors?.data || []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        )}
        <Select
          aria-label={t('appointments.filterByStatus')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="w-auto"
        >
          <option value="">{t('appointments.filterByStatus')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`appointments.statuses.${s}`)}
            </option>
          ))}
        </Select>
        {from && (
          <Button variant="ghost" size="sm" onClick={() => setFrom('')}>
            {t('common.all')}
          </Button>
        )}
      </div>

      {isLoading && !data ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState icon={CalendarDays} title={t('common.noResults')} />
      ) : (
        <>
          <Table
            headers={[
              t('common.date'),
              t('common.time'),
              t('appointments.patient'),
              t('appointments.doctor'),
              t('common.status'),
              t('common.actions'),
            ]}
          >
            {data.data.map((a, i) => (
              <Row key={a.id} index={i}>
                <Cell>{formatDate(a.date)}</Cell>
                <Cell>
                  {formatTime(a.start_time)} – {formatTime(a.end_time)}
                </Cell>
                <Cell className="font-medium">{a.patient_name}</Cell>
                <Cell>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: a.doctor_color || 'var(--color-primary)' }}
                      aria-hidden="true"
                    />
                    {a.doctor_name}
                  </span>
                </Cell>
                <Cell>
                  <Badge status={a.status}>{t(`appointments.statuses.${a.status}`)}</Badge>
                </Cell>
                <Cell>
                  <div className="flex items-center gap-1">
                    {['scheduled'].includes(a.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setApptStatus(a.id, 'confirmed')}
                        aria-label={t('appointments.markConfirmed')}
                        title={t('appointments.markConfirmed')}
                      >
                        <Check className="h-4 w-4 text-success" aria-hidden="true" />
                      </Button>
                    )}
                    {isDoctor && ['scheduled', 'confirmed'].includes(a.status) && (
                      <Button variant="outline" size="sm" onClick={() => setVisitAppt(a)}>
                        <Stethoscope className="h-4 w-4" aria-hidden="true" />
                        {t('appointments.startVisit')}
                      </Button>
                    )}
                    {['scheduled', 'confirmed'].includes(a.status) && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setApptStatus(a.id, 'no_show')}
                          aria-label={t('appointments.markNoShow')}
                          title={t('appointments.markNoShow')}
                        >
                          <UserX className="h-4 w-4 text-warning" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setApptStatus(a.id, 'cancelled')}
                          aria-label={t('appointments.markCancelled')}
                          title={t('appointments.markCancelled')}
                        >
                          <X className="h-4 w-4 text-destructive" aria-hidden="true" />
                        </Button>
                      </>
                    )}
                  </div>
                </Cell>
              </Row>
            ))}
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t('common.pageOf', { page, pages })}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('common.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        </>
      )}

      <Modal open={bookOpen} onClose={() => setBookOpen(false)} title={t('appointments.book')} wide>
        <BookAppointmentForm
          onDone={() => {
            setBookOpen(false)
            mutate()
          }}
          onCancel={() => setBookOpen(false)}
        />
      </Modal>

      {visitAppt && (
        <VisitFormModal
          appointment={visitAppt}
          onClose={() => setVisitAppt(null)}
          onSaved={() => {
            setVisitAppt(null)
            mutate()
          }}
        />
      )}
    </Page>
  )
}
