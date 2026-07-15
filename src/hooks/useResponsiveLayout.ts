/**
 * useResponsiveLayout — v50.1: Responsive tablet layout
 * Detecta viewport <1024px y colapsa sidebar
 * WCAG 2.1 §1.4.10 — Reflow
 */
import { useState, useEffect, useCallback } from 'react';

interface LayoutState {
  isTablet: boolean;
  isMobile: boolean;
  sidebarCollapsed: boolean;
  sidebarVisible: boolean;
}

export function useResponsiveLayout() {
  const [state, setState] = useState<LayoutState>(() => ({
    isTablet: false,
    isMobile: false,
    sidebarCollapsed: false,
    sidebarVisible: true,
  }));

  useEffect(() => {
    const mqTablet = window.matchMedia('(max-width: 1024px)');
    const mqMobile = window.matchMedia('(max-width: 640px)');

    const update = () => {
      const isTablet = mqTablet.matches;
      const isMobile = mqMobile.matches;
      setState(prev => ({
        isTablet,
        isMobile,
        sidebarCollapsed: isTablet ? true : prev.sidebarCollapsed,
        sidebarVisible: isMobile ? false : prev.sidebarVisible,
      }));
    };

    mqTablet.addEventListener('change', update);
    mqMobile.addEventListener('change', update);
    update();

    return () => {
      mqTablet.removeEventListener('change', update);
      mqMobile.removeEventListener('change', update);
    };
  }, []);

  const toggleSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed,
      sidebarVisible: !prev.sidebarVisible,
    }));
  }, []);

  return { ...state, toggleSidebar };
}
