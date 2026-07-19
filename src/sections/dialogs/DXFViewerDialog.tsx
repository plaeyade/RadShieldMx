// =============================================================================
// DXFViewerDialog — Importar y visualizar archivos DXF con capas
// Soporta: LINE, CIRCLE, ARC, LWPOLYLINE, TEXT/MTEXT
// Capas interactivas (mostrar/ocultar), zoom, pan
// =============================================================================
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Upload, Layers, Eye, EyeOff, ZoomIn, ZoomOut, FileUp, Info, X, SendToBack } from 'lucide-react';
import { parseDXF, renderDXFToCanvas, type DXFParsed, type DXFLayer, isDWGFile, convertDWGNote } from '@/lib/dxfParser';
import { importDXFToFloorPlan, type CadBimImportSummary } from '@/lib/medical3D/cadBimBridge';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

const LAYER_COLORS: Record<number, string> = {
  1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-green-500',
  5: 'bg-cyan-500', 6: 'bg-blue-500', 7: 'bg-slate-200', 8: 'bg-purple-500',
  9: 'bg-pink-500', 10: 'bg-teal-500',
};

export default function DXFViewerDialog({ open, onOpenChange }: Props) {
  const [parsed, setParsed] = useState<DXFParsed | null>(null);
  const [fileName, setFileName] = useState('');
  const [zoom, setZoom] = useState(1);
  const [lineWidth, setLineWidth] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [importSummary, setImportSummary] = useState<CadBimImportSummary | null>(null);
  const [lastContent, setLastContent] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // v14.5: DWG detection with conversion panel
    if (file.name.toLowerCase().endsWith('.dwg')) {
      toast.error('Archivo DWG detectado. Seleccione "Convertir DWG" en el panel izquierdo para instrucciones.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const result = parseDXF(content);
        const bridge = importDXFToFloorPlan(content, file.name);
        setParsed(result);
        setImportSummary(bridge.summary);
        setLastContent(content);
        setFileName(file.name);
        setZoom(1);
        toast.success(`DXF cargado: ${result.entities.length} entidades, ${bridge.summary.mappedBarriers} barreras detectadas`);
      } catch (err: any) {
        toast.error('Error al parsear DXF: ' + err.message);
      }
    };
    reader.readAsText(file);
  }, []);

  // Toggle layer visibility
  const toggleLayer = useCallback((layerName: string) => {
    setParsed(prev => {
      if (!prev) return prev;
      const newLayers = new Map(prev.layers);
      const layer = newLayers.get(layerName);
      if (layer) {
        newLayers.set(layerName, { ...layer, visible: !layer.visible });
      }
      return { ...prev, layers: newLayers };
    });
  }, []);

  // Render to canvas
  useEffect(() => {
    if (!parsed || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth - 16;
      canvas.height = parent.clientHeight - 16;
    }

    renderDXFToCanvas(ctx, parsed, {
      width: canvas.width,
      height: canvas.height,
      lineWidth,
      showLabels,
    });
  }, [parsed, zoom, lineWidth, showLabels]);

  // Zoom handlers
  const zoomIn = () => setZoom(z => Math.min(z * 1.2, 5));
  const zoomOut = () => setZoom(z => Math.max(z / 1.2, 0.2));
  const applyToCanvas = () => {
    if (!lastContent || !fileName) {
      toast.error('Importe primero un archivo DXF');
      return;
    }
    try {
      const bridge = importDXFToFloorPlan(lastContent, fileName);
      window.dispatchEvent(new CustomEvent('radshield:dxf-imported-floorplan', { detail: bridge }));
      toast.success(`Plano DXF aplicado al canvas: ${bridge.summary.mappedBarriers} barreras`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error('No se pudo aplicar el DXF al canvas: ' + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[92vh] h-[92vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b bg-slate-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Visor DXF — Importar plano de blindaje</DialogTitle>
                <p className="text-xs text-slate-500">
                  Soporta: LINE, CIRCLE, ARC, LWPOLYLINE, TEXT/MTEXT | Para DWG, exporte como DXF desde AutoCAD
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".dxf,.dwg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs">
                <Upload className="w-3 h-3 mr-1" /> Importar DXF
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={applyToCanvas}
                disabled={!parsed}
                data-testid="dxf-apply-to-canvas"
                className="text-xs bg-orange-600 hover:bg-orange-700"
              >
                <SendToBack className="w-3 h-3 mr-1" /> Aplicar al canvas
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Canvas */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700 bg-slate-800 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={zoomIn} className="text-slate-300 hover:text-white h-7 text-xs">
                <ZoomIn className="w-3 h-3 mr-1" /> Acercar
              </Button>
              <Button variant="ghost" size="sm" onClick={zoomOut} className="text-slate-300 hover:text-white h-7 text-xs">
                <ZoomOut className="w-3 h-3 mr-1" /> Alejar
              </Button>
              <div className="h-4 w-px bg-slate-600 mx-1" />
              <div className="flex items-center gap-1">
                <Label className="text-xs text-slate-400">Grosor:</Label>
                <input type="range" min="0.5" max="3" step="0.5" value={lineWidth}
                  onChange={e => setLineWidth(parseFloat(e.target.value))}
                  className="w-16 h-1" />
              </div>
              <div className="h-4 w-px bg-slate-600 mx-1" />
              <div className="flex items-center gap-2">
                <Switch id="labels" checked={showLabels} onCheckedChange={setShowLabels} />
                <Label htmlFor="labels" className="text-xs text-slate-400 cursor-pointer">Etiquetas</Label>
              </div>
              <div className="flex-1" />
              {parsed && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Badge variant="outline" className="text-[10px] h-5">{parsed.entities.length} entidades</Badge>
                  <Badge variant="outline" className="text-[10px] h-5">{parsed.layers.size} capas</Badge>
                  {importSummary && <Badge variant="outline" className="text-[10px] h-5">{importSummary.mappedBarriers} barreras</Badge>}
                  <Badge variant="outline" className="text-[10px] h-5">{parsed.unit}</Badge>
                </div>
              )}
            </div>

            {/* Canvas area */}
            <div className="flex-1 p-2 overflow-hidden">
              {parsed ? (
                <canvas
                  ref={canvasRef}
                  className="w-full h-full rounded border border-slate-700"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded">
                  <FileUp className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-sm font-medium">Importe un archivo DXF para visualizar</p>
                  <p className="text-xs mt-2 opacity-60">Arrastre el archivo o use el botón Importar</p>
                  <div className="mt-4 flex items-start gap-2 max-w-md text-xs opacity-60 bg-slate-800 p-3 rounded">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>Para archivos DWG: En AutoCAD, use "Guardar como" y seleccione formato DXF. RadShield-MX soporta DXF R12-R2018.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Layers panel */}
          {parsed && (
            <div className="w-56 border-l bg-white flex-shrink-0 flex flex-col overflow-hidden">
              <div className="px-3 py-2 border-b bg-slate-50">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Layers className="w-3 h-3" /> Capas
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {Array.from(parsed.layers.values()).map(layer => (
                    <div
                      key={layer.name}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${layer.visible ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'}`}
                      onClick={() => toggleLayer(layer.name)}
                    >
                      {layer.visible ? (
                        <Eye className="w-3 h-3 text-slate-600" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-slate-300" />
                      )}
                      <div className={`w-2.5 h-2.5 rounded-full ${LAYER_COLORS[layer.color] || 'bg-slate-400'}`} />
                      <span className={`text-xs truncate flex-1 ${layer.visible ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                        {layer.name}
                      </span>
                      <Badge variant="outline" className="text-[9px] h-3.5 px-0.5 min-w-[18px] justify-center">{layer.entities.length}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* File info */}
              {fileName && (
                <div className="px-3 py-2 border-t bg-slate-50 text-[10px] text-slate-500">
                  <div className="font-medium truncate">{fileName}</div>
                  <div className="mt-0.5">
                    {parsed.bounds.maxX - parsed.bounds.minX > 0 && (
                      <>Dimensiones: {(parsed.bounds.maxX - parsed.bounds.minX).toFixed(1)} x {(parsed.bounds.maxY - parsed.bounds.minY).toFixed(1)} {parsed.unit}</>
                    )}
                  </div>
                  {importSummary && (
                    <div className="mt-1 text-[10px] text-slate-600">
                      Barreras mapeadas al canvas: {importSummary.mappedBarriers}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
