/**
 * Heat Map Avanzado — Fase 5 (docs/plan-motores-calculo.md). La malla sale de `mallaHeatMapAvanzado`
 * (`visoresDosis` → `doseFieldEngine`): fuentes, barreras y escala del plano del lienzo, kerma en mSv/semana.
 * Antes dibujaba tres fuentes ficticias con un decaimiento exponencial sin unidades. Sigue inactivo tras
 * `VISOR_HEATMAP_AVANZADO` (featureFlags) hasta que se autorice.
 */
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Flame, Download, BarChart3 } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { componentesPresentes, type ComponenteCampo } from '@/lib/doseFieldEngine';
import { extractContours } from '@/lib/doseMapEngine';
import {
  DECADAS_LOG, NIVELES_ISODOSIS, mallaHeatMapAvanzado, maximoVisible, valorEscala, type EscalaColor,
} from '@/lib/visoresDosis';
import { SelectorComponentesDosis } from './SelectorComponentesDosis';

interface HeatMapViewerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

// Jet colormap
function jetColor(v: number): [number, number, number] {
  const val = Math.max(0, Math.min(1, v));
  let r = 0, g = 0, b = 0;
  if (val < 0.125) { b = 0.5 + val * 4; }
  else if (val < 0.375) { g = (val - 0.125) * 4; b = 1; }
  else if (val < 0.625) { r = (val - 0.375) * 4; g = 1; b = 1 - (val - 0.375) * 4; }
  else if (val < 0.875) { r = 1; g = 1 - (val - 0.625) * 4; }
  else { r = 1; g = (val - 0.875) * 2; }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const fmt = (v: number) => (v >= 0.01 && v < 1000 ? v.toPrecision(3) : v.toExponential(1));

export default function HeatMapViewer({ open, onOpenChange }: HeatMapViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scaleType, setScaleType] = useState<EscalaColor>('log');
  const [showContours, setShowContours] = useState(true);
  const [componentes, setComponentes] = useState<ComponenteCampo[] | undefined>(undefined);
  const floorPlan = useCanvasStore((st) => st.floorPlan);
  const disponibles = useMemo(
    () => componentesPresentes(floorPlan.sources, floorPlan.scale_m_per_pixel),
    [floorPlan.sources, floorPlan.scale_m_per_pixel],
  );
  const malla = useMemo(
    () => (open ? mallaHeatMapAvanzado(floorPlan, componentes) : null),
    [open, floorPlan, componentes],
  );
  const maximo = useMemo(() => (malla ? maximoVisible(malla.valores) : 0), [malla]);
  const canvasW = 600;
  const canvasH = 450;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvasW, canvasH);
    if (!malla) {
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText('El plano no tiene fuentes: agrega una fuente en el lienzo.', 20, canvasH / 2);
      return;
    }

    // Misma escala en x e y (la malla es de celdas cuadradas en metros).
    const altoUtil = canvasH - 50;
    const celda = Math.min(canvasW / malla.nx, altoUtil / malla.ny);
    const ox = (canvasW - celda * malla.nx) / 2;
    const oy = (altoUtil - celda * malla.ny) / 2;
    const aX = (x: number) => ox + ((x - malla.x0_px) / malla.paso_px) * celda;
    const aY = (y: number) => oy + ((y - malla.y0_px) / malla.paso_px) * celda;

    for (let iy = 0; iy < malla.ny; iy++) {
      for (let ix = 0; ix < malla.nx; ix++) {
        const v = malla.valores[iy * malla.nx + ix];
        const [r, g, b] = jetColor(valorEscala(Number.isFinite(v) ? v : maximo, maximo, scaleType));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(ox + ix * celda, oy + iy * celda, celda + 0.5, celda + 0.5);
      }
    }

    // Isodosis absolutas (mSv/semana) sobre los valores del motor (marching squares, centros de celda).
    if (showContours) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      for (const linea of extractContours(malla.valores, malla.nx, malla.ny, NIVELES_ISODOSIS)) {
        ctx.beginPath();
        for (const [x1, y1, x2, y2] of linea.segments) {
          ctx.moveTo(ox + (x1 + 0.5) * celda, oy + (y1 + 0.5) * celda);
          ctx.lineTo(ox + (x2 + 0.5) * celda, oy + (y2 + 0.5) * celda);
        }
        ctx.stroke();
      }
    }

    // Barreras del plano.
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    for (const b of floorPlan.barriers) {
      ctx.beginPath(); ctx.moveTo(aX(b.x1), aY(b.y1)); ctx.lineTo(aX(b.x2), aY(b.y2)); ctx.stroke();
    }

    // Fuentes del plano.
    for (const s of floorPlan.sources) {
      const sx = aX(s.x), sy = aY(s.y);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 6, sy); ctx.lineTo(sx + 6, sy);
      ctx.moveTo(sx, sy - 6); ctx.lineTo(sx, sy + 6);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(s.name || s.modality.id, sx + 10, sy - 8);
    }

    // Leyenda con valores del motor.
    const legendY = canvasH - 34;
    const legendW = 200;
    const legendX = (canvasW - legendW) / 2;
    for (let i = 0; i < legendW; i++) {
      const [r, g, b] = jetColor(i / legendW);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(legendX + i, legendY, 1, 12);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.strokeRect(legendX, legendY, legendW, 12);
    const minimo = scaleType === 'log' ? maximo * 10 ** -DECADAS_LOG : 0;
    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    ctx.fillText(fmt(minimo), legendX - 50, legendY + 10);
    ctx.fillText(`${fmt(maximo)} mSv/sem`, legendX + legendW + 5, legendY + 10);
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`Escala: ${scaleType.toUpperCase()}`, legendX + legendW / 2 - 25, legendY + 26);
  }, [malla, maximo, scaleType, showContours, floorPlan.barriers, floorPlan.sources]);

  useEffect(() => { if (open) draw(); }, [open, draw]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `HeatMap_${scaleType}_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0" data-testid="heatmap-avanzado">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Flame className="w-5 h-5 text-orange-500" />
            Heat Map Avanzado — kerma semanal del plano
            <Badge variant="outline" className="text-[10px]">Motor de campo</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {([['linear', 'Lineal'], ['log', 'Log'], ['sqrt', 'Sqrt']] as [EscalaColor, string][]).map(([s, label]) => (
              <Button key={s} size="sm" variant={scaleType === s ? 'default' : 'outline'} className="h-7 text-xs px-2" onClick={() => setScaleType(s)}>
                <BarChart3 className="w-3 h-3 mr-1" />{label}
              </Button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-5" />
          <Button size="sm" variant={showContours ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setShowContours(!showContours)}>
            <Flame className="w-3.5 h-3.5 mr-1" />Isodosis
          </Button>
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1" />PNG
          </Button>
        </div>
        <div className="px-6 pb-2">
          <SelectorComponentesDosis disponibles={disponibles} seleccion={componentes} onChange={setComponentes} />
        </div>

        <div className="px-6 pb-4 flex justify-center">
          <canvas
            ref={canvasRef}
            style={{ width: canvasW, height: canvasH, borderRadius: 8, border: '1px solid #333' }}
          />
        </div>

        <div className="px-6 pb-4 text-[10px] text-slate-500 space-y-1">
          <p><strong>Escala {scaleType.toUpperCase()}:</strong> {scaleType === 'log' ? `log₁₀ relativa al máximo (${DECADAS_LOG} décadas)` : scaleType === 'sqrt' ? 'raíz cuadrada relativa al máximo' : 'lineal relativa al máximo'}. Isodosis: {NIVELES_ISODOSIS.join(', ')} mSv/sem.</p>
          <p>
            Kerma semanal sin T (mSv/sem) del motor de campo: {floorPlan.sources.length} fuente(s), {floorPlan.barriers.length} barrera(s)
            {malla ? `, ${malla.nx}×${malla.ny} celdas de ${malla.paso_m.toFixed(2)} m` : ''}.
          </p>
          <p>Diseño preliminar: requiere revisión de un experto calificado.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
