// MultiLayerShieldDialog — barrera de varias capas (B_total = Π Bᵢ).
// Fase 7: la transmisión de cada capa sale de NCRP 151 (TVL₁/TVLₑ, Tabla B.2) o NCRP 147 (Archer, Tablas B.1/C.1)
// con `blindajeMulticapa`; la dosis detrás incluye el rendimiento K¹ (o W·U/d²). Antes: tabla TVL local errónea,
// factores de buildup heurísticos y área fija de 10 m².
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { Layers, Plus, Trash2, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import EntradaCargaHaz from '@/components/EntradaCargaHaz';
import { CARGA_MV_INICIAL } from '@/lib/calculadorasNormativas';
import {
  NOMBRE_MATERIAL, OBJETIVOS_DISENO, blindajeMulticapa, materialesDe, referenciaHaz, type CapaMulticapa, type CargaHaz,
} from '@/lib/calculadorasNormativas';

interface Capa extends CapaMulticapa { id: string }
const sel = 'h-7 w-full rounded-md border border-input px-1 text-xs';

/** Con `open`/`onClose` se controla desde fuera (p. ej. LaminatedBarrierCalculator); sin ellos, desde el store. */
export default function MultiLayerShieldDialog(props: { open?: boolean; onClose?: () => void } = {}) {
  const abiertoStore = useAppStore(s => dialogoAbierto(s.dialogs.multiLayerShield));
  const open = props.open ?? abiertoStore;
  const close = () => (props.onClose ? props.onClose() : useAppStore.getState().close('multiLayerShield'));
  const [carga, setCarga] = useState<CargaHaz>(CARGA_MV_INICIAL);
  const [areaId, setAreaId] = useState<string>('no_controlada');
  const [T, setT] = useState(0.025);
  const [area, setArea] = useState(20);
  const [capas, setCapas] = useState<Capa[]>([{ id: '1', material: 'lead', espesor_mm: 50 }, { id: '2', material: 'concrete', espesor_mm: 1200 }]);
  const P = OBJETIVOS_DISENO.find(o => o.id === areaId)!.P_mSv_semana;
  const materiales = materialesDe(carga);
  const cambiarCarga = (c: CargaHaz) => {
    setCarga(c);
    const ms = materialesDe(c);
    setCapas(ls => ls.map(l => (ms.includes(l.material) ? l : { ...l, material: ms[0] })));
  };
  const up = (id: string, patch: Partial<Capa>) => setCapas(p => p.map(l => (l.id === id ? { ...l, ...patch } : l)));

  const { r, error } = useMemo(() => {
    try { return { r: blindajeMulticapa(carga, capas, P, T, area), error: null }; } catch (e) { return { r: null, error: (e as Error).message }; }
  }, [carga, capas, P, T, area]);

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Layers className="w-5 h-5 text-[#f97316]" /> Blindaje multicapa — B_total = B₁ × B₂ × … × Bₙ
          </DialogTitle>
          <DialogDescription className="text-xs">Transmisión de banda ancha por capa con {referenciaHaz(carga)}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <EntradaCargaHaz carga={carga} onChange={cambiarCarga} prefijo="ml" />
          <div className="grid grid-cols-3 gap-2">
            <div><Label htmlFor="ml-area-tipo" className="text-[10px]">Objetivo de diseño P</Label>
              <select id="ml-area-tipo" className={sel} value={areaId} onChange={e => setAreaId(e.target.value)}>
                {OBJETIVOS_DISENO.map(o => <option key={o.id} value={o.id}>{o.etiqueta}</option>)}
              </select></div>
            <div><Label htmlFor="ml-T" className="text-[10px]">Factor de ocupación T</Label><Input id="ml-T" type="number" step="any" value={T} onChange={e => setT(+e.target.value)} className="h-7 text-xs" /></div>
            <div><Label htmlFor="ml-area" className="text-[10px]">Área de la barrera (m²)</Label><Input id="ml-area" type="number" value={area} onChange={e => setArea(+e.target.value)} className="h-7 text-xs" /></div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-600">Capas ({capas.length})</span>
              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setCapas(p => [...p, { id: String(Date.now()), material: materiales[0], espesor_mm: 10 }])}>
                <Plus className="w-3 h-3 mr-1" />Añadir capa
              </Button>
            </div>
            {capas.map((l, i) => (
              <div key={l.id} className="flex items-center gap-2">
                <span className="text-[10px] w-6 text-slate-500">#{i + 1}</span>
                <select aria-label={`Material de la capa ${i + 1}`} className={sel} value={l.material} onChange={e => up(l.id, { material: e.target.value })}>
                  {materiales.map(m => <option key={m} value={m}>{NOMBRE_MATERIAL[m]}</option>)}
                </select>
                <Input aria-label={`Espesor de la capa ${i + 1} (mm)`} type="number" value={l.espesor_mm} onChange={e => up(l.id, { espesor_mm: +e.target.value })} className="h-7 text-xs w-28" />
                <span className="text-[10px] text-slate-500">mm</span>
                <span className="text-[10px] font-mono w-20">B = {r ? r.capas[i].transmision.toExponential(2) : '—'}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" aria-label={`Quitar capa ${i + 1}`} disabled={capas.length <= 1} onClick={() => setCapas(p => p.filter(x => x.id !== l.id))}>
                  <Trash2 className="w-3 h-3 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          {r && (
            <Card className={r.cumple ? 'border-green-300' : 'border-red-300'}><CardContent className="p-3 space-y-1 text-[11px]">
              <div className="flex items-center gap-2 font-bold" data-testid="ml-dictamen">
                {r.cumple ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                {r.cumple ? 'CUMPLE: T·K ≤ P' : 'NO CUMPLE: T·K > P'}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>B total: <span className="font-mono" data-testid="ml-btotal">{r.B_total.toExponential(3)}</span></div>
                <div>K sin blindaje: <span className="font-mono">{r.K_sin_blindaje_mSv_semana.toPrecision(3)} mSv/sem</span></div>
                <div>T·K con blindaje: <span className="font-mono">{r.dosisOcupacion_mSv_semana.toExponential(2)} mSv/sem (P = {P})</span></div>
                <div>Equivalente en plomo: <span className="font-mono">{r.equivalentePlomo_mm.toFixed(1)} mm</span></div>
                <div>Espesor total: <span className="font-mono">{r.espesorTotal_mm.toFixed(0)} mm</span></div>
                <div>Masa total: <span className="font-mono">{(r.masaTotal_kg / 1000).toFixed(2)} t</span></div>
              </div>
            </CardContent></Card>
          )}
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Producto de transmisiones de banda ancha (incluyen la acumulación); sin factores de buildup adicionales.</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
