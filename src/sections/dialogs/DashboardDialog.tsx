// =============================================================================
// DashboardDialog - Dashboard ejecutivo con KPIs.
// F396 migra el fullscreen legacy a FullscreenShell controlado.
// Fase 9: los KPI y los módulos salen del plano del proyecto (lib/estadoProyecto); antes eran siete módulos con dosis y
// espesores fijos de demostración.
// =============================================================================
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import FullscreenShell from '@/components/FullscreenShell';
import { BarChart3, Shield, AlertTriangle, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { modulosDelPlano, resumenProyecto } from '@/lib/estadoProyecto';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }
interface KPICard { title: string; value: string; subtitle: string; status: 'ok' | 'warning' | 'critical'; icon: typeof Activity; color: string; }

export default function DashboardDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return <DashboardContent onOpenChange={onOpenChange} />;
}

function DashboardContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const floorPlan = useCanvasStore((s) => s.floorPlan);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const resumen = useMemo(() => resumenProyecto(floorPlan), [floorPlan]);
  const modulos = useMemo(() => modulosDelPlano(floorPlan), [floorPlan]);

  const completo = (m: (typeof modulos)[number]) => m.barreras > 0 && m.cumplen === m.barreras;
  const filteredModules = filter === 'all' ? modulos : modulos.filter((m) => (filter === 'completed' ? completo(m) : !completo(m)));
  const cards: KPICard[] = [
    { title: 'Fuentes', value: String(resumen.fuentes), subtitle: `${resumen.barreras} barreras en el plano`, status: resumen.fuentes > 0 ? 'ok' : 'warning', icon: Activity, color: 'blue' },
    { title: 'Barreras calculadas', value: `${resumen.calculadas}/${resumen.barreras}`, subtitle: 'Con espesor requerido del motor', status: resumen.barreras > 0 && resumen.calculadas === resumen.barreras ? 'ok' : 'warning', icon: Shield, color: 'emerald' },
    { title: 'No cumplen', value: String(resumen.noCumplen), subtitle: `${resumen.pendientes} pendientes (sin cálculo o sin espesor)`, status: resumen.noCumplen > 0 ? 'critical' : resumen.pendientes > 0 ? 'warning' : 'ok', icon: AlertTriangle, color: 'amber' },
    { title: 'Espesor requerido máx.', value: resumen.requeridoMax_mm === null ? '—' : `${(resumen.requeridoMax_mm / 10).toFixed(1)} cm`, subtitle: resumen.objetivoMax_mSv_semana === null ? 'Sin objetivo P' : `P máx. ${resumen.objetivoMax_mSv_semana} mSv/semana`, status: 'ok', icon: TrendingUp, color: 'violet' },
  ];
  const COL: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
  };

  return (
    <FullscreenShell
      title="Dashboard Ejecutivo"
      subtitle="Estado del proyecto: barreras, cálculo del motor y verificación"
      icon={<BarChart3 className="h-5 w-5" />}
      accentClassName="bg-indigo-600"
      traceId="f396-dashboard-fullscreen-shell"
      onClose={() => onOpenChange(false)}
      toolbar={<div className="flex gap-1">{(['all', 'completed', 'pending'] as const).map((f) => <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setFilter(f)}>{f === 'all' ? 'Todos' : f === 'completed' ? 'Completos' : 'Con pendientes'}</Button>)}</div>}
    >
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <p data-testid="dashboard-fuente" className="text-xs text-slate-600">
            Proyecto «{floorPlan.name}». Una barrera cumple sólo si su espesor instalado es mayor o igual al requerido que calculó
            el motor (NCRP 147/151, TG-108); las barreras sin cálculo o sin espesor instalado cuentan como pendientes.
          </p>
          {resumen.barreras === 0 ? (
            <div data-testid="dashboard-vacio" className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
              El plano no tiene barreras. Dibuje o importe el plano y ejecute el cálculo para ver el tablero.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4">
                {cards.map((c) => {
                  const Icon = c.icon;
                  return (
                    <Card key={c.title} className={COL[c.color]}>
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <Icon className="h-5 w-5" />
                          <Badge variant={c.status === 'ok' ? 'default' : c.status === 'warning' ? 'secondary' : 'destructive'} className="text-[10px]">{c.status === 'ok' ? 'OK' : c.status === 'warning' ? 'REVISAR' : '!'}</Badge>
                        </div>
                        <div className="text-2xl font-bold">{c.value}</div>
                        <div className="text-xs opacity-70">{c.subtitle}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">Barreras que cumplen</span>
                    <span data-testid="dashboard-cumplimiento" className="text-sm font-bold">{resumen.cumplimiento}%</span>
                  </div>
                  <Progress value={resumen.cumplimiento} className="h-3" />
                  <div className="mt-1 flex justify-between"><span className="text-xs text-slate-500">{resumen.cumplen} de {resumen.barreras}</span><span className="text-xs text-slate-500">Meta: 100 %</span></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Estado por modalidad calculada</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left text-xs">Módulo</th><th className="px-3 py-2 text-center text-xs">Estado</th><th className="px-3 py-2 text-center text-xs">Barreras</th><th className="px-3 py-2 text-center text-xs">Cumplen / no / pendientes</th><th className="px-3 py-2 text-center text-xs">Requerido máx. (mm)</th><th className="px-3 py-2 text-left text-xs">Normativa</th></tr></thead>
                      <tbody>
                        {filteredModules.map((m) => (
                          <tr key={m.clave} className="border-b hover:bg-slate-50">
                            <td className="px-3 py-2 text-xs font-medium">{m.nombre}</td>
                            <td className="px-3 py-2 text-center">{completo(m) ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <div className="mx-auto h-4 w-4 rounded-full border-2 border-amber-400" />}</td>
                            <td className="px-3 py-2 text-center text-xs">{m.barreras}</td>
                            <td className="px-3 py-2 text-center font-mono text-xs">{m.cumplen} / {m.noCumplen} / {m.pendientes}</td>
                            <td className="px-3 py-2 text-center font-mono text-xs">{m.requeridoMax_mm === null ? '—' : m.requeridoMax_mm.toFixed(0)}</td>
                            <td className="px-3 py-2 text-xs">{m.normas.join(', ') || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </FullscreenShell>
  );
}
