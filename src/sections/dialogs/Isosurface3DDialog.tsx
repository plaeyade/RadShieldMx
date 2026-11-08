/**
 * Isosuperficie 3D — Fase 5 (docs/plan-motores-calculo.md). Los puntos salen de `malla3DPlano`
 * (`visoresDosis` → `doseFieldEngine`): cortes del plano del lienzo a varias alturas, con barreras reales;
 * kerma en mSv/semana. Antes: fuente ficticia en una sala de 10×8×6 m con Γ = 0.11 sobre «Ci» y niveles
 * en mSv/h sin fundamento. Sigue inactivo tras `VISOR_ISOSUPERFICIE_3D` (featureFlags) hasta que se autorice.
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/stores/appStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { NIVELES_ISOSUPERFICIE, malla3DPlano, type PuntoDosis3D } from '@/lib/visoresDosis';
import { Box, RotateCcw, Move3D, BookOpen } from 'lucide-react';

interface Vista { rx: number; ry: number; sc: number; cx: number; cy: number; centro: { x: number; y: number; z: number } }

/** Proyección: x del plano → x, altura → arriba en pantalla, y del plano → profundidad. */
function proj(x: number, y: number, z: number, v: Vista) {
  const X = x - v.centro.x, Y = -(z - v.centro.z), Z = y - v.centro.y;
  const cx_ = Math.cos(v.rx), sx_ = Math.sin(v.rx), cy_ = Math.cos(v.ry), sy_ = Math.sin(v.ry);
  const y1 = Y * cx_ - Z * sx_, z1 = Y * sx_ + Z * cx_;
  const x2 = X * cy_ + z1 * sy_, z2 = -X * sy_ + z1 * cy_;
  const f = 400 / (400 + z2 * 20);
  return { sx: v.cx + x2 * v.sc * f, sy: v.cy + y1 * v.sc * f, sz: z2 };
}

export default function Isosurface3DDialog() {
  // `dialogs[nombre]` es booleano en appStore (`open()` guarda `true`); `?.open` sobre un booleano daba
  // siempre undefined y el diálogo nunca se abría. Se aceptan ambas formas.
  const open = useAppStore(s => { const d = s.dialogs.isosurface3d; return d === true || d?.open === true; });
  const close = () => useAppStore.getState().close('isosurface3d');
  const floorPlan = useCanvasStore((st) => st.floorPlan);
  const cv = useRef<HTMLCanvasElement>(null);
  const [lvl, setLvl] = useState(0.02);
  const [rx, setRx] = useState(0.3);
  const [ry, setRy] = useState(0.5);
  const [sc, setSc] = useState(40);
  const [drag, setDrag] = useState(false);
  const dref = useRef({ x: 0, y: 0 });

  const puntos = useMemo<PuntoDosis3D[]>(() => (open ? malla3DPlano(floorPlan) : []), [open, floorPlan]);
  const dentro = useMemo(() => puntos.filter((p) => p.kerma_mSv_semana >= lvl), [puntos, lvl]);
  const dims = useMemo(() => ({
    x: Math.max(1, ...puntos.map((p) => p.x_m)),
    y: Math.max(1, ...puntos.map((p) => p.y_m)),
    z: Math.max(1, ...puntos.map((p) => p.z_m)),
  }), [puntos]);

  useEffect(() => {
    const c = cv.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const w = c.width, h = c.height;
    const vista: Vista = { rx, ry, sc, cx: w / 2, cy: h / 2, centro: { x: dims.x / 2, y: dims.y / 2, z: dims.z / 2 } };
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, w, h);
    if (!puntos.length) {
      ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif';
      ctx.fillText('El plano no tiene fuentes: agrega una fuente en el lienzo.', 20, h / 2);
      return;
    }
    ctx.strokeStyle = '#1a3a6a55'; ctx.lineWidth = 0.5;
    const paso = Math.max(1, Math.round(Math.max(dims.x, dims.y) / 6));
    for (let i = 0; i <= dims.x; i += paso) { for (let j = 0; j <= dims.y; j += paso) {
      const a = proj(i, j, 0, vista), b = proj(i, j, dims.z, vista);
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    }}
    // Barreras del plano (en el piso), en metros relativos al origen de la malla.
    const s = floorPlan.scale_m_per_pixel;
    const x0 = puntos[0].x_px - puntos[0].x_m / s, y0 = puntos[0].y_px - puntos[0].y_m / s;
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
    for (const b of floorPlan.barriers) {
      const a = proj((b.x1 - x0) * s, (b.y1 - y0) * s, 0, vista), e = proj((b.x2 - x0) * s, (b.y2 - y0) * s, 0, vista);
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(e.sx, e.sy); ctx.stroke();
    }
    for (const f of floorPlan.sources) {
      const p = proj((f.x - x0) * s, (f.y - y0) * s, f.isocenterHeight_m ?? 0, vista);
      ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(p.sx, p.sy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.font = 'bold 10px sans-serif'; ctx.fillText(f.name || 'FUENTE', p.sx - 20, p.sy - 8);
    }
    const pp = dentro.map((p) => ({ ...proj(p.x_m, p.y_m, p.z_m, vista), d: p.kerma_mSv_semana })).sort((a, b) => b.sz - a.sz);
    for (const p of pp) {
      const r = Math.min(1, Math.log10(p.d / lvl + 1) / 3);
      const hue = r > 0.8 ? 0 : r > 0.5 ? 30 : r > 0.2 ? 60 : 120;
      ctx.fillStyle = `hsla(${hue}, 90%, 60%, ${0.15 + r * 0.5})`;
      ctx.beginPath(); ctx.arc(p.sx, p.sy, 1.5 + r * 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
    ctx.fillText(`Nivel: ${lvl} mSv/sem | Puntos ≥ nivel: ${pp.length} de ${puntos.length} | Rot: (${rx.toFixed(2)}, ${ry.toFixed(2)})`, 10, 20);
  }, [puntos, dentro, dims, lvl, rx, ry, sc, floorPlan]);

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto" data-testid="isosuperficie-3d">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Box className="w-5 h-5 text-[#0891b2]" /> Isosuperficie 3D — kerma semanal del plano
            <span className="text-[10px] font-mono text-slate-400">Motor de campo</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div><Label className="text-[10px]">Nivel (mSv/sem)</Label>
              <Select value={lvl.toString()} onValueChange={v => setLvl(+v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{NIVELES_ISOSUPERFICIE.map(v => <SelectItem key={v} value={v.toString()} className="text-xs">{v} mSv/sem</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-[10px]">Zoom</Label><Input type="range" min={10} max={80} value={sc} onChange={e => setSc(+e.target.value)} className="h-7" /></div>
            <div className="flex items-end"><Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => { setRx(0.3); setRy(0.5); }}><RotateCcw className="w-3 h-3" />Reset</Button></div>
            <div className="flex items-end text-[10px] text-slate-500" data-testid="isosuperficie-conteo">{dentro.length} de {puntos.length} puntos ≥ {lvl} mSv/sem</div>
          </div>
          <div className="relative border border-slate-700 rounded-lg overflow-hidden" style={{ cursor: drag ? 'grabbing' : 'grab' }}>
            <canvas ref={cv} width={700} height={400} className="w-full block"
              onMouseDown={e => { setDrag(true); dref.current = { x: e.clientX, y: e.clientY }; }}
              onMouseMove={e => { if (!drag) return; const dx = e.clientX - dref.current.x, dy = e.clientY - dref.current.y; setRy(p => p + dx * 0.01); setRx(p => Math.max(-1, Math.min(1, p + dy * 0.01))); dref.current = { x: e.clientX, y: e.clientY }; }}
              onMouseUp={() => setDrag(false)} onMouseLeave={() => setDrag(false)} />
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span>Color: múltiplos del nivel (verde ≈ nivel → rojo ≥ 1000×)</span>
            <span className="ml-auto flex items-center gap-1"><Move3D className="w-3 h-3" /> Arrastra para rotar</span>
          </div>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />
            Motor de campo (NCRP 147/151, TG-108): cortes a 0.25–2.75 m; distancia vertical a la altura de la fuente; sin crédito de oblicuidad vertical. Diseño preliminar.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
