// DxfExportDialog — exporta el plano del proyecto abierto (DXF, SVG o JSON).
// Fase 7: antes exportaba un plano de ejemplo fijo y rotulaba como «DWG» un JSON. Ahora lee `useCanvasStore`
// y usa `exportarDXF`/`exportarSVG` (lib/dxfExport), cuyo DXF se reimporta con `importDXFToFloorPlan`.
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { FileDown, BookOpen } from 'lucide-react';
import { capaDXF, exportarDXF, exportarSVG } from '@/lib/dxfExport';

const FORMATS = [
  { id: 'dxf', name: 'DXF ASCII (AutoCAD R12)', ext: '.dxf', mime: 'application/dxf', desc: 'Barreras como LINE por capa, unidades mm' },
  { id: 'svg', name: 'SVG', ext: '.svg', mime: 'image/svg+xml', desc: 'Vista vectorial del plano en mm' },
  { id: 'json', name: 'JSON del proyecto', ext: '.json', mime: 'application/json', desc: 'Plano completo para reimportar en RadShield' },
] as const;

export default function DxfExportDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.dxfExport));
  const close = () => useAppStore.getState().close('dxfExport');
  const floorPlan = useCanvasStore(s => s.floorPlan);
  const [format, setFormat] = useState<(typeof FORMATS)[number]['id']>('dxf');
  const fmt = FORMATS.find(f => f.id === format)!;
  const capas = Array.from(new Set(floorPlan.barriers.map(capaDXF)));

  const contenido = () => (format === 'dxf' ? exportarDXF(floorPlan) : format === 'svg' ? exportarSVG(floorPlan) : JSON.stringify(floorPlan, null, 2));

  const handleExport = () => {
    const blob = new Blob([contenido()], { type: fmt.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `RadShield_${floorPlan.name.replace(/[^\w-]+/g, '_')}${fmt.ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileDown className="w-5 h-5 text-[#ea580c]" /> Exportar plano del proyecto
          </DialogTitle>
          <DialogDescription className="text-xs">
            {floorPlan.name}: {floorPlan.barriers.length} barrera(s) y {floorPlan.sources.length} fuente(s), escala {floorPlan.scale_m_per_pixel} m/px.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label htmlFor="dxf-formato" className="text-[10px]">Formato</Label>
            <select id="dxf-formato" className="h-8 w-full rounded-md border border-input px-1 text-xs" value={format} onChange={e => setFormat(e.target.value as typeof format)}>
              {FORMATS.map(f => <option key={f.id} value={f.id}>{f.name} — {f.desc}</option>)}
            </select>
          </div>
          {format === 'dxf' && (
            <div className="bg-slate-50 rounded p-2 text-[10px] text-slate-600" data-testid="dxf-capas">
              <div className="font-semibold mb-1">Capas ({capas.length})</div>
              {capas.length ? capas.map(c => <div key={c} className="font-mono">{c}</div>) : <div>Sin barreras.</div>}
            </div>
          )}
          <Button onClick={handleExport} disabled={!floorPlan.barriers.length && !floorPlan.sources.length} className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white gap-2">
            <FileDown className="w-4 h-4" /> Exportar {fmt.ext}
          </Button>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />El DXF usa $INSUNITS = 4 (mm) y la convención de capas del importador; DWG no se ofrece (formato binario cerrado).</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
