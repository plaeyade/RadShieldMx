/**
 * IPEMReport109Dialog — MC-02 UI: SPECT Shielding Calculator
 * IPEM Report 109 (2014) — SPECT and SPECT/CT room shielding.
 */
import { useState, useMemo } from 'react';
import { X, Activity, Table, Download } from 'lucide-react';
import { DEFAULT_SPECT_PROCEDURES, calculateSPECTShielding } from '@/lib/spect/IPEMReport109';
import type { SPECTProcedure } from '@/lib/spect/IPEMReport109';

export default function IPEMReport109Dialog({ onClose }: { onClose: () => void }) {
  const [procedures, setProcedures] = useState<SPECTProcedure[]>(DEFAULT_SPECT_PROCEDURES);
  const [distance_m, setDistance_m] = useState(2.0);
  const [wallThick_mm, setWallThick_mm] = useState(50);
  const [wallMaterial, setWallMaterial] = useState<'lead' | 'concrete' | 'gypsum'>('lead');
  const [designGoal, setDesignGoal] = useState(100);

  const results = useMemo(() => procedures.map(p => calculateSPECTShielding({ procedure: p, distance_m, wallThickness_mm: wallThick_mm, wallMaterial, designGoal_uSv_week: designGoal })), [procedures, distance_m, wallThick_mm, wallMaterial, designGoal]);
  const totalKerma = results.reduce((s, r) => s + r.weeklyKerma_uSv, 0);
  const totalShielded = results.reduce((s, r) => s + r.shieldedKerma_uSv, 0);

  const updateProc = (i: number, f: keyof SPECTProcedure, v: number) => setProcedures(prev => prev.map((p, j) => j === i ? { ...p, [f]: v } : p));

  const exportCSV = () => {
    const h = ['Procedimiento', 'Radionuclido', 'Pac/sem', 'Act_MBq', 'Kerma_sin_uSv', 'Kerma_con_uSv', 'Pb_req_mm', 'Cumple'];
    const csv = [h, ...results.map((r, i) => [procedures[i].name, procedures[i].radionuclide, procedures[i].patientsPerWeek, procedures[i].avgAdminActivity_MBQ, r.weeklyKerma_uSv.toFixed(2), r.shieldedKerma_uSv.toFixed(2), r.requiredLead_mm.toFixed(1), r.withinGoal ? 'SI' : 'NO'])]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `IPEM109_SPECT_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2" role="dialog" aria-modal="true" aria-labelledby="ipem-title">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center gap-3"><Activity className="w-6 h-6" /><div><h2 id="ipem-title" className="text-lg font-bold">IPEM Report 109 — SPECT Shielding</h2><p className="text-xs text-indigo-100">Institute of Physics and Engineering in Medicine, 2014 — v50</p></div></div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/20" aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border">
            <div><label className="text-[10px] font-medium text-slate-500">Distancia (m)</label><input type="number" value={distance_m} onChange={e => setDistance_m(Number(e.target.value))} className="w-full mt-1 text-xs p-1.5 border rounded" step={0.1} min={0.5} /></div>
            <div><label className="text-[10px] font-medium text-slate-500">Espesor pared (mm)</label><input type="number" value={wallThick_mm} onChange={e => setWallThick_mm(Number(e.target.value))} className="w-full mt-1 text-xs p-1.5 border rounded" min={0} /></div>
            <div><label className="text-[10px] font-medium text-slate-500">Material</label><select value={wallMaterial} onChange={e => setWallMaterial(e.target.value as any)} className="w-full mt-1 text-xs p-1.5 border rounded"><option value="lead">Plomo</option><option value="concrete">Concreto</option><option value="gypsum">Yeso</option></select></div>
            <div><label className="text-[10px] font-medium text-slate-500">Meta diseño (uSv/sem)</label><input type="number" value={designGoal} onChange={e => setDesignGoal(Number(e.target.value))} className="w-full mt-1 text-xs p-1.5 border rounded" min={1} /></div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-indigo-50 rounded border"><div className="text-lg font-bold text-indigo-700">{procedures.reduce((s, p) => s + p.patientsPerWeek, 0)}</div><div className="text-[10px] text-slate-500">Pac/sem</div></div>
            <div className="text-center p-2 bg-orange-50 rounded border"><div className="text-lg font-bold text-orange-700">{totalKerma.toFixed(1)}</div><div className="text-[10px] text-slate-500">uSv/sem sin blind</div></div>
            <div className={`text-center p-2 rounded border ${totalShielded <= designGoal ? 'bg-emerald-50' : 'bg-red-50'}`}><div className={`text-lg font-bold ${totalShielded <= designGoal ? 'text-emerald-700' : 'text-red-700'}`}>{totalShielded.toFixed(1)}</div><div className="text-[10px] text-slate-500">uSv/sem con blind</div></div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b text-sm font-semibold flex items-center gap-2"><Table className="w-4 h-4" />Procedimientos SPECT</div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="px-2 py-1.5 text-left">Procedimiento</th><th className="px-2 py-1.5">Nuclido</th><th className="px-2 py-1.5">Pac/sem</th><th className="px-2 py-1.5">Act (MBq)</th><th className="px-2 py-1.5">Sin blind</th><th className="px-2 py-1.5">Con blind</th><th className="px-2 py-1.5">Pb req</th></tr></thead>
              <tbody>{results.map((r, i) => (
                <tr key={i} className={`border-t ${!r.withinGoal ? 'bg-red-50' : ''}`}>
                  <td className="px-2 py-1.5 font-medium">{procedures[i].name}</td>
                  <td className="px-2 py-1.5"><span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px]">{procedures[i].radionuclide}</span></td>
                  <td className="px-2 py-1.5"><input type="number" value={procedures[i].patientsPerWeek} onChange={e => updateProc(i, 'patientsPerWeek', Number(e.target.value))} className="w-12 text-center border rounded p-0.5" min={0} /></td>
                  <td className="px-2 py-1.5"><input type="number" value={procedures[i].avgAdminActivity_MBQ} onChange={e => updateProc(i, 'avgAdminActivity_MBQ', Number(e.target.value))} className="w-14 text-center border rounded p-0.5" min={0} /></td>
                  <td className="px-2 py-1.5 text-right font-mono">{r.weeklyKerma_uSv.toFixed(1)}</td>
                  <td className={`px-2 py-1.5 text-right font-mono font-bold ${r.withinGoal ? 'text-emerald-700' : 'text-red-700'}`}>{r.shieldedKerma_uSv.toFixed(1)}</td>
                  <td className="px-2 py-1.5 text-right font-mono">{r.requiredLead_mm.toFixed(1)} mm</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div className="p-3 bg-indigo-50 rounded-lg border text-xs space-y-1">
            <p className="font-semibold text-indigo-800">Referencia IPEM Report 109:</p>
            <p>• Kerma = N_pacientes × A_admin(GBq) × Γ(uSv·m²/GBq·h) × t_imaging(h) / d²(m²)</p>
            <p>• Tc-99m Γ=0.0593 | Tl-201 Γ=0.0364 | I-123 Γ=0.0583 | I-131 Γ=0.0595 | Ga-67 Γ=0.0215</p>
            <p>• TVL Tc-99m: Pb=0.25mm, Concrete=22mm | I-131: Pb=3.0mm, Concrete=170mm</p>
          </div>
        </div>
        <div className="flex justify-between px-5 py-3 border-t bg-slate-50 rounded-b-lg"><span className="text-xs text-slate-500">IPEM 109 v50</span><button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"><Download className="w-3.5 h-3.5" />Exportar CSV</button></div>
      </div>
    </div>
  );
}
