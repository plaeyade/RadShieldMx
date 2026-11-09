import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { Wand2, ArrowRightLeft, BookOpen } from 'lucide-react';

const SUBSTITUTES = [
  { from: 'Plomo (Pb)', to: 'Tungsteno (W)', costChange: '+320%', spaceSaving: '-65%', weightSaving: '-15%', reason: 'W tiene 1.7x densidad de Pb. Ideal cuando el espacio es critico.' },
  { from: 'Plomo (Pb)', to: 'Concreto Baritado', costChange: '-80%', spaceSaving: '+200%', weightSaving: '-40%', reason: '3.5 g/cm3 vs 11.35 g/cm3. Mucho mas espacio pero mucho mas barato.' },
  { from: 'Concreto', to: 'Concreto Baritado', costChange: '+40%', spaceSaving: '-48%', weightSaving: '+15%', reason: '3.5 vs 2.35 g/cm3. Mejor atenuacion sin llegar al plomo.' },
  { from: 'Acero', to: 'Plomo (Pb)', costChange: '+80%', spaceSaving: '-60%', weightSaving: '+10%', reason: 'Para espesores < 5mm de Pb equivalente, el acero puede ser insuficiente.' },
  { from: 'PE Borado', to: 'Concreto + PE Borado', costChange: '-30%', spaceSaving: '+150%', weightSaving: '-20%', reason: 'Capa de concreto para fotones + BPE para neutrones. Economico para bunkers.' },
];

export default function AlaraWizardDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.alaraWizard));
  const close = () => useAppStore.getState().close('alaraWizard');
  const [currentMat, setCurrentMat] = useState('Plomo (Pb)');
  const [thickness, setThickness] = useState(3.0);
  const [area, setArea] = useState(20);
  const [budgetPriority, setBudgetPriority] = useState(50);

  const suggestions = useMemo(() => {
    return SUBSTITUTES.filter(s => s.from === currentMat).map(s => {
      const costDelta = (+s.costChange.replace(/[%+]/g, '') / 100) * thickness * area * (budgetPriority / 50);
      return { ...s, costDelta: costDelta.toFixed(0) };
    });
  }, [currentMat, thickness, area, budgetPriority]);

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wand2 className="w-5 h-5 text-[#10b981]" /> ALARA Cost-Benefit Wizard — v122
            <span className="text-[10px] font-mono text-slate-400">As Low As Reasonably Achievable</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div><Label className="text-[10px]">Material actual</Label>
              <select value={currentMat} onChange={e => setCurrentMat(e.target.value)} className="w-full text-xs border rounded h-7 px-1">
                {['Plomo (Pb)', 'Concreto', 'Acero', 'PE Borado'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div><Label className="text-[10px]">Espesor (mm)</Label><Input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} className="h-7 text-xs" /></div>
            <div><Label className="text-[10px]">Area (m²)</Label><Input type="number" value={area} onChange={e => setArea(+e.target.value)} className="h-7 text-xs" /></div>
            <div><Label className="text-[10px]">Prioridad presupuesto (%)</Label><Input type="range" min={0} max={100} value={budgetPriority} onChange={e => setBudgetPriority(+e.target.value)} className="h-7" /></div>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-white rounded-lg border border-emerald-100 p-2">
            <div className="text-[10px] text-emerald-700 font-semibold">Configuracion actual: {currentMat} — {thickness}mm — {area}m² — Budget priority: {budgetPriority}%</div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700">Sugerencias de sustitucion</div>
            {suggestions.length === 0 && <div className="text-[10px] text-slate-400">No hay sugerencias para este material. Seleccione otro.</div>}
            {suggestions.map((s, i) => (
              <Card key={i} className="border-slate-200"><CardContent className="p-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-slate-600">{s.from}</span>
                  <ArrowRightLeft className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-700">{s.to}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[9px] mb-1">
                  <div><span className="text-slate-500">Costo:</span> <span className={`font-mono font-semibold ${s.costChange.startsWith('+') ? 'text-red-500' : 'text-emerald-600'}`}>{s.costChange}</span></div>
                  <div><span className="text-slate-500">Espacio:</span> <span className="font-mono font-semibold text-blue-600">{s.spaceSaving}</span></div>
                  <div><span className="text-slate-500">Peso:</span> <span className="font-mono font-semibold text-purple-600">{s.weightSaving}</span></div>
                </div>
                <div className="text-[9px] text-slate-500 bg-slate-50 p-1 rounded">{s.reason}</div>
              </CardContent></Card>
            ))}
          </div>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Ref: NCRP 151 ALARA Principle | ICRP 103 | Mosaics Atomics Material Advisor</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
