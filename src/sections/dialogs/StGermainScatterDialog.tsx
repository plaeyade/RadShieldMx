/**
 * StGermainScatterDialog — barrera secundaria de rayos X diagnóstico (dispersión + fuga).
 *
 * Fase 8c: antes combinaba dos fórmulas propias («St-Germain», cita no verificable, con TVL de plomo fijo de 0.5 mm, y
 * una «McGinley simplificada» ×1000 sin base). Ahora usa NCRP 147: K¹_sec de la Tabla 4.7 (fuga + dispersión a 90° o
 * 135°), K = K¹·N/d² (Ec. 4.4) y la transmisión de Archer de la Tabla C.1 (`espesorRequeridoHaz`).
 * Valores iniciales: NCRP 147 §5.3.1.2 (Rad Room all, N = 125, d = 3 m → K = 0.47 mGy/semana, 33 mm de concreto).
 */
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GitCompareArrows } from 'lucide-react';
import {
  DISTRIBUCIONES_SECUNDARIA, ETIQUETAS_NCRP147, MATERIALES_DIAGNOSTICO, NOMBRE_MATERIAL, OBJETIVOS_DISENO,
  espesorRequeridoHaz, kermaSinBlindajeHaz, type CargaHaz,
} from '@/lib/calculadorasNormativas';
import type { DistribucionNCRP147 } from '@/lib/ncrp147';

interface Props { open: boolean; onClose: () => void; }
type CargaSec = Extract<CargaHaz, { regimen: 'diagnostico' }>;

export default function StGermainScatterDialog({ open, onClose }: Props) {
  const [c, setC] = useState<CargaSec>({ regimen: 'diagnostico', distribucion: 'rad_room_all', barrera: 'secundaria', N_pacientes_semana: 125, U: 1, d_m: 3, geometria: 'lateral' });
  const [P, setP] = useState<number>(OBJETIVOS_DISENO[1].P_mSv_semana);
  const [T, setT] = useState(1);

  const r = useMemo(() => {
    try {
      return { K: kermaSinBlindajeHaz(c), filas: MATERIALES_DIAGNOSTICO.map(m => ({ m, mm: espesorRequeridoHaz(c, m, P, T) })), error: null as string | null };
    } catch (e) { return { K: NaN, filas: [], error: (e as Error).message }; }
  }, [c, P, T]);

  const sel = 'w-full h-8 text-xs border rounded px-2';
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><GitCompareArrows className="w-5 h-5 text-indigo-500" /> Barrera secundaria (dispersión + fuga)<Badge variant="outline" className="text-[10px]">NCRP 147 Ec. 4.4</Badge></DialogTitle>
          <DialogDescription className="text-[11px]">K¹_sec de la Tabla 4.7 ya combina la fuga del tubo y la dispersión del paciente para cada distribución de carga; la transmisión es la de banda ancha de la Tabla C.1.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2"><Label htmlFor="sg-dist" className="text-[11px]">Distribución de carga</Label>
            <select id="sg-dist" data-testid="sg-dist" className={sel} value={c.distribucion} onChange={e => setC(s => ({ ...s, distribucion: e.target.value as DistribucionNCRP147 }))}>
              {DISTRIBUCIONES_SECUNDARIA.map(d => <option key={d} value={d}>{ETIQUETAS_NCRP147[d]}</option>)}
            </select></div>
          <div><Label htmlFor="sg-geo" className="text-[11px]">Geometría</Label>
            <select id="sg-geo" data-testid="sg-geo" className={sel} value={c.geometria} onChange={e => setC(s => ({ ...s, geometria: e.target.value as 'lateral' | 'frontal' }))}>
              <option value="lateral">Fuga + dispersión a 90°</option><option value="frontal">Fuga + dispersión a 135°</option>
            </select></div>
          <div><Label htmlFor="sg-n" className="text-[11px]">Pacientes / semana</Label><Input id="sg-n" data-testid="sg-n" type="number" value={c.N_pacientes_semana} onChange={e => setC(s => ({ ...s, N_pacientes_semana: Number(e.target.value) }))} className="h-8 text-xs" /></div>
          <div><Label htmlFor="sg-d" className="text-[11px]">Distancia d_sec (m)</Label><Input id="sg-d" data-testid="sg-d" type="number" step={0.1} value={c.d_m} onChange={e => setC(s => ({ ...s, d_m: Number(e.target.value) }))} className="h-8 text-xs" /></div>
          <div><Label htmlFor="sg-t" className="text-[11px]">Ocupación T</Label><Input id="sg-t" data-testid="sg-t" type="number" step={0.05} value={T} onChange={e => setT(Number(e.target.value))} className="h-8 text-xs" /></div>
          <div className="col-span-3"><Label htmlFor="sg-p" className="text-[11px]">Objetivo de diseño P</Label>
            <select id="sg-p" data-testid="sg-p" className={sel} value={P} onChange={e => setP(Number(e.target.value))}>
              {OBJETIVOS_DISENO.map(o => <option key={o.id} value={o.P_mSv_semana}>{o.etiqueta}</option>)}
            </select></div>
        </div>
        {r.error ? <p role="alert" className="text-xs text-red-600">{r.error}</p> : (
          <div className="bg-slate-50 rounded-lg p-3 border space-y-2">
            <div className="text-xs">K sin blindaje = <strong data-testid="sg-k">{r.K.toPrecision(3)}</strong> mGy/semana; B = P/(T·K) = {Math.min(1, P / (T * r.K)).toExponential(2)}</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {r.filas.map(f => <div key={f.m} className="bg-white rounded border p-2"><div className="text-[9px] text-slate-500">{NOMBRE_MATERIAL[f.m]}</div><div className="font-bold" data-testid={`sg-${f.m}`}>{f.mm.toFixed(f.m === 'lead' ? 2 : 1)} mm</div></div>)}
            </div>
            <div className="text-[10px] text-slate-500">Sin preblindaje. Valores iniciales: NCRP 147 §5.3.1.2 (piso fuera de la mesa).</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
