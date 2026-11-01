/**
 * AAPMTG108PETDialog — MC-01: AAPM TG 108 PET Shielding Calculator
 * Calculador dedicado AAPM TG 108 con kerma semanal por procedimiento,
 * atenuacion pared, consideracion CT component, tablas anexas.
 * Referencia: AAPM TG 108, Med Phys 33(1):1-16, 2006
 */
import { useState, useMemo } from 'react';
import { X, Activity, Table, FileDown } from 'lucide-react';
import { buildF172AResearchMethodology } from '@/lib/f172aArxivResearchMethodology';

interface PETProcedure { name: string; patientsPerWeek: number; avgAdminActivity_MBQ: number; avgScanTime_min: number; ctScans: number; }

const DEFAULT_PROCEDURES: PETProcedure[] = [
  { name: 'FDG oncologico (cuerpo completo)', patientsPerWeek: 20, avgAdminActivity_MBQ: 370, avgScanTime_min: 20, ctScans: 1 },
  { name: 'FDG neurologico (cerebro)', patientsPerWeek: 5, avgAdminActivity_MBQ: 185, avgScanTime_min: 15, ctScans: 1 },
  { name: 'FDG cardiaco (viabilidad)', patientsPerWeek: 3, avgAdminActivity_MBQ: 370, avgScanTime_min: 15, ctScans: 1 },
  { name: 'Ga-68 DOTATATE', patientsPerWeek: 4, avgAdminActivity_MBQ: 185, avgScanTime_min: 25, ctScans: 1 },
  { name: 'PSMA (Ga-68 o F-18)', patientsPerWeek: 3, avgAdminActivity_MBQ: 200, avgScanTime_min: 20, ctScans: 1 },
];

// AAPM TG 108 — Gamma constants for common PET radionuclides (uSv·m²/MBq·h)
const GAMMA_PET: Record<string, number> = { 'F-18': 0.143, 'Ga-68': 0.134, 'Cu-64': 0.136, 'Zr-89': 0.120 };

// AAPM TG 108 — CT dose component (scatter from CT, mGy·cm per scan at 1m)
const CT_SCATTER_FACTOR = 0.0002;

function gammaConstant(radionuclide: string): number { return GAMMA_PET[radionuclide] || 0.143; }

export default function AAPMTG108PETDialog({ onClose }: { onClose: () => void }) {
  const [procedures, setProcedures] = useState<PETProcedure[]>(DEFAULT_PROCEDURES);
  const [radionuclide, setRadionuclide] = useState('F-18');
  const [distance_m, setDistance_m] = useState(3.0);
  const [barrierMmPb, setBarrierMmPb] = useState(0);
  const [designGoal_uSv_week, setDesignGoal_uSv_week] = useState(100);
  const [wallThickness_mm, setWallThickness_mm] = useState(200);
  const [wallMaterial, setWallMaterial] = useState<'concrete' | 'lead' | 'gypsum'>('concrete');
  const f172aMethodology = useMemo(() => buildF172AResearchMethodology(), []);
  const f172aPet = f172aMethodology.sources.find((source) => source.modality === 'Nuclear Medicine');

  const gamma = gammaConstant(radionuclide);

  // TVL for PET isotopes (from AAPM TG 108)
  const tvl_mm = wallMaterial === 'concrete' ? 170 : wallMaterial === 'lead' ? 5.8 : wallMaterial === 'gypsum' ? 330 : 170;

  const results = useMemo(() => {
    return procedures.map(p => {
      const admin_GBq = p.avgAdminActivity_MBQ / 1000;
      const time_h = p.avgScanTime_min / 60;
      const kerma_unshielded_uSv = p.patientsPerWeek * admin_GBq * gamma * time_h * 1000 / (distance_m * distance_m); // uSv/week
      const transmission = wallMaterial === 'lead' ? Math.pow(10, -barrierMmPb / 5.8) : Math.pow(10, -wallThickness_mm / tvl_mm);
      const kerma_shielded_uSv = kerma_unshielded_uSv * transmission;
      // CT component (scatter)
      const ct_dose_uSv = p.patientsPerWeek * p.ctScans * CT_SCATTER_FACTOR * wallThickness_mm * 1000 / (distance_m * distance_m);
      const total_uSv = kerma_shielded_uSv + ct_dose_uSv;
      const reqTvl = total_uSv > 0 ? Math.ceil(Math.log10(designGoal_uSv_week / total_uSv) * -1) : 0;
      return { ...p, kerma_unshielded_uSv, kerma_shielded_uSv, ct_dose_uSv, total_uSv, withinGoal: total_uSv <= designGoal_uSv_week, reqTvl, reqPb_mm: Math.max(0, reqTvl * 5.8), reqConcrete_mm: Math.max(0, reqTvl * 170) };
    });
  }, [procedures, gamma, distance_m, barrierMmPb, wallThickness_mm, wallMaterial, tvl_mm, designGoal_uSv_week]);

  const totalUnshielded = results.reduce((s, r) => s + r.kerma_unshielded_uSv, 0);
  const totalShielded = results.reduce((s, r) => s + r.total_uSv, 0);
  const totalPatients = procedures.reduce((s, p) => s + p.patientsPerWeek, 0);

  const updateProcedure = (idx: number, field: keyof PETProcedure, value: number) => {
    setProcedures(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const exportCSV = () => {
    const h = ['Procedimiento', 'Pac/sem', 'Act_MBq', 'Scan_min', 'CT_esc', 'Kerma_sin_uSv', 'Kerma_con_uSv', 'CT_comp_uSv', 'Total_uSv', 'Cumple'];
    const rows = results.map(r => [r.name, r.patientsPerWeek, r.avgAdminActivity_MBQ, r.avgScanTime_min, r.ctScans, r.kerma_unshielded_uSv.toFixed(2), r.kerma_shielded_uSv.toFixed(2), r.ct_dose_uSv.toFixed(4), r.total_uSv.toFixed(2), r.withinGoal ? 'SI' : 'NO']);
    const csv = [h, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `AAPM_TG108_PET_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2" role="dialog" aria-modal="true" aria-labelledby="tg108-title">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6" />
            <div><h2 id="tg108-title" className="text-lg font-bold">AAPM TG 108 — PET Shielding Calculator</h2><p className="text-xs text-blue-100">Med Phys 33(1):1-16, 2006 — v50</p></div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/20" aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Parameters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border">
            <div><label className="text-xs font-medium text-slate-500">Radionucleido</label><select value={radionuclide} onChange={e => setRadionuclide(e.target.value)} className="w-full mt-1 text-xs p-1.5 border rounded">{Object.keys(GAMMA_PET).map(r => <option key={r} value={r}>{r} ({GAMMA_PET[r]} uSv·m²/MBq·h)</option>)}</select></div>
            <div><label className="text-xs font-medium text-slate-500">Distancia (m)</label><input type="number" value={distance_m} onChange={e => setDistance_m(Number(e.target.value))} className="w-full mt-1 text-xs p-1.5 border rounded" step={0.1} min={0.5} /></div>
            <div><label className="text-xs font-medium text-slate-500">Objetivo diseño (uSv/sem)</label><input type="number" value={designGoal_uSv_week} onChange={e => setDesignGoal_uSv_week(Number(e.target.value))} className="w-full mt-1 text-xs p-1.5 border rounded" min={1} /></div>
            <div><label className="text-xs font-medium text-slate-500">Material pared</label><select value={wallMaterial} onChange={e => setWallMaterial(e.target.value as any)} className="w-full mt-1 text-xs p-1.5 border rounded"><option value="concrete">Concreto (TVL=170mm)</option><option value="lead">Plomo (TVL=5.8mm)</option><option value="gypsum">Yeso (TVL=330mm)</option></select></div>
            <div><label className="text-xs font-medium text-slate-500">Espesor pared (mm)</label><input type="number" value={wallThickness_mm} onChange={e => setWallThickness_mm(Number(e.target.value))} className="w-full mt-1 text-xs p-1.5 border rounded" min={0} /></div>
            <div><label className="text-xs font-medium text-slate-500">Pb adicional (mm)</label><input type="number" value={barrierMmPb} onChange={e => setBarrierMmPb(Number(e.target.value))} className="w-full mt-1 text-xs p-1.5 border rounded" min={0} step={0.1} /></div>
          </div>

          {/* Dashboard */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-blue-50 rounded border"><div className="text-lg font-bold text-blue-700">{totalPatients}</div><div className="text-[10px] text-slate-500">Pacientes/sem</div></div>
            <div className="text-center p-2 bg-orange-50 rounded border"><div className="text-lg font-bold text-orange-700">{totalUnshielded.toFixed(1)}</div><div className="text-[10px] text-slate-500">uSv/sem sin blindaje</div></div>
            <div className="text-center p-2 bg-emerald-50 rounded border"><div className="text-lg font-bold text-emerald-700">{totalShielded.toFixed(1)}</div><div className="text-[10px] text-slate-500">uSv/sem con blindaje</div></div>
            <div className={`text-center p-2 rounded border ${totalShielded <= designGoal_uSv_week ? 'bg-emerald-50' : 'bg-red-50'}`}><div className={`text-lg font-bold ${totalShielded <= designGoal_uSv_week ? 'text-emerald-700' : 'text-red-700'}`}>{totalShielded <= designGoal_uSv_week ? '✓ CUMPLE' : '✗ EXCEDE'}</div><div className="text-[10px] text-slate-500">vs {designGoal_uSv_week} uSv/sem</div></div>
          </div>

          {/* Procedures table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b"><Table className="w-4 h-4 text-slate-500" /><h3 className="text-sm font-semibold">Procedimientos PET</h3></div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="px-2 py-1.5 text-left">Procedimiento</th><th className="px-2 py-1.5">Pac/sem</th><th className="px-2 py-1.5">Act (MBq)</th><th className="px-2 py-1.5">Scan (min)</th><th className="px-2 py-1.5">Sin blind (uSv)</th><th className="px-2 py-1.5">Con blind (uSv)</th><th className="px-2 py-1.5">CT comp (uSv)</th><th className="px-2 py-1.5">Total (uSv)</th><th className="px-2 py-1.5">Pb req (mm)</th></tr></thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className={`border-t ${!r.withinGoal ? 'bg-red-50' : ''}`}>
                    <td className="px-2 py-1.5 font-medium">{r.name}</td>
                    <td className="px-2 py-1.5"><input type="number" value={r.patientsPerWeek} onChange={e => updateProcedure(i, 'patientsPerWeek', Number(e.target.value))} className="w-14 text-center border rounded p-0.5" min={0} /></td>
                    <td className="px-2 py-1.5"><input type="number" value={r.avgAdminActivity_MBQ} onChange={e => updateProcedure(i, 'avgAdminActivity_MBQ', Number(e.target.value))} className="w-16 text-center border rounded p-0.5" min={0} /></td>
                    <td className="px-2 py-1.5"><input type="number" value={r.avgScanTime_min} onChange={e => updateProcedure(i, 'avgScanTime_min', Number(e.target.value))} className="w-12 text-center border rounded p-0.5" min={0} /></td>
                    <td className="px-2 py-1.5 text-right font-mono">{r.kerma_unshielded_uSv.toFixed(1)}</td>
                    <td className="px-2 py-1.5 text-right font-mono">{r.kerma_shielded_uSv.toFixed(1)}</td>
                    <td className="px-2 py-1.5 text-right font-mono">{r.ct_dose_uSv.toFixed(3)}</td>
                    <td className={`px-2 py-1.5 text-right font-mono font-bold ${r.withinGoal ? 'text-emerald-700' : 'text-red-700'}`}>{r.total_uSv.toFixed(1)}</td>
                    <td className="px-2 py-1.5 text-right font-mono">{r.reqPb_mm.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AAPM TG 108 notes */}
          <div className="p-3 bg-blue-50 rounded-lg border text-xs space-y-1">
            <p className="font-semibold text-blue-800">Referencias AAPM TG 108:</p>
            <p>• Kerma semanal = N_pacientes × A_admin (GBq) × Γ (uSv·m²/GBq·h) × t_escaneo (h) / d² (m²)</p>
            <p>• Componente CT: factor scatter {CT_SCATTER_FACTOR} mGy·cm/scan a 1m (Dixon & Frey 2023)</p>
            <p>• TVL F-18: Concreto=170mm, Plomo=5.8mm, Yeso=330mm (AAPM TG 108 Table III)</p>
            <p>• Gamma F-18 = 0.143 uSv·m²/MBq·h | Ga-68 = 0.134 | Cu-64 = 0.136 | Zr-89 = 0.120</p>
          </div>
          <div data-testid="f172a-pet-methodology" className="p-3 bg-violet-50 rounded-lg border border-violet-200 text-xs space-y-1">
            <p className="font-semibold text-violet-900">F172A PET 511 keV - nota de metodologia</p>
            <p>{f172aPet?.reportLanguage}</p>
            <p className="text-violet-800">{f172aPet?.calculationPolicy}</p>
            <p className="text-[10px] text-violet-700">Accion: {f172aMethodology.petWorkflow.join(' | ')}</p>
          </div>
        </div>

        <div className="flex justify-between px-5 py-3 border-t bg-slate-50 rounded-b-lg">
          <span className="text-xs text-slate-500">AAPM TG 108 v50 — {procedures.length} procedimientos</span>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"><FileDown className="w-3.5 h-3.5" />Exportar CSV</button>
        </div>
      </div>
    </div>
  );
}
