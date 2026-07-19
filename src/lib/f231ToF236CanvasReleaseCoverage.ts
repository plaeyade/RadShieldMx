export interface F231ToF236CoverageInput {
  hasVisualBaseline: boolean;
  hasDxfFixtureSmoke: boolean;
  hasCadE2E: boolean;
  hasIsocontourLegend: boolean;
  hasMedical3DHandoff: boolean;
  hasPostDeployGate: boolean;
}

export interface F231ToF236CoverageItem {
  phase: 'F231' | 'F232' | 'F233' | 'F234' | 'F235' | 'F236';
  label: string;
  status: 'ready' | 'guarded';
  evidence: string;
  nextDeepening: string;
}

export interface F231ToF236CanvasReleaseCoverage {
  schema: 'radshield-mx.f231-f236.canvas-release-coverage.v1';
  status: 'canvas-release-coverage-ready' | 'canvas-release-coverage-guarded';
  readyCount: number;
  items: F231ToF236CoverageItem[];
  calculationEngineRecommendations: string[];
}

export function buildF231ToF236CanvasReleaseCoverage(input: F231ToF236CoverageInput): F231ToF236CanvasReleaseCoverage {
  const items: F231ToF236CoverageItem[] = [
    {
      phase: 'F231',
      label: 'pixel diff',
      status: input.hasVisualBaseline ? 'ready' : 'guarded',
      evidence: 'Baseline visual usa capturas F229/F207 para detectar canvas blanco, sidebar perdida o menus sobrepuestos.',
      nextDeepening: 'Agregar comparacion pixel-a-pixel por viewport en CI cuando el renderer quede estable.',
    },
    {
      phase: 'F232',
      label: 'DXF fixture',
      status: input.hasDxfFixtureSmoke ? 'ready' : 'guarded',
      evidence: 'F207 importa DXF sintetico, aplica LINE/LWPOLYLINE al floorplan y conserva canvas/sidebar.',
      nextDeepening: 'Agregar fixtures DXF por LINAC, Gamma Knife, PET/CT y HDR con capas semanticas.',
    },
    {
      phase: 'F233',
      label: 'grip/snap',
      status: input.hasCadE2E ? 'ready' : 'guarded',
      evidence: 'F229 ejercita dibujo, seleccion, ventana/lasso y snapping visible sin reescribir eventos.',
      nextDeepening: 'Medir coordenadas exactas de grip drag y snap endpoint/midpoint/interseccion con event controller v2.',
    },
    {
      phase: 'F234',
      label: 'iso numerico',
      status: input.hasIsocontourLegend ? 'ready' : 'guarded',
      evidence: 'F212/F229 validan modo isocontours y leyenda regulatoria exportable en superficie visual.',
      nextDeepening: 'Convertir proxy visual a polilineas interpoladas con valores, unidades, umbrales y cita normativa.',
    },
    {
      phase: 'F235',
      label: '2D/3D sync',
      status: input.hasMedical3DHandoff ? 'ready' : 'guarded',
      evidence: 'F217/F218/F226/F230 documentan handoff de planta, equipos, espesores y snapshots hacia 3D/reportes.',
      nextDeepening: 'Sincronizar bidireccionalmente seleccion, materiales, zonas y hash de escena entre canvas y visor 3D.',
    },
    {
      phase: 'F236',
      label: 'post deploy',
      status: input.hasPostDeployGate ? 'ready' : 'guarded',
      evidence: 'F200 mantiene URL publica/paquete estatico y F230 exige repetir smoke F154-F158 contra URL final.',
      nextDeepening: 'Ejecutar smoke publico contra la URL final cada vez que se suba un nuevo dist.',
    },
  ];

  const readyCount = items.filter((item) => item.status === 'ready').length;

  return {
    schema: 'radshield-mx.f231-f236.canvas-release-coverage.v1',
    status: readyCount === items.length ? 'canvas-release-coverage-ready' : 'canvas-release-coverage-guarded',
    readyCount,
    items,
    calculationEngineRecommendations: [
      'Separar kernels primario/secundario/neutronico/NM para emitir formulaId, standard, inputs, outputs y warnings por barrera.',
      'Agregar normalizacion unica de unidades para evitar mezclas mm/cm/m, mSv/wk, Gy/wk, uSv/h, kg/m2 y costos.',
      'Versionar TVL/HVL por material/fuente/documento con hash y pagina para Memoria IA y Evidence Pack.',
      'Agregar comparador base vs conservador por barrera para detectar dominancia primaria/secundaria/neutrones.',
      'Elevar QA numerico con casos NCRP/IAEA/UAQ por modalidad antes de declarar certificacion clinica.',
    ],
  };
}
