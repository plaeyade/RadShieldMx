import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import '@/components/ui/separator';
import '@/components/ui/button';
import '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitCompare, ArrowRight } from 'lucide-react';

interface CompareScenario {
  id: string;
  name: string;
  description: string;
  barriers: Array<{
    name: string;
    thickness_cm: number;
    material: string;
    kerma_mSv_wk: number;
    cost_usd: number;
  }>;
  totalCost: number;
  avgDose: number;
  maxDose: number;
  compliance: 'pass' | 'warn' | 'fail';
}

const SCENARIOS: CompareScenario[] = [
  {
    id: 'con-maze',
    name: 'Con Laberinto',
    description: 'Blindaje tradicional con laberinto de acceso',
    compliance: 'pass',
    avgDose: 0.012,
    maxDose: 0.045,
    totalCost: 48500,
    barriers: [
      { name: 'Pared Primaria N', thickness_cm: 120, material: 'Concreto', kerma_mSv_wk: 0.020, cost_usd: 15000 },
      { name: 'Pared Secundaria E', thickness_cm: 65, material: 'Concreto', kerma_mSv_wk: 0.012, cost_usd: 5200 },
      { name: 'Techo', thickness_cm: 95, material: 'Concreto', kerma_mSv_wk: 0.008, cost_usd: 8500 },
      { name: 'Puerta Laberinto', thickness_cm: 2, material: 'Pb+BaB2O4', kerma_mSv_wk: 0.045, cost_usd: 6800 },
      { name: 'Suelo', thickness_cm: 85, material: 'Concreto', kerma_mSv_wk: 0.003, cost_usd: 7800 },
      { name: 'Pared Control', thickness_cm: 40, material: 'Concreto', kerma_mSv_wk: 0.006, cost_usd: 3200 },
    ],
  },
  {
    id: 'sin-maze',
    name: 'Sin Laberinto (Puerta Directa)',
    description: 'Sin laberinto, puerta blindada pesada directa',
    compliance: 'pass',
    avgDose: 0.018,
    maxDose: 0.042,
    totalCost: 52300,
    barriers: [
      { name: 'Pared Primaria N', thickness_cm: 120, material: 'Concreto', kerma_mSv_wk: 0.020, cost_usd: 15000 },
      { name: 'Pared Secundaria E', thickness_cm: 65, material: 'Concreto', kerma_mSv_wk: 0.012, cost_usd: 5200 },
      { name: 'Techo', thickness_cm: 95, material: 'Concreto', kerma_mSv_wk: 0.008, cost_usd: 8500 },
      { name: 'Puerta Blindada', thickness_cm: 8, material: 'Pb+Fe', kerma_mSv_wk: 0.042, cost_usd: 12600 },
      { name: 'Suelo', thickness_cm: 85, material: 'Concreto', kerma_mSv_wk: 0.003, cost_usd: 7800 },
      { name: 'Pared Control', thickness_cm: 40, material: 'Concreto', kerma_mSv_wk: 0.006, cost_usd: 3200 },
    ],
  },
  {
    id: 'concreto-vs-barita',
    name: 'Concreto de Barita',
    description: 'Concreto de barita (3.2 g/cm3) vs concreto ordinario',
    compliance: 'pass',
    avgDose: 0.011,
    maxDose: 0.038,
    totalCost: 61200,
    barriers: [
      { name: 'Pared Primaria N', thickness_cm: 85, material: 'Barita', kerma_mSv_wk: 0.018, cost_usd: 19500 },
      { name: 'Pared Secundaria E', thickness_cm: 48, material: 'Barita', kerma_mSv_wk: 0.010, cost_usd: 7800 },
      { name: 'Techo', thickness_cm: 68, material: 'Barita', kerma_mSv_wk: 0.007, cost_usd: 10200 },
      { name: 'Puerta Laberinto', thickness_cm: 2, material: 'Pb+BaB2O4', kerma_mSv_wk: 0.038, cost_usd: 6800 },
      { name: 'Suelo', thickness_cm: 62, material: 'Barita', kerma_mSv_wk: 0.003, cost_usd: 11200 },
      { name: 'Pared Control', thickness_cm: 30, material: 'Barita', kerma_mSv_wk: 0.005, cost_usd: 5700 },
    ],
  },
  {
    id: '+20-workload',
    name: 'Carga +20% (Proyeccion)',
    description: 'Incremento de carga de trabajo proyectado',
    compliance: 'warn',
    avgDose: 0.024,
    maxDose: 0.054,
    totalCost: 48500,
    barriers: [
      { name: 'Pared Primaria N', thickness_cm: 120, material: 'Concreto', kerma_mSv_wk: 0.024, cost_usd: 15000 },
      { name: 'Pared Secundaria E', thickness_cm: 65, material: 'Concreto', kerma_mSv_wk: 0.014, cost_usd: 5200 },
      { name: 'Techo', thickness_cm: 95, material: 'Concreto', kerma_mSv_wk: 0.010, cost_usd: 8500 },
      { name: 'Puerta Laberinto', thickness_cm: 2, material: 'Pb+BaB2O4', kerma_mSv_wk: 0.054, cost_usd: 6800 },
      { name: 'Suelo', thickness_cm: 85, material: 'Concreto', kerma_mSv_wk: 0.004, cost_usd: 7800 },
      { name: 'Pared Control', thickness_cm: 40, material: 'Concreto', kerma_mSv_wk: 0.007, cost_usd: 3200 },
    ],
  },
];

interface CompareModeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function CompareModeDialog({ open, onOpenChange }: CompareModeDialogProps) {
  const [scenarioA, setScenarioA] = useState(SCENARIOS[0].id);
  const [scenarioB, setScenarioB] = useState(SCENARIOS[1].id);

  const a = SCENARIOS.find(s => s.id === scenarioA);
  const b = SCENARIOS.find(s => s.id === scenarioB);
  if (!a || !b) return null;

  const costDiff = b.totalCost - a.totalCost;
  const doseDiff = ((b.avgDose - a.avgDose) / a.avgDose) * 100;

  const getComplianceCfg = (c: string) => {
    if (c === 'pass') return { label: 'PASS', class: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
    if (c === 'warn') return { label: 'WARN', class: 'bg-amber-100 text-amber-700 border-amber-300' };
    return { label: 'FAIL', class: 'bg-red-100 text-red-700 border-red-300' };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <GitCompare className="w-5 h-5 text-blue-500" />
            Compare Mode — Escenarios Lado a Lado
          </DialogTitle>
        </DialogHeader>

        {/* Selectors */}
        <div className="px-6 pb-3 grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase">Escenario A</label>
            <Select value={scenarioA} onValueChange={setScenarioA}>
              <SelectTrigger className="h-8 text-xs mt-0.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCENARIOS.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase">Escenario B</label>
            <Select value={scenarioB} onValueChange={setScenarioB}>
              <SelectTrigger className="h-8 text-xs mt-0.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCENARIOS.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary diff cards */}
        <div className="px-6 pb-3 grid grid-cols-4 gap-2">
          {[
            { label: 'Costo Total', a: `$${a.totalCost.toLocaleString()}`, b: `$${b.totalCost.toLocaleString()}`, diff: costDiff, fmt: (v: number) => `$${Math.abs(v).toLocaleString()}`, pct: (costDiff / a.totalCost) * 100 },
            { label: 'Dosis Promedio', a: `${a.avgDose.toFixed(3)} mSv/sem`, b: `${b.avgDose.toFixed(3)} mSv/sem`, diff: doseDiff, fmt: (v: number) => `${Math.abs(v).toFixed(1)}%`, pct: doseDiff },
            { label: 'Dosis Maxima', a: `${a.maxDose.toFixed(3)}`, b: `${b.maxDose.toFixed(3)}`, diff: ((b.maxDose - a.maxDose) / a.maxDose) * 100, fmt: (v: number) => `${Math.abs(v).toFixed(1)}%`, pct: ((b.maxDose - a.maxDose) / a.maxDose) * 100 },
            { label: 'Cumplimiento', a: a.compliance.toUpperCase(), b: b.compliance.toUpperCase(), diff: 0, fmt: () => '', pct: 0 },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 rounded-lg p-2.5">
              <div className="text-[10px] text-slate-500 font-medium">{item.label}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-mono font-bold text-slate-700">{item.a}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="text-xs font-mono font-bold text-slate-700">{item.b}</span>
              </div>
              {item.pct !== 0 && (
                <div className={`text-[10px] font-medium mt-0.5 ${item.pct > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {item.pct > 0 ? '+' : ''}{item.fmt(item.diff)} {item.pct > 0 ? '(mayor)' : '(menor)'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Split comparison table */}
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          {/* Scenario A */}
          <div className="border rounded-lg">
            <div className="px-3 py-2 bg-blue-50 border-b rounded-t-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-800">{a.name}</span>
                <Badge className={`${getComplianceCfg(a.compliance).class} text-[9px] h-4`}>{getComplianceCfg(a.compliance).label}</Badge>
              </div>
              <p className="text-[10px] text-blue-600 mt-0.5">{a.description}</p>
            </div>
            <ScrollArea className="h-[250px]">
              <div className="p-2 space-y-1">
                {a.barriers.map(b => (
                  <div key={b.name} className="flex items-center justify-between text-xs py-1 px-2 hover:bg-slate-50 rounded">
                    <span className="font-medium">{b.name}</span>
                    <div className="text-right">
                      <span className="font-mono">{b.thickness_cm} cm</span>
                      <span className="text-slate-400 ml-1">{b.material}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="px-3 py-2 border-t bg-slate-50 rounded-b-lg">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Total: <strong className="text-slate-700">${a.totalCost.toLocaleString()}</strong></span>
                <span className="text-slate-500">Dosis max: <strong className="text-slate-700">{a.maxDose.toFixed(3)} mSv/sem</strong></span>
              </div>
            </div>
          </div>

          {/* Scenario B */}
          <div className="border rounded-lg">
            <div className="px-3 py-2 bg-violet-50 border-b rounded-t-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-800">{b.name}</span>
                <Badge className={`${getComplianceCfg(b.compliance).class} text-[9px] h-4`}>{getComplianceCfg(b.compliance).label}</Badge>
              </div>
              <p className="text-[10px] text-violet-600 mt-0.5">{b.description}</p>
            </div>
            <ScrollArea className="h-[250px]">
              <div className="p-2 space-y-1">
                {b.barriers.map(bar => (
                  <div key={bar.name} className="flex items-center justify-between text-xs py-1 px-2 hover:bg-slate-50 rounded">
                    <span className="font-medium">{bar.name}</span>
                    <div className="text-right">
                      <span className="font-mono">{bar.thickness_cm} cm</span>
                      <span className="text-slate-400 ml-1">{bar.material}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="px-3 py-2 border-t bg-slate-50 rounded-b-lg">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Total: <strong className="text-slate-700">${b.totalCost.toLocaleString()}</strong></span>
                <span className="text-slate-500">Dosis max: <strong className="text-slate-700">{b.maxDose.toFixed(3)} mSv/sem</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="px-6 pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-blue-800 mb-1">Recomendacion del sistema</h4>
            <p className="text-xs text-blue-700">
              El escenario <strong>&quot;{costDiff > 0 ? a.name : b.name}&quot;</strong> es mas economico por ${Math.abs(costDiff).toLocaleString()} ({Math.abs((costDiff / a.totalCost) * 100).toFixed(1)}%).
              {' '}
              {(a.compliance === 'pass' && b.compliance === 'pass') ? 'Ambos escenarios cumplen con los limites de diseno.' : 'Se recomienda revisar el cumplimiento normativo.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
