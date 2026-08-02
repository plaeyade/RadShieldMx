import type { MedicalScene } from './sceneBuilder';
import { buildUnityExternalViewerUrl, getUnityExternalViewerBaseUrl } from './unityExternalViewerBridge';

export interface UnityWebglExportedBuildContract {
  schema: 'radshield-mx.medical3d.unity-webgl-exported-build.f475-f478.v1';
  phaseRange: 'F475-F478';
  status: 'external-url-ready' | 'local-build-path-ready' | 'export-folder-required';
  source: 'env-url' | 'local-public-folder' | 'missing';
  viewerUrl: string | null;
  localFolder: 'public/unity/radshield-medical-3d';
  publicPath: '/unity/radshield-medical-3d/index.html';
  expectedFiles: string[];
  scenePackage: {
    roomName: string;
    walls: number;
    equipment: number;
    zones: number;
    maxRequiredThickness_mm: number;
  };
  bridge: {
    handoffFormat: 'medical_3d_unity_handoff_*.json';
    launchMode: 'iframe-or-new-tab';
    postMessageEvents: string[];
    visualOnlyBoundary: string;
  };
  phases: Array<{
    id: 'F475' | 'F476' | 'F477' | 'F478';
    label: string;
    evidence: string;
  }>;
  activationChecklist: string[];
}

export function getUnityLocalBuildBaseUrl(): string | null {
  const enabled = import.meta.env.VITE_MEDICAL_3D_UNITY_LOCAL_BUILD;
  if (enabled !== 'true') return null;
  return '/unity/radshield-medical-3d/index.html';
}

export function buildUnityWebglExportedBuildUrl(scene: MedicalScene): string | null {
  const externalUrl = buildUnityExternalViewerUrl(scene, getUnityExternalViewerBaseUrl());
  if (externalUrl) return externalUrl;
  const localBaseUrl = getUnityLocalBuildBaseUrl();
  if (!localBaseUrl) return null;
  return buildUnityExternalViewerUrl(scene, localBaseUrl);
}

export function buildUnityWebglExportedBuildContract(scene: MedicalScene): UnityWebglExportedBuildContract {
  const envBaseUrl = getUnityExternalViewerBaseUrl();
  const localBaseUrl = getUnityLocalBuildBaseUrl();
  const viewerUrl = buildUnityWebglExportedBuildUrl(scene);
  const source = envBaseUrl ? 'env-url' : localBaseUrl ? 'local-public-folder' : 'missing';
  const status = envBaseUrl
    ? 'external-url-ready'
    : localBaseUrl
      ? 'local-build-path-ready'
      : 'export-folder-required';

  return {
    schema: 'radshield-mx.medical3d.unity-webgl-exported-build.f475-f478.v1',
    phaseRange: 'F475-F478',
    status,
    source,
    viewerUrl,
    localFolder: 'public/unity/radshield-medical-3d',
    publicPath: '/unity/radshield-medical-3d/index.html',
    expectedFiles: [
      'index.html',
      'Build/*.loader.js',
      'Build/*.framework.js',
      'Build/*.data',
      'Build/*.wasm',
      'TemplateData/*',
    ],
    scenePackage: {
      roomName: scene.roomName,
      walls: scene.walls.length,
      equipment: scene.equipment.length,
      zones: scene.zones.length,
      maxRequiredThickness_mm: scene.review.maxRequiredThickness_mm,
    },
    bridge: {
      handoffFormat: 'medical_3d_unity_handoff_*.json',
      launchMode: 'iframe-or-new-tab',
      postMessageEvents: ['radshield:scene-ready', 'radshield:snapshot-request', 'radshield:camera-bookmark'],
      visualOnlyBoundary:
        'Unity WebGL is an external visual walkthrough. It consumes RadShield scene metadata and must not author signed shielding calculations.',
    },
    phases: [
      { id: 'F475', label: 'Carpeta exportada Unity', evidence: 'Soporte para public/unity/radshield-medical-3d con Build/TemplateData reales.' },
      { id: 'F476', label: 'Embed controlado', evidence: 'Iframe/new-tab con URL local o externa y fallback Three/R3F.' },
      { id: 'F477', label: 'Bridge de caso', evidence: 'Export JSON y query params con sala, muros, equipos, zonas y espesor maximo.' },
      { id: 'F478', label: 'QA live gate', evidence: 'Auditoria de carpeta, contrato UI, E2E y documentacion de headers/rollback.' },
    ],
    activationChecklist: [
      'Copiar build Unity WebGL real a public/unity/radshield-medical-3d.',
      'Confirmar index.html y carpeta Build con loader/framework/data/wasm.',
      'Activar VITE_MEDICAL_3D_UNITY_LOCAL_BUILD=true para usar carpeta local o VITE_MEDICAL_3D_UNITY_WEBGL_URL para URL publicada.',
      'Correr prepare/test/e2e F475-F478 antes de reclamar visor Unity funcional.',
      'Mantener Three/R3F como fallback y calculos dentro de RadShield-MX.',
    ],
  };
}
