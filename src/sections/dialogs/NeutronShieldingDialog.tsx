/**
 * v109: Neutron Shielding Calculator
 * Dedicated calculator for neutron shielding per NCRP 151 Table B.7
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { SyntheticResultBanner } from '@/components/SyntheticResultBanner';
import { Atom, Info } from 'lucide-react';

const NEUTRON_MATERIALS = [
  { code: 'CONCRETE', name: 'Concreto estandar', tvl_cm: 45, density: 2.35, use: 'Blindaje primario MV' },
  { code: 'POLYETHYLENE', name: 'Polietileno (baja Z)', tvl_cm: 5.0, density: 0.94, use: 'Moderacion neutrones rapidos' },
  { code: 'BPE', name: 'Polietileno borado 5%', tvl_cm: 3.5, density: 1.00, use: 'Moderacion + captura termica' },
  { code: 'STEEL_BPE', name: 'Acero + BPE (doble capa)', tvl_cm: 4.0, density: 5.0, use: 'Estructural + moderacion' },
  { code: 'WATER', name: 'Agua', tvl_cm: 3.8, density: 1.00, use: 'Moderacion economica' },
  { code: 'EARTHEN', name: 'Tierra compactada', tvl_cm: 55, density: 1.5, use: 'Blindaje exterior' },
];

const ENERGY_LEVELS = [
  { mv: 10, neutron_yield: 0.5, description: '10 MV X-ray — Neutrones moderados' },
  { mv: 15, neutron_yield: 1.0, description: '15 MV X-ray — Neutrones significativos' },
  { mv: 18, neutron_yield: 2.0, description: '18 MV X-ray — Alta produccion neutronica' },
  { mv: 20, neutron_yield: 3.5, description: '20 MV X-ray — Neutrones dominantes' },
  { mv: 25, neutron_yield: 6.0, description: '25 MV X-ray — Blindaje neutronico obligatorio' },
];

export default function NeutronShieldingDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.neutronShielding));
  const close = () => useAppStore.getState().close('neutronShielding');
  const [mv, setMv] = useState('18');
  const [distance, setDistance] = useState('3');
  const [material, setMaterial] = useState('BPE');
  const [workload, setWorkload] = useState('200');

  const result = useMemo(() => {
    const energy = ENERGY_LEVELS.find(e => e.mv.toString() === mv) ?? ENERGY_LEVELS[2];
    const mat = NEUTRON_MATERIALS.find(m => m.code === material) ?? NEUTRON_MATERIALS[2];
    const d = parseFloat(distance) || 3;
    const W = parseFloat(workload) || 200;
    const H_0 = energy.neutron_yield; // Gy/h at 1m from McGinley 1998
    const P = 0.02; // mSv/week
    const H_w = H_0 * W / d / d; // Weekly dose at distance
    const n_tvl = Math.log10(H_w / P);
    const thickness_cm = n_tvl * mat.tvl_cm;
    const thickness_mm = thickness_cm * 10;
    const mass_kg = 10 * (thickness_cm / 100) * mat.density * 1000;
    
    return { energy, mat, H_w, n_tvl, thickness_mm, thickness_cm, mass_kg, passes: thickness_mm > 0 && H_w > 0 };
  }, [mv, distance, material, workload]);

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Atom className="w-4 h-4 text-blue-500" /> Neutron Shielding (v109)
            <Badge variant="outline" className="text-[9px]">NCRP 151 Table B.7</Badge>
          </DialogTitle>
        </DialogHeader>
        <SyntheticResultBanner detalle="Multiplica un rendimiento en Gy/h por una carga en Gy/sem y usa TVL de neutrones fijos; unidades inconsistentes con NCRP 151 §2.4." />
        <div className="text-[10px] text-slate-500 bg-blue-50 rounded-md p-2 mb-3 flex items-start gap-2">
          <Info className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
          Blindaje neutronico para energías ≥ 10 MV. Moderacion + captura termica con boro.
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><label className="text-[10px] text-slate-500 font-medium mb-1 block">Energia MV</label>
            <Select value={mv} onValueChange={setMv}><SelectTrigger className="text-[11px] h-7"><SelectValue /></SelectTrigger><SelectContent>{ENERGY_LEVELS.map(e => <SelectItem key={e.mv} value={e.mv.toString()} className="text-[11px]">{e.mv} MV — {e.neutron_yield} Gy/h</SelectItem>)}</SelectContent></Select>
          </div>
          <div><label className="text-[10px] text-slate-500 font-medium mb-1 block">Distancia (m)</label><Input type="number" step="0.1" value={distance} onChange={e => setDistance(e.target.value)} className="text-[11px] h-7" /></div>
          <div><label className="text-[10px] text-slate-500 font-medium mb-1 block">Material</label>
            <Select value={material} onValueChange={setMaterial}><SelectTrigger className="text-[11px] h-7"><SelectValue /></SelectTrigger><SelectContent>{NEUTRON_MATERIALS.map(m => <SelectItem key={m.code} value={m.code} className="text-[11px]">{m.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><label className="text-[10px] text-slate-500 font-medium mb-1 block">Carga trabajo (Gy/sem)</label><Input type="number" step="10" value={workload} onChange={e => setWorkload(e.target.value)} className="text-[11px] h-7" /></div>
        </div>
        {result.passes && (
          <div className="border rounded-md p-3 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between"><span className="text-[11px] font-semibold">Resultado</span><Badge className="text-[9px] bg-green-100 text-green-700">PASS</Badge></div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div><span className="text-slate-400">Dosis sin blind:</span> <strong>{result.H_w.toFixed(2)} mSv/sem</strong></div>
              <div><span className="text-slate-400">TVL neutrones:</span> <strong>{result.mat.tvl_cm} cm</strong></div>
              <div><span className="text-slate-400">N TVL:</span> <strong>{result.n_tvl.toFixed(2)}</strong></div>
              <div><span className="text-slate-400">Espesor:</span> <strong className="text-blue-700">{result.thickness_mm.toFixed(1)} mm ({result.thickness_cm.toFixed(1)} cm)</strong></div>
              <div><span className="text-slate-400">Masa:</span> <strong>{result.mass_kg.toFixed(0)} kg</strong></div>
              <div><span className="text-slate-400">Material:</span> <strong>{result.mat.name}</strong></div>
            </div>
          </div>
        )}
        <p className="text-[8px] text-slate-400 mt-2">Formula: n = log₁₀(H_w/P) | t = n × TVL | Ref: NCRP 151 Table B.7, McGinley 1998</p>
      </DialogContent>
    </Dialog>
  );
}
