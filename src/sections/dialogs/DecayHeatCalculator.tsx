import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Flame, Calculator, TrendingUp } from 'lucide-react';

interface DecayEntry {
  isotope: string;
  activity_Bq: number;
  halfLife_y: number;
  heatPerBq_W: number;
  heat_W: number;
}

const INITIAL_ENTRIES: DecayEntry[] = [
  { isotope: 'Cs-137', activity_Bq: 3.7e13, halfLife_y: 30.17, heatPerBq_W: 6.4e-14, heat_W: 2.37e0 },
  { isotope: 'Sr-90', activity_Bq: 3.7e13, halfLife_y: 28.79, heatPerBq_W: 4.9e-14, heat_W: 1.81e0 },
  { isotope: 'Co-60', activity_Bq: 1.85e12, halfLife_y: 5.27, heatPerBq_W: 2.5e-13, heat_W: 4.63e-1 },
  { isotope: 'Am-241', activity_Bq: 3.7e10, halfLife_y: 432.2, heatPerBq_W: 1.1e-11, heat_W: 4.07e-1 },
  { isotope: 'Pu-238', activity_Bq: 3.7e10, halfLife_y: 87.7, heatPerBq_W: 2.6e-11, heat_W: 9.62e-1 },
  { isotope: 'Cm-244', activity_Bq: 1.85e9, halfLife_y: 18.1, heatPerBq_W: 4.0e-11, heat_W: 7.40e-2 },
];

interface DecayHeatCalculatorProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function DecayHeatCalculator({ open, onOpenChange }: DecayHeatCalculatorProps) {
  const [entries, setEntries] = useState<DecayEntry[]>(INITIAL_ENTRIES);

  const updateEntry = (idx: number, field: keyof DecayEntry, value: number) => {
    setEntries(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      next[idx].heat_W = next[idx].activity_Bq * next[idx].heatPerBq_W;
      return next;
    });
  };

  const totalHeat_W = entries.reduce((s, e) => s + e.heat_W, 0);
  const totalHeat_kW = totalHeat_W / 1000;

  // Project heat over time
  const projection = useMemo(() => {
    const years = [0, 1, 5, 10, 20, 50, 100];
    return years.map(y => ({
      year: y,
      heat_W: entries.reduce((s, e) => s + e.heat_W * Math.pow(0.5, y / e.halfLife_y), 0),
    }));
  }, [entries]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Flame className="w-5 h-5 text-orange-500" />
            Decay Heat Calculator — MicroShield Pro
            <Badge variant="outline" className="text-[10px]">Calor de decaimiento</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-3 grid grid-cols-3 gap-3">
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-700">{totalHeat_W.toFixed(2)} W</div>
            <div className="text-[10px] text-orange-600">Calor Total</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-amber-700">{totalHeat_kW.toFixed(4)} kW</div>
            <div className="text-[10px] text-amber-600">En kilowatts</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-700">{(totalHeat_W * 3.412).toFixed(1)} BTU/h</div>
            <div className="text-[10px] text-red-600">Equivalente BTU/h</div>
          </div>
        </div>

        <div className="px-6 pb-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Isotopo</TableHead>
                <TableHead className="text-[10px] text-right">Actividad (Bq)</TableHead>
                <TableHead className="text-[10px] text-right">T1/2 (a)</TableHead>
                <TableHead className="text-[10px] text-right">W/Bq</TableHead>
                <TableHead className="text-[10px] text-right">Calor (W)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e, i) => (
                <TableRow key={e.isotope}>
                  <TableCell className="text-xs font-bold">{e.isotope}</TableCell>
                  <TableCell className="text-right">
                    <Input type="number" className="h-6 text-xs text-right font-mono w-28 ml-auto" value={e.activity_Bq} onChange={v => updateEntry(i, 'activity_Bq', Number(v.target.value))} />
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">{e.halfLife_y}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{e.heatPerBq_W.toExponential(1)}</TableCell>
                  <TableCell className="text-xs text-right font-mono font-bold">{e.heat_W.toExponential(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Separator />

        {/* Projection over time */}
        <div className="px-6 pb-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Proyeccion de Calor vs Tiempo
          </h4>
          <div className="flex items-end gap-1 h-24">
            {projection.map(p => {
              const maxH = projection[0].heat_W;
              const h = (p.heat_W / maxH) * 80;
              return (
                <div key={p.year} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono text-slate-600">{p.heat_W.toFixed(2)}W</span>
                  <div className="w-full bg-gradient-to-t from-orange-400 to-amber-300 rounded-t" style={{ height: `${h}px` }} />
                  <span className="text-[9px] text-slate-500">{p.year}a</span>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
