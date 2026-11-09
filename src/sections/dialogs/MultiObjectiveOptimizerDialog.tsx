// MultiObjectiveOptimizerDialog — elección de material para una sala PET por costo, masa y espesor.
// Fase 7: espesores con AAPM TG-108 (`blindajePET`: Γ, absorción del paciente, decaimiento y Tabla V) y frente de
// Pareto con `compararMateriales`. Antes: W = GBq × 1000 sin constante gamma y una «dosis» que crecía con el espesor.
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { TrendingDown, CheckCircle } from 'lucide-react';
import EntradaFuentePET from '@/components/EntradaFuentePET';
import { PET_INICIAL } from '@/lib/calculadorasNormativas';
import {
  COSTO_REFERENCIA_USD_KG, MATERIALES_PET, NOMBRE_MATERIAL, blindajePET, compararMateriales, type EntradaPET,
} from '@/lib/calculadorasNormativas';

export default function MultiObjectiveOptimizerDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.multiObjectiveOptimizer));
  const close = () => useAppStore.getState().close('multiObjectiveOptimizer');
  const [e, setE] = useState<EntradaPET>(PET_INICIAL);
  const [area, setArea] = useState(12);
  const [costos, setCostos] = useState<Record<string, number>>(COSTO_REFERENCIA_USD_KG);
  const [pesos, setPesos] = useState({ costo: 0.4, masa: 0.3, espesor: 0.3 });
  const { r, opciones, error } = useMemo(() => {
    try {
      const r = blindajePET({ ...e, T: Math.min(1, e.T) });
      return { r, opciones: compararMateriales(r.espesores_mm, area, costos, pesos), error: null };
    } catch (err) { return { r: null, opciones: [], error: (err as Error).message }; }
  }, [e, area, costos, pesos]);

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <TrendingDown className="w-4 h-4 text-teal-500" /> Optimizador de materiales para sala PET
            <Badge variant="outline" className="text-[9px]">TG-108 · costo + masa + espesor</Badge>
          </DialogTitle>
          <DialogDescription className="text-[10px]">Espesor requerido por material con TG-108; ordenado por suma ponderada y marcado si pertenece al frente de Pareto.</DialogDescription>
        </DialogHeader>
        <EntradaFuentePET v={e} onChange={setE} prefijo="moo" />
        <div className="grid grid-cols-4 gap-2 mt-2">
          <div><Label htmlFor="moo-area" className="text-[10px]">Área de la barrera (m²)</Label><Input id="moo-area" type="number" value={area} onChange={x => setArea(+x.target.value)} className="h-7 text-xs" /></div>
          {(['costo', 'masa', 'espesor'] as const).map(k => (
            <div key={k}><Label htmlFor={`moo-w-${k}`} className="text-[10px]">Peso de {k}: {pesos[k].toFixed(1)}</Label>
              <Input id={`moo-w-${k}`} type="range" min={0} max={1} step={0.1} value={pesos[k]} onChange={x => setPesos(p => ({ ...p, [k]: +x.target.value }))} className="h-7" /></div>
          ))}
          {MATERIALES_PET.map(m => (
            <div key={m}><Label htmlFor={`moo-c-${m}`} className="text-[10px]">Costo {NOMBRE_MATERIAL[m]} (USD/kg, estimado)</Label>
              <Input id={`moo-c-${m}`} type="number" step="any" value={costos[m] ?? 0} onChange={x => setCostos(c => ({ ...c, [m]: +x.target.value }))} className="h-7 text-xs" /></div>
          ))}
        </div>
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        {r && (
          <div className="mt-3 text-[10px] space-y-1">
            <div>Dosis sin blindaje {(r.D_mSv_semana * 1000).toFixed(1)} μSv/semana · B requerida {r.B_requerida.toFixed(3)}</div>
            <table className="w-full" data-testid="moo-tabla">
              <thead><tr className="text-left text-slate-500"><th>#</th><th>Material</th><th>Espesor (mm)</th><th>Masa (kg)</th><th>Costo (USD)</th><th>Pareto</th><th>Puntaje</th></tr></thead>
              <tbody>
                {opciones.map((o, i) => (
                  <tr key={o.material} className={`border-t ${i === 0 ? 'bg-teal-50' : ''}`}>
                    <td>{i === 0 ? <CheckCircle className="w-3 h-3 text-teal-600" /> : i + 1}</td><td>{NOMBRE_MATERIAL[o.material]}</td>
                    <td className="font-mono">{o.espesor_mm.toFixed(1)}</td><td className="font-mono">{o.masa_kg.toFixed(0)}</td>
                    <td className="font-mono">{o.costo_usd.toFixed(0)}</td><td>{o.pareto ? 'sí' : 'dominada'}</td><td className="font-mono">{o.puntaje.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[9px] text-slate-400">{r.referencia}. Los costos por kg son estimaciones editables, no datos normativos.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
