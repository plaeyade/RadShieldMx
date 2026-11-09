import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { Moon, Sun, Monitor, Palette, BookOpen } from 'lucide-react';

const THEMES = [
  { id: 'light', name: 'Claro', icon: Sun, desc: 'Interfaz luminosa para uso diurno', bg: '#ffffff', text: '#1e293b' },
  { id: 'dark', name: 'Oscuro', icon: Moon, desc: 'Interfaz oscura para reducir fatiga visual', bg: '#0f172a', text: '#e2e8f0' },
  { id: 'system', name: 'Sistema', icon: Monitor, desc: 'Detecta automaticamente la preferencia del OS', bg: '#334155', text: '#f8fafc' },
];

const ACCENT_COLORS = [
  { id: 'orange', name: 'Naranja', hex: '#f97316' },
  { id: 'blue', name: 'Azul', hex: '#3b82f6' },
  { id: 'emerald', name: 'Esmeralda', hex: '#10b981' },
  { id: 'purple', name: 'Purpura', hex: '#8b5cf6' },
  { id: 'red', name: 'Rojo', hex: '#ef4444' },
  { id: 'cyan', name: 'Cyan', hex: '#06b6d4' },
];

export default function DarkModeDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.darkMode));
  const close = () => useAppStore.getState().close('darkMode');
  const [theme, setTheme] = useState(() => localStorage.getItem('rs-theme') || 'system');
  const [accent, setAccent] = useState(() => localStorage.getItem('rs-accent') || 'orange');
  const [sidebarCompact, setSidebarCompact] = useState(() => localStorage.getItem('rs-sidebar-compact') === 'true');

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    const color = ACCENT_COLORS.find(c => c.id === accent)?.hex || '#f97316';
    root.style.setProperty('--rs-accent', color);
    localStorage.setItem('rs-theme', theme);
    localStorage.setItem('rs-accent', accent);
    localStorage.setItem('rs-sidebar-compact', String(sidebarCompact));
  }, [theme, accent, sidebarCompact]);

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Palette className="w-5 h-5 text-[#8b5cf6]" /> Apariencia — v124
            <span className="text-[10px] font-mono text-slate-400">Tema y colores</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Theme selection */}
          <div>
            <Label className="text-[10px] font-semibold text-slate-600 mb-2 block">Tema</Label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-center p-2 rounded-lg border transition-all text-[10px] ${
                      theme === t.id ? 'border-purple-300 bg-purple-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <Icon className="w-5 h-5 mb-1" style={{ color: t.text }} />
                    <span className="font-bold">{t.name}</span>
                    <span className="text-[8px] text-slate-400 text-center leading-tight">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent color */}
          <div>
            <Label className="text-[10px] font-semibold text-slate-600 mb-2 block">Color de acento</Label>
            <div className="flex gap-2">
              {ACCENT_COLORS.map(c => (
                <button key={c.id} onClick={() => setAccent(c.id)} title={c.name}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${accent === c.id ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c.hex }} />
              ))}
            </div>
          </div>

          {/* Compact sidebar */}
          <div className="flex items-center justify-between">
            <div><Label className="text-[10px] font-semibold">Sidebar compacto</Label><p className="text-[9px] text-slate-400">Reduce el ancho del panel lateral</p></div>
            <Switch checked={sidebarCompact} onCheckedChange={setSidebarCompact} />
          </div>

          {/* Preview */}
          <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className="text-[10px] font-semibold mb-1" style={{ color: ACCENT_COLORS.find(c => c.id === accent)?.hex }}>Vista previa</div>
            <div className="text-[9px]">Asi se vera la interfaz con el tema seleccionado.</div>
          </div>

          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />La configuracion se guarda automaticamente en localStorage.</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
