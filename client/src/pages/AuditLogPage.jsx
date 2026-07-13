import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { History, User } from 'lucide-react'
import api, { fetcher } from '../lib/api'
import { Page, PageHeader } from '../components/ui/Page'
import { Table, Row, Cell } from '../components/ui/Table'
import { TableSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { Field, Select, Input } from '../components/ui/Field'
import Button from '../components/ui/Button'
import { formatDate, formatTime } from '../lib/format'

const ENTITIES = [
  'user', 'patient', 'appointment', 'invoice', 'doctor', 'service',
  'doctor_leave', 'lab_tests', 'lab_catalog', 'insurance_provider',
  'insurance_claim', 'clinic_settings',
]

// formatTime expects an "HH:MM" string; derive that from an ISO timestamp in local time.
function localHM(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function AuditLogPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [entity, setEntity] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const params = new URLSearchParams({ page, limit: 15 })
  if (action) params.set('action', action)
  if (entity) params.set('entity', entity)
  if (from) params.set('from', from)
  if (to) params.set('to', to)

  const { data, isLoading } = useSWR(`/audit?${params}`, fetcher, {
    keepPreviousData: true,
  })

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <Page>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" aria-hidden="true" />
            {t('audit.title')}
          </span>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Field label={t('audit.filterByAction')} htmlFor="audit-action">
            <Input
              id="audit-action"
              value={action}
              onChange={(e) => {
                setAction(e.target.value)
                setPage(1)
              }}
              placeholder={t('common.search')}
            />
          </Field>
        </div>
        <div className="w-48">
          <Field label={t('audit.filterByEntity')} htmlFor="audit-entity">
            <Select
              id="audit-entity"
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value)
                setPage(1)
              }}
            >
              <option value="">{t('common.all')}</option>
              {ENTITIES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="w-40">
          <Field label={t('leave.startDate')} htmlFor="audit-from">
            <Input
              id="audit-from"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPage(1)
              }}
            />
          </Field>
        </div>
        <div className="w-40">
          <Field label={t('leave.endDate')} htmlFor="audit-to">
            <Input
              id="audit-to"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPage(1)
              }}
            />
          </Field>
        </div>
      </div>

      {isLoading && !data ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState icon={History} title={t('audit.noResults')} />
      ) : (
        <>
          <Table
            headers={[
              t('audit.when'),
              t('audit.user'),
              t('audit.role'),
              t('audit.action'),
              t('audit.entity'),
              t('audit.entityId'),
              t('audit.ip'),
              t('audit.details'),
            ]}
          >
            {data.data.map((l, i) => {
              const hm = localHM(l.created_at)
              const detailStr = l.details == null ? null : JSON.stringify(l.details)
              return (
                <Row key={l.id} index={i}>
                  <Cell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(l.created_at)}
                    {hm && <span className="block text-xs">{formatTime(hm)}</span>}
                  </Cell>
                  <Cell className="font-medium">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      {l.user_name || '—'}
                    </span>
                  </Cell>
                  <Cell>{l.role || '—'}</Cell>
                  <Cell className="font-mono text-xs">{l.action}</Cell>
                  <Cell className="font-mono text-xs">{l.entity}</Cell>
                  <Cell>{l.entity_id ?? '—'}</Cell>
                  <Cell>
                    <span dir="ltr">{l.ip_address || '—'}</span>
                  </Cell>
                  <Cell>
                    {detailStr == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span title={detailStr} className="text-xs text-muted-foreground">
                        {detailStr.length > 80 ? `${detailStr.slice(0, 80)}…` : detailStr}
                      </span>
                    )}
                  </Cell>
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
    </Page>
  )
}