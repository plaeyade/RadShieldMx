/**
 * E.8: Email Notifications — Simulated weekly report delivery
 * En produccion se conectaria a un backend (SendGrid/AWS SES/Resend)
 * Ahora: simula envio con notificaciones toast + localStorage tracking
 */
import { useState, useCallback, useEffect } from 'react';

interface ScheduledReport {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  enabled: boolean;
  lastSent?: number;
  template: 'summary' | 'full' | 'alerts-only';
}

const STORAGE_KEY = 'radshield_email_reports';

function loadReports(): ScheduledReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultReports();
  } catch { return getDefaultReports(); }
}

function getDefaultReports(): ScheduledReport[] {
  return [
    {
      id: 'weekly-summary',
      name: 'Resumen Semanal de Blindajes',
      frequency: 'weekly',
      recipients: [],
      enabled: false,
      template: 'summary',
    },
    {
      id: 'daily-alerts',
      name: 'Alertas Diarias de Dosis',
      frequency: 'daily',
      recipients: [],
      enabled: false,
      template: 'alerts-only',
    },
    {
      id: 'monthly-full',
      name: 'Reporte Mensual Completo',
      frequency: 'monthly',
      recipients: [],
      enabled: false,
      template: 'full',
    },
  ];
}

function saveReports(reports: ScheduledReport[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reports)); }
  catch { /* storage full */ }
}

export function useEmailNotifications() {
  const [reports, setReports] = useState<ScheduledReport[]>(loadReports);

  useEffect(() => { saveReports(reports); }, [reports]);

  const addReport = useCallback((report: Omit<ScheduledReport, 'id'>) => {
    const newReport: ScheduledReport = { ...report, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    setReports(prev => [...prev, newReport]);
    return newReport.id;
  }, []);

  const updateReport = useCallback((id: string, updates: Partial<ScheduledReport>) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteReport = useCallback((id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  }, []);

  const toggleReport = useCallback((id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, []);

  const sendNow = useCallback((reportId: string): Promise<boolean> => {
    return new Promise(resolve => {
      setTimeout(() => {
        setReports(prev => prev.map(r =>
          r.id === reportId ? { ...r, lastSent: Date.now() } : r
        ));
        resolve(true);
      }, 1500);
    });
  }, []);

  const getEmailTemplate = useCallback((template: ScheduledReport['template'], stats: {
    totalCalculations: number; totalExports: number; totalErrors: number;
  }) => {
    const templates: Record<string, string> = {
      summary: `Resumen RadShield-MX\n\n- Calculos esta semana: ${stats.totalCalculations}\n- Exportes generados: ${stats.totalExports}\n- Alertas: ${stats.totalErrors > 0 ? stats.totalErrors + ' errores' : 'Sin alertas'}\n\nRadShield-MX — Sistema Profesional de Calculo de Blindajes`,
      'alerts-only': `Alertas RadShield-MX\n\n${stats.totalErrors > 0 ? `⚠️ ${stats.totalErrors} errores detectados` : '✅ Sin alertas esta semana'}\n\nRevise el panel de analytics para mas detalles.`,
      full: `Reporte Completo RadShield-MX\n\n=== Estadisticas ===\nCalculos: ${stats.totalCalculations}\nExportes: ${stats.totalExports}\nErrores: ${stats.totalErrors}\n\n=== Recomendaciones ===\n${stats.totalErrors > 5 ? '- Revise la configuracion de blindajes\n' : ''}- Verifique las metas de dosis semanal\n- Actualice las cargas de trabajo segun programa clinico\n\nRadShield-MX v63`,
    };
    return templates[template] || templates.summary;
  }, []);

  return {
    reports, addReport, updateReport, deleteReport,
    toggleReport, sendNow, getEmailTemplate,
  };
}
