import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { Keyboard, BookOpen } from 'lucide-react';

interface ShortcutEntry {
  action: string;
  keys: string[];
  label: string;
  category: string;
}

const DEFAULT_SHORTCUTS: ShortcutEntry[] = [
  { action: 'calcular', keys: ['F5'], label: 'Calcular blindaje', category: 'Calculo' },
  { action: 'select', keys: ['V'], label: 'Herramienta Seleccionar', category: 'Dibujo' },
  { action: 'barrier', keys: ['B'], label: 'Herramienta Barrera', category: 'Dibujo' },
  { action: 'source', keys: ['S'], label: 'Herramienta Fuente', category: 'Dibujo' },
  { action: 'pan', keys: ['H'], label: 'Herramienta Pan', category: 'Dibujo' },
  { action: 'measure', keys: ['M'], label: 'Herramienta Medir', category: 'Dibujo' },
  { action: 'delete', keys: ['Delete', 'Backspace'], label: 'Borrar seleccion', category: 'Edicion' },
  { action: 'reset', keys: ['0'], label: 'Resetear vista', category: 'Vista' },
  { action: 'zoomIn', keys: ['Ctrl', '+'], label: 'Zoom in', category: 'Vista' },
  { action: 'zoomOut', keys: ['Ctrl', '-'], label: 'Zoom out', category: 'Vista' },
  { action: 'snap', keys: ['G'], label: 'Toggle snap grid', category: 'Vista' },
  { action: 'sidebar', keys: ['Tab'], label: 'Toggle sidebar', category: 'Interfaz' },
  { action: 'export', keys: ['Ctrl', 'E'], label: 'Exportar reporte', category: 'Archivo' },
  { action: 'save', keys: ['Ctrl', 'S'], label: 'Guardar proyecto', category: 'Archivo' },
];

export default function KeyboardShortcutsDialog() {
  const open = useAppStore(s => {
    const state = s.dialogs.keyboardShortcuts;
    return typeof state === 'object' ? !!state?.open : !!state;
  });
  const close = () => useAppStore.getState().close('keyboardShortcuts');
  const [shortcuts, setShortcuts] = useState<ShortcutEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('rs-shortcuts') || 'null') as ShortcutEntry[] || DEFAULT_SHORTCUTS; }
    catch { return DEFAULT_SHORTCUTS; }
  });
  const [recording, setRecording] = useState<string | null>(null);
  const [pressed, setPressed] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('rs-shortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  useEffect(() => {
    if (!recording) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const keys: string[] = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      if (e.key.length === 1) keys.push(e.key.toUpperCase());
      else if (!['Control', 'Alt', 'Shift'].includes(e.key)) keys.push(e.key);
      setPressed(keys);
    };
    const upHandler = () => {
      if (pressed.length > 0) {
        setShortcuts(s => s.map(sc => sc.action === recording ? { ...sc, keys: [...pressed] } : sc));
        setRecording(null);
        setPressed([]);
      }
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', upHandler);
    return () => { window.removeEventListener('keydown', handler); window.removeEventListener('keyup', upHandler); };
  }, [recording, pressed]);

  const resetDefaults = () => { setShortcuts(DEFAULT_SHORTCUTS); localStorage.removeItem('rs-shortcuts'); };
  const categories = [...new Set(shortcuts.map(s => s.category))];

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Keyboard className="w-5 h-5 text-[#475569]" /> Atajos de Teclado — v127
            <span className="text-[10px] font-mono text-slate-400">Personalizables</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {recording && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center text-[11px] text-amber-700 animate-pulse">
              Presiona la combinacion de teclas para "{shortcuts.find(s => s.action === recording)?.label}" — Actual: {pressed.join('+') || '...'}
            </div>
          )}
          {categories.map(cat => (
            <div key={cat}>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{cat}</div>
              <div className="space-y-1">
                {shortcuts.filter(s => s.category === cat).map(sc => (
                  <div key={sc.action} className="flex items-center justify-between text-[11px] p-1.5 rounded hover:bg-slate-50">
                    <span className="text-slate-600">{sc.label}</span>
                    <button onClick={() => setRecording(sc.action)}
                      className={`flex gap-0.5 ${recording === sc.action ? 'ring-1 ring-amber-400' : ''}`}>
                      {sc.keys.map((k, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-700 min-w-[20px] text-center">{k}</span>
                      ))}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full text-[10px]" onClick={resetDefaults}>Restaurar valores por defecto</Button>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Haz clic en cualquier atajo para reasignarlo. La configuracion se guarda automaticamente.</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
