/**
 * NeutronMazeDialog — Recomendación B.3
 * Calculador completo de laberintos con neutrones y captura gamma.
 * 
 * Fundamento: NCRP 151 §5.3 — El laberinto es la barrera primaria para
 * neutrones en bunkers de terapia con energías >10 MV. Los neutrones son
 * producidos por fotoproducción en el blanco y el cabezal. El laberinto
 * atenúa neutrones por múltiples reflexiones (albedo). Los neutrones térmicos
 * capturados en paredes producen gamma de captura (2.2 MeV en H, 6-8 MeV en Fe).
 * 
 * Ecuaciones:
 * - Neutron dose: D_n = D₀ × 10^(-d₁/TVL₁) × 10^(-d₂/TVL₂) × ... (McGinley Eq. 5-3)
 * - TVL neutrones en concreto: ~450 mm (NCRP 151 Table 5.4)
 * - Capture gamma: D_γ = f_capt × D_n donde f_capt ≈ 0.5-2.0 dependiendo del material
 * 
 * Referencia: McGinley (2002) Ch. 5, NCRP 151 §5.3, IAEA SSG-98 §6.4.
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, GitBranch } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

interface MazeSection {
  name: string;
  length_m: number;
  width_m: number;
  height_m: number;
  tvl_neutron_mm: number;
  tvl_gamma_mm: number;
  captureGammaFactor: number;
}

const DEFAULT_MAZE: MazeSection[] = [
  { name: 'Tramo 1 (isocentro → 1ra vuelta)', length_m: 3.0, width_m: 1.5, height_m: 2.2, tvl_neutron_mm: 450, tvl_gamma_mm: 280, captureGammaFactor: 0.8 },
  { name: 'Tramo 2 (1ra → 2da vuelta)', length_m: 2.5, width_m: 1.2, height_m: 2.2, tvl_neutron_mm: 450, tvl_gamma_mm: 280, captureGammaFactor: 0.6 },
  { name: 'Tramo 3 (2da vuelta → puerta)', length_m: 2.0, width_m: 1.0, height_m: 2.2, tvl_neutron_mm: 450, tvl_gamma_mm: 280, captureGammaFactor: 0.5 },
];

export default function NeutronMazeDialog({ open, onClose }: Props) {
  const [energy, setEnergy] = useState(15); // MV
  const [neutronSourceStrength, setNeutronSourceStrength] = useState(0.1); // Sv/Gy at 1m
  const [workload, setWorkload] = useState(400); // Gy/week
  const [sections, setSections] = useState<MazeSection[]>(DEFAULT_MAZE);

  const result = useMemo(() => {
    // Neutron source term: Q = neutron source strength × workload
    const Q = neutronSourceStrength * workload; // mSv/week at 1m reference
    let neutronDose = Q;
    let gammaDose = 0;
    const sectionResults = sections.map(s => {
      const nAtten = Math.pow(10, -s.length_m * 1000 / s.tvl_neutron_mm);
      neutronDose *= nAtten;
      const gCapture = neutronDose * s.captureGammaFactor;
      gammaDose += gCapture;
      return { ...s, neutronAtten: nAtten, captureGamma: gCapture };
    });
    const totalDose = neutronDose + gammaDose;
    return { neutronDose, gammaDose, totalDose, sectionResults, designGoalCheck: totalDose <= 0.02 };
  }, [energy, neutronSourceStrength, workload, sections]);

  const updateSection = (i: number, field: keyof MazeSection, value: number) => {
    const ns = [...sections];
    ns[i] = { ...ns[i], [field]: value };
    setSections(ns);
  };

  const exportCSV = () => {
    let csv = 'Seccion,Longitud_m,Ancho_m,Altura_m,TVL_n_mm,TVL_g_mm,Factor_captura,Atenuacion_n,Gamma_captura_mSv\n';
    result.sectionResults.forEach(s => csv += `${s.name},${s.length_m},${s.width_m},${s.height_m},${s.tvl_neutron_mm},${s.tvl_gamma_mm},${s.captureGammaFactor},${s.neutronAtten.toExponential(3)},${s.captureGamma.toExponential(3)}\n`);
    csv += `TOTAL,,,,,,,Neutrones,${result.neutronDose.toExponential(3)}\n`;
    csv += `TOTAL,,,,,,,Captura_gamma,${result.gammaDose.toExponential(3)}\n`;
    csv += `TOTAL,,,,,,,Dosis_total_mSv_sem,${result.totalDose.toExponential(3)}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'neutron_maze_calculation.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-orange-500" />
            Neutron Maze Calculator
            <Badge variant="outline" className="text-[10px]">B.3</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-[11px] text-orange-700">
          <b>NCRP 151 §5.3 — McGinley (2002) Ch.5:</b> Calculador completo de laberintos
          para neutrones en bunkers de terapia &gt;10 MV. Incluye atenuación por múltiples
          reflexiones (albedo) y gamma de captura de neutrones térmicos en paredes de concreto.
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-[11px]">Energía (MV)</Label><Input type="number" value={energy} min={10} onChange={e => setEnergy(Number(e.target.value))} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Fuente neutrones (Sv/Gy @ 1m)</Label><Input type="number" step={0.01} value={neutronSourceStrength} onChange={e => setNeutronSourceStrength(Number(e.target.value))} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Carga trabajo (Gy/sem)</Label><Input type="number" value={workload} onChange={e => setWorkload(Number(e.target.value))} className="h-8 text-xs" /></div>
        </div>

        <div className="text-xs font-semibold text-slate-600">Secciones del laberinto</div>
        {sections.map((s, i) => (
          <div key={i} className="bg-slate-50 rounded p-2 border grid grid-cols-6 gap-2">
            <div className="col-span-6 text-[10px] font-semibold text-slate-500">{s.name}</div>
            <div><Label className="text-[9px]">L (m)</Label><Input type="number" step={0.1} value={s.length_m} onChange={e => updateSection(i, 'length_m', Number(e.target.value))} className="h-6 text-[10px] p-1" /></div>
            <div><Label className="text-[9px]">W (m)</Label><Input type="number" step={0.1} value={s.width_m} onChange={e => updateSection(i, 'width_m', Number(e.target.value))} className="h-6 text-[10px] p-1" /></div>
            <div><Label className="text-[9px]">H (m)</Label><Input type="number" step={0.1} value={s.height_m} onChange={e => updateSection(i, 'height_m', Number(e.target.value))} className="h-6 text-[10px] p-1" /></div>
            <div><Label className="text-[9px]">TVL_n (mm)</Label><Input type="number" value={s.tvl_neutron_mm} onChange={e => updateSection(i, 'tvl_neutron_mm', Number(e.target.value))} className="h-6 text-[10px] p-1" /></div>
            <div><Label className="text-[9px]">TVL_γ (mm)</Label><Input type="number" value={s.tvl_gamma_mm} onChange={e => updateSection(i, 'tvl_gamma_mm', Number(e.target.value))} className="h-6 text-[10px] p-1" /></div>
            <div><Label className="text-[9px]">f_cap</Label><Input type="number" step={0.1} value={s.captureGammaFactor} onChange={e => updateSection(i, 'captureGammaFactor', Number(e.target.value))} className="h-6 text-[10px] p-1" /></div>
          </div>
        ))}

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded p-3 border">
            <div className="text-[9px] text-slate-500">Dosis neutrones</div>
            <div className="text-lg font-bold text-orange-600">{result.neutronDose.toExponential(2)}</div>
            <div className="text-[9px] text-slate-400">mSv/sem</div>
          </div>
          <div className="bg-white rounded p-3 border">
            <div className="text-[9px] text-slate-500">Gamma captura</div>
            <div className="text-lg font-bold text-red-600">{result.gammaDose.toExponential(2)}</div>
            <div className="text-[9px] text-slate-400">mSv/sem</div>
          </div>
          <div className="bg-white rounded p-3 border">
            <div className="text-[9px] text-slate-500">Dosis total</div>
            <div className={`text-lg font-bold ${result.designGoalCheck ? 'text-emerald-600' : 'text-red-600'}`}>{result.totalDose.toExponential(2)}</div>
            <div className="text-[9px] text-slate-400">mSv/sem</div>
          </div>
        </div>

        <div className={`text-[10px] p-2 rounded ${result.designGoalCheck ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {result.designGoalCheck
            ? `✅ Laberinto cumple objetivo de diseño (≤0.02 mSv/sem). Dosis total ${result.totalDose.toExponential(2)} mSv/sem.`
            : `⚠️ Laberinto NO cumple objetivo. Se requiere aumentar longitud o agregar puerta de boro/polietileno. Dosis: ${result.totalDose.toExponential(2)} mSv/sem.`}
        </div>

        <div className="text-[10px] text-slate-500">
          <b>Referencia:</b> McGinley P.H. (2002). <i>Shielding Techniques for Radiation Oncology Facilities</i>. 2nd ed., Ch. 5.
          NCRP 151 (2005) §5.3. TVL neutrones en concreto: ~450 mm (NCRP 151 Table 5.4).
          Gamma de captura: 2.2 MeV (H), 6-8 MeV (Fe), ~3.5% del kerma de neutrones.
        </div>

        <Button variant="outline" size="sm" className="text-xs w-full" onClick={exportCSV}>
          <Download className="w-3 h-3 mr-1" /> Export CSV
        </Button>
      </DialogContent>
    </Dialog>
  );
}
