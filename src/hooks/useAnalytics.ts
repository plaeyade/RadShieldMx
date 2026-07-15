/**
 * E.7: Analytics Dashboard — Hook para métricas de uso local
 * Simula analytics con localStorage (respetando privacidad, sin tracking externo)
 */
import { useState, useCallback, useEffect } from 'react';

interface SessionEvent {
  id: string;
  timestamp: number;
  category: 'calculation' | 'export' | 'dialog' | 'toolbar' | 'canvas' | 'error';
  action: string;
  value?: string | number;
  metadata?: Record<string, unknown>;
}

interface WeeklyMetrics {
  week: string;
  calculationsRun: number;
  barriersCalculated: number;
  exportsGenerated: number;
  dialogsOpened: number;
  uniqueDialogs: Set<string>;
  errors: number;
  sessionDurationMinutes: number;
}

const STORAGE_KEY = 'radshield_analytics_events';
const MAX_EVENTS = 5000;

function loadEvents(): SessionEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEvents(events: SessionEvent[]) {
  try {
    const trimmed = events.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* storage full */ }
}

export function useAnalytics() {
  const [events, setEvents] = useState<SessionEvent[]>(loadEvents);
  const [isEnabled, setIsEnabled] = useState(() => {
    try { return localStorage.getItem('radshield_analytics_enabled') !== 'false'; }
    catch { return true; }
  });

  useEffect(() => { saveEvents(events); }, [events]);

  const track = useCallback((
    category: SessionEvent['category'],
    action: string,
    value?: string | number,
    metadata?: Record<string, unknown>
  ) => {
    if (!isEnabled) return;
    const event: SessionEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      category,
      action,
      value,
      metadata,
    };
    setEvents(prev => [...prev, event]);
  }, [isEnabled]);

  const getWeeklyMetrics = useCallback((): WeeklyMetrics[] => {
    const weeks = new Map<string, WeeklyMetrics>();
    events.forEach(e => {
      const date = new Date(e.timestamp);
      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate()) / 7)}`;
      const m = weeks.get(weekKey) || {
        week: weekKey, calculationsRun: 0, barriersCalculated: 0,
        exportsGenerated: 0, dialogsOpened: 0, uniqueDialogs: new Set(),
        errors: 0, sessionDurationMinutes: 0,
      };
      if (e.category === 'calculation') m.calculationsRun++;
      if (e.category === 'export') m.exportsGenerated++;
      if (e.category === 'dialog' && typeof e.value === 'string') {
        m.dialogsOpened++; m.uniqueDialogs.add(e.value);
      }
      if (e.category === 'error') m.errors++;
      if (e.action === 'barriers_calculated' && typeof e.value === 'number') {
        m.barriersCalculated += e.value;
      }
      weeks.set(weekKey, m);
    });
    return Array.from(weeks.values()).slice(-12);
  }, [events]);

  const getTopDialogs = useCallback((): Array<{ name: string; count: number }> => {
    const counts = new Map<string, number>();
    events.filter(e => e.category === 'dialog' && typeof e.value === 'string')
      .forEach(e => { counts.set(e.value as string, (counts.get(e.value as string) || 0) + 1); });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  const getTotalStats = useCallback(() => {
    return {
      totalCalculations: events.filter(e => e.category === 'calculation').length,
      totalExports: events.filter(e => e.category === 'export').length,
      totalErrors: events.filter(e => e.category === 'error').length,
      totalEvents: events.length,
      firstSession: events.length > 0 ? new Date(events[0].timestamp).toLocaleDateString() : 'N/A',
      lastSession: events.length > 0 ? new Date(events[events.length - 1].timestamp).toLocaleDateString() : 'N/A',
    };
  }, [events]);

  const clearAnalytics = useCallback(() => {
    setEvents([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('radshield_analytics_enabled', String(next));
      return next;
    });
  }, []);

  return {
    track, getWeeklyMetrics, getTopDialogs, getTotalStats,
    clearAnalytics, isEnabled, toggleEnabled, events,
  };
}
