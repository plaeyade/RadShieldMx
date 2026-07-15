// Sistema de internacionalizacion completo (es/en)
import { useState, useCallback, createContext, useContext } from 'react';
import { TRANSLATIONS, type Lang } from '@/i18n/translations';

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'es',
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('radshield_lang') as Lang;
    return saved === 'en' ? 'en' : 'es';
  });

  const setLangMemo = useCallback((l: Lang) => {
    setLang(l);
    localStorage.setItem('radshield_lang', l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let text = TRANSLATIONS[lang][key] || key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang: setLangMemo, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
