// Fase 2: DashboardCalcDialog -- Replica de DASHBOARD_ING del Excel
import { verificarPlano } from '@/lib/estadoProyecto';
import AvisoProyectoVacio from '@/components/AvisoProyectoVacio';
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gauge, AlertTriangle, CheckCircle, TrendingUp, Shield, Activity, BarChart3 } from 'lucide-react';
import type { FloorPlan } from '@/types/radshield';
import { P_CONTROLADA_mSv_semana, P_NO_CONTROLADA_mSv_semana } from '@/lib/limitesDosis';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floorPlan: FloorPlan;
}

const MODULES = [
  { id: 'linac_primary', name: 'LINAC Blindaje Primario', norma: 'NCRP 151, NOM-008' },
  { id: 'linac_secondary', name: 'LINAC Blindaje Secundario', norma: 'NCRP 151, NOM-033' },
  { id: 'neutrons', name: 'Neutrones (>10 MV)', norma: 'NCRP 151 Cap.5' },
  { id: 'petct', name: 'PET-CT', norma: 'AAPM TG 108, ICRP 94' },
  { id: 'gammaknife', name: 'Gamma Knife', norma: 'NCRP 91, NOM-008' },
  { id: 'hdr', name: 'HDR Braquiterapia', norma: 'NCRP 147, NOM-041' },
  { id: 'cyclotron', name: 'Ciclotron / Radiofarmacia', norma: 'IAEA TRS 430, NOM-036' },
];

export default function DashboardCalcDialog({ open, onOpenChange, floorPlan }: Props) {
  // Fase 8c: una barrera cumple sólo si el espesor instalado ≥ requerido (`verificarPlano`); antes contaba como «OK»
  // con el 90 % del requerido y las barreras sin cálculo o sin espesor también contaban. Sin espesor por omisión de 200 mm.
  const stats = useMemo(() => {
    const numSources = floorPlan.sources.length;
    const numBarriers = floorPlan.barriers.length;
    const v = verificarPlano(floorPlan);
    const requeridos = v.filas.map(f => f.requerido_mm).filter((x): x is number => x !== null);
    const numCalculated = requeridos.length;
    const maxDose = numBarriers > 0
      ? Math.max(...floorPlan.barriers.map(b => b.designGoal_mSv_per_wk || 0.02))
      : 0.02;
    const avgThickness = requeridos.length > 0 ? requeridos.reduce((a, x) => a + x, 0) / requeridos.length : 0;
    const barriersOK = v.resumen.cumple;
    const compliance = numBarriers > 0 ? Math.round((barriersOK / numBarriers) * 100) : 0;
    return { numSources, numBarriers, numCalculated, maxDose, avgThickness, barriersOK, compliance, pendientes: v.resumen.pendientes };
  }, [floorPlan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-500" />
            Dashboard Ejecutivo -- Sistema de Blindajes
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4">
            <AvisoProyectoVacio floorPlan={floorPlan} />
            {/* KPIs Row */}
            <div className="grid grid-cols-4 gap-3">
              <KpiCard
                label="Objetivo P máx. (mSv/sem)"
                value={stats.maxDose.toFixed(3)}
                status={stats.maxDose <= 0.02 ? 'ok' : stats.maxDose <= 0.1 ? 'warning' : 'fail'}
                icon={<Activity className="w-4 h-4" />}
              />
              <KpiCard
                label="Espesor requerido promedio"
                value={`${(stats.avgThickness / 10).toFixed(1)} cm`}
                sub={`${stats.avgThickness.toFixed(0)} mm`}
                status="info"
                icon={<Shield className="w-4 h-4" />}
              />
              <KpiCard
                label="Barreras OK"
                value={`${stats.barriersOK} / ${stats.numBarriers}`}
                status={stats.compliance >= 90 ? 'ok' : stats.compliance >= 75 ? 'warning' : 'fail'}
                icon={<CheckCircle className="w-4 h-4" />}
              />
              <KpiCard
                label="Cumplimiento"
                value={`${stats.compliance}%`}
                status={stats.compliance >= 90 ? 'ok' : stats.compliance >= 75 ? 'warning' : 'fail'}
                icon={<TrendingUp className="w-4 h-4" />}
              />
            </div>

            {/* ALARA Banner */}
            <div className={`p-3 rounded-lg border flex items-center gap-3 ${
              stats.maxDose <= 0.02 ? 'bg-green-50 border-green-300' :
              stats.maxDose <= 0.1 ? 'bg-yellow-50 border-yellow-300' :
              'bg-red-50 border-red-300'
            }`}>
              {stats.maxDose <= 0.02 ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
              <div>
                <div className="font-bold text-sm">
                  {stats.numBarriers > 0 && stats.barriersOK === stats.numBarriers ? 'Todas las barreras cumplen (instalado ≥ requerido)' : `${stats.numBarriers - stats.barriersOK} barrera(s) sin cumplir o pendientes`}
                </div>
                <div className="text-xs text-gray-500">
                  Objetivos de diseño NCRP 147/151: área controlada {P_CONTROLADA_mSv_semana} mSv/semana; no controlada {P_NO_CONTROLADA_mSv_semana} mSv/semana. {stats.pendientes} barrera(s) sin cálculo o sin espesor declarado.
                </div>
              </div>
            </div>

            {/* Module Status Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Estado de Calculos por Modulo
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Modulo</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Estado</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Barreras</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Norma</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">% Avance</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map(mod => {
                    const isActive = floorPlan.sources.some(s => {
                      const modId = s.modality?.id?.toLowerCase() || '';
                      return modId.includes(mod.id.split('_')[0]) || modId.includes(mod.id);
                    });
                    const relevantBarriers = floorPlan.barriers.filter(b => {
                      if (mod.id === 'linac_primary') return b.barrierType === 'primary';
                      if (mod.id === 'linac_secondary') return b.barrierType === 'secondary';
                      return true;
                    });
                    const count = relevantBarriers.length;
                    const calculated = relevantBarriers.filter(b => b.requiredThickness_mm !== undefined).length;
                    const progress = count > 0 ? Math.round((calculated / count) * 100) : isActive ? 0 : 0;

                    return (
                      <tr key={mod.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-3 py-2 text-xs">{mod.name}</td>
                        <td className="px-3 py-2">
                          <Badge variant={isActive ? "default" : "secondary"} className="text-[9px] h-4">
                            {isActive ? 'ACTIVO' : 'NO CONFIGURADO'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-mono">{count} ({calculated} calc)</td>
                        <td className="px-3 py-2 text-[10px] text-gray-500">{mod.norma}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] w-6 text-right">{progress}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                <div className="text-[10px] text-gray-500">Fuentes definidas</div>
                <div className="text-lg font-bold">{stats.numSources}</div>
              </div>
              <div className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                <div className="text-[10px] text-gray-500">Barreras definidas</div>
                <div className="text-lg font-bold">{stats.numBarriers}</div>
              </div>
              <div className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                <div className="text-[10px] text-gray-500">Con calculo</div>
                <div className="text-lg font-bold">{stats.numCalculated}</div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function KpiCard({ label, value, sub, status, icon }: {
  label: string; value: string; sub?: string; status: 'ok' | 'warning' | 'fail' | 'info'; icon: React.ReactNode;
}) {
  const colors = {
    ok: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    fail: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };
  return (
    <div className={`p-3 rounded-lg border ${colors[status]}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide opacity-70 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
      {sub && <div className="text-[10px] opacity-60">{sub}</div>}
    </div>
  );
}
