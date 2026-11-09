/**
 * SelfShieldingDialog — autoatenuación del paciente (Recomendación B.9).
 * Fase 8d: los factores salen de `lib/autoatenuacionPaciente`: sólo PET tiene factor citado
 * (TG-108: el paciente absorbe 0.36 a 511 keV); TC y SPECT no se reducen (factor 1).
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { FACTORES_AUTOATENUACION, cargaConAutoatenuacion } from '@/lib/autoatenuacionPaciente';

interface Props { open: boolean; onClose: () => void; }

export default function SelfShieldingDialog({ open, onClose }: Props) {
  const [selected, setSelected] = useState('PET_F18');
  const [workloadBase, setWorkloadBase] = useState(350);

  const data = FACTORES_AUTOATENUACION[selected];
  const { efectiva, reduccion_pct } = cargaConAutoatenuacion(selected, workloadBase);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-500" />
            Autoatenuación del paciente
            <Badge variant="outline" className="text-[10px]">B.9</Badge>
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Fracción de la radiación que sale del cuerpo del paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 text-[11px] text-teal-700">
          <b>AAPM TG-108 (2006):</b> en PET el cuerpo del paciente absorbe 0.36 de los fotones de 511 keV; la tasa a
          distancia se calcula con 0.64·Γ. Para TC, NCRP 147 ya mide la dispersión con fantoma, y para SPECT no hay
          factor normativo: en ambos casos no se aplica reducción.
        </div>

        <div><Label className="text-[11px]">Modalidad / Examen</Label>
          <select value={selected} onChange={e => setSelected(e.target.value)} className="w-full h-8 text-xs border rounded px-2" aria-label="Modalidad">
            {Object.entries(FACTORES_AUTOATENUACION).map(([k, v]) => <option key={k} value={k}>{v.modalidad} — factor {v.factor.toFixed(2)}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-[11px]">Tasa o carga sin paciente (cualquier unidad)</Label><Input type="number" value={workloadBase} onChange={e => setWorkloadBase(Number(e.target.value))} className="h-8 text-xs" aria-label="Carga sin paciente" /></div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border text-center" data-testid="autoatenuacion-resultado">
          <div className="text-[9px] text-slate-500 uppercase">Con autoatenuación del paciente</div>
          <div className="text-3xl font-bold text-teal-600">{efectiva.toFixed(1)}</div>
          <div className="text-sm text-teal-500 font-semibold mt-1">
            {data.citado ? `Reducción del ${reduccion_pct.toFixed(0)} % por absorción en el paciente` : 'Sin reducción (no hay factor normativo)'}
          </div>
          <div className="text-[9px] text-slate-400 mt-1">{data.descripcion}</div>
          <div className="text-[8px] text-slate-400 mt-0.5">Ref: {data.referencia}</div>
        </div>

        <div className="text-[10px] text-slate-500">
          <b>Nota:</b> las calculadoras PET (TG-108) ya incluyen este factor en Γ_paciente; no lo aplique dos veces.
        </div>
      </DialogContent>
    </Dialog>
  );
}
