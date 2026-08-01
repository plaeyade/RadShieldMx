import type { FloorPlan } from '@/types/radshield';
import type { F426ToF430CalcRendererClosure } from '@/lib/f426ToF430CalcRendererClosure';
import type { F431ToF435RendererReleaseGate } from '@/lib/f431ToF435RendererReleaseGate';

export interface F436VisualBaselineViewport {
  id: string;
  label: string;
  width: number;
  height: number;
  requiredSurfaces: string[];
  acceptance: string;
}

export interface F437PdfEvidenceLiveLink {
  id: string;
  label: string;
  source: string;
  target: 'Memoria IA' | 'PDF Report' | 'Evidence Pack';
  payloadFields: string[];
  blockingRule: string;
}

export interface F438RendererGeometryCoreEntity {
  id: string;
  label: string;
  entityType: 'barrier' | 'source' | 'region' | 'penetration' | 'overlay';
  normalizedFields: string[];
  rendererLayer: string;
  enabledByFlag: boolean;
}

export interface F436ToF438RendererV2Bridge {
  schema: 'radshield-mx.f436-f438.renderer-v2-bridge.v1';
  phaseRange: 'F436-F438';
  status: 'renderer-v2-bridge-ready' | 'renderer-v2-bridge-gated';
  visualBaselines: F436VisualBaselineViewport[];
  pdfEvidenceLinks: F437PdfEvidenceLiveLink[];
  geometryCoreEntities: F438RendererGeometryCoreEntity[];
  featureFlagPolicy: {
    masterFlag: 'VITE_CANVAS_HIGH_RISK_CAD';
    eventFlag: 'VITE_CANVAS_EVENT_CONTROLLER_V2';
    eventControllerEnabled: false;
    rollback: string[];
  };
  acceptanceGates: string[];
}

export function buildF436ToF438RendererV2Bridge(args: {
  floorPlan: FloorPlan;
  closure: F426ToF430CalcRendererClosure;
  releaseGate: F431ToF435RendererReleaseGate;
}): F436ToF438RendererV2Bridge {
  const { floorPlan, closure, releaseGate } = args;
  const hasCanvasData = floorPlan.barriers.length > 0 || floorPlan.sources.length > 0;
  const canStartGeometryCore = releaseGate.rendererBaseDecision.decision !== 'block-renderer-rewrite';
  const missingCore = closure.releaseBlocks.some((block) => /falta escala|faltan barreras|falta equipo/i.test(block));

  const visualBaselines: F436VisualBaselineViewport[] = [
    {
      id: 'desktop-bim-canvas',
      label: 'Desktop BIM canvas',
      width: 1600,
      height: 960,
      requiredSurfaces: ['f100-main-floorplan-canvas', 'f186-sidebar-stable-width', 'f411-bim-ribbon', 'f426-f430-calc-renderer-closure', 'f431-f435-renderer-release-gate'],
      acceptance: 'Canvas, sidebar y panel BIM visibles sin overlays bloqueando el area de trabajo.',
    },
    {
      id: 'mobile-tablet-canvas',
      label: 'Tablet/mobile guarded',
      width: 390,
      height: 844,
      requiredSurfaces: ['f100-main-floorplan-canvas', 'f191-pyrate-inspired-toolbar'],
      acceptance: 'Canvas montado y toolbar accesible; paneles BIM pueden colapsar por viewport.',
    },
  ];

  const pdfEvidenceLinks: F437PdfEvidenceLiveLink[] = [
    {
      id: 'surface-role-table-link',
      label: 'Roles de superficie',
      source: 'F426SurfaceRoleCalculation',
      target: 'Memoria IA',
      payloadFields: ['role', 'formulaFamily', 'standard', 'requiredInputs', 'outputs', 'warnings'],
      blockingRule: 'No firmar si un rol requerido esta en needs-geometry o needs-calculation.',
    },
    {
      id: 'penetration-appendix-link',
      label: 'Anexo de penetraciones',
      source: 'F427PenetrationPenalty',
      target: 'PDF Report',
      payloadFields: ['trigger', 'penaltyModel', 'defaultPenaltyFactor', 'evidenceRequired', 'blocking'],
      blockingRule: 'Hueco/sleeve bloqueante requiere mitigacion y evidencia antes de PDF final.',
    },
    {
      id: 'structural-load-link',
      label: 'Carga estructural',
      source: 'F428StructuralLoadItem',
      target: 'Evidence Pack',
      payloadFields: ['massKgPerM2', 'structuralLoadKPa', 'source', 'status', 'rendererUse'],
      blockingRule: 'Material/equipo blocked se reporta como preliminar y requiere dato de proveedor/estructura.',
    },
    {
      id: 'visual-baseline-link',
      label: 'Baseline visual',
      source: 'F436VisualBaselineViewport',
      target: 'Evidence Pack',
      payloadFields: ['screenshot', 'viewport', 'requiredSurfaces', 'acceptance'],
      blockingRule: 'Sin captura baseline no activar renderer geometry core en staging.',
    },
  ];

  const geometryCoreEntities: F438RendererGeometryCoreEntity[] = [
    {
      id: 'geometry-core-barrier',
      label: 'Barrier geometry core',
      entityType: 'barrier',
      normalizedFields: ['id', 'x1', 'y1', 'x2', 'y2', 'surfaceRole', 'materialCode', 'thickness_mm', 'requiredThickness_mm'],
      rendererLayer: 'shielding-surfaces',
      enabledByFlag: canStartGeometryCore,
    },
    {
      id: 'geometry-core-source',
      label: 'Source geometry core',
      entityType: 'source',
      normalizedFields: ['id', 'x', 'y', 'modality', 'workloadValue', 'workloadUnit', 'rotationDeg', 'footprint_m'],
      rendererLayer: 'clinical-equipment',
      enabledByFlag: canStartGeometryCore,
    },
    {
      id: 'geometry-core-region',
      label: 'Region geometry core',
      entityType: 'region',
      normalizedFields: ['id', 'points', 'occupancyFactor', 'designGoal_mSv_per_wk', 'controlledZone'],
      rendererLayer: 'occupancy-zones',
      enabledByFlag: canStartGeometryCore,
    },
    {
      id: 'geometry-core-penetration',
      label: 'Penetration geometry core',
      entityType: 'penetration',
      normalizedFields: ['id', 'affectedBarrier', 'system', 'diameter', 'penaltyFactor', 'mitigationEvidence'],
      rendererLayer: 'mep-penetrations',
      enabledByFlag: canStartGeometryCore,
    },
    {
      id: 'geometry-core-overlay',
      label: 'Evidence overlay core',
      entityType: 'overlay',
      normalizedFields: ['surfaceRole', 'qaStatus', 'releaseBlocks', 'citationIds', 'visualExportId'],
      rendererLayer: 'evidence-overlays',
      enabledByFlag: canStartGeometryCore,
    },
  ];

  const status = canStartGeometryCore && !missingCore ? 'renderer-v2-bridge-ready' : 'renderer-v2-bridge-gated';

  return {
    schema: 'radshield-mx.f436-f438.renderer-v2-bridge.v1',
    phaseRange: 'F436-F438',
    status,
    visualBaselines,
    pdfEvidenceLinks,
    geometryCoreEntities,
    featureFlagPolicy: {
      masterFlag: 'VITE_CANVAS_HIGH_RISK_CAD',
      eventFlag: 'VITE_CANVAS_EVENT_CONTROLLER_V2',
      eventControllerEnabled: false,
      rollback: [
        'Set VITE_CANVAS_HIGH_RISK_CAD=false.',
        'Keep VITE_CANVAS_EVENT_CONTROLLER_V2=false.',
        'Clear localStorage.radshield_feature_flags.',
        'Fallback to CanvasArea/useCanvas renderer path.',
      ],
    },
    acceptanceGates: [
      'F229 canvas CAD E2E passes.',
      'F431-F435 renderer release gate E2E passes.',
      'F436 desktop/mobile baseline screenshots generated.',
      'F437 Evidence/Memoria manifest has role, penetration, structural and visual links.',
      hasCanvasData ? 'Canvas has geometry/source data for renderer core.' : 'Canvas shell can render empty baseline; project geometry still needed for real core.',
    ],
  };
}
