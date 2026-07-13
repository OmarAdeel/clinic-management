import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2, FlaskConical, Trash2, X } from 'lucide-react'
import api, { fetcher } from '../lib/api'
import { Page, PageHeader } from '../components/ui/Page'
import { Table, Row, Cell } from '../components/ui/Table'
import { TableSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { formatDate, formatTime } from '../lib/format'

const STATUS_FILTERS = ['', 'ordered', 'resulted', 'cancelled']
const STATUS_PILL = {
  ordered: 'bg-amber-500/10 text-amber-600',
  collected: 'bg-blue-500/10 text-blue-600',
  resulted: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
}

const EMPTY_TEST = { name: '', specimen: '', unit: '', reference_range: '' }

export default function LabTestsPage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState('')
  const [orderOpen, setOrderOpen] = useState(false)
  const [order, setOrder] = useState({ patient_id: '', tests: [{ ...EMPTY_TEST }] })
  const [orderError, setOrderError] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [resultFor, setResultFor] = useState(null) // lab test being resulted
  const [resultForm, setResultForm] = useState({ result_value: '', unit: '', reference_range: '', abnormal: false, notes: '' })
  const [resultError, setResultError] = useState('')
  const [resulting, setResulting] = useState(false)

  const params = new URLSearchParams()
  if (status) params.set('status', status)
  const { data, isLoading, mutate } = useSWR(`/lab-tests?${params}`, fetcher)
  const { data: patientsData } = useSWR('/patients?limit=100', fetcher)

  const tests = data?.data || []
  const patients = patientsData?.data || []

  const openOrder = () => {
    setOrder({ patient_id: '', tests: [{ ...EMPTY_TEST }] })
    setOrderError('')
    setOrderOpen(true)
  }

  const addTestRow = () => setOrder((o) => ({ ...o, tests: [...o.tests, { ...EMPTY_TEST }] }))
  const removeTestRow = (idx) =>
    setOrder((o) => ({
      ...o,
      tests: o.tests.filter((_, i) => i !== idx),
    }))
  const patchRow = (idx, k) => (e) =>
    setOrder((o) => ({
      ...o,
      tests: o.tests.map((r, i) => (i === idx ? { ...r, [k]: e.target.value } : r)),
    }))

  const submitOrder = async (e) => {
    e.preventDefault()
    setOrderError('')
    setOrdering(true)
    try {
      const valid = order.tests.filter((t2) => t2.name.trim())
      if (!order.patient_id || valid.length === 0) {
        setOrderError(t('common.error'))
        return
      }
      await api.post('/lab-tests', {
        patient_id: Number(order.patient_id),
        tests: valid.map((t2) => ({
          name: t2.name.trim(),
          specimen: t2.specimen || undefined,
          unit: t2.unit || undefined,
          reference_range: t2.reference_range || undefined,
        })),
      })
      setOrderOpen(false)
      mutate()
    } catch (err) {
      setOrderError(err.response?.data?.message || err.message || t('common.error'))
    } finally {
      setOrdering(false)
    }
  }

  const openResult = (test) => {
    setResultFor(test)
    setResultForm({
      result_value: test.result_value || '',
      unit: test.unit || '',
      reference_range: test.reference_range || '',
      abnormal: !!test.abnormal,
      notes: '',
    })
    setResultError('')
  }

  const submitResult = async (e) => {
    e.preventDefault()
    setResultError('')
    setResulting(true)
    try {
      await api.put(`/lab-tests/${resultFor.id}/result`, {
        result_value: resultForm.result_value || undefined,
        unit: resultForm.unit || undefined,
        reference_range: resultForm.reference_range || undefined,
        abnormal: resultForm.abnormal,
        notes: resultForm.notes || undefined,
      })
      setResultFor(null)
      mutate()
    } catch (err) {
      setResultError(err.response?.data?.message || err.message || t('common.error'))
    } finally {
      setResulting(false)
    }
  }

  const cancelTest = async (id) => {
    if (!window.confirm(`${t('lab.cancelTest')}?`)) return
    try {
      await api.patch(`/lab-tests/${id}/cancel`)
      mutate()
    } catch (err) {
      alert(err.response?.data?.message || err.message || t('common.error'))
    }
  }

  const filters = [
    { id: '', label: t('common.all') },
    { id: 'ordered', label: t('lab.statuses.ordered') },
    { id: 'resulted', label: t('lab.statuses.resulted') },
    { id: 'cancelled', label: t('lab.statuses.cancelled') },
  ]

  return (
    <Page>
      <PageHeader
        title={t('lab.title')}
        actions={
          <Button onClick={openOrder}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('lab.orderTests')}
          </Button>
        }
      />

      <div className="mb-6 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setStatus(f.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              status === f.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-primary/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : tests.length === 0 ? (
        <EmptyState icon={FlaskConical} title={t('lab.noTests')} />
      ) : (
        <Table
          headers={[
            t('lab.orderedFor'),
            t('lab.testName'),
            t('lab.result'),
            t('common.status'),
            t('common.date'),
            t('common.actions'),
          ]}
        >
          {tests.map((t2, i) => (
            <Row key={t2.id} index={i}>
              <Cell className="font-medium">{t2.patient_name || '—'}</Cell>
              <Cell>
                <div className="font-medium">{t2.test_name}</div>
                {t2.specimen && <div className="text-xs text-muted-foreground">{t('lab.specimen')}: {t2.specimen}</div>}
              </Cell>
              <Cell>
                {t2.result_value ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium" dir="ltr">
                      {t2.result_value}
                      {t2.unit ? ` ${t2.unit}` : ''}
                    </span>
                    {t2.abnormal && (
                      <span className="inline-flex rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600">
                        {t('lab.abnormal')}
                      </span>
                    )}
                    {t2.reference_range && (
                      <span className="text-xs text-muted-foreground">({t2.reference_range})</span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Cell>
              <Cell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    STATUS_PILL[t2.status] || STATUS_PILL.ordered
                  }`}
                >
                  {t(`lab.statuses.${t2.status}`)}
                </span>
              </Cell>
              <Cell className="whitespace-nowrap text-muted-foreground">
                {formatDate(t2.ordered_at)}
                <div className="text-xs">{formatTime(String(t2.ordered_at).slice(11, 16))}</div>
              </Cell>
              <Cell>
                <div className="flex items-center gap-2">
                  {t2.status !== 'resulted' && t2.status !== 'cancelled' && (
                    <Button size="sm" variant="outline" onClick={() => openResult(t2)}>
                      {t('lab.resultLabel')}
                    </Button>
                  )}
                  {t2.status !== 'cancelled' && t2.status !== 'resulted' && (
                    <button
                      onClick={() => cancelTest(t2.id)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-500"
                      title={t('lab.cancelTest')}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      {/* Order tests modal */}
      <Modal open={orderOpen} onClose={() => setOrderOpen(false)} title={t('lab.orderTests')} wide>
        <form onSubmit={submitOrder} className="space-y-4">
          {orderError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{orderError}</div>
          )}
          <Field label={t('lab.orderedFor')} htmlFor="lab-patient">
            <Select
              id="lab-patient"
              required
              value={order.patient_id}
              onChange={(e) => setOrder((o) => ({ ...o, patient_id: e.target.value }))}
            >
              <option value="">—</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="space-y-2">
            {order.tests.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 rounded-lg border border-border bg-muted/30 p-2">
                <div className="col-span-5">
                  <input
                    required
                    placeholder={t('lab.testName')}
                    value={row.name}
                    onChange={patchRow(idx, 'name')}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    placeholder={t('lab.specimen')}
                    value={row.specimen}
                    onChange={patchRow(idx, 'specimen')}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    placeholder={t('lab.unit')}
                    value={row.unit}
                    onChange={patchRow(idx, 'unit')}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  <input
                    placeholder={t('lab.referenceRange')}
                    value={row.reference_range}
                    onChange={patchRow(idx, 'reference_range')}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {order.tests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTestRow(idx)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addTestRow}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('lab.addAnother')}
          </Button>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setOrderOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={ordering || !order.patient_id}>
              {ordering && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Result modal */}
      <Modal open={!!resultFor} onClose={() => setResultFor(null)} title={t('lab.resultLabel')}>
        {resultFor && (
          <form onSubmit={submitResult} className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <span className="text-muted-foreground">{t('lab.testName')}: </span>
              <span className="font-medium">{resultFor.test_name}</span>
              {resultFor.patient_name && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {t('lab.orderedFor')}: {resultFor.patient_name}
                </div>
              )}
            </div>
            {resultError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{resultError}</div>
            )}
            <Field label={t('lab.result')} htmlFor="r-val">
              <Input id="r-val" value={resultForm.result_value} onChange={(e) => setResultForm({ ...resultForm, result_value: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('lab.unit')} htmlFor="r-unit">
                <Input id="r-unit" value={resultForm.unit} onChange={(e) => setResultForm({ ...resultForm, unit: e.target.value })} />
              </Field>
              <Field label={t('lab.referenceRange')} htmlFor="r-ref">
                <Input id="r-ref" value={resultForm.reference_range} onChange={(e) => setResultForm({ ...resultForm, reference_range: e.target.value })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={resultForm.abnormal}
                onChange={(e) => setResultForm({ ...resultForm, abnormal: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t('lab.abnormal')}
            </label>
            <Field label={t('common.status')} htmlFor="r-notes">
              <Textarea id="r-notes" rows={2} value={resultForm.notes} onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })} />
            </Field>
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => setResultFor(null)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={resulting}>
                {resulting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {t('common.save')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </Page>
  )
}