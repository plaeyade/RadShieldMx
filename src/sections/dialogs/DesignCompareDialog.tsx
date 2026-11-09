import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { SyntheticResultBanner } from '@/components/SyntheticResultBanner';
import { GitCompareArrows, ArrowRight, BookOpen } from 'lucide-react';

interface DesignVersion {
  name: string; date: string; material: string; thickness: number; cost: number; weight: number; doseRate: number; pass: boolean;
}

const VERSIONS: DesignVersion[] = [
  { name: 'Original', date: '2026-06-01', material: 'Concreto', thickness: 250, cost: 1200, weight: 5800, doseRate: 0.015, pass: true },
  { name: 'Optimizado v1', date: '2026-06-05', material: 'Pb + Concreto', thickness: 2 + 180, cost: 3400, weight: 3200, doseRate: 0.008, pass: true },
  { name: 'Optimizado v2', date: '2026-06-10', material: 'Tungsteno + Concreto', thickness: 1 + 150, cost: 8900, weight: 2100, doseRate: 0.005, pass: true },
];

export default function DesignCompareDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.designCompare));
  const close = () => useAppStore.getState().close('designCompare');
  const [selA, setSelA] = useState(0);
  const [selB, setSelB] = useState(2);
  const a = VERSIONS[selA];
  const b = VERSIONS[selB];
  const diffCost = ((b.cost - a.cost) / a.cost * 100).toFixed(1);
  const diffWeight = ((b.weight - a.weight) / a.weight * 100).toFixed(1);
  const diffDose = ((b.doseRate - a.doseRate) / a.doseRate * 100).toFixed(1);

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <GitCompareArrows className="w-5 h-5 text-[#2563eb]" /> Design Compare — v121
            <span className="text-[10px] font-mono text-slate-400">Before / After optimization</span>
          </DialogTitle>
        </DialogHeader>
        <SyntheticResultBanner detalle="Las tres versiones comparadas son datos fijos de ejemplo, no versiones del proyecto." />
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <select value={selA} onChange={e => setSelA(+e.target.value)} className="text-xs border rounded p-1 flex-1">
              {VERSIONS.map((v, i) => <option key={i} value={i}>{v.name} ({v.date})</option>)}
            </select>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <select value={selB} onChange={e => setSelB(+e.target.value)} className="text-xs border rounded p-1 flex-1">
              {VERSIONS.map((v, i) => <option key={i} value={i}>{v.name} ({v.date})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="border-slate-200"><CardContent className="p-3">
              <div className="text-xs font-bold text-slate-500 mb-2">{a.name} <span className="font-normal text-slate-400">{a.date}</span></div>
              <div className="space-y-1 text-[11px]">
                <div><span className="text-slate-500">Material:</span> {a.material}</div>
                <div><span className="text-slate-500">Espesor:</span> <span className="font-mono">{a.thickness} mm</span></div>
                <div><span className="text-slate-500">Costo:</span> <span className="font-mono">${a.cost.toLocaleString()}</span></div>
                <div><span className="text-slate-500">Peso:</span> <span className="font-mono">{a.weight} kg</span></div>
                <div><span className="text-slate-500">Dosis:</span> <span className="font-mono">{a.doseRate} mSv/sem</span></div>
                <div>{a.pass ? <span className="text-emerald-600 font-semibold">CUMPLE</span> : <span className="text-red-600 font-semibold">NO CUMPLE</span>}</div>
              </div>
            </CardContent></Card>
            <Card className="border-blue-200 bg-blue-50/30"><CardContent className="p-3">
              <div className="text-xs font-bold text-blue-700 mb-2">{b.name} <span className="font-normal text-slate-400">{b.date}</span></div>
              <div className="space-y-1 text-[11px]">
                <div><span className="text-slate-500">Material:</span> {b.material}</div>
                <div><span className="text-slate-500">Espesor:</span> <span className="font-mono">{b.thickness} mm</span></div>
                <div><span className="text-slate-500">Costo:</span> <span className="font-mono">${b.cost.toLocaleString()}</span> <span className={`text-[9px] ${+diffCost > 0 ? 'text-red-500' : 'text-emerald-600'}`}>({+diffCost > 0 ? '+' : ''}{diffCost}%)</span></div>
                <div><span className="text-slate-500">Peso:</span> <span className="font-mono">{b.weight} kg</span> <span className={`text-[9px] ${+diffWeight > 0 ? 'text-red-500' : 'text-emerald-600'}`}>({+diffWeight > 0 ? '+' : ''}{diffWeight}%)</span></div>
                <div><span className="text-slate-500">Dosis:</span> <span className="font-mono">{b.doseRate} mSv/sem</span> <span className={`text-[9px] ${+diffDose > 0 ? 'text-red-500' : 'text-emerald-600'}`}>({+diffDose > 0 ? '+' : ''}{diffDose}%)</span></div>
                <div>{b.pass ? <span className="text-emerald-600 font-semibold">CUMPLE</span> : <span className="text-red-600 font-semibold">NO CUMPLE</span>}</div>
              </div>
            </CardContent></Card>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100 p-3">
            <div className="text-[11px] font-semibold text-slate-700 mb-1">Resumen de cambios</div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="text-center"><div className={`text-lg font-bold ${+diffCost > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{+diffCost > 0 ? '+' : ''}{diffCost}%</div><div className="text-slate-500">Costo</div></div>
              <div className="text-center"><div className={`text-lg font-bold ${+diffWeight > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{+diffWeight > 0 ? '+' : ''}{diffWeight}%</div><div className="text-slate-500">Peso</div></div>
              <div className="text-center"><div className={`text-lg font-bold ${+diffDose > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{+diffDose > 0 ? '+' : ''}{diffDose}%</div><div className="text-slate-500">Dosis</div></div>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Ref: AutoCAD Drawing Compare | Mosaics Atomics Diff Tool | NCRP 151 Validation</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
