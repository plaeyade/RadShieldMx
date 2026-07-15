/**
 * TherapyShieldingDialog — MC-11 UI: Blindaje para radiofarmacos terapeuticos
 * Y-90, Lu-177, Ac-225, Pb-212, I-131, Ra-223
 */
import { useState, useMemo } from 'react';
import { X, Pill, AlertTriangle, CheckCircle, Download, Shield } from 'lucide-react';
import { DEFAULT_THERAPY_TASKS, THERAPY_NUCLIDES, calculateTaskDose, getRoomSummary } from '@/lib/therapy/TherapeuticRadionuclideShielding';
import type { TherapyRoomTask } from '@/lib/therapy/TherapeuticRadionuclideShielding';

export default function TherapyShieldingDialog({ onClose }: { onClose: () => void }) {
  const [tasks, setTasks] = useState<TherapyRoomTask[]>(DEFAULT_THERAPY_TASKS);
  const [designLimit, setDesignLimit] = useState(100);
  const [showDetails, setShowDetails] = useState(false);

  const summary = useMemo(() => getRoomSummary(tasks, designLimit), [tasks, designLimit]);
  const results = summary.results;

  const updateTask = (i: number, f: keyof TherapyRoomTask, v: number) => setTasks(prev => prev.map((t, j) => j === i ? { ...t, [f]: v } : t));

  const exportCSV = () => {
    const h = ['Tarea', 'Nuclido', 'Act_MBq', 'Freq_sem', 'Dur_min', 'Dist_m', 'uSv_sem', 'mSv_ano', '%Limite'];
    const csv = [h, ...results.map(r => [r.task.name, r.nuclide.symbol, r.task.activity_MBq, r.task.frequency_perWeek, r.task.duration_min, r.task.distance_m, r.weeklyDose_uSv.toFixed(2), r.annualDose_mSv.toFixed(2), (r.fractionOfLimit * 100).toFixed(1)])]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Therapy_Shielding_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2" role="dialog" aria-modal="true" aria-labelledby="therapy-title">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-rose-600 to-pink-700 text-white rounded-t-lg">
          <div className="flex items-center gap-3"><Pill className="w-6 h-6" /><div><h2 id="therapy-title" className="text-lg font-bold">Therapy Radionuclide Shielding</h2><p className="text-xs text-rose-100">ICRP 128/140, AAPM TG 377 — v50</p></div></div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/20" aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2"><label className="text-[10px] font-medium text-slate-500">Meta diseño (uSv/sem)</label><input type="number" value={designLimit} onChange={e => setDesignLimit(Number(e.target.value))} className="w-full mt-1 text-xs p-1.5 border rounded" min={1} /></div>
            <div className="text-center p-2 bg-rose-50 rounded border"><div className="text-lg font-bold text-rose-700">{summary.totalAnnual_mSv.toFixed(1)}</div><div className="text-[10px] text-slate-500">mSv/ano total</div></div>
            <div className={`text-center p-2 rounded border ${summary.withinLimits ? 'bg-emerald-50' : 'bg-red-50'}`}><div className={`text-lg font-bold ${summary.withinLimits ? 'text-emerald-700' : 'text-red-700'}`}>{(summary.maxFraction * 100).toFixed(0)}%</div><div className="text-[10px] text-slate-500">del limite 20 mSv</div></div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b text-sm font-semibold">Tareas por Blindaje</div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="px-2 py-1.5 text-left">Tarea</th><th className="px-2 py-1.5">Nuclido</th><th className="px-2 py-1.5">Act</th><th className="px-2 py-1.5">Freq</th><th className="px-2 py-1.5">Dur</th><th className="px-2 py-1.5">uSv/sem</th><th className="px-2 py-1.5">mSv/ano</th><th className="px-2 py-1.5">%Lim</th></tr></thead>
              <tbody>{results.map((r, i) => (
                <tr key={i} className={`border-t ${r.shieldingRequired ? 'bg-red-50' : ''}`}>
                  <td className="px-2 py-1.5 font-medium">{r.task.name}</td>
                  <td className="px-2 py-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] ${r.nuclide.roomClass === 'H' ? 'bg-red-100 text-red-700' : r.nuclide.roomClass === 'M' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.nuclide.symbol}</span></td>
                  <td className="px-2 py-1.5"><input type="number" value={r.task.activity_MBq} onChange={e => updateTask(i, 'activity_MBq', Number(e.target.value))} className="w-14 text-center border rounded p-0.5" min={0} /></td>
                  <td className="px-2 py-1.5"><input type="number" value={r.task.frequency_perWeek} onChange={e => updateTask(i, 'frequency_perWeek', Number(e.target.value))} className="w-10 text-center border rounded p-0.5" min={0} /></td>
                  <td className="px-2 py-1.5">{r.task.duration_min}min</td>
                  <td className={`px-2 py-1.5 text-right font-mono ${r.shieldingRequired ? 'text-red-700 font-bold' : ''}`}>{r.weeklyDose_uSv.toFixed(1)}</td>
                  <td className="px-2 py-1.5 text-right font-mono">{r.annualDose_mSv.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-right font-mono">{(r.fractionOfLimit * 100).toFixed(0)}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <button onClick={() => setShowDetails(!showDetails)} className="text-xs text-rose-600 hover:underline">{showDetails ? 'Ocultar' : 'Ver'} propiedades de nuclidos terapeuticos</button>
          {showDetails && (
            <div className="border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b text-sm font-semibold">Propiedades de Nuclidos</div>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600"><tr><th className="px-2 py-1.5">Nuclido</th><th className="px-2 py-1.5">T1/2 (h)</th><th className="px-2 py-1.5">Γ (uSv·m²/GBq·h)</th><th className="px-2 py-1.5">TVL Pb (mm)</th><th className="px-2 py-1.5">TVL Conc (mm)</th><th className="px-2 py-1.5">Clase</th></tr></thead>
                <tbody>{THERAPY_NUCLIDES.map((n, i) => (
                  <tr key={i} className="border-t"><td className="px-2 py-1.5 font-medium">{n.name}</td><td className="px-2 py-1.5 font-mono">{n.halfLife_h}</td><td className="px-2 py-1.5 font-mono">{n.gammaConstant_uSvm2perGBqh}</td><td className="px-2 py-1.5 font-mono">{n.tenthValueLead_mm}</td><td className="px-2 py-1.5 font-mono">{n.tenthValueConcrete_mm}</td>
                    <td className="px-2 py-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] ${n.roomClass === 'H' ? 'bg-red-100 text-red-700' : n.roomClass === 'M' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{n.roomClass}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex justify-between px-5 py-3 border-t bg-slate-50 rounded-b-lg"><span className="text-xs text-slate-500">Therapy Shielding v50</span><button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-medium hover:bg-rose-700"><Download className="w-3.5 h-3.5" />Exportar CSV</button></div>
      </div>
    </div>
  );
}
