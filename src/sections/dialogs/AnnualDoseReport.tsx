/**
 * AnnualDoseReport — Recomendación B.4
 * Reporte acumulado de dosis anual considerando factores estacionales,
 * mantenimiento, y variaciones de carga de trabajo.
 * 
 * Fundamento: NCRP 147 recomienda evaluar la dosis sobre base semanal,
 * pero para licencias CNSNS se requiere justificación anual.
 * ICRP 103 establece límites anuales: 20 mSv/año (ocupacional promedio),
 * 50 mSv/año (máximo individual).
 * 
 * Factores estacionales: Aumento de carga en invierno (gripe, cirugías),
 * reducción en verano (vacaciones). Mantenimiento programado reduce
 * disponibilidad ~5-10%.
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Download, TrendingUp } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
// Fase 8c: los factores estacionales por omisión eran arbitrarios (pico invernal 1.15); ahora 1.0 y editables.
const DEFAULT_SEASONAL = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

function calcAnnual(
  weeklyBase_mSv: number, seasonal: number[], weeksOff: number,
  maintenanceWeeks: number, occupancyFactor: number, limite_mSv: number
): { monthly: number[]; annualTotal: number; annualOccupational: number; limitPercent: number } {
  // T se aplica una sola vez: dosis = kerma semanal en el punto (sin T) × T × semanas efectivas × factor estacional.
  const effectiveWeeks = Math.max(0, 52 - weeksOff - maintenanceWeeks);
  const kermaMensual = seasonal.map(s => weeklyBase_mSv * s * (effectiveWeeks / 12));
  const monthly = kermaMensual.map(k => k * occupancyFactor);
  const annualTotal = monthly.reduce((a, b) => a + b, 0);
  return { monthly, annualTotal, annualOccupational: kermaMensual.reduce((a, b) => a + b, 0), limitPercent: (annualTotal / limite_mSv) * 100 };
}

export default function AnnualDoseReport({ open, onClose }: Props) {
  const [weeklyBase, setWeeklyBase] = useState(0.02);
  const [seasonalFactors, setSeasonalFactors] = useState(DEFAULT_SEASONAL);
  const [weeksOff, setWeeksOff] = useState(4);
  const [maintenanceWeeks, setMaintenanceWeeks] = useState(2);
  const [occupancy, setOccupancy] = useState(1.0);
  const [limite, setLimite] = useState(1);

  const result = useMemo(() => calcAnnual(weeklyBase, seasonalFactors, weeksOff, maintenanceWeeks, occupancy, limite),
    [weeklyBase, seasonalFactors, weeksOff, maintenanceWeeks, occupancy, limite]);

  const exportCSV = () => {
    let csv = 'Mes,Dosis_mSv,Factor_estacional\n';
    result.monthly.forEach((d, i) => csv += `${MONTHS[i]},${d.toFixed(4)},${seasonalFactors[i]}\n`);
    csv += `TOTAL ANUAL,${result.annualTotal.toFixed(4)},\n`;
    csv += `% del limite (${limite} mSv/a),${result.limitPercent.toFixed(2)},\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'annual_dose_report.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Reporte anual exportado');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            Annual Dose Accumulation Report
            <Badge variant="outline" className="text-[10px]">B.4</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-[11px] text-emerald-700">
          <b>ICRP 103 / NOM-008-NUCL-2018:</b> Reporte acumulado de dosis anual con factores
          estacionales. El límite anual para trabajadores es 20 mSv promedio (ICRP 103) o
          50 mSv máximo individual. Se consideran semanas de vacaciones y mantenimiento.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="adr-k" className="text-[11px]">Kerma semanal en el punto, sin T (mSv/semana)</Label><Input id="adr-k" data-testid="adr-k" type="number" step={0.001} value={weeklyBase} onChange={e => setWeeklyBase(parseFloat(e.target.value) || 0)} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Semanas vacaciones/año</Label><Input type="number" value={weeksOff} onChange={e => setWeeksOff(parseInt(e.target.value) || 0)} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Semanas mantenimiento</Label><Input type="number" value={maintenanceWeeks} onChange={e => setMaintenanceWeeks(parseInt(e.target.value) || 0)} className="h-8 text-xs" /></div>
          <div><Label htmlFor="adr-t" className="text-[11px]">Factor ocupación (T)</Label><Input id="adr-t" data-testid="adr-t" type="number" step={0.05} value={occupancy} onChange={e => setOccupancy(parseFloat(e.target.value) || 0)} className="h-8 text-xs" /></div>
        </div>

        <div className="text-xs font-semibold text-slate-600">Factores estacionales (multiplicador)</div>
        <div className="grid grid-cols-6 gap-1">
          {MONTHS.map((m, i) => (
            <div key={i}>
              <div className="text-[9px] text-center text-slate-500">{m}</div>
              <Input type="number" step={0.05} value={seasonalFactors[i]} onChange={e => {
                const nf = [...seasonalFactors]; nf[i] = parseFloat(e.target.value) || 0; setSeasonalFactors(nf);
              }} className="h-7 text-[10px] text-center p-0" />
            </div>
          ))}
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border">
          <div className="text-xs font-semibold mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Distribución mensual (mSv)</div>
          <div className="flex items-end gap-0.5 h-24">
            {result.monthly.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="text-[8px] text-slate-500">{d.toFixed(3)}</div>
                <div className="w-full bg-emerald-400 rounded-t" style={{ height: `${Math.max(4, (d / Math.max(...result.monthly)) * 80)}px` }} />
                <div className="text-[8px] text-slate-400">{MONTHS[i]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded p-2 border">
            <div className="text-[9px] text-slate-500">Dosis Anual</div>
            <div className={`text-lg font-bold ${result.limitPercent > 100 ? 'text-red-600' : result.limitPercent > 25 ? 'text-amber-600' : 'text-emerald-600'}`} data-testid="adr-anual">{result.annualTotal.toFixed(3)}</div>
            <div className="text-[9px] text-slate-400">mSv/año</div>
          </div>
          <div className="bg-white rounded p-2 border">
            <div className="text-[9px] text-slate-500">Kerma anual en el punto</div>
            <div className="text-lg font-bold text-slate-700">{result.annualOccupational.toFixed(3)}</div>
            <div className="text-[9px] text-slate-400">sin T (persona siempre presente)</div>
          </div>
          <div className="bg-white rounded p-2 border">
            <label htmlFor="adr-lim" className="text-[9px] text-slate-500">% del límite</label>
            <div className={`text-lg font-bold ${result.limitPercent > 100 ? 'text-red-600' : result.limitPercent > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>{result.limitPercent.toFixed(1)}%</div>
            <select id="adr-lim" data-testid="adr-lim" value={limite} onChange={e => setLimite(Number(e.target.value))} className="text-[9px] border rounded">
              <option value={1}>Público: 1 mSv/año</option><option value={20}>POE: 20 mSv/año</option>
            </select>
          </div>
        </div>

        <Button variant="outline" size="sm" className="text-xs w-full" onClick={exportCSV}>
          <Download className="w-3 h-3 mr-1" /> Export CSV
        </Button>
      </DialogContent>
    </Dialog>
  );
}
