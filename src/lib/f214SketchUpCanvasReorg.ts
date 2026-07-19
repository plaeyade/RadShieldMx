export interface F214SketchUpCanvasReorgInput {
  visualMode: 'plan' | 'heat' | 'isocontours' | 'structure';
  activeTool: string;
  scale: number;
  snapToGrid: boolean;
  barrierCount: number;
  sourceCount: number;
  regionCount: number;
  layerCount: number;
  visibleLayerCount: number;
  heatmapEnabled: boolean;
}

export interface F214SketchUpCanvasChip {
  id: string;
  label: string;
  value: string;
  tone: 'ready' | 'active' | 'attention' | 'muted';
}

export interface F214SketchUpCanvasAxis {
  axis: 'X' | 'Y' | 'Z';
  label: string;
  color: string;
}

export interface F214SketchUpCanvasReorgSummary {
  schema: 'radshield-mx.sketchup-canvas-reorg.f214.v1';
  phase: 'F214';
  status: 'sketchup-canvas-reorg-ready' | 'sketchup-canvas-reorg-review';
  styleMode: 'sketchup-inspired-medical-cad';
  viewportTitle: string;
  chips: F214SketchUpCanvasChip[];
  axes: F214SketchUpCanvasAxis[];
  viewCubeLabels: string[];
  warnings: string[];
}

export function buildF214SketchUpCanvasReorg(input: F214SketchUpCanvasReorgInput): F214SketchUpCanvasReorgSummary {
  const warnings: string[] = [];
  if (!Number.isFinite(input.scale) || input.scale <= 0) warnings.push('Escala de viewport no valida.');
  if (input.layerCount === 0) warnings.push('No hay capas registradas para organizar el plano.');
  if (input.visibleLayerCount === 0 && input.layerCount > 0) warnings.push('Todas las capas estan ocultas; el canvas puede parecer vacio.');
  if (input.barrierCount + input.sourceCount + input.regionCount === 0) warnings.push('Plano sin objetos clinicos: agrega croquis, equipo o zona controlada.');

  const chips: F214SketchUpCanvasChip[] = [
    {
      id: 'scene',
      label: 'Escena',
      value: input.visualMode === 'structure' ? 'Estructura' : input.visualMode === 'heat' ? 'Heatmap' : input.visualMode === 'isocontours' ? 'Isodosis' : 'Planta',
      tone: 'active',
    },
    {
      id: 'style',
      label: 'Estilo',
      value: 'Lineas + sombras',
      tone: 'ready',
    },
    {
      id: 'snap',
      label: 'Snap',
      value: input.snapToGrid ? 'Activo' : 'Off',
      tone: input.snapToGrid ? 'ready' : 'muted',
    },
    {
      id: 'layers',
      label: 'Capas',
      value: `${input.visibleLayerCount}/${input.layerCount}`,
      tone: input.visibleLayerCount > 0 ? 'ready' : 'attention',
    },
    {
      id: 'objects',
      label: 'Objetos',
      value: `${input.barrierCount}M ${input.sourceCount}E ${input.regionCount}Z`,
      tone: input.barrierCount + input.sourceCount + input.regionCount > 0 ? 'ready' : 'attention',
    },
  ];

  return {
    schema: 'radshield-mx.sketchup-canvas-reorg.f214.v1',
    phase: 'F214',
    status: warnings.length ? 'sketchup-canvas-reorg-review' : 'sketchup-canvas-reorg-ready',
    styleMode: 'sketchup-inspired-medical-cad',
    viewportTitle: `Vista ${Math.round(input.scale * 100)}% - herramienta ${input.activeTool || 'select'}`,
    chips,
    axes: [
      { axis: 'X', label: 'Este', color: '#ef4444' },
      { axis: 'Y', label: 'Norte', color: '#22c55e' },
      { axis: 'Z', label: 'Altura', color: '#3b82f6' },
    ],
    viewCubeLabels: ['TOP', 'N', 'E'],
    warnings,
  };
}
