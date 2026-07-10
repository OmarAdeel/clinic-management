import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';

const stored = localStorage.getItem('clinic_lang');
const initialLang = stored === 'ar' ? 'ar' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnObjects: true,
});

export function applyDirection(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

applyDirection(initialLang);

export default i18n;
