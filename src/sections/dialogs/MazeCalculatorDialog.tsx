import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import { calculateMazeDose, MAZE_PRESETS, type MazeConfig, type MazeSegment } from '@/hooks/useMazeCalculator';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export default function MazeCalculatorDialog({ open, onOpenChange }: Props) {
  const [config, setConfig] = useState<MazeConfig>({
    sourceType: 'LINAC', energy_MeV: 15, workload_Gy_week: 800,
    sourceDistance_m: 5.0, entryArea_m2: 9.0, useDoor: true,
    segments: [{ id: 1, width_m: 2.0, height_m: 2.4, length_m: 5.0, materialCode: 'CONCRETE235', wallThickness_m: 1.8 }],
  });
  const [result, setResult] = useState<ReturnType<typeof calculateMazeDose> | null>(null);

  const calculate = () => {
    try { const r = calculateMazeDose(config); setResult(r); toast.success('Laberinto calculado'); }
    catch (e) { toast.error('Error: ' + (e as Error).message); }
  };

  const addSegment = () => {
    const newSeg: MazeSegment = {
      id: config.segments.length + 1, width_m: 1.8, height_m: 2.4, length_m: 4.0,
      materialCode: 'CONCRETE235', wallThickness_m: 1.5,
    };
    setConfig(p => ({ ...p, segments: [...p.segments, newSeg] }));
  };

  const updateSegment = (i: number, field: keyof MazeSegment, val: number | string) => {
    setConfig(p => ({ ...p, segments: p.segments.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }));
  };

  const removeSegment = (i: number) => {
    setConfig(p => ({ ...p, segments: p.segments.filter((_, idx) => idx !== i) }));
  };

  const loadPreset = (idx: number) => {
    setConfig({ ...MAZE_PRESETS[idx].config });
    setResult(null);
    toast.success(`Cargado: ${MAZE_PRESETS[idx].name}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculo de Laberintos — McGinley (2001)
          </DialogTitle>
        </DialogHeader>

        {/* Presets */}
        <div className="grid grid-cols-3 gap-2">
          {MAZE_PRESETS.map((p, i) => (
            <Button key={i} size="sm" variant="outline" className="text-xs h-auto py-2" onClick={() => loadPreset(i)}>
              {p.name}
            </Button>
          ))}
        </div>

        {/* Source params */}
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-xs">Energia (MV)</Label><Input type="number" value={config.energy_MeV} onChange={e => setConfig(p => ({ ...p, energy_MeV: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Workload (Gy/sem)</Label><Input type="number" value={config.workload_Gy_week} onChange={e => setConfig(p => ({ ...p, workload_Gy_week: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Dist. fuente-entrada (m)</Label><Input type="number" value={config.sourceDistance_m} onChange={e => setConfig(p => ({ ...p, sourceDistance_m: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Area entrada (m²)</Label><Input type="number" value={config.entryArea_m2} onChange={e => setConfig(p => ({ ...p, entryArea_m2: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Tipo fuente</Label>
            <Select value={config.sourceType} onValueChange={v => setConfig(p => ({ ...p, sourceType: v as 'LINAC' | 'Co60' | 'Ir192' }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LINAC">LINAC</SelectItem>
                <SelectItem value="Co60">Co-60 (Gamma Knife)</SelectItem>
                <SelectItem value="Ir192">Ir-192 (HDR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Segments */}
        <div className="text-xs font-bold text-gray-600 mt-2">Segmentos del laberinto ({config.segments.length})</div>
        {config.segments.map((seg, i) => (
          <Card key={i} className="p-2">
            <CardContent className="p-0 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Segmento {i + 1}</span>
                {config.segments.length > 1 && <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeSegment(i)}><Trash2 className="w-3 h-3 text-red-500" /></Button>}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div><Label className="text-[10px]">Ancho (m)</Label><Input type="number" step="0.1" value={seg.width_m} onChange={e => updateSegment(i, 'width_m', parseFloat(e.target.value))} className="h-7 text-xs" /></div>
                <div><Label className="text-[10px]">Alto (m)</Label><Input type="number" step="0.1" value={seg.height_m} onChange={e => updateSegment(i, 'height_m', parseFloat(e.target.value))} className="h-7 text-xs" /></div>
                <div><Label className="text-[10px]">Long. (m)</Label><Input type="number" step="0.1" value={seg.length_m} onChange={e => updateSegment(i, 'length_m', parseFloat(e.target.value))} className="h-7 text-xs" /></div>
                <div><Label className="text-[10px]">Pared (m)</Label><Input type="number" step="0.1" value={seg.wallThickness_m} onChange={e => updateSegment(i, 'wallThickness_m', parseFloat(e.target.value))} className="h-7 text-xs" /></div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button size="sm" variant="outline" className="w-full text-xs" onClick={addSegment}><Plus className="w-3 h-3 mr-1" />Agregar segmento</Button>

        <Button onClick={calculate} className="w-full bg-red-700 hover:bg-red-800"><Calculator className="w-4 h-4 mr-2" />Calcular laberinto</Button>

        {result && (
          <div className="space-y-2 border-t pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Card><CardContent className="p-2 text-center">
                <div className="text-lg font-bold text-red-700">{result.doseAtDoor_mSv_week.toFixed(4)}</div>
                <div className="text-[10px] text-gray-500">mSv/sem en puerta</div>
              </CardContent></Card>
              <Card><CardContent className="p-2 text-center">
                <div className="text-lg font-bold text-blue-700">{result.recommendedDoorPb_mm.toFixed(1)}</div>
                <div className="text-[10px] text-gray-500">mm Pb puerta</div>
              </CardContent></Card>
            </div>
            <div className="flex gap-2">
              <Badge variant={result.doorRequired ? 'destructive' : 'default'}>{result.doorRequired ? 'PUERTA REQUERIDA' : 'Sin puerta'}</Badge>
              <Badge variant={result.alaraCompliant ? 'default' : 'secondary'}>{result.alaraCompliant ? 'ALARA OK' : 'Excede ALARA'}</Badge>
            </div>
            <div className="text-xs text-gray-500">
              {result.segmentDetails.map(d => (
                <div key={d.segment}>Seg {d.segment}: dosis acumulada = {(d.cumulativeDose / 1000).toFixed(6)} mSv/sem | recorrido = {d.pathLength_m.toFixed(1)} m</div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
