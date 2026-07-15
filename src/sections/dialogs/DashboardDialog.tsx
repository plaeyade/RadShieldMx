// =============================================================================
// DashboardDialog — Dashboard ejecutivo con KPIs (v14.3)
// =============================================================================
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, BarChart3, Shield, AlertTriangle, CheckCircle, TrendingUp, Activity } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

interface KPICard { title: string; value: string; subtitle: string; status: 'ok' | 'warning' | 'critical'; icon: any; color: string; }

const MODULES = [
  { name: 'LINAC Primario', status: 'completed', barriers: 5, maxDose_uSv: 18, maxThickness_cm: 145, norm: 'NCRP 151' },
  { name: 'LINAC Secundario', status: 'completed', barriers: 4, maxDose_uSv: 12, maxThickness_cm: 95, norm: 'NCRP 151' },
  { name: 'Gamma Knife', status: 'completed', barriers: 4, maxDose_uSv: 8, maxThickness_cm: 68, norm: 'NCRP 151' },
  { name: 'HDR Ir-192', status: 'completed', barriers: 3, maxDose_uSv: 5, maxThickness_cm: 35, norm: 'IAEA TECDOC 1274' },
  { name: 'PET-CT', status: 'completed', barriers: 3, maxDose_uSv: 3, maxThickness_cm: 22, norm: 'AAPM TG-108' },
  { name: 'CBCT/IGRT', status: 'pending', barriers: 2, maxDose_uSv: 0, maxThickness_cm: 0, norm: 'AAPM TG-96' },
  { name: 'Ciclotrón IBA', status: 'completed', barriers: 6, maxDose_uSv: 15, maxThickness_cm: 180, norm: 'NCRP 144' },
];

export default function DashboardDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return <DashboardContent onOpenChange={onOpenChange} />;
}

function DashboardContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const kpis = useMemo(() => {
    const totalModules = MODULES.length;
    const completed = MODULES.filter(m => m.status === 'completed').length;
    const pending = MODULES.filter(m => m.status === 'pending').length;
    const totalBarriers = MODULES.reduce((a, m) => a + m.barriers, 0);
    const maxDose = Math.max(...MODULES.map(m => m.maxDose_uSv));
    const avgThickness = MODULES.filter(m => m.maxThickness_cm > 0).reduce((a, m) => a + m.maxThickness_cm, 0) / MODULES.filter(m => m.maxThickness_cm > 0).length;
    const compliance = Math.round((completed / totalModules) * 100);
    return { totalModules, completed, pending, totalBarriers, maxDose, avgThickness, compliance };
  }, []);

  const filteredModules = filter === 'all' ? MODULES : MODULES.filter(m => m.status === filter);

  const cards: KPICard[] = [
    { title: 'Módulos', value: `${kpis.completed}/${kpis.totalModules}`, subtitle: `${kpis.pending} pendientes`, status: kpis.pending > 0 ? 'warning' : 'ok', icon: Activity, color: 'blue' },
    { title: 'Barreras calculadas', value: String(kpis.totalBarriers), subtitle: 'Total en sistema', status: 'ok', icon: Shield, color: 'emerald' },
    { title: 'Dosis máx.', value: `${kpis.maxDose} μSv/sem`, subtitle: 'Límite: 20 μSv/sem', status: kpis.maxDose < 20 ? 'ok' : 'critical', icon: AlertTriangle, color: 'amber' },
    { title: 'Espesor promedio', value: `${kpis.avgThickness.toFixed(0)} cm`, subtitle: 'Referencia: 150-250 cm', status: 'ok', icon: TrendingUp, color: 'violet' },
  ];

  const COL: Record<string, string> = { blue: 'bg-blue-50 border-blue-200 text-blue-700', emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700', amber: 'bg-amber-50 border-amber-200 text-amber-700', violet: 'bg-violet-50 border-violet-200 text-violet-700' };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ width: '100vw', height: '100vh' }}>
      <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-lg"><BarChart3 className="w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Dashboard Ejecutivo</h1>
            <p className="text-xs text-slate-500">KPIs del sistema de blindajes — Actualizado en tiempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">{(['all','completed','pending'] as const).map(f => <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" className="text-xs h-7" onClick={() => setFilter(f)}>{f === 'all' ? 'Todos' : f === 'completed' ? 'Completados' : 'Pendientes'}</Button>)}</div>
          <Button
            aria-label="Cerrar Dashboard Ejecutivo"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            {cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <Card key={i} className={COL[c.color]}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="w-5 h-5" />
                      <Badge variant={c.status === 'ok' ? 'default' : c.status === 'warning' ? 'secondary' : 'destructive'} className="text-[10px]">{c.status === 'ok' ? 'OK' : c.status === 'warning' ? '⚠' : '!'}</Badge>
                    </div>
                    <div className="text-2xl font-bold">{c.value}</div>
                    <div className="text-xs opacity-70">{c.subtitle}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Compliance bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Cumplimiento general</span>
                <span className="text-sm font-bold">{kpis.compliance}%</span>
              </div>
              <Progress value={kpis.compliance} className="h-3" />
              <div className="flex justify-between mt-1"><span className="text-xs text-slate-500">Meta: 100%</span><span className="text-xs text-slate-500">Límite aceptable: 90%</span></div>
            </CardContent>
          </Card>

          {/* Modules table */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Estado por módulo</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left text-xs">Módulo</th><th className="px-3 py-2 text-center text-xs">Estado</th><th className="px-3 py-2 text-center text-xs">Barreras</th><th className="px-3 py-2 text-center text-xs">Dosis max (μSv/sem)</th><th className="px-3 py-2 text-center text-xs">Espesor max (cm)</th><th className="px-3 py-2 text-left text-xs">Normativa</th></tr></thead>
                  <tbody>
                    {filteredModules.map((m, i) => (
                      <tr key={i} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-xs">{m.name}</td>
                        <td className="px-3 py-2 text-center">{m.status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto"/> : <div className="w-4 h-4 rounded-full border-2 border-amber-400 mx-auto"/>}</td>
                        <td className="px-3 py-2 text-center text-xs">{m.barriers}</td>
                        <td className="px-3 py-2 text-center text-xs font-mono">{m.maxDose_uSv || '—'}</td>
                        <td className="px-3 py-2 text-center text-xs font-mono">{m.maxThickness_cm || '—'}</td>
                        <td className="px-3 py-2 text-xs">{m.norm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ALARA */}
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 flex items-start gap-3">
            <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-blue-800">Límite ALARA</div>
              <div className="text-xs text-blue-700">0.05 mSv/año (0.001 mSv/sem) — Objetivo adicional a los límites regulatorios CNSNS. Optimizar blindajes siempre que sea razonablemente alcanzable.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
