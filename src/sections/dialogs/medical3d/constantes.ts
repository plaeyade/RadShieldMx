import type { Medical3DMode } from '@/lib/medical3D/sceneBuilder';

export const materialColors: Record<string, string> = {
  concreto: '#b8b7b1',
  concreto_baritado: '#8f8a7e',
  plomo: '#3f424b',
  acero: '#8b949e',
  tungsteno: '#57595f',
  vidrio_plomo: '#8db8b4',
  poly_borado: '#eee8cf',
  default: '#a6a6a6',
};

export type TextureKind = 'floor' | 'concrete' | 'lead' | 'steel' | 'glass' | 'ceiling' | 'equipment';
export type Medical3DLightingPreset = 'clinical' | 'inspection' | 'warm';
export type RealismAid = 'materialBands' | 'equipmentFootprints' | 'beamGuides' | 'roomRulers';
export type VisualWorkflowPreset = 'overview' | 'barriers' | 'equipment' | 'dose' | 'walkthrough';
export type VisualEvidenceCapture = {
  id: string;
  workflow: VisualWorkflowPreset;
  label: string;
  filename: string;
  sceneHash: string;
  createdAt: string;
  checklistReady: number;
  checklistTotal: number;
  stationId?: string | null;
  stationLabel?: string | null;
};
export type BabylonSmokeStatus = 'idle' | 'loading' | 'ready' | 'failed';
export type BabylonPerformanceMetrics = {
  firstFrameMs: number | null;
  fps: number | null;
  meshes: number;
};
export type BabylonDeepCameraMode = 'iso' | 'top' | 'front';
export type BabylonPickedEntity = {
  id: string;
  type: 'wall' | 'equipment' | 'zone' | 'beam';
  label: string;
  details: string[];
} | null;
export type UnityEmbedStatus = 'idle' | 'loading' | 'loaded' | 'blocked';
export type InspectionTarget =
  | { type: 'wall'; id: string; title: string; details: string[] }
  | { type: 'equipment'; id: string; title: string; details: string[] }
  | { type: 'zone'; id: string; title: string; details: string[] };

export const lightingPresets: Record<Medical3DLightingPreset, { ambient: number; key: number; cool: number; warm: number; label: string }> = {
  clinical: { ambient: 0.68, key: 0.95, cool: 0.46, warm: 0.28, label: 'Clinica balanceada' },
  inspection: { ambient: 0.52, key: 1.18, cool: 0.72, warm: 0.18, label: 'Inspeccion tecnica' },
  warm: { ambient: 0.74, key: 0.72, cool: 0.28, warm: 0.54, label: 'Recorrido calido' },
};

export const defaultRealismAids: Record<RealismAid, boolean> = {
  materialBands: true,
  equipmentFootprints: true,
  beamGuides: true,
  roomRulers: true,
};

export const PBR_MATERIAL_DB_STORAGE_KEY = 'radshield-medical3d-pbr-material-db-f461';

export const visualWorkflowPresets: Array<{
  id: VisualWorkflowPreset;
  label: string;
  description: string;
  mode: Medical3DMode;
  walkthrough: boolean;
  photoreal: boolean;
  inspection: boolean;
  ceiling: boolean;
  lighting: Medical3DLightingPreset;
  aids: Record<RealismAid, boolean>;
}> = [
  {
    id: 'overview',
    label: 'Vista general',
    description: 'Sala completa, zonas y lectura rapida para explicar el caso.',
    mode: 'presentation',
    walkthrough: false,
    photoreal: false,
    inspection: true,
    ceiling: false,
    lighting: 'clinical',
    aids: defaultRealismAids,
  },
  {
    id: 'barriers',
    label: 'Barreras',
    description: 'Materiales, espesores y cotas para revisar blindaje.',
    mode: 'technical',
    walkthrough: false,
    photoreal: false,
    inspection: true,
    ceiling: false,
    lighting: 'inspection',
    aids: { materialBands: true, equipmentFootprints: false, beamGuides: true, roomRulers: true },
  },
  {
    id: 'equipment',
    label: 'Equipos',
    description: 'Footprints, isocentro/fuente y espacio libre.',
    mode: 'technical',
    walkthrough: false,
    photoreal: false,
    inspection: true,
    ceiling: false,
    lighting: 'clinical',
    aids: { materialBands: false, equipmentFootprints: true, beamGuides: true, roomRulers: true },
  },
  {
    id: 'dose',
    label: 'Dosis',
    description: 'Heatmap, guia de fuente y lectura de zonas controladas.',
    mode: 'dose',
    walkthrough: false,
    photoreal: false,
    inspection: true,
    ceiling: false,
    lighting: 'inspection',
    aids: { materialBands: true, equipmentFootprints: true, beamGuides: true, roomRulers: false },
  },
  {
    id: 'walkthrough',
    label: 'Recorrido',
    description: 'WASD con colisiones, PBR ligero y estaciones visuales.',
    mode: 'presentation',
    walkthrough: true,
    photoreal: true,
    inspection: true,
    ceiling: true,
    lighting: 'warm',
    aids: defaultRealismAids,
  },
];

export const babylonInstallOptions = [
  {
    id: 'standard',
    label: 'Instalacion normal',
    command: 'npm install @babylonjs/core @babylonjs/loaders',
    useWhen: 'Cuando npm ya puede escribir cache y resolver registry.npmjs.org sin EACCES.',
  },
  {
    id: 'local-cache',
    label: 'Cache local del repo',
    command: 'npm install @babylonjs/core @babylonjs/loaders --cache .npm-cache-babylon --prefer-online',
    useWhen: 'Cuando el bloqueo viene de permisos/carpeta cache global de npm.',
  },
  {
    id: 'pnpm-or-yarn',
    label: 'Gestor alterno',
    command: 'corepack enable && pnpm add @babylonjs/core @babylonjs/loaders',
    useWhen: 'Cuando npm insiste en EACCES aunque Node y red funcionen.',
  },
  {
    id: 'vendor-tarballs',
    label: 'Tarballs locales',
    command: 'npm pack @babylonjs/core @babylonjs/loaders && npm install ./babylonjs-core-*.tgz ./babylonjs-loaders-*.tgz',
    useWhen: 'Cuando hay que descargar paquetes fuera del entorno de Codex y traerlos al repo.',
  },
];
