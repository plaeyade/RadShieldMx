import { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/stores/appStore';
import { Box, RotateCcw, Move3D, Crosshair, BookOpen } from 'lucide-react';

interface DP { x: number; y: number; z: number; dose: number; }

function genDF(sx: number, sy: number, sz: number, act: number): DP[] {
  const pts: DP[] = [];
  const g = 0.11;
  for (let x = 0; x < 10; x += 0.2) {
    for (let y = 0; y < 8; y += 0.2) {
      for (let z = 0; z < 6; z += 0.2) {
        const d2 = (x - sx) ** 2 + (y - sy) ** 2 + (z - sz) ** 2;
        const d = Math.sqrt(d2) || 0.1;
        const dose = (act * g) / d2;
        if (dose > 0.001) pts.push({ x, y, z, dose });
      }
    }
  }
  return pts;
}

function proj(p: DP, rx: number, ry: number, sc: number, cx: number, cy: number) {
  const x = p.x - 5, y = p.y - 4, z = p.z - 3;
  const cx_ = Math.cos(rx), sx_ = Math.sin(rx), cy_ = Math.cos(ry), sy_ = Math.sin(ry);
  const y1 = y * cx_ - z * sx_, z1 = y * sx_ + z * cx_;
  const x2 = x * cy_ + z1 * sy_, z2 = -x * sy_ + z1 * cy_;
  const f = 400 / (400 + z2 * 20);
  return { sx: cx + x2 * sc * f, sy: cy + y1 * sc * f, sz: z2, d: p.dose };
}

export default function Isosurface3DDialog() {
  const open = useAppStore(s => s.dialogs.isosurface3d?.open ?? false);
  const close = () => useAppStore.getState().close('isosurface3d');
  const cv = useRef<HTMLCanvasElement>(null);
  const [act, setAct] = useState(1000);
  const [lvl, setLvl] = useState(0.02);
  const [rx, setRx] = useState(0.3);
  const [ry, setRy] = useState(0.5);
  const [sc, setSc] = useState(40);
  const [drag, setDrag] = useState(false);
  const dref = useRef({ x: 0, y: 0 });

  const df = useMemo(() => genDF(5, 4, 3, act), [act]);

  useEffect(() => {
    const c = cv.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const w = c.width, h = c.height;
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1a3a6a33'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i += 2) { for (let j = 0; j <= 8; j += 2) {
      const a = proj({ x: i, y: j, z: 0, dose: 0 }, rx, ry, sc, w / 2, h / 2);
      const b = proj({ x: i, y: j, z: 6, dose: 0 }, rx, ry, sc, w / 2, h / 2);
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    }}
    const s = proj({ x: 5, y: 4, z: 3, dose: 999 }, rx, ry, sc, w / 2, h / 2);
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(s.sx, s.sy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'bold 10px sans-serif'; ctx.fillText('SOURCE', s.sx - 20, s.sy - 8);
    const pp = df.map(p => proj(p, rx, ry, sc, w / 2, h / 2)).filter(p => p.d >= lvl * 0.1).sort((a, b) => b.sz - a.sz);
    for (const p of pp) {
      const r = Math.min(p.d / (lvl * 50), 1); if (r < 0.02) continue;
      const hue = r > 0.8 ? 0 : r > 0.5 ? 30 : r > 0.2 ? 60 : 120;
      ctx.fillStyle = `hsla(${hue}, 90%, 60%, ${r * 0.6})`;
      ctx.beginPath(); ctx.arc(p.sx, p.sy, 1 + r * 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
    ctx.fillText(`Level: ${lvl} mSv/h | Points: ${pp.length} | Rot: (${rx.toFixed(2)}, ${ry.toFixed(2)})`, 10, 20);
  }, [df, lvl, rx, ry, sc]);

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Box className="w-5 h-5 text-[#0891b2]" /> 3D Isosurface Dose Map — v116
            <span className="text-[10px] font-mono text-slate-400">Canvas 3D projection</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            <div><Label className="text-[10px]">Actividad (Ci)</Label><Input type="number" value={act} onChange={e => setAct(+e.target.value)} className="h-7 text-xs" /></div>
            <div><Label className="text-[10px]">Iso-Level</Label>
              <Select value={lvl.toString()} onValueChange={v => setLvl(+v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{[0.002, 0.01, 0.02, 0.1, 0.5, 1, 5].map(v => <SelectItem key={v} value={v.toString()} className="text-xs">{v} mSv/h</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-[10px]">Zoom</Label><Input type="range" min={10} max={80} value={sc} onChange={e => setSc(+e.target.value)} className="h-7" /></div>
            <div className="flex items-end"><Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => { setRx(0.3); setRy(0.5); }}><RotateCcw className="w-3 h-3" />Reset</Button></div>
            <div className="flex items-end"><Button size="sm" variant="outline" className="h-7 text-[10px] gap-1"><Crosshair className="w-3 h-3" />Probe</Button></div>
          </div>
          <div className="relative border border-slate-700 rounded-lg overflow-hidden" style={{ cursor: drag ? 'grabbing' : 'grab' }}>
            <canvas ref={cv} width={700} height={400} className="w-full block"
              onMouseDown={e => { setDrag(true); dref.current = { x: e.clientX, y: e.clientY }; }}
              onMouseMove={e => { if (!drag) return; const dx = e.clientX - dref.current.x, dy = e.clientY - dref.current.y; setRy(p => p + dx * 0.01); setRx(p => Math.max(-1, Math.min(1, p + dy * 0.01))); dref.current = { x: e.clientX, y: e.clientY }; }}
              onMouseUp={() => setDrag(false)} onMouseLeave={() => setDrag(false)} />
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Seguro</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Atencion</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Precaucion</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critico</span>
            <span className="ml-auto flex items-center gap-1"><Move3D className="w-3 h-3" /> Arrastra para rotar</span>
          </div>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Ref: RayXpert 3D kernel | NCRP 151 Ch.7</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
