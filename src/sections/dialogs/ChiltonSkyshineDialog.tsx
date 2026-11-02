/**
 * ChiltonSkyshineDialog — MC-05 UI: Skyshine Calculator
 * Metodo de Chilton et al. para radioterapia megavoltaje.
 */
import { useState, useMemo } from 'react';
import { X, Cloud, BarChart3, Download } from 'lucide-react';
import { calculateSkyshine, DEFAULT_DISTANCES } from '@/lib/skyshine/ChiltonSkyshine';

export default function ChiltonSkyshineDialog({ onClose }: { onClose: () => void }) {
  const [energy, setEnergy] = useState(10);
  const [workload, setWorkload] = useState(500);
  const [barrierH, setBarrierH] = useState(3.0);
  const [roofThick, setRoofThick] = useState(300);
  const [beamAngle, setBeamAngle] = useState(0);
  const [distances] = useState(DEFAULT_DISTANCES.join(', '));

  const result = useMemo(() => {
    const d = distances.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
    return calculateSkyshine({ energyMV: energy, workloadGym2Week: workload, barrierHeightM: barrierH, roofThicknessMm: roofThick, distancesM: d.length > 0 ? d : [...DEFAULT_DISTANCES], beamAngleDeg: beamAngle });
  }, [energy, workload, barrierH, roofThick, beamAngle, distances]);

  const exportCSV = () => {
    const h = ['Distancia_m', 'Dosis_uSv_sem'];
    const csv = [h, ...result.points.map(p => [p.distanceM, p.doseUSvWeek.toFixed(4)])]
      .map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Skyshine_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const maxDose = Math.max(...result.points.map(p => p.doseUSvWeek), 0.001);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2" role="dialog" aria-modal="true" aria-labelledby="sky-title">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3"><Cloud className="w-6 h-6" /><div><h2 id="sky-title" className="text-lg font-bold">Chilton Skyshine Calculator</h2><p className="text-xs text-sky-100">NCRP 151 Sec. 5.4 — v50</p></div></div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/20" aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 bg-slate-50 rounded-lg border text-xs">
            <div><label className="text-[10px] font-medium text-slate-500">Energia (MV)</label><input type="number" value={energy} onChange={e => setEnergy(Number(e.target.value))} className="w-full mt-1 p-1.5 border rounded" min={4} max={25} /></div>
            <div><label className="text-[10px] font-medium text-slate-500">Carga (Gy·m²/sem)</label><input type="number" value={workload} onChange={e => setWorkload(Number(e.target.value))} className="w-full mt-1 p-1.5 border rounded" min={0} /></div>
            <div><label className="text-[10px] font-medium text-slate-500">Altura barrera (m)</label><input type="number" value={barrierH} onChange={e => setBarrierH(Number(e.target.value))} className="w-full mt-1 p-1.5 border rounded" step={0.1} min={0.5} /></div>
            <div></div>
            <div><label className="text-[10px] font-medium text-slate-500">Techo concreto (mm)</label><input type="number" value={roofThick} onChange={e => setRoofThick(Number(e.target.value))} className="w-full mt-1 p-1.5 border rounded" min={0} /></div>
            <div><label className="text-[10px] font-medium text-slate-500">Angulo haz (deg)</label><input type="number" value={beamAngle} onChange={e => setBeamAngle(Number(e.target.value))} className="w-full mt-1 p-1.5 border rounded" min={0} max={90} /></div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-blue-50 rounded border"><div className="text-lg font-bold text-blue-700">{result.roofTransmission.toExponential(2)}</div><div className="text-[10px] text-slate-500">Transmision techo</div></div>
            <div className="text-center p-2 bg-orange-50 rounded border"><div className="text-lg font-bold text-orange-700">{result.maxDoseUSv.toFixed(3)}</div><div className="text-[10px] text-slate-500">Max uSv/sem</div></div>
            <div className="text-center p-2 bg-sky-50 rounded border"><div className="text-lg font-bold text-sky-700">{result.angleCorrection.toFixed(1)}x</div><div className="text-[10px] text-slate-500">Corr. angular</div></div>
          </div>

          {/* Skyshine chart as horizontal bars */}
          <div className="border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b text-sm font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4" />Dosis Skyshine vs Distancia</div>
            <div className="p-3 space-y-1">
              {result.points.map((p, i) => {
                const barWidth = Math.min((p.doseUSvWeek / maxDose) * 100, 100);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-12 text-right text-[10px] font-mono text-slate-600">{p.distanceM}m</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-4 relative overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                    </div>
                    <div className="w-16 text-right text-[10px] font-mono">{p.doseUSvWeek.toFixed(4)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-sky-50 rounded-lg border text-xs space-y-1">
            <p className="font-semibold text-sky-800">Referencia Chilton et al.:</p>
            <p>• Dosis skyshine = K_primaria × B_techo × G(d,h,E) × α(θ)</p>
            <p>• G(d,h,E) = (h/d)² × f(E) × exp(-μd/3) — funcion de Chilton</p>
            <p>• α(θ): correccion angular (0°=1.0x, 30°=1.3x, 45°=1.8x, 60°=2.4x)</p>
          </div>
        </div>
        <div className="flex justify-between px-5 py-3 border-t bg-slate-50 rounded-b-lg"><span className="text-xs text-slate-500">Chilton Skyshine v50</span><button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-600 text-white text-xs font-medium hover:bg-sky-700"><Download className="w-3.5 h-3.5" />Exportar CSV</button></div>
      </div>
    </div>
  );
}
