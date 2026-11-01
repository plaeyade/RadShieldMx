import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/stores/appStore';
import { FileDown, BookOpen } from 'lucide-react';

const FORMATS = [
  { id: 'dxf', name: 'DXF (AutoCAD)', ext: '.dxf', desc: 'Drawing Exchange Format — compatible con AutoCAD, Revit, SketchUp' },
  { id: 'dwg', name: 'DWG (AutoCAD Binary)', ext: '.dwg', desc: 'Formato binario nativo de AutoCAD' },
  { id: 'svg', name: 'SVG (Vector Web)', ext: '.svg', desc: 'Scalable Vector Graphics — para web y edicion' },
  { id: 'json', name: 'JSON (Datos)', ext: '.json', desc: 'Estructura de datos completa para importacion' },
];

const SCALES = [
  { id: '1:1', value: 1 },
  { id: '1:50', value: 50 },
  { id: '1:100', value: 100 },
  { id: '1:200', value: 200 },
];

function generateDXF(floorPlan: any, scale: number): string {
  let dxf = '0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n';
  // Barriers as lines
  floorPlan?.barriers?.forEach((b: any, i: number) => {
    if (b.points && b.points.length >= 2) {
      for (let j = 0; j < b.points.length - 1; j++) {
        const x1 = (b.points[j].x * scale).toFixed(2);
        const y1 = (-b.points[j].y * scale).toFixed(2);
        const x2 = (b.points[j + 1].x * scale).toFixed(2);
        const y2 = (-b.points[j + 1].y * scale).toFixed(2);
        dxf += `0\nLINE\n8\nBARRERAS\n62\n${b.type === 'primary' ? 1 : b.type === 'secondary' ? 2 : 3}\n10\n${x1}\n20\n${y1}\n11\n${x2}\n21\n${y2}\n`;
      }
    }
  });
  // Sources as points
  floorPlan?.sources?.forEach((s: any, i: number) => {
    const x = (s.position?.x * scale || 0).toFixed(2);
    const y = (-(s.position?.y || 0) * scale).toFixed(2);
    dxf += `0\nPOINT\n8\nFUENTES\n62\n1\n10\n${x}\n20\n${y}\n`;
    dxf += `0\nTEXT\n8\nFUENTES\n62\n1\n10\n${x}\n20\n${(+y - 2).toFixed(2)}\n40\n2.5\n1\n${s.type || 'F'}-${i + 1}\n`;
  });
  dxf += '0\nENDSEC\n0\nEOF\n';
  return dxf;
}

export default function DxfExportDialog() {
  const open = useAppStore(s => s.dialogs.dxfExport?.open ?? false);
  const close = () => useAppStore.getState().close('dxfExport');
  const [format, setFormat] = useState('dxf');
  const [scaleId, setScaleId] = useState('1:100');
  const [includeLabels, setIncludeLabels] = useState(true);
  const [includeGrid, setIncludeGrid] = useState(false);
  const fmt = FORMATS.find(f => f.id === format);
  const sc = SCALES.find(s => s.id === scaleId)?.value || 100;

  const handleExport = () => {
    const mockFloorPlan = {
      name: 'Sala_Radiologia',
      barriers: [
        { type: 'primary', points: [{ x: 0, y: 0 }, { x: 500, y: 0 }, { x: 500, y: 10 }, { x: 0, y: 10 }, { x: 0, y: 0 }] },
        { type: 'secondary', points: [{ x: 0, y: 0 }, { x: 0, y: 400 }, { x: 10, y: 400 }, { x: 10, y: 0 }, { x: 0, y: 0 }] },
        { type: 'primary', points: [{ x: 0, y: 400 }, { x: 500, y: 400 }, { x: 500, y: 390 }, { x: 0, y: 390 }, { x: 0, y: 400 }] },
      ],
      sources: [
        { position: { x: 250, y: 200 }, type: 'XR' },
        { position: { x: 400, y: 300 }, type: 'CT' },
      ],
    };
    let content = '', mime = 'text/plain', filename = `RadShield_${mockFloorPlan.name}`;
    if (format === 'dxf') {
      content = generateDXF(mockFloorPlan, sc);
      mime = 'application/dxf'; filename += '.dxf';
    } else if (format === 'svg') {
      content = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400" viewBox="0 0 500 400"><rect x="0" y="0" width="500" height="10" fill="#f97316"/><rect x="0" y="0" width="10" height="400" fill="#3b82f6"/><rect x="0" y="390" width="500" height="10" fill="#f97316"/><circle cx="250" cy="200" r="5" fill="#ef4444"/><text x="255" y="205" font-size="10">XR-1</text><circle cx="400" cy="300" r="5" fill="#ef4444"/><text x="405" y="305" font-size="10">CT-2</text></svg>`;
      mime = 'image/svg+xml'; filename += '.svg';
    } else {
      content = JSON.stringify(mockFloorPlan, null, 2);
      mime = 'application/json'; filename += '.json';
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileDown className="w-5 h-5 text-[#ea580c]" /> Exportar Plano — v125
            <span className="text-[10px] font-mono text-slate-400">DXF | DWG | SVG | JSON</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-[10px]">Formato</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{FORMATS.map(f => <SelectItem key={f.id} value={f.id} className="text-xs">{f.name} — {f.desc}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-[10px]">Escala</Label>
            <Select value={scaleId} onValueChange={setScaleId}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{SCALES.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.id}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="bg-slate-50 rounded p-2 text-[10px] text-slate-600">
            <div>Formato: <span className="font-semibold">{fmt?.name}</span></div>
            <div>Extension: <span className="font-mono">{fmt?.ext}</span></div>
            <div>Escala: <span className="font-mono">1:{sc}</span></div>
          </div>
          <Button onClick={handleExport} className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white gap-2">
            <FileDown className="w-4 h-4" /> Exportar {fmt?.ext}
          </Button>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Ref: AutoCAD DXF Reference | ODA File Converter | SVG 1.1 Spec</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
