/**
 * v108: Spatial Dose Map 2D
 * Heatmap of dose distribution around sources and barriers
 *
 * Fase 3 (docs/plan-motores-calculo.md): la malla sale de `calcularMallaRegular` (doseFieldEngine) sobre
 * el rectángulo de fuentes y barreras del plano; antes usaba Γ = 0.5 fijo, μ inventados y 23.5 cm de
 * concreto en toda barrera, y rotulaba μSv lo que no lo era. Kerma en mSv/semana, sin T.
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { Crosshair, Palette } from 'lucide-react';
import { NCRP_DESIGN_GOALS } from '@/lib/ncrpOccupancy';
import { componentesPresentes, type ComponenteCampo } from '@/lib/doseFieldEngine';
import { mallaSpatialDoseMap } from '@/lib/visoresDosis';
import { SelectorComponentesDosis } from './SelectorComponentesDosis';

/** Color en escala logarítmica entre el objetivo público/10 y el máximo. */
function colorLog(value: number, minLog: number, maxLog: number): string {
  if (!(value > 0)) return getColor(0, 1);
  const v = Math.min(Math.max(Math.log10(value), minLog), maxLog);
  return getColor(v - minLog, maxLog - minLog);
}

function getColor(value: number, maxVal: number): string {
  if (maxVal === 0) return 'rgb(240,240,240)';
  const ratio = Math.min(value / maxVal, 1);
  if (ratio < 0.2) return `rgb(${Math.round(240 - ratio * 5 * 200)}, 240, ${Math.round(240 - ratio * 5 * 100)})`;
  if (ratio < 0.5) return `rgb(${Math.round(40 + (ratio - 0.2) / 0.3 * 215)}, ${Math.round(240 - (ratio - 0.2) / 0.3 * 140)}, 40)`;
  if (ratio < 0.8) return `rgb(255, ${Math.round(100 - (ratio - 0.5) / 0.3 * 100)}, 40)`;
  return `rgb(180, ${Math.round(50 - (ratio - 0.8) / 0.2 * 50)}, 60)`;
}

export default function SpatialDoseMapDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.spatialDoseMap));
  const close = () => useAppStore.getState().close('spatialDoseMap');
  const floorPlan = useCanvasStore(s => s.floorPlan);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [componentes, setComponentes] = useState<ComponenteCampo[] | undefined>(undefined);
  const disponibles = useMemo(
    () => componentesPresentes(floorPlan.sources, floorPlan.scale_m_per_pixel),
    [floorPlan.sources, floorPlan.scale_m_per_pixel],
  );

  const malla = useMemo(
    () => (open ? mallaSpatialDoseMap(floorPlan, componentes) : null),
    [open, floorPlan, componentes],
  );
  const maxDose = useMemo(() => {
    let max = 0;
    if (malla) for (const v of malla.valores) if (Number.isFinite(v) && v > max) max = v;
    return max;
  }, [malla]);

  useEffect(() => {
    if (!malla || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { nx, ny } = malla;
    const cw = canvasRef.current.width, ch = canvasRef.current.height;
    const ancho = nx * malla.paso_px, alto = ny * malla.paso_px;
    // Misma escala en x e y (sin deformar el plano).
    const k = Math.min(cw / ancho, ch / alto);
    const ox = (cw - ancho * k) / 2, oy = (ch - alto * k) / 2;
    const aX = (x: number) => ox + (x - malla.x0_px) * k;
    const aY = (y: number) => oy + (y - malla.y0_px) * k;
    const maxLog = Math.log10(Math.max(maxDose, NCRP_DESIGN_GOALS.uncontrolled));
    const minLog = Math.min(Math.log10(NCRP_DESIGN_GOALS.uncontrolled / 10), maxLog - 1);
    ctx.clearRect(0, 0, cw, ch);
    const lado = malla.paso_px * k;
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        ctx.fillStyle = colorLog(malla.valores[iy * nx + ix], minLog, maxLog);
        ctx.fillRect(ox + ix * lado, oy + iy * lado, lado + 1, lado + 1);
      }
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 2;
    for (const b of floorPlan.barriers) {
      ctx.beginPath();
      ctx.moveTo(aX(b.x1), aY(b.y1));
      ctx.lineTo(aX(b.x2), aY(b.y2));
      ctx.stroke();
    }

    for (const s of floorPlan.sources) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(aX(s.x), aY(s.y), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [malla, maxDose, floorPlan]);

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Crosshair className="w-4 h-4 text-red-500" /> Spatial Dose Map 2D (v108)
            <Badge variant="outline" className="text-[9px]">Heatmap</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="text-[10px] text-slate-500 bg-red-50 rounded-md p-2 mb-2 flex items-start gap-2">
          <Palette className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
          Kerma semanal del motor de campo con las barreras del plano (escala logarítmica). Claro = baja dosis, rojo = alta.
        </div>
        <SelectorComponentesDosis disponibles={disponibles} seleccion={componentes} onChange={setComponentes} testId="spatial-componentes" />
        {!malla && <div className="text-[11px] text-slate-500">El plano no tiene fuentes.</div>}
        <canvas ref={canvasRef} width={700} height={400} className="w-full border rounded-md" style={{ imageRendering: 'pixelated' }} data-testid="spatial-dose-canvas" />
        <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: 'rgb(40,100,140)' }} />Baja</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: 'rgb(255,240,40)' }} />Media</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: 'rgb(180,0,60)' }} />Alta</span>
          </div>
          <div>Max: {maxDose.toExponential(2)} mSv/sem | Objetivo público: {NCRP_DESIGN_GOALS.uncontrolled} mSv/sem</div>
        </div>
        <div className="text-[8px] text-slate-400 mt-1">
          Motor de campo (doseFieldEngine): NCRP 151 primaria/fuga/dispersión, NCRP 147, TG-108 | {malla ? `${malla.nx}×${malla.ny} celdas de ${malla.paso_m.toFixed(2)} m` : ''}
        </div>
      </DialogContent>
    </Dialog>
  );
}
