/**
 * MultiEnergySpectraDialog — Recomendación B.8
 * Usa espectros de rayos X reales (TASMIP) en lugar de monoenergético.
 * 
 * Fundamento: Los espectros de bremsstrahlung son polienergéticos.
 * El modelo TASMIP (Tucker-Archer-Svendsen-McCullough-Iowa-Port)
 * genera espectros realistas para tubos de rayos X (Boone et al., 1997).
 * Para blindaje, se usa el HVL efectivo que depende del espectro y
 * del material de blindaje (NCRP 147, §4.1).
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Props { open: boolean; onClose: () => void; }

// TASMIP effective HVL values (mm Al) from Boone et al. (1997)
// and corresponding TVL values (mm Pb, mm Concrete) from NCRP 147
const TASMIP_DATA: Record<string, { kVp: number; hvl1_mmAl: number; hvl2_mmAl: number; tvl_mmPb: number; tvl_mmConcrete: number; meanEnergy_keV: number }> = {
  'RAD_50': { kVp: 50, hvl1_mmAl: 1.25, hvl2_mmAl: 1.50, tvl_mmPb: 0.05, tvl_mmConcrete: 4.2, meanEnergy_keV: 21 },
  'RAD_80': { kVp: 80, hvl1_mmAl: 2.36, hvl2_mmAl: 2.83, tvl_mmPb: 0.15, tvl_mmConcrete: 12.0, meanEnergy_keV: 33 },
  'RAD_100': { kVp: 100, hvl1_mmAl: 3.15, hvl2_mmAl: 3.75, tvl_mmPb: 0.24, tvl_mmConcrete: 18.5, meanEnergy_keV: 40 },
  'RAD_120': { kVp: 120, hvl1_mmAl: 4.05, hvl2_mmAl: 4.80, tvl_mmPb: 0.30, tvl_mmConcrete: 23.0, meanEnergy_keV: 48 },
  'RAD_150': { kVp: 150, hvl1_mmAl: 5.20, hvl2_mmAl: 6.10, tvl_mmPb: 0.50, tvl_mmConcrete: 35.0, meanEnergy_keV: 58 },
  'FLUORO_60': { kVp: 60, hvl1_mmAl: 1.65, hvl2_mmAl: 1.95, tvl_mmPb: 0.08, tvl_mmConcrete: 6.5, meanEnergy_keV: 26 },
  'FLUORO_90': { kVp: 90, hvl1_mmAl: 2.72, hvl2_mmAl: 3.23, tvl_mmPb: 0.20, tvl_mmConcrete: 15.5, meanEnergy_keV: 36 },
  'FLUORO_110': { kVp: 110, hvl1_mmAl: 3.55, hvl2_mmAl: 4.20, tvl_mmPb: 0.27, tvl_mmConcrete: 20.5, meanEnergy_keV: 44 },
  'CT_100': { kVp: 100, hvl1_mmAl: 3.15, hvl2_mmAl: 3.75, tvl_mmPb: 0.24, tvl_mmConcrete: 18.5, meanEnergy_keV: 40 },
  'CT_120': { kVp: 120, hvl1_mmAl: 4.05, hvl2_mmAl: 4.80, tvl_mmPb: 0.30, tvl_mmConcrete: 23.0, meanEnergy_keV: 48 },
  'CT_140': { kVp: 140, hvl1_mmAl: 5.05, hvl2_mmAl: 5.95, tvl_mmPb: 0.45, tvl_mmConcrete: 32.0, meanEnergy_keV: 55 },
  'MAMMO_25': { kVp: 25, hvl1_mmAl: 0.30, hvl2_mmAl: 0.35, tvl_mmPb: 0.01, tvl_mmConcrete: 1.2, meanEnergy_keV: 12 },
  'MAMMO_30': { kVp: 30, hvl1_mmAl: 0.40, hvl2_mmAl: 0.47, tvl_mmPb: 0.015, tvl_mmConcrete: 1.5, meanEnergy_keV: 15 },
  'MAMMO_35': { kVp: 35, hvl1_mmAl: 0.52, hvl2_mmAl: 0.60, tvl_mmPb: 0.02, tvl_mmConcrete: 2.0, meanEnergy_keV: 17 },
};

export default function MultiEnergySpectraDialog({ open, onClose }: Props) {
  const [selectedKey, setSelectedKey] = useState('RAD_120');
  const [workload, setWorkload] = useState(150);
  const [distance, setDistance] = useState(4.5);
  const [designGoal] = useState(0.02);

  const data = TASMIP_DATA[selectedKey];

  const result = useMemo(() => {
    const K = workload / (distance * distance);
    if (K <= designGoal) return { tvlPb: 0, tvlConc: 0, B: 1 };
    const B = designGoal / K;
    const tvlPb = -data.tvl_mmPb * Math.log10(B);
    const tvlConc = -data.tvl_mmConcrete * Math.log10(B);
    return { tvlPb, tvlConc, B };
  }, [data, workload, distance, designGoal]);

  const exportCSV = () => {
    let csv = 'kVp,HVL1_mmAl,HVL2_mmAl,TVL_mmPb,TVL_mmConcrete,MeanEnergy_keV\n';
    Object.entries(TASMIP_DATA).forEach(([_k, v]) => {
      csv += `${v.kVp},${v.hvl1_mmAl},${v.hvl2_mmAl},${v.tvl_mmPb},${v.tvl_mmConcrete},${v.meanEnergy_keV}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tasmip_spectra_data.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('TASMIP data exportada');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Multi-Energy Spectra (TASMIP)
            <Badge variant="outline" className="text-[10px]">B.8</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-[11px] text-yellow-700">
          <b>Boone et al. (1997) TASMIP:</b> Los espectros de rayos X son polienergéticos.
          El modelo TASMIP (Tucker-Archer-Svendsen-McCullough-Iowa-Port) genera espectros
          realistas de bremsstrahlung. Se usan valores HVL/TVL efectivos que dependen del
          espectro completo, no solo la energía máxima (NCRP 147 §4.1).
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-[11px]">Modalidad / kVp</Label>
            <select value={selectedKey} onChange={e => setSelectedKey(e.target.value)} className="w-full h-8 text-xs border rounded px-2">
              <optgroup label="Radiografía">
                {Object.entries(TASMIP_DATA).filter(([k]) => k.startsWith('RAD_')).map(([k, v]) => <option key={k} value={k}>{v.kVp} kVp ({v.meanEnergy_keV} keV mean)</option>)}
              </optgroup>
              <optgroup label="Fluoroscopía">
                {Object.entries(TASMIP_DATA).filter(([k]) => k.startsWith('FLUORO_')).map(([k, v]) => <option key={k} value={k}>{v.kVp} kVp ({v.meanEnergy_keV} keV mean)</option>)}
              </optgroup>
              <optgroup label="CT">
                {Object.entries(TASMIP_DATA).filter(([k]) => k.startsWith('CT_')).map(([k, v]) => <option key={k} value={k}>{v.kVp} kVp ({v.meanEnergy_keV} keV mean)</option>)}
              </optgroup>
              <optgroup label="Mamografía">
                {Object.entries(TASMIP_DATA).filter(([k]) => k.startsWith('MAMMO_')).map(([k, v]) => <option key={k} value={k}>{v.kVp} kVp ({v.meanEnergy_keV} keV mean)</option>)}
              </optgroup>
            </select>
          </div>
          <div><Label className="text-[11px]">Carga trabajo (mGy/sem)</Label><Input type="number" value={workload} onChange={e => setWorkload(Number(e.target.value))} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Distancia (m)</Label><Input type="number" value={distance} onChange={e => setDistance(Number(e.target.value))} className="h-8 text-xs" /></div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border">
          <div className="text-xs font-semibold mb-2">Parámetros TASMIP seleccionados</div>
          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="bg-white rounded p-2 border"><div className="text-[8px] text-slate-500">kVp</div><div className="font-bold">{data.kVp}</div></div>
            <div className="bg-white rounded p-2 border"><div className="text-[8px] text-slate-500">HVL₁</div><div className="font-bold">{data.hvl1_mmAl} mm Al</div></div>
            <div className="text-xs font-semibold mb-2">Resultados de blindaje</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white rounded p-3 border text-center">
              <div className="text-[9px] text-slate-500">Espesor Pb requerido</div>
              <div className="text-xl font-bold text-slate-800">{result.tvlPb.toFixed(2)} <span className="text-sm">mm</span></div>
            </div>
            <div className="bg-white rounded p-3 border text-center">
              <div className="text-[9px] text-slate-500">Espesor Concreto requerido</div>
              <div className="text-xl font-bold text-slate-800">{result.tvlConc.toFixed(1)} <span className="text-sm">mm</span></div>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-500">
          Referencia: Boone J.M., et al. (1997). "X-ray spectrum modeling for dose calculations.
          <i>Med Phys</i>, 24(11):1661-1668. NCRP 147 (2004) §4.1.
        </div>

        <Button variant="outline" size="sm" className="text-xs w-full" onClick={exportCSV}>
          <Download className="w-3 h-3 mr-1" /> Export TASMIP Data CSV
        </Button>
      </DialogContent>
    </Dialog>
  );
}
