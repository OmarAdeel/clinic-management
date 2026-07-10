import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import i18n from '../i18n'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('cms_lang') || 'en')

  useEffect(() => {
    i18n.changeLanguage(lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('cms_lang', lang)
  }, [lang])

  const toggle = useCallback(() => {
    setLang((l) => (l === 'en' ? 'ar' : 'en'))
  }, [])

  const isRTL = lang === 'ar'

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
