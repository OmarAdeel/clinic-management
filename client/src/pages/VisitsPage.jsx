import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { ClipboardList, Printer } from 'lucide-react'
import { fetcher } from '../lib/api'
import { Page, PageHeader } from '../components/ui/Page'
import { Table, Row, Cell } from '../components/ui/Table'
import { TableSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import PrescriptionPrint from '../components/visits/PrescriptionPrint'
import { formatDate, formatTime } from '../lib/format'

/**
 * Completed visits: doctors see their own, admins see all.
 * Clicking a row opens the visit detail with a printable prescription.
 */
export default function VisitsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)

  const { data, isLoading } = useSWR(`/appointments?status=completed&page=${page}&limit=15`, fetcher, {
    keepPreviousData: true,
  })
  const { data: detail } = useSWR(selectedId ? `/appointments/${selectedId}` : null, fetcher)

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <Page>
      <PageHeader title={t('nav.visits')} />

      {isLoading && !data ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState icon={ClipboardList} title={t('common.noResults')} />
      ) : (
        <>
          <Table
            headers={[
              t('common.date'),
              t('common.time'),
              t('appointments.patient'),
              t('appointments.doctor'),
              t('appointments.reason'),
            ]}
          >
            {data.data.map((a, i) => (
              <Row key={a.id} index={i} onClick={() => setSelectedId(a.id)}>
                <Cell>{formatDate(a.date)}</Cell>
                <Cell>{formatTime(a.start_time)}</Cell>
                <Cell className="font-medium">{a.patient_name}</Cell>
                <Cell>{a.doctor_name}</Cell>
                <Cell className="text-muted-foreground">{a.reason || '—'}</Cell>
              </Row>
            ))}
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t('common.pageOf', { page, pages })}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('common.previous')}
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                {t('common.next')}
              </Button>
            </div>
          </div>
        </>
      )}

      <Modal
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        title={t('visits.title')}
        wide
      >
        {!detail ? (
          <TableSkeleton rows={4} />
        ) : (
          <div>
            <PrescriptionPrint appointment={detail.appointment} visit={detail.visit} />
            <div className="mt-4 flex justify-end print:hidden">
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden="true" />
                {t('visits.printPrescription')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  )
}
