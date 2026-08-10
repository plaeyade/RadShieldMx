import type { F550F555FunctionalBetaClosure } from '@/lib/f550F555FunctionalBetaClosure';
import type { F520F524DeepRendererBabylonContract } from '@/lib/f520F524DeepRendererBabylon';
import type { F484F490NormativeQaContract } from '@/lib/f484F490NormativeQa';
import type { AdvancedPhotorealPackContract } from '@/lib/medical3D/advancedPhotorealPack';
import type { PbrMaterialDatabase } from '@/lib/medical3D/pbrMaterialDatabase';
import type { UnityWebglExportedBuildContract } from '@/lib/medical3D/unityWebglExportedBuild';

export type F556F560LaneId = 'renderer-v2' | 'babylon' | 'unity' | 'technical-db' | 'normative-qa';
export type F556F560LaneStatus = 'ready' | 'preview' | 'gated' | 'blocked';

export interface F556F560Lane {
  id: F556F560LaneId;
  phase: 'F556' | 'F557' | 'F558' | 'F559' | 'F560';
  label: string;
  status: F556F560LaneStatus;
  evidence: string;
  nextGate: string;
}

export interface F556F560PostBetaDeepStack {
  schema: 'radshield-mx.f556-f560.post-beta-deep-stack.v1';
  phaseRange: 'F556-F560';
  status: 'post-beta-deep-ready' | 'post-beta-deep-preview' | 'post-beta-deep-gated';
  lanes: F556F560Lane[];
  matrix: {
    ready: number;
    preview: number;
    gated: number;
    blocked: number;
  };
  activationRules: {
    rendererBaseV2CanReplaceCanvas: false;
    babylonCanBecomePrimaryRenderer: false;
    unityCanAuthorClinicalCalculations: false;
    heavyPhotorealCanAffectTechnicalValues: false;
    qaMustPassBeforeClinicalRelease: true;
  };
  visualStack: {
    threeFallback: 'required';
    babylonRuntime: string;
    unityBuild: UnityWebglExportedBuildContract['status'];
    photorealTier: AdvancedPhotorealPackContract['assetTier'];
    pbrMaterials: number;
  };
  technicalDb: {
    pbrMaterials: number;
    version: string;
    needsFullEndfXcomIcru: true;
    requiredCollections: string[];
  };
  normativeQa: {
    status: F484F490NormativeQaContract['status'];
    passedCases: number;
    totalCases: number;
    standardsCovered: string[];
    releaseDecision: F484F490NormativeQaContract['releaseGate']['decision'];
  };
  rollback: string[];
}

function countByStatus(lanes: F556F560Lane[]) {
  return {
    ready: lanes.filter((lane) => lane.status === 'ready').length,
    preview: lanes.filter((lane) => lane.status === 'preview').length,
    gated: lanes.filter((lane) => lane.status === 'gated').length,
    blocked: lanes.filter((lane) => lane.status === 'blocked').length,
  };
}

export function buildF556F560PostBetaDeepStack(params: {
  betaClosure: F550F555FunctionalBetaClosure;
  deepRenderer: F520F524DeepRendererBabylonContract;
  unity: UnityWebglExportedBuildContract;
  photoreal: AdvancedPhotorealPackContract;
  pbrDb: PbrMaterialDatabase;
  normativeQa: F484F490NormativeQaContract;
}): F556F560PostBetaDeepStack {
  const { betaClosure, deepRenderer, unity, photoreal, pbrDb, normativeQa } = params;
  const hasUnityBuild = unity.status !== 'export-folder-required';
  const babylonPreviewReady = deepRenderer.babylon.status === 'deep-runtime-ready';
  const rendererOverlayReady = deepRenderer.rendererV2.status === 'renderer-v2-runtime-ready'
    || deepRenderer.rendererV2.status === 'renderer-v2-runtime-preview';
  const qaPass = normativeQa.status === 'qa-pass';

  const lanes: F556F560Lane[] = [
    {
      id: 'renderer-v2',
      phase: 'F556',
      label: 'Renderer base v2',
      status: rendererOverlayReady ? 'preview' : 'gated',
      evidence: `Overlay ${deepRenderer.rendererV2.activationMode}; ${deepRenderer.rendererV2.instructions} instrucciones; CanvasArea/useCanvas intactos.`,
      nextGate: 'Migrar event controller en staging y repetir F197/F207/F229/F446 antes de sustituir eventos base.',
    },
    {
      id: 'babylon',
      phase: 'F557',
      label: 'Babylon real profundo',
      status: babylonPreviewReady ? 'preview' : 'gated',
      evidence: `${deepRenderer.babylon.pickableEntities} entidades pickables; camaras ${deepRenderer.babylon.cameraModes.join(', ') || 'pendientes'}.`,
      nextGate: 'E2E de picking, HUD, camaras, overlays, export PNG y fallback Three/R3F.',
    },
    {
      id: 'unity',
      phase: 'F558',
      label: 'Unity WebGL real',
      status: hasUnityBuild ? 'preview' : 'blocked',
      evidence: hasUnityBuild
        ? `Build listo por ${unity.source}; visor ${unity.viewerUrl ?? unity.publicPath}.`
        : `Falta carpeta exportada ${unity.localFolder} con Build y TemplateData.`,
      nextGate: 'Copiar build Unity real, activar env, correr smoke iframe/new-tab y confirmar postMessage.',
    },
    {
      id: 'technical-db',
      phase: 'F559',
      label: 'DB tecnica completa',
      status: pbrDb.records.length >= 6 ? 'preview' : 'gated',
      evidence: `${pbrDb.records.length} materiales PBR/tecnicos; version ${pbrDb.version}; ENDF/XCOM/ICRU completo pendiente.`,
      nextGate: 'Versionar colecciones ENDF/XCOM/ICRU, hashes, paginas, energia, mezcla, densidad y TVL por material.',
    },
    {
      id: 'normative-qa',
      phase: 'F560',
      label: 'QA normativo ampliado',
      status: qaPass ? 'ready' : 'gated',
      evidence: `${normativeQa.summary.passedCases}/${normativeQa.summary.totalCases} casos pasan; ${normativeQa.summary.standardsCovered.join(', ')}.`,
      nextGate: 'Agregar casos reales por barrera/penetracion/ocupacion y comparador contra memorias analiticas firmadas.',
    },
  ];

  const matrix = countByStatus(lanes);
  const status = matrix.blocked > 0 || matrix.gated > 1
    ? 'post-beta-deep-gated'
    : matrix.preview > 0
      ? 'post-beta-deep-preview'
      : 'post-beta-deep-ready';

  return {
    schema: 'radshield-mx.f556-f560.post-beta-deep-stack.v1',
    phaseRange: 'F556-F560',
    status,
    lanes,
    matrix,
    activationRules: {
      rendererBaseV2CanReplaceCanvas: false,
      babylonCanBecomePrimaryRenderer: false,
      unityCanAuthorClinicalCalculations: false,
      heavyPhotorealCanAffectTechnicalValues: false,
      qaMustPassBeforeClinicalRelease: true,
    },
    visualStack: {
      threeFallback: 'required',
      babylonRuntime: deepRenderer.babylon.status,
      unityBuild: unity.status,
      photorealTier: photoreal.assetTier,
      pbrMaterials: pbrDb.records.length,
    },
    technicalDb: {
      pbrMaterials: pbrDb.records.length,
      version: pbrDb.version,
      needsFullEndfXcomIcru: true,
      requiredCollections: [
        'XCOM photon attenuation by element/material/mixture',
        'ICRU/NIST material density and composition profiles',
        'ENDF neutron/photon nuclear data for high-energy and cyclotron workflows',
        'Vendor material TVL/density/cost/structural load with page/hash evidence',
      ],
    },
    normativeQa: {
      status: normativeQa.status,
      passedCases: normativeQa.summary.passedCases,
      totalCases: normativeQa.summary.totalCases,
      standardsCovered: normativeQa.summary.standardsCovered,
      releaseDecision: normativeQa.releaseGate.decision,
    },
    rollback: [
      `Volver a beta closure ${betaClosure.phaseRange} y Three/R3F fallback.`,
      'Mantener CanvasArea/useCanvas como fuente de verdad hasta renderer/event controller v2 validado.',
      'Desactivar Babylon/Unity/photoreal pesados sin tocar calculos ni DB tecnica.',
      'No cambiar TVL/densidad/costos por apariencia PBR.',
    ],
  };
}
