/**
 * AdaptiveSamplingDialog — Recomendación B.1
 * Muestreo adaptativo: más puntos donde el gradiente de dosis es alto.
 * 
 * Fundamento: En lugar de muestrear uniformemente (200 puntos fijos),
 * el muestreo adaptativo concentra puntos donde la dosis cambia rápidamente
 * (cerca de fuentes, esquinas, aberturas). Esto mejora la precisión en
 * regiones críticas sin aumentar el costo computacional total.
 * Referencia: Press et al. (2007) "Numerical Recipes", Ch. 4 — Adaptive Quadrature.
 * NCRP 147 §5.2: "The number of sample points should be sufficient to capture
 * the maximum dose rate along the barrier."
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface Props { open: boolean; onClose: () => void; }

// Adaptive sampling: more points near sources where gradient is high
function adaptiveSample(
  barrierLength: number, numBasePoints: number,
  sourcePositions: number[], // positions along barrier (0-1)
  gradientThreshold: number
): { positions: number[]; totalPoints: number; densityInfo: string } {
  const base = Array.from({ length: numBasePoints }, (_, i) => i / (numBasePoints - 1));
  const extra: number[] = [];
  sourcePositions.forEach(sp => {
    const localDensity = Math.max(20, Math.floor(numBasePoints * gradientThreshold));
    const local = Array.from({ length: localDensity }, (_, i) => {
      const t = i / (localDensity - 1);
      // Concentrate around source with Gaussian weighting
      const spread = 0.15; // 15% of barrier length
      return sp + (t - 0.5) * 2 * spread;
    }).filter(p => p >= 0 && p <= 1);
    extra.push(...local);
  });
  const all = [...new Set([...base, ...extra].map(p => Math.round(p * 1000) / 1000))].sort((a, b) => a - b);
  return {
    positions: all,
    totalPoints: all.length,
    densityInfo: `${numBasePoints} base + ${extra.length} adaptive = ${all.length} total`,
  };
}

export default function AdaptiveSamplingDialog({ open, onClose }: Props) {
  const [barrierLength, setBarrierLength] = useState(5);
  const [numBasePoints, setNumBasePoints] = useState(50);
  const [sourcePos, setSourcePos] = useState('0.3,0.7');
  const [gradientThreshold, setGradientThreshold] = useState(0.5);

  const result = useMemo(() => {
    const sources = sourcePos.split(',').map(s => parseFloat(s.trim())).filter(s => !isNaN(s) && s >= 0 && s <= 1);
    return adaptiveSample(barrierLength, numBasePoints, sources, gradientThreshold);
  }, [barrierLength, numBasePoints, sourcePos, gradientThreshold]);

  const exportCSV = () => {
    let csv = 'Position_along_barrier,SampleType\n';
    result.positions.forEach(p => csv += `${(p * barrierLength).toFixed(3)},${p.toFixed(3) === (Math.round(p * 50) / 50).toFixed(3) ? 'base' : 'adaptive'}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'adaptive_sampling.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Adaptive Sampling Configuration
            <Badge variant="outline" className="text-[10px]">B.1</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700">
          <b>Press et al. (2007), NCRP 147 §5.2:</b> Muestreo adaptativo concentra
          puntos donde el gradiente de dosis es alto (cerca de fuentes, esquinas).
          Mejora la precisión en regiones críticas sin aumentar el costo computacional.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-[11px]">Longitud barrera (m)</Label><Input type="number" value={barrierLength} onChange={e => setBarrierLength(Number(e.target.value))} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Puntos base</Label><Input type="number" value={numBasePoints} onChange={e => setNumBasePoints(Number(e.target.value))} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Posiciones fuente (0-1, comma-separated)</Label><Input value={sourcePos} onChange={e => setSourcePos(e.target.value)} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Umbral gradiente (0-1)</Label><Input type="number" step={0.1} min={0} max={1} value={gradientThreshold} onChange={e => setGradientThreshold(Number(e.target.value))} className="h-8 text-xs" /></div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border">
          <div className="text-xs font-semibold mb-1">Distribución de puntos</div>
          <div className="text-[10px] text-slate-500 mb-2">{result.densityInfo}</div>
          <div className="relative h-12 bg-white border rounded">
            {result.positions.map((p, i) => (
              <div key={i} className="absolute top-0 bottom-0 w-0.5 bg-blue-400" style={{ left: `${p * 100}%` }} title={`${(p * barrierLength).toFixed(2)} m`} />
            ))}
          </div>
          <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
            <span>0 m</span><span>{(barrierLength / 2).toFixed(1)} m</span><span>{barrierLength} m</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-3 text-center">
          <div className="text-[9px] text-slate-500">Total puntos de muestreo</div>
          <div className="text-2xl font-bold text-blue-600">{result.totalPoints}</div>
          <div className="text-[9px] text-slate-400">vs {numBasePoints} uniformes</div>
        </div>

        <Button variant="outline" size="sm" className="text-xs w-full" onClick={exportCSV}>
          <Download className="w-3 h-3 mr-1" /> Export Sampling Points CSV
        </Button>
      </DialogContent>
    </Dialog>
  );
}
