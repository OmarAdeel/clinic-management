import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Plus, Stethoscope, Pencil, CalendarClock } from 'lucide-react'
import api, { fetcher } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Page, PageHeader, staggerContainer, staggerItem } from '../components/ui/Page'
import { StatsSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import DoctorForm from '../components/doctors/DoctorForm'
import ScheduleEditor from '../components/doctors/ScheduleEditor'
import { formatMoney } from '../lib/format'

export default function DoctorsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [scheduleFor, setScheduleFor] = useState(null)

  const { data, isLoading, mutate } = useSWR('/doctors', fetcher)
  const isAdmin = user?.role === 'admin'

  const handleSubmit = async (values) => {
    if (editing) {
      await api.put(`/doctors/${editing.id}`, values)
    } else {
      await api.post('/doctors', values)
    }
    setFormOpen(false)
    setEditing(null)
    mutate()
  }

  return (
    <Page>
      <PageHeader
        title={t('doctors.title')}
        actions={
          isAdmin && (
            <Button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('doctors.addDoctor')}
            </Button>
          )
        }
      />

      {isLoading ? (
        <StatsSkeleton count={6} />
      ) : !data?.data?.length ? (
        <EmptyState icon={Stethoscope} title={t('common.noResults')} />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {data.data.map((d) => (
            <motion.div
              key={d.id}
              variants={staggerItem}
              className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
                    style={{ backgroundColor: d.color || 'var(--color-primary)' }}
                    aria-hidden="true"
                  >
                    {d.name
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{d.name}</p>
                    <p className="text-sm text-muted-foreground">{d.specialty}</p>
                  </div>
                </div>
                <Badge status={d.is_active ? 'active' : 'inactive'}>
                  {d.is_active ? t('doctors.active') : t('doctors.inactive')}
                </Badge>
              </div>

              <p className="mb-1 text-sm text-muted-foreground" dir="ltr">
                {d.email}
              </p>
              <p className="text-sm text-foreground">
                {t('doctors.fee')}: <span className="font-medium">{formatMoney(d.consultation_fee)}</span>
              </p>

              <div className="mt-4 flex gap-2 border-t border-border pt-3">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(d)
                      setFormOpen(true)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('common.edit')}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setScheduleFor(d)}>
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('doctors.schedule')}
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        title={editing ? t('doctors.editDoctor') : t('doctors.addDoctor')}
        wide
      >
        <DoctorForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        />
      </Modal>

      {scheduleFor && (
        <ScheduleEditor
          doctor={scheduleFor}
          readOnly={!isAdmin}
          onClose={() => setScheduleFor(null)}
        />
      )}
    </Page>
  )
}
