import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Upload, FileImage, FileText, Box, AlertTriangle, CheckCircle2, ChevronRight, Layers, ExternalLink } from 'lucide-react';

interface CADImportDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface CADFormat {
  id: string;
  name: string;
  ext: string;
  description: string;
  status: 'supported' | 'partial' | 'future';
  method: string;
  notes: string;
}

const CAD_FORMATS: CADFormat[] = [
  { id: 'dxf', name: 'AutoCAD DXF', ext: '.dxf', description: 'Drawing Exchange Format — formato nativo de intercambio AutoCAD', status: 'supported', method: 'Importador nativo con js-dxf', notes: 'Soportado completamente. Seleccione un archivo .dxf para importar geometrías 2D.' },
  { id: 'dwg', name: 'AutoCAD DWG', ext: '.dwg', description: 'Drawing — formato binario nativo de AutoCAD', status: 'partial', method: 'Via DXF intermedio (ODA File Converter)', notes: 'Convertir DWG a DXF primero usando ODA File Converter (gratuito) o AutoCAD.' },
  { id: 'step', name: 'STEP / STP', ext: '.stp/.step', description: 'Standard for the Exchange of Product — modelo 3D parametrico', status: 'future', method: 'Three.js + occt-import-js (WASM)', notes: 'En desarrollo. Requiere conversión WASM de OpenCASCADE. Soporte planificado v16.' },
  { id: 'iges', name: 'IGES', ext: '.igs/.iges', description: 'Initial Graphics Exchange Specification — modelo 3D', status: 'future', method: 'Three.js IGES loader', notes: 'En roadmap. Use STEP como alternativa preferida.' },
  { id: 'stl', name: 'STL', ext: '.stl', description: 'Stereolithography — malla triangular 3D', status: 'future', method: 'Three.js STLLoader nativo', notes: 'Soporte planificado v16 para importar mallas de blindaje 3D.' },
  { id: 'obj', name: 'Wavefront OBJ', ext: '.obj', description: 'Formato de geometria 3D con materiales MTL', status: 'future', method: 'Three.js OBJLoader', notes: 'En roadmap v16. Util para importar modelos 3D de bunker.' },
];

const EXTERNAL_TOOLS = [
  { name: 'ODA File Converter', desc: 'Convertir DWG ↔ DXF gratuitamente', url: 'https://www.opendesign.com/guestfiles/oda_file_converter' },
  { name: 'Autodesk Viewer', desc: 'Visualizar DWG/DXF en navegador', url: 'https://viewer.autodesk.com/' },
  { name: 'FreeCAD', desc: 'CAD open source — exporta STEP/IGES/DXF', url: 'https://www.freecad.org/' },
  { name: 'ShareCAD.org', desc: 'Visualizar DWG/DXF/STEP online', url: 'https://sharecad.org/' },
];

export default function CADImportDialog({ open, onOpenChange }: CADImportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>('dxf');
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const format = CAD_FORMATS.find(f => f.id === selectedFormat);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      // Handle file
    }
  };

  const statusConfig = {
    supported: { label: 'SOPORTADO', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CheckCircle2 },
    partial: { label: 'PARCIAL', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: AlertTriangle },
    future: { label: 'FUTURO', color: 'bg-slate-100 text-slate-500 border-slate-300', icon: Box },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Upload className="w-5 h-5 text-blue-500" />
            Importar Geometrias CAD
            <Badge variant="outline" className="text-[10px]">6 formatos</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-3">
          <p className="text-xs text-slate-500">Seleccione el formato CAD que desea importar. DXF es el formato recomendado con soporte completo.</p>
        </div>

        {/* Format selector */}
        <div className="px-6 pb-3 grid grid-cols-3 gap-2">
          {CAD_FORMATS.map(f => {
            const cfg = statusConfig[f.status];
            return (
              <button key={f.id} className={`p-3 border rounded-lg text-left transition-all ${selectedFormat === f.id ? 'border-blue-300 bg-blue-50/30' : 'hover:bg-slate-50'}`} onClick={() => setSelectedFormat(f.id)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{f.name}</span>
                  <Badge className={`${cfg.color} text-[8px] h-3.5 px-1`}>{cfg.label}</Badge>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{f.ext}</span>
              </button>
            );
          })}
        </div>

        {/* Selected format detail */}
        {format && (
          <div className="px-6 pb-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                {format.status === 'supported' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : format.status === 'partial' ? <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /> : <Box className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                <div>
                  <p className="text-xs text-slate-700">{format.description}</p>
                  <p className="text-xs text-slate-500 mt-1"><strong>Metodo:</strong> {format.method}</p>
                  <p className="text-xs text-slate-500 mt-0.5"><strong>Notas:</strong> {format.notes}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File drop zone */}
        {format?.status === 'supported' && (
          <div className="px-6 pb-3">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Arrastre un archivo {format.ext} aqui o click para seleccionar</p>
              <p className="text-xs text-slate-400 mt-1">Maximo 50 MB</p>
              <input ref={fileRef} type="file" accept=".dxf" className="hidden" />
            </div>
          </div>
        )}

        {/* External tools */}
        <Separator />
        <div className="px-6 pb-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">Herramientas externas recomendadas</h4>
          <div className="grid grid-cols-2 gap-2">
            {EXTERNAL_TOOLS.map(tool => (
              <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 border rounded hover:bg-slate-50 transition-colors">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div>
                  <div className="text-xs font-medium">{tool.name}</div>
                  <div className="text-[10px] text-slate-500">{tool.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Future roadmap */}
        <div className="px-6 pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-blue-800 mb-1">Roadmap de Importacion CAD</h4>
            <div className="flex items-center gap-1 text-[10px] text-blue-700">
              <CheckCircle2 className="w-3 h-3" /> DXF (v14.5)
              <ChevronRight className="w-3 h-3" />
              <AlertTriangle className="w-3 h-3" /> DWG via DXF (v15)
              <ChevronRight className="w-3 h-3" />
              <Box className="w-3 h-3" /> STEP/IGES (v16)
              <ChevronRight className="w-3 h-3" />
              <Box className="w-3 h-3" /> STL/OBJ (v17)
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
