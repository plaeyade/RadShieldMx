import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/stores/appStore';
import { Radio, BookOpen, Zap, Box, Circle, Minus, Disc, Hexagon } from 'lucide-react';

const GEOMETRIES = [
  { id: 'point', name: 'Puntual', icon: Radio, desc: 'Fuente isotropica puntual. Ideal para fuentes pequenas a distancia >> dimension.', formula: 'DR = A x Gamma / d^2' },
  { id: 'line', name: 'Lineal', icon: Minus, desc: 'Fuente lineal finita. Tubos de irradiacion, lineas de fuentes.', formula: 'DR = (A x Gamma / Ld) x atan(L/2d)' },
  { id: 'disc', name: 'Disco', icon: Disc, desc: 'Fuente superficial circular. Cabezales Co-60, arrays Gamma Knife.', formula: 'DR = pi x a^2 x sigma x Gamma / (a^2 + d^2)' },
  { id: 'cylinder', name: 'Cilindro', icon: Hexagon, desc: 'Fuente volumetrica cilindrica. Barras Co-60, Ir-192 HDR.', formula: 'Integracion numerica sobre volumen' },
  { id: 'sphere', name: 'Esfera', icon: Circle, desc: 'Fuente volumetrica esferica. Capsulas selladas.', formula: 'DR = 3A x Gamma x F(mu r0) / (4 pi r0^3)' },
  { id: 'cone', name: 'Cono', icon: Zap, desc: 'Haz conico direccional. LINAC Bremsstrahlung.', formula: 'DR = K x f(theta) x e^(-mu t) / d^2' },
  { id: 'rect', name: 'Rectangulo', icon: Box, desc: 'Fuente superficial rectangular. Paneles, piscinas.', formula: 'Integracion doble sobre area' },
];

const NUCLIDES = [
  { id: 'co60', name: 'Co-60', e: 1.17, e2: 1.33, gamma: 1.11, half: 5.27 },
  { id: 'cs137', name: 'Cs-137', e: 0.662, gamma: 0.0771, half: 30.17 },
  { id: 'ir192', name: 'Ir-192', e: 0.38, gamma: 0.111, half: 0.198 },
  { id: 'i131', name: 'I-131', e: 0.364, gamma: 0.0557, half: 8.02 },
  { id: 'tc99m', name: 'Tc-99m', e: 0.140, gamma: 0.0224, half: 0.006 },
  { id: 'f18', name: 'F-18', e: 0.511, gamma: 0.143, half: 0.038 },
  { id: 'xe133', name: 'Xe-133', e: 0.081, gamma: 0.0062, half: 5.27 },
  { id: 'yb169', name: 'Yb-169', e: 0.063, gamma: 0.0125, half: 0.088 },
  { id: 'ra226', name: 'Ra-226', e: 0.047, gamma: 0.825, half: 1600 },
  { id: 'am241', name: 'Am-241', e: 0.059, gamma: 0.11, half: 432 },
  { id: 'cf252', name: 'Cf-252', e: 2.14, gamma: 0.116, half: 2.65 },
  { id: 'au198', name: 'Au-198', e: 0.412, gamma: 0.0592, half: 2.70 },
  { id: 'pu238', name: 'Pu-238', e: 5.5, gamma: 0.00002, half: 87.7 },
  { id: 'sr90', name: 'Sr-90', e: 0.546, gamma: 0.0, half: 28.8 },
];

export default function SourceLibraryDialog() {
  const open = useAppStore(s => s.dialogs.sourceLibrary?.open ?? false);
  const close = () => useAppStore.getState().close('sourceLibrary');
  const [geom, setGeom] = useState('point');
  const [nuclide, setNuclide] = useState('co60');
  const [activity, setActivity] = useState(1000);
  const [dims, setDims] = useState({ l: 100, r: 10, h: 50, w: 100, theta: 14 });
  const selG = GEOMETRIES.find(g => g.id === geom);
  const selN = NUCLIDES.find(n => n.id === nuclide);
  const dr = selN ? (activity * selN.gamma * 1000) / (1 * 1) : 0;

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Radio className="w-5 h-5 text-[#ef4444]" /> Source Library — v115
            <span className="text-[10px] font-mono text-slate-400">7 geometries | 14 radionuclides</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-[10px] font-semibold text-slate-600">Geometria de Fuente</Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {GEOMETRIES.map(g => {
                const Icon = g.icon;
                return (
                  <button key={g.id} onClick={() => setGeom(g.id)}
                    className={`flex flex-col items-center p-2 rounded-lg border transition-all text-[9px] font-bold ${
                      geom === g.id ? 'border-red-300 bg-red-50 text-red-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}>
                    <Icon className="w-4 h-4 mb-0.5" strokeWidth={geom === g.id ? 2.5 : 2} />
                    {g.name}
                  </button>
                );
              })}
            </div>
            {selG && <div className="text-[10px] text-slate-500 mt-1 bg-slate-50 p-1.5 rounded">{selG.desc} | <span className="font-mono text-slate-400">{selG.formula}</span></div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px]">Radionucleido</Label>
              <Select value={nuclide} onValueChange={setNuclide}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {NUCLIDES.map(n => <SelectItem key={n.id} value={n.id} className="text-xs">{n.name} — Gamma={n.gamma} R-m2/hr-Ci</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-[10px]">Actividad (Ci)</Label><Input type="number" value={activity} onChange={e => setActivity(+e.target.value)} className="h-7 text-xs" /></div>
          </div>
          {selG && selG.id !== 'point' && (
            <Card className="border-slate-200"><CardContent className="p-2">
              <Label className="text-[10px] font-semibold">Dimensiones (mm o grados)</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(selG.id === 'line' || selG.id === 'cylinder' || selG.id === 'rect') && <div><Label className="text-[9px]">Largo</Label><Input type="number" value={dims.l} onChange={e => setDims(p => ({ ...p, l: +e.target.value }))} className="h-7 text-xs" /></div>}
                {(selG.id === 'disc' || selG.id === 'cylinder' || selG.id === 'cone' || selG.id === 'sphere') && <div><Label className="text-[9px]">Radio</Label><Input type="number" value={dims.r} onChange={e => setDims(p => ({ ...p, r: +e.target.value }))} className="h-7 text-xs" /></div>}
                {(selG.id === 'cylinder' || selG.id === 'rect') && <div><Label className="text-[9px]">Alto</Label><Input type="number" value={dims.h} onChange={e => setDims(p => ({ ...p, h: +e.target.value }))} className="h-7 text-xs" /></div>}
                {selG.id === 'rect' && <div><Label className="text-[9px]">Ancho</Label><Input type="number" value={dims.w} onChange={e => setDims(p => ({ ...p, w: +e.target.value }))} className="h-7 text-xs" /></div>}
                {selG.id === 'cone' && <div><Label className="text-[9px]">Angulo (deg)</Label><Input type="number" value={dims.theta} onChange={e => setDims(p => ({ ...p, theta: +e.target.value }))} className="h-7 text-xs" /></div>}
              </div>
            </CardContent></Card>
          )}
          {selN && (
            <div className="bg-gradient-to-r from-red-50 to-white rounded-lg border border-red-100 p-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                <div><span className="text-slate-500">Radionucleido:</span> <span className="font-semibold">{selN.name}</span></div>
                <div><span className="text-slate-500">Energia:</span> <span className="font-mono">{selN.e} {selN.e2 ? `+ ${selN.e2}` : ''} MeV</span></div>
                <div><span className="text-slate-500">Gamma:</span> <span className="font-mono">{selN.gamma} R.m2/hr.Ci</span></div>
                <div><span className="text-slate-500">Periodo:</span> <span className="font-mono">{selN.half} anos</span></div>
                <div><span className="text-slate-500">Actividad:</span> <span className="font-mono">{activity.toLocaleString()} Ci</span></div>
                <div><span className="text-slate-500">DR @ 1m:</span> <span className="font-mono font-bold text-red-600">{dr.toFixed(2)} mR/hr</span></div>
              </div>
            </div>
          )}
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Ref: NCRP 151 Ch.4 | ANSI/HPS N43.3 | MicroShield Source Library</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
