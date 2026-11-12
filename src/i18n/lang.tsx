import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ui, type Dict, type Lang } from './copy';

const KEY = 'incredible-city-lang';

function readLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'en' || v === 'zh') return v;
  } catch {
    /* private mode or blocked storage */
  }
  return 'zh';
}

interface LangValue {
  lang: Lang;
  toggle: () => void;
  t: Dict;
}

const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(readLang);
  const toggle = useCallback(() => {
    setLang((cur) => {
      const next: Lang = cur === 'zh' ? 'en' : 'zh';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = 'Grok City';
  }, [lang]);
  const value = useMemo(() => ({ lang, toggle, t: ui(lang) }), [lang, toggle]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useI18n outside LangProvider');
  return ctx;
}
