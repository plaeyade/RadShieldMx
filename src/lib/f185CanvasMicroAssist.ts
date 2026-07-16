import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { CanvasLayer } from '@/hooks/useCanvasLayers';
import type { FloorPlan } from '@/types/radshield';

export type F185AssistStatus = 'ready' | 'active' | 'attention' | 'idle';

export interface F185CanvasAssistItem {
  id: string;
  label: string;
  status: F185AssistStatus;
  value: string;
  tooltip: string;
}

export interface F185CanvasMicroAssist {
  phase: 'F185';
  status: 'canvas-micro-assist-ready';
  activeTool: string;
  selectedCount: number;
  compactHint: string;
  nextAction: string;
  items: F185CanvasAssistItem[];
  guardrails: string[];
}

interface BuildF185Options {
  floorPlan?: FloorPlan | null;
  activeTool?: string;
  selectedId?: string | null;
  selectedIds?: string[];
  snapToGrid?: boolean;
  layers?: CanvasLayer[];
  barrierResults?: CanvasBarrierResult[];
  sampleLines?: CanvasSampleLine[];
  heatmapEnabled?: boolean;
  heatmapPointCount?: number;
}

const TOOL_HINTS: Record<string, string> = {
  select: 'Selecciona objetos; usa la barra lateral para editar propiedades sin mover el layout.',
  barrier: 'Dibuja barreras con snap activo y confirma longitud/espesor antes de calcular.',
  source: 'Coloca equipos/fuentes con orientacion y footprint real cuando este disponible.',
  region: 'Define zonas controladas/no controladas para ocupacion, evidencia y memoria.',
  measure: 'Mide distancias y conserva cotas relevantes para Evidence Pack.',
  pan: 'Desplaza el plano sin modificar geometria.',
  text: 'Agrega anotaciones solo como apoyo visual; no sustituyen evidencia normativa.',
  freehand: 'Usa trazos para revision temporal; consolida cambios en barreras/cotas reales.',
};

function getToolHint(activeTool?: string): string {
  return TOOL_HINTS[activeTool || 'select'] || 'Herramienta activa lista; confirma la accion antes de modificar geometria.';
}

function getNextAction(options: BuildF185Options): string {
  const barrierCount = options.floorPlan?.barriers?.length ?? 0;
  const sourceCount = options.floorPlan?.sources?.length ?? 0;
  const resultCount = options.barrierResults?.length ?? 0;
  const selectedCount = options.selectedIds?.length ?? (options.selectedId ? 1 : 0);
  if (barrierCount === 0) return 'Cargar croquis o dibujar barreras base.';
  if (sourceCount === 0) return 'Colocar equipo/fuente con modalidad DX/TX/NM/CY.';
  if (selectedCount === 0) return 'Seleccionar una barrera/equipo para revisar propiedades.';
  if (resultCount === 0) return 'Ejecutar calculo y activar heatmap para QA visual.';
  if ((options.heatmapPointCount ?? 0) === 0) return 'Generar puntos de heatmap/isodosis para reporte visual.';
  return 'Exportar snapshot/Evidence Pack y revisar memoria analitica.';
}

function item(
  id: string,
  label: string,
  status: F185AssistStatus,
  value: string,
  tooltip: string,
): F185CanvasAssistItem {
  return { id, label, status, value, tooltip };
}

export function buildF185CanvasMicroAssist(options: BuildF185Options = {}): F185CanvasMicroAssist {
  const barrierCount = options.floorPlan?.barriers?.length ?? 0;
  const sourceCount = options.floorPlan?.sources?.length ?? 0;
  const selectedCount = options.selectedIds?.length ?? (options.selectedId ? 1 : 0);
  const visibleLayers = (options.layers ?? []).filter((layer) => layer.visible !== false).length;
  const totalLayers = options.layers?.length ?? 0;
  const resultCount = options.barrierResults?.length ?? 0;
  const sampleCount = options.sampleLines?.length ?? 0;
  const heatmapPointCount = options.heatmapPointCount ?? 0;
  const nextAction = getNextAction(options);

  return {
    phase: 'F185',
    status: 'canvas-micro-assist-ready',
    activeTool: options.activeTool || 'select',
    selectedCount,
    compactHint: getToolHint(options.activeTool),
    nextAction,
    items: [
      item(
        'tool',
        'Tool',
        options.activeTool && options.activeTool !== 'select' ? 'active' : 'ready',
        options.activeTool || 'select',
        getToolHint(options.activeTool),
      ),
      item(
        'selection',
        'Sel',
        selectedCount > 0 ? 'active' : barrierCount + sourceCount > 0 ? 'attention' : 'idle',
        String(selectedCount),
        selectedCount > 0 ? 'Objeto seleccionado para inspeccion/edicion.' : 'Selecciona un objeto para activar edicion contextual.',
      ),
      item(
        'snap',
        'Snap',
        options.snapToGrid ? 'ready' : 'attention',
        options.snapToGrid ? 'ON' : 'OFF',
        options.snapToGrid ? 'Snap activo para trazado mas limpio.' : 'Activa snap antes de dibujar o ajustar barreras.',
      ),
      item(
        'layers',
        'Capas',
        totalLayers > 0 ? 'ready' : 'idle',
        totalLayers > 0 ? `${visibleLayers}/${totalLayers}` : 'N/A',
        'Capas visibles/totales; revisar arquitectura, blindaje, fuentes y anotaciones.',
      ),
      item(
        'evidence',
        'Evid',
        resultCount > 0 && sampleCount > 0 ? 'ready' : resultCount > 0 || sampleCount > 0 ? 'active' : 'attention',
        `${resultCount}R/${sampleCount}L`,
        'R=resultados calculados, L=lineas de muestreo para memoria y Evidence Pack.',
      ),
      item(
        'heatmap',
        'Heat',
        options.heatmapEnabled && heatmapPointCount > 0 ? 'ready' : heatmapPointCount > 0 ? 'active' : 'attention',
        options.heatmapEnabled ? String(heatmapPointCount) : 'off',
        'Heatmap/isodosis visual para QA y export de reporte.',
      ),
    ],
    guardrails: [
      'F185 solo agrega asistencia visual compacta; no cambia canvas events, geometria ni calculos.',
      'No reemplaza snapping real, grips editables, lasso ni cotas persistentes; esos entran en fases CAD con smoke visual.',
      'Mantiene demo R&F, sidebar y layout actual intactos.',
    ],
  };
}
