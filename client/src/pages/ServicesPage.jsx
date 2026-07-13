import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react'
import api, { fetcher } from '../lib/api'
import { Page, PageHeader } from '../components/ui/Page'
import { Table, Row, Cell } from '../components/ui/Table'
import { TableSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Field, Input, Select } from '../components/ui/Field'
import { formatMoney } from '../lib/format'

const CATEGORIES = ['consultation', 'procedure', 'lab', 'imaging', 'medicine', 'other']

function EmptyFormState() {
  return { name: '', code: '', category: 'other', unit_price: '', is_active: true }
}

export default function ServicesPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [active, setActive] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EmptyFormState())
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // SWR key ties filters to refresh
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (category) params.set('category', category)
  if (active) params.set('active', active)
  const key = `/services?${params.toString()}`
  const { data, isLoading, mutate } = useSWR(key, fetcher)

  const services = data?.data || []

  const openCreate = () => {
    setEditing(null)
    setForm(EmptyFormState())
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (svc) => {
    setEditing(svc)
    setForm({
      name: svc.name,
      code: svc.code || '',
      category: svc.category,
      unit_price: String(svc.unit_price ?? ''),
      is_active: !!svc.is_active,
    })
    setFormError('')
    setShowModal(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        category: form.category,
        unit_price: Number(form.unit_price) || 0,
        is_active: form.is_active,
      }
      if (editing) {
        await api.put(`/services/${editing.id}`, payload)
      } else {
        await api.post('/services', payload)
      }
      setShowModal(false)
      mutate()
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (svc) => {
    if (!window.confirm(`${t('common.delete')}?`)) return
    try {
      await api.delete(`/services/${svc.id}`)
      mutate()
    } catch (err) {
      alert(err.response?.data?.message || err.message || t('common.error'))
    }
  }

  return (
    <Page>
      <PageHeader
        title={t('services.title')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('services.addService')}
          </Button>
        }
      />

      {/* Filter row */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('services.name')}
            aria-label={t('common.search')}
            className="w-full rounded-lg border border-border bg-card py-2 pe-3 ps-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label={t('services.category')}
          className="sm:w-48"
        >
          <option value="">{t('common.all')}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`services.categories.${c}`)}
            </option>
          ))}
        </Select>
        <Select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          aria-label={t('services.active')}
          className="sm:w-40"
        >
          <option value="">{t('common.all')}</option>
          <option value="true">{t('services.active')}</option>
          <option value="false">{t('common.no')}</option>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : services.length === 0 ? (
        <EmptyState icon={Plus} title={t('services.noServices')} />
      ) : (
        <Table
          headers={[
            t('services.name'),
            t('services.code'),
            t('services.category'),
            t('services.unitPrice'),
            t('services.active'),
            t('common.actions'),
          ]}
        >
          {services.map((s, i) => (
            <Row key={s.id} index={i}>
              <Cell className="font-medium">{s.name}</Cell>
              <Cell className="font-mono text-xs text-muted-foreground">{s.code || '—'}</Cell>
              <Cell>{t(`services.categories.${s.category}`)}</Cell>
              <Cell>{formatMoney(s.unit_price)}</Cell>
              <Cell>
                {s.is_active ? (
                  <span className="inline-flex rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600">
                    {t('services.active')}
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {t('common.no')}
                  </span>
                )}
              </Cell>
              <Cell>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(s)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title={t('common.edit')}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => onDelete(s)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-500"
                    title={t('common.delete')}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? t('services.editService') : t('services.addService')}
      >
        <form onSubmit={submit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>
          )}
          <Field label={t('services.name')} htmlFor="svc-name">
            <Input
              id="svc-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label={t('services.code')} htmlFor="svc-code">
            <Input
              id="svc-code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </Field>
          <Field label={t('services.category')} htmlFor="svc-category">
            <Select
              id="svc-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`services.categories.${c}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('services.unitPrice')} htmlFor="svc-price">
            <Input
              id="svc-price"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.unit_price}
              onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
            />
          </Field>
          {editing && (
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t('services.active')}
            </label>
          )}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </Page>
  )
}