/**
 * ObliqueIncidenceDialog — Recomendación B.7
 * Corrección para incidencia oblicua del haz sobre barreras.
 * 
 * Fundamento: Cuando el haz no incide perpendicularmente, el espesor
 * efectivo aumenta: t_eff = t / cos(θ) (McGinley 2002, Eq. 3-4).
 * Para ángulos >30°, la corrección es significativa (>15%).
 * NCRP 151 §4.2 recomienda considerar incidencia oblicua en techos
 * y paredes laterales de bunkers de terapia.
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Ruler } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

export default function ObliqueIncidenceDialog({ open, onClose }: Props) {
  const [angleDeg, setAngleDeg] = useState(30);
  const [thicknessNormal, setThicknessNormal] = useState(200);

  const result = useMemo(() => {
    const rad = (angleDeg * Math.PI) / 180;
    const cosTheta = Math.cos(rad);
    const tEff = cosTheta > 0.01 ? thicknessNormal / cosTheta : 9999;
    const increasePercent = ((tEff / thicknessNormal) - 1) * 100;
    return { tEff, increasePercent, cosTheta };
  }, [angleDeg, thicknessNormal]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-amber-500" />
            Oblique Incidence Correction
            <Badge variant="outline" className="text-[10px]">B.7</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[11px] text-amber-700">
          <b>McGinley (2002) Eq. 3-4:</b> Para incidencia oblicua, el espesor efectivo
          aumenta: t_eff = t_normal / cos(θ). Esta corrección es crítica en techos de
          bunkers donde el haz puede incidir a ángulos de 30-60°.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-[11px]">Ángulo de incidencia θ (°)</Label><Input type="number" value={angleDeg} min={0} max={89} onChange={e => setAngleDeg(Math.min(89, Math.max(0, Number(e.target.value))))} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Espesor normal (mm)</Label><Input type="number" value={thicknessNormal} onChange={e => setThicknessNormal(Number(e.target.value))} className="h-8 text-xs" /></div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border text-center">
          <div className="text-[9px] text-slate-500 uppercase">Espesor efectivo corregido</div>
          <div className="text-3xl font-bold text-slate-800">{result.tEff.toFixed(1)} <span className="text-sm">mm</span></div>
          <div className="text-sm text-amber-600 font-semibold mt-1">
            +{result.increasePercent.toFixed(1)}% respecto a incidencia normal
          </div>
          <div className="text-[9px] text-slate-400 mt-1">cos(θ) = {result.cosTheta.toFixed(3)}</div>
        </div>

        <div className="text-[10px] text-slate-500">
          Referencia: McGinley P.H. (2002). <i>Shielding Techniques for Radiation Oncology Facilities</i>. 2nd ed. Ch. 3, Eq. 3-4.
          NCRP 151 (2005) §4.2: "The use of oblique incidence factors is recommended for roof barriers."
        </div>
      </DialogContent>
    </Dialog>
  );
}
