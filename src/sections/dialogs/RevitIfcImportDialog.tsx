/**
 * v102: Revit IFC Import — Geometry to Barriers
 * Imports IFC files from Autodesk Revit and converts walls to Barrier objects
 * Workflow: Revit Export IFC → RadShield Import → Auto-generate barriers
 */
import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/appStore';
import { Upload, Building2, CheckCircle, AlertTriangle, Layers, Info, Download } from 'lucide-react';
import { suggestOccupancyProfile } from '@/lib/ncrpOccupancy';
import {
  REVIT_READINESS_CHECKLIST,
  REVIT_SHARED_PARAMETERS,
  buildRevitCompatibilityManifest,
} from '@/lib/revitIntegration';

interface ParsedWall {
  id: string;
  name: string;
  x1: number; y1: number; x2: number; y2: number;
  thickness_mm: number;
  length_m: number;
  material: string;
}

interface ParsedRoom {
  id: string;
  name: string;
  x: number; y: number;
  width: number; height: number;
}

/** Escala del plano generado desde IFC (m por píxel). */
const ESCALA_IFC_M_POR_PX = 0.01;

/** Simple IFC wall parser (IFC2X3/IFC4) */
function parseIfcWalls(ifcText: string): { walls: ParsedWall[]; rooms: ParsedRoom[] } {
  const walls: ParsedWall[] = [];
  const rooms: ParsedRoom[] = [];
  const lines = ifcText.split('\n');

  // Parse IFCWALLSTANDARDCASE elements
  let wallCount = 0;
  for (const line of lines) {
    if (line.includes('IFCWALLSTANDARDCASE') || line.includes('IFCWALL')) {
      const nameMatch = line.match(/'([^']+)'/);
      const name = nameMatch ? nameMatch[1] : `Wall_${wallCount}`;
      // Extract coordinates from axis placement or geometry
      const coords = line.match(/[-+]?[0-9]*\.?[0-9]+/g);
      if (coords && coords.length >= 4) {
        const x1 = parseFloat(coords[0]) / ESCALA_IFC_M_POR_PX; // m → px a 0.01 m/px
        const y1 = parseFloat(coords[1]) / ESCALA_IFC_M_POR_PX;
        const x2 = parseFloat(coords[2]) / ESCALA_IFC_M_POR_PX;
        const y2 = parseFloat(coords[3]) / ESCALA_IFC_M_POR_PX;
        walls.push({
          id: `revit-wall-${Date.now()}-${wallCount}`,
          name: name.replace(/\\X\\[0-9A-F]{4}/g, ''), // Decode IFC unicode
          x1, y1, x2, y2,
          thickness_mm: 235, // Default concrete
          length_m: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * ESCALA_IFC_M_POR_PX,
          material: 'CONCRETE235',
        });
        wallCount++;
      }
    }
  }

  // Parse IFCSPACE for rooms
  let roomCount = 0;
  for (const line of lines) {
    if (line.includes('IFCSPACE')) {
      const nameMatch = line.match(/'([^']+)'/);
      const name = nameMatch ? nameMatch[1] : `Room_${roomCount}`;
      const bounds = line.match(/[-+]?[0-9]*\.?[0-9]+/g);
      if (bounds && bounds.length >= 4) {
        const x = parseFloat(bounds[0]) * 100;
        const y = parseFloat(bounds[1]) * 100;
        const w = Math.abs(parseFloat(bounds[2]) - parseFloat(bounds[0])) * 100;
        const h = Math.abs(parseFloat(bounds[3]) - parseFloat(bounds[1])) * 100;
        rooms.push({ id: `revit-room-${Date.now()}-${roomCount}`, name, x, y, width: w, height: h });
        roomCount++;
      }
    }
  }

  return { walls, rooms };
}

export default function RevitIfcImportDialog() {
  const open = useAppStore(s => Boolean(s.dialogs.revitIfcImport));
  const close = () => useAppStore.getState().close('revitIfcImport');

  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<{ walls: ParsedWall[]; rooms: ParsedRoom[] } | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseIfcWalls(text);
      setParsed(result);
    };
    reader.readAsText(file);
  }, []);

  const handleExport = useCallback(() => {
    if (!parsed) return;
    setExporting(true);

    const exportData = {
      source: 'Revit IFC Import',
      fileName,
      version: 'v102',
      timestamp: new Date().toISOString(),
      // Fase 8c: las coordenadas se pasan de m a px con ×100, es decir 0.01 m/px; se declara la escala para que el
      // plano importado no tome la escala del plano abierto (antes «m × 100 → px aprox.» la ignoraba).
      scale_m_per_pixel: ESCALA_IFC_M_POR_PX,
      compatibility: buildRevitCompatibilityManifest({
        sourceFile: fileName,
        wallCount: parsed.walls.length,
        spaceCount: parsed.rooms.length,
      }),
      barriers: parsed.walls.map(w => {
        const profile = suggestOccupancyProfile(w.name);
        return {
          id: w.id, name: `${w.name} (Revit)`,
          x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2,
          barrierType: 'secondary', useFactor: 0.25,
          occupancyFactor: profile.occupancyFactor,
          designGoal_mSv_per_wk: 0.02,
          materialCode: w.material,
        };
      }),
      occupiedRegions: parsed.rooms.map(r => {
        const profile = suggestOccupancyProfile(r.name);
        return {
          id: r.id, name: `${r.name} (Revit)`,
          occupancyFactor: profile.occupancyFactor,
          designGoal_mSv_per_wk: 0.02,
          points: [
            { x: r.x, y: r.y },
            { x: r.x + r.width, y: r.y },
            { x: r.x + r.width, y: r.y + r.height },
            { x: r.x, y: r.y + r.height },
          ],
        };
      }),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.ifc$/i, '')}_radshield.json`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setExporting(false);
      close();
    }, 500);
  }, [parsed, fileName, close]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-blue-500" />
            Revit IFC Import (v102)
            <Badge variant="outline" className="text-[9px]">BIM Integration</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="text-[10px] text-slate-500 bg-blue-50 rounded-md p-2 mb-3 flex items-start gap-2">
          <Info className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
          Flujo: Revit → Exportar IFC → RadShield Import → Barreras automaticas con factores NCRP
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-slate-200 rounded-md p-4 text-center hover:border-blue-300 transition-colors">
          <input
            type="file"
            accept=".ifc"
            onChange={handleFile}
            className="hidden"
            id="ifc-upload"
            data-testid="revit-ifc-input"
          />
          <label htmlFor="ifc-upload" className="cursor-pointer flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-slate-400" />
            <span className="text-[11px] text-slate-600 font-medium">
              {fileName || 'Seleccionar archivo .ifc de Revit'}
            </span>
            <span className="text-[9px] text-slate-400">IFC2X3 o IFC4</span>
          </label>
        </div>

        {/* Parsed Results */}
        {parsed && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-[11px]">
              <Layers className="w-3 h-3 text-blue-500" />
              <span className="font-medium">{parsed.walls.length} muros</span>
              <span className="text-slate-400">|</span>
              <span className="font-medium">{parsed.rooms.length} espacios</span>
              detectados
            </div>

            {parsed.walls.length > 0 && (
              <div className="max-h-32 overflow-y-auto border rounded-md">
                <table className="w-full text-[9px]">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1">Muro</th>
                      <th className="text-right px-2 py-1">Largo (m)</th>
                      <th className="text-right px-2 py-1">T NCRP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.walls.slice(0, 10).map(w => {
                      const profile = suggestOccupancyProfile(w.name);
                      return (
                        <tr key={w.id} className="border-t">
                          <td className="px-2 py-1 truncate max-w-[150px]">{w.name}</td>
                          <td className="text-right px-2 py-1 font-mono">{w.length_m.toFixed(1)}</td>
                          <td className="text-right px-2 py-1">{profile.occupancyFactor}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {parsed.walls.length > 10 && (
                  <div className="text-center text-[8px] text-slate-400 py-1">
                    ... y {parsed.walls.length - 10} mas
                  </div>
                )}
              </div>
            )}

            {parsed.walls.length === 0 && (
              <div className="flex items-start gap-1 text-[9px] text-amber-600">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                No se detectaron muros IFC. Verifique que el archivo contenga IFCWALL elements.
              </div>
            )}

            <Button
              onClick={handleExport}
              disabled={exporting || parsed.walls.length === 0}
              className="w-full h-8 text-[11px] bg-blue-600 hover:bg-blue-700"
            >
              {exporting ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1 animate-pulse" />
                  Exportando JSON...
                </>
              ) : (
                <>
                  <Download className="w-3 h-3 mr-1" />
                  Exportar JSON para RadShield-MX
                </>
              )}
            </Button>
          </div>
        )}

        {/* Revit/BIM Readiness */}
        <div className="mt-2 border rounded-md p-2 bg-slate-50">
          <h4 className="text-[10px] font-semibold text-slate-700 mb-1">Fase 44 - Revit/BIM Readiness</h4>
          <div className="space-y-1 text-[8px] text-slate-500">
            {REVIT_READINESS_CHECKLIST.slice(0, 4).map(item => (
              <div key={item.id} className="flex items-start gap-1">
                <span className="font-mono uppercase text-[7px] text-blue-600 min-w-12">{item.status}</span>
                <span>{item.label}: {item.note}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[8px] text-amber-700">
            RVT nativo queda externo: requiere Revit API, Add-in o Autodesk Platform Services.
          </div>
        </div>

        {/* Shared Parameters Reference */}
        <div className="mt-2 border rounded-md p-2">
          <h4 className="text-[10px] font-semibold text-slate-700 mb-1">Parametros Compartidos Revit (RS_*)</h4>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8px] text-slate-500">
            {REVIT_SHARED_PARAMETERS.map(parameter => (
              <span key={parameter.name} className="contents">
                <span className="font-mono">{parameter.name}</span><span>{parameter.example}</span>
              </span>
            ))}
          </div>
        </div>

        <p className="text-[8px] text-slate-400 mt-1">
          Autodesk Revit API | IFC2X3/IFC4 | NCRP 147/151 occupancy factors applied automatically
        </p>
      </DialogContent>
    </Dialog>
  );
}
