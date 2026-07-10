import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import Button from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Field'

export default function DoctorForm({ initial, onSubmit, onCancel }) {
  const { t } = useTranslation()
  const isEdit = !!initial
  const [values, setValues] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    password: '',
    phone: initial?.phone || '',
    specialty: initial?.specialty || '',
    bio: initial?.bio || '',
    consultation_fee: initial?.consultation_fee ?? '',
    color: initial?.color || '#0d9488',
    is_active: initial ? Number(initial.is_active) : 1,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { ...values, consultation_fee: Number(values.consultation_fee) || 0 }
      if (isEdit) {
        delete payload.email
        delete payload.password
        payload.is_active = Number(values.is_active)
      }
      await onSubmit(payload)
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('doctors.name')} htmlFor="d-name">
          <Input id="d-name" required value={values.name} onChange={set('name')} />
        </Field>
        <Field label={t('doctors.specialty')} htmlFor="d-specialty">
          <Input id="d-specialty" required value={values.specialty} onChange={set('specialty')} />
        </Field>
        {!isEdit && (
          <>
            <Field label={t('patients.email')} htmlFor="d-email">
              <Input id="d-email" type="email" dir="ltr" required value={values.email} onChange={set('email')} />
            </Field>
            <Field label={t('doctors.password')} htmlFor="d-password">
              <Input
                id="d-password"
                type="password"
                dir="ltr"
                required
                minLength={8}
                value={values.password}
                onChange={set('password')}
              />
            </Field>
          </>
        )}
        <Field label={t('patients.phone')} htmlFor="d-phone">
          <Input id="d-phone" type="tel" dir="ltr" value={values.phone} onChange={set('phone')} />
        </Field>
        <Field label={t('doctors.fee')} htmlFor="d-fee">
          <Input
            id="d-fee"
            type="number"
            min="0"
            step="0.01"
            dir="ltr"
            value={values.consultation_fee}
            onChange={set('consultation_fee')}
          />
        </Field>
        <Field label={t('doctors.color')} htmlFor="d-color">
          <input
            id="d-color"
            type="color"
            value={values.color}
            onChange={set('color')}
            className="h-10 w-full cursor-pointer rounded-lg border border-border bg-card p-1"
          />
        </Field>
        {isEdit && (
          <Field label={t('common.status')} htmlFor="d-active">
            <Select id="d-active" value={values.is_active} onChange={set('is_active')}>
              <option value={1}>{t('doctors.active')}</option>
              <option value={0}>{t('doctors.inactive')}</option>
            </Select>
          </Field>
        )}
      </div>
      <Field label={t('doctors.bio')} htmlFor="d-bio">
        <Textarea id="d-bio" rows={2} value={values.bio} onChange={set('bio')} />
      </Field>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
