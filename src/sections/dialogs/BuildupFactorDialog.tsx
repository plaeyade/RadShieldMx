import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SyntheticResultBanner } from '@/components/SyntheticResultBanner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import '@/components/ui/separator';
import { Layers } from 'lucide-react';

interface _BuildupEntry {
  material: string;
  energy_MeV: number;
  mfp: number; // mean free paths
  B_goldstein: number;
  B_taylor: number;
  B_berger: number;
  uncollided: number;
  buildupFactor: number;
}

const MATERIALS_BF = ['Concreto', 'Plomo', 'Hierro', 'Aluminio', 'Agua', 'Polietileno', 'Barita', 'Vidrio Plomado'];
const ENERGIES = [0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0];
const MFP_RANGE = [0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30, 40];

// Simplified Berger buildup factors (approximate)
const BERGER_BF: Record<string, Record<number, number[]>> = {
  'Concreto': { 0.5: [1.5,2.0,3.2,5.0,10,20,35,70,120,250,400], 1: [1.4,1.8,2.8,4.2,8,15,25,50,85,170,280], 2: [1.3,1.6,2.3,3.5,6,11,18,35,60,120,200], 5: [1.2,1.4,1.9,2.8,4.5,8,13,25,42,85,140], 10: [1.1,1.3,1.7,2.3,3.5,6,10,18,30,60,100] },
  'Plomo': { 0.5: [1.8,2.5,4.5,8,18,40,80,200,400,1000,2000], 1: [1.6,2.2,3.8,6.5,14,30,60,150,300,750,1500], 2: [1.4,1.9,3.0,5.0,10,22,45,110,220,550,1100], 5: [1.3,1.6,2.4,3.8,7.5,16,35,85,170,420,850], 10: [1.2,1.4,2.0,3.0,5.5,12,25,60,120,300,600] },
  'Hierro': { 0.5: [1.6,2.2,3.5,5.5,12,25,45,100,180,380,650], 1: [1.5,2.0,3.0,4.8,10,20,38,80,150,320,550], 2: [1.3,1.7,2.6,4.0,8,16,30,65,120,260,450], 5: [1.2,1.5,2.2,3.2,6,12,22,45,85,180,320], 10: [1.1,1.3,1.8,2.6,4.5,9,17,35,65,140,250] },
  'Agua': { 0.5: [1.4,1.7,2.5,3.5,6.5,12,20,40,70,140,230], 1: [1.3,1.6,2.2,3.2,5.5,10,18,35,60,120,200], 2: [1.2,1.4,1.9,2.7,4.5,8,14,28,48,95,160], 5: [1.1,1.3,1.6,2.2,3.5,6,10,20,35,70,120], 10: [1.1,1.2,1.5,1.9,3.0,5,8,16,28,55,95] },
};

function getBuildupFactor(mat: string, energy: number, mfpIdx: number): number {
  const data = BERGER_BF[mat];
  if (!data) return NaN; // sin datos para este material (antes: valores del concreto en silencio)
  const keys = Object.keys(data).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((p, c) => Math.abs(c - energy) < Math.abs(p - energy) ? c : p, keys[0]);
  return data[closest]?.[mfpIdx] || 1;
}

interface BuildupFactorDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function BuildupFactorDialog({ open, onOpenChange }: BuildupFactorDialogProps) {
  const [material, setMaterial] = useState('Concreto');
  const [energy, setEnergy] = useState('1.0');

  const data = useMemo(() => {
    const e = Number(energy);
    return MFP_RANGE.map((mfp, i) => ({
      mfp,
      B: getBuildupFactor(material, e, i),
      uncollided: Math.exp(-mfp),
      total: Math.exp(-mfp) * getBuildupFactor(material, e, i),
    }));
  }, [material, energy]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Layers className="w-5 h-5 text-indigo-500" />
            Multi-Layer Buildup Factor Calculator
            <Badge variant="outline" className="text-[10px]">MicroShield Pro</Badge>
          </DialogTitle>
        </DialogHeader>
        <SyntheticResultBanner detalle="Fase 8c: la tabla de acumulación no tiene referencia trazable (no es ANSI/ANS-6.4.3) y es físicamente inconsistente (p. ej. da más acumulación en plomo que en agua). Se muestra el valor del punto de energía más cercano; los materiales sin datos ya no toman en silencio los del concreto. No la use para diseño: los motores usan transmisión de banda ancha medida (NCRP 147/151, TG-108), que ya incluye la acumulación." />

        <div className="px-6 pb-3 flex items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] text-slate-500 font-medium">Material</label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
              <SelectContent>{MATERIALS_BF.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-slate-500 font-medium">Energia (MeV)</label>
            <Select value={energy} onValueChange={setEnergy}>
              <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
              <SelectContent>{ENERGIES.map(e => <SelectItem key={e} value={String(e)} className="text-xs">{e} MeV</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Bar chart */}
        <div className="px-6 pb-3">
          <h4 className="text-[10px] text-slate-500 font-medium mb-1">Factor de Acumulacion (B) vs mfp</h4>
          <div className="flex items-end gap-0.5 h-32 border-b border-l border-slate-200">
            {data.map(d => {
              const maxB = Math.max(...data.map(x => x.B));
              const h = (d.B / maxB) * 100;
              return (
                <div key={d.mfp} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                  <div className="text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">{d.B.toFixed(1)}</div>
                  <div className="w-full bg-indigo-400 rounded-t hover:bg-indigo-500 transition-colors relative" style={{ height: `${Math.max(h, 4)}%` }}>
                    <div className="absolute bottom-0 w-full bg-amber-400 rounded-t" style={{ height: `${Math.max((d.uncollided * maxB / maxB) * h, 2)}%` }} />
                  </div>
                  <span className="text-[8px] text-slate-500">{d.mfp}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[9px]"><div className="w-3 h-2 bg-indigo-400 rounded" />Con buildup (B)</span>
            <span className="flex items-center gap-1 text-[9px]"><div className="w-3 h-2 bg-amber-400 rounded" />Sin buildup</span>
          </div>
        </div>

        {/* Table */}
        <div className="px-6 pb-4">
          <table className="w-full text-xs">
            <thead><tr className="border-b"><th className="text-left text-[10px] text-slate-500 py-1">mfp</th><th className="text-right text-[10px] text-slate-500">Uncollided</th><th className="text-right text-[10px] text-slate-500">Buildup B</th><th className="text-right text-[10px] text-slate-500">Total</th></tr></thead>
            <tbody>
              {data.map(d => (
                <tr key={d.mfp} className="border-b border-slate-50">
                  <td className="py-1 font-mono">{d.mfp}</td>
                  <td className="text-right font-mono">{d.uncollided.toExponential(3)}</td>
                  <td className="text-right font-mono font-bold text-indigo-700">{d.B.toFixed(2)}</td>
                  <td className="text-right font-mono">{d.total.toExponential(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
