import i18n from '../i18n'

const locale = () => (i18n.language === 'ar' ? 'ar-EG' : 'en-US')

export function formatDate(value, opts = {}) {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value.includes('T') ? value : `${value}T00:00:00`) : value
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(locale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...opts,
  }).format(d)
}

export function formatTime(value) {
  if (!value) return '—'
  const [h, m] = String(value).split(':')
  const d = new Date()
  d.setHours(Number(h), Number(m), 0, 0)
  return new Intl.DateTimeFormat(locale(), { hour: 'numeric', minute: '2-digit' }).format(d)
}

export function formatMoney(value) {
  const currency = localStorage.getItem('cms_currency') || 'USD';
  return new Intl.NumberFormat(locale(), {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

export function formatNumber(value) {
  return new Intl.NumberFormat(locale()).format(Number(value) || 0)
}

export function ageFromDob(dob) {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const diff = Date.now() - birth.getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

export function todayISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
