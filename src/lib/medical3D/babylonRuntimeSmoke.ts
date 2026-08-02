import type { MedicalScene } from './sceneBuilder';

export type BabylonRuntimeSmokeStatus = 'runtime-ready' | 'runtime-review';

export interface BabylonRuntimeSmokeContract {
  schema: 'radshield-mx.medical3d.babylon-runtime-smoke.f455.v1';
  phase: 'F455';
  status: BabylonRuntimeSmokeStatus;
  sceneSummary: {
    walls: number;
    equipment: number;
    zones: number;
    maxThicknessMm: number;
  };
  packages: string[];
  visualElements: string[];
  gates: string[];
  fallback: string;
}

export function buildBabylonRuntimeSmokeContract(scene: MedicalScene): BabylonRuntimeSmokeContract {
  const ready = scene.walls.length > 0 && scene.equipment.length > 0;

  return {
    schema: 'radshield-mx.medical3d.babylon-runtime-smoke.f455.v1',
    phase: 'F455',
    status: ready ? 'runtime-ready' : 'runtime-review',
    sceneSummary: {
      walls: scene.walls.length,
      equipment: scene.equipment.length,
      zones: scene.zones.length,
      maxThicknessMm: Math.round(scene.review.maxRequiredThickness_mm),
    },
    packages: ['@babylonjs/core', '@babylonjs/loaders', '@babylonjs/materials', '@babylonjs/gui'],
    visualElements: [
      'PBR concrete shielding shell',
      'cutaway bunker preview',
      'medical equipment proxy',
      'controlled-area translucent overlay',
      'Three/R3F fallback retained',
    ],
    gates: [
      'lazy runtime import',
      'isolated canvas smoke',
      'no calculation mutation',
      'fallback renderer remains active',
      'visual screenshot QA',
    ],
    fallback: 'Three/R3F remains the production renderer until Babylon passes post-beta scene parity.',
  };
}

export interface BabylonSceneParityContract {
  schema: 'radshield-mx.medical3d.babylon-parity-export.f456-f458.v1';
  phaseRange: 'F456-F458';
  status: 'parity-ready' | 'parity-review';
  parity: {
    wallsFromScene: number;
    equipmentFromScene: number;
    zonesFromScene: number;
    roleMaterials: string[];
  };
  performanceGate: {
    targetFps: number;
    fallbackRenderer: 'three-r3f';
    failureMode: string;
  };
  exportGate: {
    png: boolean;
    evidenceUse: string[];
    disclaimer: string;
  };
}

export function buildBabylonSceneParityContract(scene: MedicalScene): BabylonSceneParityContract {
  const roleMaterials = Array.from(new Set(scene.walls.map((wall) => `${wall.barrierType}:${wall.materialCode}`))).sort();
  const hasSceneGeometry = scene.walls.length > 0 && scene.equipment.length > 0;

  return {
    schema: 'radshield-mx.medical3d.babylon-parity-export.f456-f458.v1',
    phaseRange: 'F456-F458',
    status: hasSceneGeometry ? 'parity-ready' : 'parity-review',
    parity: {
      wallsFromScene: scene.walls.length,
      equipmentFromScene: scene.equipment.length,
      zonesFromScene: scene.zones.length,
      roleMaterials,
    },
    performanceGate: {
      targetFps: 24,
      fallbackRenderer: 'three-r3f',
      failureMode: 'If Babylon fails, keep the Three/R3F production renderer and disable only the isolated Babylon preview.',
    },
    exportGate: {
      png: true,
      evidenceUse: ['Memoria IA visual appendix', 'Evidence Pack screenshot', 'operator QA', 'post-beta parity comparison'],
      disclaimer: 'Babylon export is visual evidence only until calculation parity and report citation gates pass.',
    },
  };
}
