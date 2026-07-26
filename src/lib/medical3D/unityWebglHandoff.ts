import type { MedicalScene } from './sceneBuilder';
import { buildMedical3DEngineHandoff } from './renderStrategy';

export interface UnityWebglExternalViewerContract {
  schema: 'radshield-mx.medical-3d.unity-webgl-external.v1';
  readiness: 'deferred-external-build' | 'ready-for-external-url';
  featureFlag: 'VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER';
  urlEnvVar: 'VITE_MEDICAL_3D_UNITY_WEBGL_URL';
  recommendedEmbedding: 'iframe-or-new-tab';
  inputFormats: string[];
  outputFormats: string[];
  requiredServerHeaders: string[];
  scenePackage: {
    roomName: string;
    walls: number;
    equipment: number;
    zones: number;
    maxRequiredThickness_mm: number;
  };
  integrationRules: string[];
  blockersBeforeActivation: string[];
}

export function buildUnityWebglExternalViewerContract(scene: MedicalScene): UnityWebglExternalViewerContract {
  const hasScenePayload = scene.walls.length > 0 && scene.equipment.length > 0;

  return {
    schema: 'radshield-mx.medical-3d.unity-webgl-external.v1',
    readiness: hasScenePayload ? 'ready-for-external-url' : 'deferred-external-build',
    featureFlag: 'VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER',
    urlEnvVar: 'VITE_MEDICAL_3D_UNITY_WEBGL_URL',
    recommendedEmbedding: 'iframe-or-new-tab',
    inputFormats: ['medical_3d_engine_handoff.json', 'medical_3d_review.json', 'OBJ', 'future GLTF/GLB'],
    outputFormats: ['snapshot PNG', 'walkthrough recording reference', 'camera bookmark JSON'],
    requiredServerHeaders: [
      'Content-Encoding for compressed Unity assets',
      'Cross-Origin-Opener-Policy/Cross-Origin-Embedder-Policy only if SharedArrayBuffer build is used',
      'Cache-Control versioned build assets',
    ],
    scenePackage: {
      roomName: scene.roomName,
      walls: scene.walls.length,
      equipment: scene.equipment.length,
      zones: scene.zones.length,
      maxRequiredThickness_mm: scene.review.maxRequiredThickness_mm,
    },
    integrationRules: [
      'Unity WebGL runs outside the main React bundle.',
      'RadShield remains source of truth for calculations, citations, warnings and reports.',
      'Unity consumes exported geometry and metadata; it must not write clinical results back without validation.',
      'Three/R3F remains the fallback inspection viewer.',
    ],
    blockersBeforeActivation: [
      'Unity project and WebGL build are not present in this repo.',
      'No public/staging Unity URL configured.',
      'No browser smoke has validated iframe load, camera controls and asset rendering.',
      'No rollback handoff has been tested against static deploy.',
    ],
  };
}

export function buildUnityWebglHandoff(scene: MedicalScene) {
  return {
    ...buildMedical3DEngineHandoff('unity-webgl-external'),
    externalViewer: buildUnityWebglExternalViewerContract(scene),
  };
}
