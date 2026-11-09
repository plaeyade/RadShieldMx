/**
 * v105: Multi-Objective Shielding Optimizer
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { SyntheticResultBanner } from '@/components/SyntheticResultBanner';
import { TrendingDown, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { SHIELDING_MATERIALS, calculateRequiredThickness } from '@/lib/xcomAttenuation';
import { NCRP_DESIGN_GOALS } from '@/lib/ncrpOccupancy';

function optimize(energy_MeV: number, activity_GBq: number, distance_m: number, occ: number, useF: number, mats: string[], cw: number, ww: number, sw: number) {
  const P = NCRP_DESIGN_GOALS.uncontrolled, W = activity_GBq * 1000;
  const B = Math.max((P * distance_m * distance_m) / (W * useF * occ), 1e-10);
  return mats.map(mc => {
    const mat = SHIELDING_MATERIALS.find(m => m.code === mc);
    if (!mat) return null;
    const t = calculateRequiredThickness(mc, energy_MeV, B);
    if (!t) return null;
    const mass = 10 * (t / 1000) * mat.density_g_per_cm3 * 1000;
    const costs: Record<string, number> = { PB: 2.5, CONCRETE: 0.15, STEEL: 1.2, GYPSUM: 0.4, POLYETHYLENE: 3.5, BPE: 8.0, TUNGSTEN: 45.0 };
    const dose = P * B / Math.exp(-(mat.data.find(d => d.energy_MeV >= energy_MeV)?.mu_1_per_cm ?? 0.05) * (t / 10));
    const score = cw * (mass * (costs[mc] ?? 1)) / 50000 + ww * mass / 50000 + sw * t / 1000;
    return { code: mc, name: mat.nameEs, t, cost: mass * (costs[mc] ?? 1), mass, dose, pass: dose <= P * 1.05, score };
  }).filter(Boolean).sort((a, b) => (a?.score ?? 0) - (b?.score ?? 0));
}

export default function MultiObjectiveOptimizerDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.multiObjectiveOptimizer));
  const close = () => useAppStore.getState().close('multiObjectiveOptimizer');
  const [energy, setEnergy] = useState('6');
  const [activity, setActivity] = useState('100');
  const [dist, setDist] = useState('3');
  const [occ] = useState('0.2');
  const [useF] = useState('0.25');
  const [cw, setCw] = useState('0.5');
  const [ww, setWw] = useState('0.3');
  const [sw, setSw] = useState('0.2');
  const [mats] = useState(['CONCRETE', 'PB', 'STEEL']);
  const [run, setRun] = useState(false);
  const [res, setRes] = useState<any[] | null>(null);

  const go = () => { setRun(true); setTimeout(() => { setRes(optimize(parseFloat(energy)||6, parseFloat(activity)||100, parseFloat(dist)||3, parseFloat(occ)||0.2, parseFloat(useF)||0.25, mats, parseFloat(cw)||0.5, parseFloat(ww)||0.3, parseFloat(sw)||0.2)); setRun(false); }, 600); };
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <TrendingDown className="w-4 h-4 text-teal-500" /> Multi-Objective Optimizer (v105)
            <Badge variant="outline" className="text-[9px]">Costo+Peso+Espacio</Badge>
          </DialogTitle>
        </DialogHeader>
        <SyntheticResultBanner detalle="Usa W = actividad (GBq) × 1000 sin constante gamma ni rendimiento del equipo; la dosis resultante no es física. No usa normativeBarrierEngine." />
        <div className="grid grid-cols-3 gap-3 mb-2">
          <div><label className="text-[10px] text-slate-500 font-medium mb-1 block">E (MeV)</label><Input type="number" step="0.1" value={energy} onChange={e => setEnergy(e.target.value)} className="text-[11px] h-7" /></div>
          <div><label className="text-[10px] text-slate-500 font-medium mb-1 block">A (GBq)</label><Input type="number" step="1" value={activity} onChange={e => setActivity(e.target.value)} className="text-[11px] h-7" /></div>
          <div><label className="text-[10px] text-slate-500 font-medium mb-1 block">d (m)</label><Input type="number" step="0.1" value={dist} onChange={e => setDist(e.target.value)} className="text-[11px] h-7" /></div>
        </div>
        <div className="bg-slate-50 rounded-md p-2 mb-2 text-[10px]">
          <div className="font-medium text-slate-600 mb-1">Pesos optimizacion</div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="text-[9px] text-slate-500">Costo $</label><Input type="number" step="0.1" value={cw} onChange={e => setCw(e.target.value)} className="text-[11px] h-6" /></div>
            <div><label className="text-[9px] text-slate-500">Peso kg</label><Input type="number" step="0.1" value={ww} onChange={e => setWw(e.target.value)} className="text-[11px] h-6" /></div>
            <div><label className="text-[9px] text-slate-500">Espacio mm</label><Input type="number" step="0.1" value={sw} onChange={e => setSw(e.target.value)} className="text-[11px] h-6" /></div>
          </div>
        </div>
        <Button onClick={go} disabled={run} className="w-full h-8 text-[11px] bg-teal-600 hover:bg-teal-700"><Zap className="w-3 h-3 mr-1" />{run ? 'Optimizando...' : 'Optimizar'}</Button>
        {run && <Progress value={50} className="h-1 mt-2" />}
        {res && res.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-[10px] font-medium text-slate-700">Resultados (mejor primero)</div>
            {res.map((r: any, i: number) => (
              <div key={i} className={`border rounded-md p-2 ${i === 0 ? 'border-teal-300 bg-teal-50' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400">#{i + 1}</span>
                    <span className="text-[11px] font-semibold">{r.name}</span>
                    {i === 0 && <Badge className="text-[8px] bg-teal-100 text-teal-700">OPTIMO</Badge>}
                    {r.pass ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-red-500" />}
                  </div>
                  <span className="text-[9px] text-slate-400">Score: {r.score.toFixed(4)}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[9px]">
                  <div><span className="text-slate-400">Esp:</span> <strong>{r.t.toFixed(1)} mm</strong></div>
                  <div><span className="text-slate-400">$:</span> <strong>${r.cost.toLocaleString()}</strong></div>
                  <div><span className="text-slate-400">Kg:</span> <strong>{r.mass.toFixed(0)}</strong></div>
                  <div><span className="text-slate-400">Dosis:</span> <strong>{r.dose.toFixed(4)}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[8px] text-slate-400 mt-2">NCRP 147/151 | Costos USD/kg aproximados 2024</p>
      </DialogContent>
    </Dialog>
  );
}
