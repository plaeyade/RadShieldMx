export type F217VisualExportSceneId = 'plan' | 'heat' | 'isocontours' | 'structure';

export interface F217VisualExportScene {
  id: F217VisualExportSceneId;
  label: string;
  exportLabel: string;
  target: 'Memoria IA' | 'PDF' | 'Evidence Pack' | 'Anexo estructural';
  requiredEvidence: string;
  ready: boolean;
  warning?: string;
}

export interface F217VisualExportBySceneInput {
  visualMode: F217VisualExportSceneId;
  hasGeometry: boolean;
  hasResults: boolean;
  heatmapPointCount: number;
  sampleLineCount: number;
  barrierCount: number;
}

export interface F217VisualExportBySceneSummary {
  schema: 'radshield-mx.visual-export-by-scene.f217.v1';
  phase: 'F217';
  status: 'visual-export-by-scene-ready' | 'visual-export-by-scene-review';
  activeScene: F217VisualExportSceneId;
  readySceneCount: number;
  scenes: F217VisualExportScene[];
  exportChecklist: string[];
  warnings: string[];
}

export function buildF217VisualExportByScene(input: F217VisualExportBySceneInput): F217VisualExportBySceneSummary {
  const warnings: string[] = [];
  if (!input.hasGeometry) warnings.push('Falta geometria/equipo/zona para que el snapshot sea defendible.');
  if (!input.hasResults) warnings.push('Faltan resultados de calculo para escenas Heat/Iso/Estruct.');

  const scenes: F217VisualExportScene[] = [
    {
      id: 'plan',
      label: 'Planta',
      exportLabel: '01-planta-clinica',
      target: 'Memoria IA',
      requiredEvidence: 'layout, escala, barreras, equipos, zonas y puntos criticos',
      ready: input.hasGeometry,
      warning: input.hasGeometry ? undefined : 'Agrega plano, barrera o fuente.',
    },
    {
      id: 'heat',
      label: 'Heat',
      exportLabel: '02-heatmap-regulatorio',
      target: 'Evidence Pack',
      requiredEvidence: 'heatmap, maximo proxy, umbrales regulatorios y leyenda F212',
      ready: input.hasResults || input.heatmapPointCount > 0,
      warning: input.hasResults || input.heatmapPointCount > 0 ? undefined : 'Calcula blindaje o activa muestreo.',
    },
    {
      id: 'isocontours',
      label: 'Iso',
      exportLabel: '03-isodosis-lineas-muestreo',
      target: 'PDF',
      requiredEvidence: 'lineas de muestreo, gradientes y puntos de maxima dosis',
      ready: input.hasResults || input.sampleLineCount > 0,
      warning: input.hasResults || input.sampleLineCount > 0 ? undefined : 'Requiere lineas de muestreo/resultados.',
    },
    {
      id: 'structure',
      label: 'Estruct',
      exportLabel: '04-material-peso-carga',
      target: 'Anexo estructural',
      requiredEvidence: 'material, espesor, peso, carga estructural y comparador costo/tiempo',
      ready: input.barrierCount > 0,
      warning: input.barrierCount > 0 ? undefined : 'Agrega barreras para evaluar carga.',
    },
  ];

  return {
    schema: 'radshield-mx.visual-export-by-scene.f217.v1',
    phase: 'F217',
    status: warnings.length ? 'visual-export-by-scene-review' : 'visual-export-by-scene-ready',
    activeScene: input.visualMode,
    readySceneCount: scenes.filter((scene) => scene.ready).length,
    scenes,
    exportChecklist: [
      'Preparar escena',
      'Verificar leyenda/escala',
      'Exportar PNG',
      'Adjuntar a Memoria IA/PDF/Evidence Pack',
    ],
    warnings,
  };
}
