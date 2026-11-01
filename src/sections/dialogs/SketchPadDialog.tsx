import { useRef, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Pencil, Eraser, Download, RotateCcw, Square, Circle, Minus, Grid3x3 } from 'lucide-react';

type Tool = 'pencil' | 'eraser' | 'line' | 'rect' | 'circle' | 'select';
type ElementType = 'line' | 'rect' | 'circle' | 'freehand' | 'text';

interface SketchElement {
  id: string;
  type: ElementType;
  points: Array<{x: number; y: number}>;
  color: string;
  width: number;
  text?: string;
}

interface SketchPadDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const BUNKER_TEMPLATE = [
  // Outer walls
  { id: 't1', type: 'rect' as ElementType, points: [{x:50,y:50},{x:550,y:350}], color:'#334155', width:2 },
  // Maze
  { id: 't2', type: 'line' as ElementType, points: [{x:550,y:50},{x:650,y:50},{x:650,y:150},{x:600,y:150}], color:'#334155', width:2 },
  { id: 't3', type: 'line' as ElementType, points: [{x:550,y:200},{x:600,y:200},{x:600,y:350}], color:'#334155', width:2 },
  // Isocenter
  { id: 't4', type: 'circle' as ElementType, points: [{x:300,y:200},{x:8,y:8}], color:'#dc2626', width:2 },
  // Labels
  { id: 't5', type: 'freehand' as ElementType, points: [{x:290,y:180},{x:310,y:180}], color:'#dc2626', width:1 },
];

export default function SketchPadDialog({ open, onOpenChange }: SketchPadDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pencil');
  const [elements, setElements] = useState<SketchElement[]>(BUNKER_TEMPLATE);
  const [currentElement, setCurrentElement] = useState<SketchElement | null>(null);
  const [color, setColor] = useState('#334155');
  const [lineWidth, setLineWidth] = useState(2);
  const [showGrid, setShowGrid] = useState(true);
  const [scale, setScale] = useState(1);
  const isDrawing = useRef(false);

  const COLORS = ['#334155', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#000000'];
  const WIDTHS = [1, 2, 3, 5, 8];

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 750, h = 450;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr * scale, dpr * scale);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Grid
    if (showGrid) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      const gridSize = 25;
      for (let x = 0; x < w; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }

    // Draw elements
    [...elements, currentElement].filter(Boolean).forEach(el => {
      if (!el) return;
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'freehand' || el.type === 'line') {
        if (el.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) ctx.lineTo(el.points[i].x, el.points[i].y);
        ctx.stroke();
      } else if (el.type === 'rect') {
        const p = el.points;
        if (p.length < 2) return;
        ctx.strokeRect(p[0].x, p[0].y, p[1].x - p[0].x, p[1].y - p[0].y);
      } else if (el.type === 'circle') {
        const p = el.points;
        if (p.length < 2) return;
        ctx.beginPath();
        ctx.arc(p[0].x, p[0].y, p[1].x, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
      }
    });
  }, [elements, currentElement, showGrid, scale]);

  useEffect(() => { if (open) drawCanvas(); }, [open, drawCanvas]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const pos = getPos(e);
    const id = `el_${Date.now()}`;

    if (tool === 'pencil' || tool === 'eraser') {
      setCurrentElement({ id, type: 'freehand', points: [pos], color: tool === 'eraser' ? '#ffffff' : color, width: tool === 'eraser' ? 20 : lineWidth });
    } else if (tool === 'line') {
      setCurrentElement({ id, type: 'line', points: [pos, pos], color, width: lineWidth });
    } else if (tool === 'rect') {
      setCurrentElement({ id, type: 'rect', points: [pos, pos], color, width: lineWidth });
    } else if (tool === 'circle') {
      setCurrentElement({ id, type: 'circle', points: [pos, {x:0,y:0}], color, width: lineWidth });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !currentElement) return;
    const pos = getPos(e);
    setCurrentElement(prev => {
      if (!prev) return null;
      if (prev.type === 'freehand') return { ...prev, points: [...prev.points, pos] };
      if (prev.type === 'line' || prev.type === 'rect') {
        const pts = [...prev.points];
        pts[1] = pos;
        return { ...prev, points: pts };
      }
      if (prev.type === 'circle') {
        const dx = pos.x - prev.points[0].x;
        const dy = pos.y - prev.points[0].y;
        const r = Math.sqrt(dx*dx + dy*dy);
        return { ...prev, points: [prev.points[0], {x:r, y:r}] };
      }
      return prev;
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    if (currentElement) {
      setElements(prev => [...prev, currentElement]);
      setCurrentElement(null);
    }
  };

  const clearCanvas = () => setElements([]);

  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Croquis_Bunker_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  const TOOLS: Array<{id: Tool; icon: typeof Pencil; label: string}> = [
    { id: 'pencil', icon: Pencil, label: 'Lapiz' },
    { id: 'line', icon: Minus, label: 'Linea' },
    { id: 'rect', icon: Square, label: 'Rect' },
    { id: 'circle', icon: Circle, label: 'Circulo' },
    { id: 'eraser', icon: Eraser, label: 'Borrador' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil className="w-5 h-5 text-blue-500" />
            Croquis / Sketch Pad — Plano de Bunker
            <Badge variant="outline" className="text-[10px]">Template incluido</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 pb-2 flex items-center gap-2 flex-wrap">
          {TOOLS.map(t => (
            <Button key={t.id} size="sm" variant={tool === t.id ? 'default' : 'outline'} className="h-7 text-xs gap-1" onClick={() => setTool(t.id)}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </Button>
          ))}
          <Separator orientation="vertical" className="h-5" />
          {COLORS.map(c => (
            <button key={c} className={`w-5 h-5 rounded-full border-2 ${color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
          ))}
          <Separator orientation="vertical" className="h-5" />
          {WIDTHS.map(w => (
            <button key={w} className={`w-6 h-6 flex items-center justify-center rounded ${lineWidth === w ? 'bg-slate-200' : ''}`} onClick={() => setLineWidth(w)}>
              <div className="bg-slate-600 rounded-full" style={{ width: w, height: w }} />
            </button>
          ))}
          <div className="flex-1" />
          <Button size="sm" variant={showGrid ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setShowGrid(!showGrid)}>
            <Grid3x3 className="w-3.5 h-3.5 mr-1" />Grid
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={clearCanvas}>
            <RotateCcw className="w-3.5 h-3.5" />Limpiar
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={exportPNG}>
            <Download className="w-3.5 h-3.5" />PNG
          </Button>
        </div>

        {/* Canvas */}
        <div className="px-6 pb-4 flex justify-center">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ width: 750, height: 450, borderRadius: 8, border: '1px solid #e2e8f0', cursor: tool === 'pencil' ? 'crosshair' : 'default' }}
          />
        </div>

        <div className="px-6 pb-4 text-[10px] text-slate-500">
          Template: Layout tipico de bunker con laberinto. Dibuje encima para personalizar.
          Click y arrastre para dibujar. Use Grid para precision.
        </div>
      </DialogContent>
    </Dialog>
  );
}
