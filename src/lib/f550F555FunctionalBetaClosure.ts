export type F550F555TrackId =
  | 'connections'
  | 'bim-palette'
  | 'three-r3f'
  | 'babylon'
  | 'unity'
  | 'photoreal'
  | 'deep-renderer'
  | 'calculation-engine';

export type F550F555Status = 'real' | 'gated' | 'missing-assets' | 'needs-e2e';

export interface F550F555Track {
  id: F550F555TrackId;
  phase: 'F550' | 'F551' | 'F552' | 'F553' | 'F554' | 'F555';
  label: string;
  status: F550F555Status;
  realConnection: string;
  reversibleBy: string;
  nextGate: string;
}

export interface F550F555PaletteToken {
  id: string;
  label: string;
  hex: string;
  role: string;
}

export interface F550F555FunctionalBetaClosure {
  schema: 'radshield-mx.f550-f555.functional-beta-closure.v1';
  phaseRange: 'F550-F555';
  releaseStatus: 'beta-functional-gated';
  connectionPolicy: {
    allNewConnectionsMustHaveCallbacks: true;
    allVisualEnginesMustFallbackToThree: true;
    allHeavyAssetsLazyLoaded: true;
    canvasBaseReplacementAllowed: false;
    unityClinicalCalculationAllowed: false;
  };
  tracks: F550F555Track[];
  palette: F550F555PaletteToken[];
  counts: {
    realTracks: number;
    gatedTracks: number;
    missingAssetTracks: number;
    needsE2ETracks: number;
  };
  screenshots: string[];
}

export function buildF550F555FunctionalBetaClosure(options: {
  unityBuildPresent?: boolean;
  heavyPhotorealAssetsPresent?: boolean;
  babylonRuntimePresent?: boolean;
  e2eVisualReady?: boolean;
} = {}): F550F555FunctionalBetaClosure {
  const unityBuildPresent = options.unityBuildPresent ?? false;
  const heavyPhotorealAssetsPresent = options.heavyPhotorealAssetsPresent ?? false;
  const babylonRuntimePresent = options.babylonRuntimePresent ?? true;
  const e2eVisualReady = options.e2eVisualReady ?? false;

  const tracks: F550F555Track[] = [
    {
      id: 'connections',
      phase: 'F550',
      label: 'Conexiones reales y reversibles',
      status: e2eVisualReady ? 'real' : 'needs-e2e',
      realConnection: 'Canvas, ribbon BIM, quick commands, boton derecho, ghost drag y Crear fuente usan callbacks existentes.',
      reversibleBy: 'Git rollback + undo/redo existente + no reemplazo de renderer base.',
      nextGate: 'E2E menu por menu y boton por boton contra URL beta.',
    },
    {
      id: 'bim-palette',
      phase: 'F551',
      label: 'Paleta BIM completa',
      status: 'real',
      realConnection: 'Tokens visibles para workspace, Project Manager, roles de blindaje, modalidades, equipos, heatmap y materiales.',
      reversibleBy: 'Solo clases/contrato visual; rollback por commit sin migrar datos.',
      nextGate: 'Aplicar tokens globales a todos los dialogos CAD/BIM.',
    },
    {
      id: 'three-r3f',
      phase: 'F552',
      label: 'Three/R3F productivo',
      status: 'real',
      realConnection: 'Three/R3F permanece como motor principal/fallback para inspeccion medica 3D.',
      reversibleBy: 'Fallback activo; no depende de Babylon/Unity para abrir la app.',
      nextGate: 'Iluminacion clinica, materiales PBR ligeros y walkthrough visual QA.',
    },
    {
      id: 'babylon',
      phase: 'F553',
      label: 'Babylon profundo',
      status: babylonRuntimePresent ? 'needs-e2e' : 'gated',
      realConnection: 'Runtime/deep contracts existen, pero Babylon no reemplaza Three hasta smoke visual repetido.',
      reversibleBy: 'Lazy import + fallback Three/R3F.',
      nextGate: 'E2E visual de picking, camaras, HUD, overlays y export PNG.',
    },
    {
      id: 'unity',
      phase: 'F554',
      label: 'Unity WebGL real',
      status: unityBuildPresent ? 'needs-e2e' : 'missing-assets',
      realConnection: unityBuildPresent
        ? 'Build Unity WebGL presente para iframe/new-tab controlado.'
        : 'Puente/handoff listo; faltan Build y TemplateData exportados desde Unity.',
      reversibleBy: 'Unity es visor opcional; si falla, Three/R3F sigue funcionando.',
      nextGate: 'Copiar index.html, Build/*.loader/framework/data/wasm y TemplateData; correr E2E.',
    },
    {
      id: 'photoreal',
      phase: 'F554',
      label: 'Fotorealismo pesado',
      status: heavyPhotorealAssetsPresent ? 'needs-e2e' : 'missing-assets',
      realConnection: heavyPhotorealAssetsPresent
        ? 'Texturas/HDRI/decals reales disponibles para carga lazy.'
        : 'Carpetas y manifiesto existen; faltan HDRI, PBR y decals reales.',
      reversibleBy: 'Assets visuales no modifican TVL, densidad, costos, calculos ni citas.',
      nextGate: 'Agregar assets versionados y screenshot QA de materiales.',
    },
    {
      id: 'deep-renderer',
      phase: 'F555',
      label: 'Renderer profundo',
      status: 'gated',
      realConnection: 'Renderer v2 opera como overlay pointer-events:none; no toma eventos ni sustituye CanvasArea/useCanvas.',
      reversibleBy: 'Apagar overlay/flag y volver al canvas estable.',
      nextGate: 'Migrar eventos base solo en rama/staging con F197/F207/F229/F446 repetidos.',
    },
    {
      id: 'calculation-engine',
      phase: 'F555',
      label: 'Motor de calculo',
      status: 'gated',
      realConnection: 'QA normativo y DB material versionada existen como gates; no declarar certificacion clinica.',
      reversibleBy: 'Casos QA/DB seed son auditables; cambios de calculo deben mantener comparador base/conservador.',
      nextGate: 'Mas casos NCRP/IAEA/UAQ reales, dataset ENDF/XCOM/ICRU versionado y Evidence Pack por formula.',
    },
  ];

  const palette: F550F555PaletteToken[] = [
    { id: 'workspace', label: 'Workspace BIM', hex: '#eef3ec', role: 'fondo tecnico verde grisaceo' },
    { id: 'project-manager', label: 'Project Manager', hex: '#17202a', role: 'panel oscuro de arbol BIM' },
    { id: 'panel', label: 'Panel marfil', hex: '#fffdf8', role: 'tarjetas y formularios de operacion' },
    { id: 'accent', label: 'Snap/OK', hex: '#238a61', role: 'accion segura y estado listo' },
    { id: 'tx', label: 'TX', hex: '#f6d8ce', role: 'radioterapia/LINAC/Gamma Knife' },
    { id: 'nm', label: 'NM', hex: '#dcebf7', role: 'medicina nuclear/PET' },
    { id: 'dx', label: 'DX', hex: '#fff2bd', role: 'diagnostico RX/CT' },
    { id: 'cy', label: 'CY', hex: '#eee8ed', role: 'ciclotron/radiofarmacia' },
    { id: 'primary', label: 'Primaria', hex: '#ef4444', role: 'barrera primaria' },
    { id: 'secondary', label: 'Secundaria', hex: '#f59e0b', role: 'scatter/leakage' },
    { id: 'maze', label: 'Laberinto', hex: '#38bdf8', role: 'ruta indirecta' },
    { id: 'door', label: 'Puerta', hex: '#8b5cf6', role: 'puerta blindada' },
    { id: 'penetration', label: 'Penetracion', hex: '#fb7185', role: 'MEP/huecos/sleeves' },
    { id: 'heatmap-high', label: 'Heat alto', hex: '#dc2626', role: 'umbral regulatorio alto' },
    { id: 'concrete-hd', label: 'Concreto HD', hex: '#9ca3af', role: 'material estructural blindante' },
    { id: 'lead', label: 'Plomo', hex: '#64748b', role: 'lamina/plomo' },
  ];

  const counts = {
    realTracks: tracks.filter((track) => track.status === 'real').length,
    gatedTracks: tracks.filter((track) => track.status === 'gated').length,
    missingAssetTracks: tracks.filter((track) => track.status === 'missing-assets').length,
    needsE2ETracks: tracks.filter((track) => track.status === 'needs-e2e').length,
  };

  return {
    schema: 'radshield-mx.f550-f555.functional-beta-closure.v1',
    phaseRange: 'F550-F555',
    releaseStatus: 'beta-functional-gated',
    connectionPolicy: {
      allNewConnectionsMustHaveCallbacks: true,
      allVisualEnginesMustFallbackToThree: true,
      allHeavyAssetsLazyLoaded: true,
      canvasBaseReplacementAllowed: false,
      unityClinicalCalculationAllowed: false,
    },
    tracks,
    palette,
    counts,
    screenshots: [
      'outputs/f550_f555_beta_functional_closure/01_canvas_bim_palette.png',
      'outputs/f550_f555_beta_functional_closure/02_ghost_source_commit.png',
    ],
  };
}
