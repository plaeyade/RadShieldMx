import type { FloorPlan } from '@/types/radshield';
import { buildF272ExternalMonteCarloRunnerGate } from '@/lib/f272ExternalMonteCarloRunnerGate';
import { buildF268aExternalApiReadiness } from '@/lib/f268aExternalApiReadiness';

export interface F367F370ReleaseIntegration {
  phase: 'F367-F370';
  status: 'beta-release-integration-ready';
  visualEvidence: {
    schema: 'radshield-mx.medical3d.visual-evidence-pack.f365-f366.v1';
    requiredFiles: string[];
    documentSurfaces: Array<'Memoria IA' | 'PDF Report' | 'Evidence Pack' | 'Update Center'>;
    minimumCapturePolicy: string;
    missingIfNotAttached: string[];
  };
  unityWebgl: {
    schema: 'radshield-mx.medical3d.unity-webgl-formal.f368.v1';
    mode: 'external-webgl-viewer';
    enabledBy: ['VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER', 'VITE_MEDICAL_3D_UNITY_WEBGL_URL'];
    acceptedInputs: string[];
    expectedOutputs: string[];
    smokeRequired: string[];
    fallback: 'three-r3f';
  };
  externalEngines: ReturnType<typeof buildF272ExternalMonteCarloRunnerGate>;
  externalApis: ReturnType<typeof buildF268aExternalApiReadiness>;
  photorealism: {
    schema: 'radshield-mx.medical3d.photoreal-advanced.f369.v1';
    activeEngine: 'three-r3f';
    deferredEngine: 'babylon';
    assetLanes: string[];
    pbrMaterials: string[];
    captureTargets: string[];
    riskControls: string[];
  };
  releaseGate: {
    schema: 'radshield-mx.beta-release.f370.v1';
    decision: 'frontend-beta-ready-with-external-runners';
    buildScope: string[];
    blockedClaims: string[];
    nextUserTest: string[];
  };
}

export function buildF367F370ReleaseIntegration(floorPlan?: FloorPlan): F367F370ReleaseIntegration {
  const hasGeometry = Boolean((floorPlan?.barriers?.length || 0) + (floorPlan?.sources?.length || 0));

  return {
    phase: 'F367-F370',
    status: 'beta-release-integration-ready',
    visualEvidence: {
      schema: 'radshield-mx.medical3d.visual-evidence-pack.f365-f366.v1',
      requiredFiles: ['medical_3d_visual_evidence_pack_*.json', 'PNG captures by preset', 'medical_3d_review_*.json'],
      documentSurfaces: ['Memoria IA', 'PDF Report', 'Evidence Pack', 'Update Center'],
      minimumCapturePolicy: 'Vista general + barreras + equipos + dosis; recorrido recomendado si hay inspeccion de sala.',
      missingIfNotAttached: hasGeometry
        ? ['Attach exported 3D visual evidence pack before signed report.']
        : ['Load floorplan/equipment before visual evidence can be meaningful.'],
    },
    unityWebgl: {
      schema: 'radshield-mx.medical3d.unity-webgl-formal.f368.v1',
      mode: 'external-webgl-viewer',
      enabledBy: ['VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER', 'VITE_MEDICAL_3D_UNITY_WEBGL_URL'],
      acceptedInputs: ['medical_3d_unity_handoff_*.json', 'medical_3d_*.obj', 'future GLB/GLTF case pack'],
      expectedOutputs: ['snapshot PNG', 'camera bookmarks JSON', 'walkthrough recording reference', 'viewer manifest'],
      smokeRequired: ['loads URL', 'loads room geometry', 'shows equipment', 'shows material zones', 'returns visual evidence only'],
      fallback: 'three-r3f',
    },
    externalEngines: buildF272ExternalMonteCarloRunnerGate(),
    externalApis: buildF268aExternalApiReadiness(),
    photorealism: {
      schema: 'radshield-mx.medical3d.photoreal-advanced.f369.v1',
      activeEngine: 'three-r3f',
      deferredEngine: 'babylon',
      assetLanes: [
        'Procedural PBR materials for concrete, lead, steel, glass and HD masonry.',
        'Equipment symbols/footprints now; GLB/GLTF manufacturer assets later.',
        'Unity external viewer for high-fidelity walkthrough only when URL/build exists.',
      ],
      pbrMaterials: ['concrete-shield', 'high-density-masonry', 'lead-shield', 'steel-structure', 'leaded-glass'],
      captureTargets: ['overview', 'barriers', 'equipment', 'dose', 'walkthrough'],
      riskControls: [
        'No photoreal output is a calculation result.',
        'Every visual must carry sceneHash and preset.',
        'Advanced assets must not hide barriers, labels, material bands or dose overlays.',
      ],
    },
    releaseGate: {
      schema: 'radshield-mx.beta-release.f370.v1',
      decision: 'frontend-beta-ready-with-external-runners',
      buildScope: ['static frontend', 'Three/R3F Medical 3D', 'visual evidence pack', 'external runner manifests'],
      blockedClaims: [
        'No certified Monte Carlo clinical engine until external runner version/data libraries are validated.',
        'No native DWG in browser; use APS/ODA/DXF conversion.',
        'No Babylon runtime until dependency lane passes build/smoke.',
      ],
      nextUserTest: [
        'Open beta frontend.',
        'Load/draw a real floorplan.',
        'Open Medical 3D and capture the four required presets.',
        'Export Memoria IA, PDF Report and Evidence Pack.',
        'Record any missing action as post-beta issue, not another speculative phase.',
      ],
    },
  };
}

export function formatF367F370ReleaseIntegrationText(integration: F367F370ReleaseIntegration): string {
  return [
    'F367-F370 RELEASE INTEGRATION',
    `Status: ${integration.status}`,
    `Visual evidence: ${integration.visualEvidence.requiredFiles.join(', ')}`,
    `Unity WebGL: ${integration.unityWebgl.mode}; fallback ${integration.unityWebgl.fallback}`,
    `External MC engines: ${integration.externalEngines.engines.map((engine) => `${engine.id}:${engine.status}`).join(' | ')}`,
    `Photoreal: ${integration.photorealism.activeEngine}; Babylon ${integration.photorealism.deferredEngine} pendiente`,
    `Release decision: ${integration.releaseGate.decision}`,
    `Blocked claims: ${integration.releaseGate.blockedClaims.join(' | ')}`,
  ].join('\n');
}
