export type F215CanvasSceneMode = 'plan' | 'heat' | 'isocontours' | 'structure' | 'extents';

export interface F215CanvasScenePreset {
  id: F215CanvasSceneMode;
  label: string;
  shortLabel: string;
  description: string;
  action: 'visual-mode' | 'zoom-extents';
  tone: 'drafting' | 'dose' | 'review' | 'structure' | 'navigation';
  ready: boolean;
}

export interface F215CanvasScenePresetsInput {
  visualMode: Exclude<F215CanvasSceneMode, 'extents'>;
  hasResults: boolean;
  barrierCount: number;
  sourceCount: number;
  regionCount: number;
  sampleLineCount: number;
  heatmapPointCount: number;
}

export interface F215CanvasScenePresetsSummary {
  schema: 'radshield-mx.canvas-scene-presets.f215.v1';
  phase: 'F215';
  status: 'canvas-scene-presets-ready' | 'canvas-scene-presets-review';
  activeScene: Exclude<F215CanvasSceneMode, 'extents'>;
  readyPresetCount: number;
  totalPresetCount: number;
  presets: F215CanvasScenePreset[];
  warnings: string[];
}

export function buildF215CanvasScenePresets(input: F215CanvasScenePresetsInput): F215CanvasScenePresetsSummary {
  const hasGeometry = input.barrierCount + input.sourceCount + input.regionCount > 0;
  const warnings: string[] = [];
  if (!hasGeometry) warnings.push('Agrega geometria, fuente o zona para que las escenas tengan evidencia clinica.');
  if (!input.hasResults) warnings.push('Calcula blindaje para habilitar lectura completa de heatmap/isodosis.');

  const presets: F215CanvasScenePreset[] = [
    {
      id: 'plan',
      label: 'Planta clinica',
      shortLabel: 'Planta',
      description: 'Vista limpia para trazar muros, equipos, zonas controladas y puntos criticos.',
      action: 'visual-mode',
      tone: 'drafting',
      ready: true,
    },
    {
      id: 'heat',
      label: 'Mapa de calor',
      shortLabel: 'Heat',
      description: 'Activa heatmap para revisar intensidad relativa de dosis y maxima proxy semanal.',
      action: 'visual-mode',
      tone: 'dose',
      ready: input.heatmapPointCount > 0 || input.hasResults,
    },
    {
      id: 'isocontours',
      label: 'Isodosis',
      shortLabel: 'Iso',
      description: 'Muestra lineas de muestreo/isocontornos para revisar gradientes y puntos maximos.',
      action: 'visual-mode',
      tone: 'review',
      ready: input.sampleLineCount > 0 || input.hasResults,
    },
    {
      id: 'structure',
      label: 'Estructura',
      shortLabel: 'Estruct',
      description: 'Prioriza peso, espesor, material y carga estructural del blindaje.',
      action: 'visual-mode',
      tone: 'structure',
      ready: input.barrierCount > 0,
    },
    {
      id: 'extents',
      label: 'Zoom extents',
      shortLabel: 'Extents',
      description: 'Recupera y centra el plano completo si la vista se desplazo o parece vacia.',
      action: 'zoom-extents',
      tone: 'navigation',
      ready: true,
    },
  ];

  return {
    schema: 'radshield-mx.canvas-scene-presets.f215.v1',
    phase: 'F215',
    status: hasGeometry ? 'canvas-scene-presets-ready' : 'canvas-scene-presets-review',
    activeScene: input.visualMode,
    readyPresetCount: presets.filter((preset) => preset.ready).length,
    totalPresetCount: presets.length,
    presets,
    warnings,
  };
}
