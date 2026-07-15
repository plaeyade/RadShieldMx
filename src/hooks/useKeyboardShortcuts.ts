import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  onUndo: () => void; onRedo: () => void;
  onCommandPalette: (show: boolean | ((v: boolean) => boolean)) => void;
  onKeyboardShortcuts: (show: boolean | ((v: boolean) => boolean)) => void;
  onHistoryPanel: (show: boolean | ((v: boolean) => boolean)) => void;
  onHelpPanel: (show: boolean | ((v: boolean) => boolean)) => void;
  onRAGPanel: (show: boolean | ((v: boolean) => boolean)) => void;
  onMemoryPanel: (show: boolean | ((v: boolean) => boolean)) => void;
  onCalculate: () => void; onSave: () => void; onOpen: () => void;
  onToggleTheme?: () => void; onZoomIn: () => void; onZoomOut: () => void;
  onZoomToFit: () => void; onExport: () => void;
}

export function useKeyboardShortcuts(config: ShortcutConfig) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const key = e.key.toLowerCase();
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    if (key === '?') { e.preventDefault(); config.onKeyboardShortcuts(v => !v); return; }
    if (e.key === 'Escape') { config.onCommandPalette(false); config.onKeyboardShortcuts(false); return; }
    if (ctrl) {
      switch (key) {
        case 'k': e.preventDefault(); config.onCommandPalette(v => !v); return;
        case 'h': e.preventDefault(); shift ? config.onHelpPanel(v => !v) : config.onHistoryPanel(v => !v); return;
        case 'z': e.preventDefault(); shift ? config.onRedo() : config.onUndo(); return;
        case 'y': e.preventDefault(); config.onRedo(); return;
        case 's': e.preventDefault(); config.onSave(); return;
        case 'o': e.preventDefault(); config.onOpen(); return;
        case 'e': e.preventDefault(); config.onExport(); return;
        case 'r': if (shift) { e.preventDefault(); config.onRAGPanel(v => !v); } return;
        case 'm': if (shift) { e.preventDefault(); config.onMemoryPanel(v => !v); } return;
        case '=': case '+': e.preventDefault(); config.onZoomIn(); return;
        case '-': e.preventDefault(); config.onZoomOut(); return;
        case '0': e.preventDefault(); config.onZoomToFit(); return;
      }
    }
    switch (e.key) { case 'F5': e.preventDefault(); config.onCalculate(); return; case 'F1': e.preventDefault(); config.onHelpPanel(v => !v); return; }
  }, [config]);
  useEffect(() => { window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [handleKeyDown]);
}

export const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl+K', action: 'Command Palette' }, { key: 'Ctrl+S', action: 'Guardar proyecto' },
  { key: 'Ctrl+O', action: 'Abrir proyecto' }, { key: 'Ctrl+Z', action: 'Deshacer' },
  { key: 'Ctrl+Y', action: 'Rehacer' }, { key: 'Ctrl+H', action: 'Panel historial' },
  { key: 'Ctrl+Shift+H', action: 'Panel ayuda' }, { key: 'Ctrl+Shift+R', action: 'Panel RAG' },
  { key: 'Ctrl+Shift+M', action: 'Panel memorias' }, { key: 'Ctrl+E', action: 'Exportar' },
  { key: 'Ctrl+0', action: 'Zoom to fit' }, { key: 'Ctrl++', action: 'Zoom in' },
  { key: 'Ctrl+-', action: 'Zoom out' }, { key: 'F5', action: 'Calcular blindajes' },
  { key: 'F1', action: 'Ayuda' }, { key: '?', action: 'Ver atajos' }, { key: 'Escape', action: 'Cerrar dialogs' },
] as const;
