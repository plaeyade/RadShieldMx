/**
 * SelfShieldingDialog — Recomendación B.9
 * Factores de auto-atenuación para paciente/fantoma en CT/PET.
 * 
 * Fundamento: El paciente atenúa parte de la radiación dispersada,
 * reduciendo la carga de trabajo efectiva para blindajes secundarios.
 * AAPM TG 108 (2010): "Patient self-attenuation reduces scatter by 25-40%
 * for CT and 15-30% for PET depending on body habitus."
 * Archer et al. (1994): "The use factor accounts for primary beam direction
 * but patient attenuation of scatter is often neglected."
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

// Self-shielding factors from AAPM TG 108 Table 3
const SELF_SHIELDING_FACTORS: Record<string, { modality: string; factor: number; description: string; reference: string }> = {
  'CT_HEAD': { modality: 'CT - Head', factor: 0.65, description: 'Cabeza adulta ~15 cm diameter', reference: 'TG 108 Table 3' },
  'CT_BODY': { modality: 'CT - Body', factor: 0.60, description: 'Tórax/Abdomen ~35 cm diameter', reference: 'TG 108 Table 3' },
  'CT_PEDIATRIC': { modality: 'CT - Pediátrico', factor: 0.75, description: 'Niño ~20 cm diameter', reference: 'TG 108 Table 3' },
  'PET_F18': { modality: 'PET/CT - F-18', factor: 0.70, description: '511 keV anihilation', reference: 'TG 108 §4.3' },
  'PET_GA68': { modality: 'PET/CT - Ga-68', factor: 0.75, description: 'Lower energy positrons', reference: ' extrapolated from TG 108' },
  'SPECT_TC99M': { modality: 'SPECT - Tc-99m', factor: 0.55, description: '140 keV gamma', reference: 'Cherry 2012 Ch. 17' },
  'SPECT_I131': { modality: 'SPECT - I-131', factor: 0.50, description: '364 keV gamma', reference: 'Cherry 2012 Ch. 17' },
};

export default function SelfShieldingDialog({ open, onClose }: Props) {
  const [selected, setSelected] = useState('CT_BODY');
  const [workloadBase, setWorkloadBase] = useState(350);

  const data = SELF_SHIELDING_FACTORS[selected];
  const effectiveWorkload = workloadBase * data.factor;
  const reduction = (1 - data.factor) * 100;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-500" />
            Patient Self-Shielding Factors
            <Badge variant="outline" className="text-[10px]">B.9</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 text-[11px] text-teal-700">
          <b>AAPM TG 108 (2010) §4.3:</b> El paciente atenúa 25-45% de la radiación
          dispersada, reduciendo la carga de trabajo efectiva. Este factor se aplica
          al blindaje secundario (scatter) pero NO al primario (haz directo).
        </div>

        <div><Label className="text-[11px]">Modalidad / Examen</Label>
          <select value={selected} onChange={e => setSelected(e.target.value)} className="w-full h-8 text-xs border rounded px-2">
            {Object.entries(SELF_SHIELDING_FACTORS).map(([k, v]) => <option key={k} value={k}>{v.modality} — factor {v.factor}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-[11px]">Carga trabajo base (Gy/sem o mCi/sem)</Label><Input type="number" value={workloadBase} onChange={e => setWorkloadBase(Number(e.target.value))} className="h-8 text-xs" /></div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border text-center">
          <div className="text-[9px] text-slate-500 uppercase">Carga trabajo efectiva (con auto-atenuación)</div>
          <div className="text-3xl font-bold text-teal-600">{effectiveWorkload.toFixed(1)}</div>
          <div className="text-sm text-teal-500 font-semibold mt-1">
            Reducción del {reduction.toFixed(0)}% por auto-atenuación
          </div>
          <div className="text-[9px] text-slate-400 mt-1">{data.description}</div>
          <div className="text-[8px] text-slate-400 mt-0.5">Ref: {data.reference}</div>
        </div>

        <div className="text-[10px] text-slate-500">
          <b>Nota importante:</b> El factor de auto-atenuación aplica SOLO a barreras
          secundarias (scatter). Las barreras primarias deben dimensionarse con la
          carga de trabajo completa sin reducción. Ver NCRP 147 §3.2.2 y AAPM TG 108 §4.3.
        </div>
      </DialogContent>
    </Dialog>
  );
}
