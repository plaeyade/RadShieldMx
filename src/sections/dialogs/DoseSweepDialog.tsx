import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { Play, Pause, RotateCcw, BookOpen } from 'lucide-react';

export default function DoseSweepDialog() {
  const open = useAppStore(s => s.dialogs.doseSweep?.open ?? false);
  const close = () => useAppStore.getState().close('doseSweep');
  const cv = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [angle, setAngle] = useState(0);
  const raf = useRef<number>(0);

  const draw = useCallback((a: number) => {
    const c = cv.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const w = c.width, h = c.height, cx = w / 2, cy = h / 2;
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, w, h);
    // Grid
    ctx.strokeStyle = '#1a3a6a33'; ctx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
    for (let i = 0; i < h; i += 20) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
    // Source
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.fillText('SOURCE', cx - 20, cy - 10);
    // Sweep beam
    const rad = (a * Math.PI) / 180;
    const beamLen = 180;
    const ex = cx + Math.cos(rad) * beamLen;
    const ey = cy + Math.sin(rad) * beamLen;
    // Beam gradient
    const grad = ctx.createLinearGradient(cx, cy, ex, ey);
    grad.addColorStop(0, 'rgba(249,115,22,0.6)');
    grad.addColorStop(0.5, 'rgba(249,115,22,0.2)');
    grad.addColorStop(1, 'rgba(249,115,22,0.05)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex + Math.cos(rad + 0.15) * 20, ey + Math.sin(rad + 0.15) * 20); ctx.lineTo(ex + Math.cos(rad - 0.15) * 20, ey + Math.sin(rad - 0.15) * 20); ctx.closePath(); ctx.fill();
    // Beam center line
    ctx.strokeStyle = '#f9731680'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
    // Dose circles (isodose lines)
    const doseLevels = [0.5, 0.2, 0.1, 0.05];
    const colors = ['#ef444480', '#f9731680', '#eab30880', '#10b98180'];
    doseLevels.forEach((level, i) => {
      const radius = 20 + i * 35;
      ctx.strokeStyle = colors[i]; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = colors[i]; ctx.font = '8px monospace';
      ctx.fillText(`${(level * 100).toFixed(0)}%`, cx + radius + 2, cy - radius + 10);
    });
    // Angle text
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace';
    ctx.fillText(`Angulo: ${a.toFixed(1)}deg`, 10, 20);
    ctx.fillText(`Direccion: ${Math.cos(rad) > 0 ? 'E' : 'W'}${Math.sin(rad) > 0 ? 'S' : 'N'}`, 10, 35);
  }, []);

  useEffect(() => {
    draw(angle);
  }, [angle, draw]);

  useEffect(() => {
    if (!playing) { cancelAnimationFrame(raf.current); return; }
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setAngle(a => (a + dt * 30) % 360);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setPlaying(false); cancelAnimationFrame(raf.current); } close(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Play className="w-5 h-5 text-[#e11d48]" /> Animated Dose Sweep — v126
            <span className="text-[10px] font-mono text-slate-400">360deg rotation visualization</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant={playing ? 'default' : 'outline'} className="h-8 text-[10px] gap-1" onClick={() => setPlaying(!playing)}>
              {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />} {playing ? 'Pausar' : 'Reproducir'}
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" onClick={() => { setPlaying(false); setAngle(0); }}>
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
            <input type="range" min={0} max={360} value={angle} onChange={e => { setPlaying(false); setAngle(+e.target.value); }} className="flex-1" />
          </div>
          <div className="border border-slate-700 rounded-lg overflow-hidden">
            <canvas ref={cv} width={500} height={300} className="w-full block" />
          </div>
          <div className="flex gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500/50" /> 50%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500/50" /> 20%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" /> 10%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" /> 5%</span>
          </div>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Ref: NCRP 151 Ch.7 | Isodose curves | Dose sweep visualization</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
