import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { Plus, Building2, FileText, Loader2 } from 'lucide-react'
import api, { fetcher } from '../lib/api'
import { Page, PageHeader } from '../components/ui/Page'
import { Table, Row, Cell } from '../components/ui/Table'
import { TableSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { formatMoney, formatDate } from '../lib/format'

const CLAIM_STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'paid', 'cancelled']

const STATUS_BADGE = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-blue-500/10 text-blue-600',
  paid: 'bg-green-500/10 text-green-600',
  rejected: 'bg-red-500/10 text-red-600',
  cancelled: 'bg-red-500/10 text-red-600',
}

function StatusBadge({ status }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_BADGE[status] || STATUS_BADGE.draft
      }`}
    >
      {t(`insurance.statuses.${status}`)}
    </span>
  )
}

export default function InsurancePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('providers')

  const { data: providersData, isLoading: providersLoading, mutate: mutateProviders } = useSWR(
    '/insurance/providers',
    fetcher,
  )
  const { data: claimsData, isLoading: claimsLoading, mutate: mutateClaims } = useSWR(
    '/insurance/claims',
    fetcher,
  )
  const { data: patientsData } = useSWR('/patients?limit=100', fetcher)

  const providers = providersData?.data || []
  const claims = claimsData?.data || []
  const patients = patientsData?.data || []

  const [providerModalOpen, setProviderModalOpen] = useState(false)
  const [providerForm, setProviderForm] = useState({ name: '', contact_phone: '', contact_email: '' })
  const [providerSubmitting, setProviderSubmitting] = useState(false)
  const [providerError, setProviderError] = useState('')

  const [claimModalOpen, setClaimModalOpen] = useState(false)
  const [claimForm, setClaimForm] = useState({
    provider_id: '', patient_id: '', amount: '', notes: '', status: 'draft',
  })
  const [claimSubmitting, setClaimSubmitting] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const openProviderModal = () => {
    setProviderForm({ name: '', contact_phone: '', contact_email: '' })
    setProviderError('')
    setProviderModalOpen(true)
  }

  const handleProviderSubmit = async (e) => {
    e.preventDefault()
    setProviderError('')
    setProviderSubmitting(true)
    try {
      await api.post('/insurance/providers', {
        name: providerForm.name,
        contact_phone: providerForm.contact_phone || undefined,
        contact_email: providerForm.contact_email || undefined,
        is_active: true,
      })
      setProviderModalOpen(false)
      mutateProviders()
    } catch (err) {
      setProviderError(err.response?.data?.message || err.message || t('common.error'))
    } finally {
      setProviderSubmitting(false)
    }
  }

  const openClaimModal = () => {
    setClaimForm({ provider_id: '', patient_id: '', amount: '', notes: '', status: 'draft' })
    setClaimError('')
    setClaimModalOpen(true)
  }

  const handleClaimSubmit = async (e) => {
    e.preventDefault()
    setClaimError('')
    setClaimSubmitting(true)
    try {
      await api.post('/insurance/claims', {
        patient_id: Number(claimForm.patient_id),
        provider_id: Number(claimForm.provider_id),
        amount: Number(claimForm.amount),
        notes: claimForm.notes || undefined,
        status: claimForm.status,
      })
      setClaimModalOpen(false)
      mutateClaims()
    } catch (err) {
      setClaimError(err.response?.data?.message || err.message || t('common.error'))
    } finally {
      setClaimSubmitting(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id)
    try {
      await api.patch(`/insurance/claims/${id}/status`, { status })
      mutateClaims()
    } catch (err) {
      alert(err.response?.data?.message || err.message || t('common.error'))
    } finally {
      setUpdatingId(null)
    }
  }

  const tabs = [
    { id: 'providers', label: t('insurance.providers'), icon: Building2 },
    { id: 'claims', label: t('insurance.claims'), icon: FileText },
  ]

  return (
    <Page>
      <PageHeader
        title={t('insurance.title')}
        actions={
          tab === 'providers' ? (
            <Button onClick={openProviderModal}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('insurance.addProvider')}
            </Button>
          ) : (
            <Button onClick={openClaimModal}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('insurance.addClaim')}
            </Button>
          )
        }
      />

      <div role="tablist" aria-label={t('insurance.title')} className="mb-6 flex gap-2 overflow-x-auto">
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

      {tab === 'providers' &&
        (providersLoading && !providersData ? (
          <TableSkeleton />
        ) : providers.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={t('common.noResults')}
            action={
              <Button onClick={openProviderModal}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('insurance.addProvider')}
              </Button>
            }
          />
        ) : (
          <Table
            headers={[
              t('insurance.providerName'),
              t('insurance.contactPhone'),
              t('insurance.contactEmail'),
              t('common.status'),
            ]}
          >
            {providers.map((p, i) => (
              <Row key={p.id} index={i}>
                <Cell className="font-medium">{p.name}</Cell>
                <Cell>
                  <span dir="ltr">{p.contact_phone || '—'}</span>
                </Cell>
                <Cell>{p.contact_email || '—'}</Cell>
                <Cell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.is_active
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {p.is_active ? t('doctors.active') : t('doctors.inactive')}
                  </span>
                </Cell>
              </Row>
            ))}
          </Table>
        ))}

      {tab === 'claims' &&
        (claimsLoading && !claimsData ? (
          <TableSkeleton />
        ) : claims.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('common.noResults')}
            action={
              <Button onClick={openClaimModal}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('insurance.addClaim')}
              </Button>
            }
          />
        ) : (
          <Table
            headers={[
              t('insurance.claimNumber'),
              t('insurance.provider'),
              t('insurance.patient'),
              t('insurance.amount'),
              t('insurance.status'),
              t('insurance.invoice'),
              t('common.date'),
              t('common.actions'),
            ]}
          >
            {claims.map((c, i) => (
              <Row key={c.id} index={i}>
                <Cell className="font-medium">{c.claim_number}</Cell>
                <Cell>{c.provider_name || '—'}</Cell>
                <Cell>{c.patient_name || '—'}</Cell>
                <Cell className="font-medium">{formatMoney(c.amount)}</Cell>
                <Cell>
                  <StatusBadge status={c.status} />
                </Cell>
                <Cell>{c.invoice_number || '—'}</Cell>
                <Cell className="text-muted-foreground">{formatDate(c.created_at)}</Cell>
                <Cell>
                  <div className="w-40">
                    <Select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      disabled={updatingId === c.id}
                      aria-label={t('insurance.status')}
                    >
                      {CLAIM_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(`insurance.statuses.${s}`)}
                        </option>
                      ))}
                    </Select>
                  </div>
                </Cell>
              </Row>
            ))}
          </Table>
        ))}

      <Modal open={providerModalOpen} onClose={() => setProviderModalOpen(false)} title={t('insurance.addProvider')}>
        <form onSubmit={handleProviderSubmit} className="space-y-4">
          {providerError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{providerError}</div>
          )}
          <Field label={t('insurance.providerName')} htmlFor="ins-prov-name">
            <Input
              id="ins-prov-name"
              required
              value={providerForm.name}
              onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
            />
          </Field>
          <Field label={t('insurance.contactPhone')} htmlFor="ins-prov-phone">
            <Input
              id="ins-prov-phone"
              type="tel"
              value={providerForm.contact_phone}
              onChange={(e) => setProviderForm({ ...providerForm, contact_phone: e.target.value })}
            />
          </Field>
          <Field label={t('insurance.contactEmail')} htmlFor="ins-prov-email">
            <Input
              id="ins-prov-email"
              type="email"
              value={providerForm.contact_email}
              onChange={(e) => setProviderForm({ ...providerForm, contact_email: e.target.value })}
            />
          </Field>
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setProviderModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={providerSubmitting}>
              {providerSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={claimModalOpen} onClose={() => setClaimModalOpen(false)} title={t('insurance.addClaim')}>
        <form onSubmit={handleClaimSubmit} className="space-y-4">
          {claimError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{claimError}</div>
          )}
          <Field label={t('insurance.provider')} htmlFor="ins-claim-provider">
            <Select
              id="ins-claim-provider"
              required
              value={claimForm.provider_id}
              onChange={(e) => setClaimForm({ ...claimForm, provider_id: e.target.value })}
            >
              <option value="">—</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('insurance.patient')} htmlFor="ins-claim-patient">
            <Select
              id="ins-claim-patient"
              required
              value={claimForm.patient_id}
              onChange={(e) => setClaimForm({ ...claimForm, patient_id: e.target.value })}
            >
              <option value="">—</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('insurance.amount')} htmlFor="ins-claim-amount">
            <Input
              id="ins-claim-amount"
              type="number"
              min="0"
              step="0.01"
              required
              value={claimForm.amount}
              onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })}
            />
          </Field>
          <Field label={t('insurance.notes')} htmlFor="ins-claim-notes">
            <Textarea
              id="ins-claim-notes"
              rows={2}
              value={claimForm.notes}
              onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })}
            />
          </Field>
          <Field label={t('insurance.status')} htmlFor="ins-claim-status">
            <Select
              id="ins-claim-status"
              value={claimForm.status}
              onChange={(e) => setClaimForm({ ...claimForm, status: e.target.value })}
            >
              {CLAIM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`insurance.statuses.${s}`)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setClaimModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={claimSubmitting}>
              {claimSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {t('insurance.submit')}
            </Button>
          </div>
        </form>
      </Modal>
    </Page>
  )
}