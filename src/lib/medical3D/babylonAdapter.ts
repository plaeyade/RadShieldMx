import type { MedicalScene } from './sceneBuilder';
import { buildMedical3DEngineHandoff } from './renderStrategy';

export type BabylonAdapterReadiness = 'blocked' | 'ready-for-install' | 'runtime-installed';

export interface BabylonAdapterContract {
  schema: 'radshield-mx.medical-3d.babylon-adapter.v1';
  readiness: BabylonAdapterReadiness;
  featureFlag: 'VITE_MEDICAL_3D_BABYLON_ADAPTER';
  runtimeFlag: 'VITE_MEDICAL_3D_BABYLON_RUNTIME';
  requiredPackages: string[];
  requiredSceneFields: string[];
  fallbackEngine: 'three-r3f';
  clinicalRole: string;
  installCommand: string;
  activationGates: string[];
  sceneSummary: {
    roomName: string;
    walls: number;
    equipment: number;
    zones: number;
    hasThicknessData: boolean;
    hasControlledZones: boolean;
  };
  warnings: string[];
}

export function buildBabylonAdapterContract(scene: MedicalScene): BabylonAdapterContract {
  const hasThicknessData = scene.walls.some((wall) => wall.requiredThickness_mm > 0 || wall.thickness_m > 0);
  const hasControlledZones = scene.zones.some((zone) => zone.controlled);

  return {
    schema: 'radshield-mx.medical-3d.babylon-adapter.v1',
    readiness: hasThicknessData && scene.equipment.length > 0 ? 'ready-for-install' : 'blocked',
    featureFlag: 'VITE_MEDICAL_3D_BABYLON_ADAPTER',
    runtimeFlag: 'VITE_MEDICAL_3D_BABYLON_RUNTIME',
    requiredPackages: ['@babylonjs/core', '@babylonjs/loaders'],
    requiredSceneFields: [
      'bounds',
      'walls.position/size/thickness/materialCode',
      'equipment.position/footprint/assetHint',
      'zones.points/controlled',
      'review.maxRequiredThickness_mm',
    ],
    fallbackEngine: 'three-r3f',
    clinicalRole: 'Visualizacion PBR/WebGPU/WebXR para inspeccion. No calcula blindaje ni sustituye Memoria IA/Evidence Pack.',
    installCommand: 'npm install @babylonjs/core @babylonjs/loaders',
    activationGates: [
      'F310 real operator Three/R3F sin regresiones.',
      'Dynamic import aislado y fallback automatico a Three/R3F.',
      'Smoke visual desktop/mobile con canvas no blanco.',
      'Bundle budget y rollback documentado.',
      'Export JSON/GLTF compatible con Memoria IA y Evidence Pack.',
    ],
    sceneSummary: {
      roomName: scene.roomName,
      walls: scene.walls.length,
      equipment: scene.equipment.length,
      zones: scene.zones.length,
      hasThicknessData,
      hasControlledZones,
    },
    warnings: [
      'No activar Babylon en produccion hasta tener paquete instalado, flag activo y smoke visual.',
      'Mantener Three/R3F como fallback obligatorio.',
      'WebGPU/WebXR dependen del navegador y no deben ser requisito de calculo clinico.',
    ],
  };
}

export function buildBabylonHandoff(scene: MedicalScene) {
  return {
    ...buildMedical3DEngineHandoff('babylon-pbr-webgpu-webxr'),
    adapter: buildBabylonAdapterContract(scene),
  };
}
