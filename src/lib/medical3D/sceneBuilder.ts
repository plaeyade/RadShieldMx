import type { Barrier, FloorPlan, RadiationSource } from '@/types/radshield';
import { getEquipmentVisualProfile } from '@/lib/equipmentVisuals';

export type MedicalRoomPreset = 'linac' | 'petct' | 'ct' | 'gammaKnife' | 'hdr' | 'radiofarmacia';
export type Medical3DMode = 'presentation' | 'technical' | 'dose';

export interface MedicalWall {
  id: string;
  name: string;
  center: [number, number, number];
  size: [number, number, number];
  rotationY: number;
  materialCode: string;
  barrierType: Barrier['barrierType'];
  thickness_m: number;
  requiredThickness_mm?: number;
}

export interface MedicalEquipment {
  id: string;
  name: string;
  kind: MedicalRoomPreset;
  position: [number, number, number];
  rotationY: number;
  footprint_m: [number, number];
  assetHint?: string;
  ragTags: string[];
}

export interface MedicalDosePoint {
  id: string;
  position: [number, number, number];
  radius: number;
  intensity: number;
}

export interface MedicalZone {
  id: string;
  name: string;
  points: Array<[number, number, number]>;
  center: [number, number, number];
  color: string;
  controlled: boolean;
}

export interface MedicalScene {
  roomName: string;
  bounds: {
    width: number;
    depth: number;
    center: [number, number, number];
  };
  review: {
    primaryBarriers: number;
    secondaryBarriers: number;
    maxRequiredThickness_mm: number;
  };
  walls: MedicalWall[];
  equipment: MedicalEquipment[];
  dosePoints: MedicalDosePoint[];
  zones: MedicalZone[];
  floorScaleLabel: string;
}

const MIN_ROOM_SIZE_M = 7;
const DEFAULT_CEILING_M = 3.1;
const DEFAULT_MEDICAL_SCENE_FLOOR_PLAN: FloorPlan = {
  id: 'default-medical-scene-floorplan',
  name: 'Plano medico sin cargar',
  imageUrl: null,
  scale_m_per_pixel: 0.01,
  width_pixels: 900,
  height_pixels: 700,
  barriers: [],
  sources: [],
  occupiedRegions: [],
  regions: [],
  criticalPoints: [],
};

function materialThickness(barrier: Barrier): number {
  if (typeof barrier.requiredThickness_mm === 'number') return barrier.requiredThickness_mm;
  if (barrier.requiredThickness_mm && typeof barrier.requiredThickness_mm === 'object') {
    const values = Object.values(barrier.requiredThickness_mm).filter((v): v is number => typeof v === 'number');
    if (values.length) return Math.max(...values);
  }
  return barrier.thickness_mm || barrier.concreteEquivalent_mm || barrier.leadEquivalent_mm || 200;
}

function sourceKind(source: RadiationSource, fallback: MedicalRoomPreset): MedicalRoomPreset {
  const text = `${source.name || ''} ${source.modality?.name || ''}`.toLowerCase();
  if (text.includes('linac') || text.includes('versa') || text.includes('accelerator')) return 'linac';
  if (text.includes('pet')) return 'petct';
  if (text.includes('ct') || text.includes('tomograf')) return 'ct';
  if (text.includes('gamma')) return 'gammaKnife';
  if (text.includes('hdr') || text.includes('braqui')) return 'hdr';
  if (text.includes('cyclotron') || text.includes('radiofarm') || text.includes('nuclear')) return 'radiofarmacia';
  return fallback;
}

function presetLabel(preset: MedicalRoomPreset): string {
  const labels: Record<MedicalRoomPreset, string> = {
    linac: 'LINAC bunker',
    petct: 'PET/CT suite',
    ct: 'CT imaging room',
    gammaKnife: 'Gamma Knife suite',
    hdr: 'HDR brachytherapy',
    radiofarmacia: 'Radiopharmacy',
  };
  return labels[preset];
}

export function buildMedicalScene(floorPlan: FloorPlan = DEFAULT_MEDICAL_SCENE_FLOOR_PLAN, preset: MedicalRoomPreset = 'linac'): MedicalScene {
  const safeFloorPlan = floorPlan ?? DEFAULT_MEDICAL_SCENE_FLOOR_PLAN;
  const scale = safeFloorPlan.scale_m_per_pixel || 0.01;
  const barriers = safeFloorPlan.barriers || [];
  const sources = safeFloorPlan.sources || [];
  const points = [
    ...barriers.flatMap((b) => [[b.x1, b.y1], [b.x2, b.y2]] as Array<[number, number]>),
    ...sources.map((s) => [s.x, s.y] as [number, number]),
  ];

  const xs = points.length ? points.map(([x]) => x * scale) : [0, MIN_ROOM_SIZE_M];
  const zs = points.length ? points.map(([, y]) => y * scale) : [0, MIN_ROOM_SIZE_M];
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, MIN_ROOM_SIZE_M);
  const minZ = Math.min(...zs, 0);
  const maxZ = Math.max(...zs, MIN_ROOM_SIZE_M);
  const width = Math.max(maxX - minX + 2, MIN_ROOM_SIZE_M);
  const depth = Math.max(maxZ - minZ + 2, MIN_ROOM_SIZE_M);
  const center: [number, number, number] = [(minX + maxX) / 2, 0, (minZ + maxZ) / 2];

  const walls = barriers.map((barrier): MedicalWall => {
    const dx = barrier.x2 - barrier.x1;
    const dy = barrier.y2 - barrier.y1;
    const length_m = Math.max(Math.sqrt(dx * dx + dy * dy) * scale, 0.25);
    const requiredThickness_mm = materialThickness(barrier);
    const thickness_m = Math.max(requiredThickness_mm / 1000, 0.12);
    const centerX = ((barrier.x1 + barrier.x2) / 2) * scale;
    const centerZ = ((barrier.y1 + barrier.y2) / 2) * scale;
    const rotationY = -Math.atan2(dy, dx);

    return {
      id: barrier.id,
      name: barrier.name,
      center: [centerX, DEFAULT_CEILING_M / 2, centerZ],
      size: [length_m, DEFAULT_CEILING_M, thickness_m],
      rotationY,
      materialCode: barrier.materialCode || barrier.material || 'concreto',
      barrierType: barrier.barrierType,
      thickness_m,
      requiredThickness_mm,
    };
  });

  const equipment = sources.length
    ? sources.map((source): MedicalEquipment => {
        const visual = getEquipmentVisualProfile(source);
        return {
          id: source.id,
          name: source.name,
          kind: sourceKind(source, preset),
          position: [source.x * scale, 0, source.y * scale],
          rotationY: 0,
          footprint_m: [visual.footprint_m.width, visual.footprint_m.depth],
          assetHint: visual.preferredAsset,
          ragTags: visual.ragTags,
        };
      })
    : [{
        id: 'default-equipment',
        name: presetLabel(preset),
        kind: preset,
        position: [center[0], 0, center[2]] as [number, number, number],
        rotationY: 0,
        footprint_m: [2.4, 3.2] as [number, number],
        ragTags: [preset, 'default-equipment'],
      }];

  const dosePoints = equipment.flatMap((eq) => [0.9, 1.7, 2.6].map((radius, index) => ({
    id: `${eq.id}-dose-${index}`,
    position: [eq.position[0], 0.05 + index * 0.02, eq.position[2]] as [number, number, number],
    radius,
    intensity: 0.35 - index * 0.08,
  })));

  const zones = (safeFloorPlan.occupiedRegions || [])
    .filter((region) => region.points.length >= 3)
    .map((region): MedicalZone => {
      const points = region.points.map((point) => [point.x * scale, 0.012, point.y * scale] as [number, number, number]);
      const avgX = points.reduce((sum, point) => sum + point[0], 0) / points.length;
      const avgZ = points.reduce((sum, point) => sum + point[2], 0) / points.length;
      const text = `${region.name || ''}`.toLowerCase();
      const controlled = text.includes('control') || text.includes('hot') || text.includes('restricted') || region.designGoal_mSv_per_wk <= 0.02;
      return {
        id: region.id,
        name: region.name,
        points,
        center: [avgX, 0.025, avgZ],
        color: controlled ? '#f97316' : '#14b8a6',
        controlled,
      };
    });

  return {
    roomName: presetLabel(preset),
    bounds: { width, depth, center },
    review: {
      primaryBarriers: walls.filter((wall) => wall.barrierType === 'primary').length,
      secondaryBarriers: walls.filter((wall) => wall.barrierType !== 'primary').length,
      maxRequiredThickness_mm: walls.length ? Math.max(...walls.map((wall) => wall.requiredThickness_mm || 0)) : 0,
    },
    walls,
    equipment,
    dosePoints,
    zones,
    floorScaleLabel: `${scale.toFixed(4)} m/px`,
  };
}

export function medicalSceneToOBJ(scene: MedicalScene): string {
  const lines = [
    '# RadShield-MX Medical 3D Floor Plan',
    `# Scene: ${scene.roomName}`,
    `# Walls: ${scene.walls.length}`,
    `# Equipment: ${scene.equipment.length}`,
    'o medical_floor_plan',
  ];

  let vertexOffset = 1;
  const addBox = (name: string, center: [number, number, number], size: [number, number, number]) => {
    const [cx, cy, cz] = center;
    const [sx, sy, sz] = size.map((v) => v / 2) as [number, number, number];
    const vertices = [
      [cx - sx, cy - sy, cz - sz], [cx + sx, cy - sy, cz - sz], [cx + sx, cy + sy, cz - sz], [cx - sx, cy + sy, cz - sz],
      [cx - sx, cy - sy, cz + sz], [cx + sx, cy - sy, cz + sz], [cx + sx, cy + sy, cz + sz], [cx - sx, cy + sy, cz + sz],
    ];
    const faces = [
      [1, 2, 3, 4], [5, 8, 7, 6], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 8, 4], [5, 1, 4, 8],
    ];
    lines.push(`o ${name.replace(/\W+/g, '_')}`);
    vertices.forEach((v) => lines.push(`v ${v.map((n) => n.toFixed(4)).join(' ')}`));
    faces.forEach((face) => lines.push(`f ${face.map((i) => i + vertexOffset - 1).join(' ')}`));
    vertexOffset += vertices.length;
  };

  addBox('floor', [scene.bounds.center[0], -0.05, scene.bounds.center[2]], [scene.bounds.width, 0.1, scene.bounds.depth]);
  scene.walls.forEach((wall) => addBox(wall.name, wall.center, wall.size));
  scene.equipment.forEach((eq) => addBox(eq.name, [eq.position[0], 0.55, eq.position[2]], [eq.footprint_m[0], 1.1, eq.footprint_m[1]]));

  return `${lines.join('\n')}\n`;
}
