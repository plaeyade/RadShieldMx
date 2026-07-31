import type { FloorPlan } from '@/types/radshield';
import { buildMedicalScene, type MedicalRoomPreset } from './medical3D/sceneBuilder';

export interface F408UnityMaterial {
  code: string;
  thickness_m: number;
  requiredThickness_mm: number;
  renderHint: 'concrete' | 'lead' | 'steel' | 'glass' | 'custom';
}

export interface F408UnityWall {
  id: string;
  name: string;
  center_m: [number, number, number];
  size_m: [number, number, number];
  rotationY_rad: number;
  barrierType: string;
  material: F408UnityMaterial;
}

export interface F408UnityEquipment {
  id: string;
  name: string;
  kind: string;
  position_m: [number, number, number];
  rotationY_rad: number;
  footprint_m: [number, number];
  assetHint?: string;
}

export interface F408UnitySceneExport {
  schema: 'radshield-mx.f408.unity-scene-export.v1';
  phase: 'F408';
  status: 'unity-scene-export-ready' | 'unity-scene-export-review';
  coordinateSystem: {
    units: 'meters';
    upAxis: 'Y';
    sourcePlane: 'floorplan-xz';
  };
  floorPlanId: string;
  roomName: string;
  scale_m_per_pixel: number;
  bounds_m: {
    width: number;
    depth: number;
    center: [number, number, number];
  };
  walls: F408UnityWall[];
  equipment: F408UnityEquipment[];
  dosePoints: Array<{ id: string; position_m: [number, number, number]; radius_m: number; intensity: number }>;
  zones: Array<{ id: string; name: string; controlled: boolean; pointCount: number; center_m: [number, number, number] }>;
  externalTargets: string[];
  handoffNotes: string[];
  warnings: string[];
}

function renderHint(materialCode: string): F408UnityMaterial['renderHint'] {
  const code = materialCode.toLowerCase();
  if (code.includes('pb') || code.includes('lead') || code.includes('plomo')) return 'lead';
  if (code.includes('steel') || code.includes('acero')) return 'steel';
  if (code.includes('glass') || code.includes('vidrio')) return 'glass';
  if (code.includes('concrete') || code.includes('concreto') || code.includes('nipol') || code.includes('nelco')) return 'concrete';
  return 'custom';
}

export function buildF408UnitySceneExport(floorPlan: FloorPlan | undefined, preset: MedicalRoomPreset = 'linac'): F408UnitySceneExport {
  const scene = buildMedicalScene(floorPlan ?? {
    id: 'no-floorplan',
    name: 'No active floorplan',
    imageUrl: null,
    scale_m_per_pixel: 0.01,
    width_pixels: 0,
    height_pixels: 0,
    barriers: [],
    sources: [],
    occupiedRegions: [],
    criticalPoints: [],
  }, preset);
  const warnings: string[] = [];
  if (!floorPlan) warnings.push('No active floorplan; exported scene is a default preset shell.');
  if (scene.walls.length === 0) warnings.push('No walls/barriers in scene.');
  if (scene.equipment.length === 0) warnings.push('No equipment/source symbols in scene.');
  if (scene.zones.length === 0) warnings.push('No controlled/public zones in scene.');

  return {
    schema: 'radshield-mx.f408.unity-scene-export.v1',
    phase: 'F408',
    status: warnings.length === 0 ? 'unity-scene-export-ready' : 'unity-scene-export-review',
    coordinateSystem: {
      units: 'meters',
      upAxis: 'Y',
      sourcePlane: 'floorplan-xz',
    },
    floorPlanId: floorPlan?.id ?? 'no-floorplan',
    roomName: scene.roomName,
    scale_m_per_pixel: floorPlan?.scale_m_per_pixel ?? 0.01,
    bounds_m: scene.bounds,
    walls: scene.walls.map((wall) => ({
      id: wall.id,
      name: wall.name,
      center_m: wall.center,
      size_m: wall.size,
      rotationY_rad: wall.rotationY,
      barrierType: wall.barrierType,
      material: {
        code: wall.materialCode,
        thickness_m: wall.thickness_m,
        requiredThickness_mm: wall.requiredThickness_mm ?? wall.thickness_m * 1000,
        renderHint: renderHint(wall.materialCode),
      },
    })),
    equipment: scene.equipment.map((equipment) => ({
      id: equipment.id,
      name: equipment.name,
      kind: equipment.kind,
      position_m: equipment.position,
      rotationY_rad: equipment.rotationY,
      footprint_m: equipment.footprint_m,
      assetHint: equipment.assetHint,
    })),
    dosePoints: scene.dosePoints.map((point) => ({
      id: point.id,
      position_m: point.position,
      radius_m: point.radius,
      intensity: point.intensity,
    })),
    zones: scene.zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      controlled: zone.controlled,
      pointCount: zone.points.length,
      center_m: zone.center,
    })),
    externalTargets: ['Three/R3F viewer', 'Unity WebGL bridge', 'glTF/OBJ export pipeline', 'GATE/EGSnrc/Geant4 runner package'],
    handoffNotes: [
      'Coordinates are meters, Y-up, with floorplan X/Y mapped to 3D X/Z.',
      'Clinical/regulatory values remain source-governed by calculation trace and Evidence Pack.',
      'Unity may add PBR finishes and walkthrough controls, but must not change geometry/material thickness without a new hash.',
    ],
    warnings,
  };
}

export function validateF408UnitySceneExport(scene: F408UnitySceneExport): string[] {
  const warnings: string[] = [...scene.warnings];
  if (scene.coordinateSystem.units !== 'meters') warnings.push('Unity export must use meters.');
  if (!Number.isFinite(scene.scale_m_per_pixel) || scene.scale_m_per_pixel <= 0) warnings.push('Invalid scene scale.');
  if (!scene.walls.length) warnings.push('Unity export has no walls.');
  if (scene.walls.some((wall) => wall.size_m.some((value) => !Number.isFinite(value) || value <= 0))) {
    warnings.push('Unity export contains invalid wall dimensions.');
  }
  if (scene.equipment.some((equipment) => equipment.footprint_m.some((value) => !Number.isFinite(value) || value <= 0))) {
    warnings.push('Unity export contains invalid equipment footprint.');
  }
  return [...new Set(warnings)];
}
