import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import '@/components/ui/separator';
import { Clock, TrendingDown, CalendarDays } from 'lucide-react';

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

  const data = useMemo(() => {
    const entries: ExposureEntry[] = [];
    const lambda = Math.log(2) / halfLife_years;
    for (let y = 0; y <= projectionYears; y += 5) {
      const activity_Ci = initialActivity * Math.exp(-lambda * y);
      const exposureRate = initialExposure * Math.exp(-lambda * y);
      // Rough accumulated dose over that 5-year period
      const periodDose = exposureRate * 8760 * 5 / 1000; // mSv over 5 years
      const accumulatedDose = entries.length > 0 ? entries[entries.length - 1].accumulatedDose_mSv + periodDose : periodDose;
      entries.push({ year: y, activity_Ci, exposureRate_uSv_h: exposureRate, accumulatedDose_mSv: accumulatedDose });
    }
    return entries;
  }, [initialActivity, halfLife_years, initialExposure, projectionYears]);

  const maxExposure = Math.max(...data.map(d => d.exposureRate_uSv_h));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Clock className="w-5 h-5 text-blue-500" />
            Exposure Rate vs Time Projection
            <Badge variant="outline" className="text-[10px]">MicroShield Pro</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-3 grid grid-cols-4 gap-2">
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
              const maxDose = Math.max(...data.map(x => x.accumulatedDose_mSv));
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
