import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Brain, TrendingUp, DollarSign, Weight, Layers } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const MATERIALS = [
  { name: 'Ordinary Concrete', density: 2.35, cost_m3: 120, tvl_6mv: 37, constructibility: 10, availability: 10 },
  { name: 'Barite Concrete', density: 3.35, cost_m3: 350, tvl_6mv: 28, constructibility: 7, availability: 6 },
  { name: 'Lead', density: 11.34, cost_m3: 4500, tvl_6mv: 0.5, constructibility: 8, availability: 9 },
  { name: 'Steel', density: 7.87, cost_m3: 800, tvl_6mv: 8.5, constructibility: 7, availability: 9 },
  { name: 'HDPE+Bi2O3 30%', density: 3.85, cost_m3: 2800, tvl_6mv: 15, constructibility: 6, availability: 4 },
  { name: 'Magnetite Concrete', density: 4.50, cost_m3: 450, tvl_6mv: 25, constructibility: 6, availability: 5 },
];

export default function PredictiveMaterialDialog({ open, onOpenChange }: Props) {
  const [requiredThickness, setRequiredThickness] = useState('100');
  const [area, setArea] = useState('20');
  const [weight, setWeight] = useState('1.0');
  const [cost, setCost] = useState('1.0');
  const [construct, setConstruct] = useState('0.5');
  const [results, setResults] = useState<{mat: typeof MATERIALS[0]; score: number; totalCost: number; totalWeight: number; actualThickness: number}[]>([]);

  const optimize = () => {
    const req = parseFloat(requiredThickness) || 100;
    const A = parseFloat(area) || 20;
    const wW = parseFloat(weight);
    const wC = parseFloat(cost);
    const wK = parseFloat(construct);
    const scored = MATERIALS.map(m => {
      const actualThick = req; // simplified
      const volume = (actualThick / 100) * A;
      const totalWeight = volume * m.density;
      const totalCost = volume * m.cost_m3;
      const score = wW * (1 / totalWeight) * 1000 + wC * (1 / totalCost) * 10000 + wK * m.constructibility;
      return { mat: m, score, totalCost, totalWeight, actualThickness: actualThick };
    }).sort((a, b) => b.score - a.score);
    setResults(scored);
    toast.success(`Optimized: ${scored[0].mat.name} is best`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-pink-500" />Predictive Material Optimization</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">
              <div><Label className="text-xs">Thickness (cm)</Label><Input value={requiredThickness} onChange={e=>setRequiredThickness(e.target.value)} /></div>
              <div><Label className="text-xs">Area (m2)</Label><Input value={area} onChange={e=>setArea(e.target.value)} /></div>
              <div><Label className="text-xs">w(Weight)</Label><Input value={weight} onChange={e=>setWeight(e.target.value)} /></div>
              <div><Label className="text-xs">w(Cost)</Label><Input value={cost} onChange={e=>setCost(e.target.value)} /></div>
              <div><Label className="text-xs">w(Construct)</Label><Input value={construct} onChange={e=>setConstruct(e.target.value)} /></div>
            </div>
            <Button onClick={optimize} className="w-full"><TrendingUp className="h-4 w-4 mr-2" />Optimize Material</Button>
            {results.length > 0 && (
              <div className="space-y-1">
                {results.map((r, i) => (
                  <Card key={i} className={i === 0 ? 'border-l-4 border-l-emerald-500' : ''}>
                    <CardContent className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge className="text-[9px]">#{i + 1}</Badge>
                        <span className="font-medium">{r.mat.name}</span>
                      </div>
                      <div className="flex gap-3">
                        <span><DollarSign className="h-3 w-3 inline" />${r.totalCost.toFixed(0)}</span>
                        <span><Weight className="h-3 w-3 inline" />{r.totalWeight.toFixed(0)} kg</span>
                        <span><Layers className="h-3 w-3 inline" />{r.mat.tvl_6mv} cm TVL</span>
                        <Badge variant={i === 0 ? 'default' : 'outline'} className="text-[9px]">Score: {r.score.toFixed(1)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
