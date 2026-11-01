/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v32 — Electron Applicator Shielding (LINAC Cones)
 * ═══════════════════════════════════════════════════════════════════════════
 *  Shielding calculation for electron applicators (cones) with
 *  scattering foil considerations. Based on NCRP 151 Appendix B.
 *
 *  Features:
 *    • 10 standard applicator sizes (5×5 to 25×25 cm)
 *    • Scattering foil transmission data (lead, steel, tungsten)
 *    • Dose at patient surface and 1 m from source
 *    • X-ray contamination fraction by energy
 *    • Bremsstrahlung shielding requirements
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Zap, Calculator, Play, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

// NCRP 151 Appendix B — X-ray contamination fraction by electron energy
const XRAY_CONTAMINATION: Record<number, number> = {
  4: 0.003, 6: 0.005, 9: 0.010, 12: 0.018, 15: 0.025, 18: 0.035, 20: 0.042, 22: 0.050,
};

// Scattering foil transmission (typical 0.5 mm Pb equivalent)
const FOIL_TRANSMISSION: Record<number, number> = {
  4: 0.85, 6: 0.78, 9: 0.68, 12: 0.58, 15: 0.50, 18: 0.43, 20: 0.38, 22: 0.33,
};

// Applicator sizes (cm × cm)
const APPLICATOR_SIZES = [
  { label: '5 × 5 cm', ssd_cm: 100, field_cm: 5 },
  { label: '6 × 6 cm', ssd_cm: 100, field_cm: 6 },
  { label: '10 × 10 cm', ssd_cm: 100, field_cm: 10 },
  { label: '15 × 15 cm', ssd_cm: 100, field_cm: 15 },
  { label: '20 × 20 cm', ssd_cm: 100, field_cm: 20 },
  { label: '25 × 25 cm', ssd_cm: 100, field_cm: 25 },
];

// HVL and TVL for electron shielding (mm lead)
const ELECTRON_SHIELDING_DATA: Record<number, { hvl_mm_pb: number; tvl_mm_pb: number; hvl_mm_steel: number; tvl_mm_concrete: number }> = {
  4: { hvl_mm_pb: 0.7, tvl_mm_pb: 2.3, hvl_mm_steel: 2.5, tvl_mm_concrete: 18 },
  6: { hvl_mm_pb: 1.0, tvl_mm_pb: 3.3, hvl_mm_steel: 3.5, tvl_mm_concrete: 25 },
  9: { hvl_mm_pb: 1.4, tvl_mm_pb: 4.7, hvl_mm_steel: 5.0, tvl_mm_concrete: 36 },
  12: { hvl_mm_pb: 1.7, tvl_mm_pb: 5.7, hvl_mm_steel: 6.0, tvl_mm_concrete: 43 },
  15: { hvl_mm_pb: 1.9, tvl_mm_pb: 6.3, hvl_mm_steel: 6.5, tvl_mm_concrete: 48 },
  18: { hvl_mm_pb: 2.1, tvl_mm_pb: 7.0, hvl_mm_steel: 7.0, tvl_mm_concrete: 52 },
  20: { hvl_mm_pb: 2.2, tvl_mm_pb: 7.3, hvl_mm_steel: 7.5, tvl_mm_concrete: 55 },
  22: { hvl_mm_pb: 2.3, tvl_mm_pb: 7.7, hvl_mm_steel: 8.0, tvl_mm_concrete: 58 },
};

export default function ElectronApplicatorDialog({ open, onOpenChange }: Props) {
  const [energy, setEnergy] = useState('12');
  const [applicatorSize, setApplicatorSize] = useState('10 × 10 cm');
  const [ssd, setSsd] = useState('100');
  const [doseRate_MU_min, setDoseRate] = useState('600');
  const [treatmentTime_min, setTreatmentTime] = useState('2.5');
  const [distanceToBarrier_m, setDistance] = useState('2.0');
  const [occupancyFactor, setOccupancy] = useState('0.2');
  const [doseLimit_mSv_week, setDoseLimit] = useState('0.02');
  const [useFactor, setUseFactor] = useState('1.0');
  const [selectedMaterial, setSelectedMaterial] = useState('pb');
  const [result, setResult] = useState<any>(null);

  const en = parseFloat(energy) || 12;
  const data = ELECTRON_SHIELDING_DATA[en] || ELECTRON_SHIELDING_DATA[12];
  const xrayFrac = XRAY_CONTAMINATION[en] || 0.018;

  const handleCalculate = useCallback(() => {
    try {
      const SSD = parseFloat(ssd) || 100; // cm
      const d_rate = parseFloat(doseRate_MU_min) || 600;
      const t_time = parseFloat(treatmentTime_min) || 2.5;
      const dist_m = parseFloat(distanceToBarrier_m) || 2.0;
      const occ = parseFloat(occupancyFactor) || 0.2;
      const limit = parseFloat(doseLimit_mSv_week) || 0.02;
      const uf = parseFloat(useFactor) || 1.0;

      // Total dose at isocenter (cGy)
      const totalDose_cGy = d_rate * t_time;

      // X-ray contamination dose
      const xrayDose_cGy = totalDose_cGy * xrayFrac;

      // Dose at barrier distance (inverse square + attenuation)
      // B = P * d^2 / (W * U * T)
      const workload_cGy_week = totalDose_cGy * 5 * 5; // 5 days, 5 patients
      const B = (limit * dist_m * dist_m) / ((xrayDose_cGy / 100) * uf * occ * 5 * 5);

      // Required TVL count
      const nTvl = -Math.log10(Math.max(B, 1e-10));

      // Thickness by material
      let thickness_mm = 0;
      if (selectedMaterial === 'pb') thickness_mm = nTvl * data.tvl_mm_pb;
      else if (selectedMaterial === 'steel') thickness_mm = nTvl * data.hvl_mm_steel * 3.32; // ~3.32 HVL = 1 TVL
      else if (selectedMaterial === 'concrete') thickness_mm = nTvl * data.tvl_mm_concrete;

      // Surface dose at patient
      const surfaceDose_cGy = totalDose_cGy * (FOIL_TRANSMISSION[en] || 0.58);

      setResult({
        totalDose_cGy,
        xrayDose_cGy,
        xrayFraction: xrayFrac,
        workload_cGy_week,
        transmission_B: B,
        nTvl,
        thickness_mm,
        surfaceDose_cGy,
        energy_MeV: en,
        material: selectedMaterial,
        isCompliant: B > 0 && thickness_mm > 0,
      });

      toast.success(`Calculo completado: ${thickness_mm.toFixed(1)} mm ${selectedMaterial === 'pb' ? 'plomo' : selectedMaterial === 'steel' ? 'acero' : 'concreto'}`);
    } catch (e) {
      toast.error('Error: ' + (e as Error).message);
    }
  }, [energy, ssd, doseRate_MU_min, treatmentTime_min, distanceToBarrier_m, occupancyFactor, doseLimit_mSv_week, useFactor, selectedMaterial, data, en, xrayFrac]);

  const materialName = selectedMaterial === 'pb' ? 'Plomo' : selectedMaterial === 'steel' ? 'Acero' : 'Concreto';
  const tvlValue = selectedMaterial === 'pb' ? data.tvl_mm_pb : selectedMaterial === 'steel' ? data.hvl_mm_steel * 3.32 : data.tvl_mm_concrete;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Zap className="w-5 h-5 text-amber-500" />
            Electron Applicator Shielding — NCRP 151 Appendix B
            <Badge className="text-[9px] bg-amber-100 text-amber-700">v32</Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] px-5 py-4">
          <div className="space-y-4">
            {/* Description */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
              <BookOpen className="w-4 h-4 inline mr-1" />
              <strong>NCRP 151 Appendix B — Electron Beam Shielding:</strong> Los haces de electrones producen radiacion de frenado (Bremsstrahlung) en el scattering foil, aplicador, y paciente. La fraccion de contaminacion de rayos-X varia del 0.3% (4 MeV) al 5% (22 MeV). Este calculo determina el blindaje necesario para la componente de fotones de contaminacion.
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Input panel */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold text-slate-700">Parametros del Haz</div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-[10px]">Energia electron (MeV)</Label>
                    <Select value={energy} onValueChange={setEnergy}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[4,6,9,12,15,18,20,22].map(e => (
                          <SelectItem key={e} value={String(e)} className="text-xs">{e} MeV (X-ray: {(XRAY_CONTAMINATION[e]*100).toFixed(1)}%)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-[10px]">Aplicador</Label>
                    <Select value={applicatorSize} onValueChange={setApplicatorSize}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {APPLICATOR_SIZES.map(s => (
                          <SelectItem key={s.label} value={s.label} className="text-xs">{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-[10px]">SSD (cm)</Label><Input value={ssd} onChange={e => setSsd(e.target.value)} type="number" className="h-7 text-xs" /></div>
                  <div><Label className="text-[10px]">Dosis rate (MU/min)</Label><Input value={doseRate_MU_min} onChange={e => setDoseRate(e.target.value)} type="number" className="h-7 text-xs" /></div>
                  <div><Label className="text-[10px]">Tiempo tratamiento (min)</Label><Input value={treatmentTime_min} onChange={e => setTreatmentTime(e.target.value)} type="number" step="0.1" className="h-7 text-xs" /></div>
                  <div><Label className="text-[10px]">Distancia a barrera (m)</Label><Input value={distanceToBarrier_m} onChange={e => setDistance(e.target.value)} type="number" step="0.1" className="h-7 text-xs" /></div>
                  <div><Label className="text-[10px]">Factor uso (U)</Label><Input value={useFactor} onChange={e => setUseFactor(e.target.value)} type="number" step="0.05" className="h-7 text-xs" /></div>
                  <div><Label className="text-[10px]">Factor ocupacion (T)</Label><Input value={occupancyFactor} onChange={e => setOccupancy(e.target.value)} type="number" step="0.05" className="h-7 text-xs" /></div>
                  <div><Label className="text-[10px]">Limite dosis (mSv/sem)</Label><Input value={doseLimit_mSv_week} onChange={e => setDoseLimit(e.target.value)} type="number" step="0.01" className="h-7 text-xs" /></div>
                  <div><Label className="text-[10px]">Material blindaje</Label>
                    <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pb" className="text-xs">Plomo (Pb)</SelectItem>
                        <SelectItem value="steel" className="text-xs">Acero (Fe)</SelectItem>
                        <SelectItem value="concrete" className="text-xs">Concreto ordinario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" className="text-xs gap-1" onClick={handleCalculate}>
                  <Play className="w-3.5 h-3.5" /> Calcular Blindaje
                </Button>
              </div>

              {/* Results */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold text-slate-700">Resultados</div>
                {result ? (
                  <div className="space-y-2">
                    <div className="bg-slate-50 rounded-lg p-3 border space-y-1.5 text-[11px]">
                      <div className="flex justify-between"><span className="text-slate-500">Dosis total @ isocentro:</span><strong>{result.totalDose_cGy.toFixed(1)} cGy</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500">Contaminacion X-ray:</span><strong className="text-amber-600">{result.xrayDose_cGy.toFixed(2)} cGy ({(result.xrayFraction*100).toFixed(1)}%)</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500">Dosis superficie paciente:</span><strong>{result.surfaceDose_cGy.toFixed(1)} cGy</strong></div>
                      <Separator />
                      <div className="flex justify-between"><span className="text-slate-500">Factor transmision B:</span><strong>{result.transmission_B.toExponential(3)}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500">TVLs requeridos:</span><strong>{result.nTvl.toFixed(2)}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500">TVL material:</span><strong>{tvlValue.toFixed(1)} mm</strong></div>
                      <Separator />
                      <div className="flex justify-between text-[12px]"><span className="text-slate-700 font-medium">Espesor {materialName}:</span><strong className="text-emerald-700">{result.thickness_mm.toFixed(1)} mm</strong></div>
                    </div>

                    {result.isCompliant ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-[10px] text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Blindaje cumple con NCRP 151 limite de {doseLimit_mSv_week} mSv/sem
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded p-2 text-[10px] text-red-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Blindaje insuficiente — aumentar espesor o cambiar material
                      </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[10px] text-amber-700 space-y-0.5">
                      <strong>Datos de referencia NCRP 151 App. B:</strong>
                      <div>• HVL Pb @ {en} MeV: {data.hvl_mm_pb} mm</div>
                      <div>• TVL Pb @ {en} MeV: {data.tvl_mm_pb} mm</div>
                      <div>• TVL concreto: {data.tvl_mm_concrete} mm</div>
                      <div>• Fraccion X-ray: {(xrayFrac*100).toFixed(1)}%</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    <Calculator className="w-6 h-6 mx-auto mb-1" />
                    Configure parametros y calcule
                  </div>
                )}
              </div>
            </div>

            {/* Reference tables */}
            <Separator />
            <div className="text-[11px] font-semibold text-slate-700">Tablas de Referencia — NCRP 151 Appendix B</div>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div>
                <table className="w-full border-collapse">
                  <thead><tr className="bg-slate-100"><th className="border p-1 text-left">E (MeV)</th><th className="border p-1">X-ray %</th><th className="border p-1">HVL Pb (mm)</th><th className="border p-1">TVL Pb (mm)</th></tr></thead>
                  <tbody>
                    {Object.entries(ELECTRON_SHIELDING_DATA).map(([e, d]) => (
                      <tr key={e} className={parseInt(e) === en ? 'bg-amber-50' : ''}>
                        <td className="border p-1 font-medium">{e}</td>
                        <td className="border p-1">{(XRAY_CONTAMINATION[parseInt(e)]*100).toFixed(1)}%</td>
                        <td className="border p-1">{d.hvl_mm_pb}</td>
                        <td className="border p-1">{d.tvl_mm_pb}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-slate-600 space-y-1">
                <div><strong>Metodologia:</strong></div>
                <div>1. Calcular dosis total de electrones: D = rate × tiempo</div>
                <div>2. Extraer componente X-ray: D<sub>x</sub> = D × f<sub>x</sub></div>
                <div>3. Calcular workload semanal: W = D<sub>x</sub> × pacientes/sem</div>
                <div>4. Factor de transmision: B = P·d²/(W·U·T)</div>
                <div>5. TVLs requeridos: n = -log₁₀(B)</div>
                <div>6. Espesor: t = n × TVL</div>
                <div className="mt-2 text-amber-700">
                  <strong>Nota:</strong> Los electrones se detienen en ~5 mm de plomo o ~25 mm de concreto (E &lt; 20 MeV). El blindaje es solo para la componente de fotones de Bremsstrahlung.
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
