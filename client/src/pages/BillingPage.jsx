import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { Plus, Receipt, Search } from 'lucide-react'
import api, { fetcher } from '../lib/api'
import { Page, PageHeader } from '../components/ui/Page'
import { Table, Row, Cell } from '../components/ui/Table'
import { TableSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { Select } from '../components/ui/Field'
import InvoiceForm from '../components/billing/InvoiceForm'
import InvoiceDetail from '../components/billing/InvoiceDetail'
import { formatDate, formatMoney } from '../lib/format'

const STATUSES = ['unpaid', 'partial', 'paid', 'cancelled']

export default function BillingPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const params = new URLSearchParams({ page, limit: 15 })
  if (status) params.set('status', status)
  if (search) params.set('search', search)

  const { data, isLoading, mutate } = useSWR(`/invoices?${params}`, fetcher, {
    keepPreviousData: true,
  })

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <Page>
      <PageHeader
        title={t('billing.title')}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('billing.createInvoice')}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
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
            placeholder={t('common.search')}
            aria-label={t('common.search')}
            className="w-full rounded-lg border border-border bg-card py-2 pe-3 ps-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Select
          aria-label={t('common.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="w-auto"
        >
          <option value="">{t('common.all')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`billing.statuses.${s}`)}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && !data ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState icon={Receipt} title={t('common.noResults')} />
      ) : (
        <>
          <Table
            headers={[
              t('billing.invoiceNumber'),
              t('appointments.patient'),
              t('common.date'),
              t('common.total'),
              t('billing.paid'),
              t('common.status'),
            ]}
          >
            {data.data.map((inv, i) => (
              <Row key={inv.id} index={i} onClick={() => setSelectedId(inv.id)}>
                <Cell className="font-medium">
                  <span dir="ltr">{inv.invoice_number}</span>
                </Cell>
                <Cell>{inv.patient_name}</Cell>
                <Cell>{formatDate(inv.created_at)}</Cell>
                <Cell className="font-medium">{formatMoney(inv.total)}</Cell>
                <Cell className="text-muted-foreground">{formatMoney(inv.paid_amount)}</Cell>
                <Cell>
                  <Badge status={inv.status}>{t(`billing.statuses.${inv.status}`)}</Badge>
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
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                {t('common.next')}
              </Button>
            </div>
          </div>
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t('billing.createInvoice')} wide>
        <InvoiceForm
          onDone={() => {
            setCreateOpen(false)
            mutate()
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {selectedId && (
        <InvoiceDetail
          invoiceId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={mutate}
        />
      )}
    </Page>
  )
}
