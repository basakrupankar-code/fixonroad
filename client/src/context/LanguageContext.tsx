import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, Language, TranslationDictionary } from '../locales/translations';
import i18n from '../i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  languages: { code: Language; label: string; nativeLabel: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SUPPORTED_LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' }
];

/**
 * Safely resolves dot-notation nested properties (e.g., 'hero.title', 'nav.services')
 */
function resolvePath(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current: any = obj;

  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }

  return typeof current === 'string' ? current : undefined;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize from localStorage with fallback to English
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('fixonroad_lang') || localStorage.getItem('i18nextLng');
      if (saved === 'bn' || saved === 'hi' || saved === 'en') {
        return saved as Language;
      }
    } catch (_e) {
      // Storage unavailable
    }
    return 'en';
  });

  // Keep html element lang attribute & i18next synchronized
  useEffect(() => {
    try {
      document.documentElement.lang = language;
      if (i18n && typeof i18n.changeLanguage === 'function' && i18n.language !== language) {
        i18n.changeLanguage(language);
      }
    } catch (_e) {
      // Ignore
    }
  }, [language]);

  // 2. Set language and persist in localStorage
  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('fixonroad_lang', newLang);
      localStorage.setItem('i18nextLng', newLang);
      document.documentElement.lang = newLang;
      if (i18n && typeof i18n.changeLanguage === 'function') {
        i18n.changeLanguage(newLang);
      }
    } catch (e) {
      console.warn('Could not persist language to localStorage:', e);
    }
  }, []);

  // Key alias mappings to ensure seamless resolution across modules
  const KEY_ALIASES: Record<string, string> = {
    'hero.subheading': 'hero.subtitle',
    'home.hero.badge': 'hero.badge',
    'home.hero.title': 'hero.title',
    'home.hero.subheading': 'hero.subtitle',
    'home.hero.heading1': 'hero.heading1',
    'home.hero.heading2': 'hero.heading2',
    'home.hero.heading3': 'hero.heading3',
    'home.hero.requestHelp': 'hero.requestHelp',
    'home.hero.liveIn': 'hero.liveIn',
    'home.hero.useCurrentLocation': 'hero.useCurrentLocation',
    'home.hero.locating': 'hero.locating',
    'home.hero.titleTag': 'hero.titleTag',
    'home.hero.avgResponse': 'stats.avgResponse',
    'home.hero.verifiedMechanics': 'stats.verifiedMechanics',
    'home.hero.userRating': 'stats.userRating',
    'home.hero.liveTracker.title': 'radar.title',
    'home.hero.liveTracker.searching': 'radar.findingMechanic',
    'home.hero.liveTracker.scanning': 'radar.scanning',
    'home.hero.liveTracker.statusSearching': 'radar.searching',
    'home.hero.liveTracker.statusMatched': 'radar.matched',
    'home.hero.liveTracker.statusEnRoute': 'radar.enRoute',
    'home.hero.triage.badge': 'triage.badge',
    'home.hero.triage.heading1': 'triage.heading1',
    'home.hero.triage.heading2': 'triage.heading2',
    'home.hero.triage.subheading': 'triage.subheading',
    'home.hero.issues.flatTire': 'triage.flatTire',
    'home.hero.issues.deadBattery': 'triage.deadBattery',
    'home.hero.issues.chainSnapped': 'triage.chainSnapped',
    'home.hero.issues.wontStart': 'triage.wontStart',
    'home.howItWorks.badge': 'howItWorks.badge',
    'home.howItWorks.heading1': 'howItWorks.heading1',
    'home.howItWorks.heading2': 'howItWorks.heading2',
    'home.howItWorks.step1.title': 'howItWorks.step1Title',
    'home.howItWorks.step1.desc': 'howItWorks.step1Desc',
    'home.howItWorks.step2.title': 'howItWorks.step2Title',
    'home.howItWorks.step2.desc': 'howItWorks.step2Desc',
    'home.howItWorks.step3.title': 'howItWorks.step3Title',
    'home.howItWorks.step3.desc': 'howItWorks.step3Desc',
    'home.howItWorks.step4.title': 'howItWorks.step4Title',
    'home.howItWorks.step4.desc': 'howItWorks.step4Desc',
    'common.nav.services': 'nav.services',
    'common.nav.howItWorks': 'nav.howItWorks',
    'common.nav.forMechanics': 'nav.forMechanics',
    'common.nav.signIn': 'nav.signIn',
    'common.nav.partnerLogin': 'nav.partnerLogin',
    'common.nav.emergencyHelp': 'nav.emergencyHelp',
    'common.nav.switchToRider': 'nav.switchToRider',
  };

  // 3. Translation resolver helper with English & parameter fallback
  const t = useCallback(
    (key: string, fallback?: string): string => {
      // Check current active language dictionary
      const currentDict = translations[language];
      let translated = resolvePath(currentDict, key);
      if (translated) return translated;

      // Check key alias mapping
      const aliasKey = KEY_ALIASES[key];
      if (aliasKey) {
        translated = resolvePath(currentDict, aliasKey);
        if (translated) return translated;
      }

      // Fallback to English dictionary
      if (language !== 'en') {
        const enDict = translations['en'];
        translated = resolvePath(enDict, key);
        if (translated) return translated;

        if (aliasKey) {
          translated = resolvePath(enDict, aliasKey);
          if (translated) return translated;
        }
      }

      // Fallback to i18next if initialized
      if (i18n && typeof i18n.t === 'function') {
        const val = i18n.t(key, { defaultValue: '' });
        if (val && val !== key && val !== '') return val;
      }

      // Fallback to explicitly provided fallback text or the key
      return fallback !== undefined ? fallback : key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
