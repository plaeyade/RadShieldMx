import { useState, useMemo } from 'react';
import '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { optimizeCost } from '@/hooks/useCostOptimizer';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export default function CostOptimizerDialog({ open, onOpenChange }: Props) {
  const [kerma, setKerma] = useState(5.0);
  const [target, setTarget] = useState(0.02);
  const [energy, setEnergy] = useState(6);
  const [length, setLength] = useState(5.0);

  const result = useMemo(() => optimizeCost(kerma, target, energy, length), [kerma, target, energy, length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Optimizador de Costos</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Kerma sin blindaje (mSv/sem)</Label><Input type="number" step="0.1" value={kerma} onChange={e => setKerma(parseFloat(e.target.value))} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Objetivo (mSv/sem)</Label><Input type="number" step="0.001" value={target} onChange={e => setTarget(parseFloat(e.target.value))} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Energia (MV)</Label><Input type="number" value={energy} onChange={e => setEnergy(parseFloat(e.target.value))} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Longitud barrera (m)</Label><Input type="number" step="0.1" value={length} onChange={e => setLength(parseFloat(e.target.value))} className="h-8 text-sm" /></div>
        </div>

        <div className="space-y-1 border-t pt-2">
          <div className="flex items-center gap-2">
            <Badge className="text-xs" style={{ background: result.bestOption.color }}>MEJOR OPCION</Badge>
            <span className="text-sm font-bold">{result.bestOption.materialName}: {result.bestOption.thickness_mm.toFixed(1)} mm = ${result.bestOption.costUSD.toFixed(2)}</span>
          </div>
          <p className="text-xs text-green-700">Ahorro vs concreto: {result.savingsPercent_vs_concrete.toFixed(1)}%</p>
          <div className="text-xs text-gray-500 mt-2 space-y-0.5">
            {result.options.slice(0, 6).map((o, i) => (
              <div key={i} className="flex justify-between"><span>{o.materialName}</span><span>{o.thickness_mm.toFixed(1)} mm | ${o.costUSD.toFixed(2)}</span></div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
