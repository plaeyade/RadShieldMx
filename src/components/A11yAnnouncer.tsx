/**
 * A11yAnnouncer — Fase 2.9: ARIA live region para screen readers
 * Anuncia resultados de calculo, cambios de estado, y errores
 * WCAG 2.1 §4.1.3 — Status Messages
 */
import { useEffect, useState, useCallback } from 'react';

interface Announcement {
  message: string;
  priority: 'polite' | 'assertive';
}

let globalAnnounce: ((a: Announcement) => void) | null = null;

/** Funcion global para anunciar desde cualquier parte de la app */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  globalAnnounce?.({ message, priority });
}

export default function A11yAnnouncer() {
  const [politeMsg, setPoliteMsg] = useState('');
  const [assertiveMsg, setAssertiveMsg] = useState('');

  const handleAnnounce = useCallback(({ message, priority }: Announcement) => {
    if (priority === 'assertive') {
      setAssertiveMsg(message);
      setTimeout(() => setAssertiveMsg(''), 1000);
    } else {
      setPoliteMsg(message);
      setTimeout(() => setPoliteMsg(''), 1000);
    }
  }, []);

  useEffect(() => {
    globalAnnounce = handleAnnounce;
    return () => { globalAnnounce = null; };
  }, [handleAnnounce]);

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {politeMsg}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertiveMsg}
      </div>
    </>
  );
}
