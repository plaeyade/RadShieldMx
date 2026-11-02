import { useRef, useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import '@/components/ui/scroll-area';
import { Map, Info, Download, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface IsodosisData {
  x: number;
  y: number;
  dose: number; // 0-1 normalized
}

interface IsodosisViewerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

// Generate mock isodosis data from a point source
function generateMockIsodosisData(cx: number, cy: number, w: number, h: number): IsodosisData[] {
  const data: IsodosisData[] = [];
  const gridSize = 80;
  const dx = w / gridSize;
  const dy = h / gridSize;
  const maxDist = Math.sqrt(w * w + h * h) * 0.6;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = i * dx;
      const y = j * dy;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      // Inverse square law with attenuation
      const dose = Math.exp(-dist / (maxDist * 0.3)) * (1 / (1 + (dist / 100) ** 2));
      data.push({ x, y, dose: Math.min(1, dose) });
    }
  }
  return data;
}

export default function IsodosisViewer({ open, onOpenChange }: IsodosisViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showContours, setShowContours] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [contourLevels] = useState([0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9]);
  const [data, setData] = useState<IsodosisData[]>([]);
  const [canvasSize] = useState({ w: 600, h: 450 });

  useEffect(() => {
    if (open) {
      setData(generateMockIsodosisData(canvasSize.w / 2, canvasSize.h / 2, canvasSize.w, canvasSize.h));
    }
  }, [open, canvasSize]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.w * dpr;
    canvas.height = canvasSize.h * dpr;
    canvas.style.width = `${canvasSize.w}px`;
    canvas.style.height = `${canvasSize.h}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

    // Draw heatmap
    const gridSize = Math.sqrt(data.length);
    const cellW = canvasSize.w / gridSize;
    const cellH = canvasSize.h / gridSize;

    data.forEach(d => {
      const [r, g, b] = jetColor(d.dose);
      ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
      ctx.fillRect(d.x, d.y, cellW + 1, cellH + 1);
    });

    // Draw contour lines
    if (showContours) {
      ctx.lineWidth = 1;
      contourLevels.forEach(level => {
        ctx.strokeStyle = `rgba(255,255,255,0.6)`;
        ctx.beginPath();
        data.forEach((d, i) => {
          if (i % gridSize === 0) return;
          const prev = data[i - 1];
          if ((prev.dose < level && d.dose >= level) || (prev.dose >= level && d.dose < level)) {
            const x = d.x;
            const y = d.y + cellH / 2;
            ctx.moveTo(x, y);
            ctx.lineTo(x + 2, y);
          }
        });
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '10px monospace';
        const label = `${(level * 100).toFixed(0)}%`;
        // Find a point near this level
        const sample = data.find(d => Math.abs(d.dose - level) < 0.02);
        if (sample) {
          ctx.fillText(label, sample.x + 5, sample.y + 10);
        }
      });
    }

    // Draw source point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(canvasSize.w / 2, canvasSize.h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(canvasSize.w / 2, canvasSize.h / 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Source label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('FUENTE (Isocentro)', canvasSize.w / 2 + 8, canvasSize.h / 2 - 8);

    // Legend
    if (showLegend) {
      const legendW = 20;
      const legendH = 200;
      const legendX = canvasSize.w - 40;
      const legendY = 20;

      for (let i = 0; i < legendH; i++) {
        const v = 1 - i / legendH;
        const [r, g, b] = jetColor(v);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(legendX, legendY + i, legendW, 1);
      }

      // Legend border
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.strokeRect(legendX, legendY, legendW, legendH);

      // Legend labels
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px monospace';
      [0, 0.25, 0.5, 0.75, 1].forEach(v => {
        const y = legendY + legendH * (1 - v);
        ctx.fillText(`${(v * 100).toFixed(0)}%`, legendX + legendW + 4, y + 3);
        ctx.beginPath();
        ctx.moveTo(legendX + legendW, y);
        ctx.lineTo(legendX + legendW + 3, y);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.stroke();
      });

      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Dosis Relativa', legendX - 10, legendY + legendH + 15);
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvasSize.w; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasSize.h); ctx.stroke();
    }
    for (let y = 0; y < canvasSize.h; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasSize.w, y); ctx.stroke();
    }

  }, [data, showContours, showLegend, contourLevels, canvasSize]);

  useEffect(() => { draw(); }, [draw]);

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
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Map className="w-5 h-5 text-blue-500" />
            Curvas Isodosis — Colormap Jet
            <Badge variant="outline" className="text-[10px]">Canvas 2D</Badge>
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
          <span className="text-[10px] text-slate-500">Niveles: {contourLevels.map(l => `${(l * 100).toFixed(0)}%`).join(', ')}</span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1" />PNG
          </Button>
        </div>

        <div className="px-6 pb-6 flex justify-center">
          <canvas
            ref={canvasRef}
            style={{ width: canvasSize.w, height: canvasSize.h, borderRadius: 8, border: '1px solid #333' }}
          />
        </div>

        <div className="px-6 pb-4 text-[10px] text-slate-500 space-y-1">
          <p><strong>Leyenda de colores (Jet):</strong> Azul=baja dosis → Cian → Amarillo → Naranja → Rojo=alta dosis</p>
          <p>Datos simulados: Distribucion de dosis desde fuente puntual con ley del inverso del cuadrado.</p>
          <p>Lineas blancas: Contornos de nivel de dosis.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
