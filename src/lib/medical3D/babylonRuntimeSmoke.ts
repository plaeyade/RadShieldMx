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
