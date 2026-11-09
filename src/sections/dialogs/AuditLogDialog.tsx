/**
 * AuditLogDialog — E.9: exportación de la bitácora para inspección.
 * Fase 9: lee la bitácora real (eventos del plano y, con servidor, `trpc.audit.list`); antes mostraba 12 eventos
 * ficticios con usuarios de dominio institucional.
 */
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Download, Search, Filter, ShieldCheck } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { AvisoBitacora, BitacoraProyecto, type EntradaBitacora, type EstadoServidor } from '@/components/BitacoraProyecto';

interface Props { open: boolean; onClose: () => void; }

const csvCelda = (v: string) => `"${v.replace(/"/g, '""')}"`;

export default function AuditLogDialog({ open, onClose }: Props) {
  const floorPlan = useCanvasStore((s) => s.floorPlan);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Bitácora de auditoría — inspección regulatoria
            <Badge variant="outline" className="text-[10px]">E.9</Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">Proyecto «{floorPlan.name}».</DialogDescription>
        </DialogHeader>
        {open && (
          <BitacoraProyecto plano={floorPlan}>
            {(entradas, estado) => <Tabla entradas={entradas} estado={estado} proyecto={floorPlan.id} />}
          </BitacoraProyecto>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Tabla({ entradas, estado, proyecto }: { entradas: EntradaBitacora[]; estado: EstadoServidor; proyecto: string }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Todas');
  const categories = ['Todas', ...new Set(entradas.map((a) => a.tipo))];
  const filtered = useMemo(() => entradas.filter((a) => {
    const q = search.toLowerCase();
    return (a.accion.toLowerCase().includes(q) || a.detalle.toLowerCase().includes(q) || a.usuario.toLowerCase().includes(q))
      && (catFilter === 'Todas' || a.tipo === catFilter);
  }), [entradas, search, catFilter]);

  const exportCSV = () => {
    if (!filtered.length) { toast.error('Sin eventos para exportar'); return; }
    const filas = [['FechaHora', 'Origen', 'Usuario', 'Accion', 'Tipo', 'Detalle'], ...filtered.map((a) => [a.fecha, a.origen, a.usuario, a.accion, a.tipo, a.detalle])];
    const blob = new Blob([filas.map((r) => r.map(csvCelda).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `bitacora_${proyecto}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Bitácora exportada: ${filtered.length} eventos`);
  };

  return (
    <>
      <AvisoBitacora estado={estado} total={entradas.length} />
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en la bitácora…" className="h-8 text-xs pl-8" />
        </div>
        <div className="relative">
          <Filter className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <select aria-label="Tipo de evento" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-8 text-xs border rounded pl-7 pr-2">
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-[10px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Fecha</th>
              <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Origen</th>
              <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Usuario</th>
              <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Acción</th>
              <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} className="border-t hover:bg-slate-50">
                <td className="px-2 py-1.5 text-slate-500 whitespace-nowrap">{entry.fecha ? new Date(entry.fecha).toLocaleString('es-MX') : '—'}</td>
                <td className="px-2 py-1.5 text-slate-500">{entry.origen}</td>
                <td className="px-2 py-1.5 text-slate-600 truncate max-w-[100px]">{entry.usuario}</td>
                <td className="px-2 py-1.5 font-medium text-slate-700">{entry.accion}</td>
                <td className="px-2 py-1.5 text-slate-500 truncate max-w-[220px]">{entry.detalle}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={5} className="px-2 py-6 text-center text-slate-400">Sin eventos.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mt-2">
        <Button variant="outline" size="sm" className="text-xs flex-1" onClick={exportCSV} disabled={!filtered.length}>
          <Download className="w-3 h-3 mr-1" /> Exportar CSV
        </Button>
      </div>
    </>
  );
}
