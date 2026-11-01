import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Keyboard, RotateCcw, Save, Search } from 'lucide-react';

interface ShortcutDef {
  id: string;
  name: string;
  defaultKey: string;
  currentKey: string;
  category: string;
}

const DEFAULT_SHORTCUTS: ShortcutDef[] = [
  { id: 'calc', name: 'Calcular blindaje', defaultKey: 'F5', currentKey: 'F5', category: 'Calculo' },
  { id: 'batch', name: 'Calcular batch', defaultKey: 'F6', currentKey: 'F6', category: 'Calculo' },
  { id: 'compare', name: 'Comparar escenarios', defaultKey: 'F7', currentKey: 'F7', category: 'Calculo' },
  { id: 'validate', name: 'Validar plano', defaultKey: 'F8', currentKey: 'F8', category: 'Calculo' },
  { id: 'palette', name: 'Command Palette', defaultKey: 'Ctrl+K', currentKey: 'Ctrl+K', category: 'Navegacion' },
  { id: 'undo', name: 'Deshacer', defaultKey: 'Ctrl+Z', currentKey: 'Ctrl+Z', category: 'Edicion' },
  { id: 'redo', name: 'Rehacer', defaultKey: 'Ctrl+Y', currentKey: 'Ctrl+Y', category: 'Edicion' },
  { id: 'save', name: 'Guardar', defaultKey: 'Ctrl+S', currentKey: 'Ctrl+S', category: 'Archivo' },
  { id: 'open', name: 'Abrir proyecto', defaultKey: 'Ctrl+O', currentKey: 'Ctrl+O', category: 'Archivo' },
  { id: 'export', name: 'Exportar', defaultKey: 'Ctrl+E', currentKey: 'Ctrl+E', category: 'Archivo' },
  { id: 'pdf', name: 'Generar PDF', defaultKey: 'Ctrl+P', currentKey: 'Ctrl+P', category: 'Archivo' },
  { id: 'memoria', name: 'Memoria analitica', defaultKey: 'Ctrl+M', currentKey: 'Ctrl+M', category: 'Reportes' },
  { id: 'cnsns', name: 'Reporte CNSNS', defaultKey: 'Ctrl+R', currentKey: 'Ctrl+R', category: 'Reportes' },
  { id: 'shortcuts', name: 'Atajos de teclado', defaultKey: '?', currentKey: '?', category: 'General' },
  { id: 'help', name: 'Panel de ayuda', defaultKey: 'Ctrl+Shift+H', currentKey: 'Ctrl+Shift+H', category: 'General' },
  { id: 'history', name: 'Historial', defaultKey: 'Ctrl+H', currentKey: 'Ctrl+H', category: 'General' },
  { id: 'zoomIn', name: 'Zoom in', defaultKey: 'Ctrl++', currentKey: 'Ctrl++', category: 'Canvas' },
  { id: 'zoomOut', name: 'Zoom out', defaultKey: 'Ctrl+-', currentKey: 'Ctrl+-', category: 'Canvas' },
  { id: 'fit', name: 'Ajustar a pantalla', defaultKey: 'Ctrl+0', currentKey: 'Ctrl+0', category: 'Canvas' },
  { id: 'grid', name: 'Toggle grid', defaultKey: 'G', currentKey: 'G', category: 'Canvas' },
];

interface KeyboardConfigDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function KeyboardConfigDialog({ open, onOpenChange }: KeyboardConfigDialogProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutDef[]>(() => {
    try {
      const saved = localStorage.getItem('radshield_shortcuts');
      if (saved) {
        const parsed = JSON.parse(saved);
        return DEFAULT_SHORTCUTS.map(d => ({ ...d, currentKey: parsed[d.id] || d.currentKey }));
      }
    } catch { /* ignore */ }
    return DEFAULT_SHORTCUTS;
  });
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const filtered = shortcuts.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.currentKey.toLowerCase().includes(search.toLowerCase()));

  const categories = [...new Set(filtered.map(s => s.category))];

  const handleSave = () => {
    const mapping: Record<string, string> = {};
    shortcuts.forEach(s => { mapping[s.id] = s.currentKey; });
    localStorage.setItem('radshield_shortcuts', JSON.stringify(mapping));
    onOpenChange(false);
  };

  const handleReset = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
    localStorage.removeItem('radshield_shortcuts');
  };

  const handleKeyRecord = (id: string, e: React.KeyboardEvent) => {
    e.preventDefault();
    const keys: string[] = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Meta');
    if (e.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
    }
    const combo = keys.join('+');
    if (combo) {
      setShortcuts(prev => prev.map(s => s.id === id ? { ...s, currentKey: combo } : s));
      setEditing(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Keyboard className="w-5 h-5 text-blue-500" />
            Configuracion de Atajos de Teclado
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar atajo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
          </div>
        </div>

        <ScrollArea className="px-6 pb-3 max-h-[45vh]">
          {categories.map(cat => (
            <div key={cat} className="mb-3">
              <h4 className="text-[10px] font-semibold text-slate-500 uppercase mb-1">{cat}</h4>
              {filtered.filter(s => s.category === cat).map(s => (
                <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs">{s.name}</span>
                  {editing === s.id ? (
                    <button
                      className="h-7 px-3 bg-blue-50 border border-blue-300 rounded text-xs font-mono animate-pulse"
                      onKeyDown={(e) => handleKeyRecord(s.id, e)}
                      onBlur={() => setEditing(null)}
                      autoFocus
                    >
                      Presione teclas...
                    </button>
                  ) : (
                    <button
                      className={`h-7 px-2 border rounded text-xs font-mono ${s.currentKey !== s.defaultKey ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}
                      onClick={() => setEditing(s.id)}
                    >
                      {s.currentKey}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </ScrollArea>

        <div className="px-6 pb-4 flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />Restaurar
          </Button>
          <div className="flex-1" />
          <Button size="sm" variant="default" className="h-7 text-xs" onClick={handleSave}>
            <Save className="w-3.5 h-3.5 mr-1" />Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
