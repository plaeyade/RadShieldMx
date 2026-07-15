/**
 * v108: Spatial Dose Map 2D
 * Heatmap of dose distribution around sources and barriers
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/appStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { Crosshair, Zap, Palette } from 'lucide-react';
import { NCRP_DESIGN_GOALS } from '@/lib/ncrpOccupancy';

function computeDoseGrid(sources: any[], barriers: any[], w: number, h: number, scale: number) {
  const nx = 80, ny = 60;
  const grid: number[][] = Array(ny).fill(0).map(() => Array(nx).fill(0));
  const P = NCRP_DESIGN_GOALS.uncontrolled;
  
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const px = (ix / nx) * w;
      const py = (iy / ny) * h;
      let totalDose = 0;
      
      for (const src of sources) {
        const dx = (px - src.x) * scale;
        const dy = (py - src.y) * scale;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 0.1) continue;
        
        // Simplified dose: D = kerma_constant * activity / d^2 with attenuation
        const act_GBq = (src.workloadValue ?? 100) / 1000;
        const gamma = 0.5; // uSv·m²/GBq·h approx for diagnostic
        const hours = src.workloadHoursPerWeek ?? 40;
        let dose = (act_GBq * gamma * hours) / (d * d);
        
        // Apply barrier attenuation
        for (const b of barriers) {
          if (lineSegmentIntersects(b.x1, b.y1, b.x2, b.y2, src.x, src.y, px, py)) {
            const mu = b.materialCode === 'LEAD' ? 20 : b.materialCode === 'CONCRETE235' ? 0.15 : 0.05;
            const thickness_cm = 23.5; // 235mm concrete
            dose *= Math.exp(-mu * thickness_cm);
          }
        }
        totalDose += dose;
      }
      grid[iy][ix] = totalDose;
    }
  }
  return grid;
}

function lineSegmentIntersects(x1: number, y1: number, x2: number, y2: number, ax: number, ay: number, bx: number, by: number) {
  const d = (x2 - x1) * (by - ay) - (y2 - y1) * (bx - ax);
  if (Math.abs(d) < 0.001) return false;
  const ua = ((bx - ax) * (y1 - ay) - (by - ay) * (x1 - ax)) / d;
  const ub = ((x2 - x1) * (y1 - ay) - (y2 - y1) * (x1 - ax)) / d;
  return ua > 0 && ua < 1 && ub > 0 && ub < 1;
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
  const open = useAppStore(s => s.dialogs.spatialDoseMap?.open ?? false);
  const close = () => useAppStore.getState().close('spatialDoseMap');
  const floorPlan = useCanvasStore(s => s.floorPlan);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [computed, setComputed] = useState(false);
  const [maxDose, setMaxDose] = useState(0);

  const grid = useMemo(() => {
    if (!open || floorPlan.sources.length === 0) return null;
    const g = computeDoseGrid(floorPlan.sources, floorPlan.barriers, 700, 500, floorPlan.scale_m_per_pixel);
    let max = 0;
    for (const row of g) for (const v of row) if (v > max) max = v;
    setMaxDose(max);
    setComputed(true);
    return g;
  }, [open, floorPlan.sources, floorPlan.barriers, floorPlan.scale_m_per_pixel]);

  useEffect(() => {
    if (!grid || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const nx = grid[0].length, ny = grid.length;
    const cw = canvasRef.current.width, ch = canvasRef.current.height;
    const cellW = cw / nx, cellH = ch / ny;
    
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        ctx.fillStyle = getColor(grid[iy][ix], maxDose);
        ctx.fillRect(ix * cellW, iy * cellH, cellW + 1, cellH + 1);
      }
    }
    
    // Draw barriers
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    for (const b of floorPlan.barriers) {
      ctx.beginPath();
      ctx.moveTo(b.x1 / 700 * cw, b.y1 / 500 * ch);
      ctx.lineTo(b.x2 / 700 * cw, b.y2 / 500 * ch);
      ctx.stroke();
    }
    
    // Draw sources
    for (const s of floorPlan.sources) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x / 700 * cw, s.y / 500 * ch, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [grid, maxDose, floorPlan]);

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
          Mapa de calor de dosis espacial. Azul = baja dosis, Rojo = alta dosis. Barreras atenuan segun material.
        </div>
        <canvas ref={canvasRef} width={700} height={400} className="w-full border rounded-md" style={{ imageRendering: 'pixelated' }} />
        <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: 'rgb(40,100,140)' }} />Baja</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: 'rgb(255,240,40)' }} />Media</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: 'rgb(180,0,60)' }} />Alta</span>
          </div>
          <div>Max: {maxDose.toFixed(3)} uSv/sem | Limite publico: {NCRP_DESIGN_GOALS.uncontrolled} mSv/sem = 20 uSv/sem</div>
        </div>
        <div className="text-[8px] text-slate-400 mt-1">
          Referencia: NCRP 147 Eq. 4.1 | Barreras con atenuacion exp(-mu*t) | Fuentes con ley inversa cuadrado
        </div>
      </DialogContent>
    </Dialog>
  );
}
