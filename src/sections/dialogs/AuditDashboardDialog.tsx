import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, GitCommit, User, Calculator, FileText, ShieldCheck, Settings, TrendingUp } from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  type: 'calc' | 'edit' | 'export' | 'validate' | 'config' | 'import';
  description: string;
  project: string;
}

const AUDIT_DATA: AuditEntry[] = [
  { id: 'A001', timestamp: '2026-05-28 14:32:15', user: 'Dr. Garcia', action: 'Calculo de Blindaje', type: 'calc', description: 'Calculo batch de 8 barreras — 6 PASS, 2 WARN', project: 'Bunker LINAC 196' },
  { id: 'A002', timestamp: '2026-05-28 14:28:03', user: 'Dr. Garcia', action: 'Edicion de Barrera', type: 'edit', description: 'Modificado espesor Pared Primaria N: 110→120 cm', project: 'Bunker LINAC 196' },
  { id: 'A003', timestamp: '2026-05-28 14:15:22', user: 'Ing. Martinez', action: 'Exportar PDF', type: 'export', description: 'Memoria analitica PDF generada (v15)', project: 'Bunker LINAC 196' },
  { id: 'A004', timestamp: '2026-05-28 13:45:10', user: 'Dr. Garcia', action: 'Validar Plano', type: 'validate', description: 'Validacion CNSNS checklist: 18/20 items OK', project: 'Bunker LINAC 196' },
  { id: 'A005', timestamp: '2026-05-27 11:20:05', user: 'Ing. Lopez', action: 'Importar DXF', type: 'import', description: 'Plano AutoCAD importado: bunker_196_rev3.dxf', project: 'Bunker LINAC 196' },
  { id: 'A006', timestamp: '2026-05-27 10:15:33', user: 'Dr. Garcia', action: 'Calculo Monte Carlo', type: 'calc', description: 'Simulacion MC completada: 1M particulas, 42 min', project: 'Bunker LINAC 196' },
  { id: 'A007', timestamp: '2026-05-26 16:45:12', user: 'Ing. Martinez', action: 'Configuracion', type: 'config', description: 'Parametros de isodosis CT actualizados', project: 'Sala PET-CT' },
  { id: 'A008', timestamp: '2026-05-26 15:30:00', user: 'Dr. Garcia', action: 'Exportar JSON', type: 'export', description: 'Datos de proyecto exportados para revision', project: 'Sala PET-CT' },
  { id: 'A009', timestamp: '2026-05-25 09:10:45', user: 'Ing. Lopez', action: 'Calculo de Blindaje', type: 'calc', description: 'Recalculo post-cambio de material a barita', project: 'Gamma Knife' },
  { id: 'A010', timestamp: '2026-05-24 14:20:18', user: 'Dr. Garcia', action: 'Validar Plano', type: 'validate', description: 'Validacion completa: Todos los checks PASS', project: 'Gamma Knife' },
  { id: 'A011', timestamp: '2026-05-23 11:05:30', user: 'Ing. Martinez', action: 'Edicion de Fuente', type: 'edit', description: 'Agregada fuente HDR Co-60, actividad 10 Ci', project: 'Braquiterapia HDR' },
  { id: 'A012', timestamp: '2026-05-22 08:45:22', user: 'Dr. Garcia', action: 'Calculo Decay Heat', type: 'calc', description: 'Calculo calor de decaimiento: 4.23 W total', project: 'Ciclotron 18 MeV' },
  { id: 'A013', timestamp: '2026-05-20 16:30:15', user: 'Ing. Lopez', action: 'Configuracion', type: 'config', description: 'Escala actualizada: 0.01→0.008 m/pixel', project: 'Ciclotron 18 MeV' },
  { id: 'A014', timestamp: '2026-05-19 13:20:08', user: 'Dr. Garcia', action: 'Exportar CSV', type: 'export', description: 'Resultados exportados para Excel', project: 'Bunker LINAC 196' },
  { id: 'A015', timestamp: '2026-05-18 10:00:00', user: 'Ing. Martinez', action: 'Calculo Sensitivity', type: 'calc', description: 'Analisis de sensibilidad completado', project: 'Bunker LINAC 196' },
];

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof GitCommit }> = {
  calc: { label: 'Calculo', color: 'bg-violet-100 text-violet-700', icon: Calculator },
  edit: { label: 'Edicion', color: 'bg-blue-100 text-blue-700', icon: Settings },
  export: { label: 'Export', color: 'bg-emerald-100 text-emerald-700', icon: FileText },
  validate: { label: 'Validacion', color: 'bg-amber-100 text-amber-700', icon: ShieldCheck },
  config: { label: 'Config', color: 'bg-slate-100 text-slate-700', icon: Settings },
  import: { label: 'Import', color: 'bg-cyan-100 text-cyan-700', icon: FileText },
};

interface AuditDashboardDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function AuditDashboardDialog({ open, onOpenChange }: AuditDashboardDialogProps) {
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? AUDIT_DATA : AUDIT_DATA.filter(a => a.type === filter);

  // Stats
  const stats = {
    total: AUDIT_DATA.length,
    byUser: {} as Record<string, number>,
    byType: {} as Record<string, number>,
  };
  AUDIT_DATA.forEach(a => {
    stats.byUser[a.user] = (stats.byUser[a.user] || 0) + 1;
    stats.byType[a.type] = (stats.byType[a.type] || 0) + 1;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Audit Dashboard — Timeline de Cambios
            <Badge variant="outline" className="text-[10px]">{stats.total} eventos</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Stats cards */}
        <div className="px-6 pb-3 grid grid-cols-4 gap-2">
          {Object.entries(stats.byUser).map(([user, count]) => (
            <div key={user} className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-slate-700">{count}</div>
              <div className="text-[10px] text-slate-500">{user}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="px-6 pb-3 flex items-center gap-1 flex-wrap">
          <Badge className={`cursor-pointer text-[9px] h-5 ${filter === 'all' ? 'bg-blue-100 text-blue-700' : ''}`} onClick={() => setFilter('all')}>Todos</Badge>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <Badge key={key} className={`cursor-pointer text-[9px] h-5 ${filter === key ? cfg.color : ''}`} onClick={() => setFilter(key)}>
              {cfg.label} ({stats.byType[key] || 0})
            </Badge>
          ))}
        </div>

        <Separator />

        {/* Timeline */}
        <ScrollArea className="px-6 pb-6 max-h-[50vh]">
          <div className="relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-200" />
            {filtered.map((entry, i) => {
              const cfg = TYPE_CONFIG[entry.type];
              const Icon = cfg.icon;
              return (
                <div key={entry.id} className="relative flex items-start gap-3 py-2 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className={`relative z-10 w-[9px] h-[9px] rounded-full mt-1.5 shrink-0 ${cfg.color.split(' ')[0].replace('bg-', 'bg-').replace('100', '400')}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon className="w-3 h-3 text-slate-400" />
                      <span className="text-xs font-medium">{entry.action}</span>
                      <Badge className={`${cfg.color} text-[8px] h-3.5 px-1`}>{cfg.label}</Badge>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />{entry.user}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{entry.description}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400">
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{entry.timestamp}</span>
                      <span>Proyecto: {entry.project}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
