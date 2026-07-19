import type { CanvasLayer } from '@/hooks/useCanvasLayers';

export interface F210LayerManagerRow {
  id: string;
  label: string;
  visible: boolean;
  locked: boolean;
  opacityPct: number;
  color: string;
  role: 'reference' | 'geometry' | 'calculation' | 'annotation' | 'ui';
  status: 'ready' | 'hidden' | 'locked' | 'dimmed';
}

export interface F210CanvasLayerManagerPolish {
  schema: 'radshield-mx.canvas-layer-manager.f210.v1';
  phase: 'F210';
  status: 'canvas-layer-manager-ready' | 'canvas-layer-manager-review';
  layerCount: number;
  visibleCount: number;
  lockedCount: number;
  dimmedCount: number;
  activeLayer: string;
  rows: F210LayerManagerRow[];
  warnings: string[];
  decision: string;
}

function clampOpacityPct(opacity: unknown): number {
  const value = typeof opacity === 'number' && Number.isFinite(opacity) ? opacity : 1;
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
}

function layerRole(id: string): F210LayerManagerRow['role'] {
  if (id === 'grid' || id === 'architecture') return 'reference';
  if (id === 'shielding' || id === 'sources') return 'geometry';
  if (id === 'heatmap') return 'calculation';
  if (id === 'annotations') return 'annotation';
  return 'ui';
}

function layerStatus(layer: CanvasLayer): F210LayerManagerRow['status'] {
  if (!layer.visible) return 'hidden';
  if (layer.locked) return 'locked';
  if (clampOpacityPct(layer.opacity) < 60) return 'dimmed';
  return 'ready';
}

export function buildF210CanvasLayerManagerPolish(
  layers: CanvasLayer[] = [],
  activeLayer = 'shielding',
): F210CanvasLayerManagerPolish {
  const rows = layers.map((layer) => ({
    id: layer.id,
    label: layer.nameEs || layer.name || layer.id,
    visible: layer.visible,
    locked: layer.locked,
    opacityPct: clampOpacityPct(layer.opacity),
    color: layer.color || '#64748b',
    role: layerRole(layer.id),
    status: layerStatus(layer),
  }));

  const visibleCount = rows.filter((row) => row.visible).length;
  const lockedCount = rows.filter((row) => row.locked).length;
  const dimmedCount = rows.filter((row) => row.visible && row.opacityPct < 60).length;
  const warnings: string[] = [];

  if (rows.length === 0) warnings.push('No hay capas registradas en el canvas.');
  if (rows.length > 0 && visibleCount === 0) warnings.push('Todas las capas estan ocultas.');
  if (!rows.some((row) => row.id === activeLayer)) warnings.push(`La capa activa ${activeLayer} no esta registrada.`);
  if (rows.some((row) => !row.visible && (row.id === 'shielding' || row.id === 'sources'))) {
    warnings.push('Blindaje o fuentes estan ocultos; puede parecer que el plano desaparecio.');
  }
  if (dimmedCount > 0) warnings.push('Hay capas visibles con opacidad menor a 60%.');

  return {
    schema: 'radshield-mx.canvas-layer-manager.f210.v1',
    phase: 'F210',
    status: warnings.length === 0 ? 'canvas-layer-manager-ready' : 'canvas-layer-manager-review',
    layerCount: rows.length,
    visibleCount,
    lockedCount,
    dimmedCount,
    activeLayer,
    rows,
    warnings,
    decision:
      warnings.length === 0
        ? 'Layer manager compacto listo para revision CAD sin abrir dialogos.'
        : 'Revisar visibilidad, bloqueo u opacidad de capas antes de asumir que el canvas esta vacio.',
  };
}

export function formatF210LayerManagerText(summary: F210CanvasLayerManagerPolish): string {
  return [
    `${summary.phase} ${summary.status}`,
    `Capas visibles: ${summary.visibleCount}/${summary.layerCount}`,
    `Bloqueadas: ${summary.lockedCount}`,
    `Opacidad baja: ${summary.dimmedCount}`,
    `Activa: ${summary.activeLayer}`,
    `Advertencias: ${summary.warnings.join(' | ') || 'ninguna'}`,
  ].join('\n');
}
