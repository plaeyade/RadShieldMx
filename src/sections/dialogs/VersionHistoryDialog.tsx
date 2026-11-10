import { useState } from 'react';
import { RotateCcw, GitBranch, Calendar, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DialogShell from '@/components/DialogShell';
import { toast } from 'sonner';

interface Version { id: string; name: string; date: string; time: string; size: string; changes: string[]; author: string; }

// Fase 10: se retiraron cinco versiones inventadas (autores y fechas ficticios) que aparecían en cualquier
// proyecto. Aún no hay almacén de versiones: el diálogo muestra el estado vacío y remite a guardar el proyecto.
const VERSIONES_GUARDADAS: Version[] = [];

interface Props { open: boolean; onOpenChange: (open: boolean) => void; onRestore?: (version: Version) => void; }

export default function VersionHistoryDialog({ open, onOpenChange, onRestore }: Props) {
  const [versions] = useState<Version[]>(VERSIONES_GUARDADAS);
  const [selected, setSelected] = useState<string | null>(null);

  if (!open) return null;

  const handleRestore = (v: Version) => {
    onRestore?.(v);
    toast.success(`Restored to ${v.name}`, { description: `Version from ${v.date} ${v.time}` });
    onOpenChange(false);
  };

  return (
    <DialogShell
      title="Version History"
      subtitle="Historial movible de cambios y restauracion - F391"
      gradientFrom="from-orange-500"
      gradientTo="to-amber-600"
      maxWidth="max-w-2xl"
      onClose={() => onOpenChange(false)}
    >
      <div data-testid="f391-version-history-dialogshell" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-[#fff7ed] px-5 py-3">
          <GitBranch className="h-5 w-5 text-[#f97316]" />
          <div>
            <h2 className="text-sm font-bold text-slate-800">Version History</h2>
            <p className="text-xs text-slate-500">Seleccione una version previa sin abandonar el floorplan.</p>
          </div>
        </div>
        <div className="max-h-[58vh] overflow-auto p-4">
          {versions.length === 0 && (
            <p data-testid="f10-version-history-vacio" className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
              Aún no hay versiones guardadas de este proyecto. Use Archivo → Guardar para conservar el estado actual;
              los cambios de la sesión se deshacen con Ctrl+Z.
            </p>
          )}
          <div className="space-y-2">
            {versions.map((v, i) => (
              <div key={v.id} className={`cursor-pointer rounded-lg border p-3 transition-all ${selected === v.id ? 'border-[#f97316] bg-[#fff7ed]' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => setSelected(v.id)}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400">v{i + 1}</span>
                    <span className="text-[12px] font-semibold text-slate-700">{v.name}</span>
                    {i === versions.length - 1 && <span className="rounded-full bg-[#f97316] px-1.5 py-0.5 text-[9px] font-bold text-white">CURRENT</span>}
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400"><HardDrive className="h-3 w-3" />{v.size}</span>
                </div>
                <div className="mb-1.5 flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{v.date} {v.time}</span>
                  <span>{v.author}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {v.changes.map((c, j) => <span key={j} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-600">{c}</span>)}
                </div>
                {selected === v.id && i !== versions.length - 1 && (
                  <Button size="sm" variant="outline" className="mt-2 h-7 gap-1 text-[11px]" onClick={() => handleRestore(v)}>
                    <RotateCcw className="h-3 w-3" /> Restore this version
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DialogShell>
  );
}
