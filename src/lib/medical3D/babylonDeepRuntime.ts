import type { MedicalScene } from './sceneBuilder';

export interface BabylonDeepRuntimeContract {
  schema: 'radshield-mx.medical3d.babylon-deep-runtime.f470-f474.v1';
  phaseRange: 'F470-F474';
  status: 'deep-runtime-ready' | 'deep-runtime-review';
  phases: Array<{
    id: 'F470' | 'F471' | 'F472' | 'F473' | 'F474';
    label: string;
    evidence: string;
  }>;
  scene: {
    walls: number;
    equipment: number;
    zones: number;
    pickableEntities: number;
  };
  controls: {
    picking: boolean;
    cameraModes: string[];
    overlays: string[];
    exportTargets: string[];
  };
  fallback: string;
}

export function buildBabylonDeepRuntimeContract(scene: MedicalScene): BabylonDeepRuntimeContract {
  const pickableEntities = scene.walls.length + scene.equipment.length + Math.max(scene.zones.length, 1);
  const ready = scene.walls.length > 0 && scene.equipment.length > 0 && pickableEntities > 1;

  return {
    schema: 'radshield-mx.medical3d.babylon-deep-runtime.f470-f474.v1',
    phaseRange: 'F470-F474',
    status: ready ? 'deep-runtime-ready' : 'deep-runtime-review',
    phases: [
      { id: 'F470', label: 'Escena Babylon interactiva', evidence: 'Muros/equipos/zonas reales desde MedicalScene, no maqueta fija.' },
      { id: 'F471', label: 'Picking + HUD', evidence: 'Cada entidad seleccionable expone ID, tipo, material/rol y estado visual-only.' },
      { id: 'F472', label: 'Camaras de inspeccion', evidence: 'Isometrica, planta y frontal para revisar sala, barreras y recorrido.' },
      { id: 'F473', label: 'Overlays PBR/rol', evidence: 'Materiales, bandas de rol, zonas controladas y haz visual.' },
      { id: 'F474', label: 'QA/Evidence Babylon profundo', evidence: 'E2E dedicado, screenshots y export PNG/JSON con fallback Three/R3F.' },
    ],
    scene: {
      walls: scene.walls.length,
      equipment: scene.equipment.length,
      zones: scene.zones.length,
      pickableEntities,
    },
    controls: {
      picking: true,
      cameraModes: ['iso', 'top', 'front'],
      overlays: ['barrier-role-bands', 'controlled-zones', 'equipment-footprints', 'beam-guide'],
      exportTargets: ['PNG', 'Evidence Pack', 'Memoria IA visual appendix', 'operator QA'],
    },
    fallback: 'Three/R3F remains the production renderer if Babylon deep runtime fails or underperforms.',
  };
}
