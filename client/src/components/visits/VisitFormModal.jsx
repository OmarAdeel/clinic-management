import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import api from '../../lib/api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Field'

const EMPTY_RX = { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }

/**
 * Doctor's consultation form: vitals, symptoms, diagnosis, notes and a
 * dynamic list of prescription lines. Saving marks the appointment completed.
 */
export default function VisitFormModal({ appointment, onClose, onSaved }) {
  const { t } = useTranslation()
  const [vitals, setVitals] = useState({ bp: '', temp: '', weight: '', height: '' })
  const [symptoms, setSymptoms] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [rxLines, setRxLines] = useState([{ ...EMPTY_RX }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const setVital = (k) => (e) => setVitals((v) => ({ ...v, [k]: e.target.value }))
  const setRx = (i, k) => (e) =>
    setRxLines((lines) => lines.map((l, idx) => (idx === i ? { ...l, [k]: e.target.value } : l)))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/visits', {
        appointment_id: appointment.id,
        diagnosis,
        symptoms,
        notes,
        vitals,
        prescriptions: rxLines.filter((l) => l.medication.trim()),
      })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${t('visits.title')} — ${appointment.patient_name}`}
      wide
    >
      <form onSubmit={submit} className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">{t('visits.vitals')}</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label={t('visits.bp')} htmlFor="v-bp">
              <Input id="v-bp" dir="ltr" placeholder="120/80" value={vitals.bp} onChange={setVital('bp')} />
            </Field>
            <Field label={t('visits.temp')} htmlFor="v-temp">
              <Input id="v-temp" dir="ltr" type="number" step="0.1" value={vitals.temp} onChange={setVital('temp')} />
            </Field>
            <Field label={t('visits.weight')} htmlFor="v-weight">
              <Input id="v-weight" dir="ltr" type="number" step="0.1" value={vitals.weight} onChange={setVital('weight')} />
            </Field>
            <Field label={t('visits.height')} htmlFor="v-height">
              <Input id="v-height" dir="ltr" type="number" step="0.1" value={vitals.height} onChange={setVital('height')} />
            </Field>
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('visits.symptoms')} htmlFor="v-symptoms">
            <Textarea id="v-symptoms" rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
          </Field>
          <Field label={t('visits.diagnosis')} htmlFor="v-diagnosis">
            <Textarea id="v-diagnosis" rows={2} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          </Field>
        </div>

        <Field label={t('visits.notes')} htmlFor="v-notes">
          <Textarea id="v-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">{t('visits.prescriptions')}</legend>
          <div className="space-y-3">
            {rxLines.map((line, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label={t('visits.medication')} htmlFor={`rx-med-${i}`}>
                    <Input id={`rx-med-${i}`} value={line.medication} onChange={setRx(i, 'medication')} />
                  </Field>
                  <Field label={t('visits.dosage')} htmlFor={`rx-dose-${i}`}>
                    <Input id={`rx-dose-${i}`} value={line.dosage} onChange={setRx(i, 'dosage')} />
                  </Field>
                  <Field label={t('visits.frequency')} htmlFor={`rx-freq-${i}`}>
                    <Input id={`rx-freq-${i}`} value={line.frequency} onChange={setRx(i, 'frequency')} />
                  </Field>
                  <Field label={t('visits.duration')} htmlFor={`rx-dur-${i}`}>
                    <Input id={`rx-dur-${i}`} value={line.duration} onChange={setRx(i, 'duration')} />
                  </Field>
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <div className="flex-1">
                    <Field label={t('visits.instructions')} htmlFor={`rx-inst-${i}`}>
                      <Input id={`rx-inst-${i}`} value={line.instructions} onChange={setRx(i, 'instructions')} />
                    </Field>
                  </div>
                  {rxLines.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRxLines((lines) => lines.filter((_, idx) => idx !== i))}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setRxLines((lines) => [...lines, { ...EMPTY_RX }])}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('visits.addLine')}
          </Button>
        </fieldset>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {t('visits.saveVisit')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
