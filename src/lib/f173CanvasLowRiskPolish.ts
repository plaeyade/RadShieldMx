import type { FloorPlan } from '@/types/radshield';
import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';

export type F173CanvasSignalStatus = 'ready' | 'partial' | 'empty';

export interface F173CanvasSignal {
  id: string;
  label: string;
  status: F173CanvasSignalStatus;
  value: string;
  hint: string;
}

export interface F173CanvasLowRiskPolish {
  phase: 'F173';
  status: 'canvas-low-risk-polish-ready' | 'canvas-low-risk-polish-partial';
  score: number;
  signals: F173CanvasSignal[];
  compactSummary: string;
  releaseGuardrails: string[];
}

interface BuildF173Options {
  floorPlan?: FloorPlan | null;
  selectedId?: string | null;
  selectedIds?: string[];
  snapToGrid?: boolean;
  barrierResults?: CanvasBarrierResult[];
  sampleLines?: CanvasSampleLine[];
  heatmapPointCount?: number;
}

function scoreFor(status: F173CanvasSignalStatus): number {
  if (status === 'ready') return 1;
  if (status === 'partial') return 0.6;
  return 0.2;
}

export function buildF173CanvasLowRiskPolish(options: BuildF173Options = {}): F173CanvasLowRiskPolish {
  const barrierCount = options.floorPlan?.barriers?.length ?? 0;
  const sourceCount = options.floorPlan?.sources?.length ?? 0;
  const regionCount =
    ((options.floorPlan as { regions?: unknown[] } | undefined)?.regions?.length ??
      (options.floorPlan as { occupiedRegions?: unknown[] } | undefined)?.occupiedRegions?.length) ?? 0;
  const selectedCount = options.selectedIds?.length ?? (options.selectedId ? 1 : 0);
  const resultCount = options.barrierResults?.length ?? 0;
  const sampleLineCount = options.sampleLines?.length ?? 0;
  const heatmapPointCount = options.heatmapPointCount ?? 0;

  const signals: F173CanvasSignal[] = [
    {
      id: 'selection',
      label: 'Sel',
      status: selectedCount > 0 ? 'ready' : barrierCount + sourceCount > 0 ? 'partial' : 'empty',
      value: `${selectedCount}`,
      hint: selectedCount > 0 ? 'Objeto listo para revision/edicion.' : 'Selecciona una barrera, fuente o zona para revisar propiedades.',
    },
    {
      id: 'snap',
      label: 'Snap',
      status: options.snapToGrid ? 'ready' : 'partial',
      value: options.snapToGrid ? 'ON' : 'OFF',
      hint: options.snapToGrid ? 'Snapping visible para trazado y ajuste.' : 'Activa snap para reducir deriva geometrica.',
    },
    {
      id: 'objects',
      label: 'Obj',
      status: barrierCount + sourceCount > 0 ? 'ready' : 'empty',
      value: `${barrierCount}B/${sourceCount}F/${regionCount}Z`,
      hint: 'B=barreras, F=fuentes, Z=zonas/regiones.',
    },
    {
      id: 'evidence',
      label: 'Evid',
      status: sampleLineCount > 0 || resultCount > 0 ? 'ready' : barrierCount > 0 ? 'partial' : 'empty',
      value: `${sampleLineCount}L/${resultCount}R`,
      hint: 'L=lineas de muestreo, R=resultados de barrera para reportes.',
    },
    {
      id: 'heatmap',
      label: 'Heat',
      status: heatmapPointCount > 0 ? 'ready' : resultCount > 0 ? 'partial' : 'empty',
      value: `${heatmapPointCount}`,
      hint: 'Puntos de heatmap disponibles para revision visual.',
    },
    {
      id: 'export',
      label: 'Exp',
      status: resultCount > 0 && barrierCount > 0 ? 'ready' : barrierCount > 0 ? 'partial' : 'empty',
      value: resultCount > 0 ? 'OK' : 'Prep',
      hint: resultCount > 0 ? 'Plano listo para export visual y evidencia.' : 'Ejecuta calculos antes del export final.',
    },
  ];

  const score = Math.round((signals.reduce((sum, signal) => sum + scoreFor(signal.status), 0) / signals.length) * 100);
  const status = score >= 70 ? 'canvas-low-risk-polish-ready' : 'canvas-low-risk-polish-partial';

  return {
    phase: 'F173',
    status,
    score,
    signals,
    compactSummary: `F173 ${score}% | ${barrierCount} barreras, ${sourceCount} fuentes, ${resultCount} resultados`,
    releaseGuardrails: [
      'No cambia formulas, TVL, materiales ni limites regulatorios.',
      'Solo agrega lectura visual compacta para smoke local y revision de operador.',
      'Mantiene el canvas CAD-like sin introducir un nuevo motor de seleccion o snapping.',
    ],
  };
}
