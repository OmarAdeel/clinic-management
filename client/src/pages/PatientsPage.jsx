import { useState } from 'react'
import useSWR from 'swr'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Users } from 'lucide-react'
import api, { fetcher } from '../lib/api'
import { Page, PageHeader } from '../components/ui/Page'
import { Table, Row, Cell } from '../components/ui/Table'
import { TableSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import PatientForm from '../components/patients/PatientForm'
import { formatDate, ageFromDob } from '../lib/format'

export default function PatientsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)

  const key = `/patients?page=${page}&limit=10&search=${encodeURIComponent(search)}`
  const { data, isLoading, mutate } = useSWR(key, fetcher, { keepPreviousData: true })

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  const handleCreate = async (values) => {
    await api.post('/patients', values)
    setModalOpen(false)
    mutate()
  }

  return (
    <Page>
      <PageHeader
        title={t('patients.title')}
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('patients.addPatient')}
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder={t('patients.searchPlaceholder')}
          aria-label={t('patients.searchPlaceholder')}
          className="w-full rounded-lg border border-border bg-card py-2 pe-3 ps-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {isLoading && !data ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState
          icon={Users}
          title={t('common.noResults')}
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('patients.addPatient')}
            </Button>
          }
        />
      ) : (
        <>
          <Table
            headers={[
              t('patients.fullName'),
              t('patients.age'),
              t('patients.gender'),
              t('patients.phone'),
              t('patients.bloodType'),
              t('patients.registered'),
            ]}
          >
            {data.data.map((p, i) => {
              const age = ageFromDob(p.dob)
              return (
                <Row key={p.id} index={i} onClick={() => navigate(`/patients/${p.id}`)}>
                  <Cell className="font-medium">{p.full_name}</Cell>
                  <Cell>{age != null ? t('common.years', { count: age }) : '—'}</Cell>
                  <Cell>{p.gender ? t(`patients.${p.gender}`) : '—'}</Cell>
                  <Cell>
                    <span dir="ltr">{p.phone || '—'}</span>
                  </Cell>
                  <Cell>{p.blood_type || '—'}</Cell>
                  <Cell className="text-muted-foreground">{formatDate(p.created_at)}</Cell>
                </Row>
              )
            })}
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('common.pageOf', { page, pages })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('patients.addPatient')} wide>
        <PatientForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>
    </Page>
  )
}
