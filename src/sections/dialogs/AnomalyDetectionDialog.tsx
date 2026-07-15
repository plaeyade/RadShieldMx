import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { AlertTriangle, ShieldCheck, Eye, Play } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

interface AnomalyCheck { name: string; check: (v: number) => boolean; message: string; severity: 'error' | 'warning'; }

const CHECKS: AnomalyCheck[] = [
  { name: 'Negative Thickness', check: v => v < 0, message: 'Thickness cannot be negative', severity: 'error' },
  { name: 'Zero Distance', check: v => v <= 0, message: 'Distance must be > 0', severity: 'error' },
  { name: 'Extreme Distance', check: v => v > 50, message: 'Distance > 50 m seems unusual', severity: 'warning' },
  { name: 'High Occupancy', check: v => v > 1, message: 'Occupancy factor cannot exceed 1.0', severity: 'error' },
  { name: 'Tiny Thickness', check: v => v > 0 && v < 1, message: 'Thickness < 1 cm may be insufficient', severity: 'warning' },
  { name: 'Extreme Thickness', check: v => v > 300, message: 'Thickness > 300 cm is very large', severity: 'warning' },
  { name: 'Low Energy', check: v => v > 0 && v < 0.5, message: 'Energy < 500 keV may not need Linac-level shielding', severity: 'warning' },
  { name: 'Extreme Energy', check: v => v > 25, message: 'Energy > 25 MV requires special neutron shielding', severity: 'warning' },
];

export default function AnomalyDetectionDialog({ open, onOpenChange }: Props) {
  const [thickness, setThickness] = useState('120');
  const [distance, setDistance] = useState('4.0');
  const [energy, setEnergy] = useState('6');
  const [occupancy, setOccupancy] = useState('0.25');
  const [results, setResults] = useState<{name: string; message: string; severity: string; passed: boolean}[]>([]);

  const runChecks = () => {
    const values = { thickness: parseFloat(thickness) || 0, distance: parseFloat(distance) || 0, energy: parseFloat(energy) || 0, occupancy: parseFloat(occupancy) || 0 };
    const r = CHECKS.map(c => {
      let v = 0;
      if (c.name.includes('Thickness')) v = values.thickness;
      else if (c.name.includes('Distance')) v = values.distance;
      else if (c.name.includes('Energy')) v = values.energy;
      else if (c.name.includes('Occupancy')) v = values.occupancy;
      return { name: c.name, message: c.message, severity: c.severity, passed: !c.check(v) };
    });
    setResults(r);
    const errors = r.filter(x => !x.passed && x.severity === 'error').length;
    const warns = r.filter(x => !x.passed && x.severity === 'warning').length;
    toast.success(`${errors} errors, ${warns} warnings detected`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Anomaly Detection</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <div><Label className="text-xs">Thickness (cm)</Label><Input value={thickness} onChange={e=>setThickness(e.target.value)} /></div>
              <div><Label className="text-xs">Distance (m)</Label><Input value={distance} onChange={e=>setDistance(e.target.value)} /></div>
              <div><Label className="text-xs">Energy (MeV)</Label><Input value={energy} onChange={e=>setEnergy(e.target.value)} /></div>
              <div><Label className="text-xs">Occupancy</Label><Input value={occupancy} onChange={e=>setOccupancy(e.target.value)} /></div>
            </div>
            <Button onClick={runChecks} className="w-full"><Eye className="h-4 w-4 mr-2" />Run Anomaly Check</Button>
            {results.length > 0 && (
              <div className="space-y-1">
                {results.map((r, i) => (
                  <Card key={i} className={r.passed ? 'border-l-4 border-l-green-500' : r.severity === 'error' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-amber-500'}>
                    <CardContent className="py-2 flex items-center gap-2">
                      {r.passed ? <ShieldCheck className="h-4 w-4 text-green-500" /> : <AlertTriangle className={`h-4 w-4 ${r.severity === 'error' ? 'text-red-500' : 'text-amber-500'}`} />}
                      <div className="text-sm"><span className="font-medium">{r.name}:</span> {r.passed ? 'OK' : r.message}</div>
                      {!r.passed && <Badge variant={r.severity === 'error' ? 'destructive' : 'secondary'} className="text-[9px] ml-auto">{r.severity}</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
