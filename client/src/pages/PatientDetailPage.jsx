import { useState } from 'react'
import useSWR from 'swr'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowLeft, Pencil, Trash2, ClipboardList, Receipt, Pill } from 'lucide-react'
import api, { fetcher } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Page, PageHeader } from '../components/ui/Page'
import { Card } from '../components/ui/Card'
import { TableSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import PatientForm from '../components/patients/PatientForm'
import { formatDate, formatTime, formatMoney, ageFromDob } from '../lib/format'

function InfoItem({ label, value, dir }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground" dir={dir}>
        {value || '—'}
      </dd>
    </div>
  )
}

export default function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [tab, setTab] = useState('visits')

  const { data, isLoading, mutate } = useSWR(`/patients/${id}`, fetcher)

  const handleUpdate = async (values) => {
    await api.put(`/patients/${id}`, values)
    setEditOpen(false)
    mutate()
  }

  const handleDelete = async () => {
    if (!window.confirm(t('patients.deleteConfirm'))) return
    await api.delete(`/patients/${id}`)
    navigate('/patients')
  }

  if (isLoading || !data) {
    return (
      <Page>
        <TableSkeleton rows={6} />
      </Page>
    )
  }

  const { patient, visits, invoices } = data
  const age = ageFromDob(patient.dob)

  return (
    <Page>
      <Link
        to="/patients"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        {t('common.back')}
      </Link>

      <PageHeader
        title={patient.full_name}
        subtitle={`${age != null ? t('common.years', { count: age }) : ''} ${
          patient.gender ? '· ' + t(`patients.${patient.gender}`) : ''
        }`}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {t('common.edit')}
            </Button>
            {user?.role === 'admin' && (
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t('common.delete')}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overview card */}
        <Card>
          <h2 className="mb-4 text-base font-medium text-foreground">{t('patients.overview')}</h2>
          <dl className="grid grid-cols-2 gap-4">
            <InfoItem label={t('patients.phone')} value={patient.phone} dir="ltr" />
            <InfoItem label={t('patients.email')} value={patient.email} dir="ltr" />
            <InfoItem label={t('patients.dob')} value={formatDate(patient.dob)} />
            <InfoItem label={t('patients.bloodType')} value={patient.blood_type} />
            <div className="col-span-2">
              <InfoItem label={t('patients.address')} value={patient.address} />
            </div>
            <div className="col-span-2">
              <InfoItem label={t('patients.allergies')} value={patient.allergies} />
            </div>
            <div className="col-span-2">
              <InfoItem label={t('patients.medicalNotes')} value={patient.medical_notes} />
            </div>
          </dl>
        </Card>

        {/* History tabs */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1" role="tablist">
            {[
              { key: 'visits', label: t('patients.visitsHistory'), icon: ClipboardList },
              { key: 'invoices', label: t('patients.invoices'), icon: Receipt },
            ].map((tb) => (
              <button
                key={tb.key}
                type="button"
                role="tab"
                aria-selected={tab === tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  tab === tb.key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tb.icon className="h-4 w-4" aria-hidden="true" />
                {tb.label}
              </button>
            ))}
          </div>

          {tab === 'visits' &&
            (visits.length === 0 ? (
              <EmptyState icon={ClipboardList} title={t('patients.noVisits')} />
            ) : (
              <div className="space-y-4">
                {visits.map((v, i) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <Card>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {formatDate(v.date)} · {formatTime(v.start_time)}
                        </p>
                        <p className="text-xs text-muted-foreground">{v.doctor_name}</p>
                      </div>
                      {v.diagnosis && (
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{t('visits.diagnosis')}: </span>
                          {v.diagnosis}
                        </p>
                      )}
                      {v.symptoms && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-medium">{t('visits.symptoms')}: </span>
                          {v.symptoms}
                        </p>
                      )}
                      {v.prescriptions?.length > 0 && (
                        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                          {v.prescriptions.map((rx) => (
                            <li key={rx.id} className="flex items-center gap-2 text-sm text-foreground">
                              <Pill className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                              <span className="font-medium">{rx.medication}</span>
                              <span className="text-muted-foreground">
                                {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            ))}

          {tab === 'invoices' &&
            (invoices.length === 0 ? (
              <EmptyState icon={Receipt} title={t('patients.noInvoices')} />
            ) : (
              <div className="space-y-3">
                {invoices.map((inv, i) => (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground" dir="ltr">
                        {inv.invoice_number}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(inv.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{formatMoney(inv.total)}</span>
                      <Badge status={inv.status}>{t(`billing.statuses.${inv.status}`)}</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t('patients.editPatient')} wide>
        <PatientForm initial={patient} onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} />
      </Modal>
    </Page>
  )
}
