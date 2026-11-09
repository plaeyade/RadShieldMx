/**
 * ObliqueIncidenceDialog — Recomendación B.7: incidencia oblicua sobre una barrera de megavoltaje.
 *
 * Antes: t_eff = t/cos θ sin límite, que para θ > 45° sobrestima la atenuación (no conservador). Ahora usa
 * `incidenciaOblicua` (recorrido t/cos θ con tope de 70°, TVL₁/TVLₑ de NCRP 151 Tabla B.2 y la corrección de §2.2:
 * para θ > 45° se usa la transmisión a incidencia normal, nunca menos conservadora que el espesor perpendicular).
 */
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Ruler } from 'lucide-react';
import { ENERGIAS_MV_TABULADAS, MATERIALES_MV, NOMBRE_MATERIAL, incidenciaOblicua } from '@/lib/calculadorasNormativas';
import type { EnergiaMV, MaterialNCRP151 } from '@/lib/ncrp151';

interface Props { open: boolean; onClose: () => void; }

export default function ObliqueIncidenceDialog({ open, onClose }: Props) {
  const [energia, setEnergia] = useState<EnergiaMV>(6);
  const [material, setMaterial] = useState<MaterialNCRP151>('concrete');
  const [angleDeg, setAngleDeg] = useState(30);
  const [t_cm, setT] = useState(150);

  const r = useMemo(() => incidenciaOblicua(energia, material, t_cm, angleDeg), [energia, material, t_cm, angleDeg]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-amber-500" />
            Incidencia oblicua
            <Badge variant="outline" className="text-[10px]">NCRP 151 §2.2</Badge>
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Recorrido t/cos θ (tope 70°) hasta 45°. Para θ &gt; 45° el espesor oblicuo sobrestima la atenuación (NCRP 151 §2.2)
            y se usa la transmisión a incidencia normal (NCRP 147), nunca menos conservadora.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="obl-e" className="text-[11px]">Energía</Label>
            <select id="obl-e" data-testid="obl-e" value={String(energia)} onChange={e => setEnergia((e.target.value === 'Co60' ? 'Co60' : Number(e.target.value)) as EnergiaMV)} className="w-full h-8 text-xs border rounded px-2">
              {ENERGIAS_MV_TABULADAS.map(x => <option key={x} value={x}>{x} MV</option>)}
              <option value="Co60">Co-60</option>
            </select>
          </div>
          <div>
            <Label htmlFor="obl-m" className="text-[11px]">Material</Label>
            <select id="obl-m" data-testid="obl-m" value={material} onChange={e => setMaterial(e.target.value as MaterialNCRP151)} className="w-full h-8 text-xs border rounded px-2">
              {MATERIALES_MV.map(m => <option key={m} value={m}>{NOMBRE_MATERIAL[m]}</option>)}
            </select>
          </div>
          <div><Label htmlFor="obl-th" className="text-[11px]">Ángulo de incidencia θ (°)</Label><Input id="obl-th" data-testid="obl-th" type="number" value={angleDeg} min={0} max={89} onChange={e => setAngleDeg(Math.min(89, Math.max(0, Number(e.target.value))))} className="h-8 text-xs" /></div>
          <div><Label htmlFor="obl-t" className="text-[11px]">Espesor de la barrera (cm)</Label><Input id="obl-t" data-testid="obl-t" type="number" value={t_cm} onChange={e => setT(Number(e.target.value))} className="h-8 text-xs" /></div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border grid grid-cols-2 gap-3 text-center">
          <div><div className="text-[9px] text-slate-500 uppercase">Recorrido oblicuo</div><div className="text-xl font-bold" data-testid="obl-recorrido">{r.recorrido_cm.toFixed(1)} cm</div></div>
          <div><div className="text-[9px] text-slate-500 uppercase">Espesor normal equivalente</div><div className="text-xl font-bold text-slate-800" data-testid="obl-equivalente">{r.espesorEquivalenteNormal_cm.toFixed(1)} cm</div></div>
          <div><div className="text-[9px] text-slate-500">B a incidencia normal</div><div className="font-mono text-xs">{r.B_normal.toExponential(2)}</div></div>
          <div><div className="text-[9px] text-slate-500">B oblicua corregida</div><div className="font-mono text-xs" data-testid="obl-b">{r.B_corregida.toExponential(2)}</div></div>
        </div>
        {r.hvlDescontados > 0 && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded p-2" data-testid="obl-aviso">
            θ &gt; 45°: el espesor oblicuo sobrestima la atenuación (NCRP 151 §2.2); se usa la transmisión a incidencia normal
            (NCRP 147), {r.hvlDescontados.toFixed(1)} HVL por encima de la oblicua.
          </div>
        )}
        {angleDeg > 70 && <div className="text-[11px] text-slate-500">Por encima de 70° no se acredita recorrido adicional (criterio conservador del motor).</div>}
      </DialogContent>
    </Dialog>
  );
}
