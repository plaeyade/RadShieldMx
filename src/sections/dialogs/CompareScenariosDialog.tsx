/**
 * CompareScenariosDialog - UI-01: comparacion side-by-side de escenarios.
 * F389 migra el dialog legacy a DialogShell para convivir con el canvas.
 */
import { useState } from 'react';
import { GitCompare, ArrowRight, AlertTriangle, CheckCircle, DollarSign, Shield, Ruler } from 'lucide-react';
import DialogShell from '@/components/DialogShell';

interface Scenario {
  name: string;
  sourceType: string;
  energy_kVp: number;
  workload_mA_min_week: number;
  fieldSize_cm2: number;
  distance_m: number;
  designGoal_uSv_week: number;
  barriers: Array<{ material: string; thickness_mm: number; cost_usd?: number }>;
  totalDose_uSv: number;
  totalCost_usd: number;
  passesGoal: boolean;
}

const DEFAULT_A: Scenario = {
  name: 'Escenario A - Baseline',
  sourceType: 'RX convencional',
  energy_kVp: 125,
  workload_mA_min_week: 500,
  fieldSize_cm2: 1000,
  distance_m: 2.5,
  designGoal_uSv_week: 100,
  barriers: [
    { material: 'Plomo', thickness_mm: 1.5, cost_usd: 450 },
    { material: 'Concreto', thickness_mm: 180, cost_usd: 320 },
  ],
  totalDose_uSv: 78,
  totalCost_usd: 770,
  passesGoal: true,
};

const DEFAULT_B: Scenario = {
  name: 'Escenario B - Optimizado',
  sourceType: 'RX convencional',
  energy_kVp: 125,
  workload_mA_min_week: 500,
  fieldSize_cm2: 1000,
  distance_m: 2.5,
  designGoal_uSv_week: 100,
  barriers: [
    { material: 'Plomo', thickness_mm: 2.0, cost_usd: 600 },
    { material: 'Concreto', thickness_mm: 120, cost_usd: 210 },
  ],
  totalDose_uSv: 52,
  totalCost_usd: 810,
  passesGoal: true,
};

function DiffBadge({ a, b, unit = '', lowerIsBetter = false }: { a: number; b: number; unit?: string; lowerIsBetter?: boolean }) {
  const delta = b - a;
  const pct = a !== 0 ? (delta / a) * 100 : 0;
  const isBetter = lowerIsBetter ? delta < 0 : delta > 0;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs ${isBetter ? 'bg-emerald-100 text-emerald-700' : delta === 0 ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
      {delta > 0 ? '+' : ''}{delta.toFixed(2)}{unit} ({delta > 0 ? '+' : ''}{pct.toFixed(1)}%)
      {delta !== 0 && (isBetter ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />)}
    </span>
  );
}

export default function CompareScenariosDialog({ onClose }: { onClose: () => void }) {
  const [scA] = useState<Scenario>(DEFAULT_A);
  const [scB] = useState<Scenario>(DEFAULT_B);

  const exportCSV = () => {
    const h = ['Parametro', 'Escenario_A', 'Escenario_B', 'Delta', 'Delta%'];
    const rows = [
      ['Nombre', scA.name, scB.name, '', ''],
      ['Fuente', scA.sourceType, scB.sourceType, '', ''],
      ['Energia (kVp)', String(scA.energy_kVp), String(scB.energy_kVp), String(scB.energy_kVp - scA.energy_kVp), ''],
      ['Carga (mA min/sem)', String(scA.workload_mA_min_week), String(scB.workload_mA_min_week), String(scB.workload_mA_min_week - scA.workload_mA_min_week), ''],
      ['Campo (cm2)', String(scA.fieldSize_cm2), String(scB.fieldSize_cm2), String(scB.fieldSize_cm2 - scA.fieldSize_cm2), ''],
      ['Distancia (m)', String(scA.distance_m), String(scB.distance_m), String(scB.distance_m - scA.distance_m), ''],
      ['Meta (uSv/sem)', String(scA.designGoal_uSv_week), String(scB.designGoal_uSv_week), String(scB.designGoal_uSv_week - scA.designGoal_uSv_week), ''],
      ['Dosis total (uSv/sem)', scA.totalDose_uSv.toFixed(2), scB.totalDose_uSv.toFixed(2), (scB.totalDose_uSv - scA.totalDose_uSv).toFixed(2), `${((scB.totalDose_uSv - scA.totalDose_uSv) / scA.totalDose_uSv * 100).toFixed(1)}%`],
      ['Costo total (USD)', scA.totalCost_usd.toFixed(2), scB.totalCost_usd.toFixed(2), (scB.totalCost_usd - scA.totalCost_usd).toFixed(2), `${((scB.totalCost_usd - scA.totalCost_usd) / scA.totalCost_usd * 100).toFixed(1)}%`],
    ];
    const csv = [h, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Compare_Scenarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Row = ({ label, a, b, icon: Icon, diff = true, lowerIsBetter = false, unit = '' }: any) => (
    <div className="grid grid-cols-3 items-center gap-2 border-b py-1.5 last:border-0">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600"><Icon className="h-3.5 w-3.5 text-slate-400" />{label}</div>
      <div className="rounded bg-slate-50 px-2 py-1 font-mono text-xs text-slate-800">{a}{unit}</div>
      <div className="rounded bg-slate-50 px-2 py-1 font-mono text-xs text-slate-800">{b}{unit}</div>
      {diff && <div className="col-span-3 flex justify-end"><DiffBadge a={parseFloat(a) || 0} b={parseFloat(b) || 0} unit={unit} lowerIsBetter={lowerIsBetter} /></div>}
    </div>
  );

  return (
    <DialogShell
      title="Comparacion de Escenarios"
      subtitle="Side-by-side con diferencias resaltadas - F389"
      gradientFrom="from-violet-600"
      gradientTo="to-purple-700"
      maxWidth="max-w-4xl"
      onClose={onClose}
      footer={(
        <>
          <span className="text-xs text-slate-500">Comparacion F389 - Editar escenarios en calculo principal</span>
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700">Exportar CSV</button>
        </>
      )}
    >
      <div data-testid="f389-compare-scenarios-dialogshell" className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-violet-900">
          <GitCompare className="h-5 w-5" />
          <div>
            <h2 id="compare-title" className="text-sm font-bold">Comparacion de Escenarios</h2>
            <p className="text-xs text-violet-700">Ventana movible para comparar sin perder de vista el canvas.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-xs font-semibold uppercase text-slate-500">Parametro</div>
          <div className="rounded bg-violet-50 px-2 py-1 text-center text-xs font-semibold uppercase text-violet-700">{scA.name}</div>
          <div className="rounded bg-purple-50 px-2 py-1 text-center text-xs font-semibold uppercase text-purple-700">{scB.name}</div>
        </div>

        <div className="rounded-lg border p-3">
          <Row label="Fuente" a={scA.sourceType} b={scB.sourceType} icon={Shield} diff={false} />
          <Row label="Energia" a={String(scA.energy_kVp)} b={String(scB.energy_kVp)} icon={ActivityIcon} unit=" kVp" />
          <Row label="Carga trabajo" a={String(scA.workload_mA_min_week)} b={String(scB.workload_mA_min_week)} icon={ActivityIcon} unit=" mA min/sem" />
          <Row label="Campo" a={String(scA.fieldSize_cm2)} b={String(scB.fieldSize_cm2)} icon={Ruler} unit=" cm2" />
          <Row label="Distancia" a={String(scA.distance_m)} b={String(scB.distance_m)} icon={Ruler} unit=" m" lowerIsBetter />
          <Row label="Meta diseno" a={String(scA.designGoal_uSv_week)} b={String(scB.designGoal_uSv_week)} icon={Shield} unit=" uSv/sem" lowerIsBetter />
        </div>

        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center gap-2 border-b bg-slate-50 px-3 py-2 text-sm font-semibold"><Shield className="h-4 w-4 text-slate-500" />Barreras</div>
          <div className="space-y-2 p-3">
            {scA.barriers.map((ba, i) => {
              const bb = scB.barriers[i];
              return (
                <div key={ba.material} className="grid grid-cols-3 items-center gap-2 rounded bg-slate-50 p-2">
                  <div className="text-xs font-medium">{ba.material}</div>
                  <div className="font-mono text-xs">{ba.thickness_mm} mm {ba.cost_usd ? `($${ba.cost_usd})` : ''}</div>
                  <div className="font-mono text-xs">{bb ? `${bb.thickness_mm} mm ${bb.cost_usd ? `($${bb.cost_usd})` : ''}` : '-'}</div>
                  {bb && <div className="col-span-3 flex justify-end"><DiffBadge a={ba.thickness_mm} b={bb.thickness_mm} unit=" mm" lowerIsBetter /><span className="ml-2"><DiffBadge a={ba.cost_usd || 0} b={bb.cost_usd || 0} unit=" USD" lowerIsBetter /></span></div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-lg border p-3 text-center ${scA.passesGoal ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            <div className="text-xs text-slate-500">Dosis total A</div>
            <div className="font-mono text-xl font-bold">{scA.totalDose_uSv.toFixed(1)} <span className="text-sm">uSv/sem</span></div>
            <div className="mt-1 text-xs">{scA.passesGoal ? <span className="flex items-center justify-center gap-1 text-emerald-600"><CheckCircle className="h-3 w-3" />Cumple meta</span> : <span className="flex items-center justify-center gap-1 text-red-600"><AlertTriangle className="h-3 w-3" />Excede meta</span>}</div>
          </div>
          <div className={`rounded-lg border p-3 text-center ${scB.passesGoal ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            <div className="text-xs text-slate-500">Dosis total B</div>
            <div className="font-mono text-xl font-bold">{scB.totalDose_uSv.toFixed(1)} <span className="text-sm">uSv/sem</span></div>
            <div className="mt-1 text-xs">{scB.passesGoal ? <span className="flex items-center justify-center gap-1 text-emerald-600"><CheckCircle className="h-3 w-3" />Cumple meta</span> : <span className="flex items-center justify-center gap-1 text-red-600"><AlertTriangle className="h-3 w-3" />Excede meta</span>}</div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-amber-50 p-3">
          <div className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-amber-600" /><span className="text-sm font-semibold text-amber-800">Comparacion de costos:</span></div>
          <div className="flex items-center gap-3">
            <span className="rounded bg-white px-2 py-1 font-mono text-xs">A: ${scA.totalCost_usd.toFixed(0)}</span>
            <ArrowRight className="h-4 w-4 text-amber-500" />
            <span className="rounded bg-white px-2 py-1 font-mono text-xs">B: ${scB.totalCost_usd.toFixed(0)}</span>
            <DiffBadge a={scA.totalCost_usd} b={scB.totalCost_usd} unit=" USD" lowerIsBetter />
          </div>
        </div>
      </div>
    </DialogShell>
  );
}

function ActivityIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
}
