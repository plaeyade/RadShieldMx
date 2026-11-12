import type { Barrier, FloorPlan, OccupiedRegion, RadiationSource } from '@/types/radshield';
import type { F426SurfaceRole, F426ToF430CalcRendererClosure } from '@/lib/f426ToF430CalcRendererClosure';
import type { F436ToF438RendererV2Bridge } from '@/lib/f436ToF438RendererV2Bridge';
import { getModalityEnergy_MeV } from '@/lib/shieldingMath';
import { P_NO_CONTROLADA_mSv_semana } from './limitesDosis';

export type F439GeometryEntityType = 'barrier' | 'source' | 'region' | 'penetration' | 'overlay';

export interface F439GeometryPoint {
  x: number;
  y: number;
}

export interface F439GeometryBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface F439NormalizedGeometryEntity {
  id: string;
  type: F439GeometryEntityType;
  label: string;
  layer: string;
  role?: F426SurfaceRole | 'evidence';
  points: F439GeometryPoint[];
  bounds: F439GeometryBounds;
  materialCode?: string;
  thicknessMm?: number;
  modality?: string;
  evidenceIds: string[];
  warnings: string[];
}

export interface F440OverlayRenderPlan {
  id: string;
  label: string;
  layer: string;
  zIndex: number;
  entityIds: string[];
  style: {
    stroke: string;
    fill: string;
    opacity: number;
    lineDash?: number[];
  };
  evidenceOutput: string;
}

export interface F441RendererCorePreflight {
  id: string;
  label: string;
  pass: boolean;
  evidence: string;
  rollback: string;
}

export interface F439ToF441RendererGeometryCore {
  schema: 'radshield-mx.f439-f441.renderer-geometry-core.v1';
  phaseRange: 'F439-F441';
  status: 'geometry-core-ready' | 'geometry-core-gated';
  normalizedEntities: F439NormalizedGeometryEntity[];
  overlayPlans: F440OverlayRenderPlan[];
  preflight: F441RendererCorePreflight[];
  enabledByFeatureFlag: boolean;
  eventControllerTouched: false;
  releaseDecision: string;
}

const ROLE_LAYER: Record<F426SurfaceRole, string> = {
  primary: 'shielding-primary',
  secondary: 'shielding-secondary',
  maze: 'shielding-maze',
  door: 'shielding-door',
  penetration: 'mep-penetrations',
};

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function boundsFromPoints(points: F439GeometryPoint[]): F439GeometryBounds {
  if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

function roleForBarrier(barrier: Barrier): F426SurfaceRole {
  const name = barrier.name.toLowerCase();
  if (/door|puerta/i.test(name)) return 'door';
  if (/maze|laberinto/i.test(name)) return 'maze';
  if (/penetration|penetracion|duct|sleeve|hueco|opening/i.test(name)) return 'penetration';
  return barrier.barrierType === 'primary' ? 'primary' : 'secondary';
}

function barrierThicknessMm(barrier: Barrier): number {
  if (Number.isFinite(barrier.thickness_mm)) return Math.max(0, barrier.thickness_mm ?? 0);
  if (typeof barrier.requiredThickness_mm === 'number' && Number.isFinite(barrier.requiredThickness_mm)) {
    return Math.max(0, barrier.requiredThickness_mm);
  }
  if (barrier.requiredThickness_mm && typeof barrier.requiredThickness_mm === 'object') {
    const values = Object.values(barrier.requiredThickness_mm).filter((value): value is number => Number.isFinite(value));
    return Math.max(0, ...values, 0);
  }
  if (Number.isFinite(barrier.concreteEquivalent_mm)) return Math.max(0, barrier.concreteEquivalent_mm ?? 0);
  if (Number.isFinite(barrier.leadEquivalent_mm)) return Math.max(0, barrier.leadEquivalent_mm ?? 0);
  return 0;
}

function barrierEntity(barrier: Barrier): F439NormalizedGeometryEntity {
  const role = roleForBarrier(barrier);
  const thicknessMm = barrierThicknessMm(barrier);
  const points = [
    { x: finiteNumber(barrier.x1), y: finiteNumber(barrier.y1) },
    { x: finiteNumber(barrier.x2), y: finiteNumber(barrier.y2) },
  ];
  const warnings = [
    thicknessMm <= 0 ? 'Espesor no calculado o no asignado.' : '',
    !barrier.materialCode && !barrier.material ? 'Material sin codigo versionado.' : '',
    role === 'penetration' ? 'Penetracion requiere mitigacion local y evidencia.' : '',
  ].filter(Boolean);

  return {
    id: `barrier:${barrier.id}`,
    type: role === 'penetration' ? 'penetration' : 'barrier',
    label: barrier.name,
    layer: ROLE_LAYER[role],
    role,
    points,
    bounds: boundsFromPoints(points),
    materialCode: barrier.materialCode || barrier.material || 'concrete',
    thicknessMm,
    evidenceIds: ['F426', 'F427', 'F428', barrier.calculationTrace?.formulaId].filter(Boolean) as string[],
    warnings,
  };
}

function sourceEntity(source: RadiationSource, scaleMPerPixel: number): F439NormalizedGeometryEntity {
  const footprintWidthPx = Math.max(20, finiteNumber(source.footprint_m?.width, 2) / Math.max(scaleMPerPixel, 0.001));
  const footprintDepthPx = Math.max(20, finiteNumber(source.footprint_m?.depth, 2) / Math.max(scaleMPerPixel, 0.001));
  const halfW = footprintWidthPx / 2;
  const halfD = footprintDepthPx / 2;
  const points = [
    { x: source.x - halfW, y: source.y - halfD },
    { x: source.x + halfW, y: source.y - halfD },
    { x: source.x + halfW, y: source.y + halfD },
    { x: source.x - halfW, y: source.y + halfD },
  ];
  return {
    id: `source:${source.id}`,
    type: 'source',
    label: source.name,
    layer: 'clinical-equipment',
    points,
    bounds: boundsFromPoints(points),
    modality: source.modality.id,
    evidenceIds: ['F426', source.modality.standard || 'standard-pending'],
    warnings: [
      source.workloadValue > 0 ? '' : 'Workload no definido.',
      source.modality.category === 'therapy' && getModalityEnergy_MeV(source) > 10 ? 'Energia alta: revisar neutrones/puerta/laberinto.' : '',
    ].filter(Boolean),
  };
}

function regionEntity(region: OccupiedRegion): F439NormalizedGeometryEntity {
  const points = region.points.map((point) => ({ x: finiteNumber(point.x), y: finiteNumber(point.y) }));
  const controlled = region.designGoal_mSv_per_wk <= P_NO_CONTROLADA_mSv_semana ? 'public-zone' : 'controlled-zone';
  return {
    id: `region:${region.id}`,
    type: 'region',
    label: region.name,
    layer: controlled,
    role: 'evidence',
    points,
    bounds: boundsFromPoints(points),
    evidenceIds: ['F430', 'occupancy-design-goal'],
    warnings: points.length >= 3 ? [] : ['Zona sin poligono cerrado.'],
  };
}

function evidenceOverlayEntity(closure: F426ToF430CalcRendererClosure): F439NormalizedGeometryEntity {
  const blocking = closure.releaseBlocks.length;
  return {
    id: 'overlay:evidence-release-state',
    type: 'overlay',
    label: blocking ? 'Release bloqueado por evidencia' : 'Evidence/Memoria listo',
    layer: 'evidence-overlays',
    role: 'evidence',
    points: [],
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    evidenceIds: ['F430', 'F431', 'F437'],
    warnings: closure.releaseBlocks,
  };
}

function overlayPlan(
  id: string,
  label: string,
  layer: string,
  zIndex: number,
  entities: F439NormalizedGeometryEntity[],
  style: F440OverlayRenderPlan['style'],
  evidenceOutput: string,
): F440OverlayRenderPlan {
  return {
    id,
    label,
    layer,
    zIndex,
    entityIds: entities.filter((entity) => entity.layer === layer || (layer === 'shielding-surfaces' && entity.type === 'barrier')).map((entity) => entity.id),
    style,
    evidenceOutput,
  };
}

export function buildF439ToF441RendererGeometryCore(args: {
  floorPlan: FloorPlan;
  closure: F426ToF430CalcRendererClosure;
  bridge: F436ToF438RendererV2Bridge;
  highRiskFlagEnabled?: boolean;
}): F439ToF441RendererGeometryCore {
  const { floorPlan, closure, bridge, highRiskFlagEnabled = false } = args;
  const scale = finiteNumber(floorPlan.scale_m_per_pixel, 0.02);
  const regions = [...(floorPlan.occupiedRegions || []), ...(floorPlan.regions || [])];
  const normalizedEntities = [
    ...floorPlan.barriers.map(barrierEntity),
    ...floorPlan.sources.map((source) => sourceEntity(source, scale)),
    ...regions.map(regionEntity),
    evidenceOverlayEntity(closure),
  ];

  const overlayPlans: F440OverlayRenderPlan[] = [
    overlayPlan('shielding-surfaces', 'Barreras por rol', 'shielding-surfaces', 20, normalizedEntities, { stroke: '#22c55e', fill: '#22c55e', opacity: 0.22 }, 'Memoria IA: tabla de barreras, roles y espesores.'),
    overlayPlan('clinical-equipment', 'Equipos/fuentes', 'clinical-equipment', 30, normalizedEntities, { stroke: '#ef4444', fill: '#ef4444', opacity: 0.18 }, 'Evidence Pack: footprint, modalidad y workload.'),
    overlayPlan('occupancy-zones', 'Zonas y ocupacion', 'controlled-zone', 25, normalizedEntities, { stroke: '#38bdf8', fill: '#0ea5e9', opacity: 0.14, lineDash: [6, 4] }, 'PDF: colindancias, T y P por zona.'),
    overlayPlan('mep-penetrations', 'Penetraciones MEP', 'mep-penetrations', 40, normalizedEntities, { stroke: '#06b6d4', fill: '#06b6d4', opacity: 0.26, lineDash: [2, 3] }, 'Anexo: sleeves, ductos, huecos y mitigacion.'),
    overlayPlan('evidence-overlays', 'Estado evidencia', 'evidence-overlays', 50, normalizedEntities, { stroke: '#a78bfa', fill: '#a78bfa', opacity: 0.18 }, 'Checklist F430-F437 para Memoria/PDF/Evidence.'),
  ];

  const preflight: F441RendererCorePreflight[] = [
    {
      id: 'entities-normalized',
      label: 'Entidades normalizadas',
      pass: normalizedEntities.length > 1,
      evidence: `${normalizedEntities.length} entidades listas para renderer core.`,
      rollback: 'Mantener CanvasArea/useCanvas legacy.',
    },
    {
      id: 'overlay-plan-ready',
      label: 'Overlay plan por capas',
      pass: overlayPlans.some((plan) => plan.entityIds.length > 0),
      evidence: `${overlayPlans.length} planes; ${overlayPlans.reduce((sum, plan) => sum + plan.entityIds.length, 0)} vinculos entidad-capa.`,
      rollback: 'Ocultar overlays F440 y conservar capas legacy.',
    },
    {
      id: 'bridge-ready',
      label: 'Puente F436-F438 disponible',
      pass: bridge.geometryCoreEntities.length >= 5,
      evidence: `${bridge.geometryCoreEntities.length} contratos de entidad F438.`,
      rollback: 'Regresar a F436-F438 bridge solamente.',
    },
    {
      id: 'feature-flag-master',
      label: 'Flag renderer profundo',
      pass: highRiskFlagEnabled,
      evidence: highRiskFlagEnabled ? 'VITE_CANVAS_HIGH_RISK_CAD activo.' : 'VITE_CANVAS_HIGH_RISK_CAD apagado; core visible pero no sustituye renderer.',
      rollback: 'Set VITE_CANVAS_HIGH_RISK_CAD=false.',
    },
    {
      id: 'event-controller-off',
      label: 'Eventos legacy intactos',
      pass: true,
      evidence: 'F441 no modifica drag, seleccion, grips ni boton derecho.',
      rollback: 'No aplica: no hay controlador nuevo activo.',
    },
  ];

  const blockingPreflight = preflight.filter((item) => !item.pass && item.id !== 'feature-flag-master');
  const status = blockingPreflight.length ? 'geometry-core-gated' : 'geometry-core-ready';
  const releaseDecision = highRiskFlagEnabled
    ? 'Renderer geometry core puede probarse en staging; mantener event controller v2 apagado.'
    : 'Geometry core listo como capa observable; activar solo en staging con VITE_CANVAS_HIGH_RISK_CAD=true.';

  return {
    schema: 'radshield-mx.f439-f441.renderer-geometry-core.v1',
    phaseRange: 'F439-F441',
    status,
    normalizedEntities,
    overlayPlans,
    preflight,
    enabledByFeatureFlag: highRiskFlagEnabled,
    eventControllerTouched: false,
    releaseDecision,
  };
}
