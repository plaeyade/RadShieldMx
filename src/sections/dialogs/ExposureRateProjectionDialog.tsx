import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import '@/components/ui/separator';
import { Clock, TrendingDown, CalendarDays } from 'lucide-react';
import { HORAS_MAX_ANIO, proyeccionDecaimiento, validarPermanencia } from '@/lib/proyeccionDecaimiento';

interface ExposureEntry {
  year: number;
  activity_Ci: number;
  exposureRate_uSv_h: number;
  accumulatedDose_mSv: number;
}

interface ExposureRateProjectionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ExposureRateProjectionDialog({ open, onOpenChange }: ExposureRateProjectionDialogProps) {
  const [initialActivity, setInitialActivity] = useState(100); // Ci
  const [halfLife_years, setHalfLife_years] = useState(30.17); // Cs-137
  const [initialExposure, setInitialExposure] = useState(250); // uSv/h at 1m
  const [projectionYears, setProjectionYears] = useState(100);

  const [horasPorAnio, setHorasPorAnio] = useState(8760); // permanencia en el punto (8760 h = continua)

  const permanencia = validarPermanencia(horasPorAnio);
  // Fase 8d: dosis acumulada por integración exacta del decaimiento y horas de permanencia editables.
  const data: ExposureEntry[] = useMemo(
    () => proyeccionDecaimiento({
      actividad0: initialActivity, T12_anios: halfLife_years, tasa0_uSv_h: initialExposure,
      anios: projectionYears, horasPorAnio: permanencia.horas,
    }).map((p) => ({ year: p.anio, activity_Ci: p.actividad, exposureRate_uSv_h: p.tasa_uSv_h, accumulatedDose_mSv: p.dosisAcumulada_mSv })),
    [initialActivity, halfLife_years, initialExposure, projectionYears, permanencia.horas],
  );

  const maxExposure = Math.max(...data.map(d => d.exposureRate_uSv_h), 1e-30);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Clock className="w-5 h-5 text-blue-500" />
            Proyección de tasa de dosis en el tiempo
            <Badge variant="outline" className="text-[10px]">MicroShield Pro</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-3 grid grid-cols-5 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 font-medium">Actividad Inicial (Ci)</label>
            <Input type="number" className="h-7 text-xs mt-0.5" value={initialActivity} onChange={e => setInitialActivity(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-medium">T1/2 (anos)</label>
            <Input type="number" className="h-7 text-xs mt-0.5" value={halfLife_years} onChange={e => setHalfLife_years(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-medium">Tasa Inicial (uSv/h)</label>
            <Input type="number" className="h-7 text-xs mt-0.5" value={initialExposure} onChange={e => setInitialExposure(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-medium">Proyeccion (anos)</label>
            <Input type="number" className="h-7 text-xs mt-0.5" value={projectionYears} onChange={e => setProjectionYears(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-medium" htmlFor="erp-horas">Permanencia (h/año)</label>
            <Input id="erp-horas" type="number" min={0} max={HORAS_MAX_ANIO} className="h-7 text-xs mt-0.5" value={horasPorAnio} onChange={e => setHorasPorAnio(Number(e.target.value))} aria-invalid={permanencia.error !== null} aria-describedby={permanencia.error ? 'erp-horas-error' : undefined} />
            {permanencia.error && <p id="erp-horas-error" role="alert" className="text-[9px] text-red-600 mt-0.5">{permanencia.error}</p>}
          </div>
        </div>

        {/* Activity decay chart */}
        <div className="px-6 pb-2">
          <h4 className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            Decaimiento de Actividad y Tasa de Exposicion
          </h4>
          <div className="flex items-end gap-0.5 h-32 border-b border-l border-slate-200">
            {data.map(d => {
              const h = (d.exposureRate_uSv_h / maxExposure) * 100;
              return (
                <div key={d.year} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[8px] font-mono text-slate-500">{d.exposureRate_uSv_h.toFixed(0)}</span>
                  <div className="w-full bg-blue-400 rounded-t" style={{ height: `${Math.max(h, 3)}%` }} />
                  <span className="text-[8px] text-slate-500">{d.year}a</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Accumulated dose */}
        <div className="px-6 pb-2">
          <h4 className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            Dosis Acumulada Proyectada
          </h4>
          <div className="flex items-end gap-0.5 h-28 border-b border-l border-slate-200">
            {data.map(d => {
              const maxDose = Math.max(...data.map(x => x.accumulatedDose_mSv), 1e-30);
              const h = (d.accumulatedDose_mSv / maxDose) * 100;
              return (
                <div key={d.year} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[8px] font-mono text-slate-500">{d.accumulatedDose_mSv.toFixed(0)}</span>
                  <div className="w-full bg-amber-400 rounded-t" style={{ height: `${Math.max(h, 3)}%` }} />
                  <span className="text-[8px] text-slate-500">{d.year}a</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="px-6 pb-4">
          <table className="w-full text-xs">
            <thead><tr className="border-b"><th className="text-left text-[10px] text-slate-500 py-1">Ano</th><th className="text-right text-[10px] text-slate-500">Actividad (Ci)</th><th className="text-right text-[10px] text-slate-500">Tasa (uSv/h)</th><th className="text-right text-[10px] text-slate-500">Dosis Acum. (mSv)</th></tr></thead>
            <tbody>
              {data.map(d => (
                <tr key={d.year} className="border-b border-slate-50">
                  <td className="py-1 font-mono">{d.year}</td>
                  <td className="text-right font-mono">{d.activity_Ci.toFixed(3)}</td>
                  <td className="text-right font-mono">{d.exposureRate_uSv_h.toFixed(1)}</td>
                  <td className="text-right font-mono font-bold">{d.accumulatedDose_mSv.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
