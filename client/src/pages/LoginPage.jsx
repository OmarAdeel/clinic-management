import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { HeartPulse, Languages, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Button from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'

const DEMO_ACCOUNTS = [
  { role: 'admin', email: 'admin@clinic.com' },
  { role: 'doctor', email: 'doctor@clinic.com' },
  { role: 'receptionist', email: 'reception@clinic.com' },
  { role: 'patient', email: 'patient@clinic.com' },
]

export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const { lang, toggle } = useLanguage()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(user.role === 'patient' ? '/portal' : '/', { replace: true })
    } catch {
      setError(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand panel */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-primary p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15">
            <HeartPulse className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <span className="text-lg font-semibold text-primary-foreground">{t('app.name')}</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="max-w-md"
        >
          <h1 className="text-balance text-3xl font-semibold leading-tight text-primary-foreground">
            {t('auth.heroTitle')}
          </h1>
          <p className="mt-4 leading-relaxed text-primary-foreground/80">{t('auth.heroSubtitle')}</p>
        </motion.div>
        <p className="text-sm text-primary-foreground/60">{t('app.tagline')}</p>
        <div
          className="absolute -bottom-24 -end-24 h-72 w-72 rounded-full bg-primary-foreground/10"
          aria-hidden="true"
        />
        <div
          className="absolute -top-16 -end-10 h-48 w-48 rounded-full bg-primary-foreground/10"
          aria-hidden="true"
        />
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <HeartPulse className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="font-semibold text-foreground">{t('app.name')}</span>
            </div>
            <button
              type="button"
              onClick={toggle}
              className="ms-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              aria-label={t('language.switch')}
            >
              <Languages className="h-4 w-4" aria-hidden="true" />
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-semibold text-foreground">{t('auth.welcomeBack')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('auth.signInSubtitle')}</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label={t('auth.email')} htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@clinic.com"
                  dir="ltr"
                />
              </Field>
              <Field label={t('auth.password')} htmlFor="password" error={error}>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </Button>
            </form>

            <div className="mt-8 rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('auth.demoAccounts')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email)
                      setPassword('password123')
                    }}
                    className="rounded-lg border border-border px-3 py-2 text-start text-xs transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <span className="block font-medium text-foreground">{t(`roles.${acc.role}`)}</span>
                    <span className="block truncate text-muted-foreground" dir="ltr">
                      {acc.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
