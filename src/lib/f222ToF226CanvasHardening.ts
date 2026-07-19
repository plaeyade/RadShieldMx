export type F222F226PhaseId = 'F222' | 'F223' | 'F224' | 'F225' | 'F226';
export type F222F226Status = 'ready' | 'partial' | 'guarded';

export interface F222F226CanvasHardeningInput {
  barrierCount: number;
  sourceCount: number;
  regionCount: number;
  selectedCount: number;
  snapToGrid: boolean;
  hasResults: boolean;
  hasMedical3D: boolean;
  hasExport: boolean;
  visualMode: 'plan' | 'heat' | 'isocontours' | 'structure';
}

export interface F222F226CanvasHardeningItem {
  phase: F222F226PhaseId;
  id: string;
  label: string;
  status: F222F226Status;
  evidence: string;
  safeAction: string;
  releaseGuardrail: string;
}

export interface F222F226CanvasHardeningSummary {
  schema: 'radshield-mx.canvas-hardening.f222-f226.v1';
  status: 'canvas-hardening-bridge-ready' | 'canvas-hardening-bridge-partial';
  readyCount: number;
  partialCount: number;
  guardedCount: number;
  items: F222F226CanvasHardeningItem[];
  nextRendererStep: string;
  eventBaseDecision: string;
}

export function buildF222ToF226CanvasHardening(input: F222F226CanvasHardeningInput): F222F226CanvasHardeningSummary {
  const hasGeometry = input.barrierCount + input.sourceCount + input.regionCount > 0;
  const items: F222F226CanvasHardeningItem[] = [
    {
      phase: 'F222',
      id: 'renderer-layer-registry',
      label: 'Renderer layers',
      status: 'ready',
      evidence: 'Capas logicas separadas: grid, floorplan, barreras, fuentes, zonas, heatmap, cotas, grips y overlays.',
      safeAction: 'Extraer helpers de dibujo por capa sin cambiar eventos ni mutacion de floorplan.',
      releaseGuardrail: 'No sustituir `useCanvas.draw()` hasta tener smoke pixel/canvas y rollback.',
    },
    {
      phase: 'F223',
      id: 'event-controller-gate',
      label: 'Events flag',
      status: input.snapToGrid || input.selectedCount > 0 ? 'partial' : 'guarded',
      evidence: input.snapToGrid
        ? 'Snap/drag actuales funcionan en useCanvas; nuevo controller debe iniciar detras de flag.'
        : 'Eventos base actuales estables; flag requerido antes de reemplazar pointer flow.',
      safeAction: 'Crear event controller experimental detras de `VITE_CANVAS_EVENT_CONTROLLER_V2`.',
      releaseGuardrail: 'No activar por defecto hasta pasar drag, snap, lasso, pan, zoom, delete y undo.',
    },
    {
      phase: 'F224',
      id: 'interaction-e2e-matrix',
      label: 'E2E CAD',
      status: hasGeometry ? 'ready' : 'partial',
      evidence: hasGeometry
        ? `${input.barrierCount} muros, ${input.sourceCount} equipos y ${input.regionCount} zonas para smoke interactivo.`
        : 'Requiere croquis o DXF aplicado para smoke interactivo completo.',
      safeAction: 'Agregar pruebas Playwright de drag grip, snap endpoint/midpoint/interseccion, lasso y export.',
      releaseGuardrail: 'Sin E2E no tocar renderer/event controller en la misma fase.',
    },
    {
      phase: 'F225',
      id: 'isocontour-footprint-hardening',
      label: 'Iso/Eq harden',
      status: input.hasResults && input.sourceCount > 0 ? 'partial' : 'guarded',
      evidence: input.hasResults
        ? `Vista ${input.visualMode}; resultados disponibles para convertir proxy iso a interpolacion.`
        : 'Falta calculo para interpolacion/leyenda regulatoria firmable.',
      safeAction: 'Convertir isocontornos proxy en polilineas interpoladas y footprints en catalogo por fabricante.',
      releaseGuardrail: 'Los isocontornos reales requieren QA numerico y etiqueta de umbral regulatorio.',
    },
    {
      phase: 'F226',
      id: 'medical-3d-sync',
      label: '3D sync',
      status: input.hasMedical3D && hasGeometry ? 'partial' : 'guarded',
      evidence: input.hasMedical3D
        ? 'Handoff 3D activo desde floorplan; falta sincronizacion bidireccional de medidas/materiales/snapshots.'
        : 'Visor 3D medico no disponible para esta escena.',
      safeAction: 'Enviar hash de escena, materiales, espesores, equipos, zonas y snapshots al visor 3D.',
      releaseGuardrail: 'La inspeccion 3D es evidencia visual; no sustituye calculo ni memoria firmada.',
    },
  ];

  const readyCount = items.filter((item) => item.status === 'ready').length;
  const partialCount = items.filter((item) => item.status === 'partial').length;
  const guardedCount = items.filter((item) => item.status === 'guarded').length;

  return {
    schema: 'radshield-mx.canvas-hardening.f222-f226.v1',
    status: readyCount >= 2 && guardedCount <= 2 ? 'canvas-hardening-bridge-ready' : 'canvas-hardening-bridge-partial',
    readyCount,
    partialCount,
    guardedCount,
    items,
    nextRendererStep:
      'F222 debe extraer helpers/layers de render en archivos puros antes de mover cualquier listener o drag state.',
    eventBaseDecision:
      'El renderer puede mejorar ya por capas; eventos base solo con feature flag, E2E y rollback al useCanvas actual.',
  };
}
