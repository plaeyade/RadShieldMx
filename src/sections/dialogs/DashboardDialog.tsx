// =============================================================================
// DashboardDialog - Dashboard ejecutivo con KPIs.
// F396 migra el fullscreen legacy a FullscreenShell controlado.
// =============================================================================
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import FullscreenShell from '@/components/FullscreenShell';
import { BarChart3, Shield, AlertTriangle, CheckCircle, TrendingUp, Activity } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }
interface KPICard { title: string; value: string; subtitle: string; status: 'ok' | 'warning' | 'critical'; icon: any; color: string; }

const MODULES = [
  { name: 'LINAC Primario', status: 'completed', barriers: 5, maxDose_uSv: 18, maxThickness_cm: 145, norm: 'NCRP 151' },
  { name: 'LINAC Secundario', status: 'completed', barriers: 4, maxDose_uSv: 12, maxThickness_cm: 95, norm: 'NCRP 151' },
  { name: 'Gamma Knife', status: 'completed', barriers: 4, maxDose_uSv: 8, maxThickness_cm: 68, norm: 'NCRP 151' },
  { name: 'HDR Ir-192', status: 'completed', barriers: 3, maxDose_uSv: 5, maxThickness_cm: 35, norm: 'IAEA TECDOC 1274' },
  { name: 'PET-CT', status: 'completed', barriers: 3, maxDose_uSv: 3, maxThickness_cm: 22, norm: 'AAPM TG-108' },
  { name: 'CBCT/IGRT', status: 'pending', barriers: 2, maxDose_uSv: 0, maxThickness_cm: 0, norm: 'AAPM TG-96' },
  { name: 'Ciclotron IBA', status: 'completed', barriers: 6, maxDose_uSv: 15, maxThickness_cm: 180, norm: 'NCRP 144' },
];

export default function DashboardDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return <DashboardContent onOpenChange={onOpenChange} />;
}

function DashboardContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const kpis = useMemo(() => {
    const totalModules = MODULES.length;
    const completed = MODULES.filter((m) => m.status === 'completed').length;
    const pending = MODULES.filter((m) => m.status === 'pending').length;
    const totalBarriers = MODULES.reduce((a, m) => a + m.barriers, 0);
    const maxDose = Math.max(...MODULES.map((m) => m.maxDose_uSv));
    const completeWithThickness = MODULES.filter((m) => m.maxThickness_cm > 0);
    const avgThickness = completeWithThickness.reduce((a, m) => a + m.maxThickness_cm, 0) / completeWithThickness.length;
    const compliance = Math.round((completed / totalModules) * 100);
    return { totalModules, completed, pending, totalBarriers, maxDose, avgThickness, compliance };
  }, []);

  const filteredModules = filter === 'all' ? MODULES : MODULES.filter((m) => m.status === filter);
  const cards: KPICard[] = [
    { title: 'Modulos', value: `${kpis.completed}/${kpis.totalModules}`, subtitle: `${kpis.pending} pendientes`, status: kpis.pending > 0 ? 'warning' : 'ok', icon: Activity, color: 'blue' },
    { title: 'Barreras calculadas', value: String(kpis.totalBarriers), subtitle: 'Total en sistema', status: 'ok', icon: Shield, color: 'emerald' },
    { title: 'Dosis max.', value: `${kpis.maxDose} uSv/sem`, subtitle: 'Limite: 20 uSv/sem', status: kpis.maxDose < 20 ? 'ok' : 'critical', icon: AlertTriangle, color: 'amber' },
    { title: 'Espesor promedio', value: `${kpis.avgThickness.toFixed(0)} cm`, subtitle: 'Referencia: 150-250 cm', status: 'ok', icon: TrendingUp, color: 'violet' },
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
      subtitle="KPIs del sistema de blindajes - actualizado en tiempo real - F396"
      icon={<BarChart3 className="h-5 w-5" />}
      accentClassName="bg-indigo-600"
      traceId="f396-dashboard-fullscreen-shell"
      onClose={() => onOpenChange(false)}
      toolbar={<div className="flex gap-1">{(['all', 'completed', 'pending'] as const).map((f) => <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setFilter(f)}>{f === 'all' ? 'Todos' : f === 'completed' ? 'Completados' : 'Pendientes'}</Button>)}</div>}
    >
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.title} className={COL[c.color]}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <Icon className="h-5 w-5" />
                      <Badge variant={c.status === 'ok' ? 'default' : c.status === 'warning' ? 'secondary' : 'destructive'} className="text-[10px]">{c.status === 'ok' ? 'OK' : c.status === 'warning' ? 'WARN' : '!'}</Badge>
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
                <span className="text-sm font-semibold">Cumplimiento general</span>
                <span className="text-sm font-bold">{kpis.compliance}%</span>
              </div>
              <Progress value={kpis.compliance} className="h-3" />
              <div className="mt-1 flex justify-between"><span className="text-xs text-slate-500">Meta: 100%</span><span className="text-xs text-slate-500">Limite aceptable: 90%</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Estado por modulo</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left text-xs">Modulo</th><th className="px-3 py-2 text-center text-xs">Estado</th><th className="px-3 py-2 text-center text-xs">Barreras</th><th className="px-3 py-2 text-center text-xs">Dosis max (uSv/sem)</th><th className="px-3 py-2 text-center text-xs">Espesor max (cm)</th><th className="px-3 py-2 text-left text-xs">Normativa</th></tr></thead>
                  <tbody>
                    {filteredModules.map((m) => (
                      <tr key={m.name} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-2 text-xs font-medium">{m.name}</td>
                        <td className="px-3 py-2 text-center">{m.status === 'completed' ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <div className="mx-auto h-4 w-4 rounded-full border-2 border-amber-400" />}</td>
                        <td className="px-3 py-2 text-center text-xs">{m.barriers}</td>
                        <td className="px-3 py-2 text-center font-mono text-xs">{m.maxDose_uSv || '-'}</td>
                        <td className="px-3 py-2 text-center font-mono text-xs">{m.maxThickness_cm || '-'}</td>
                        <td className="px-3 py-2 text-xs">{m.norm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4">
            <Activity className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <div className="text-sm font-semibold text-blue-800">Limite ALARA</div>
              <div className="text-xs text-blue-700">0.05 mSv/ano (0.001 mSv/sem). Objetivo adicional a los limites regulatorios CNSNS. Optimizar blindajes siempre que sea razonablemente alcanzable.</div>
            </div>
          </div>
        </div>
      </div>
    </FullscreenShell>
  );
}
