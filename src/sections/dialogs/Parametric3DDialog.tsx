import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { Box, RotateCcw, Move3D, BookOpen, Plus, Minus } from 'lucide-react';

interface Primitive { type: 'box' | 'cylinder' | 'sphere'; x: number; y: number; z: number; w: number; h: number; d: number; color: string; }

const COLORS = ['#f97316', '#2563eb', '#10b981', '#dc2626', '#7c3aed', '#0891b2', '#d97706'];

function project3D(x: number, y: number, z: number, rx: number, ry: number, sc: number, cx: number, cy: number) {
  const cosX = Math.cos(rx), sinX = Math.sin(rx), cosY = Math.cos(ry), sinY = Math.sin(ry);
  const y1 = y * cosX - z * sinX, z1 = y * sinX + z * cosX;
  const x2 = x * cosY + z1 * sinY, z2 = -x * sinY + z1 * cosY;
  const fov = 400 / (400 + z2 * 30);
  return { sx: cx + x2 * sc * fov, sy: cy + y1 * sc * fov, sz: z2 };
}

function drawBox(ctx: CanvasRenderingContext2D, p: Primitive, rx: number, ry: number, sc: number, cx: number, cy: number) {
  const hw = p.w / 2, hh = p.h / 2, hd = p.d / 2;
  const verts = [
    [-hw, -hh, -hd], [hw, -hh, -hd], [hw, hh, -hd], [-hw, hh, -hd],
    [-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd],
  ].map(v => project3D(v[0] + p.x, v[1] + p.y, v[2] + p.z, rx, ry, sc, cx, cy));
  const faces = [[0,1,2,3], [4,5,6,7], [0,1,5,4], [2,3,7,6], [1,2,6,5], [0,3,7,4]];
  faces.forEach(f => {
    const avgZ = f.reduce((s, i) => s + verts[i].sz, 0) / 4;
    ctx.fillStyle = p.color + (avgZ < 0 ? '60' : avgZ > 5 ? '30' : '45');
    ctx.beginPath();
    ctx.moveTo(verts[f[0]].sx, verts[f[0]].sy);
    f.slice(1).forEach(i => ctx.lineTo(verts[i].sx, verts[i].sy));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });
}

function drawCylinder(ctx: CanvasRenderingContext2D, p: Primitive, rx: number, ry: number, sc: number, cx: number, cy: number) {
  const r = p.w / 2, segments = 16;
  for (let ring = 0; ring <= 8; ring++) {
    const y = -p.h / 2 + (p.h / 8) * ring;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const pt = project3D(Math.cos(a) * r + p.x, y + p.y, Math.sin(a) * r + p.z, rx, ry, sc, cx, cy);
      if (i === 0) ctx.moveTo(pt.sx, pt.sy); else ctx.lineTo(pt.sx, pt.sy);
    }
    ctx.strokeStyle = p.color + (ring === 0 || ring === 8 ? 'cc' : '66');
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

function drawSphere(ctx: CanvasRenderingContext2D, p: Primitive, rx: number, ry: number, sc: number, cx: number, cy: number) {
  const r = p.w / 2;
  for (let lat = 1; lat < 8; lat++) {
    const phi = (lat / 8) * Math.PI;
    const y = Math.cos(phi) * r, ringR = Math.sin(phi) * r;
    ctx.beginPath();
    for (let i = 0; i <= 32; i++) {
      const theta = (i / 32) * Math.PI * 2;
      const pt = project3D(Math.cos(theta) * ringR + p.x, y + p.y, Math.sin(theta) * ringR + p.z, rx, ry, sc, cx, cy);
      if (i === 0) ctx.moveTo(pt.sx, pt.sy); else ctx.lineTo(pt.sx, pt.sy);
    }
    ctx.strokeStyle = p.color + '55';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  const pt = project3D(p.x, p.y, p.z, rx, ry, sc, cx, cy);
  const pr = r * sc * 0.8;
  ctx.fillStyle = p.color + '20';
  ctx.beginPath();
  ctx.arc(pt.sx, pt.sy, pr, 0, Math.PI * 2);
  ctx.fill();
}

export default function Parametric3DDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.parametric3d));
  const close = () => useAppStore.getState().close('parametric3d');
  const cv = useRef<HTMLCanvasElement>(null);
  const [prims, setPrims] = useState<Primitive[]>([
    { type: 'box', x: 0, y: 0, z: 0, w: 100, h: 80, d: 60, color: '#f97316' },
    { type: 'cylinder', x: 80, y: 0, z: 0, w: 40, h: 100, d: 40, color: '#2563eb' },
  ]);
  const [rx, setRx] = useState(0.4);
  const [ry, setRy] = useState(0.6);
  const [sc, setSc] = useState(2);
  const [sel, setSel] = useState(0);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    const c = cv.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const w = c.width, h = c.height;
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, w, h);
    const sorted = [...prims].map((p, i) => ({ p, i, cz: project3D(p.x, p.y, p.z, rx, ry, sc, w / 2, h / 2).sz })).sort((a, b) => b.cz - a.cz);
    sorted.forEach(({ p, i }) => {
      if (p.type === 'box') drawBox(ctx, p, rx, ry, sc, w / 2, h / 2);
      else if (p.type === 'cylinder') drawCylinder(ctx, p, rx, ry, sc, w / 2, h / 2);
      else drawSphere(ctx, p, rx, ry, sc, w / 2, h / 2);
      if (i === sel) {
        const cp = project3D(p.x, p.y, p.z, rx, ry, sc, w / 2, h / 2);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(cp.sx, cp.sy, 15, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
    });
    ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
    ctx.fillText(`Objects: ${prims.length} | Selected: ${prims[sel]?.type || '-'} | Zoom: ${sc.toFixed(1)}x`, 10, 20);
  }, [prims, rx, ry, sc, sel]);

  const addPrim = (type: Primitive['type']) => {
    setPrims(p => [...p, { type, x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 40, z: (Math.random() - 0.5) * 30, w: type === 'sphere' ? 50 : 60, h: 60, d: 60, color: COLORS[p.length % COLORS.length] }]);
    setSel(prims.length);
  };
  const updateSel = (patch: Partial<Primitive>) => setPrims(p => p.map((pr, i) => i === sel ? { ...pr, ...patch } : pr));

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Box className="w-5 h-5 text-[#2563eb]" /> 3D Parametric Primitives — v120
            <span className="text-[10px] font-mono text-slate-400">Box | Cylinder | Sphere</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-2">
            <div className="col-span-3 flex gap-1">
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => addPrim('box')}><Plus className="w-3 h-3" />Box</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => addPrim('cylinder')}><Plus className="w-3 h-3" />Cyl</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => addPrim('sphere')}><Plus className="w-3 h-3" />Sph</Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] text-red-400" onClick={() => setPrims(p => p.filter((_, i) => i !== sel))}><Minus className="w-3 h-3" /></Button>
            </div>
            <div><Label className="text-[9px]">Zoom</Label><Input type="range" min={0.5} max={5} step={0.1} value={sc} onChange={e => setSc(+e.target.value)} className="h-7" /></div>
            <div className="flex items-end"><Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => { setRx(0.4); setRy(0.6); }}><RotateCcw className="w-3 h-3" />Reset</Button></div>
            <div className="flex items-end"><Button size="sm" variant="outline" className="h-7 text-[10px] gap-1"><Move3D className="w-3 h-3" />Move</Button></div>
          </div>

          {prims[sel] && (
            <div className="grid grid-cols-6 gap-2 text-[10px]">
              <div><Label className="text-[9px]">X</Label><Input type="number" value={prims[sel].x} onChange={e => updateSel({ x: +e.target.value })} className="h-7 text-xs" /></div>
              <div><Label className="text-[9px]">Y</Label><Input type="number" value={prims[sel].y} onChange={e => updateSel({ y: +e.target.value })} className="h-7 text-xs" /></div>
              <div><Label className="text-[9px]">Z</Label><Input type="number" value={prims[sel].z} onChange={e => updateSel({ z: +e.target.value })} className="h-7 text-xs" /></div>
              <div><Label className="text-[9px]">W/Diam</Label><Input type="number" value={prims[sel].w} onChange={e => updateSel({ w: +e.target.value })} className="h-7 text-xs" /></div>
              <div><Label className="text-[9px]">H</Label><Input type="number" value={prims[sel].h} onChange={e => updateSel({ h: +e.target.value })} className="h-7 text-xs" /></div>
              <div><Label className="text-[9px]">Color</Label><Input type="color" value={prims[sel].color} onChange={e => updateSel({ color: e.target.value })} className="h-7 text-xs p-0" /></div>
            </div>
          )}

          <div className="border border-slate-700 rounded-lg overflow-hidden" style={{ cursor: drag ? 'grabbing' : 'grab' }}>
            <canvas ref={cv} width={700} height={400} className="w-full block"
              onMouseDown={_e => { setDrag(true); }} onMouseMove={e => { if (!drag) return; setRy(p => p + e.movementX * 0.01); setRx(p => Math.max(-1, Math.min(1, p + e.movementY * 0.01))); }} onMouseUp={() => setDrag(false)} onMouseLeave={() => setDrag(false)} />
          </div>
          <div className="flex gap-1 flex-wrap">
            {prims.map((p, i) => (
              <button key={i} onClick={() => setSel(i)} className={`px-2 py-0.5 rounded text-[9px] font-bold ${sel === i ? 'ring-1 ring-white' : ''}`} style={{ backgroundColor: p.color + '30', color: p.color }}>{i + 1}: {p.type}</button>
            ))}
          </div>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Ref: SketchUp Primitives | Inventor Parametric | NCRP 151 Geometry</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
