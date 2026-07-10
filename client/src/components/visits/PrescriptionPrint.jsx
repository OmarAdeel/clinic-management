import { useTranslation } from 'react-i18next'
import { HeartPulse, Pill } from 'lucide-react'
import { formatDate, formatTime } from '../../lib/format'

/**
 * Printable prescription layout. Wrapped in .print-area so global print
 * styles show only this block when printing.
 */
export default function PrescriptionPrint({ appointment, visit }) {
  const { t } = useTranslation()
  const vitals = visit?.vitals
    ? typeof visit.vitals === 'string'
      ? JSON.parse(visit.vitals)
      : visit.vitals
    : null

  return (
    <div className="print-area rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground print:bg-transparent print:text-foreground">
            <HeartPulse className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{t('app.name')}</p>
            <p className="text-xs text-muted-foreground">{t('visits.prescriptionTitle')}</p>
          </div>
        </div>
        <div className="text-end text-sm">
          <p className="text-foreground">{formatDate(appointment.date)}</p>
          <p className="text-muted-foreground">{formatTime(appointment.start_time)}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">{t('appointments.patient')}</p>
          <p className="font-medium text-foreground">{appointment.patient_name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('appointments.doctor')}</p>
          <p className="font-medium text-foreground">
            {appointment.doctor_name} — {appointment.specialty}
          </p>
        </div>
      </div>

      {vitals && Object.values(vitals).some(Boolean) && (
        <div className="mb-4 flex flex-wrap gap-4 rounded-lg bg-muted/50 p-3 text-sm">
          {vitals.bp && (
            <span>
              <span className="text-muted-foreground">{t('visits.bp')}: </span>
              <span dir="ltr" className="font-medium text-foreground">{vitals.bp}</span>
            </span>
          )}
          {vitals.temp && (
            <span>
              <span className="text-muted-foreground">{t('visits.temp')}: </span>
              <span dir="ltr" className="font-medium text-foreground">{vitals.temp}</span>
            </span>
          )}
          {vitals.weight && (
            <span>
              <span className="text-muted-foreground">{t('visits.weight')}: </span>
              <span dir="ltr" className="font-medium text-foreground">{vitals.weight}</span>
            </span>
          )}
          {vitals.height && (
            <span>
              <span className="text-muted-foreground">{t('visits.height')}: </span>
              <span dir="ltr" className="font-medium text-foreground">{vitals.height}</span>
            </span>
          )}
        </div>
      )}

      {visit?.symptoms && (
        <p className="mb-2 text-sm text-foreground">
          <span className="font-medium">{t('visits.symptoms')}: </span>
          {visit.symptoms}
        </p>
      )}
      {visit?.diagnosis && (
        <p className="mb-4 text-sm text-foreground">
          <span className="font-medium">{t('visits.diagnosis')}: </span>
          {visit.diagnosis}
        </p>
      )}

      {visit?.prescriptions?.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="mb-3 text-sm font-medium text-foreground">{t('visits.prescriptions')}</p>
          <ol className="space-y-3">
            {visit.prescriptions.map((rx, i) => (
              <li key={rx.id ?? i} className="flex gap-3 text-sm">
                <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary print:text-foreground" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">{rx.medication}</p>
                  <p className="text-muted-foreground">
                    {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ')}
                  </p>
                  {rx.instructions && <p className="text-muted-foreground">{rx.instructions}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {visit?.notes && (
        <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">{visit.notes}</p>
      )}
    </div>
  )
}
