import { useTranslation } from 'react-i18next'
import { Menu, Languages, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'

export default function Topbar({ onMenuClick }) {
  const { t } = useTranslation()
  const { lang, toggle } = useLanguage()
  const [dark, setDark] = useState(() => localStorage.getItem('cms_theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('cms_theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
        aria-label={t('nav.openMenu')}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t('language.switch')}
        >
          <Languages className="h-4 w-4" aria-hidden="true" />
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={dark ? t('theme.light') : t('theme.dark')}
        >
          {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </header>
  )
}
