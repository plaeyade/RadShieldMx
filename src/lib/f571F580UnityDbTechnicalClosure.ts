import type { F491F498RegulatoryMaterialsDb } from '@/lib/f491F498RegulatoryMaterialsDb';
import type { F501F504HeavyAssetsDbPrep } from '@/lib/f501F504HeavyAssetsDbPrep';
import type { UnityWebglExportedBuildContract } from '@/lib/medical3D/unityWebglExportedBuild';

export type F571F580TrackId =
  | 'unity-build-intake'
  | 'unity-runtime-bridge'
  | 'unity-qa-evidence'
  | 'technical-db-registry'
  | 'technical-db-release-gate';

export type F571F580TrackStatus = 'ready' | 'preview' | 'gated' | 'blocked';

export interface F571F580Track {
  id: F571F580TrackId;
  phase: 'F571' | 'F572' | 'F573' | 'F574' | 'F575' | 'F576' | 'F577' | 'F578' | 'F579' | 'F580';
  label: string;
  status: F571F580TrackStatus;
  evidence: string;
  requiredAction: string;
}

export interface F571F580UnityDbTechnicalClosure {
  schema: 'radshield-mx.f571-f580.unity-db-technical-closure.v1';
  phaseRange: 'F571-F580';
  status: 'unity-db-ready' | 'unity-db-gated' | 'unity-build-blocked';
  unity: {
    liveBuildReady: boolean;
    source: UnityWebglExportedBuildContract['source'];
    status: UnityWebglExportedBuildContract['status'];
    publicPath: UnityWebglExportedBuildContract['publicPath'];
    expectedFiles: string[];
    missing: string[];
    launchMode: UnityWebglExportedBuildContract['bridge']['launchMode'];
    boundary: UnityWebglExportedBuildContract['bridge']['visualOnlyBoundary'];
  };
  technicalDb: {
    status: F491F498RegulatoryMaterialsDb['status'];
    tables: string[];
    totalSources: number;
    totalMaterials: number;
    calculationAllowedMaterials: number;
    reviewRequiredMaterials: number;
    requiredCollections: string[];
  };
  tracks: F571F580Track[];
  releaseRules: {
    canUseUnityViewer: boolean;
    canClaimUnityRealRuntime: boolean;
    canSeedLiveDb: false;
    canClaimCompleteRegulatoryDb: boolean;
    canClaimClinicalCertifiedCalculation: false;
  };
  requiredScreenshots: string[];
  rollback: string[];
}

function buildUnityMissing(unity: UnityWebglExportedBuildContract, prep: F501F504HeavyAssetsDbPrep): string[] {
  if (unity.status !== 'export-folder-required') return [];
  return prep.unityMissing;
}

export function buildF571F580UnityDbTechnicalClosure(params: {
  unity: UnityWebglExportedBuildContract;
  regulatoryDb: F491F498RegulatoryMaterialsDb;
  heavyAssetsDbPrep: F501F504HeavyAssetsDbPrep;
}): F571F580UnityDbTechnicalClosure {
  const { unity, regulatoryDb, heavyAssetsDbPrep } = params;
  const unityMissing = buildUnityMissing(unity, heavyAssetsDbPrep);
  const liveBuildReady = unity.status !== 'export-folder-required';
  const dbSchemaReady = heavyAssetsDbPrep.database.requiredTables.every((table) => regulatoryDb.databaseRoute.tables.includes(table));
  const dbCompleteEnoughForBeta = dbSchemaReady && regulatoryDb.summary.totalMaterials > 0 && regulatoryDb.summary.totalSources > 0;
  const dbCompleteForClaim = regulatoryDb.status === 'versioned-db-ready'
    && regulatoryDb.summary.reviewRequiredMaterials === 0
    && regulatoryDb.summary.blockedMaterials === 0;

  const tracks: F571F580Track[] = [
    {
      id: 'unity-build-intake',
      phase: 'F571',
      label: 'Unity WebGL build exportado',
      status: liveBuildReady ? 'ready' : 'blocked',
      evidence: liveBuildReady
        ? `Unity source ${unity.source}; visor ${unity.viewerUrl ?? unity.publicPath}.`
        : `Falta build real en ${unity.localFolder}: ${unityMissing.slice(0, 3).join(', ')}.`,
      requiredAction: 'Exportar desde Unity como WebGL y copiar index.html, Build y TemplateData en public/unity/radshield-medical-3d.',
    },
    {
      id: 'unity-runtime-bridge',
      phase: 'F572',
      label: 'Bridge runtime Unity/RadShield',
      status: liveBuildReady ? 'preview' : 'gated',
      evidence: `${unity.bridge.handoffFormat}; eventos ${unity.bridge.postMessageEvents.join(', ')}.`,
      requiredAction: 'Validar postMessage scene-ready, snapshot-request y camera-bookmark contra build real.',
    },
    {
      id: 'unity-qa-evidence',
      phase: 'F575',
      label: 'QA visual Unity',
      status: liveBuildReady ? 'preview' : 'gated',
      evidence: liveBuildReady
        ? 'Se requiere captura iframe/new-tab y roundtrip de escena.'
        : 'Sin build real solo se valida contrato, no runtime Unity.',
      requiredAction: 'Generar captura de visor Unity cargado y manifiesto de bridge.',
    },
    {
      id: 'technical-db-registry',
      phase: 'F576',
      label: 'DB tecnica regulatoria/materiales',
      status: dbCompleteEnoughForBeta ? 'preview' : 'blocked',
      evidence: `${regulatoryDb.summary.totalSources} fuentes; ${regulatoryDb.summary.totalMaterials} materiales; ${regulatoryDb.summary.calculationAllowedMaterials} con uso calculo.`,
      requiredAction: 'Mantener F499/F500/F505/F506-F509 antes de live seed y readback.',
    },
    {
      id: 'technical-db-release-gate',
      phase: 'F580',
      label: 'Gate DB completa',
      status: dbCompleteForClaim ? 'ready' : 'gated',
      evidence: dbCompleteForClaim
        ? 'DB versionada lista para claims tecnicos controlados.'
        : `${regulatoryDb.summary.reviewRequiredMaterials} materiales requieren revision; datasets ENDF/XCOM/ICRU completos siguen requeridos.`,
      requiredAction: 'Versionar datasets completos, resolver review-required y repetir QA numerico DB-backed.',
    },
  ];

  const status = !liveBuildReady
    ? 'unity-build-blocked'
    : dbCompleteForClaim
      ? 'unity-db-ready'
      : 'unity-db-gated';

  return {
    schema: 'radshield-mx.f571-f580.unity-db-technical-closure.v1',
    phaseRange: 'F571-F580',
    status,
    unity: {
      liveBuildReady,
      source: unity.source,
      status: unity.status,
      publicPath: unity.publicPath,
      expectedFiles: unity.expectedFiles,
      missing: unityMissing,
      launchMode: unity.bridge.launchMode,
      boundary: unity.bridge.visualOnlyBoundary,
    },
    technicalDb: {
      status: regulatoryDb.status,
      tables: regulatoryDb.databaseRoute.tables,
      totalSources: regulatoryDb.summary.totalSources,
      totalMaterials: regulatoryDb.summary.totalMaterials,
      calculationAllowedMaterials: regulatoryDb.summary.calculationAllowedMaterials,
      reviewRequiredMaterials: regulatoryDb.summary.reviewRequiredMaterials,
      requiredCollections: [
        'NCRP/IAEA/UAQ canonical document_chunks with page/hash',
        'XCOM photon attenuation by material/mixture/energy',
        'ICRU/NIST density and composition profiles',
        'ENDF neutron/photon data for high-energy/cyclotron workflows',
        'Vendor/lab TVL-density-cost-load values promoted only after review',
      ],
    },
    tracks,
    releaseRules: {
      canUseUnityViewer: liveBuildReady,
      canClaimUnityRealRuntime: liveBuildReady,
      canSeedLiveDb: false,
      canClaimCompleteRegulatoryDb: dbCompleteForClaim,
      canClaimClinicalCertifiedCalculation: false,
    },
    requiredScreenshots: [
      '00_unity_db_closure_panel.png',
      '01_unity_db_closure_canvas.png',
      '02_unity_db_closure_event_action.png',
    ],
    rollback: [
      'Mantener Three/R3F como visor estable si Unity build no carga.',
      'Desactivar VITE_MEDICAL_3D_UNITY_LOCAL_BUILD o URL externa si falla smoke.',
      'No ejecutar seed live sin restore probe y flags explicitos.',
      'No promover materiales review-required a calculo final.',
    ],
  };
}
