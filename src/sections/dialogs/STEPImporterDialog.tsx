/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v27 — STEP/IGES Native Importer Dialog
 * ═══════════════════════════════════════════════════════════════════════════
 *  Import STEP (.stp/.step) and IGES (.igs/.iges) files with:
 *    • B-Rep parsing via OpenCascade.js
 *    • Automatic tessellation
 *    • Material assignment
 *    • Overlap detection
 *    • Visualization preview
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Upload, FileBox, CheckCircle, AlertTriangle, XCircle,
  Layers, Box, Search, RotateCcw, Download, ChevronRight
} from 'lucide-react';
import {
  importSTEPFile, type STEPImportResult, type STEPImportedSolid,
} from '@/lib/stepImporter';

interface STEPImporterDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImportComplete?: (result: STEPImportResult) => void;
}

export default function STEPImporterDialog({ open, onOpenChange, onImportComplete }: STEPImporterDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<STEPImportResult | null>(null);
  const [selectedSolid, setSelectedSolid] = useState<STEPImportedSolid | null>(null);
  const [scale, setScale] = useState('0.001'); // mm → m
  const [chordalDeflection, setChordalDeflection] = useState('0.5');
  const [assignMaterials, setAssignMaterials] = useState(true);
  const [detectOverlaps, setDetectOverlaps] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const ext = f.name.toLowerCase().split('.').pop();
      if (['stp', 'step', 'igs', 'iges'].includes(ext || '')) {
        setFile(f);
        setResult(null);
        setSelectedSolid(null);
      } else {
        toast.error('Formato no soportado. Use .stp, .step, .igs, o .iges');
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      const ext = f.name.toLowerCase().split('.').pop();
      if (['stp', 'step', 'igs', 'iges'].includes(ext || '')) {
        setFile(f);
        setResult(null);
        setSelectedSolid(null);
      } else {
        toast.error('Formato no soportado');
      }
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;
    setIsImporting(true);
    try {
      const res = await importSTEPFile({
        file,
        scaleToMeters: parseFloat(scale) || 0.001,
        tessellationChordalDeflection: parseFloat(chordalDeflection) || 0.5,
        tessellationAngularDeflection: 0.5,
        assignMaterials,
        detectOverlaps,
        overlapTolerance_mm: 1.0,
      });
      setResult(res);
      if (res.success) {
        toast.success(`Importado: ${res.solids.length} solido(s), ${res.numTriangles} triangulos en ${res.processingTime_ms.toFixed(0)} ms`);
        if (res.engine === 'fallback') {
          toast.warning('Importacion STEP/IGES en modo compatibilidad sin OpenCascade.js');
        }
        if (res.overlaps && res.overlaps.length > 0) {
          toast.warning(`Detectados ${res.overlaps.length} overlaps entre solidos`);
        }
        onImportComplete?.(res);
      } else {
        toast.error('Errores en importacion: ' + res.errors.join('; '));
      }
    } catch (e) {
      toast.error('Error: ' + (e as Error).message);
    } finally {
      setIsImporting(false);
    }
  }, [file, scale, chordalDeflection, assignMaterials, detectOverlaps, onImportComplete]);

  const handleReset = useCallback(() => {
    setFile(null);
    setResult(null);
    setSelectedSolid(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const exportResultJSON = useCallback(() => {
    if (!result) return;
    const data = {
      fileName: result.fileName,
      format: result.format,
      totalVolume_m3: result.totalVolume_m3,
      totalSurfaceArea_m2: result.totalSurfaceArea_m2,
      boundingBox: result.boundingBox,
      numTriangles: result.numTriangles,
      solids: result.solids.map(s => ({
        id: s.id,
        name: s.name,
        volume_m3: s.volume_m3,
        surfaceArea_m2: s.surfaceArea_m2,
        boundingBox: s.boundingBox,
        centerOfMass: s.centerOfMass,
        materialAssignment: s.materialAssignment,
        triangles: s.triangles,
        faces: s.faces.length,
      })),
      overlaps: result.overlaps,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STEP_Import_${result.fileName.replace(/\.(stp|step|igs|iges)$/i, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exportado');
  }, [result]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileBox className="w-5 h-5 text-emerald-500" />
            STEP / IGES Native Importer — v27
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[65vh] px-6 py-4">
          {/* File drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: 'pointer' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".stp,.step,.igs,.iges"
              className="hidden"
              onChange={handleFileSelect}
            />
            {file ? (
              <div className="space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <div className="text-sm font-medium text-emerald-700">{file.name}</div>
                <div className="text-[11px] text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB | Click para cambiar
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-sm font-medium text-slate-600">
                  Arrastre archivo STEP/IGES aqui o click para seleccionar
                </div>
                <div className="text-[11px] text-slate-400">
                  Soporta: .stp, .step, .igs, .iges (AP214, AP242)
                </div>
              </div>
            )}
          </div>

          {/* Options */}
          {file && (
            <div className="mt-4 space-y-3">
              <div className="text-[11px] font-semibold text-slate-700">Opciones de importacion</div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[10px]">Escala (→ metros)</Label>
                  <Input value={scale} onChange={e => setScale(e.target.value)} className="h-7 text-xs" placeholder="0.001 = mm→m" />
                </div>
                <div>
                  <Label className="text-[10px]">Deflexion cuerda (mm)</Label>
                  <Input value={chordalDeflection} onChange={e => setChordalDeflection(e.target.value)} className="h-7 text-xs" placeholder="0.5" />
                </div>
                <div className="space-y-2 pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px]">Asignar materiales</Label>
                    <Switch checked={assignMaterials} onCheckedChange={setAssignMaterials} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px]">Detectar overlaps</Label>
                    <Switch checked={detectOverlaps} onCheckedChange={setDetectOverlaps} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="text-xs" onClick={handleImport} disabled={isImporting}>
                  {isImporting ? (
                    <><RotateCcw className="w-3.5 h-3.5 mr-1 animate-spin" /> Importando...</>
                  ) : (
                    <><Upload className="w-3.5 h-3.5 mr-1" /> Importar B-Rep</>
                  )}
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={handleReset}>
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Limpiar
                </Button>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                    <CheckCircle className="w-3 h-3 mr-1" /> Exitoso
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px]">
                    <XCircle className="w-3 h-3 mr-1" /> Error
                  </Badge>
                )}
                <span className="text-[11px] text-slate-500">{result.fileName}</span>
                <Badge variant="outline" className="text-[10px]">{result.engine === 'opencascade' ? 'OpenCascade' : 'Fallback'}</Badge>
                <span className="text-[10px] text-slate-400">| {result.processingTime_ms.toFixed(0)} ms</span>
                <div className="flex-1" />
                <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={exportResultJSON}>
                  <Download className="w-3 h-3 mr-1" /> Export JSON
                </Button>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-2 text-[11px] text-red-700">
                  <strong>Errores:</strong>
                  <ul className="list-disc ml-4 mt-1">
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-[11px] text-amber-700">
                  <strong>Advertencias:</strong>
                  <ul className="list-disc ml-4 mt-1">
                    {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {result.overlaps && result.overlaps.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-2 text-[11px] text-red-700">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                  <strong>{result.overlaps.length} overlaps detectados:</strong>
                  <div className="mt-1 space-y-0.5">
                    {result.overlaps.map((o, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[9px] h-4 px-1">{o.severity}</Badge>
                        <span>{o.pairId}: {o.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-slate-50 rounded p-2 border text-center">
                  <div className="text-lg font-bold text-slate-700">{result.solids.length}</div>
                  <div className="text-[10px] text-slate-500">Solidos</div>
                </div>
                <div className="bg-slate-50 rounded p-2 border text-center">
                  <div className="text-lg font-bold text-slate-700">{result.numTriangles.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500">Triangulos</div>
                </div>
                <div className="bg-slate-50 rounded p-2 border text-center">
                  <div className="text-lg font-bold text-slate-700">{result.totalVolume_m3.toExponential(2)}</div>
                  <div className="text-[10px] text-slate-500">Volumen (m³)</div>
                </div>
                <div className="bg-slate-50 rounded p-2 border text-center">
                  <div className="text-lg font-bold text-slate-700">{result.totalSurfaceArea_m2.toFixed(3)}</div>
                  <div className="text-[10px] text-slate-500">Area (m²)</div>
                </div>
              </div>

              {/* Global bounding box */}
              <div className="bg-slate-50 rounded-md p-2 border text-[11px]">
                <strong>Bounding Box global:</strong>{' '}
                [{result.boundingBox.min.map(v => v.toFixed(3)).join(', ')}] →
                [{result.boundingBox.max.map(v => v.toFixed(3)).join(', ')}]
              </div>

              {/* Solid list */}
              <div className="text-[11px] font-semibold text-slate-700 mt-2">
                Solidos importados ({result.solids.length})
              </div>
              <div className="space-y-1">
                {result.solids.map(solid => (
                  <button
                    key={solid.id}
                    className={`w-full text-left p-2 rounded border text-[11px] transition-colors ${
                      selectedSolid?.id === solid.id
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                    onClick={() => setSelectedSolid(solid)}
                  >
                    <div className="flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium flex-1">{solid.name}</span>
                      <Badge variant="outline" className="text-[9px] h-4">{solid.type}</Badge>
                      {solid.materialAssignment && (
                        <Badge className="text-[9px] h-4 bg-blue-100 text-blue-700">{solid.materialAssignment}</Badge>
                      )}
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-slate-500 ml-5">
                      <span>V = {solid.volume_m3.toExponential(2)} m³</span>
                      <span>A = {solid.surfaceArea_m2.toFixed(4)} m²</span>
                      <span>{solid.triangles} tri</span>
                      <span>COM: [{solid.centerOfMass.map(v => v.toFixed(3)).join(', ')}]</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected solid detail */}
              {selectedSolid && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-[11px] space-y-2">
                  <div className="font-semibold text-blue-800 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> Detalle: {selectedSolid.name}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>Volumen: <strong>{selectedSolid.volume_m3.toExponential(3)} m³</strong></div>
                    <div>Superficie: <strong>{selectedSolid.surfaceArea_m2.toFixed(4)} m²</strong></div>
                    <div>Triangulos: <strong>{selectedSolid.triangles.toLocaleString()}</strong></div>
                    <div>Caras: <strong>{selectedSolid.faces.length}</strong></div>
                    <div>Material: <strong>{selectedSolid.materialAssignment || 'No asignado'}</strong></div>
                    <div>Centro de masa: [{selectedSolid.centerOfMass.map(v => v.toFixed(4)).join(', ')}]</div>
                  </div>
                  <div className="text-slate-600">
                    <strong>Bounding Box:</strong><br />
                    Min: [{selectedSolid.boundingBox.min.map(v => v.toFixed(4)).join(', ')}]<br />
                    Max: [{selectedSolid.boundingBox.max.map(v => v.toFixed(4)).join(', ')}]
                  </div>
                  <div className="text-slate-600">
                    <strong>Tipos de superficie:</strong>{' '}
                    {Array.from(new Set(selectedSolid.faces.map(f => f.surfaceType))).join(', ') || 'N/A'}
                  </div>
                </div>
              )}
            </div>
          )}

          {!file && !result && (
            <div className="text-center py-8 text-slate-400 text-sm">
              <FileBox className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Seleccione un archivo STEP (.stp/.step) o IGES (.igs/.iges)</p>
              <p className="text-[11px] mt-1">Modo compatibilidad activo; OpenCascade puede integrarse como motor opcional</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
