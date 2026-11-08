/**
 * Curvas Isodosis — Fase 5 (docs/plan-motores-calculo.md). Malla y niveles de `isodosisPlano`
 * (`visoresDosis` → `doseFieldEngine`): fuentes, barreras y escala del plano del lienzo; niveles absolutos en
 * mSv/semana (P/T y 0.02 … 5). Antes era una fuente ficticia en el centro con niveles «% relativos» de una
 * exponencial. Sigue inactivo tras `VISOR_ISODOSIS` (featureFlags) hasta que se autorice.
 */
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Map, Info, Download, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanvasStore } from '@/stores/canvasStore';
import { componentesPresentes, type ComponenteCampo } from '@/lib/doseFieldEngine';
import { extractContours } from '@/lib/doseMapEngine';
import { isodosisPlano, maximoVisible, valorEscala } from '@/lib/visoresDosis';
import { SelectorComponentesDosis } from './SelectorComponentesDosis';

// Jet colormap: 0=blue -> 0.33=cyan -> 0.5=yellow -> 0.67=orange -> 1=red
function jetColor(value: number): [number, number, number] {
  const v = Math.max(0, Math.min(1, value));
  let r = 0, g = 0, b = 0;
  if (v < 0.125) { r = 0; g = 0; b = 0.5 + v * 4; }
  else if (v < 0.375) { r = 0; g = (v - 0.125) * 4; b = 1; }
  else if (v < 0.625) { r = (v - 0.375) * 4; g = 1; b = 1 - (v - 0.375) * 4; }
  else if (v < 0.875) { r = 1; g = 1 - (v - 0.625) * 4; b = 0; }
  else { r = 1; g = (v - 0.875) * 2; b = 0; }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const COLORES_NIVEL = ['#ffffff', '#a7f3d0', '#fde68a', '#fdba74', '#fca5a5', '#f87171', '#dc2626'];

interface IsodosisViewerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function IsodosisViewer({ open, onOpenChange }: IsodosisViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showContours, setShowContours] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [objetivo, setObjetivo] = useState('0.02');
  const [ocupacion, setOcupacion] = useState('1');
  const [componentes, setComponentes] = useState<ComponenteCampo[] | undefined>(undefined);
  const floorPlan = useCanvasStore((st) => st.floorPlan);
  const disponibles = useMemo(
    () => componentesPresentes(floorPlan.sources, floorPlan.scale_m_per_pixel),
    [floorPlan.sources, floorPlan.scale_m_per_pixel],
  );
  const iso = useMemo(
    () => (open ? isodosisPlano(floorPlan, parseFloat(objetivo) || 0.02, parseFloat(ocupacion) || 1, componentes) : null),
    [open, floorPlan, objetivo, ocupacion, componentes],
  );
  const contornos = useMemo(
    () => (iso ? extractContours(iso.malla.valores, iso.malla.nx, iso.malla.ny, iso.niveles) : []),
    [iso],
  );
  const maximo = useMemo(() => (iso ? maximoVisible(iso.malla.valores) : 0), [iso]);
  const canvasSize = { w: 600, h: 450 };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.w * dpr;
    canvas.height = canvasSize.h * dpr;
    canvas.style.width = `${canvasSize.w}px`;
    canvas.style.height = `${canvasSize.h}px`;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
    if (!iso) {
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText('El plano no tiene fuentes: agrega una fuente en el lienzo.', 20, canvasSize.h / 2);
      return;
    }
    const { malla, niveles } = iso;
    const anchoUtil = canvasSize.w - 90;
    const celda = Math.min(anchoUtil / malla.nx, canvasSize.h / malla.ny);
    const ox = (anchoUtil - celda * malla.nx) / 2;
    const oy = (canvasSize.h - celda * malla.ny) / 2;
    const aX = (x: number) => ox + ((x - malla.x0_px) / malla.paso_px) * celda;
    const aY = (y: number) => oy + ((y - malla.y0_px) / malla.paso_px) * celda;

    // Fondo en escala log₁₀ (el campo varía varios órdenes de magnitud).
    for (let iy = 0; iy < malla.ny; iy++) {
      for (let ix = 0; ix < malla.nx; ix++) {
        const v = malla.valores[iy * malla.nx + ix];
        const [r, g, b] = jetColor(valorEscala(Number.isFinite(v) ? v : maximo, maximo, 'log'));
        ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
        ctx.fillRect(ox + ix * celda, oy + iy * celda, celda + 0.5, celda + 0.5);
      }
    }

    if (showContours) {
      ctx.lineWidth = 1.5;
      contornos.forEach((linea) => {
        const i = niveles.indexOf(linea.level);
        ctx.strokeStyle = COLORES_NIVEL[Math.max(0, i) % COLORES_NIVEL.length];
        ctx.beginPath();
        for (const [x1, y1, x2, y2] of linea.segments) {
          ctx.moveTo(ox + (x1 + 0.5) * celda, oy + (y1 + 0.5) * celda);
          ctx.lineTo(ox + (x2 + 0.5) * celda, oy + (y2 + 0.5) * celda);
        }
        ctx.stroke();
        const [x1, y1] = linea.segments[Math.floor(linea.segments.length / 2)];
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '10px monospace';
        ctx.fillText(`${linea.level}`, ox + (x1 + 0.5) * celda + 3, oy + (y1 + 0.5) * celda - 3);
      });
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    for (const b of floorPlan.barriers) {
      ctx.beginPath(); ctx.moveTo(aX(b.x1), aY(b.y1)); ctx.lineTo(aX(b.x2), aY(b.y2)); ctx.stroke();
    }
    for (const s of floorPlan.sources) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(aX(s.x), aY(s.y), 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.arc(aX(s.x), aY(s.y), 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(s.name || s.modality.id, aX(s.x) + 8, aY(s.y) - 8);
    }

    if (showLegend) {
      const legendX = canvasSize.w - 80;
      let y = 20;
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('mSv/semana', legendX, y);
      ctx.font = '10px monospace';
      niveles.forEach((nivel, i) => {
        y += 16;
        ctx.strokeStyle = COLORES_NIVEL[i % COLORES_NIVEL.length];
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(legendX, y - 3); ctx.lineTo(legendX + 14, y - 3); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.fillText(String(nivel), legendX + 18, y);
      });
    }
  }, [iso, contornos, maximo, showContours, showLegend, floorPlan.barriers, floorPlan.sources, canvasSize.w, canvasSize.h]);

  useEffect(() => { if (open) draw(); }, [open, draw]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Isodosis_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0" data-testid="isodosis-viewer">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Map className="w-5 h-5 text-blue-500" />
            Curvas Isodosis — kerma semanal del plano
            <Badge variant="outline" className="text-[10px]">Motor de campo</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 flex items-center gap-2 flex-wrap">
          <Button size="sm" variant={showContours ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setShowContours(!showContours)}>
            <Layers className="w-3.5 h-3.5 mr-1" />Contornos
          </Button>
          <Button size="sm" variant={showLegend ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setShowLegend(!showLegend)}>
            <Info className="w-3.5 h-3.5 mr-1" />Leyenda
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <Label className="text-[10px]">P (mSv/sem)</Label>
          <Input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} type="number" step="0.01" className="h-7 text-xs w-20" />
          <Label className="text-[10px]">T</Label>
          <Input value={ocupacion} onChange={(e) => setOcupacion(e.target.value)} type="number" step="0.05" className="h-7 text-xs w-16" />
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1" />PNG
          </Button>
        </div>
        <div className="px-6 pb-2">
          <SelectorComponentesDosis disponibles={disponibles} seleccion={componentes} onChange={setComponentes} />
        </div>

        <div className="px-6 pb-6 flex justify-center">
          <canvas
            ref={canvasRef}
            style={{ width: canvasSize.w, height: canvasSize.h, borderRadius: 8, border: '1px solid #333' }}
          />
        </div>

        <div className="px-6 pb-4 text-[10px] text-slate-500 space-y-1">
          <p data-testid="isodosis-niveles">Niveles (mSv/sem): {iso ? iso.niveles.join(', ') : '—'} (P/T incluido).</p>
          <p>
            Kerma semanal sin T del motor de campo: {floorPlan.sources.length} fuente(s), {floorPlan.barriers.length} barrera(s)
            {iso ? `, ${iso.malla.nx}×${iso.malla.ny} celdas de ${iso.malla.paso_m.toFixed(2)} m` : ''}. Fondo en escala log₁₀.
          </p>
          <p>Diseño preliminar: requiere revisión de un experto calificado.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
