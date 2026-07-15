import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { calculateNeutronShielding } from '@/hooks/useNeutronCalc';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export default function NeutronDialog({ open, onOpenChange }: Props) {
  const [config, setConfig] = useState({ energy_MeV: 18, workload_Gy_week: 900, distance_m: 5.5, target_mSv_week: 0.02, hasBoratedPolyethylene: true, hasWaterBarrier: false });
  const result = useMemo(() => calculateNeutronShielding(config), [config]);

  const update = (field: string, val: number | boolean) => setConfig(p => ({ ...p, [field]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Blindaje de Neutrones (&gt;10 MV)</DialogTitle></DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-xs">Energia (MV)</Label><Input type="number" value={config.energy_MeV} onChange={e => update('energy_MeV', parseFloat(e.target.value))} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Workload (Gy/sem)</Label><Input type="number" value={config.workload_Gy_week} onChange={e => update('workload_Gy_week', parseFloat(e.target.value))} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Distancia (m)</Label><Input type="number" step="0.1" value={config.distance_m} onChange={e => update('distance_m', parseFloat(e.target.value))} className="h-8 text-sm" /></div>
        </div>
        <div className="space-y-2 border-t pt-2">
          <div className="flex gap-2"><Badge variant={result.compliant ? 'default' : 'destructive'}>{result.compliant ? 'CUMPLE' : 'NO CUMPLE'}</Badge></div>
          <div className="text-xs text-gray-500">Neutrones: {result.neutronDose_mSv_week.toFixed(4)} mSv/sem | Gamma captura: {result.gammaCaptureDose_mSv_week.toFixed(4)} mSv/sem</div>
          <div className="text-xs text-gray-500">Total: <strong>{result.totalDose_mSv_week.toFixed(4)}</strong> mSv/sem</div>
          <div className="text-xs text-gray-500">BPE puerta: {result.bpeThickness_mm.toFixed(0)} mm | Agua laberinto: {result.waterThickness_mm.toFixed(0)} mm</div>
          <Alert className="py-2"><AlertDescription className="text-xs">{result.doorRecommendation}</AlertDescription></Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
