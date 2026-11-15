// =============================================================================
// DXFViewerDialog — Importar y visualizar archivos DXF/DWG con el asistente de capas
// Soporta: LINE, CIRCLE, ARC, LWPOLYLINE, POLYLINE, TEXT/MTEXT e INSERT/bloques (explotados). DWG: conversión
// local a DXF con LibreDWG-wasm (carga diferida, `@/lib/dwgImport`).
// Fase 12, paso 4: asistente de capas (rol, material y espesor por capa con las reglas de cadBimBridge, «ignorar
// capa», mapeo guardado en el almacén del proyecto) y vista previa con zoom a extensión, zoom con rueda centrado
// en el cursor, arrastre y límites de zoom.
// =============================================================================
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Layers, Eye, EyeOff, ZoomIn, ZoomOut, FileUp, Info, X, SendToBack, Search, CheckSquare, Square, Save, Maximize, RotateCcw } from 'lucide-react';
import { parseDXF, renderDXFToCanvas, type DXFParsed, type DXFLayer, isDWGFile, convertDWGNote } from '@/lib/dxfParser';
import { importParsedDXFToFloorPlan, previewDXFImportImpact, type CadBimBridgeResult, type CadBimImportSummary } from '@/lib/medical3D/cadBimBridge';
import { convertirDWGaDXF } from '@/lib/dwgImport';
import { buildF213DxfLayerMappingQa } from '@/lib/f213DxfLayerMappingQa';
import {
  descripcionRegla, editarFila, leerEspesor, mapeoDesdeFilas, MATERIALES_CAPA, opcionesImportacion, proponerCapas,
  restablecerFila, resumenCapas, rolEfectivo, ROLES_CAPA, type DecisionCapa, type FilaCapa,
} from '@/lib/asistenteCapas';
import { factorRueda, zoomEnPunto, type LimitesZoom, type Vista } from '@/lib/vistaLienzo';
import { useProyectoStore } from '@/stores/proyecto';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }
type DxfImportMode = 'light' | 'full';

const LAYER_COLORS: Record<number, string> = {
  1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-green-500',
  5: 'bg-cyan-500', 6: 'bg-blue-500', 7: 'bg-slate-200', 8: 'bg-purple-500',
  9: 'bg-pink-500', 10: 'bg-teal-500',
};

const LARGE_DXF_BARRIER_WARNING = 1000;
const LIGHT_DXF_BARRIER_LIMIT = 500;
/** Miniaturas por capa: sólo las primeras N filas (planos con cientos de capas). */
const MAX_MINIATURAS = 80;
/** Zoom de la vista previa sobre el encuadre a extensión (½ … ×400). */
const LIMITES_ZOOM_VISTA_PREVIA: LimitesZoom = { min: 0.5, max: 400 };
const VISTA_EXTENSION: Vista = { scale: 1, offsetX: 0, offsetY: 0 };

const ETIQUETA_ORIGEN: Record<FilaCapa['origen'], { texto: string; clase: string }> = {
  regla: { texto: 'Regla', clase: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  omision: { texto: 'Revisar', clase: 'border-amber-300 bg-amber-50 text-amber-800' },
  guardado: { texto: 'Guardado', clase: 'border-sky-200 bg-sky-50 text-sky-800' },
  usuario: { texto: 'Editado', clase: 'border-violet-200 bg-violet-50 text-violet-800' },
};

/** Miniatura de una sola capa sobre la extensión completa del plano (muestra dónde está). */
function MiniaturaCapa({ parsed, capa }: { parsed: DXFParsed; capa: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    renderDXFToCanvas(ctx, parsed, { width: c.width, height: c.height, padding: 3, showLayers: [capa], lineWidth: 1, showLabels: false, incluirOcultas: true, decoracion: false });
  }, [parsed, capa]);
  return <canvas ref={ref} width={64} height={40} data-testid="asistente-capa-miniatura" className="h-10 w-16 shrink-0 rounded border border-slate-300 bg-slate-900" aria-hidden="true" />;
}

export default function DXFViewerDialog({ open, onOpenChange }: Props) {
  const [parsed, setParsed] = useState<DXFParsed | null>(null);
  const [fileName, setFileName] = useState('');
  const [dwgNotice, setDwgNotice] = useState<{ fileName: string; sizeBytes: number; signatureValid: boolean } | null>(null);
  const [vista, setVista] = useState<Vista>(VISTA_EXTENSION);
  const [lineWidth, setLineWidth] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [layerSearch, setLayerSearch] = useState('');
  const [simplifyGeometry, setSimplifyGeometry] = useState(true);
  const [importMode, setImportMode] = useState<DxfImportMode>('light');
  const [filas, setFilas] = useState<FilaCapa[]>([]);
  const [capaResaltada, setCapaResaltada] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const arrastre = useRef<{ x: number; y: number } | null>(null);
  const guardarMapeoCapas = useProyectoStore((s) => s.guardarMapeoCapas);

  const opciones = useMemo(() => opcionesImportacion(filas), [filas]);
  const layerRoleOverrides = opciones.layerRoleOverrides;
  const roleForLayer = useCallback((layerName: string) => layerRoleOverrides[layerName] ?? 'unmapped', [layerRoleOverrides]);
  const f213LayerMapping = buildF213DxfLayerMappingQa(parsed, layerRoleOverrides);
  const resumen = resumenCapas(filas);
  const normalizedLayerSearch = layerSearch.trim().toLowerCase();
  const dxfLayers = parsed ? Array.from(parsed.layers.values()) : [];
  const visibilidad = new Map(dxfLayers.map((l) => [l.name, l.visible]));
  const visibleBarrierLayers = dxfLayers.filter((layer) => layer.visible && roleForLayer(layer.name) === 'barrier');
  const barrierLayers = dxfLayers.filter((layer) => roleForLayer(layer.name) === 'barrier');
  const filasFiltradas = filas.filter((f) => {
    if (!normalizedLayerSearch) return true;
    return f.nombre.toLowerCase().includes(normalizedLayerSearch) || rolEfectivo(f).includes(normalizedLayerSearch) || f.material.toLowerCase().includes(normalizedLayerSearch);
  });
  const visibleBarrierLineLikeCount = visibleBarrierLayers.reduce(
    (count, layer) => count + layer.entities.filter((entity) => entity.type === 'LINE' || entity.type === 'LWPOLYLINE').length,
    0,
  );

  const opcionesBridge = useCallback((mode: DxfImportMode) => {
    if (!parsed) return null;
    const visibles = Array.from(parsed.layers.values()).filter((l) => l.visible && roleForLayer(l.name) === 'barrier').map((l) => l.name);
    const todas = Array.from(parsed.layers.values()).filter((l) => roleForLayer(l.name) === 'barrier').map((l) => l.name);
    return {
      barrierLayerNames: visibles.length === todas.length ? undefined : visibles,
      simplifyGeometry,
      ...opciones,
      maxBarrierSegments: mode === 'light' ? LIGHT_DXF_BARRIER_LIMIT : undefined,
      prioritizeRepresentativeSegments: mode === 'light',
    };
  }, [parsed, roleForLayer, simplifyGeometry, opciones]);

  const importImpact = useMemo(() => {
    const o = opcionesBridge(importMode);
    return parsed && o ? previewDXFImportImpact(parsed, o) : null;
  }, [parsed, opcionesBridge, importMode]);

  // Resumen «Barreras mapeadas» con las decisiones actuales del asistente (todas las capas de muro, sin limpieza ni límite).
  const lastBridge = useMemo<CadBimBridgeResult | null>(() => {
    const o = opcionesBridge('full');
    if (!parsed || !fileName || !o) return null;
    return importParsedDXFToFloorPlan(parsed, fileName, { ...o, barrierLayerNames: undefined, simplifyGeometry: false, maxBarrierSegments: undefined });
  }, [parsed, fileName, opcionesBridge]);
  const importSummary: CadBimImportSummary | null = lastBridge?.summary ?? null;

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const cargarContenidoDXF = (content: string, nombre: string, origen?: string) => {
      const result = parseDXF(content);
      const previos = useProyectoStore.getState().mapeosParaProponer();
      const propuestas = proponerCapas(result, previos);
      setParsed(result);
      setFilas(propuestas);
      setFileName(nombre);
      setDwgNotice(null);
      setVista(VISTA_EXTENSION); // zoom a extensión al importar
      setCapaResaltada(null);
      const bloques = result.stats?.inserts ? `, ${result.stats.inserts} INSERT explotados` : '';
      toast.success(`${origen ?? 'DXF'} cargado: ${result.entities.length} entidades en ${result.layers.size} capas${bloques}`);
      const guardadas = propuestas.filter((f) => f.origen === 'guardado').length;
      if (guardadas > 0) toast.info(`Mapeo de capas reutilizado en ${guardadas} capa(s) con el mismo nombre`);
    };

    // DWG: conversión local a DXF con LibreDWG-wasm (sin servidor). Si falla, se muestra el aviso de conversión.
    if (file.name.toLowerCase().endsWith('.dwg')) {
      const buffer = await file.arrayBuffer();
      const signatureValid = isDWGFile(buffer);
      setParsed(null);
      setFilas([]);
      setFileName(file.name);
      if (!signatureValid) {
        setDwgNotice({ fileName: file.name, sizeBytes: file.size, signatureValid });
        toast.error('El archivo no tiene firma DWG válida.');
        return;
      }
      const aviso = toast.loading('Convirtiendo DWG a DXF en el navegador (LibreDWG)…');
      try {
        const conv = await convertirDWGaDXF(buffer);
        toast.dismiss(aviso);
        cargarContenidoDXF(conv.dxf, file.name, `DWG convertido en ${(conv.ms / 1000).toFixed(1)} s`);
      } catch (err: unknown) {
        toast.dismiss(aviso);
        setDwgNotice({ fileName: file.name, sizeBytes: file.size, signatureValid });
        toast.error(`No se pudo convertir el DWG: ${err instanceof Error ? err.message : String(err)}`);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        cargarContenidoDXF(content, file.name);
      } catch (err: unknown) {
        setParsed(null);
        toast.error('Error al parsear DXF: ' + (err instanceof Error ? err.message : String(err)));
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
      if (layer) newLayers.set(layerName, { ...layer, visible: !layer.visible });
      return { ...prev, layers: newLayers };
    });
  }, []);

  const setLayerVisibility = useCallback((shouldShow: (layer: DXFLayer) => boolean) => {
    setParsed(prev => {
      if (!prev) return prev;
      const newLayers = new Map(prev.layers);
      for (const layer of newLayers.values()) newLayers.set(layer.name, { ...layer, visible: shouldShow(layer) });
      return { ...prev, layers: newLayers };
    });
  }, []);

  const showOnlyBarrierLayers = () => setLayerVisibility(layer => roleForLayer(layer.name) === 'barrier');
  const showAllLayers = () => setLayerVisibility(() => true);
  const hideAllLayers = () => setLayerVisibility(() => false);

  const editar = (nombre: string, cambio: Partial<DecisionCapa>) => setFilas((prev) => editarFila(prev, nombre, cambio));

  const guardarMapeo = (silencioso = false) => {
    if (!fileName || filas.length === 0) {
      toast.error('Cargue primero un DXF o DWG para guardar el mapeo de capas.');
      return null;
    }
    const m = mapeoDesdeFilas(fileName, filas);
    guardarMapeoCapas(m);
    if (!silencioso) toast.success(`Mapeo de ${filas.length} capas guardado en el proyecto (se reutiliza por nombre de capa)`);
    return m;
  };

  const restablecerTodo = () => {
    setFilas((prev) => prev.reduce((acc, f) => restablecerFila(acc, f.nombre), prev));
    toast.info('Propuestas por reglas restablecidas');
  };

  // ── Vista previa: tamaño, dibujo, zoom y arrastre ──
  const [tamano, setTamano] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = contenedorRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setTamano({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [parsed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!parsed || !canvas || !ctx) return;
    const parent = canvas.parentElement;
    const w = Math.max(tamano.w || parent?.clientWidth || 0, 50);
    const h = Math.max(tamano.h || parent?.clientHeight || 0, 50);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    renderDXFToCanvas(ctx, parsed, {
      width: w, height: h, lineWidth, showLabels,
      vista: { zoom: vista.scale, dx: vista.offsetX, dy: vista.offsetY },
      resaltarCapa: capaResaltada,
    });
  }, [parsed, vista, lineWidth, showLabels, capaResaltada, tamano]);

  const zoomCentro = (factor: number) => {
    const c = canvasRef.current;
    setVista((v) => zoomEnPunto(v, (c?.width ?? 0) / 2, (c?.height ?? 0) / 2, factor, LIMITES_ZOOM_VISTA_PREVIA));
  };
  const zoomExtension = () => setVista(VISTA_EXTENSION);

  // Rueda: oyente nativo no pasivo (React registra «wheel» como pasivo y no puede impedir el desplazamiento).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rueda = (e: WheelEvent) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const f = factorRueda(e.deltaY, e.deltaMode);
      setVista((v) => zoomEnPunto(v, e.clientX - r.left, e.clientY - r.top, f, LIMITES_ZOOM_VISTA_PREVIA));
    };
    canvas.addEventListener('wheel', rueda, { passive: false });
    return () => canvas.removeEventListener('wheel', rueda);
  }, [parsed]);

  const buildBridgeForCanvas = (mode: DxfImportMode) => {
    const o = opcionesBridge(mode);
    if (!fileName || !lastBridge || !parsed || !o) throw new Error('Importe primero un archivo DXF');
    return importParsedDXFToFloorPlan(parsed, fileName, o);
  };

  const dispatchBridgeToCanvas = (bridge: CadBimBridgeResult, mode: DxfImportMode, preliminary = false) => {
    const mapeoCapas = guardarMapeo(true);
    window.dispatchEvent(new CustomEvent('radshield:dxf-imported-floorplan', {
      detail: { ...bridge, importMode: mode, preliminary, mapeoCapas },
    }));
    const label = mode === 'light' ? 'modo ligero' : 'modo completo';
    toast.success(`${preliminary ? 'Vista preliminar DXF aplicada' : 'Plano DXF aplicado'} al canvas: ${bridge.summary.mappedBarriers} barreras (${label})`);
    onOpenChange(false);
  };

  const applyLightPreviewToCanvas = () => {
    try {
      dispatchBridgeToCanvas(buildBridgeForCanvas('light'), 'light', true);
    } catch (err: unknown) {
      toast.error('No se pudo aplicar la vista ligera: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const applyToCanvas = () => {
    try {
      const bridge = buildBridgeForCanvas(importMode);
      if (
        bridge.summary.mappedBarriers > LARGE_DXF_BARRIER_WARNING &&
        !window.confirm(`El DXF contiene ${bridge.summary.mappedBarriers} segmentos de barrera. Aplicarlo puede crear un floorplan pesado. Desea continuar?`)
      ) {
        toast.info('Aplicacion del DXF cancelada para revisar capas primero.');
        return;
      }
      dispatchBridgeToCanvas(bridge, importMode);
    } catch (err: unknown) {
      toast.error('No se pudo aplicar el DXF al canvas: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const materialesDe = (f: FilaCapa) => (MATERIALES_CAPA.some((m) => m.value === f.material) ? MATERIALES_CAPA : [...MATERIALES_CAPA, { value: f.material, label: f.material }]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex flex-col w-[96vw] max-w-[1680px] h-[92vh] max-h-[92vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-4 py-2.5 border-b bg-slate-50 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="w-9 h-9 shrink-0 rounded-lg bg-blue-600 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold truncate">Visor DXF — Importar plano de blindaje</DialogTitle>
                <DialogDescription className="text-xs text-slate-500 truncate">
                  DXF R12–R2018 con bloques/INSERT · DWG convertido en el navegador (LibreDWG) · asistente de capas con material y espesor
                </DialogDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <input ref={fileInputRef} type="file" accept=".dxf,.dwg" onChange={handleFileUpload} className="hidden" data-testid="dxf-file-input" />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs" title="Importar un DXF (o un DWG, que se convierte en el navegador) para revisar capas y aplicar barreras al canvas">
                <Upload className="w-3 h-3 mr-1" /> Importar DXF/DWG
              </Button>
              <Button
                variant="outline" size="sm" onClick={applyLightPreviewToCanvas} disabled={!parsed} data-testid="dxf-apply-light-preview"
                className="text-xs border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                title={`Aplicar rapidamente una vista preliminar de maximo ${LIGHT_DXF_BARRIER_LIMIT} barreras priorizadas para revisar el plano en el canvas`}
              >
                <SendToBack className="w-3 h-3 mr-1" /> Probar ligera
              </Button>
              <Button
                variant="default" size="sm" onClick={applyToCanvas} disabled={!parsed} data-testid="dxf-apply-to-canvas"
                className="text-xs bg-orange-600 hover:bg-orange-700"
                title="Aplicar con el mapeo de capas confirmado: LINE/LWPOLYLINE de capas Muro se convierten en barreras con su material y espesor"
              >
                <SendToBack className="w-3 h-3 mr-1" /> Aplicar al canvas
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} aria-label="Cerrar visor DXF" title="Cerrar visor DXF sin aplicar cambios al canvas">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* LEFT: vista previa */}
          <div className="flex min-w-0 flex-1 flex-col bg-slate-900 overflow-hidden">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 border-b border-slate-700 bg-slate-800 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => zoomCentro(1.25)} disabled={!parsed} data-testid="dxf-zoom-acercar" className="text-slate-300 hover:text-white h-7 px-2 text-xs" title="Acercar la vista previa (también con la rueda, centrado en el cursor)">
                <ZoomIn className="w-3 h-3 mr-1" /> Acercar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => zoomCentro(0.8)} disabled={!parsed} data-testid="dxf-zoom-alejar" className="text-slate-300 hover:text-white h-7 px-2 text-xs" title="Alejar la vista previa">
                <ZoomOut className="w-3 h-3 mr-1" /> Alejar
              </Button>
              <Button variant="ghost" size="sm" onClick={zoomExtension} disabled={!parsed} data-testid="dxf-zoom-extension" className="text-slate-300 hover:text-white h-7 px-2 text-xs" title="Zoom a extensión: todo el plano en la vista (doble clic en la vista)">
                <Maximize className="w-3 h-3 mr-1" /> Extensión
              </Button>
              <span data-testid="dxf-zoom-valor" className="font-mono text-[10px] text-slate-400">×{vista.scale.toFixed(2)}</span>
              <div className="h-4 w-px bg-slate-600" />
              <div className="flex items-center gap-1">
                <Label className="text-xs text-slate-400">Grosor</Label>
                <input type="range" min="0.5" max="3" step="0.5" value={lineWidth} onChange={e => setLineWidth(parseFloat(e.target.value))} className="w-16 h-1" aria-label="Grosor de línea de la vista previa" title="Cambiar grosor visual de lineas en el preview; no altera el archivo DXF ni el canvas" />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="labels" checked={showLabels} onCheckedChange={setShowLabels} title="Mostrar u ocultar textos del plano en el preview DXF" />
                <Label htmlFor="labels" className="text-xs text-slate-400 cursor-pointer">Textos</Label>
              </div>
              {parsed && (
                <div className="ml-auto flex flex-wrap items-center gap-1 text-xs text-slate-300 [&_[data-slot=badge]]:border-slate-600 [&_[data-slot=badge]]:text-slate-200">
                  <Badge variant="outline" className="text-[10px] h-5">{parsed.entities.length} entidades</Badge>
                  <Badge variant="outline" className="text-[10px] h-5">{parsed.layers.size} capas</Badge>
                  {importSummary && <Badge variant="outline" className="text-[10px] h-5">{importSummary.mappedBarriers} barreras</Badge>}
                  <Badge variant="outline" className="text-[10px] h-5">{parsed.unit}</Badge>
                </div>
              )}
            </div>

            <div ref={contenedorRef} className="relative min-h-0 flex-1 overflow-hidden">
              {parsed ? (
                <canvas
                  ref={canvasRef}
                  data-testid="dxf-vista-previa"
                  data-zoom={vista.scale.toFixed(4)}
                  className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
                  style={{ imageRendering: 'crisp-edges' }}
                  onMouseDown={(e) => { arrastre.current = { x: e.clientX, y: e.clientY }; }}
                  onMouseMove={(e) => {
                    const a = arrastre.current;
                    if (!a) return;
                    const dx = e.clientX - a.x, dy = e.clientY - a.y;
                    arrastre.current = { x: e.clientX, y: e.clientY };
                    setVista((v) => ({ ...v, offsetX: v.offsetX + dx, offsetY: v.offsetY + dy }));
                  }}
                  onMouseUp={() => { arrastre.current = null; }}
                  onMouseLeave={() => { arrastre.current = null; }}
                  onDoubleClick={zoomExtension}
                />
              ) : (
                <div className="m-2 h-[calc(100%-1rem)] overflow-auto flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded p-4">
                  <FileUp className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-sm font-medium">{dwgNotice ? 'DWG detectado, conversion requerida' : 'Importe un archivo DXF o DWG para visualizar'}</p>
                  <p className="text-xs mt-2 opacity-60">Use el botón Importar DXF/DWG</p>
                  {dwgNotice && (
                    <div data-testid="dwg-conversion-notice" className="mt-4 w-full max-w-lg rounded border border-amber-400 bg-amber-50 p-3 text-left text-xs text-amber-900" title={convertDWGNote()}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold truncate">{dwgNotice.fileName}</span>
                        <Badge data-testid="dwg-signature-status" variant="outline" className="h-5 bg-white text-[10px]">
                          Firma {dwgNotice.signatureValid ? 'DWG valida' : 'no confirmada'}
                        </Badge>
                      </div>
                      <div className="mt-1 text-[11px]">Tamano: {(dwgNotice.sizeBytes / 1024 / 1024).toFixed(2)} MB</div>
                      <div data-testid="dwg-conversion-route" className="mt-2 leading-relaxed">
                        La conversión local (LibreDWG en el navegador) no pudo leer este DWG. Ruta alterna: DWG -&gt; APS/ODA/AutoCAD -&gt; DXF con capas -&gt; mapeo de barreras -&gt; aplicar al canvas.
                      </div>
                      <div className="mt-2 text-[11px] text-amber-800">RadShield-MX no escribe geometria desde DWG binario directo; conserva estabilidad, escala y trazabilidad.</div>
                      <div className="mt-1 text-[11px] text-amber-800">Conversion local: configure DWG_CONVERTER_COMMAND y ejecute npm run prepare:dwg-local-conversion.</div>
                    </div>
                  )}
                  <div className="mt-4 flex items-start gap-2 max-w-md text-xs opacity-60 bg-slate-800 p-3 rounded">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>DWG: se convierte en el navegador con LibreDWG (no se envía a ningún servidor). Los XREF deben estar ligados (BIND). DXF R12-R2018 con bloques e INSERT.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: asistente de capas + opciones de importación */}
          {parsed && (
            <div data-testid="dxf-panel-capas" className="w-[min(460px,46%)] min-w-[300px] border-l bg-white flex-shrink-0 overflow-y-auto overflow-x-hidden">
              <section data-testid="asistente-capas" aria-label="Asistente de capas" className="border-b">
                <div className="sticky top-0 z-10 border-b bg-slate-50 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <Layers className="w-3 h-3" /> Asistente de capas
                    </div>
                    <div data-testid="asistente-capas-resumen" className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="h-5 text-[10px]">{resumen.capas} capas</Badge>
                      <Badge variant="outline" className="h-5 text-[10px]">{resumen.muros} muros</Badge>
                      <Badge variant="outline" className="h-5 text-[10px]">{resumen.ignoradas} ignoradas</Badge>
                      {resumen.porRevisar > 0 && <Badge variant="outline" className="h-5 border-amber-300 bg-amber-50 text-[10px] text-amber-800">{resumen.porRevisar} por revisar</Badge>}
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">
                    Propuesta por reglas del nombre de la capa (material y espesor con unidad). Confirme o edite cada capa; «Ignorar» la excluye de la importación.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <div className="flex min-w-[140px] flex-1 items-center gap-1.5 rounded-md border bg-white px-2 py-1">
                      <Search className="h-3 w-3 shrink-0 text-slate-400" />
                      <input
                        value={layerSearch} onChange={(event) => setLayerSearch(event.target.value)} placeholder="Buscar capa, rol o material…"
                        aria-label="Buscar capa" className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={() => guardarMapeo()} data-testid="asistente-capas-guardar" title="Guardar el mapeo (rol, material, espesor, ignorar) en el proyecto; se propone de nuevo en cualquier plano con capas del mismo nombre">
                      <Save className="mr-1 h-3 w-3" /> Guardar mapeo
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-slate-600" onClick={restablecerTodo} data-testid="asistente-capas-restablecer" title="Volver a las propuestas por reglas en todas las capas">
                      <RotateCcw className="mr-1 h-3 w-3" /> Reglas
                    </Button>
                  </div>
                </div>
                <ul className="divide-y" aria-label="Capas del plano">
                  {filasFiltradas.map((f, i) => {
                    const visible = visibilidad.get(f.nombre) ?? true;
                    const esMuro = rolEfectivo(f) === 'barrier';
                    const origen = ETIQUETA_ORIGEN[f.origen];
                    const tipos = Object.entries(f.porTipo).map(([t, n]) => `${t} ${n}`).join(', ');
                    return (
                      <li
                        key={f.nombre}
                        data-testid="asistente-capa-fila"
                        data-capa={f.nombre}
                        data-rol={rolEfectivo(f)}
                        data-material={f.material}
                        data-origen={f.origen}
                        className={`px-3 py-2 ${f.ignorada ? 'bg-slate-50 opacity-70' : 'bg-white'} ${capaResaltada === f.nombre ? 'ring-2 ring-inset ring-sky-300' : ''}`}
                        onMouseEnter={() => setCapaResaltada(f.nombre)}
                        onMouseLeave={() => setCapaResaltada((c) => (c === f.nombre ? null : c))}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <button
                            type="button" onClick={() => toggleLayer(f.nombre)} className="shrink-0 rounded p-0.5 hover:bg-slate-100"
                            aria-label={`${visible ? 'Ocultar' : 'Mostrar'} capa ${f.nombre} en la vista previa`} aria-pressed={visible}
                            title={`${visible ? 'Ocultar' : 'Mostrar'} en la vista previa (una capa de muro oculta no se importa)`}
                          >
                            {visible ? <Eye className="w-3.5 h-3.5 text-slate-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-300" />}
                          </button>
                          {i < MAX_MINIATURAS ? <MiniaturaCapa parsed={parsed} capa={f.nombre} /> : <div className="h-10 w-16 shrink-0 rounded border border-dashed border-slate-200" />}
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${LAYER_COLORS[f.color] || 'bg-slate-400'}`} />
                              <span className={`truncate text-xs font-medium ${f.ignorada ? 'text-slate-400 line-through' : 'text-slate-800'}`} title={f.nombre}>{f.nombre}</span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                              <span data-testid="asistente-capa-conteo" title={tipos}>{f.entidades} ent.{f.lineales ? ` · ${f.lineales} lineales` : ''}</span>
                              <span className={`rounded border px-1 text-[9px] font-semibold ${origen.clase}`} title={f.origen === 'guardado' ? 'Decisión guardada en un mapeo anterior' : f.origen === 'usuario' ? 'Editado en este asistente' : descripcionRegla(f.regla)}>
                                {origen.texto}{f.origen === 'regla' ? `: ${f.regla}` : ''}
                              </span>
                            </div>
                          </div>
                          <label className="flex shrink-0 cursor-pointer items-center gap-1 text-[10px] text-slate-600" title="Ignorar capa: no se importa ni como barrera ni como referencia">
                            <input type="checkbox" checked={f.ignorada} onChange={(e) => editar(f.nombre, { ignorada: e.target.checked })} data-testid="asistente-capa-ignorar" aria-label={`Ignorar capa ${f.nombre}`} />
                            Ignorar
                          </label>
                        </div>
                        <div className="mt-1.5 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,0.8fr)] gap-1.5 pl-6">
                          <select
                            value={f.rol} disabled={f.ignorada} onChange={(e) => editar(f.nombre, { rol: e.target.value as DecisionCapa['rol'] })}
                            data-testid="dxf-layer-role-select" aria-label={`Rol de la capa ${f.nombre}`}
                            className="h-7 min-w-0 rounded border border-slate-200 bg-white px-1 text-[11px] disabled:opacity-50"
                          >
                            {ROLES_CAPA.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                          <select
                            value={f.material} disabled={!esMuro} onChange={(e) => editar(f.nombre, { material: e.target.value })}
                            data-testid="asistente-capa-material" aria-label={`Material de la capa ${f.nombre}`}
                            className="h-7 min-w-0 rounded border border-slate-200 bg-white px-1 text-[11px] disabled:opacity-50"
                          >
                            {materialesDe(f).map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                          </select>
                          <div className="flex min-w-0 items-center gap-1">
                            <input
                              key={`${f.nombre}-${f.espesor_mm ?? ''}-${f.origen}`}
                              type="number" min={0} step="0.1" inputMode="decimal" disabled={!esMuro}
                              defaultValue={f.espesor_mm ?? ''} placeholder="calc."
                              onBlur={(e) => { const v = leerEspesor(e.target.value); if (v !== f.espesor_mm) editar(f.nombre, { espesor_mm: v }); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                              data-testid="asistente-capa-espesor" aria-label={`Espesor instalado de la capa ${f.nombre} en mm`}
                              title="Espesor instalado (mm). Vacío: la barrera queda por calcular (espesor requerido)."
                              className="h-7 w-full min-w-0 rounded border border-slate-200 bg-white px-1 text-[11px] disabled:opacity-50"
                            />
                            <span className="shrink-0 text-[10px] text-slate-400">mm</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {filasFiltradas.length === 0 && (
                    <li className="px-3 py-3 text-center text-[11px] text-slate-500">Sin capas para ese filtro.</li>
                  )}
                </ul>
              </section>

              <section aria-label="Opciones de importación" className="px-3 py-2">
                <div className="grid grid-cols-3 gap-1">
                  <Button type="button" variant="outline" size="sm" className="h-7 px-1 text-[11px]" onClick={showOnlyBarrierLayers} title="Mostrar solo capas clasificadas como muro/barrera para preparar el import al canvas">Muros</Button>
                  <Button type="button" variant="outline" size="sm" className="h-7 px-1 text-[11px]" onClick={showAllLayers} title="Mostrar todas las capas del DXF en el preview">Todo</Button>
                  <Button type="button" variant="outline" size="sm" className="h-7 px-1 text-[11px]" onClick={hideAllLayers} title="Ocultar todas las capas; util para activar manualmente solo las que se importaran">Nada</Button>
                </div>
                <div className="mt-2 rounded bg-slate-50 px-2 py-1 text-[11px] text-slate-600" data-testid="dxf-visible-barrier-layer-summary">
                  Importables: {visibleBarrierLayers.length}/{barrierLayers.length} capas de muro visibles
                  <span className="mt-0.5 block text-[10px] text-slate-500">Entidades lineales aprox.: {visibleBarrierLineLikeCount}</span>
                </div>
                <div className="mt-2 rounded border border-slate-200 bg-white px-2 py-2">
                  <Label className="mb-1 block text-[11px] font-semibold text-slate-600">Modo de importacion</Label>
                  <Select value={importMode} onValueChange={(value) => setImportMode(value as DxfImportMode)}>
                    <SelectTrigger size="sm" className="h-7 text-[11px]" data-testid="dxf-import-mode-select" title="Modo ligero limita barreras para no saturar el canvas; completo aplica todo lo visible">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light" className="text-xs">Ligera - max {LIGHT_DXF_BARRIER_LIMIT} barreras</SelectItem>
                      <SelectItem value="full" className="text-xs">Completa - todo lo visible</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-1 text-[10px] leading-snug text-slate-500">Use Ligera para primera prueba del plano; cambie a Completa cuando las capas ya esten revisadas.</div>
                </div>
                <div className="mt-2 flex items-start gap-2 rounded border border-blue-100 bg-blue-50 px-2 py-2">
                  <Switch id="dxf-simplify-geometry" checked={simplifyGeometry} onCheckedChange={setSimplifyGeometry} data-testid="dxf-simplify-geometry" />
                  <Label htmlFor="dxf-simplify-geometry" className="text-[11px] leading-snug text-blue-900">
                    Limpiar geometria al aplicar
                    <span className="block text-[10px] font-normal text-blue-700">Consolida segmentos duplicados o colineales de la misma capa antes de crear barreras.</span>
                  </Label>
                </div>
                {importImpact && (
                  <div data-testid="dxf-import-impact-preview" className="mt-2 rounded border border-emerald-100 bg-emerald-50 px-2 py-2 text-[11px] text-emerald-950" title="Vista previa conservadora del impacto antes de escribir barreras al canvas">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-semibold">Impacto al aplicar</span>
                      <Badge variant="outline" className="h-4 bg-white text-[10px]">{importImpact.estimatedBarriers} barreras</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      <span className="text-emerald-700">Segmentos crudos</span><span className="text-right font-medium">{importImpact.rawBarrierSegments}</span>
                      <span className="text-emerald-700">Tras limpieza</span><span className="text-right font-medium">{importImpact.simplifiedBarrierSegments}</span>
                      <span className="text-emerald-700">Consolidados</span><span className="text-right font-medium">{importImpact.removedByCleanup}</span>
                      <span className="text-emerald-700">Fuera por limite</span><span className="text-right font-medium">{importImpact.cappedByLimit}</span>
                      <span className="text-emerald-700">Capas usadas</span><span className="text-right font-medium">{importImpact.selectedBarrierLayers}/{importImpact.barrierLayers}</span>
                    </div>
                    {importImpact.importLimit !== null && (
                      <div className="mt-1 border-t border-emerald-200 pt-1 text-[10px] text-emerald-800">Modo ligero activo: maximo {importImpact.importLimit} barreras priorizando capas de blindaje/muros y segmentos largos.</div>
                    )}
                    {(importImpact.skippedNonBarrierSegments > 0 || importImpact.ignoredDegenerateSegments > 0) && (
                      <div className="mt-1 border-t border-emerald-200 pt-1 text-[10px] text-emerald-800">Referencia omitida: {importImpact.skippedNonBarrierSegments}. Degenerados: {importImpact.ignoredDegenerateSegments}.</div>
                    )}
                  </div>
                )}
              </section>

              <section data-testid="f213-dxf-layer-mapping-qa" className="border-t bg-slate-50 px-3 py-2" title={f213LayerMapping.warnings.join(' | ') || f213LayerMapping.decision}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">F213 Mapeo DXF</div>
                  <Badge variant="outline" className="h-4 text-[9px]">{f213LayerMapping.status === 'dxf-layer-mapping-ready' ? 'listo' : 'revision'}</Badge>
                </div>
                <div className="mb-1 flex flex-wrap gap-1">
                  <Badge data-testid="f213-dxf-barrier-layer-count" variant="outline" className="h-4 text-[9px]">Muros {f213LayerMapping.mappedBarrierLayers}</Badge>
                  <Badge data-testid="f213-dxf-equipment-layer-count" variant="outline" className="h-4 text-[9px]">Eq {f213LayerMapping.equipmentLayers}</Badge>
                  <Badge data-testid="f213-dxf-zone-layer-count" variant="outline" className="h-4 text-[9px]">Zonas {f213LayerMapping.zoneLayers}</Badge>
                  <Badge data-testid="f213-dxf-unmapped-layer-count" variant="outline" className="h-4 text-[9px]">Rev {f213LayerMapping.unmappedLayers}</Badge>
                  <Badge variant="outline" className="h-4 text-[9px]"><CheckSquare className="mr-1 h-2.5 w-2.5" /> Visibles {visibleBarrierLayers.length}</Badge>
                  <Badge variant="outline" className="h-4 text-[9px]"><Square className="mr-1 h-2.5 w-2.5" /> Total {barrierLayers.length}</Badge>
                </div>
                <div className="rounded bg-white px-1.5 py-1 text-[10px] leading-snug text-slate-600">
                  Solo LINE/LWPOLYLINE en capas visibles con rol Muro (no ignoradas) se convierten en barreras, con el material y espesor del asistente.
                </div>
                {fileName && (
                  <div className="mt-2 text-[10px] text-slate-500">
                    <div className="font-medium truncate" title={fileName}>{fileName}</div>
                    {parsed.bounds.maxX - parsed.bounds.minX > 0 && (
                      <div className="mt-0.5">Dimensiones: {(parsed.bounds.maxX - parsed.bounds.minX).toFixed(1)} x {(parsed.bounds.maxY - parsed.bounds.minY).toFixed(1)} {parsed.unit}</div>
                    )}
                    {importSummary && <div className="mt-1 text-slate-600">Barreras mapeadas al canvas: {importSummary.mappedBarriers}</div>}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
