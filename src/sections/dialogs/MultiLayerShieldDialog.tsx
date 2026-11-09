import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { SyntheticResultBanner } from '@/components/SyntheticResultBanner';
import { Layers, Plus, Trash2, Calculator, BookOpen } from 'lucide-react';

const MATS = [
  { id: 'pb', name: 'Plomo (Pb)', d: 11.35, tvl150: 0.29, tvl6: 4.9, cost: 2.5 },
  { id: 'conc', name: 'Concreto (2.35)', d: 2.35, tvl150: 23.0, tvl6: 370, cost: 0.05 },
  { id: 'steel', name: 'Acero (Fe)', d: 7.87, tvl150: 4.4, tvl6: 100, cost: 0.8 },
  { id: 'barite', name: 'Concreto Baritado', d: 3.5, tvl150: 12.0, tvl6: 200, cost: 0.15 },
  { id: 'bpe', name: 'PE Borado', d: 1.05, tvl150: 130.0, tvl6: 45, cost: 0.12 },
  { id: 'w', name: 'Tungsteno (W)', d: 19.3, tvl150: 0.09, tvl6: 2.1, cost: 35.0 },
];
const BFM = [{ id: 'gp', name: 'Geometric Progression' }, { id: 'taylor', name: 'Taylor' }, { id: 'berger', name: 'Berger' }, { id: 'none', name: 'Narrow Beam' }];
interface L { id: string; m: string; t: number; }

export default function MultiLayerShieldDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.multiLayerShield));
  const close = () => useAppStore.getState().close('multiLayerShield');
  const [e, setE] = useState(150);
  const [bm, setBm] = useState('gp');
  const [ls, setLs] = useState<L[]>([{ id: '1', m: 'pb', t: 2 }, { id: '2', m: 'conc', t: 200 }]);
  const add = () => setLs(p => [...p, { id: Date.now().toString(), m: 'conc', t: 100 }]);
  const rm = (id: string) => ls.length > 1 && setLs(p => p.filter(l => l.id !== id));
  const up = (id: string, patch: Partial<L>) => setLs(p => p.map(l => l.id === id ? { ...l, ...patch } : l));

  const r = useMemo(() => {
    const tk = e <= 150 ? 'tvl150' : 'tvl6';
    let tB = 1, tC = 0, tW = 0, tT = 0;
    const lr = ls.map(l => {
      const m = MATS.find(x => x.id === l.m); if (!m) return null;
      const tv = m[tk as keyof typeof m] as number, n = l.t / tv, B = Math.pow(10, -n);
      const w = (l.t / 1000) * 10 * m.d * 1000, c = w * m.cost;
      tB *= B; tC += c; tW += w; tT += l.t;
      return { n, B, tv, w, c, mn: m.name };
    }).filter(Boolean);
    const ntv = -Math.log10(tB || 1e-10);
    let b = 1; if (bm === 'gp') b = 1 + (ntv - 1) * 0.15; else if (bm === 'taylor') b = 1 + 0.5 * ntv; else if (bm === 'berger') b = 1 + 0.3 * ntv * Math.log(ntv + 1);
    return { lr, tB, bb: tB * b, b, ntv, tC, tW, tT, eq: ntv * (e <= 150 ? 0.29 : 4.9) };
  }, [ls, e, bm]);

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Layers className="w-5 h-5 text-[#f97316]" /> Multi-Layer Shield — v114
            <span className="text-[10px] font-mono text-slate-400">B_total = B1 x B2 x ... x Bn</span>
          </DialogTitle>
        </DialogHeader>
        <SyntheticResultBanner detalle="Tabla TVL local (los valores de 150 kVp son HVL y los de 6 MV para Pb, W y PE no corresponden a NCRP 151) y factores de buildup heurísticos; no usa doseFieldEngine." />
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-[10px]">Energia (kVp/MV)</Label><Input type="number" value={e} onChange={x => setE(+x.target.value)} className="h-7 text-xs" /></div>
            <div><Label className="text-[10px]">Buildup</Label>
              <Select value={bm} onValueChange={setBm}><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{BFM.map(m => <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="flex items-end"><Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={add}><Plus className="w-3 h-3" />Capa</Button></div>
          </div>
          <div className="text-[9px] text-slate-400 bg-slate-50 p-1.5 rounded">B_i = 10^(-t_i/TVL_i) | B_total = prod(B_i) x buildup | {BFM.find(m => m.id === bm)?.name}</div>
          <div className="space-y-1">
            {ls.map((l, i) => (
              <Card key={l.id} className="border-slate-200"><CardContent className="p-1.5 flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 w-4">{i + 1}</span>
                <Select value={l.m} onValueChange={v => up(l.id, { m: v })}>
                  <SelectTrigger className="h-7 text-[10px] w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>{MATS.map(m => <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>)}</SelectContent></Select>
                <Input type="number" value={l.t} onChange={x => up(l.id, { t: +x.target.value })} className="h-7 text-xs w-20" placeholder="mm" />
                {r.lr[i] && <span className="text-[10px] font-mono ml-auto">B={r.lr[i]!.B.toExponential(2)} n={r.lr[i]!.n.toFixed(1)}</span>}
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => rm(l.id)} disabled={ls.length <= 1}><Trash2 className="w-3 h-3" /></Button>
              </CardContent></Card>
            ))}
          </div>
          <Separator />
          <div className="bg-gradient-to-r from-[#fff7ed] to-white rounded-lg border border-orange-100 p-3">
            <div className="flex items-center gap-2 mb-1"><Calculator className="w-4 h-4 text-[#f97316]" /><span className="text-xs font-bold">Resultados</span></div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
              <div><span className="text-slate-500">B narrow:</span> <span className="font-mono font-semibold">{r.tB.toExponential(3)}</span></div>
              <div><span className="text-slate-500">B broad:</span> <span className="font-mono font-semibold text-[#f97316]">{r.bb.toExponential(3)}</span></div>
              <div><span className="text-slate-500">Buildup:</span> <span className="font-mono">{r.b.toFixed(3)}</span></div>
              <div><span className="text-slate-500">TVL eq:</span> <span className="font-mono font-semibold">{r.ntv.toFixed(2)} TVL</span></div>
              <div><span className="text-slate-500">Pb eq:</span> <span className="font-mono font-semibold">{r.eq.toFixed(2)} mm</span></div>
              <div><span className="text-slate-500">Espesor:</span> <span className="font-mono">{r.tT.toFixed(1)} mm</span></div>
              <div><span className="text-slate-500">Peso:</span> <span className="font-mono">{(r.tW / 1000).toFixed(2)} ton</span></div>
              <div><span className="text-slate-500">Costo:</span> <span className="font-mono">${r.tC.toFixed(0)} USD</span></div>
            </div>
          </div>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Ref: NCRP 151 App.B.3 | MicroShield v8 | Capo 1992 GP</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
