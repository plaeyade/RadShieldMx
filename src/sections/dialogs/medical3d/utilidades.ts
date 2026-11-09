import type { Medical3DMode, MedicalScene } from '@/lib/medical3D/sceneBuilder';
import type { F147InspectionStation } from '@/lib/f147Medical3DInspection';
import { buildDefaultPbrMaterialDatabase, type PbrMaterialDatabase } from '@/lib/medical3D/pbrMaterialDatabase';
import { materialColors, type RealismAid, type VisualWorkflowPreset, type VisualEvidenceCapture, PBR_MATERIAL_DB_STORAGE_KEY } from './constantes';

export function stableSceneHash(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `scene-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function buildVisualWorkflowChecklist(scene: MedicalScene, stations: F147InspectionStation[], realismAids: Record<RealismAid, boolean>) {
  return [
    {
      id: 'geometry',
      label: 'Geometria cargada',
      status: scene.walls.length > 0 || scene.equipment.length > 0 ? 'ready' : 'blocked',
      evidence: `${scene.walls.length} muros, ${scene.equipment.length} equipos`,
    },
    {
      id: 'materials',
      label: 'Materiales visibles',
      status: scene.walls.every((wall) => Boolean(wall.materialCode)) && realismAids.materialBands ? 'ready' : 'review',
      evidence: realismAids.materialBands ? 'Bandas material/espesor activas' : 'Activar bandas para captura final',
    },
    {
      id: 'equipment',
      label: 'Equipos sembrados',
      status: scene.equipment.length > 0 && realismAids.equipmentFootprints ? 'ready' : 'review',
      evidence: `${scene.equipment.length} footprint(s)`,
    },
    {
      id: 'dose-context',
      label: 'Contexto dosis/zonas',
      status: scene.dosePoints.length > 0 && scene.zones.length > 0 ? 'ready' : 'review',
      evidence: `${scene.dosePoints.length} puntos visuales, ${scene.zones.length} zonas`,
    },
    {
      id: 'stations',
      label: 'Estaciones de recorrido',
      status: stations.length >= 3 ? 'ready' : 'review',
      evidence: `${stations.length} bookmark(s) F147`,
    },
  ];
}

export function buildVisualEvidenceGate(captures: VisualEvidenceCapture[], checklist: ReturnType<typeof buildVisualWorkflowChecklist>) {
  const readyChecklist = checklist.filter((item) => item.status === 'ready').length;
  const requiredWorkflows: VisualWorkflowPreset[] = ['overview', 'barriers', 'equipment', 'dose'];
  const capturedWorkflows = new Set(captures.map((capture) => capture.workflow));
  const missingWorkflows = requiredWorkflows.filter((workflow) => !capturedWorkflows.has(workflow));
  const walkthroughCaptured = capturedWorkflows.has('walkthrough');
  const checklistReady = readyChecklist === checklist.length;
  const minimumCapturesReady = missingWorkflows.length === 0;
  const status = checklistReady && minimumCapturesReady ? 'ready' : captures.length > 0 ? 'review' : 'pending';

  return {
    schema: 'radshield-mx.medical3d.visual-evidence-gate.f366.v1',
    status,
    checklistReady,
    minimumCapturesReady,
    walkthroughCaptured,
    readyChecklist,
    checklistTotal: checklist.length,
    captureCount: captures.length,
    requiredWorkflows,
    missingWorkflows,
    recommendation:
      status === 'ready'
        ? 'Evidencia visual lista para anexar como soporte no certificable.'
        : `Faltan capturas: ${missingWorkflows.length ? missingWorkflows.join(', ') : 'cerrar checklist visual'}.`,
  };
}

export function medicalPbrProfile(materialCode: string) {
  const normalized = materialCode.toLowerCase();
  if (normalized.includes('plomo')) return { color: '#424853', roughness: 0.42, metalness: 0.18, opacity: 0.96, category: 'lead-shield' };
  if (normalized.includes('acero')) return { color: '#9aa5b1', roughness: 0.33, metalness: 0.42, opacity: 0.95, category: 'steel-structure' };
  if (normalized.includes('vidrio')) return { color: '#93c5c2', roughness: 0.18, metalness: 0.02, opacity: 0.48, category: 'leaded-glass' };
  if (normalized.includes('baritado') || normalized.includes('alta') || normalized.includes('hd')) {
    return { color: '#9b9488', roughness: 0.7, metalness: 0.04, opacity: 0.94, category: 'high-density-masonry' };
  }
  return { color: '#d2cec5', roughness: 0.66, metalness: 0.04, opacity: 0.93, category: 'concrete-shield' };
}

export function pointHitsWall(x: number, z: number, wall: MedicalScene['walls'][number], radius = 0.28) {
  const dx = x - wall.center[0];
  const dz = z - wall.center[2];
  const cos = Math.cos(-wall.rotationY);
  const sin = Math.sin(-wall.rotationY);
  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;
  return Math.abs(localX) <= wall.size[0] / 2 + radius && Math.abs(localZ) <= wall.size[2] / 2 + radius;
}

export function pointHitsEquipment(x: number, z: number, item: MedicalScene['equipment'][number], radius = 0.34) {
  const dx = x - item.position[0];
  const dz = z - item.position[2];
  return Math.abs(dx) <= item.footprint_m[0] / 2 + radius && Math.abs(dz) <= item.footprint_m[1] / 2 + radius;
}

export function isWalkthroughBlocked(scene: MedicalScene, x: number, z: number) {
  return scene.walls.some((wall) => pointHitsWall(x, z, wall)) || scene.equipment.some((item) => pointHitsEquipment(x, z, item));
}

export function downloadText(filename: string, content: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function loadStoredPbrMaterialDatabase(): PbrMaterialDatabase {
  if (typeof window === 'undefined') return buildDefaultPbrMaterialDatabase();
  try {
    const raw = window.localStorage.getItem(PBR_MATERIAL_DB_STORAGE_KEY);
    if (!raw) return buildDefaultPbrMaterialDatabase();
    const parsed = JSON.parse(raw) as PbrMaterialDatabase;
    if (parsed?.schema === 'radshield-mx.medical3d.pbr-material-db.f461-f463.v1' && Array.isArray(parsed.records)) return parsed;
    return buildDefaultPbrMaterialDatabase();
  } catch {
    return buildDefaultPbrMaterialDatabase();
  }
}

export function wallColor(materialCode: string, mode: Medical3DMode) {
  if (mode === 'technical') return materialColors[materialCode] || materialColors.default;
  if (mode === 'dose') return '#64748b';
  return materialCode.includes('plomo') ? '#4b5563' : '#d7d2c8';
}
