import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Box, Layers, Ruler, Calculator, Wand2, ChevronRight, Zap, Shield,
  Atom, Database, GitBranch, Copy, Play, RotateCcw
} from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

interface QuickCalc {
  id: string; name: string; icon: any; inputs: string[]; formula: (vals: number[]) => number; unit: string;
}

const QUICK_CALCS: QuickCalc[] = [
  {
    id: 'tvl-to-thickness', name: 'TVL → Thickness', icon: Layers,
    inputs: ['Number of TVLs', 'TVL value (cm)'], formula: ([n, tvl]) => n * tvl, unit: 'cm',
  },
  {
    id: 'hvl-to-transmission', name: 'HVL → Transmission', icon: Shield,
    inputs: ['Number of HVLs'], formula: ([n]) => Math.pow(0.5, n), unit: 'fraction',
  },
  {
    id: 'tvl-to-transmission', name: 'TVL → Transmission', icon: Shield,
    inputs: ['Number of TVLs'], formula: ([n]) => Math.pow(0.1, n), unit: 'fraction',
  },
  {
    id: 'inverse-square', name: 'Inverse Square Law', icon: Calculator,
    inputs: ['Dose at d1 (uSv/h)', 'd1 (m)', 'd2 (m)'], formula: ([d1, d1m, d2m]) => d1 * (d1m * d1m) / (d2m * d2m), unit: 'uSv/h',
  },
  {
    id: 'workload-to-hours', name: 'Workload → Hours', icon: Play,
    inputs: ['Workload (Gy/week)', 'Dose per patient (Gy)'], formula: ([w, dp]) => w / dp, unit: 'patients/week',
  },
  {
    id: 'decay-activity', name: 'Radioactive Decay', icon: Atom,
    inputs: ['Initial A (MBq)', 'Half-life (h)', 'Time (h)'], formula: ([a0, t12, t]) => a0 * Math.pow(0.5, t / t12), unit: 'MBq',
  },
  {
    id: 'barrier-transmission', name: 'Barrier Transmission', icon: Layers,
    inputs: ['Thickness (cm)', 'HVL (cm)'], formula: ([t, hvl]) => Math.pow(0.5, t / hvl), unit: 'fraction',
  },
  {
    id: 'dose-to-tvl', name: 'Dose → TVLs needed', icon: Ruler,
    inputs: ['Current dose (uSv/h)', 'Desired dose (uSv/h)'], formula: ([c, d]) => Math.log10(c / d), unit: 'TVLs',
  },
  {
    id: 'neutron-tvl', name: 'Neutron TVL → Thickness', icon: Atom,
    inputs: ['TVL (cm)', 'Dose reduction factor'], formula: ([tvl, drf]) => Math.log10(drf) * tvl, unit: 'cm',
  },
  {
    id: 'skyshine', name: 'Skyshine Factor', icon: Zap,
    inputs: ['Roof attenuation', 'Albedo coeff', 'Distance (m)'], formula: ([ra, al, d]) => ra * al * 100 / (d * d), unit: 'fraction',
  },
];

export default function ModelingToolboxDialog({ open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = useState('calculators');
  const [calcValues, setCalcValues] = useState<Record<string, string[]>>({});
  const [calcResults, setCalcResults] = useState<Record<string, number>>({});

  const runCalc = (calc: QuickCalc) => {
    const vals = (calcValues[calc.id] || []).map(Number);
    if (vals.some(isNaN)) { toast.error('Enter all values'); return; }
    try {
      const result = calc.formula(vals);
      setCalcResults(prev => ({ ...prev, [calc.id]: result }));
    } catch { toast.error('Calculation error'); }
  };

  const copyResult = (val: number, unit: string) => {
    navigator.clipboard.writeText(`${val.toFixed(4)} ${unit}`);
    toast.success('Copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[900px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Box className="w-5 h-5 text-indigo-500" />
            Modeling Toolbox
            <Badge variant="outline" className="text-[10px]">v26</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-3 w-full shrink-0">
            <TabsTrigger value="calculators" className="text-xs gap-1"><Calculator className="w-3.5 h-3.5" />Quick Calculators</TabsTrigger>
            <TabsTrigger value="formulas" className="text-xs gap-1"><GitBranch className="w-3.5 h-3.5" />Formula Reference</TabsTrigger>
            <TabsTrigger value="conversion" className="text-xs gap-1"><RotateCcw className="w-3.5 h-3.5" />Unit Conversion</TabsTrigger>
          </TabsList>

          <TabsContent value="calculators" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 gap-2 pr-2">
                {QUICK_CALCS.map(calc => {
                  const Icon = calc.icon;
                  return (
                    <Card key={calc.id} className="hover:shadow-md transition-all">
                      <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-primary" />{calc.name}</CardTitle></CardHeader>
                      <CardContent className="space-y-1.5">
                        {calc.inputs.map((label, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-24 shrink-0">{label}</span>
                            <input type="number" className="flex-1 h-7 px-2 border rounded text-xs"
                              value={calcValues[calc.id]?.[i] || ''}
                              onChange={e => {
                                const newVals = [...(calcValues[calc.id] || [])];
                                newVals[i] = e.target.value;
                                setCalcValues(prev => ({ ...prev, [calc.id]: newVals }));
                              }} />
                          </div>
                        ))}
                        <div className="flex items-center gap-2 pt-1">
                          <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => runCalc(calc)}><Play className="w-3 h-3" />Calc</Button>
                          {calcResults[calc.id] !== undefined && (
                            <div className="flex items-center gap-1">
                              <Badge className="text-[10px] font-mono">{calcResults[calc.id].toFixed(4)} {calc.unit}</Badge>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => copyResult(calcResults[calc.id], calc.unit)}><Copy className="w-3 h-3" /></Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="formulas" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-2 text-xs">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">NCRP 151 Shielding</CardTitle></CardHeader><CardContent className="space-y-1 font-mono text-[10px]">
                  <p>B = P × d² / (W × U × T)</p>
                  <p>K_sec = B_pri × (1 + α × A₀/A₁) where α = 10⁻³</p>
                  <p>t = TVL × log₁₀(1/B)</p>
                </CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Neutron Shielding</CardTitle></CardHeader><CardContent className="space-y-1 font-mono text-[10px]">
                  <p>I = I₀ × e^(-ΣR × x)</p>
                  <p>n_TVL = x × ΣR / ln(10)</p>
                  <p>Maze: D = S × (0.25)^n × e^(-μ×L)</p>
                </CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Inverse Square Law</CardTitle></CardHeader><CardContent className="space-y-1 font-mono text-[10px]">
                  <p>D₂ = D₁ × (d₁/d₂)²</p>
                  <p>Γ = 0.5 × W_γ × E_γ × 1.602×10⁻¹³ / 4π</p>
                </CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Radioactive Decay</CardTitle></CardHeader><CardContent className="space-y-1 font-mono text-[10px]">
                  <p>A(t) = A₀ × (1/2)^(t/T½)</p>
                  <p>λ = ln(2) / T½</p>
                  <p>N(t) = N₀ × e^(-λt)</p>
                </CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Monte Carlo</CardTitle></CardHeader><CardContent className="space-y-1 font-mono text-[10px]">
                  <p>μ = Σᵢ ρᵢ × σᵢ</p>
                  <p>τ = -ln(ξ) / μ</p>
                  <p>σ_KN(E,θ) = (rₑ²/2)(E'/E)²(E/E' + E'/E - sin²θ)</p>
                </CardContent></Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="conversion" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 gap-2 pr-2">
                <Card><CardContent className="p-3"><p className="text-xs font-semibold mb-1">Activity</p><div className="text-[10px] space-y-0.5">1 Ci = 37 GBq = 37000 MBq<br/>1 GBq = 27.03 mCi<br/>1 mCi = 37 MBq</div></CardContent></Card>
                <Card><CardContent className="p-3"><p className="text-xs font-semibold mb-1">Dose</p><div className="text-[10px] space-y-0.5">1 Sv = 100 rem<br/>1 Gy = 100 rad<br/>1 mSv/wk = 52 mSv/yr</div></CardContent></Card>
                <Card><CardContent className="p-3"><p className="text-xs font-semibold mb-1">Distance</p><div className="text-[10px] space-y-0.5">1 m = 100 cm<br/>1 ft = 30.48 cm<br/>1 in = 2.54 cm</div></CardContent></Card>
                <Card><CardContent className="p-3"><p className="text-xs font-semibold mb-1">Energy</p><div className="text-[10px] space-y-0.5">1 MeV = 10⁶ eV<br/>1 keV = 10³ eV<br/>E=hc/λ (photon)</div></CardContent></Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
