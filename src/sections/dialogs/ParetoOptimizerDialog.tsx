// ParetoOptimizerDialog — comparación de materiales por costo, masa y espesor con frente de Pareto.
// Fase 7: el espesor de cada material sale de NCRP 151 (TVL₁/TVLₑ, Tabla B.2) o NCRP 147 (K¹ y Archer, Tablas
// 4.5/4.7, B.1/C.1) con `espesorRequeridoHaz`. Antes: tabla TVL local con HVL como TVL y valores de 6 MV erróneos.
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { TrendingDown, Trophy, BookOpen } from 'lucide-react';
import EntradaCargaHaz from '@/components/EntradaCargaHaz';
import { CARGA_MV_INICIAL } from '@/lib/calculadorasNormativas';
import {
  COSTO_REFERENCIA_USD_KG, NOMBRE_MATERIAL, OBJETIVOS_DISENO, compararMateriales, espesorRequeridoHaz, materialesDe,
  referenciaHaz, type CargaHaz,
} from '@/lib/calculadorasNormativas';

const sel = 'h-7 w-full rounded-md border border-input px-1 text-xs';

export default function ParetoOptimizerDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.paretoOptimizer));
  const close = () => useAppStore.getState().close('paretoOptimizer');
  const [carga, setCarga] = useState<CargaHaz>(CARGA_MV_INICIAL);
  const [areaId, setAreaId] = useState<string>('no_controlada');
  const [T, setT] = useState(0.025);
  const [area, setArea] = useState(20);
  const [costos, setCostos] = useState<Record<string, number>>(COSTO_REFERENCIA_USD_KG);
  const [pesos, setPesos] = useState({ costo: 0.4, masa: 0.3, espesor: 0.3 });
  const P = OBJETIVOS_DISENO.find(o => o.id === areaId)!.P_mSv_semana;

  const { opciones, error } = useMemo(() => {
    try {
      const espesores = Object.fromEntries(materialesDe(carga).map(m => [m, espesorRequeridoHaz(carga, m, P, T)]));
      return { opciones: compararMateriales(espesores, area, costos, pesos), error: null };
    } catch (e) { return { opciones: [], error: (e as Error).message }; }
  }, [carga, P, T, area, costos, pesos]);
  const best = opciones[0];

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="w-5 h-5 text-[#7c3aed]" /> Comparación de materiales — frente de Pareto
          </DialogTitle>
          <DialogDescription className="text-xs">Espesor requerido por material con {referenciaHaz(carga)}; ordenado por suma ponderada de costo, masa y espesor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <EntradaCargaHaz carga={carga} onChange={setCarga} prefijo="par" />
          <div className="grid grid-cols-3 gap-2">
            <div><Label htmlFor="par-area-tipo" className="text-[10px]">Objetivo de diseño P</Label>
              <select id="par-area-tipo" className={sel} value={areaId} onChange={e => setAreaId(e.target.value)}>
                {OBJETIVOS_DISENO.map(o => <option key={o.id} value={o.id}>{o.etiqueta}</option>)}
              </select></div>
            <div><Label htmlFor="par-T" className="text-[10px]">Factor de ocupación T</Label><Input id="par-T" type="number" step="any" value={T} onChange={e => setT(+e.target.value)} className="h-7 text-xs" /></div>
            <div><Label htmlFor="par-area" className="text-[10px]">Área de la barrera (m²)</Label><Input id="par-area" type="number" value={area} onChange={e => setArea(+e.target.value)} className="h-7 text-xs" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['costo', 'masa', 'espesor'] as const).map(k => (
              <div key={k}><Label htmlFor={`par-w-${k}`} className="text-[10px]">Peso de {k}: {pesos[k].toFixed(1)}</Label>
                <Input id={`par-w-${k}`} type="range" min={0} max={1} step={0.1} value={pesos[k]} onChange={e => setPesos(p => ({ ...p, [k]: +e.target.value }))} className="h-7" /></div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {materialesDe(carga).map(m => (
              <div key={m}><Label htmlFor={`par-c-${m}`} className="text-[10px]">Costo {NOMBRE_MATERIAL[m]} (USD/kg, estimado)</Label>
                <Input id={`par-c-${m}`} type="number" step="any" value={costos[m] ?? 0} onChange={e => setCostos(c => ({ ...c, [m]: +e.target.value }))} className="h-7 text-xs" /></div>
            ))}
          </div>
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          {best && (
            <div className="bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100 p-3">
              <div className="flex items-center gap-2 mb-1"><Trophy className="w-4 h-4 text-[#7c3aed]" /><span className="text-xs font-bold text-purple-700" data-testid="par-mejor">Mejor opción: {NOMBRE_MATERIAL[best.material]}</span></div>
              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div><span className="text-slate-500">Espesor:</span> <span className="font-mono font-semibold">{best.espesor_mm.toFixed(1)} mm</span></div>
                <div><span className="text-slate-500">Costo:</span> <span className="font-mono">{best.costo_usd.toFixed(0)} USD</span></div>
                <div><span className="text-slate-500">Masa:</span> <span className="font-mono">{(best.masa_kg / 1000).toFixed(2)} t</span></div>
                <div><span className="text-slate-500">Puntaje:</span> <span className="font-mono font-bold text-purple-600">{best.puntaje.toFixed(3)}</span></div>
              </div>
            </div>
          )}
          <Card className="border-slate-200"><CardContent className="p-3">
            <table className="w-full text-[10px]" data-testid="par-tabla">
              <thead><tr className="text-left text-slate-500"><th>#</th><th>Material</th><th>Espesor (mm)</th><th>Costo (USD)</th><th>Masa (t)</th><th>Pareto</th><th>Puntaje</th></tr></thead>
              <tbody>
                {opciones.map((s, i) => (
                  <tr key={s.material} className={`border-t ${i === 0 ? 'bg-purple-50' : ''}`}>
                    <td>{i + 1}</td><td>{NOMBRE_MATERIAL[s.material]}</td><td className="font-mono">{s.espesor_mm.toFixed(1)}</td>
                    <td className="font-mono">{s.costo_usd.toFixed(0)}</td><td className="font-mono">{(s.masa_kg / 1000).toFixed(2)}</td>
                    <td>{s.pareto ? 'sí' : 'dominada'}</td><td className="font-mono">{s.puntaje.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Sólo materiales con datos normativos (NCRP 151: concreto, acero, plomo; NCRP 147: plomo, concreto, yeso). Valores iniciales: NCRP 151 §7.1.1.</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
