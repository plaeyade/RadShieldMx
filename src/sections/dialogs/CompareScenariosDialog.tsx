/**
 * CompareScenariosDialog — UI-01: Comparacion side-by-side de escenarios
 * Permite comparar dos escenarios de blindaje lado a lado con:
 * diferencias resaltadas, delta de espesor, delta de costo, vista sincronizada.
 */
import { useState } from 'react';
import { X, GitCompare, ArrowRight, AlertTriangle, CheckCircle, DollarSign, Shield, Ruler } from 'lucide-react';

interface Scenario {
  name: string; sourceType: string; energy_kVp: number; workload_mA_min_week: number;
  fieldSize_cm2: number; distance_m: number; designGoal_uSv_week: number;
  barriers: Array<{ material: string; thickness_mm: number; cost_usd?: number }>;
  totalDose_uSv: number; totalCost_usd: number; passesGoal: boolean;
}

const DEFAULT_A: Scenario = {
  name: 'Escenario A — Baseline', sourceType: 'RX convencional', energy_kVp: 125, workload_mA_min_week: 500,
  fieldSize_cm2: 1000, distance_m: 2.5, designGoal_uSv_week: 100,
  barriers: [{ material: 'Plomo', thickness_mm: 1.5, cost_usd: 450 }, { material: 'Concreto', thickness_mm: 180, cost_usd: 320 }],
  totalDose_uSv: 78, totalCost_usd: 770, passesGoal: true,
};

const DEFAULT_B: Scenario = {
  name: 'Escenario B — Optimizado', sourceType: 'RX convencional', energy_kVp: 125, workload_mA_min_week: 500,
  fieldSize_cm2: 1000, distance_m: 2.5, designGoal_uSv_week: 100,
  barriers: [{ material: 'Plomo', thickness_mm: 2.0, cost_usd: 600 }, { material: 'Concreto', thickness_mm: 120, cost_usd: 210 }],
  totalDose_uSv: 52, totalCost_usd: 810, passesGoal: true,
};

function DiffBadge({ a, b, unit = '', lowerIsBetter = false }: { a: number; b: number; unit?: string; lowerIsBetter?: boolean }) {
  const delta = b - a;
  const pct = a !== 0 ? (delta / a) * 100 : 0;
  const isBetter = lowerIsBetter ? delta < 0 : delta > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded ${isBetter ? 'bg-emerald-100 text-emerald-700' : delta === 0 ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
      {delta > 0 ? '+' : ''}{delta.toFixed(2)}{unit} ({delta > 0 ? '+' : ''}{pct.toFixed(1)}%)
      {delta !== 0 && (isBetter ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />)}
    </span>
  );
}

export default function CompareScenariosDialog({ onClose }: { onClose: () => void }) {
  const [scA, setScA] = useState<Scenario>(DEFAULT_A);
  const [scB, setScB] = useState<Scenario>(DEFAULT_B);

  const exportCSV = () => {
    const h = ['Parametro', 'Escenario_A', 'Escenario_B', 'Delta', 'Delta%'];
    const rows = [
      ['Nombre', scA.name, scB.name, '', ''],
      ['Fuente', scA.sourceType, scB.sourceType, '', ''],
      ['Energia (kVp)', String(scA.energy_kVp), String(scB.energy_kVp), String(scB.energy_kVp - scA.energy_kVp), ''],
      ['Carga (mA·min/sem)', String(scA.workload_mA_min_week), String(scB.workload_mA_min_week), String(scB.workload_mA_min_week - scA.workload_mA_min_week), ''],
      ['Campo (cm2)', String(scA.fieldSize_cm2), String(scB.fieldSize_cm2), String(scB.fieldSize_cm2 - scA.fieldSize_cm2), ''],
      ['Distancia (m)', String(scA.distance_m), String(scB.distance_m), String(scB.distance_m - scA.distance_m), ''],
      ['Meta (uSv/sem)', String(scA.designGoal_uSv_week), String(scB.designGoal_uSv_week), String(scB.designGoal_uSv_week - scA.designGoal_uSv_week), ''],
      ['Dosis total (uSv/sem)', scA.totalDose_uSv.toFixed(2), scB.totalDose_uSv.toFixed(2), (scB.totalDose_uSv - scA.totalDose_uSv).toFixed(2), ((scB.totalDose_uSv - scA.totalDose_uSv) / scA.totalDose_uSv * 100).toFixed(1) + '%'],
      ['Costo total (USD)', scA.totalCost_usd.toFixed(2), scB.totalCost_usd.toFixed(2), (scB.totalCost_usd - scA.totalCost_usd).toFixed(2), ((scB.totalCost_usd - scA.totalCost_usd) / scA.totalCost_usd * 100).toFixed(1) + '%'],
    ];
    const csv = [h, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Compare_Scenarios_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const Row = ({ label, a, b, icon: Icon, diff = true, lowerIsBetter = false, unit = '' }: any) => (
    <div className="grid grid-cols-3 gap-2 items-center py-1.5 border-b last:border-0">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600"><Icon className="w-3.5 h-3.5 text-slate-400" />{label}</div>
      <div className="text-xs font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded">{a}{unit}</div>
      <div className="text-xs font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded">{b}{unit}</div>
      {diff && <div className="col-span-3 flex justify-end"><DiffBadge a={parseFloat(a) || 0} b={parseFloat(b) || 0} unit={unit} lowerIsBetter={lowerIsBetter} /></div>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2" role="dialog" aria-modal="true" aria-labelledby="compare-title">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-t-lg">
          <div className="flex items-center gap-3"><GitCompare className="w-6 h-6" /><div><h2 id="compare-title" className="text-lg font-bold">Comparacion de Escenarios</h2><p className="text-xs text-violet-100">Side-by-side con diferencias resaltadas — v50</p></div></div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/20" aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-xs font-semibold text-slate-500 uppercase">Parametro</div>
            <div className="text-xs font-semibold text-violet-700 uppercase bg-violet-50 px-2 py-1 rounded text-center">{scA.name}</div>
            <div className="text-xs font-semibold text-purple-700 uppercase bg-purple-50 px-2 py-1 rounded text-center">{scB.name}</div>
          </div>

          {/* Parameters */}
          <div className="border rounded-lg p-3">
            <Row label="Fuente" a={scA.sourceType} b={scB.sourceType} icon={Shield} diff={false} />
            <Row label="Energia" a={String(scA.energy_kVp)} b={String(scB.energy_kVp)} icon={ActivityIcon} unit=" kVp" />
            <Row label="Carga trabajo" a={String(scA.workload_mA_min_week)} b={String(scB.workload_mA_min_week)} icon={ActivityIcon} unit=" mA·min/sem" />
            <Row label="Campo" a={String(scA.fieldSize_cm2)} b={String(scB.fieldSize_cm2)} icon={Ruler} unit=" cm²" />
            <Row label="Distancia" a={String(scA.distance_m)} b={String(scB.distance_m)} icon={Ruler} unit=" m" lowerIsBetter />
            <Row label="Meta diseño" a={String(scA.designGoal_uSv_week)} b={String(scB.designGoal_uSv_week)} icon={Shield} unit=" uSv/sem" lowerIsBetter />
          </div>

          {/* Barriers comparison */}
          <div className="border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-slate-500" />Barreras</div>
            <div className="p-3 space-y-2">
              {scA.barriers.map((ba, i) => {
                const bb = scB.barriers[i];
                return (
                  <div key={i} className="grid grid-cols-3 gap-2 items-center p-2 bg-slate-50 rounded">
                    <div className="text-xs font-medium">{ba.material}</div>
                    <div className="text-xs font-mono">{ba.thickness_mm} mm {ba.cost_usd ? `($${ba.cost_usd})` : ''}</div>
                    <div className="text-xs font-mono">{bb ? `${bb.thickness_mm} mm ${bb.cost_usd ? `($${bb.cost_usd})` : ''}` : '—'}</div>
                    {bb && <div className="col-span-3 flex justify-end"><DiffBadge a={ba.thickness_mm} b={bb.thickness_mm} unit=" mm" lowerIsBetter /><span className="ml-2"><DiffBadge a={ba.cost_usd || 0} b={bb.cost_usd || 0} unit=" USD" lowerIsBetter /></span></div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border text-center ${scA.passesGoal ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-xs text-slate-500">Dosis total A</div><div className="text-xl font-bold font-mono">{scA.totalDose_uSv.toFixed(1)} <span className="text-sm">uSv/sem</span></div>
              <div className="text-xs mt-1">{scA.passesGoal ? <span className="text-emerald-600 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" />Cumple meta</span> : <span className="text-red-600 flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3" />Excede meta</span>}</div>
            </div>
            <div className={`p-3 rounded-lg border text-center ${scB.passesGoal ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-xs text-slate-500">Dosis total B</div><div className="text-xl font-bold font-mono">{scB.totalDose_uSv.toFixed(1)} <span className="text-sm">uSv/sem</span></div>
              <div className="text-xs mt-1">{scB.passesGoal ? <span className="text-emerald-600 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" />Cumple meta</span> : <span className="text-red-600 flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3" />Excede meta</span>}</div>
            </div>
          </div>

          {/* Cost summary */}
          <div className="p-3 bg-amber-50 rounded-lg border flex items-center justify-between">
            <div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-amber-600" /><span className="text-sm font-semibold text-amber-800">Comparacion de costos:</span></div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono bg-white px-2 py-1 rounded">A: ${scA.totalCost_usd.toFixed(0)}</span>
              <ArrowRight className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-mono bg-white px-2 py-1 rounded">B: ${scB.totalCost_usd.toFixed(0)}</span>
              <DiffBadge a={scA.totalCost_usd} b={scB.totalCost_usd} unit=" USD" lowerIsBetter />
            </div>
          </div>
        </div>

        <div className="flex justify-between px-5 py-3 border-t bg-slate-50 rounded-b-lg">
          <span className="text-xs text-slate-500">Comparacion v50 — Editar escenarios en calculo principal</span>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-violet-600 text-white text-xs font-medium hover:bg-violet-700">Exportar CSV</button>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>; }
