import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { t, getTranslations } from '../locales/translations';
import API from '../services/api';

const LanguageContext = createContext(null);

/**
 * Provides language switching + static translation lookup to the entire app.
 * No Sarvam Translate API is called here — all translations are static.
 */
export function LanguageProvider({ children }) {
  // Initialise from stored user or localStorage fallback
  const [lang, setLangState] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.language && ['en', 'hi', 'gu'].includes(u.language)) return u.language;
      }
    } catch {/* ignore */}
    return localStorage.getItem('chhaya_lang') || 'en';
  });

  // Persist lang change: update localStorage + push to backend
  const setLang = useCallback(async (newLang) => {
    if (!['en', 'hi', 'gu'].includes(newLang)) return;
    setLangState(newLang);
    localStorage.setItem('chhaya_lang', newLang);

    // Update user object in localStorage
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        u.language = newLang;
        localStorage.setItem('user', JSON.stringify(u));
      }
    } catch {/* ignore */}

    // Persist to backend (fire-and-forget; fail silently)
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await API.put('/auth/me', { language: newLang });
      }
    } catch {/* backend save is best-effort */}
  }, []);

  // When a fresh login happens and user object changes, re-sync lang
  useEffect(() => {
    const sync = () => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u.language && ['en', 'hi', 'gu'].includes(u.language)) {
            setLangState(u.language);
          }
        }
      } catch {/* ignore */}
    };
    window.addEventListener('chhaya-user-loaded', sync);
    return () => window.removeEventListener('chhaya-user-loaded', sync);
  }, []);

  /**
   * Translate a key path with the current language.
   * @param {string} keyPath  e.g. 'dashboard.cityRisk'
   * @returns {*}
   */
  const tr = useCallback((keyPath) => t(keyPath, lang), [lang]);

  /** Full translations object for current language */
  const translations = getTranslations(lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, tr, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Hook — throws if used outside LanguageProvider */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}

export default LanguageContext;
