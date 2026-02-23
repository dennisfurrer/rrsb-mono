import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "../locales/en/common.json";
import deCommon from "../locales/de/common.json";

export const SUPPORTED_LOCALES = ["en", "de"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem("admin_locale");
  if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
    return stored as Locale;
  }
  const browserLang = navigator.language.split("-")[0];
  if ((SUPPORTED_LOCALES as readonly string[]).includes(browserLang)) {
    return browserLang as Locale;
  }
  return DEFAULT_LOCALE;
}

i18n.use(initReactI18next).init({
  lng: getStoredLocale(),
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: "common",
  ns: ["common"],
  resources: {
    en: { common: enCommon },
    de: { common: deCommon },
  },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export function changeLanguage(locale: Locale) {
  localStorage.setItem("admin_locale", locale);
  i18n.changeLanguage(locale);
}

export default i18n;
