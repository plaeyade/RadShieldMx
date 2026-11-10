import { useMemo } from 'react';
import AvisoProyectoVacio from '@/components/AvisoProyectoVacio';
import '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { FloorPlan } from '@/types/radshield';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; floorPlan: FloorPlan; }

export default function CNSNSDashboardDialog({ open, onOpenChange, floorPlan }: Props) {
  const metrics = useMemo(() => {
    const barriers = floorPlan.barriers;
    const sources = floorPlan.sources;
    const hasResults = barriers.some(b => b.requiredThickness_mm);
    const maxKerma = Math.max(...barriers.map(b => b.maxKerma || 0), 0);
    const allCompliant = hasResults && barriers.every(b => (b.maxKerma || 0) <= b.designGoal_mSv_per_wk);
    const linacCount = sources.filter(s => s.modality.category === 'therapy').length;
    const nuclearCount = sources.filter(s => s.modality.category === 'nuclear').length;
    const cyclotronCount = sources.filter(s => s.modality.category === 'cyclotron').length;
    return { hasResults, maxKerma, allCompliant, linacCount, nuclearCount, cyclotronCount, totalBarriers: barriers.length, totalSources: sources.length };
  }, [floorPlan]);

  const semaforo = (ok: boolean) => ok ? 'bg-green-500' : 'bg-red-500';
  const semaforoText = (ok: boolean) => ok ? 'VERDE' : 'ROJO';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Dashboard CNSNS — Cumplimiento Normativo</DialogTitle></DialogHeader>
        <AvisoProyectoVacio floorPlan={floorPlan} />
        <div className="grid grid-cols-2 gap-2">
          <Card className={`${semaforo(metrics.allCompliant)} text-white`}><CardContent className="p-2 text-center">
            <div className="text-lg font-bold">{semaforoText(metrics.allCompliant)}</div>
            <div className="text-[10px]">Cumplimiento barreras</div>
          </CardContent></Card>
          <Card className={`${semaforo(metrics.maxKerma <= 0.1)} text-white`}><CardContent className="p-2 text-center">
            <div className="text-lg font-bold">{semaforoText(metrics.maxKerma <= 0.1)}</div>
            <div className="text-[10px]">Kerma max ≤ 0.1 mSv/sem</div>
          </CardContent></Card>
          <Card className={`${semaforo(metrics.hasResults)} text-white`}><CardContent className="p-2 text-center">
            <div className="text-lg font-bold">{semaforoText(metrics.hasResults)}</div>
            <div className="text-[10px]">Calculo ejecutado</div>
          </CardContent></Card>
          <Card className={`${semaforo(metrics.totalSources > 0)} text-white`}><CardContent className="p-2 text-center">
            <div className="text-lg font-bold">{semaforoText(metrics.totalSources > 0)}</div>
            <div className="text-[10px]">Fuentes configuradas</div>
          </CardContent></Card>
        </div>
        <div className="text-xs space-y-1 mt-2">
          <div className="flex justify-between"><span>Equipos terapia (LINAC/GK):</span><Badge>{metrics.linacCount}</Badge></div>
          <div className="flex justify-between"><span>Medicina nuclear:</span><Badge>{metrics.nuclearCount}</Badge></div>
          <div className="flex justify-between"><span>Ciclotron:</span><Badge>{metrics.cyclotronCount}</Badge></div>
          <div className="flex justify-between"><span>Kerma maxima:</span><Badge variant={metrics.maxKerma <= 0.1 ? 'default' : 'destructive'}>{metrics.maxKerma.toFixed(4)} mSv/sem</Badge></div>
        </div>
        <p className="text-[10px] text-gray-400">Semforo: Verde = Cumple | Rojo = Revisar. Actualizado en tiempo real.</p>
      </DialogContent>
    </Dialog>
  );
}
