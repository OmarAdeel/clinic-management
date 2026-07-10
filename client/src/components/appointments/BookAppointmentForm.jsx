import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Loader2, CalendarX } from 'lucide-react'
import api, { fetcher } from '../../lib/api'
import Button from '../ui/Button'
import { Field, Select, Input, Textarea } from '../ui/Field'
import { formatTime, todayISO } from '../../lib/format'

/**
 * Booking flow: pick doctor + patient + date -> shows live free slots
 * from the API -> pick a slot -> book.
 * When `fixedPatientId` is set (patient portal), the patient selector is hidden.
 */
export default function BookAppointmentForm({ onDone, onCancel, fixedPatientId }) {
  const { t } = useTranslation()
  const [doctorId, setDoctorId] = useState('')
  const [patientId, setPatientId] = useState(fixedPatientId || '')
  const [date, setDate] = useState(todayISO())
  const [slot, setSlot] = useState(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { data: doctors } = useSWR('/doctors', fetcher)
  const { data: patients } = useSWR(fixedPatientId ? null : '/patients?limit=100', fetcher)
  const { data: slotsData, isLoading: slotsLoading } = useSWR(
    doctorId && date ? `/appointments/slots?doctor_id=${doctorId}&date=${date}` : null,
    fetcher
  )

  const slots = slotsData?.slots || []

  const submit = async (e) => {
    e.preventDefault()
    if (!slot) return
    setError('')
    setSaving(true)
    try {
      const payload = {
        patient_id: Number(patientId),
        doctor_id: Number(doctorId),
        date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        reason: reason || undefined,
      }
      if (fixedPatientId) {
        await api.post('/portal/appointments', payload)
      } else {
        await api.post('/appointments', payload)
      }
      onDone()
    } catch (err) {
      setError(
        err.response?.status === 409 ? t('appointments.slotTaken') : err.response?.data?.message || t('common.error')
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('appointments.doctor')} htmlFor="b-doctor">
          <Select
            id="b-doctor"
            required
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value)
              setSlot(null)
            }}
          >
            <option value="">{t('appointments.selectDoctor')}</option>
            {(doctors?.data || []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.specialty}
              </option>
            ))}
          </Select>
        </Field>

        {!fixedPatientId && (
          <Field label={t('appointments.patient')} htmlFor="b-patient">
            <Select id="b-patient" required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">{t('appointments.selectPatient')}</option>
              {(patients?.data || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label={t('appointments.selectDate')} htmlFor="b-date">
          <Input
            id="b-date"
            type="date"
            required
            min={todayISO()}
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setSlot(null)
            }}
          />
        </Field>
      </div>

      {doctorId && date && (
        <Field label={t('appointments.availableSlots')}>
          {slotsLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('common.loading')}
            </div>
          ) : slots.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
              <CalendarX className="h-4 w-4" aria-hidden="true" />
              {t('appointments.noSlots')}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((s, i) => {
                const selected = slot?.start_time === s.start_time
                return (
                  <motion.button
                    key={s.start_time}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    onClick={() => setSlot(s)}
                    aria-pressed={selected}
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition-all active:scale-95 ${
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    {formatTime(s.start_time)}
                  </motion.button>
                )
              })}
            </div>
          )}
        </Field>
      )}

      <Field label={t('appointments.reason')} htmlFor="b-reason">
        <Textarea id="b-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={saving || !slot || !patientId || !doctorId}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t('appointments.book')}
        </Button>
      </div>
    </form>
  )
}
