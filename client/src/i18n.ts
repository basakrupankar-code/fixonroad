import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import bnTranslations from './locales/bn.json';
import hiTranslations from './locales/hi.json';
import { translations } from './locales/translations';

// Sync initial language from localStorage if present
const savedLanguage = typeof localStorage !== 'undefined' 
  ? localStorage.getItem('fixonroad_lang') || localStorage.getItem('i18nextLng') || 'en'
  : 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { ...enTranslations, ...translations.en } },
      bn: { translation: { ...bnTranslations, ...translations.bn } },
      hi: { translation: { ...hiTranslations, ...translations.hi } }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safes from xss
    }
  });

export default i18n;
