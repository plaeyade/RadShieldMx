import type { MedicalScene } from './sceneBuilder';
import type { PbrMaterialDatabase } from './pbrMaterialDatabase';

export interface F459F463VisualStack {
  schema: 'radshield-mx.medical3d.visual-stack.f459-f463.v1';
  status: 'visual-stack-ready' | 'visual-stack-review';
  phases: Array<{
    id: 'F459' | 'F460' | 'F461' | 'F462' | 'F463';
    label: string;
    output: string;
  }>;
  scene: {
    walls: number;
    equipment: number;
    zones: number;
  };
  materialDb: {
    version: string;
    records: number;
    updateMode: 'localStorage-versioned-json';
  };
  boundaries: string[];
}

export function buildF459F463VisualStack(scene: MedicalScene, pbrMaterialDb: PbrMaterialDatabase): F459F463VisualStack {
  const ready = scene.walls.length > 0 && scene.equipment.length > 0 && pbrMaterialDb.records.length >= 5;

  return {
    schema: 'radshield-mx.medical3d.visual-stack.f459-f463.v1',
    status: ready ? 'visual-stack-ready' : 'visual-stack-review',
    phases: [
      { id: 'F459', label: 'Unity bridge realista', output: 'handoff JSON + URL gate + visual-only boundary' },
      { id: 'F460', label: 'Unity scene payload', output: 'geometry/material/bookmark package for external WebGL viewer' },
      { id: 'F461', label: 'Fotorealismo avanzado nivel 1', output: 'ACES/PBR/shadows/lighting presets for Three and Babylon preview' },
      { id: 'F462', label: 'Galeria PBR de materiales', output: 'versioned material swatches with density and visual profile' },
      { id: 'F463', label: 'Recorrido WASD visual', output: 'operator controls, walkthrough preset and screenshot-ready guide' },
    ],
    scene: {
      walls: scene.walls.length,
      equipment: scene.equipment.length,
      zones: scene.zones.length,
    },
    materialDb: {
      version: pbrMaterialDb.version,
      records: pbrMaterialDb.records.length,
      updateMode: 'localStorage-versioned-json',
    },
    boundaries: [
      'Unity is an external visual viewer until a real WebGL build URL is configured.',
      'Photoreal and PBR materials do not modify signed shielding calculations.',
      'PBR material DB is visual/evidence metadata; TVL/citation authority remains in calculation/RAG sources.',
    ],
  };
}
