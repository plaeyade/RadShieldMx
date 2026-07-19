export type CanvasRenderLayerId =
  | 'background-grid'
  | 'floorplan-image'
  | 'regions-zones'
  | 'barriers'
  | 'equipment-sources'
  | 'heatmap'
  | 'sample-lines'
  | 'cad-overlays'
  | 'selection-grips'
  | 'hud-scale';

export type CanvasRenderLayerGroup = 'static' | 'dynamic' | 'overlay' | 'hud';

export interface CanvasRenderLayerDefinition {
  id: CanvasRenderLayerId;
  group: CanvasRenderLayerGroup;
  order: number;
  label: string;
  dirtyTriggers: string[];
  migrationStatus: 'current-useCanvas' | 'extractable-helper' | 'canvas-renderer-ready';
  guardrail: string;
}

export const CANVAS_RENDER_LAYER_REGISTRY: CanvasRenderLayerDefinition[] = [
  {
    id: 'background-grid',
    group: 'static',
    order: 10,
    label: 'Grid/base',
    dirtyTriggers: ['scale', 'offset', 'canvas-size', 'theme'],
    migrationStatus: 'canvas-renderer-ready',
    guardrail: 'Puede extraerse primero porque no muta floorplan ni seleccion.',
  },
  {
    id: 'floorplan-image',
    group: 'static',
    order: 20,
    label: 'Imagen plano',
    dirtyTriggers: ['imageUrl', 'scale', 'offset', 'image-opacity'],
    migrationStatus: 'canvas-renderer-ready',
    guardrail: 'Mantener fallback si imagen no carga; no bloquear canvas vacio.',
  },
  {
    id: 'regions-zones',
    group: 'static',
    order: 30,
    label: 'Zonas',
    dirtyTriggers: ['regions', 'occupiedRegions', 'controlled-zone', 'scale', 'offset'],
    migrationStatus: 'extractable-helper',
    guardrail: 'No mezclar con calculo; solo render de poligonos y etiquetas.',
  },
  {
    id: 'barriers',
    group: 'dynamic',
    order: 40,
    label: 'Barreras',
    dirtyTriggers: ['barriers', 'selectedId', 'selectedIds', 'scale', 'offset', 'results'],
    migrationStatus: 'extractable-helper',
    guardrail: 'Preservar color por tipo, grosor, etiquetas, espesores y seleccion.',
  },
  {
    id: 'equipment-sources',
    group: 'dynamic',
    order: 50,
    label: 'Equipos/fuentes',
    dirtyTriggers: ['sources', 'selectedId', 'selectedIds', 'scale', 'offset', 'rotation'],
    migrationStatus: 'canvas-renderer-ready',
    guardrail: 'Mantener footprint, rotacion, iconografia unificada y fabricante si existe.',
  },
  {
    id: 'heatmap',
    group: 'dynamic',
    order: 60,
    label: 'Heatmap',
    dirtyTriggers: ['heatmapData', 'results', 'visualMode', 'scale', 'offset'],
    migrationStatus: 'extractable-helper',
    guardrail: 'No usar como evidencia firmable sin leyenda y threshold QA.',
  },
  {
    id: 'sample-lines',
    group: 'overlay',
    order: 70,
    label: 'Lineas/isocontornos',
    dirtyTriggers: ['sampleLines', 'visualMode', 'showSampleLines', 'showSamplePoints'],
    migrationStatus: 'extractable-helper',
    guardrail: 'Isocontornos reales requieren interpolacion y etiquetas regulatorias.',
  },
  {
    id: 'cad-overlays',
    group: 'overlay',
    order: 80,
    label: 'Preview CAD',
    dirtyTriggers: ['activeTool', 'drawingState', 'ghostPos', 'snapCandidate'],
    migrationStatus: 'current-useCanvas',
    guardrail: 'No migrar antes de E2E de snap/drag; alto riesgo de romper dibujo.',
  },
  {
    id: 'selection-grips',
    group: 'overlay',
    order: 90,
    label: 'Seleccion/grips',
    dirtyTriggers: ['selectedId', 'selectedIds', 'dragState', 'selectionWindow', 'lassoPath'],
    migrationStatus: 'current-useCanvas',
    guardrail: 'Migrar solo despues de smoke grip drag, lasso y Shift+click.',
  },
  {
    id: 'hud-scale',
    group: 'hud',
    order: 100,
    label: 'HUD/escala',
    dirtyTriggers: ['scale', 'scale_m_per_pixel', 'visualMode', 'canvas-size'],
    migrationStatus: 'extractable-helper',
    guardrail: 'Seguro si no captura eventos ni tapa herramientas.',
  },
];

export function getCanvasRenderLayerOrder(): CanvasRenderLayerId[] {
  return [...CANVAS_RENDER_LAYER_REGISTRY]
    .sort((a, b) => a.order - b.order)
    .map((layer) => layer.id);
}

export function summarizeCanvasRenderLayerRegistry() {
  const readyCount = CANVAS_RENDER_LAYER_REGISTRY.filter((layer) => layer.migrationStatus === 'canvas-renderer-ready').length;
  const extractableCount = CANVAS_RENDER_LAYER_REGISTRY.filter((layer) => layer.migrationStatus === 'extractable-helper').length;
  const guardedCount = CANVAS_RENDER_LAYER_REGISTRY.filter((layer) => layer.migrationStatus === 'current-useCanvas').length;
  return {
    schema: 'radshield-mx.canvas.render-layer-registry.f227.v1' as const,
    layerCount: CANVAS_RENDER_LAYER_REGISTRY.length,
    readyCount,
    extractableCount,
    guardedCount,
    order: getCanvasRenderLayerOrder(),
    decision:
      'F227 extrae el contrato de capas del renderer. Las capas estaticas y HUD pueden migrar primero; overlays de seleccion/grips siguen en useCanvas hasta E2E.',
  };
}
