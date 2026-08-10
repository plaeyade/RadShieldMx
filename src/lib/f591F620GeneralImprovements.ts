export type F591F620InspectorMode = 'compact' | 'expanded';

export type F591F620TrackStatus =
  | 'implemented'
  | 'ready'
  | 'gated'
  | 'requires-db'
  | 'requires-real-cases';

export interface F591F620Track {
  id: string;
  phaseRange: string;
  label: string;
  status: F591F620TrackStatus;
  impact: string;
  implementedNow: string;
  nextAction: string;
  rollback: string;
}

export interface F591F620GeneralImprovements {
  schema: 'radshield-mx.general-improvements.f591-f620.v1';
  phaseRange: 'F591-F620';
  status: 'general-improvements-active';
  inspectorMode: F591F620InspectorMode;
  summary: {
    totalTracks: number;
    implementedTracks: number;
    gatedTracks: number;
    releaseCriticalTracks: number;
  };
  gates: {
    canvasDecluttered: boolean;
    qaInspectorDefaultCompact: boolean;
    unityVisualOnly: boolean;
    dbLiveRequiredForClinicalClaims: boolean;
    realMemoriesRequiredForClinicalQa: boolean;
    clinicalCertification: false;
  };
  uiPolicy: {
    defaultQaInspectorMode: 'compact';
    canExpandDetailedQa: boolean;
    doesNotReplaceRenderer: boolean;
    keepsExistingCanvasEvents: boolean;
  };
  tracks: F591F620Track[];
  screenshots: string[];
}

interface BuildF591F620Input {
  inspectorMode?: F591F620InspectorMode;
  canvasPanelsVisible?: boolean;
  unity?: {
    releaseRules?: {
      canClaimUnityRealRuntime?: boolean;
      canClaimCompleteRegulatoryDb?: boolean;
    };
  };
  numericQa?: {
    summary?: {
      totalCases?: number;
      passedCases?: number;
    };
  };
  datasetQa?: {
    summary?: {
      totalCases?: number;
      dbSeedRequired?: number;
      clinicalBlocked?: number;
    };
  };
}

const BASE_TRACKS: F591F620Track[] = [
  {
    id: 'canvas-qa-inspector',
    phaseRange: 'F591-F595',
    label: 'Canvas limpio + inspector QA compacto',
    status: 'implemented',
    impact: 'Reduce saturacion lateral sin eliminar evidencia QA ni capturas.',
    implementedNow: 'Inspector F550-F590 queda compacto por defecto y expandible para auditoria.',
    nextAction: 'Usar modo expandido solo durante QA, capturas y revision de release.',
    rollback: 'localStorage radshield_canvas_qa_inspector_mode_f591=expanded muestra todo como antes.',
  },
  {
    id: 'db-live-route',
    phaseRange: 'F596-F600',
    label: 'Ruta DB real antes de claims clinicos',
    status: 'requires-db',
    impact: 'Evita llamar certificada una base que aun depende de seeds/fixtures.',
    implementedNow: 'Update Center y canvas exponen gate DB/document_chunks/restore probe.',
    nextAction: 'Ejecutar seed live, deduplicacion, restore probe y readback con hashes.',
    rollback: 'Mantener beta estatica/offline sin claims clinicos certificados.',
  },
  {
    id: 'real-memory-qa',
    phaseRange: 'F601-F605',
    label: 'QA numerico contra memorias reales',
    status: 'requires-real-cases',
    impact: 'Convierte NCRP/IAEA/UAQ en comparaciones practicas contra LINAC, GK, PET, HDR y ciclotron.',
    implementedNow: 'Se declara como ruta prioritaria y se enlaza a Memoria IA/Evidence Pack.',
    nextAction: 'Promover memorias aprobadas a casos fixture con input/output/cita/pagina/hash.',
    rollback: 'Mantener casos como preliminares y no firmables.',
  },
  {
    id: 'unity-visual-only',
    phaseRange: 'F606-F610',
    label: 'Unity como visualizador, no motor de calculo',
    status: 'gated',
    impact: 'Permite integrar Unity WebGL sin riesgo de alterar calculos o trazabilidad.',
    implementedNow: 'Regla explicita: Unity no firma calculos y requiere build exportado real.',
    nextAction: 'Copiar build Unity WebGL exportado a public/unity/radshield y repetir smoke.',
    rollback: 'Fallback a Three/R3F y Babylon parity card.',
  },
  {
    id: 'memoria-ia-workflow',
    phaseRange: 'F611-F615',
    label: 'Memoria IA paso a paso productiva',
    status: 'implemented',
    impact: 'Obliga flujo plano -> equipo -> barreras -> calculo -> cita -> evidencia -> PDF.',
    implementedNow: 'Panel operativo en Memoria IA con advertencia de FM/RSO y evidencia requerida.',
    nextAction: 'Vincular cada parrafo generado a citationId, sourceHash, chunkHash y output calculado.',
    rollback: 'Exportar borrador preliminar con warnings visibles.',
  },
  {
    id: 'release-consolidation',
    phaseRange: 'F616-F620',
    label: 'Consolidacion antes de nuevas funciones grandes',
    status: 'ready',
    impact: 'Prioriza estabilidad, capturas, rollback y documentacion sobre crecer menus.',
    implementedNow: 'F591-F620 queda visible en canvas, Update Center, manuales y tests.',
    nextAction: 'Repetir smoke F197/F207/F229/F231-F236/F200 antes de publicar dist.',
    rollback: 'Volver a build beta anterior sin perdida de datos de proyecto.',
  },
];

export function buildF591F620GeneralImprovements(input: BuildF591F620Input = {}): F591F620GeneralImprovements {
  const inspectorMode = input.inspectorMode ?? 'compact';
  const tracks = BASE_TRACKS.map((track) => {
    if (track.id === 'unity-visual-only' && input.unity?.releaseRules?.canClaimUnityRealRuntime) {
      return { ...track, status: 'ready' as const, implementedNow: 'Unity build real detectado; sigue limitado a visual evidence.' };
    }
    if (track.id === 'db-live-route' && input.unity?.releaseRules?.canClaimCompleteRegulatoryDb) {
      return { ...track, status: 'ready' as const, implementedNow: 'DB tecnica reportada lista; aun requiere QA clinico firmado.' };
    }
    return track;
  });

  return {
    schema: 'radshield-mx.general-improvements.f591-f620.v1',
    phaseRange: 'F591-F620',
    status: 'general-improvements-active',
    inspectorMode,
    summary: {
      totalTracks: tracks.length,
      implementedTracks: tracks.filter((track) => track.status === 'implemented' || track.status === 'ready').length,
      gatedTracks: tracks.filter((track) => track.status === 'gated' || track.status === 'requires-db' || track.status === 'requires-real-cases').length,
      releaseCriticalTracks: 4,
    },
    gates: {
      canvasDecluttered: inspectorMode === 'compact' && input.canvasPanelsVisible !== true,
      qaInspectorDefaultCompact: true,
      unityVisualOnly: true,
      dbLiveRequiredForClinicalClaims: true,
      realMemoriesRequiredForClinicalQa: true,
      clinicalCertification: false,
    },
    uiPolicy: {
      defaultQaInspectorMode: 'compact',
      canExpandDetailedQa: true,
      doesNotReplaceRenderer: true,
      keepsExistingCanvasEvents: true,
    },
    tracks,
    screenshots: [
      'outputs/f591_f620_general_improvements/00_general_improvements_panel.png',
      'outputs/f591_f620_general_improvements/01_general_improvements_compact_canvas.png',
      'outputs/f591_f620_general_improvements/02_general_improvements_expanded_canvas.png',
      'outputs/f591_f620_general_improvements/03_general_improvements_memoria_ia.png',
    ],
  };
}

export function formatF591F620GeneralImprovementsMarkdown(summary = buildF591F620GeneralImprovements()): string {
  return [
    `# ${summary.phaseRange} - Mejoras generales prioritarias`,
    '',
    `Estado: ${summary.status}`,
    `Inspector QA: ${summary.inspectorMode}`,
    `Tracks: ${summary.summary.implementedTracks}/${summary.summary.totalTracks} listos; ${summary.summary.gatedTracks} con gate.`,
    '',
    ...summary.tracks.map((track) => `- ${track.phaseRange} ${track.label}: ${track.status}. ${track.implementedNow} Siguiente: ${track.nextAction}`),
    '',
    'Gates: DB real, memorias reales y revision FM/RSO siguen requeridas para claims clinicos certificados.',
  ].join('\n');
}
