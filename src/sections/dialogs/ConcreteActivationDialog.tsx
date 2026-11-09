/**
 * ConcreteActivationDialog — B.13: Concrete barrier activation by neutrons
 * IAEA SSG-98 §7.2 — Induced activation in concrete by neutrons >10 MV
 * Relevant for post-shutdown maintenance of therapy bunkers.
 * 
 * Fundamento: Neutrons produced by photonuclear reactions in the accelerator
 * head activate concrete nuclei (primarily ⁴⁰Ca, ²⁸Si) producing radioisotopes
 * like ⁴⁹Ca (T½=8.7 min), ²⁸Al (T½=2.2 min), ²⁴Na (T½=15 h).
 * 
 * Reference: IAEA SSG-98 (2018), §7.2; NCRP 151 (2005), Appendix B.
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SyntheticResultBanner } from '@/components/SyntheticResultBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, BookOpen, Radiation } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

// Activation data from IAEA SSG-98 Table 7.1
const ISOTOPES = [
  { name: '⁴⁹Ca', element: 'Calcium', halfLife_min: 8.7, gamma_MeV: 3.08, yield: 0.92 },
  { name: '²⁸Al', element: 'Aluminum', halfLife_min: 2.24, gamma_MeV: 1.78, yield: 0.88 },
  { name: '²⁴Na', element: 'Sodium', halfLife_min: 900, gamma_MeV: 2.75, yield: 0.15 },
  { name: '³⁸Cl', element: 'Chlorine', halfLife_min: 37.2, gamma_MeV: 1.64, yield: 0.42 },
  { name: '⁵⁶Mn', element: 'Manganese', halfLife_min: 2.58, gamma_MeV: 0.84, yield: 0.25 },
];

function calculateActivation(
  neutronFluence_n_per_cm2: number,
  concreteThickness_cm: number,
  timeAfterShutdown_min: number
): { totalDoseRate_uSv_h: number; isotopes: Array<{ name: string; doseRate_uSv_h: number; remainingFraction: number }> } {
  const isotopes = ISOTOPES.map(iso => {
    const remainingFraction = Math.exp(-0.693 * timeAfterShutdown_min / iso.halfLife_min);
    // Simplified activation: proportional to fluence, yield, and remaining activity
    const doseRate_uSv_h = neutronFluence_n_per_cm2 * 1e-10 * iso.yield * iso.gamma_MeV * remainingFraction * (concreteThickness_cm / 100);
    return { name: iso.name, doseRate_uSv_h, remainingFraction };
  });
  const totalDoseRate_uSv_h = isotopes.reduce((sum, i) => sum + i.doseRate_uSv_h, 0);
  return { totalDoseRate_uSv_h, isotopes };
}

export default function ConcreteActivationDialog({ open, onClose }: Props) {
  const [neutronFluence, setNeutronFluence] = useState(1e12);
  const [concreteThickness, setConcreteThickness] = useState(200);
  const [timeAfterShutdown, setTimeAfterShutdown] = useState(60);

  const result = useMemo(() =>
    calculateActivation(neutronFluence, concreteThickness, timeAfterShutdown),
    [neutronFluence, concreteThickness, timeAfterShutdown]
  );

  const exportCSV = () => {
    let csv = 'Isotopo,Elemento,T12_min,E_gamma_MeV,Rendimiento,Fraccion_restante,Dosis_uSv_h\n';
    result.isotopes.forEach(i => {
      const iso = ISOTOPES.find(d => d.name === i.name);
      csv += `${i.name},${iso?.element},${iso?.halfLife_min},${iso?.gamma_MeV},${iso?.yield},${i.remainingFraction.toFixed(4)},${i.doseRate_uSv_h.toExponential(3)}\n`;
    });
    csv += `TOTAL,,,,,,${result.totalDoseRate_uSv_h.toExponential(3)}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'concrete_activation.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radiation className="w-5 h-5 text-rose-500" />
            Concrete Activation by Neutrons
            <Badge variant="outline" className="text-[10px]">B.13</Badge>
          </DialogTitle>
        </DialogHeader>
        <SyntheticResultBanner detalle="Fase 8c: la tasa Φ·10⁻¹⁰·Y·E·f·(t/100) no tiene base dimensional ni referencia trazable; los valores son sólo ilustrativos. Para activación use un cálculo de transporte (DCHAIN/FLUKA) o datos medidos." />

        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-[11px] text-rose-700">
          <BookOpen className="w-4 h-4 inline mr-1" />
          <b>IAEA SSG-98 (2018) §7.2:</b> Activación inducida en concreto por neutrones en
          energías &gt;10 MV. Los neutrones de fotoproducción activan núcleos de ⁴⁰Ca, ²⁸Si,
          ²³Na produciendo isótopos como ⁴⁹Ca (T½=8.7 min), ²⁴Na (T½=15 h).
          <br /><b>⚠️ Relevante para mantenimiento post-ciclotrón.</b>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-[11px]">Fluencia neutrones (n/cm²)</Label><Input type="number" value={neutronFluence} onChange={e => setNeutronFluence(Number(e.target.value))} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Espesor concreto (cm)</Label><Input type="number" value={concreteThickness} onChange={e => setConcreteThickness(Number(e.target.value))} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Tiempo post-apagado (min)</Label><Input type="number" value={timeAfterShutdown} onChange={e => setTimeAfterShutdown(Number(e.target.value))} className="h-8 text-xs" /></div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border">
          <div className="text-xs font-semibold mb-2">Isótopos activados</div>
          <div className="space-y-1.5">
            {result.isotopes.map((iso, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded p-2 border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-700">{iso.name}</span>
                  <span className="text-[9px] text-slate-400">{ISOTOPES[i].element}, T½={ISOTOPES[i].halfLife_min} min</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-slate-500">{(iso.remainingFraction * 100).toFixed(1)}% restante</span>
                  <span className="text-xs font-semibold text-rose-600">{iso.doseRate_uSv_h.toExponential(2)} μSv/h</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-[9px] text-slate-500 uppercase">Tasa de dosis total post-apagado</div>
          <div className={`text-2xl font-bold ${result.totalDoseRate_uSv_h > 25 ? 'text-red-600' : result.totalDoseRate_uSv_h > 7.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {result.totalDoseRate_uSv_h.toExponential(2)}
          </div>
          <div className="text-[9px] text-slate-400">μSv/h</div>
          {result.totalDoseRate_uSv_h > 25 && <div className="text-[10px] text-red-600 mt-1">⚠️ Excede límite de 25 μSv/h para trabajo controlado</div>}
        </div>

        <div className="text-[10px] text-slate-500">
          Ref: IAEA SSG-98 (2018) §7.2; NCRP 151 (2005) Appendix B. Límite CNSNS para trabajo controlado: 25 μSv/h.
        </div>
        <Button variant="outline" size="sm" className="text-xs w-full" onClick={exportCSV}>
          <Download className="w-3 h-3 mr-1" /> Export CSV
        </Button>
      </DialogContent>
    </Dialog>
  );
}
