// Fase 9: la línea de tiempo lee la bitácora real (eventos del plano y, con servidor, `trpc.audit.list`); antes eran
// 15 eventos con usuarios, fechas y proyectos ilustrativos.
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, GitCommit, User, Calculator, FileText, ShieldCheck, Settings, TrendingUp, AlertTriangle } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { AvisoBitacora, BitacoraProyecto, type EntradaBitacora, type EstadoServidor, type TipoEntrada } from '@/components/BitacoraProyecto';

const TYPE_CONFIG: Record<TipoEntrada, { label: string; color: string; dot: string; icon: typeof GitCommit }> = {
  calc: { label: 'Cálculo', color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-400', icon: Calculator },
  edit: { label: 'Edición', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400', icon: Settings },
  export: { label: 'Exportación', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400', icon: FileText },
  validate: { label: 'Validación', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400', icon: ShieldCheck },
  config: { label: 'Sesión', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400', icon: Settings },
  import: { label: 'Importación', color: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-400', icon: FileText },
  warning: { label: 'Advertencia', color: 'bg-red-100 text-red-700', dot: 'bg-red-400', icon: AlertTriangle },
  otro: { label: 'Otro', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400', icon: GitCommit },
};

interface AuditDashboardDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function AuditDashboardDialog({ open, onOpenChange }: AuditDashboardDialogProps) {
  const floorPlan = useCanvasStore((s) => s.floorPlan);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Tablero de auditoría — línea de tiempo
          </DialogTitle>
          <DialogDescription className="text-xs">Proyecto «{floorPlan.name}».</DialogDescription>
        </DialogHeader>
        {open && (
          <BitacoraProyecto plano={floorPlan}>
            {(entradas, estado) => <Linea entradas={entradas} estado={estado} />}
          </BitacoraProyecto>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Linea({ entradas, estado }: { entradas: EntradaBitacora[]; estado: EstadoServidor }) {
  const [filter, setFilter] = useState<TipoEntrada | 'all'>('all');
  const filtered = filter === 'all' ? entradas : entradas.filter((a) => a.tipo === filter);
  const byUser: Record<string, number> = {};
  const byType: Partial<Record<TipoEntrada, number>> = {};
  for (const a of entradas) {
    byUser[a.usuario] = (byUser[a.usuario] || 0) + 1;
    byType[a.tipo] = (byType[a.tipo] || 0) + 1;
  }
  const tipos = (Object.keys(TYPE_CONFIG) as TipoEntrada[]).filter((k) => byType[k]);

  return (
    <>
      <div className="px-6"><AvisoBitacora estado={estado} total={entradas.length} /></div>
      <div className="px-6 pb-3 grid grid-cols-4 gap-2">
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <div data-testid="auditoria-total" className="text-lg font-bold text-slate-700">{entradas.length}</div>
          <div className="text-[10px] text-slate-500">eventos</div>
        </div>
        {Object.entries(byUser).filter(([u]) => u !== '—').slice(0, 3).map(([user, count]) => (
          <div key={user} className="bg-slate-50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-slate-700">{count}</div>
            <div className="text-[10px] text-slate-500 truncate">{user}</div>
          </div>
        ))}
      </div>

      <div className="px-6 pb-3 flex items-center gap-1 flex-wrap">
        <Badge className={`cursor-pointer text-[9px] h-5 ${filter === 'all' ? 'bg-blue-100 text-blue-700' : ''}`} onClick={() => setFilter('all')}>Todos</Badge>
        {tipos.map((key) => (
          <Badge key={key} className={`cursor-pointer text-[9px] h-5 ${filter === key ? TYPE_CONFIG[key].color : ''}`} onClick={() => setFilter(key)}>
            {TYPE_CONFIG[key].label} ({byType[key]})
          </Badge>
        ))}
      </div>

      <Separator />

      <ScrollArea className="px-6 pb-6 max-h-[50vh]">
        <div className="relative">
          {filtered.length > 0 && <div className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-200" />}
          {!filtered.length && <div className="py-8 text-center text-xs text-slate-400">Sin eventos.</div>}
          {filtered.map((entry) => {
            const cfg = TYPE_CONFIG[entry.tipo];
            const Icon = cfg.icon;
            return (
              <div key={entry.id} className="relative flex items-start gap-3 py-2 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className={`relative z-10 w-[9px] h-[9px] rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-medium">{entry.accion}</span>
                    <Badge className={`${cfg.color} text-[8px] h-3.5 px-1`}>{cfg.label}</Badge>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1"><User className="w-2.5 h-2.5" />{entry.usuario}</span>
                  </div>
                  {entry.detalle && <p className="text-xs text-slate-600 mt-0.5">{entry.detalle}</p>}
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400">
                    <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{entry.fecha ? new Date(entry.fecha).toLocaleString('es-MX') : '—'}</span>
                    <span>Origen: {entry.origen}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
}
