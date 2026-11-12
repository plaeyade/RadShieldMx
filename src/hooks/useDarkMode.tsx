import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface DarkModeContextType {
  isDark: boolean;
  toggle: () => void;
}

const DarkModeContext = createContext<DarkModeContextType>({ isDark: false, toggle: () => {} });

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('radshield_dark') === '1'; } catch { return false; }
  });

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    try { localStorage.setItem('radshield_dark', isDark ? '1' : '0'); } catch { /* almacenamiento no disponible */ }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark(d => !d), []);

  return <DarkModeContext.Provider value={{ isDark, toggle }}>{children}</DarkModeContext.Provider>;
}

export function useDarkMode() { return useContext(DarkModeContext); }
