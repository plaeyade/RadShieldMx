import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan } from '@/types/radshield';

export type F208CanvasReportItemStatus = 'ready' | 'partial' | 'missing';

export interface F208CanvasReportItem {
  id: 'floorplan' | 'dimensions' | 'layers' | 'equipment' | 'heatmap' | 'exports';
  label: string;
  status: F208CanvasReportItemStatus;
  evidence: string;
  reportUse: string;
}

export interface F208CanvasReportingLayer {
  phase: 'F208';
  schema: 'radshield-mx.canvas-reporting-layer.f208.v1';
  status: 'canvas-reporting-layer-ready' | 'canvas-reporting-layer-partial';
  score: number;
  readyCount: number;
  partialCount: number;
  missingCount: number;
  items: F208CanvasReportItem[];
  reportSurfaces: string[];
  exportArtifacts: string[];
  warnings: string[];
  nextActions: string[];
  decision: string;
}

function statusWeight(status: F208CanvasReportItemStatus): number {
  if (status === 'ready') return 1;
  if (status === 'partial') return 0.5;
  return 0;
}

export function buildF208CanvasReportingLayer(
  floorPlan: FloorPlan | undefined,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
  options: { heatmapPointCount?: number; layerCount?: number; visibleLayerCount?: number } = {},
): F208CanvasReportingLayer {
  const barrierCount = floorPlan?.barriers?.length ?? 0;
  const sourceCount = floorPlan?.sources?.length ?? 0;
  const regionCount = (floorPlan?.regions?.length ?? 0) + (floorPlan?.occupiedRegions?.length ?? 0);
  const heatmapPointCount = options.heatmapPointCount ?? 0;
  const layerCount = options.layerCount ?? 0;
  const visibleLayerCount = options.visibleLayerCount ?? 0;
  const samplePointCount = sampleLines.reduce((count, line) => count + line.points.length, 0);

  const items: F208CanvasReportItem[] = [
    {
      id: 'floorplan',
      label: 'Plano',
      status: barrierCount > 0 && sourceCount > 0 ? 'ready' : barrierCount > 0 || sourceCount > 0 ? 'partial' : 'missing',
      evidence: `${barrierCount} barreras, ${sourceCount} equipos/fuentes, ${regionCount} zonas`,
      reportUse: 'Figura base del proyecto y contexto geometrico para Memoria IA/PDF/Evidence.',
    },
    {
      id: 'dimensions',
      label: 'Cotas',
      status: sampleLines.length > 0 && samplePointCount > 0 ? 'ready' : barrierCount > 0 ? 'partial' : 'missing',
      evidence: `${sampleLines.length} lineas 0.3m, ${samplePointCount} puntos`,
      reportUse: 'Anexo visual con escala, distancias a barreras y puntos de evaluacion.',
    },
    {
      id: 'layers',
      label: 'Capas',
      status: layerCount > 0 && visibleLayerCount > 0 ? 'ready' : layerCount > 0 ? 'partial' : 'missing',
      evidence: `${visibleLayerCount}/${layerCount} capas visibles`,
      reportUse: 'Leyenda por arquitectura, blindaje, equipos, zonas, cotas, heatmap y estructura.',
    },
    {
      id: 'equipment',
      label: 'Simbolos',
      status: sourceCount > 0 ? 'ready' : 'missing',
      evidence: `${sourceCount} simbolos clinicos con metadatos de modalidad`,
      reportUse: 'Identificacion de LINAC/Gamma Knife/HDR/PET/CT/ciclotron y footprint para calculo.',
    },
    {
      id: 'heatmap',
      label: 'Heat/Iso',
      status: heatmapPointCount > 0 ? 'ready' : barrierResults.length > 0 ? 'partial' : 'missing',
      evidence: `${heatmapPointCount} puntos heatmap, ${barrierResults.length} resultados`,
      reportUse: 'Mapa de dosis/isocontornos con umbrales regulatorios y maxima por barrera.',
    },
    {
      id: 'exports',
      label: 'Export',
      status: floorPlan ? 'ready' : 'missing',
      evidence: floorPlan ? 'PNG + CAD JSON + snapshot evidencia disponibles' : 'Sin floorplan activo',
      reportUse: 'Adjunto reutilizable para Memoria IA, PDF, Evidence Pack y checklist CNSNS/UAQ.',
    },
  ];

  const readyCount = items.filter((item) => item.status === 'ready').length;
  const partialCount = items.filter((item) => item.status === 'partial').length;
  const missingCount = items.filter((item) => item.status === 'missing').length;
  const score = Math.round((items.reduce((sum, item) => sum + statusWeight(item.status), 0) / items.length) * 100);
  const warnings = [
    barrierCount === 0 ? 'Dibujar o importar barreras antes de generar anexos firmables.' : '',
    sourceCount === 0 ? 'Colocar equipo/fuente para asociar metodologia y memoria por modalidad.' : '',
    heatmapPointCount === 0 ? 'Heatmap/isocontornos requieren calculo o muestreo antes de export visual regulatorio.' : '',
    sampleLines.length === 0 ? 'Agregar lineas/puntos de evaluacion para justificar distancias y cotas.' : '',
  ].filter(Boolean);

  const nextActions = warnings.length > 0
    ? warnings.slice(0, 3)
    : ['Exportar PNG/CAD JSON y anexar snapshot F208 a Memoria IA, PDF y Evidence Pack.'];

  return {
    phase: 'F208',
    schema: 'radshield-mx.canvas-reporting-layer.f208.v1',
    status: score >= 75 ? 'canvas-reporting-layer-ready' : 'canvas-reporting-layer-partial',
    score,
    readyCount,
    partialCount,
    missingCount,
    items,
    reportSurfaces: ['CanvasArea', 'MemoriaAIWizard', 'PdfReportDialog', 'EvidencePackDialog'],
    exportArtifacts: ['PNG canvas', 'CAD JSON', 'Memoria IA HTML/PDF', 'Evidence Pack JSON'],
    warnings,
    nextActions,
    decision:
      'F208 convierte el canvas en una capa reportable: plano, cotas, capas, simbolos, heatmap/isocontornos y export visual quedan trazables para Memoria IA, PDF y Evidence Pack sin mover el layout.',
  };
}

export function formatF208CanvasReportingLayerText(layer: F208CanvasReportingLayer): string {
  return [
    'F208 CANVAS REPORTING LAYER',
    `Estado: ${layer.status} (${layer.score}%)`,
    `Listos/parciales/faltantes: ${layer.readyCount}/${layer.partialCount}/${layer.missingCount}`,
    ...layer.items.map((item) => `- ${item.label} [${item.status}]: ${item.evidence}. Uso: ${item.reportUse}`),
    `Superficies: ${layer.reportSurfaces.join(', ')}`,
    `Artefactos: ${layer.exportArtifacts.join(', ')}`,
    `Advertencias: ${layer.warnings.join(' | ') || 'sin advertencias criticas'}`,
    `Decision: ${layer.decision}`,
  ].join('\n');
}
