import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/stores/appStore';
import { BarChart3, ArrowUpDown, BookOpen } from 'lucide-react';

interface TornadoBar { param: string; base: number; low: number; high: number; deltaLow: number; deltaHigh: number; color: string; }

const PARAMS = [
  { key: 'W', name: 'Carga trabajo (W)', unit: 'mA-min/sem', base: 500, pct: 20 },
  { key: 'd', name: 'Distancia (d)', unit: 'm', base: 3.0, pct: 20 },
  { key: 'T', name: 'Factor ocupacion (T)', unit: '', base: 0.25, pct: 20 },
  { key: 'U', name: 'Factor uso (U)', unit: '', base: 1.0, pct: 20 },
  { key: 'P', name: 'Meta dosis (P)', unit: 'mSv/sem', base: 0.02, pct: 20 },
  { key: 'kVp', name: 'Energia (kVp)', unit: 'kVp', base: 150, pct: 15 },
];

function calcThickness(W: number, d: number, T: number, U: number, P: number, kVp: number) {
  const tvl = kVp <= 150 ? 23.0 : 370;
  const B = (P * d * d) / (W * U * T);
  const n = -Math.log10(Math.max(B, 1e-10));
  return n * tvl;
}

export default function SensitivityAnalysisDialog() {
  const open = useAppStore(s => s.dialogs.sensitivityAnalysis?.open ?? false);
  const close = () => useAppStore.getState().close('sensitivityAnalysis');
  const [values, setValues] = useState<Record<string, number>>(Object.fromEntries(PARAMS.map(p => [p.key, p.base])));
  const update = (key: string, val: number) => setValues(p => ({ ...p, [key]: val }));

  const baseThickness = useMemo(() => calcThickness(values.W, values.d, values.T, values.U, values.P, values.kVp), [values]);

  const tornado = useMemo(() => {
    return PARAMS.map(p => {
      const vLow = p.base * (1 - p.pct / 100);
      const vHigh = p.base * (1 + p.pct / 100);
      const lowVals = { ...values, [p.key]: vLow };
      const highVals = { ...values, [p.key]: vHigh };
      const tLow = calcThickness(lowVals.W, lowVals.d, lowVals.T, lowVals.U, lowVals.P, lowVals.kVp);
      const tHigh = calcThickness(highVals.W, highVals.d, highVals.T, highVals.U, highVals.P, highVals.kVp);
      return { param: p.name, base: baseThickness, low: tLow, high: tHigh, deltaLow: tLow - baseThickness, deltaHigh: tHigh - baseThickness, color: p.key === 'd' ? '#2563eb' : p.key === 'W' ? '#f97316' : p.key === 'T' ? '#10b981' : '#6b7280' };
    }).sort((a, b) => Math.max(Math.abs(a.deltaLow), Math.abs(a.deltaHigh)) - Math.max(Math.abs(b.deltaLow), Math.abs(b.deltaHigh)));
  }, [values, baseThickness]);

  const maxDelta = Math.max(...tornado.map(t => Math.max(Math.abs(t.deltaLow), Math.abs(t.deltaHigh))), 1);

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-[#0d9488]" /> Sensitivity Analysis — v118
            <span className="text-[10px] font-mono text-slate-400">Tornado charts ±20%</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {PARAMS.map(p => (
              <div key={p.key}><Label className="text-[9px]">{p.name}</Label><Input type="number" value={values[p.key]} onChange={e => update(p.key, +e.target.value)} className="h-7 text-xs" /></div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-teal-50 to-white rounded-lg border border-teal-100 p-3">
            <div className="text-[11px] font-semibold text-slate-700 mb-1">Espesor base: <span className="font-mono text-teal-700">{baseThickness.toFixed(1)} mm</span> (concreto)</div>
          </div>
          <Card className="border-slate-200"><CardContent className="p-3">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1"><ArrowUpDown className="w-3 h-3" /> Tornado Chart — Variacion ±20%</div>
            <div className="space-y-1.5">
              {tornado.map((t, i) => {
                const lw = Math.abs(t.deltaLow) / maxDelta * 45;
                const hw = Math.abs(t.deltaHigh) / maxDelta * 45;
                return (
                  <div key={i} className="flex items-center gap-1 text-[9px]">
                    <span className="w-28 text-right truncate text-slate-600">{t.param}</span>
                    <div className="flex-1 flex items-center gap-0.5">
                      <div className="flex-1 flex justify-end"><div className="h-3 rounded-l" style={{ width: `${lw}%`, backgroundColor: t.color + '80' }} /></div>
                      <span className="w-8 text-center font-mono text-[8px]">{baseThickness.toFixed(0)}</span>
                      <div className="flex-1"><div className="h-3 rounded-r" style={{ width: `${hw}%`, backgroundColor: t.color }} /></div>
                    </div>
                    <span className="w-12 text-right font-mono text-[8px] text-red-500">{t.deltaLow > 0 ? '+' : ''}{t.deltaLow.toFixed(1)}</span>
                    <span className="w-12 text-right font-mono text-[8px] text-emerald-600">{t.deltaHigh > 0 ? '+' : ''}{t.deltaHigh.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent></Card>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Ref: NCRP 147 Ch.7 | IAEA SSG-46 Sec.5.3 | MicroShield Uncertainty Propagation</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
