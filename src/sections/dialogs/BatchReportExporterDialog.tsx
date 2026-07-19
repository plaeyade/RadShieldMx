/**
 * v107: Batch Report Exporter
 * Export all barriers, sources, and calculations to JSON/CSV
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/appStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { FileDown, FileText, Download, CheckCircle } from 'lucide-react';

export default function BatchReportExporterDialog() {
  const open = useAppStore(s => Boolean(s.dialogs.batchReportExporter));
  const close = () => useAppStore.getState().close('batchReportExporter');
  const floorPlan = useCanvasStore(s => s.floorPlan);
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [exported, setExported] = useState(false);

  const exportData = () => {
    const timestamp = new Date().toISOString();
    const data = {
      report: {
        title: `RadShield-MX Batch Report — ${floorPlan.name}`,
        version: 'v107',
        timestamp,
        summary: {
          nBarriers: floorPlan.barriers.length,
          nSources: floorPlan.sources.length,
          nRegions: floorPlan.occupiedRegions.length,
          scale_m_per_pixel: floorPlan.scale_m_per_pixel,
        },
        barriers: floorPlan.barriers.map(b => ({
          id: b.id, name: b.name, type: b.barrierType,
          x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2,
          useFactor: b.useFactor, occupancyFactor: b.occupancyFactor,
          designGoal_mSv_per_wk: b.designGoal_mSv_per_wk,
          materialCode: b.materialCode,
        })),
        sources: floorPlan.sources.map(s => ({
          id: s.id, name: s.name, x: s.x, y: s.y,
          modality: s.modality?.name, energy: s.modality?.energies,
          workload: s.workloadValue, unit: s.workloadUnit,
        })),
        occupiedRegions: floorPlan.occupiedRegions,
      }
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `radshield_report_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
    } else {
      const headers = 'id,name,type,materialCode,useFactor,occupancyFactor,designGoal_mSv_per_wk,x1,y1,x2,y2\n';
      const rows = floorPlan.barriers.map(b => `${b.id},${b.name},${b.barrierType},${b.materialCode},${b.useFactor},${b.occupancyFactor},${b.designGoal_mSv_per_wk},${b.x1},${b.y1},${b.x2},${b.y2}`).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `radshield_barriers_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
    }
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-lg" data-testid="batch-report-exporter-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileDown className="w-4 h-4 text-pink-500" /> Batch Report Exporter (v107)
            <Badge variant="outline" className="text-[9px]">JSON/CSV</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="bg-slate-50 rounded-md p-3 mb-3 text-[10px] space-y-1">
          <div className="flex justify-between"><span className="text-slate-500">Proyecto:</span><span className="font-medium">{floorPlan.name || 'Sin nombre'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Barreras:</span><span className="font-medium">{floorPlan.barriers.length}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Fuentes:</span><span className="font-medium">{floorPlan.sources.length}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Regiones:</span><span className="font-medium">{floorPlan.occupiedRegions.length}</span></div>
        </div>
        <div className="flex gap-2 mb-3">
          <Button variant={format === 'json' ? 'default' : 'outline'} size="sm" className="text-[10px] h-7" onClick={() => setFormat('json')}><FileText className="w-3 h-3 mr-1" />JSON</Button>
          <Button variant={format === 'csv' ? 'default' : 'outline'} size="sm" className="text-[10px] h-7" onClick={() => setFormat('csv')}><FileText className="w-3 h-3 mr-1" />CSV</Button>
        </div>
        <Button onClick={exportData} className="w-full h-8 text-[11px] bg-pink-600 hover:bg-pink-700">
          {exported ? <><CheckCircle className="w-3 h-3 mr-1" />Exportado</> : <><Download className="w-3 h-3 mr-1" />Exportar {format.toUpperCase()}</>}
        </Button>
        <p className="text-[8px] text-slate-400 mt-2">Incluye: barreras, fuentes, regiones ocupadas, factores NCRP, coordenadas canvas</p>
      </DialogContent>
    </Dialog>
  );
}
