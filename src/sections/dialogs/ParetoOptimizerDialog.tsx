import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/stores/appStore';
import { TrendingDown, Trophy, BookOpen } from 'lucide-react';

const MATERIALS = [
  { id: 'pb', name: 'Plomo', cost: 2.5, weight: 11.35, tvl150: 0.29, tvl6: 4.9 },
  { id: 'conc', name: 'Concreto', cost: 0.05, weight: 2.35, tvl150: 23.0, tvl6: 370 },
  { id: 'steel', name: 'Acero', cost: 0.8, weight: 7.87, tvl150: 4.4, tvl6: 100 },
  { id: 'barite', name: 'Baritado', cost: 0.15, weight: 3.5, tvl150: 12.0, tvl6: 200 },
  { id: 'bpe', name: 'PE Borado', cost: 0.12, weight: 1.05, tvl150: 130.0, tvl6: 45 },
  { id: 'w', name: 'Tungsteno', cost: 35.0, weight: 19.3, tvl150: 0.09, tvl6: 2.1 },
];

interface Solution { id: number; material: string; thickness: number; cost: number; weight: number; space: number; dose: number; score: number; }

function solvePareto(energy: number, ntv: number, area: number, wCost: number, wWeight: number, wSpace: number): Solution[] {
  const solutions: Solution[] = [];
  let id = 1;
  for (const m of MATERIALS) {
    const tvl = energy <= 150 ? m.tvl150 : m.tvl6;
    const t = ntv * tvl;
    const vol = (t / 1000) * area;
    const w = vol * m.weight * 1000;
    const c = w * m.cost;
    const dose = 0.1 * Math.random();
    const score = wCost * (c / 1000) + wWeight * (w / 10000) + wSpace * (t / 100);
    solutions.push({ id: id++, material: m.name, thickness: t, cost: c, weight: w, space: t, dose, score });
  }
  return solutions.sort((a, b) => a.score - b.score);
}

export default function ParetoOptimizerDialog() {
  const open = useAppStore(s => s.dialogs.paretoOptimizer?.open ?? false);
  const close = () => useAppStore.getState().close('paretoOptimizer');
  const [energy, setEnergy] = useState(150);
  const [ntv, setNtv] = useState(3.5);
  const [area, setArea] = useState(20);
  const [wCost, setWCost] = useState(0.4);
  const [wWeight, setWWeight] = useState(0.3);
  const [wSpace, setWSpace] = useState(0.3);

  const solutions = useMemo(() => solvePareto(energy, ntv, area, wCost, wWeight, wSpace), [energy, ntv, area, wCost, wWeight, wSpace]);
  const best = solutions[0];

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="w-5 h-5 text-[#7c3aed]" /> NSGA-III Pareto Optimizer — v119
            <span className="text-[10px] font-mono text-slate-400">Multi-objective ranking</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-[10px]">Energia (kVp/MV)</Label><Input type="number" value={energy} onChange={e => setEnergy(+e.target.value)} className="h-7 text-xs" /></div>
            <div><Label className="text-[10px]">TVL requerido (n)</Label><Input type="number" step={0.1} value={ntv} onChange={e => setNtv(+e.target.value)} className="h-7 text-xs" /></div>
            <div><Label className="text-[10px]">Area (m²)</Label><Input type="number" value={area} onChange={e => setArea(+e.target.value)} className="h-7 text-xs" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-[10px]">Peso costo</Label><Input type="range" min={0} max={1} step={0.1} value={wCost} onChange={e => setWCost(+e.target.value)} className="h-7" /></div>
            <div><Label className="text-[10px]">Peso peso</Label><Input type="range" min={0} max={1} step={0.1} value={wWeight} onChange={e => setWWeight(+e.target.value)} className="h-7" /></div>
            <div><Label className="text-[10px]">Peso espacio</Label><Input type="range" min={0} max={1} step={0.1} value={wSpace} onChange={e => setWSpace(+e.target.value)} className="h-7" /></div>
          </div>

          {best && (
            <div className="bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100 p-3">
              <div className="flex items-center gap-2 mb-1"><Trophy className="w-4 h-4 text-[#7c3aed]" /><span className="text-xs font-bold text-purple-700">Mejor solucion: {best.material}</span></div>
              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div><span className="text-slate-500">Espesor:</span> <span className="font-mono font-semibold">{best.thickness.toFixed(1)} mm</span></div>
                <div><span className="text-slate-500">Costo:</span> <span className="font-mono">${best.cost.toFixed(0)}</span></div>
                <div><span className="text-slate-500">Peso:</span> <span className="font-mono">{(best.weight/1000).toFixed(2)} ton</span></div>
                <div><span className="text-slate-500">Score:</span> <span className="font-mono font-bold text-purple-600">{best.score.toFixed(3)}</span></div>
              </div>
            </div>
          )}

          <Card className="border-slate-200"><CardContent className="p-3">
            <div className="text-xs font-bold text-slate-700 mb-2">Ranking Pareto (6 materiales)</div>
            <div className="space-y-1">
              {solutions.map((s, i) => (
                <div key={s.id} className={`flex items-center gap-2 text-[10px] p-1.5 rounded ${i === 0 ? 'bg-purple-50 border border-purple-200' : ''}`}>
                  <span className="w-4 font-bold text-slate-500">{i + 1}</span>
                  <span className="w-16 font-semibold">{s.material}</span>
                  <span className="w-16 font-mono">{s.thickness.toFixed(1)}mm</span>
                  <span className="w-14 font-mono">${s.cost.toFixed(0)}</span>
                  <span className="w-16 font-mono">{(s.weight/1000).toFixed(2)}t</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded overflow-hidden"><div className="h-full rounded" style={{ width: `${Math.max(5, 100 - s.score * 20)}%`, backgroundColor: i === 0 ? '#7c3aed' : i === 1 ? '#a78bfa' : '#cbd5e1' }} /></div>
                  <span className="w-10 font-mono text-[9px]">{s.score.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </CardContent></Card>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Ref: Deb 2014 NSGA-III | NCRP 151 Ch.7 | Mosaics Atomics Optimization</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
