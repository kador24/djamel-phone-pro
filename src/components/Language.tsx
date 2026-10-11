import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Language } from '../lib/helpers';

const LanguageContext = createContext<{ lang: Language; setLang: (lang: Language) => void } | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'ar';
    return window.localStorage.getItem('djamel-lang') === 'en' ? 'en' : 'ar';
  });
  const setLang = (next: Language) => {
    setLangState(next);
    window.localStorage.setItem('djamel-lang', next);
  };
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('lang-en', lang === 'en');
  }, [lang]);
  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLang must be used inside LanguageProvider');
  return context;
}
