import { useRef, useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Flame, Download, BarChart3, Info } from 'lucide-react';

interface HeatMapViewerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type ScaleType = 'linear' | 'log' | 'sqrt';

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

function applyScale(v: number, scale: ScaleType): number {
  switch (scale) {
    case 'log': return v <= 0 ? 0 : Math.log10(v * 9 + 1); // maps 0-1 to 0-1
    case 'sqrt': return Math.sqrt(v);
    case 'linear': default: return v;
  }
}

// Generate realistic heatmap data with multiple sources
function generateHeatMapData(w: number, h: number): number[][] {
  const data: number[][] = [];
  // Multiple sources
  const sources = [
    { x: w * 0.35, y: h * 0.4, strength: 1.0 },
    { x: w * 0.65, y: h * 0.55, strength: 0.7 },
    { x: w * 0.5, y: h * 0.3, strength: 0.4 },
  ];

  for (let i = 0; i < h; i++) {
    data[i] = [];
    for (let j = 0; j < w; j++) {
      let dose = 0;
      sources.forEach(s => {
        const dist = Math.sqrt((j - s.x) ** 2 + (i - s.y) ** 2);
        dose += s.strength * Math.exp(-dist / (w * 0.15));
      });
      data[i][j] = Math.min(1, dose);
    }
  }
  return data;
}

export default function HeatMapViewer({ open, onOpenChange }: HeatMapViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scaleType, setScaleType] = useState<ScaleType>('log');
  const [showContours, setShowContours] = useState(true);
  const [data] = useState<number[][]>(() => generateHeatMapData(120, 90));
  const canvasW = 600;
  const canvasH = 450;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;
    ctx.scale(dpr, dpr);

    const cellW = canvasW / data[0].length;
    const cellH = canvasH / data.length;

    // Fill background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Draw heatmap
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        const scaled = applyScale(data[i][j], scaleType);
        const [r, g, b] = jetColor(scaled);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(j * cellW, i * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Contour lines
    if (showContours) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 0.5;
      const levels = [0.1, 0.3, 0.5, 0.7, 0.9];
      levels.forEach(level => {
        for (let i = 1; i < data.length - 1; i++) {
          for (let j = 1; j < data[i].length - 1; j++) {
            const d = applyScale(data[i][j], scaleType);
            if (Math.abs(d - level) < 0.03) {
              ctx.beginPath();
              ctx.arc(j * cellW, i * cellH, 1, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }
      });
    }

    // Grid overlay
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.3;
    for (let x = 0; x < canvasW; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke();
    }
    for (let y = 0; y < canvasH; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke();
    }

    // Source markers
    const sources = [
      { x: canvasW * 0.35, y: canvasH * 0.4, label: 'LINAC A' },
      { x: canvasW * 0.65, y: canvasH * 0.55, label: 'LINAC B' },
      { x: canvasW * 0.5, y: canvasH * 0.3, label: 'HDR' },
    ];
    sources.forEach(s => {
      // Glow
      const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 15);
      gradient.addColorStop(0, 'rgba(255,0,0,0.3)');
      gradient.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.arc(s.x, s.y, 15, 0, Math.PI * 2); ctx.fill();

      // Crosshair
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x - 6, s.y); ctx.lineTo(s.x + 6, s.y);
      ctx.moveTo(s.x, s.y - 6); ctx.lineTo(s.x, s.y + 6);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(s.label, s.x + 10, s.y - 8);
    });

    // Legend bar at bottom
    const legendY = canvasH - 30;
    const legendW = 200;
    const legendX = (canvasW - legendW) / 2;
    for (let i = 0; i < legendW; i++) {
      const v = i / legendW;
      const [r, g, b] = jetColor(v);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(legendX + i, legendY, 1, 12);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.strokeRect(legendX, legendY, legendW, 12);

    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    ctx.fillText('Baja', legendX - 28, legendY + 10);
    ctx.fillText('Alta', legendX + legendW + 5, legendY + 10);
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`Escala: ${scaleType.toUpperCase()}`, legendX + legendW / 2 - 25, legendY + 24);

  }, [data, scaleType, showContours]);

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
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Flame className="w-5 h-5 text-orange-500" />
            Heat Map 2D — Escala Logaritmica
            <Badge variant="outline" className="text-[10px]">Canvas Pixelado</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {([['linear', 'Lineal'], ['log', 'Log'], ['sqrt', 'Sqrt']] as [ScaleType, string][]).map(([s, label]) => (
              <Button key={s} size="sm" variant={scaleType === s ? 'default' : 'outline'} className="h-7 text-xs px-2" onClick={() => setScaleType(s)}>
                <BarChart3 className="w-3 h-3 mr-1" />{label}
              </Button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-5" />
          <Button size="sm" variant={showContours ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setShowContours(!showContours)}>
            <Flame className="w-3.5 h-3.5 mr-1" />Contornos
          </Button>
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1" />PNG
          </Button>
        </div>

        <div className="px-6 pb-4 flex justify-center">
          <canvas
            ref={canvasRef}
            style={{ width: canvasW, height: canvasH, borderRadius: 8, border: '1px solid #333' }}
          />
        </div>

        <div className="px-6 pb-4 text-[10px] text-slate-500 space-y-1">
          <p><strong>Escala {scaleType.toUpperCase()}:</strong> {scaleType === 'log' ? 'Log10 — resalta bajas dosis' : scaleType === 'sqrt' ? 'Sqrt — compresion suave' : 'Lineal — mapeo directo'}</p>
          <p>3 fuentes simuladas: LINAC A, LINAC B, HDR. Cruz roja = posicion de fuente.</p>
          <p>Colormap Jet: Resolucion {data[0]?.length}x{data.length} celdas.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
