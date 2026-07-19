import { CANVAS_RENDER_LAYER_REGISTRY, summarizeCanvasRenderLayerRegistry } from '@/lib/canvas/renderLayerRegistry';

export interface F227CanvasRendererLayerExtractionInput {
  barrierCount: number;
  sourceCount: number;
  regionCount: number;
  hasHeatmap: boolean;
  hasSampleLines: boolean;
  selectedCount: number;
}

export function buildF227CanvasRendererLayerExtraction(input: F227CanvasRendererLayerExtractionInput) {
  const registry = summarizeCanvasRenderLayerRegistry();
  const geometryReady = input.barrierCount + input.sourceCount + input.regionCount > 0;
  const activeLayerIds = CANVAS_RENDER_LAYER_REGISTRY
    .filter((layer) => {
      if (layer.id === 'heatmap') return input.hasHeatmap;
      if (layer.id === 'sample-lines') return input.hasSampleLines;
      if (layer.id === 'selection-grips') return input.selectedCount > 0;
      if (layer.id === 'barriers') return input.barrierCount > 0;
      if (layer.id === 'equipment-sources') return input.sourceCount > 0;
      if (layer.id === 'regions-zones') return input.regionCount > 0;
      return true;
    })
    .map((layer) => layer.id);

  return {
    schema: 'radshield-mx.canvas-renderer-layer-extraction.f227.v1' as const,
    phase: 'F227' as const,
    status: registry.layerCount >= 10 && registry.guardedCount <= 2 ? 'renderer-layer-extraction-ready' as const : 'renderer-layer-extraction-partial' as const,
    registry,
    activeLayerIds,
    geometryReady,
    safeFirstLayers: CANVAS_RENDER_LAYER_REGISTRY
      .filter((layer) => layer.migrationStatus === 'canvas-renderer-ready')
      .map((layer) => layer.id),
    guardedLayers: CANVAS_RENDER_LAYER_REGISTRY
      .filter((layer) => layer.migrationStatus === 'current-useCanvas')
      .map((layer) => layer.id),
    nextImplementation:
      'Extraer primero background-grid, floorplan-image y equipment-sources como helpers puros; dejar cad-overlays y selection-grips en useCanvas hasta Playwright E2E.',
  };
}
