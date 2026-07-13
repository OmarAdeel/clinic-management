import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { CalendarOff, Plus, Loader2, Trash2 } from 'lucide-react'
import api, { fetcher } from '../../lib/api'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { Field, Input, Select, Textarea } from '../ui/Field'
import EmptyState from '../ui/EmptyState'
import { formatDate } from '../../lib/format'

/**
 * Inline panel for managing a doctor's leave/time-off blocks. Rendered inside
 * the doctor detail / schedule editor on the Doctors page.
 */
export default function DoctorLeaveManager({ doctorId }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const key = `/leave?doctor_id=${doctorId}`
  const { data, isLoading, mutate } = useSWR(doctorId ? key : null, fetcher)

  const leave = data?.data || []

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.start_date || !form.end_date) {
      setError(t('common.error'))
      return
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      setError(t('leave.endDate'))
      return
    }
    setSaving(true)
    try {
      await api.post('/leave', {
        doctor_id: Number(doctorId),
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason || undefined,
      })
      setOpen(false)
      setForm({ start_date: '', end_date: '', reason: '' })
      mutate()
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id) => {
    if (!window.confirm(`${t('common.delete')}?`)) return
    try {
      await api.delete(`/leave/${id}`)
      mutate()
    } catch (err) {
      alert(err.response?.data?.message || err.message || t('common.error'))
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarOff className="h-4 w-4 text-primary" aria-hidden="true" />
          {t('leave.title')}
        </h3>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('leave.addLeave')}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : leave.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('leave.noLeave')}</p>
      ) : (
        <ul className="space-y-2">
          {leave.map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-foreground">
                  {formatDate(l.start_date)} — {formatDate(l.end_date)}
                </p>
                {l.reason && <p className="text-xs text-muted-foreground">{l.reason}</p>}
              </div>
              <button
                onClick={() => onDelete(l.id)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-500"
                title={t('common.delete')}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('leave.addLeave')}>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('leave.startDate')} htmlFor="lv-from">
              <Input
                id="lv-from"
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </Field>
            <Field label={t('leave.endDate')} htmlFor="lv-to">
              <Input
                id="lv-to"
                type="date"
                required
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </Field>
          </div>
          <Field label={t('leave.reason')} htmlFor="lv-reason">
            <Textarea
              id="lv-reason"
              rows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </Field>
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}