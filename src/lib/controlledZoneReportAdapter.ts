import type { Barrier, FloorPlan } from '@/types/radshield';

export interface ControlledZoneReportBarrier {
  id: string;
  name: string;
  element: string;
  structuralElement: 'wall' | 'ceiling' | 'floor' | 'unknown';
  length_m: number;
  materialCode: string;
  thickness_mm: number;
  maxKerma_mSvWeek: number;
  note: string;
}

export interface ControlledZoneReportContext {
  hasGeneratedControlledZone: boolean;
  planIds: string[];
  barriers: ControlledZoneReportBarrier[];
  wallCount: number;
  ceilingCount: number;
  floorCount: number;
  warnings: string[];
}

export function extractControlledZoneReportContext(floorPlan: FloorPlan): ControlledZoneReportContext {
  const barriers = (floorPlan.barriers || [])
    .filter(isGeneratedControlledZoneBarrier)
    .map((barrier) => toReportBarrier(barrier, floorPlan.scale_m_per_pixel));

  const planIds = Array.from(
    new Set(
      (floorPlan.barriers || [])
        .filter(isGeneratedControlledZoneBarrier)
        .map((barrier) => barrier.controlledZonePlanId || inferPlanId(barrier.id))
        .filter(Boolean),
    ),
  );

  const wallCount = barriers.filter((barrier) => barrier.structuralElement === 'wall').length;
  const ceilingCount = barriers.filter((barrier) => barrier.structuralElement === 'ceiling').length;
  const floorCount = barriers.filter((barrier) => barrier.structuralElement === 'floor').length;
  const warnings: string[] = [];

  if (barriers.length > 0 && ceilingCount > 0) {
    warnings.push('Las barreras de techo/losa se representan en el plano como lineas 2D de referencia; deben confirmarse en cortes y planos estructurales.');
  }
  if (barriers.length > 0 && floorCount === 0) {
    warnings.push('No se encontro una barrera de piso/suelo generada; agregarla si existe ocupacion inferior o requerimiento de blindaje descendente.');
  }

  return {
    hasGeneratedControlledZone: barriers.length > 0,
    planIds,
    barriers,
    wallCount,
    ceilingCount,
    floorCount,
    warnings,
  };
}

function isGeneratedControlledZoneBarrier(barrier: Barrier): boolean {
  return Boolean(
    barrier.radshieldGenerated ||
    barrier.controlledZonePlanId ||
    barrier.id.startsWith('cz-'),
  );
}

function toReportBarrier(barrier: Barrier, scale_m_per_pixel: number): ControlledZoneReportBarrier {
  const length_m = Math.sqrt((barrier.x2 - barrier.x1) ** 2 + (barrier.y2 - barrier.y1) ** 2) * scale_m_per_pixel;
  const thickness_mm = typeof barrier.requiredThickness_mm === 'number'
    ? barrier.requiredThickness_mm
    : barrier.requiredThickness_mm?.[barrier.materialCode] ?? barrier.thickness_mm ?? 0;

  return {
    id: barrier.id,
    name: barrier.name,
    element: barrier.controlledZoneElement || inferElement(barrier.id),
    structuralElement: barrier.structuralElement || 'unknown',
    length_m,
    materialCode: barrier.materialCode,
    thickness_mm,
    maxKerma_mSvWeek: barrier.maxKerma || 0,
    note: barrier.reportNote || '',
  };
}

function inferPlanId(id: string): string {
  const match = id.match(/^cz-(.+?)-barrier-/);
  return match?.[1] || '';
}

function inferElement(id: string): string {
  const match = id.match(/-barrier-([a-z]+)$/);
  return match?.[1] || 'unknown';
}
