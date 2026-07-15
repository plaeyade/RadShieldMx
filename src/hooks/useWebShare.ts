/**
 * useWebShare — Recomendación D.4+D.5: Web Share API + Share Target
 * Comparte reportes vía nativo OS share sheet. Receives files from other apps.
 * W3C Web Share API Level 2 (2021). Chrome 89+, Safari 15.4+.
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useWebShare() {
  const [supported] = useState(() => !!navigator.share);

  const share = useCallback(async (data: { title?: string; text?: string; url?: string; files?: File[] }) => {
    if (!supported) { toast.info('Web Share no soportado'); return false; }
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') toast.error('Error al compartir');
      return false;
    }
  }, [supported]);

  const shareFile = useCallback(async (blob: Blob, filename: string, title: string) => {
    const file = new File([blob], filename, { type: blob.type });
    return share({ title, files: [file] });
  }, [share]);

  return { supported, share, shareFile };
}
