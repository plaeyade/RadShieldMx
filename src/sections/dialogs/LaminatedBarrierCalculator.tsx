/**
 * LaminatedBarrierCalculator — McGinley Chapter 6
 * Design of barriers with multiple material layers (e.g., Pb + Concrete)
 * B_total = B1 × B2 × ... × Bn where each Bi = 10^(-xi/TVLi)
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  calculateLaminatedTransmission,
  type LaminatedLayer,
} from '@/lib/mcginleyData';
import { MATERIALS } from '@/types/radshield';
import {
  Layers, Plus, Trash2, Download, Info
} from 'lucide-react';

const ENERGY_KEYS = ['1.25', '6', '10', '15', '18', '24'];

interface LaminatedBarrierCalculatorProps {
  open: boolean;
  onClose: () => void;
}

export default function LaminatedBarrierCalculator({ open, onClose }: LaminatedBarrierCalculatorProps) {
  const [energyKey, setEnergyKey] = useState('6');
  const [designGoal, setDesignGoal] = useState(0.02);
  const [unshieldedKerma, setUnshieldedKerma] = useState(1.0);
  const [layers, setLayers] = useState<LaminatedLayer[]>([
    { material: 'PB', thickness_mm: 2.0, tvl_mm: 16.6 },
    { material: 'CONCRETE235', thickness_mm: 200.0, tvl_mm: 370 },
  ]);

  const targetB = useMemo(() => {
    return designGoal / (unshieldedKerma || 1);
  }, [designGoal, unshieldedKerma]);

  const actualB = useMemo(() => calculateLaminatedTransmission(layers), [layers]);

  const nTVLs = useMemo(() => -Math.log10(actualB), [actualB]);

  const marginFactor = useMemo(() => {
    if (actualB <= 0 || targetB <= 0) return 0;
    return targetB / actualB;
  }, [actualB, targetB]);

  const addLayer = () => {
    const newMat = MATERIALS.find(m => m.code !== layers[layers.length - 1]?.material) || MATERIALS[0];
    const tvl = newMat?.TVL_mm?.[energyKey] || 370;
    setLayers([...layers, { material: newMat?.code || 'CONCRETE235', thickness_mm: 10, tvl_mm: tvl }]);
  };

  const removeLayer = (index: number) => {
    setLayers(layers.filter((_, i) => i !== index));
  };

  const updateLayer = (index: number, updates: Partial<LaminatedLayer>) => {
    const next = [...layers];
    next[index] = { ...next[index], ...updates };
    if (updates.material) {
      const mat = MATERIALS.find(m => m.code === updates.material);
      if (mat) next[index].tvl_mm = mat.TVL_mm?.[energyKey] || 370;
    }
    setLayers(next);
  };

  const exportCSV = () => {
    let csv = 'Layer,Material,Thickness_mm,TVL_mm,Transmission\n';
    layers.forEach((l, i) => {
      const b = Math.pow(10, -l.thickness_mm / (l.tvl_mm || 1));
      csv += `${i + 1},${l.material},${l.thickness_mm},${l.tvl_mm},${b.toExponential(4)}\n`;
    });
    csv += `\nTOTAL,,,,${actualB.toExponential(4)}\n`;
    csv += `Target B,,,,${targetB.toExponential(4)}\n`;
    csv += `Margin Factor,,,,${marginFactor.toFixed(2)}x\n`;
    csv += `nTVLs,,,,${nTVLs.toFixed(2)}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laminated_barrier_${energyKey}MV.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Layers className="w-5 h-5 text-[#f97316]" />
            Laminated Barrier Calculator
            <Badge variant="outline" className="text-[10px] ml-2">McGinley Ch.6</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Design barriers with multiple material layers. Total transmission B_total = B₁ × B₂ × ... × Bₙ where each Bᵢ = 10^(-xᵢ/TVLᵢ). Each layer attenuates independently. Common: lead sheet (2-3 mm) + concrete backing for cost optimization.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-[10px] text-slate-500">Energy (MV)</Label>
            <Select value={energyKey} onValueChange={(v) => {
              setEnergyKey(v);
              // Update all TVLs
              setLayers(layers.map(l => {
                const mat = MATERIALS.find(m => m.code === l.material);
                return { ...l, tvl_mm: mat?.TVL_mm?.[v] || l.tvl_mm };
              }));
            }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENERGY_KEYS.map(k => <SelectItem key={k} value={k}>{k} MV</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] text-slate-500">Design Goal (mSv/wk)</Label>
            <Input type="number" value={designGoal} onChange={e => setDesignGoal(Number(e.target.value))}
              className="h-8 text-xs" min={0.001} step={0.001} />
          </div>
          <div>
            <Label className="text-[10px] text-slate-500">Unshielded Kerma (mSv/wk)</Label>
            <Input type="number" value={unshieldedKerma} onChange={e => setUnshieldedKerma(Number(e.target.value))}
              className="h-8 text-xs" min={0.001} step={0.1} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className={`rounded-lg p-2 border text-center ${marginFactor >= 1 ? 'bg-green-50 border-green-200' : marginFactor >= 0.5 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <div className="text-lg font-bold">{actualB.toExponential(2)}</div>
            <div className="text-[9px] text-slate-500">Actual B</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 border text-center">
            <div className="text-lg font-bold">{targetB.toExponential(2)}</div>
            <div className="text-[9px] text-slate-500">Target B</div>
          </div>
          <div className={`rounded-lg p-2 border text-center ${marginFactor >= 1 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="text-lg font-bold">{marginFactor.toFixed(2)}x</div>
            <div className="text-[9px] text-slate-500">Margin</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 border text-center">
            <div className="text-lg font-bold">{nTVLs.toFixed(2)}</div>
            <div className="text-[9px] text-slate-500">n TVLs</div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-semibold">Barrier Layers</Label>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addLayer}>
              <Plus className="w-3 h-3 mr-1" /> Add Layer
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">#</TableHead>
                <TableHead className="text-[10px]">Material</TableHead>
                <TableHead className="text-[10px] text-right">Thickness (mm)</TableHead>
                <TableHead className="text-[10px] text-right">TVL (mm)</TableHead>
                <TableHead className="text-[10px] text-right">B</TableHead>
                <TableHead className="text-[10px] text-right">n TVL</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {layers.map((layer, i) => {
                const b = Math.pow(10, -layer.thickness_mm / (layer.tvl_mm || 1));
                const n = layer.thickness_mm / (layer.tvl_mm || 1);
                return (
                  <TableRow key={i}>
                    <TableCell className="text-[10px]">{i + 1}</TableCell>
                    <TableCell>
                      <Select value={layer.material} onValueChange={(v) => updateLayer(i, { material: v })}>
                        <SelectTrigger className="h-7 text-[10px] w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MATERIALS.map(m => <SelectItem key={m.code} value={m.code}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={layer.thickness_mm} onChange={e => updateLayer(i, { thickness_mm: Number(e.target.value) })}
                        className="h-7 text-[10px] w-20 text-right" min={0} step={0.1} />
                    </TableCell>
                    <TableCell className="text-[10px] text-right font-mono">{layer.tvl_mm.toFixed(1)}</TableCell>
                    <TableCell className="text-[10px] text-right font-mono">{b.toExponential(3)}</TableCell>
                    <TableCell className="text-[10px] text-right font-mono">{n.toFixed(3)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeLayer(i)}>
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <Button variant="outline" size="sm" className="text-xs w-full" onClick={exportCSV}>
          <Download className="w-3 h-3 mr-1" /> Export CSV
        </Button>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700">
          <b>McGinley (2002) Chapter 6:</b> Primary barriers containing metal. For laminated barriers,
          each material layer is considered independently. Total attenuation is the product of individual
          attenuations. This approach is conservative because it ignores the buildup of secondary radiation
          at material interfaces. For Pb+Concrete at 6 MV: TVL_Pb ≈ 16.6 mm, TVL_Concrete ≈ 370 mm.
        </div>
      </DialogContent>
    </Dialog>
  );
}
