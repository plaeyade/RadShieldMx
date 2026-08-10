import type { F556F560PostBetaDeepStack } from '@/lib/f556F560PostBetaDeepStack';
import type { F561F565EventControllerV2Stack } from '@/lib/f561F565RendererEventControllerV2';

export type F566F570TrackId =
  | 'visual-snapshot'
  | 'real-connection-readiness'
  | 'heavy-asset-intake'
  | 'reversible-activation'
  | 'production-smoke';

export type F566F570TrackStatus = 'ready' | 'preview' | 'gated' | 'blocked';

export interface F566F570Track {
  id: F566F570TrackId;
  phase: 'F566' | 'F567' | 'F568' | 'F569' | 'F570';
  label: string;
  status: F566F570TrackStatus;
  evidence: string;
  nextAction: string;
}

export interface F566F570PostBetaProductionReadiness {
  schema: 'radshield-mx.f566-f570.post-beta-production-readiness.v1';
  phaseRange: 'F566-F570';
  status: 'production-readiness-preview' | 'production-readiness-gated';
  tracks: F566F570Track[];
  matrix: {
    ready: number;
    preview: number;
    gated: number;
    blocked: number;
  };
  activationMatrix: {
    rendererBaseV2: 'observable-only';
    babylonDeep: 'preview-with-three-fallback';
    unityWebgl: 'external-build-required';
    photorealism: 'visual-only-no-technical-values';
    technicalDb: 'versioned-datasets-required';
    normativeQa: 'required-before-clinical-claim';
  };
  releaseRules: {
    canPublishStaticBeta: boolean;
    canReplaceCanvasRenderer: false;
    canClaimClinicalMonteCarlo: false;
    canUseUnityForSignedCalculations: false;
    mustKeepRollback: true;
  };
  requiredScreenshots: string[];
  rollback: string[];
}

function countByStatus(tracks: F566F570Track[]) {
  return {
    ready: tracks.filter((track) => track.status === 'ready').length,
    preview: tracks.filter((track) => track.status === 'preview').length,
    gated: tracks.filter((track) => track.status === 'gated').length,
    blocked: tracks.filter((track) => track.status === 'blocked').length,
  };
}

export function buildF566F570PostBetaProductionReadiness(params: {
  postBeta: F556F560PostBetaDeepStack;
  eventController: F561F565EventControllerV2Stack;
  visualScreenshotsReady: boolean;
  publicBetaAlreadyTested: boolean;
}): F566F570PostBetaProductionReadiness {
  const { postBeta, eventController, visualScreenshotsReady, publicBetaAlreadyTested } = params;
  const pointerHarnessReady = eventController.eventHarness.pointerWrappersActive
    && eventController.eventHarness.stableHandlersStillCanonical;
  const qaReady = eventController.qa.passedScenarioCount === eventController.qa.totalScenarioCount;
  const unityBlocked = postBeta.lanes.some((lane) => lane.id === 'unity' && lane.status === 'blocked');
  const technicalDbGated = postBeta.technicalDb.needsFullEndfXcomIcru;
  const normativeQaReady = postBeta.normativeQa.releaseDecision !== 'block';

  const tracks: F566F570Track[] = [
    {
      id: 'visual-snapshot',
      phase: 'F566',
      label: 'Snapshot visual obligatorio',
      status: visualScreenshotsReady ? 'ready' : 'gated',
      evidence: visualScreenshotsReady
        ? 'Captura dedicada del panel y capturas de canvas/event controller generadas en outputs.'
        : 'Faltan capturas dedicadas de panel/canvas antes de publicar cambios visuales.',
      nextAction: 'Guardar captura de panel, canvas y accion pointer para cada release post-beta.',
    },
    {
      id: 'real-connection-readiness',
      phase: 'F567',
      label: 'Conexiones reales reversibles',
      status: pointerHarnessReady && qaReady ? 'ready' : 'gated',
      evidence: `Event controller ${eventController.status}; QA ${eventController.qa.passedScenarioCount}/${eventController.qa.totalScenarioCount}; overlay pointer-events none.`,
      nextAction: 'Antes de tocar renderer base, repetir F197/F207/F229/F446/F561 E2E.',
    },
    {
      id: 'heavy-asset-intake',
      phase: 'F568',
      label: 'Assets pesados y motores externos',
      status: unityBlocked || technicalDbGated ? 'blocked' : 'preview',
      evidence: unityBlocked
        ? 'Unity WebGL real sigue bloqueado hasta copiar build exportado; DB tecnica ENDF/XCOM/ICRU sigue incompleta.'
        : `Unity ${postBeta.visualStack.unityBuild}; PBR ${postBeta.visualStack.pbrMaterials}; fotoreal ${postBeta.visualStack.photorealTier}.`,
      nextAction: 'Copiar build Unity real y datasets versionados antes de reclamar capacidad productiva profunda.',
    },
    {
      id: 'reversible-activation',
      phase: 'F569',
      label: 'Activacion reversible',
      status: 'preview',
      evidence: 'Renderer v2, Babylon, Unity y PBR siguen detras de fallback Three/R3F y reglas no clinicas.',
      nextAction: 'Mantener feature-gate operacional aunque staging full este activo; documentar rollback por lane.',
    },
    {
      id: 'production-smoke',
      phase: 'F570',
      label: 'Smoke productivo post-beta',
      status: publicBetaAlreadyTested && normativeQaReady ? 'preview' : 'gated',
      evidence: publicBetaAlreadyTested
        ? `Beta publica probada; QA normativo ${postBeta.normativeQa.passedCases}/${postBeta.normativeQa.totalCases}.`
        : 'Falta repetir smoke contra URL publica despues de empaquetar dist.',
      nextAction: 'Repetir build, smoke URL, capturas y manuales antes de release post-beta.',
    },
  ];

  const matrix = countByStatus(tracks);

  return {
    schema: 'radshield-mx.f566-f570.post-beta-production-readiness.v1',
    phaseRange: 'F566-F570',
    status: matrix.blocked > 0 || matrix.gated > 1
      ? 'production-readiness-gated'
      : 'production-readiness-preview',
    tracks,
    matrix,
    activationMatrix: {
      rendererBaseV2: 'observable-only',
      babylonDeep: 'preview-with-three-fallback',
      unityWebgl: 'external-build-required',
      photorealism: 'visual-only-no-technical-values',
      technicalDb: 'versioned-datasets-required',
      normativeQa: 'required-before-clinical-claim',
    },
    releaseRules: {
      canPublishStaticBeta: publicBetaAlreadyTested && pointerHarnessReady,
      canReplaceCanvasRenderer: false,
      canClaimClinicalMonteCarlo: false,
      canUseUnityForSignedCalculations: false,
      mustKeepRollback: true,
    },
    requiredScreenshots: [
      '00_post_beta_readiness_panel.png',
      '01_post_beta_readiness_canvas.png',
      '02_post_beta_readiness_event_action.png',
    ],
    rollback: [
      'Volver a Three/R3F y CanvasArea/useCanvas como ruta canonica.',
      'Ocultar panel F566-F570 sin tocar calculos, DB ni fuentes.',
      'Mantener Unity como link/iframe gated hasta build real.',
      'Mantener datasets ENDF/XCOM/ICRU como requisito antes de claims clinicos.',
    ],
  };
}
