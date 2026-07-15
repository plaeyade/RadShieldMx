/**
 * SecondaryBarrierAlbedoDialog — B.12: Albedo method for secondary barriers
 * NCRP 144 (2003) §4.3 — Multiple surface reflection in complex rooms
 * 
 * Fundamento: NCRP 144 §4.3 — The albedo method accounts for radiation
 * reflected by multiple surfaces before reaching the secondary barrier.
 * Essential for rooms with complex geometries (L-shapes, multiple partitions).
 * 
 * Ecuación: H_albedo = H_primary × α₁ × (d₁/d₂)² × α₂ × (d₂/d₃)² × ...
 * donde α = albedo (reflection coefficient) of each surface
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, BookOpen, Layers } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

// Albedo coefficients from NCRP 144 Table 4.2
const ALBEDO_DATA: Record<string, { material: string; albedo_6MV: number; albedo_18MV: number }> = {
  'CONCRETE': { material: 'Ordinary concrete', albedo_6MV: 0.15, albedo_18MV: 0.12 },
  'STEEL': { material: 'Steel', albedo_6MV: 0.35, albedo_18MV: 0.30 },
  'LEAD': { material: 'Lead', albedo_6MV: 0.50, albedo_18MV: 0.45 },
  'GYPSUM': { material: 'Gypsum board', albedo_6MV: 0.08, albedo_18MV: 0.06 },
  'TILE': { material: 'Ceramic tile', albedo_6MV: 0.10, albedo_18MV: 0.08 },
  'WATER': { material: 'Water phantom', albedo_6MV: 0.05, albedo_18MV: 0.04 },
};

interface ReflectionSurface {
  id: number;
  material: string;
  distanceFromSource_m: number;
  distanceToBarrier_m: number;
}

function calculateAlbedoDose(
  primaryDose: number,
  surfaces: ReflectionSurface[],
  energy: '6MV' | '18MV'
): number {
  let dose = primaryDose;
  const key = energy === '6MV' ? 'albedo_6MV' : 'albedo_18MV';
  for (const s of surfaces) {
    const alpha = ALBEDO_DATA[s.material]?.[key] || 0.1;
    const distRatio = s.distanceFromSource_m / s.distanceToBarrier_m;
    dose *= alpha * distRatio * distRatio;
  }
  return dose;
}

export default function SecondaryBarrierAlbedoDialog({ open, onClose }: Props) {
  const [primaryDose, setPrimaryDose] = useState(1.0);
  const [energy, setEnergy] = useState<'6MV' | '18MV'>('6MV');
  const [surfaces, setSurfaces] = useState<ReflectionSurface[]>([
    { id: 1, material: 'CONCRETE', distanceFromSource_m: 3.0, distanceToBarrier_m: 2.5 },
    { id: 2, material: 'STEEL', distanceFromSource_m: 2.5, distanceToBarrier_m: 2.0 },
  ]);

  const result = useMemo(() => {
    const albedoDose = calculateAlbedoDose(primaryDose, surfaces, energy);
    const reduction = ((primaryDose - albedoDose) / primaryDose) * 100;
    return { albedoDose, reduction };
  }, [primaryDose, surfaces, energy]);

  const addSurface = () => {
    setSurfaces(prev => [...prev, { id: Date.now(), material: 'CONCRETE', distanceFromSource_m: 2.0, distanceToBarrier_m: 2.0 }]);
  };

  const removeSurface = (id: number) => {
    setSurfaces(prev => prev.filter(s => s.id !== id));
  };

  const updateSurface = (id: number, field: keyof ReflectionSurface, value: any) => {
    setSurfaces(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const exportCSV = () => {
    let csv = 'Superficie,Material,Albedo_6MV,Albedo_18MV,d_fuente_m,d_barrera_m\n';
    surfaces.forEach((s, i) => {
      const a = ALBEDO_DATA[s.material];
      csv += `${i+1},${a.material},${a.albedo_6MV},${a.albedo_18MV},${s.distanceFromSource_m},${s.distanceToBarrier_m}\n`;
    });
    csv += `RESULTADO,Dosis Albedo (mSv/sem),${result.albedoDose.toExponential(4)},Reduccion,${result.reduction.toFixed(2)}%\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'albedo_calculation.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-500" />
            Secondary Barrier Albedo Method
            <Badge variant="outline" className="text-[10px]">B.12</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-3 text-[11px] text-cyan-700">
          <BookOpen className="w-4 h-4 inline mr-1" />
          <b>NCRP 144 (2003) §4.3:</b> Método de albedo para blindajes secundarios en salas
          complejas con múltiples superficies reflectantes. La dosis alcanza la barrera secundaria
          después de reflejarse en una o más superficies, atenuándose por el coeficiente de albedo
          de cada superficie y la ley del inverso del cuadrado entre reflexiones.
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-[11px]">Dosis primaria (mSv/sem)</Label><Input type="number" step={0.01} value={primaryDose} onChange={e => setPrimaryDose(Number(e.target.value))} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Energía</Label>
            <select value={energy} onChange={e => setEnergy(e.target.value as '6MV' | '18MV')} className="w-full h-8 text-xs border rounded px-2">
              <option value="6MV">6 MV</option>
              <option value="18MV">18 MV</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-600">Superficies de reflexión ({surfaces.length})</div>
        {surfaces.map((s, i) => (
          <div key={s.id} className="bg-slate-50 rounded p-2 border grid grid-cols-4 gap-2 items-end">
            <div className="text-[10px] text-slate-400 col-span-4">Superficie {i+1}</div>
            <div>
              <Label className="text-[9px]">Material</Label>
              <select value={s.material} onChange={e => updateSurface(s.id, 'material', e.target.value)} className="w-full h-7 text-[10px] border rounded px-1">
                {Object.entries(ALBEDO_DATA).map(([k, v]) => <option key={k} value={k}>{v.material} (α={energy==='6MV'?v.albedo_6MV:v.albedo_18MV})</option>)}
              </select>
            </div>
            <div><Label className="text-[9px]">d fuente (m)</Label><Input type="number" step={0.1} value={s.distanceFromSource_m} onChange={e => updateSurface(s.id, 'distanceFromSource_m', Number(e.target.value))} className="h-7 text-[10px] p-1" /></div>
            <div><Label className="text-[9px]">d barrera (m)</Label><Input type="number" step={0.1} value={s.distanceToBarrier_m} onChange={e => updateSurface(s.id, 'distanceToBarrier_m', Number(e.target.value))} className="h-7 text-[10px] p-1" /></div>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] text-red-500" onClick={() => removeSurface(s.id)}>×</Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="text-[10px] w-full" onClick={addSurface}>+ Agregar superficie</Button>

        <div className="bg-slate-50 rounded-lg p-4 border">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white rounded p-3 border">
              <div className="text-[9px] text-slate-500">Dosis Albedo</div>
              <div className="text-xl font-bold text-cyan-600">{result.albedoDose.toExponential(3)}</div>
              <div className="text-[9px] text-slate-400">mSv/sem</div>
            </div>
            <div className="bg-white rounded p-3 border">
              <div className="text-[9px] text-slate-500">Reducción</div>
              <div className="text-xl font-bold text-emerald-600">{result.reduction.toFixed(1)}%</div>
              <div className="text-[9px] text-slate-400">respecto a primaria</div>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-500">
          <b>Ecuación:</b> H_albedo = H_primary × Πᵢ [αᵢ × (dᵢ/dᵢ₊₁)²]
          <br />Ref: NCRP 144 (2003), Structural Shielding Design for Medical X-Ray Imaging Facilities, §4.3
        </div>
        <Button variant="outline" size="sm" className="text-xs w-full" onClick={exportCSV}>
          <Download className="w-3 h-3 mr-1" /> Export CSV
        </Button>
      </DialogContent>
    </Dialog>
  );
}
