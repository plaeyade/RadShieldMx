import type { FloorPlan } from '@/types/radshield';
import type { MedicalScene } from '@/lib/medical3D/sceneBuilder';

export type F92WorkflowStageId =
  | 'design'
  | 'equipment'
  | 'shielding'
  | 'verification'
  | 'reports'
  | 'evidence'
  | 'integrations';

export interface F92WorkflowStage {
  id: F92WorkflowStageId;
  label: string;
  goal: string;
  primaryDialogs: string[];
}

export const F92_REAL_WORKFLOW: F92WorkflowStage[] = [
  {
    id: 'design',
    label: 'Diseno',
    goal: 'Plano, escala, zonas, capas, cotas, importacion CAD/DXF y preparacion del floorplan.',
    primaryDialogs: ['floorPlanFeatures', 'dxfViewer', 'revitIfcImport', 'medicalFloorPlan3D'],
  },
  {
    id: 'equipment',
    label: 'Equipos',
    goal: 'Seleccion, sembrado y revision de fuentes: LINAC, Gamma Knife, HDR, PET/CT, CT, ciclotron y radiofarmacia.',
    primaryDialogs: ['equipmentLibrary', 'equipmentDB', 'sourceLibrary', 'gammaKnife', 'braquiCo60', 'cycloneKIUBE'],
  },
  {
    id: 'shielding',
    label: 'Blindaje',
    goal: 'Calculo principal, barreras primarias/secundarias, multi-layer, neutrones, cielo, suelo/techo y optimizacion.',
    primaryDialogs: ['shieldingCalculator', 'quickBarrier', 'multiLayerShield', 'neutronShielding', 'floorCeiling', 'costOptimizer'],
  },
  {
    id: 'verification',
    label: 'Verificacion',
    goal: 'QA numerico, NCRP/IAEA/UAQ, sensibilidad, incertidumbre, heatmaps, cross-validation y performance.',
    primaryDialogs: ['ncrpValidation', 'crossValidation', 'sensitivityAnalysis', 'uncertainty', 'spatialDoseMap', 'performanceDashboard'],
  },
  {
    id: 'reports',
    label: 'Reportes',
    goal: 'Memoria analitica, PDF, CNSNS, reportes regulatorios, costos y exportaciones.',
    primaryDialogs: ['memoriaAI', 'pdfReport', 'regulatoryReport', 'cnsns', 'costEstimator', 'batchReportExporter'],
  },
  {
    id: 'evidence',
    label: 'Evidencia',
    goal: 'Evidence Pack, RAG, citas por claim, snapshot QA, bibliografia y trazabilidad documental.',
    primaryDialogs: ['evidencePack', 'bibliography', 'referenceLibrary', 'auditTrail', 'auditLog'],
  },
  {
    id: 'integrations',
    label: 'Integraciones',
    goal: 'Conectores externos CAD/BIM/MC/DICOM/PACS/Python/cloud y conversiones controladas.',
    primaryDialogs: ['externalConnector', 'bimConnector', 'monteCarloIntegration', 'dicom', 'pacsReal', 'pythonIntegration'],
  },
];

export interface F923DInspectionSummary {
  walls: number;
  equipment: number;
  zones: number;
  controlledZones: number;
  maxWallThickness_m: number;
  inspectionReady: boolean;
  walkthroughReady: boolean;
  doseOverlayReady: boolean;
  reviewItems: string[];
}

export function buildF923DInspectionSummary(scene: MedicalScene, floorPlan?: FloorPlan): F923DInspectionSummary {
  const walls = scene.walls.length;
  const equipment = scene.equipment.length;
  const zones = scene.zones.length;
  const controlledZones = scene.zones.filter((zone) => zone.controlled).length;
  const maxWallThickness_m = scene.walls.reduce((max, wall) => Math.max(max, wall.thickness_m ?? 0), 0);
  const reviewItems = [
    walls === 0 ? 'Agregar barreras/muros al floorplan antes de inspeccion final.' : '',
    equipment === 0 ? 'Sembrar equipos/fuentes para recorrido clinico.' : '',
    controlledZones === 0 ? 'Dibujar zona controlada o puntos criticos para memoria.' : '',
    maxWallThickness_m <= 0 ? 'Validar espesores calculados o presets antes de exportar capturas.' : '',
  ].filter(Boolean);

  return {
    walls,
    equipment,
    zones,
    controlledZones,
    maxWallThickness_m,
    inspectionReady: walls > 0 && equipment > 0,
    walkthroughReady: walls > 0 || Boolean(floorPlan?.imageUrl),
    doseOverlayReady: walls > 0 && equipment > 0,
    reviewItems,
  };
}
