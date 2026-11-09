// Geant4McDialog (clave `geant4Mc`) — referencia analítica TG-108 para comparar con una corrida Geant4 propia.
// Fase 7: este diálogo no ejecuta Geant4 ni ningún Monte Carlo. Antes mostraba historias, tiempo de CPU y una
// «dosis MC» que salía de una fórmula sin sentido dimensional (W = GBq × 1000). Ahora calcula, con AAPM TG-108
// (`blindajePET`, `transmisionPET`), la dosis detrás de un espesor dado: el valor contra el que se valida un tally.
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { Atom, CheckCircle, AlertTriangle } from 'lucide-react';
import EntradaFuentePET from '@/components/EntradaFuentePET';
import { PET_INICIAL } from '@/lib/calculadorasNormativas';
import {
  MATERIALES_PET, NOMBRE_MATERIAL, blindajePET, transmisionPET, type EntradaPET, type MaterialPET,
} from '@/lib/calculadorasNormativas';

const sel = 'h-7 w-full rounded-md border border-input px-1 text-xs';

export default function Geant4McDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.geant4Mc));
  const close = () => useAppStore.getState().close('geant4Mc');
  const [e, setE] = useState<EntradaPET>(PET_INICIAL);
  const [material, setMaterial] = useState<MaterialPET>('lead');
  const [espesor, setEspesor] = useState(12);
  const [mc, setMc] = useState<number | ''>('');
  const { r, error } = useMemo(() => {
    try {
      const T = Math.min(1, e.T);
      const base = blindajePET({ ...e, T });
      const B = transmisionPET(material, Math.max(0, espesor));
      const D = base.D_mSv_semana * B;
      return { r: { ...base, B, D, TD: T * D, cumple: T * D <= e.P_mSv_semana * (1 + 1e-9) }, error: null };
    } catch (err) { return { r: null, error: (err as Error).message }; }
  }, [e, material, espesor]);
  const diferencia = r && mc !== '' && r.D > 0 ? (100 * (mc / 1000 - r.D)) / r.D : null;

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Atom className="w-4 h-4 text-green-600" /> Referencia analítica para validar Geant4 (PET, TG-108)
            <Badge variant="outline" className="text-[9px]">sin transporte de partículas</Badge>
          </DialogTitle>
          <DialogDescription className="text-[10px]">Calcula la dosis semanal detrás del espesor indicado con TG-108 (Γ, absorción del paciente, decaimiento y Tabla V). Introduzca el resultado de su corrida Geant4 para compararlo.</DialogDescription>
        </DialogHeader>
        <EntradaFuentePET v={e} onChange={setE} prefijo="g4" />
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div><Label htmlFor="g4-mat" className="text-[10px]">Material del blindaje</Label>
            <select id="g4-mat" className={sel} value={material} onChange={x => setMaterial(x.target.value as MaterialPET)}>
              {MATERIALES_PET.map(m => <option key={m} value={m}>{NOMBRE_MATERIAL[m]}</option>)}
            </select></div>
          <div><Label htmlFor="g4-t" className="text-[10px]">Espesor (mm)</Label><Input id="g4-t" type="number" step="any" value={espesor} onChange={x => setEspesor(+x.target.value)} className="h-7 text-xs" /></div>
          <div><Label htmlFor="g4-mc" className="text-[10px]">Resultado Geant4 (μSv/semana, opcional)</Label>
            <Input id="g4-mc" type="number" step="any" value={mc} onChange={x => setMc(x.target.value === '' ? '' : +x.target.value)} className="h-7 text-xs" /></div>
        </div>
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        {r && (
          <div className="border rounded-md p-3 bg-slate-50 mt-3 text-[11px] space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <div>Dosis sin blindaje: <strong>{(r.D_mSv_semana * 1000).toFixed(1)} μSv/semana</strong></div>
              <div>Transmisión B({espesor} mm): <strong data-testid="g4-B">{r.B.toFixed(4)}</strong></div>
              <div>Dosis detrás del blindaje: <strong data-testid="g4-D">{(r.D * 1000).toFixed(2)} μSv/semana</strong></div>
              <div className="flex items-center gap-1">{r.cumple ? <CheckCircle className="w-3 h-3 text-green-600" /> : <AlertTriangle className="w-3 h-3 text-red-600" />}
                T·D = {(r.TD * 1000).toFixed(2)} μSv/semana {r.cumple ? '≤' : '>'} P = {(e.P_mSv_semana * 1000).toFixed(0)} μSv/semana</div>
              <div>Espesor requerido de {NOMBRE_MATERIAL[material]}: <strong>{r.espesores_mm[material].toFixed(1)} mm</strong></div>
              {diferencia !== null && <div>Diferencia Geant4 − analítico: <strong>{diferencia.toFixed(1)} %</strong></div>}
            </div>
            <p className="text-[9px] text-slate-400">{r.referencia}. La Tabla V proviene de un ajuste a transmisiones Monte Carlo de banda ancha (Simpkin); diferencias de ±10 % con un Geant4 de geometría distinta son esperables.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
