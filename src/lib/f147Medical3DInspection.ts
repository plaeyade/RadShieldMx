import type { FloorPlan } from '@/types/radshield';
import type { MedicalScene } from '@/lib/medical3D/sceneBuilder';

export interface F147InspectionStation {
  id: string;
  label: string;
  purpose: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  evidence: string[];
}

export interface F147Medical3DInspectionSummary {
  phase: 'F147';
  status: 'implemented-medical-3d-inspection';
  roomName: string;
  floorPlanName: string;
  walkthroughMode: string;
  stations: F147InspectionStation[];
  visualLayers: string[];
  materialReview: string[];
  exportArtifacts: string[];
  qaChecklist: Array<{ id: string; label: string; status: 'ready' | 'review' }>;
  decision: string;
}

function thickestWall(scene: MedicalScene) {
  return [...scene.walls].sort((a, b) => (b.requiredThickness_mm || 0) - (a.requiredThickness_mm || 0))[0];
}

export function buildF147Medical3DInspection(scene: MedicalScene, floorPlan?: FloorPlan): F147Medical3DInspectionSummary {
  const [cx, , cz] = scene.bounds.center;
  const primaryEquipment = scene.equipment[0];
  const mainWall = thickestWall(scene);
  const controlledZone = scene.zones.find((zone) => zone.controlled) ?? scene.zones[0];
  const stationBaseY = 1.65;

  const stations: F147InspectionStation[] = [
    {
      id: 'entry-overview',
      label: 'Entrada / vista general',
      purpose: 'Verificar lectura espacial de sala, acceso, equipo y volumen de blindaje.',
      position: [cx, stationBaseY, cz + Math.max(2.2, scene.bounds.depth * 0.36)],
      lookAt: [cx, 1.25, cz],
      evidence: ['captura PNG', 'nombre de plano', 'escala', 'zonas visibles'],
    },
  ];

  if (primaryEquipment) {
    stations.push({
      id: 'equipment-footprint',
      label: 'Equipo / isocentro',
      purpose: 'Revisar footprint, orientacion, clearances y relacion con barreras.',
      position: [primaryEquipment.position[0] + 2.2, stationBaseY, primaryEquipment.position[2] + 2.4],
      lookAt: [primaryEquipment.position[0], 0.9, primaryEquipment.position[2]],
      evidence: ['footprint real', 'asset/simbolo equipo', 'tags RAG', 'zona controlada'],
    });
  }

  if (mainWall) {
    stations.push({
      id: 'critical-wall',
      label: 'Barrera critica',
      purpose: 'Inspeccionar espesor requerido, material, tipo de barrera y acabado visible.',
      position: [mainWall.center[0] + 1.8, stationBaseY, mainWall.center[2] + 1.8],
      lookAt: [mainWall.center[0], 1.45, mainWall.center[2]],
      evidence: ['espesor mm', 'material', 'tipo primaria/secundaria', 'cita de calculo'],
    });
  }

  if (controlledZone) {
    stations.push({
      id: 'controlled-zone',
      label: 'Zona controlada',
      purpose: 'Confirmar limites de zona, ocupacion, senalizacion y rutas de acceso.',
      position: [controlledZone.center[0] + 1.4, stationBaseY, controlledZone.center[2] + 1.4],
      lookAt: [controlledZone.center[0], 0.6, controlledZone.center[2]],
      evidence: ['poligono zona', 'ocupacion', 'umbral regulatorio', 'senalizacion'],
    });
  }

  const materials = Array.from(new Set(scene.walls.map((wall) => wall.materialCode || 'concreto')));
  const qaChecklist = [
    { id: 'geometry', label: 'Geometria desde floorplan/barriers', status: scene.walls.length > 0 ? 'ready' : 'review' },
    { id: 'equipment', label: 'Equipo con footprint y simbolo 3D', status: scene.equipment.length > 0 ? 'ready' : 'review' },
    { id: 'thickness', label: 'Espesores visibles por barrera', status: scene.review.maxRequiredThickness_mm > 0 ? 'ready' : 'review' },
    { id: 'zones', label: 'Zonas controladas/ocupadas visibles', status: scene.zones.length > 0 ? 'ready' : 'review' },
    { id: 'exports', label: 'PNG/OBJ/JSON/F147 pack exportables', status: 'ready' },
  ] satisfies F147Medical3DInspectionSummary['qaChecklist'];

  return {
    phase: 'F147',
    status: 'implemented-medical-3d-inspection',
    roomName: scene.roomName,
    floorPlanName: floorPlan?.name ?? 'Plano sin nombre',
    walkthroughMode: 'WASD/flechas para avance, A/D para lateral, Q/E para giro; OrbitControls para revision general.',
    stations,
    visualLayers: [
      'volumen de sala con piso/techo/acabados procedurales',
      'muros por material y espesor requerido',
      'equipos medicos con footprint y tags RAG',
      'zonas controladas/ocupadas',
      'anillos de dosis para modo dose',
      'fixtures clinicos y captura de evidencia',
    ],
    materialReview: materials.map((material) => `${material}: visible en muros; confirmar densidad/TVL/peso/costo en F142/F144 antes de memoria final.`),
    exportArtifacts: ['PNG snapshot', 'OBJ geometry', 'medical_3d_review JSON', 'F147 inspection pack JSON', 'CADx AI render brief', 'CADCodeVerify pack'],
    qaChecklist,
    decision:
      'F147 convierte el visor 3D medico en una inspeccion recorrible y exportable del bunker/sala con equipo, espesores, zonas, acabados, materiales y evidencia visual.',
  };
}
