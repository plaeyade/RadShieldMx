/**
 * useHighContrast — Fase 3.13: Modo alto contraste para accesibilidad
 * WCAG 2.1 §1.4.11 — Non-text Contrast
 * Media query: prefers-contrast: high + toggle manual
 */
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'radshield-high-contrast';

export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-contrast: more)').matches;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isHighContrast));
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-contrast: more)');
    const handler = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(STORAGE_KEY) === null) {
        setIsHighContrast(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = useCallback(() => setIsHighContrast(v => !v), []);

  return { isHighContrast, toggle };
}
