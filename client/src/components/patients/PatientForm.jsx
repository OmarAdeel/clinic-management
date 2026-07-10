import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import Button from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Field'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function PatientForm({ initial, onSubmit, onCancel }) {
  const { t } = useTranslation()
  const [values, setValues] = useState({
    full_name: initial?.full_name || '',
    dob: initial?.dob ? String(initial.dob).slice(0, 10) : '',
    gender: initial?.gender || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    address: initial?.address || '',
    blood_type: initial?.blood_type || '',
    allergies: initial?.allergies || '',
    medical_notes: initial?.medical_notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSubmit({
        ...values,
        dob: values.dob || null,
        gender: values.gender || null,
        blood_type: values.blood_type || null,
      })
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('patients.fullName')} htmlFor="p-name">
          <Input id="p-name" required value={values.full_name} onChange={set('full_name')} />
        </Field>
        <Field label={t('patients.dob')} htmlFor="p-dob">
          <Input id="p-dob" type="date" value={values.dob} onChange={set('dob')} />
        </Field>
        <Field label={t('patients.gender')} htmlFor="p-gender">
          <Select id="p-gender" value={values.gender} onChange={set('gender')}>
            <option value="">{t('common.notSet')}</option>
            <option value="male">{t('patients.male')}</option>
            <option value="female">{t('patients.female')}</option>
          </Select>
        </Field>
        <Field label={t('patients.bloodType')} htmlFor="p-blood">
          <Select id="p-blood" value={values.blood_type} onChange={set('blood_type')}>
            <option value="">{t('common.notSet')}</option>
            {BLOOD_TYPES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('patients.phone')} htmlFor="p-phone">
          <Input id="p-phone" type="tel" dir="ltr" value={values.phone} onChange={set('phone')} />
        </Field>
        <Field label={t('patients.email')} htmlFor="p-email">
          <Input id="p-email" type="email" dir="ltr" value={values.email} onChange={set('email')} />
        </Field>
      </div>
      <Field label={t('patients.address')} htmlFor="p-address">
        <Input id="p-address" value={values.address} onChange={set('address')} />
      </Field>
      <Field label={t('patients.allergies')} htmlFor="p-allergies">
        <Input id="p-allergies" value={values.allergies} onChange={set('allergies')} />
      </Field>
      <Field label={t('patients.medicalNotes')} htmlFor="p-notes">
        <Textarea id="p-notes" rows={3} value={values.medical_notes} onChange={set('medical_notes')} />
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
