import type { MedicalScene } from './sceneBuilder';
import { buildUnityWebglHandoff } from './unityWebglHandoff';

export interface UnityExternalViewerLaunchPacket {
  schema: 'radshield-mx.medical-3d.unity-launch-packet.v1';
  readiness: 'viewer-url-configured' | 'viewer-url-missing';
  viewer: {
    url: string | null;
    envVar: 'VITE_MEDICAL_3D_UNITY_WEBGL_URL';
    featureFlag: 'VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER';
    launchMode: 'new-tab-or-iframe';
  };
  fallbackEngine: 'three-r3f';
  handoff: ReturnType<typeof buildUnityWebglHandoff>;
  querySummary: {
    source: 'radshield-mx';
    room: string;
    walls: number;
    equipment: number;
    zones: number;
    maxRequiredThickness_mm: number;
  };
  clinicalBoundary: string;
}

export function getUnityExternalViewerBaseUrl(): string | null {
  const rawUrl = import.meta.env.VITE_MEDICAL_3D_UNITY_WEBGL_URL;
  if (typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildUnityExternalViewerUrl(scene: MedicalScene, baseUrl = getUnityExternalViewerBaseUrl()): string | null {
  if (!baseUrl) return null;

  try {
    const isAbsolute = /^https?:\/\//i.test(baseUrl);
    const url = new URL(baseUrl, 'https://radshield.local');
    url.searchParams.set('source', 'radshield-mx');
    url.searchParams.set('room', scene.roomName);
    url.searchParams.set('walls', String(scene.walls.length));
    url.searchParams.set('equipment', String(scene.equipment.length));
    url.searchParams.set('zones', String(scene.zones.length));
    url.searchParams.set('maxThicknessMm', String(Math.round(scene.review.maxRequiredThickness_mm || 0)));
    return isAbsolute ? url.toString() : `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function buildUnityExternalViewerLaunchPacket(scene: MedicalScene): UnityExternalViewerLaunchPacket {
  const url = buildUnityExternalViewerUrl(scene);

  return {
    schema: 'radshield-mx.medical-3d.unity-launch-packet.v1',
    readiness: url ? 'viewer-url-configured' : 'viewer-url-missing',
    viewer: {
      url,
      envVar: 'VITE_MEDICAL_3D_UNITY_WEBGL_URL',
      featureFlag: 'VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER',
      launchMode: 'new-tab-or-iframe',
    },
    fallbackEngine: 'three-r3f',
    handoff: buildUnityWebglHandoff(scene),
    querySummary: {
      source: 'radshield-mx',
      room: scene.roomName,
      walls: scene.walls.length,
      equipment: scene.equipment.length,
      zones: scene.zones.length,
      maxRequiredThickness_mm: scene.review.maxRequiredThickness_mm,
    },
    clinicalBoundary:
      'Unity WebGL es solo visor externo de inspeccion/recorrido; RadShield-MX conserva calculos, citas, advertencias, PDF y Evidence Pack.',
  };
}
