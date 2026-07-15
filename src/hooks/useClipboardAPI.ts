/**
 * useClipboardAPI — Recomendación D.3: Clipboard API
 * Copy/paste barriers y sources entre proyectos.
 * W3C Clipboard API Level 2 (2022). Format: application/json radshield-clipboard.
 * Referencia: https://w3c.github.io/clipboard-apis/
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ClipboardItem {
  type: 'barrier' | 'source' | 'region';
  data: unknown;
  timestamp: number;
  projectName: string;
}

export function useClipboardAPI() {
  const [lastItem, setLastItem] = useState<ClipboardItem | null>(null);

  const copyToClipboard = useCallback(async (item: Omit<ClipboardItem, 'timestamp'>) => {
    const fullItem: ClipboardItem = { ...item, timestamp: Date.now() };
    try {
      const json = JSON.stringify(fullItem);
      await navigator.clipboard.writeText(json);
      setLastItem(fullItem);
      toast.success(`${item.type} copiado al portapapeles`, {
        description: 'Ctrl+V para pegar en otro proyecto',
      });
    } catch {
      // Fallback
      localStorage.setItem('radshield_clipboard', JSON.stringify(fullItem));
      setLastItem(fullItem);
      toast.success(`${item.type} copiado (fallback localStorage)`);
    }
  }, []);

  const pasteFromClipboard = useCallback(async (): Promise<ClipboardItem | null> => {
    try {
      const text = await navigator.clipboard.readText();
      const item = JSON.parse(text) as ClipboardItem;
      if (item.type && item.data) {
        setLastItem(item);
        toast.success(`${item.type} pegado`, {
          description: `Del proyecto: ${item.projectName || 'desconocido'}`,
        });
        return item;
      }
    } catch {
      // Try localStorage fallback
      const fallback = localStorage.getItem('radshield_clipboard');
      if (fallback) {
        const item = JSON.parse(fallback) as ClipboardItem;
        toast.success(`${item.type} pegado (fallback)`);
        return item;
      }
    }
    toast.info('Portapapeles vacío o formato no válido');
    return null;
  }, []);

  return { copyToClipboard, pasteFromClipboard, lastItem };
}
