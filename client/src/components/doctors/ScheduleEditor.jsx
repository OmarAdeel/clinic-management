import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import api, { fetcher } from '../../lib/api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Select, Input } from '../ui/Field'
import { TableSkeleton } from '../ui/Skeleton'

/**
 * Weekly schedule editor. Loads the doctor's current schedule and lets an
 * admin replace it (day, start, end, slot length). Receptionists get a
 * read-only view.
 */
export default function ScheduleEditor({ doctor, readOnly, onClose }) {
  const { t } = useTranslation()
  const days = t('doctors.days', { returnObjects: true })
  const { data, mutate } = useSWR(`/doctors/${doctor.id}`, fetcher)
  const [rows, setRows] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (data && rows === null) {
      setRows(
        data.schedules.map((s) => ({
          day_of_week: s.day_of_week,
          start_time: String(s.start_time).slice(0, 5),
          end_time: String(s.end_time).slice(0, 5),
          slot_minutes: s.slot_minutes,
        }))
      )
    }
  }, [data, rows])

  const setRow = (i, k) => (e) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: e.target.value } : r)))

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      await api.put(`/doctors/${doctor.id}/schedule`, {
        schedules: rows.map((r) => ({
          ...r,
          day_of_week: Number(r.day_of_week),
          slot_minutes: Number(r.slot_minutes) || 30,
        })),
      })
      mutate()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`${t('doctors.schedule')} — ${doctor.name}`} wide>
      {rows === null ? (
        <TableSkeleton rows={3} />
      ) : (
        <div className="space-y-3">
          {rows.length === 0 && (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              {t('doctors.dayOff')}
            </p>
          )}
          {rows.map((r, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-3">
              <div className="min-w-32 flex-1">
                <label htmlFor={`sch-day-${i}`} className="mb-1 block text-xs text-muted-foreground">
                  {t('common.date')}
                </label>
                <Select id={`sch-day-${i}`} disabled={readOnly} value={r.day_of_week} onChange={setRow(i, 'day_of_week')}>
                  {days.map((d, idx) => (
                    <option key={idx} value={idx}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-28">
                <label htmlFor={`sch-start-${i}`} className="mb-1 block text-xs text-muted-foreground">
                  {t('doctors.startTime')}
                </label>
                <Input id={`sch-start-${i}`} type="time" dir="ltr" disabled={readOnly} value={r.start_time} onChange={setRow(i, 'start_time')} />
              </div>
              <div className="w-28">
                <label htmlFor={`sch-end-${i}`} className="mb-1 block text-xs text-muted-foreground">
                  {t('doctors.endTime')}
                </label>
                <Input id={`sch-end-${i}`} type="time" dir="ltr" disabled={readOnly} value={r.end_time} onChange={setRow(i, 'end_time')} />
              </div>
              <div className="w-24">
                <label htmlFor={`sch-slot-${i}`} className="mb-1 block text-xs text-muted-foreground">
                  {t('doctors.slotMinutes')}
                </label>
                <Input
                  id={`sch-slot-${i}`}
                  type="number"
                  min="5"
                  step="5"
                  dir="ltr"
                  disabled={readOnly}
                  value={r.slot_minutes}
                  onChange={setRow(i, 'slot_minutes')}
                />
              </div>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                </Button>
              )}
            </div>
          ))}

          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setRows((rs) => [
                  ...rs,
                  { day_of_week: 0, start_time: '09:00', end_time: '17:00', slot_minutes: 30 },
                ])
              }
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('doctors.addDay')}
            </Button>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              {readOnly ? t('common.close') : t('common.cancel')}
            </Button>
            {!readOnly && (
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {t('common.save')}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
