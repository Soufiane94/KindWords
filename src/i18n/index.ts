// Sets up i18next once at import time, detecting the phone's language via
// expo-localization so the app defaults to it (Settings can always override
// this afterwards — see storage.ts's uiLanguage/quoteLanguage).

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import { Language, DEFAULT_LANGUAGE, isSupportedLanguage } from '../data/languages';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ary from './locales/ary.json';

// There's no real "Darija written in Latin letters" locale for a phone to
// report, so a device set to Arabic maps to our Darija translation — this
// app's main audience is Moroccan. Everything else falls back to English.
export function detectDeviceLanguage(): Language {
  const code = Localization.getLocales()[0]?.languageCode;
  if (code === 'fr') return 'fr';
  if (code === 'es') return 'es';
  if (code === 'ar') return 'ary';
  return DEFAULT_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    ary: { translation: ary },
  },
  lng: detectDeviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
});

// Plain (non-hook) accessor for services like notifications.ts that need
// the current language outside of a React component.
export function getCurrentUiLanguage(): Language {
  return isSupportedLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
}

// Reactive version for components: re-renders when the language changes,
// same as any other useTranslation() usage.
export function useUiLanguage(): Language {
  const { i18n: instance } = useTranslation();
  return isSupportedLanguage(instance.language) ? instance.language : DEFAULT_LANGUAGE;
}

export default i18n;
