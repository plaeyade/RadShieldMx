// =============================================================================
// DXFViewerDialog — Importar y visualizar archivos DXF con capas
// Soporta: LINE, CIRCLE, ARC, LWPOLYLINE, TEXT/MTEXT
// Capas interactivas (mostrar/ocultar), zoom, pan
// =============================================================================
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Upload, Layers, Eye, EyeOff, ZoomIn, ZoomOut, FileUp, Info, X, SendToBack, Search, CheckSquare, Square, Save, FolderOpen } from 'lucide-react';
import { parseDXF, renderDXFToCanvas, type DXFParsed, type DXFLayer, isDWGFile, convertDWGNote } from '@/lib/dxfParser';
import { importDXFToFloorPlan, previewDXFImportImpact, type CadBimBridgeResult, type CadBimImportSummary } from '@/lib/medical3D/cadBimBridge';
import { buildF213DxfLayerMappingQa, inferDxfLayerRole, type F213DxfLayerRole } from '@/lib/f213DxfLayerMappingQa';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

const LAYER_COLORS: Record<number, string> = {
  1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-green-500',
  5: 'bg-cyan-500', 6: 'bg-blue-500', 7: 'bg-slate-200', 8: 'bg-purple-500',
  9: 'bg-pink-500', 10: 'bg-teal-500',
};

const LARGE_DXF_BARRIER_WARNING = 1000;
const LIGHT_DXF_BARRIER_LIMIT = 500;
const DXF_LAYER_ROLE_PRESET_KEY = 'radshield_dxf_layer_role_presets_v1';
const DXF_LAYER_ROLE_OPTIONS: Array<{ value: F213DxfLayerRole; label: string }> = [
  { value: 'barrier', label: 'Muro' },
  { value: 'equipment', label: 'Equipo' },
  { value: 'zone', label: 'Zona' },
  { value: 'dimension', label: 'Cota' },
  { value: 'reference', label: 'Ref' },
  { value: 'text', label: 'Texto' },
  { value: 'unmapped', label: 'Ignorar' },
];

interface DxfLayerRolePreset {
  fileName: string;
  roles: Record<string, F213DxfLayerRole>;
  updatedAt: string;
}

function readDxfLayerRolePresets(): Record<string, DxfLayerRolePreset> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(DXF_LAYER_ROLE_PRESET_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeDxfLayerRolePreset(fileName: string, roles: Record<string, F213DxfLayerRole>) {
  if (typeof window === 'undefined') return;
  const presets = readDxfLayerRolePresets();
  presets[fileName] = {
    fileName,
    roles,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(DXF_LAYER_ROLE_PRESET_KEY, JSON.stringify(presets));
}

function loadDxfLayerRolePreset(fileName: string) {
  return readDxfLayerRolePresets()[fileName] || null;
}

export default function DXFViewerDialog({ open, onOpenChange }: Props) {
  const [parsed, setParsed] = useState<DXFParsed | null>(null);
  const [fileName, setFileName] = useState('');
  const [dwgNotice, setDwgNotice] = useState<{ fileName: string; sizeBytes: number; signatureValid: boolean } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [lineWidth, setLineWidth] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [importSummary, setImportSummary] = useState<CadBimImportSummary | null>(null);
  const [lastBridge, setLastBridge] = useState<CadBimBridgeResult | null>(null);
  const [lastContent, setLastContent] = useState('');
  const [layerSearch, setLayerSearch] = useState('');
  const [simplifyGeometry, setSimplifyGeometry] = useState(true);
  const [importMode, setImportMode] = useState<'light' | 'full'>('light');
  const [layerRoleOverrides, setLayerRoleOverrides] = useState<Record<string, F213DxfLayerRole>>({});
  const [hasSavedLayerRolePreset, setHasSavedLayerRolePreset] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const f213LayerMapping = buildF213DxfLayerMappingQa(parsed, layerRoleOverrides);
  const roleForLayer = (layerName: string) => layerRoleOverrides[layerName] || inferDxfLayerRole(layerName);
  const normalizedLayerSearch = layerSearch.trim().toLowerCase();
  const dxfLayers = parsed ? Array.from(parsed.layers.values()) : [];
  const visibleBarrierLayers = dxfLayers.filter((layer) => layer.visible && roleForLayer(layer.name) === 'barrier');
  const barrierLayers = dxfLayers.filter((layer) => roleForLayer(layer.name) === 'barrier');
  const filteredLayers = dxfLayers.filter((layer) => {
    if (!normalizedLayerSearch) return true;
    return layer.name.toLowerCase().includes(normalizedLayerSearch) || roleForLayer(layer.name).includes(normalizedLayerSearch);
  });
  const visibleBarrierLineLikeCount = visibleBarrierLayers.reduce(
    (count, layer) => count + layer.entities.filter((entity) => entity.type === 'LINE' || entity.type === 'LWPOLYLINE').length,
    0,
  );
  const importImpact = useMemo(() => {
    if (!parsed) return null;
    const visibleBarrierLayerNames = Array.from(parsed.layers.values())
      .filter((layer) => layer.visible && roleForLayer(layer.name) === 'barrier')
      .map((layer) => layer.name);
    const allBarrierLayerNames = Array.from(parsed.layers.values())
      .filter((layer) => roleForLayer(layer.name) === 'barrier')
      .map((layer) => layer.name);
    return previewDXFImportImpact(parsed, {
      barrierLayerNames: visibleBarrierLayerNames.length === allBarrierLayerNames.length ? undefined : visibleBarrierLayerNames,
      simplifyGeometry,
      layerRoleOverrides,
      maxBarrierSegments: importMode === 'light' ? LIGHT_DXF_BARRIER_LIMIT : undefined,
    });
  }, [parsed, simplifyGeometry, layerRoleOverrides, importMode]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // v14.5: DWG detection with conversion panel
    if (file.name.toLowerCase().endsWith('.dwg')) {
      const signatureValid = isDWGFile(await file.arrayBuffer());
      setParsed(null);
      setImportSummary(null);
      setLastBridge(null);
      setLastContent('');
      setLayerRoleOverrides({});
      setHasSavedLayerRolePreset(false);
      setFileName(file.name);
      setDwgNotice({ fileName: file.name, sizeBytes: file.size, signatureValid });
      toast.error('DWG detectado: convierta a DXF/SVG/IFC antes de aplicar al canvas.');
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
        setLastBridge(bridge);
        setLastContent(content);
        const savedPreset = loadDxfLayerRolePreset(file.name);
        setLayerRoleOverrides(savedPreset?.roles || {});
        setHasSavedLayerRolePreset(Boolean(savedPreset));
        setFileName(file.name);
        setDwgNotice(null);
        setZoom(1);
        toast.success(`DXF cargado: ${result.entities.length} entidades, ${bridge.summary.mappedBarriers} barreras detectadas`);
        if (savedPreset) toast.info(`Preset de capas recuperado para ${file.name}`);
      } catch (err: any) {
        setLastBridge(null);
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

  const setLayerVisibility = useCallback((shouldShow: (layer: DXFLayer) => boolean) => {
    setParsed(prev => {
      if (!prev) return prev;
      const newLayers = new Map(prev.layers);
      for (const layer of newLayers.values()) {
        newLayers.set(layer.name, { ...layer, visible: shouldShow(layer) });
      }
      return { ...prev, layers: newLayers };
    });
  }, []);

  const showOnlyBarrierLayers = () => setLayerVisibility(layer => roleForLayer(layer.name) === 'barrier');
  const showAllLayers = () => setLayerVisibility(() => true);
  const hideAllLayers = () => setLayerVisibility(() => false);

  const saveLayerRolePreset = () => {
    if (!fileName || dxfLayers.length === 0) {
      toast.error('Cargue primero un DXF para guardar roles.');
      return;
    }
    const roles = Object.fromEntries(dxfLayers.map((layer) => [layer.name, roleForLayer(layer.name)])) as Record<string, F213DxfLayerRole>;
    writeDxfLayerRolePreset(fileName, roles);
    setHasSavedLayerRolePreset(true);
    toast.success(`Preset de capas guardado para ${fileName}`);
  };

  const loadLayerRolePreset = () => {
    if (!fileName) return;
    const preset = loadDxfLayerRolePreset(fileName);
    if (!preset) {
      toast.error('No hay preset guardado para este DXF.');
      return;
    }
    setLayerRoleOverrides(preset.roles);
    setHasSavedLayerRolePreset(true);
    toast.success(`Preset de capas cargado: ${Object.keys(preset.roles).length} capas`);
  };

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
    if (!lastContent || !fileName || !lastBridge || !parsed) {
      toast.error('Importe primero un archivo DXF');
      return;
    }
    try {
      const visibleBarrierLayerNames = Array.from(parsed.layers.values())
        .filter((layer) => layer.visible && roleForLayer(layer.name) === 'barrier')
        .map((layer) => layer.name);
      const allBarrierLayerNames = Array.from(parsed.layers.values())
        .filter((layer) => roleForLayer(layer.name) === 'barrier')
        .map((layer) => layer.name);
      const bridge =
        importDXFToFloorPlan(lastContent, fileName, {
          barrierLayerNames: visibleBarrierLayerNames.length === allBarrierLayerNames.length ? undefined : visibleBarrierLayerNames,
          simplifyGeometry,
          layerRoleOverrides,
          maxBarrierSegments: importMode === 'light' ? LIGHT_DXF_BARRIER_LIMIT : undefined,
        });
      if (
        bridge.summary.mappedBarriers > LARGE_DXF_BARRIER_WARNING &&
        !window.confirm(`El DXF contiene ${bridge.summary.mappedBarriers} segmentos de barrera. Aplicarlo puede crear un floorplan pesado. Desea continuar?`)
      ) {
        toast.info('Aplicacion del DXF cancelada para revisar capas primero.');
        return;
      }
      window.dispatchEvent(new CustomEvent('radshield:dxf-imported-floorplan', { detail: bridge }));
      toast.success(`Plano DXF aplicado al canvas: ${bridge.summary.mappedBarriers} barreras (${importMode === 'light' ? 'modo ligero' : 'modo completo'})`);
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
                data-testid="dxf-file-input"
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs" title="Importar archivo DXF exportado desde AutoCAD/Revit/ODA para revisar capas y aplicar barreras al canvas">
                <Upload className="w-3 h-3 mr-1" /> Importar DXF
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={applyToCanvas}
                disabled={!parsed}
                data-testid="dxf-apply-to-canvas"
                className="text-xs bg-orange-600 hover:bg-orange-700"
                title="Aplicar LINE/LWPOLYLINE clasificadas como barreras al floorplan principal; equipos, zonas y cotas quedan como referencia de QA"
              >
                <SendToBack className="w-3 h-3 mr-1" /> Aplicar al canvas
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} title="Cerrar visor DXF sin aplicar cambios al canvas">
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
              <Button variant="ghost" size="sm" onClick={zoomIn} className="text-slate-300 hover:text-white h-7 text-xs" title="Acercar vista previa DXF sin modificar escala del floorplan">
                <ZoomIn className="w-3 h-3 mr-1" /> Acercar
              </Button>
              <Button variant="ghost" size="sm" onClick={zoomOut} className="text-slate-300 hover:text-white h-7 text-xs" title="Alejar vista previa DXF sin modificar escala del floorplan">
                <ZoomOut className="w-3 h-3 mr-1" /> Alejar
              </Button>
              <div className="h-4 w-px bg-slate-600 mx-1" />
              <div className="flex items-center gap-1">
                <Label className="text-xs text-slate-400">Grosor:</Label>
                <input type="range" min="0.5" max="3" step="0.5" value={lineWidth}
                  onChange={e => setLineWidth(parseFloat(e.target.value))}
                  className="w-16 h-1"
                  title="Cambiar grosor visual de lineas en el preview; no altera el archivo DXF ni el canvas" />
              </div>
              <div className="h-4 w-px bg-slate-600 mx-1" />
              <div className="flex items-center gap-2">
                <Switch id="labels" checked={showLabels} onCheckedChange={setShowLabels} title="Mostrar u ocultar etiquetas de capas en el preview DXF" />
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
                  <p className="text-sm font-medium">{dwgNotice ? 'DWG detectado, conversion requerida' : 'Importe un archivo DXF para visualizar'}</p>
                  <p className="text-xs mt-2 opacity-60">Arrastre el archivo o use el botón Importar</p>
                  {dwgNotice && (
                    <div
                      data-testid="dwg-conversion-notice"
                      className="mt-4 w-full max-w-lg rounded border border-amber-400 bg-amber-50 p-3 text-left text-xs text-amber-900"
                      title={convertDWGNote()}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold truncate">{dwgNotice.fileName}</span>
                        <Badge data-testid="dwg-signature-status" variant="outline" className="h-5 bg-white text-[10px]">
                          Firma {dwgNotice.signatureValid ? 'DWG valida' : 'no confirmada'}
                        </Badge>
                      </div>
                      <div className="mt-1 text-[11px]">
                        Tamano: {(dwgNotice.sizeBytes / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <div data-testid="dwg-conversion-route" className="mt-2 leading-relaxed">
                        Ruta segura: DWG -&gt; APS/ODA/AutoCAD -&gt; DXF con capas -&gt; mapeo de barreras -&gt; aplicar al canvas.
                      </div>
                      <div className="mt-2 text-[11px] text-amber-800">
                        RadShield-MX no escribe geometria desde DWG binario directo; conserva estabilidad, escala y trazabilidad.
                      </div>
                      <div className="mt-1 text-[11px] text-amber-800">
                        Conversion local: configure DWG_CONVERTER_COMMAND y ejecute npm run prepare:dwg-local-conversion.
                      </div>
                    </div>
                  )}
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
                <div className="mt-2 rounded-md border bg-white px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <Search className="h-3 w-3 text-slate-400" />
                    <input
                      value={layerSearch}
                      onChange={(event) => setLayerSearch(event.target.value)}
                      placeholder="Buscar capa o rol..."
                      className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-slate-400"
                      title="Filtrar capas por nombre o rol: barrier, equipment, zone, dimension, reference, text"
                    />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  <Button type="button" variant="outline" size="sm" className="h-6 px-1 text-[9px]" onClick={showOnlyBarrierLayers} title="Mostrar solo capas clasificadas como muro/barrera para preparar el import al canvas">
                    Muros
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-6 px-1 text-[9px]" onClick={showAllLayers} title="Mostrar todas las capas del DXF en el preview">
                    Todo
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-6 px-1 text-[9px]" onClick={hideAllLayers} title="Ocultar todas las capas; util para activar manualmente solo las que se importaran">
                    Nada
                  </Button>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-1 text-[9px]"
                    onClick={saveLayerRolePreset}
                    disabled={!parsed}
                    title="Guardar el mapeo actual de roles de capa para este nombre de archivo DXF"
                  >
                    <Save className="mr-1 h-3 w-3" /> Guardar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-1 text-[9px]"
                    onClick={loadLayerRolePreset}
                    disabled={!parsed || !hasSavedLayerRolePreset}
                    title="Cargar el mapeo de capas previamente guardado para este DXF"
                  >
                    <FolderOpen className="mr-1 h-3 w-3" /> Cargar
                  </Button>
                </div>
                {Object.keys(layerRoleOverrides).length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-6 w-full px-1 text-[9px] text-slate-500"
                    onClick={() => setLayerRoleOverrides({})}
                    title="Borrar roles manuales y volver a la inferencia automatica por nombre de capa"
                  >
                    Restablecer roles manuales ({Object.keys(layerRoleOverrides).length})
                  </Button>
                )}
                <div className="mt-2 rounded bg-white px-2 py-1 text-[10px] text-slate-600" data-testid="dxf-visible-barrier-layer-summary">
                  Importables: {visibleBarrierLayers.length}/{barrierLayers.length} capas de muro visibles
                  <span className="mt-0.5 block text-[9px] text-slate-500">
                    Entidades lineales aprox.: {visibleBarrierLineLikeCount}
                  </span>
                </div>
                <div className="mt-2 rounded border border-slate-200 bg-white px-2 py-2">
                  <Label className="mb-1 block text-[10px] font-semibold text-slate-600">
                    Modo de importacion
                  </Label>
                  <Select value={importMode} onValueChange={(value) => setImportMode(value as 'light' | 'full')}>
                    <SelectTrigger
                      size="sm"
                      className="h-7 text-[10px]"
                      data-testid="dxf-import-mode-select"
                      title="Modo ligero limita barreras para no saturar el canvas; completo aplica todo lo visible"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light" className="text-xs">Ligera - max {LIGHT_DXF_BARRIER_LIMIT} barreras</SelectItem>
                      <SelectItem value="full" className="text-xs">Completa - todo lo visible</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-1 text-[9px] leading-snug text-slate-500">
                    Use Ligera para primera prueba del plano; cambie a Completa cuando las capas y roles ya esten revisados.
                  </div>
                </div>
                <div className="mt-2 flex items-start gap-2 rounded border border-blue-100 bg-blue-50 px-2 py-2">
                  <Switch
                    id="dxf-simplify-geometry"
                    checked={simplifyGeometry}
                    onCheckedChange={setSimplifyGeometry}
                    data-testid="dxf-simplify-geometry"
                  />
                  <Label htmlFor="dxf-simplify-geometry" className="text-[10px] leading-snug text-blue-900">
                    Limpiar geometria al aplicar
                    <span className="block text-[9px] font-normal text-blue-700">
                      Consolida segmentos duplicados o colineales de la misma capa antes de crear barreras.
                    </span>
                  </Label>
                </div>
                {importImpact && (
                  <div
                    data-testid="dxf-import-impact-preview"
                    className="mt-2 rounded border border-emerald-100 bg-emerald-50 px-2 py-2 text-[10px] text-emerald-950"
                    title="Vista previa conservadora del impacto antes de escribir barreras al canvas"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-semibold">Impacto al aplicar</span>
                      <Badge variant="outline" className="h-4 bg-white text-[9px]">
                        {importImpact.estimatedBarriers} barreras
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      <span className="text-emerald-700">Segmentos crudos</span>
                      <span className="text-right font-medium">{importImpact.rawBarrierSegments}</span>
                      <span className="text-emerald-700">Tras limpieza</span>
                      <span className="text-right font-medium">{importImpact.simplifiedBarrierSegments}</span>
                      <span className="text-emerald-700">Consolidados</span>
                      <span className="text-right font-medium">{importImpact.removedByCleanup}</span>
                      <span className="text-emerald-700">Fuera por limite</span>
                      <span className="text-right font-medium">{importImpact.cappedByLimit}</span>
                      <span className="text-emerald-700">Capas usadas</span>
                      <span className="text-right font-medium">{importImpact.selectedBarrierLayers}/{importImpact.barrierLayers}</span>
                    </div>
                    {importImpact.importLimit !== null && (
                      <div className="mt-1 border-t border-emerald-200 pt-1 text-[9px] text-emerald-800">
                        Modo ligero activo: maximo {importImpact.importLimit} barreras para proteger rendimiento del canvas.
                      </div>
                    )}
                    {(importImpact.skippedNonBarrierSegments > 0 || importImpact.ignoredDegenerateSegments > 0) && (
                      <div className="mt-1 border-t border-emerald-200 pt-1 text-[9px] text-emerald-800">
                        Referencia omitida: {importImpact.skippedNonBarrierSegments}. Degenerados: {importImpact.ignoredDegenerateSegments}.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {filteredLayers.map(layer => (
                    <div
                      key={layer.name}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-colors ${layer.visible ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'}`}
                      onClick={() => toggleLayer(layer.name)}
                      title={`Capa ${layer.name}. Rol ${roleForLayer(layer.name)}. Click para ${layer.visible ? 'ocultar' : 'mostrar'} en preview/import.`}
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
                      <Select
                        value={roleForLayer(layer.name)}
                        onValueChange={(value) => {
                          const nextRole = value as F213DxfLayerRole;
                          setLayerRoleOverrides((prev) => ({
                            ...prev,
                            [layer.name]: nextRole,
                          }));
                        }}
                      >
                        <SelectTrigger
                          size="sm"
                          className="h-6 w-[72px] px-1 text-[9px]"
                          onClick={(event) => event.stopPropagation()}
                          title="Remapear rol de capa antes de aplicar al canvas"
                          data-testid="dxf-layer-role-select"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent onClick={(event) => event.stopPropagation()}>
                          {DXF_LAYER_ROLE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-xs">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Badge variant="outline" className="text-[9px] h-3.5 px-0.5 min-w-[18px] justify-center">{layer.entities.length}</Badge>
                    </div>
                  ))}
                  {filteredLayers.length === 0 && (
                    <div className="rounded bg-slate-50 px-2 py-3 text-center text-[10px] text-slate-500">
                      Sin capas para ese filtro.
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div
                data-testid="f213-dxf-layer-mapping-qa"
                className="border-t bg-slate-50 p-2"
                title={f213LayerMapping.warnings.join(' | ') || f213LayerMapping.decision}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    F213 Mapeo DXF
                  </div>
                  <Badge variant="outline" className="h-4 text-[9px]">
                    {f213LayerMapping.status === 'dxf-layer-mapping-ready' ? 'listo' : 'revision'}
                  </Badge>
                </div>
                <div className="mb-1 flex flex-wrap gap-1">
                  <Badge data-testid="f213-dxf-barrier-layer-count" variant="outline" className="h-4 text-[9px]">Muros {f213LayerMapping.mappedBarrierLayers}</Badge>
                  <Badge data-testid="f213-dxf-equipment-layer-count" variant="outline" className="h-4 text-[9px]">Eq {f213LayerMapping.equipmentLayers}</Badge>
                  <Badge data-testid="f213-dxf-zone-layer-count" variant="outline" className="h-4 text-[9px]">Zonas {f213LayerMapping.zoneLayers}</Badge>
                  <Badge data-testid="f213-dxf-unmapped-layer-count" variant="outline" className="h-4 text-[9px]">Rev {f213LayerMapping.unmappedLayers}</Badge>
                </div>
                <div className="mb-1 flex gap-1">
                  <Badge variant="outline" className="h-4 text-[9px]">
                    <CheckSquare className="mr-1 h-2.5 w-2.5" /> Visibles {visibleBarrierLayers.length}
                  </Badge>
                  <Badge variant="outline" className="h-4 text-[9px]">
                    <Square className="mr-1 h-2.5 w-2.5" /> Total {barrierLayers.length}
                  </Badge>
                </div>
                <div className="mb-1 rounded bg-white px-1.5 py-1 text-[9px] leading-snug text-slate-600">
                  Oculte capas con el icono de ojo o remapee el rol. Solo LINE/LWPOLYLINE en capas visibles marcadas como Muro se convierten en barreras.
                </div>
                <div className="max-h-24 overflow-auto space-y-0.5">
                  {f213LayerMapping.rows.slice(0, 8).map((row) => (
                    <div
                      key={row.name}
                      data-testid="f213-dxf-layer-row"
                      className="flex items-center gap-1 rounded bg-white px-1.5 py-1 text-[9px] text-slate-600"
                      title={`${row.name}: ${row.canvasUse}${row.warning ? ` ${row.warning}` : ''}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        row.role === 'barrier' ? 'bg-emerald-500' :
                          row.role === 'equipment' ? 'bg-red-500' :
                            row.role === 'zone' ? 'bg-sky-500' :
                              row.role === 'dimension' ? 'bg-violet-500' :
                                row.role === 'reference' ? 'bg-slate-400' :
                                  row.role === 'text' ? 'bg-amber-500' : 'bg-slate-300'
                      }`} />
                      <span className="truncate flex-1">{row.name}</span>
                      <span className="shrink-0 uppercase text-[8px] text-slate-400">{row.role}</span>
                    </div>
                  ))}
                </div>
              </div>

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
