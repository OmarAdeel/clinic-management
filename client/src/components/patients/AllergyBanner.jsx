import { useTranslation } from 'react-i18next'
import { AlertTriangle, Activity } from 'lucide-react'

/**
 * Patient-safety banner shown above patient detail content whenever the patient
 * has recorded allergies or chronic conditions in their free-text notes.
 * Detects common chronic-condition keywords in the medical_notes field so
 * that staff don't have to read the full record to spot risks.
 */
const CHRONIC_KEYWORDS = [
  'diabetes', 'hypertension', 'asthma', 'cardiac', 'heart disease',
  'copd', 'epilepsy', 'thyroid', 'ckd', 'kidney disease',
  'arthritis', 'hyperlipidemia', 'hypothyroidism',
]

function detectChronic(notes) {
  if (!notes) return []
  const lower = notes.toLowerCase()
  return CHRONIC_KEYWORDS.filter((k) => lower.includes(k))
}

export default function AllergyBanner({ patient }) {
  const { t } = useTranslation()
  if (!patient) return null

  const allergies = patient.allergies?.trim()
  const chronic = detectChronic(patient.medical_notes)

  if (!allergies && chronic.length === 0) return null

  return (
    <div className="space-y-2">
      {allergies && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{t('allergyBanner.attention')}</p>
            <p>
              {t('allergyBanner.allergies')} <span className="font-medium">{allergies}</span>
            </p>
          </div>
        </div>
      )}
      {chronic.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300"
        >
          <Activity className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p>
              {t('allergyBanner.chronicConditions')}{' '}
              <span className="font-medium capitalize">{chronic.join(', ')}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}