import type { Barrier, FloorPlan, OccupiedRegion, RadiationSource } from '@/types/radshield';

export interface ControlledZoneCanvasSummary {
  hasControlledZone: boolean;
  planIds: string[];
  barrierCount: number;
  wallCount: number;
  ceilingCount: number;
  floorCount: number;
  sourceCount: number;
  regionCount: number;
  maxThickness_mm: number | null;
  maxKerma_mSvWeek: number | null;
  warnings: string[];
}

export interface ControlledZoneBarrierCanvasStyle {
  stroke: string;
  selectedStroke: string;
  normalStroke: string;
  label: string;
  labelColor: string;
  badge: string;
  lineWidth: number;
  dash: number[];
  glow: string;
}

export function isControlledZoneBarrier(barrier: Barrier): boolean {
  return Boolean(
    barrier.radshieldGenerated ||
      barrier.controlledZonePlanId ||
      barrier.id.startsWith('cz-') ||
      barrier.name.toLowerCase().includes('zona controlada'),
  );
}

export function isControlledZoneRegion(region: OccupiedRegion): boolean {
  return Boolean(
    region.id.startsWith('cz-') ||
      region.name.toLowerCase().includes('zona controlada'),
  );
}

export function isControlledZoneSource(source: RadiationSource): boolean {
  return Boolean(
    source.id.startsWith('cz-') ||
      source.name.toLowerCase().includes('fuente preliminar'),
  );
}

export function getControlledZoneBarrierCanvasStyle(barrier: Barrier): ControlledZoneBarrierCanvasStyle {
  const isCeiling = barrier.structuralElement === 'ceiling' || barrier.controlledZoneElement === 'ceiling';
  const isFloor = barrier.structuralElement === 'floor' || barrier.controlledZoneElement === 'floor';
  const elementLabel = getElementLabel(barrier.controlledZoneElement, barrier.structuralElement);

  if (isCeiling) {
    return {
      stroke: '#0ea5e9',
      selectedStroke: '#ef4444',
      normalStroke: '#0369a1',
      label: elementLabel,
      labelColor: '#0369a1',
      badge: 'CZ techo/losa',
      lineWidth: 3,
      dash: [8, 5],
      glow: 'rgba(14, 165, 233, 0.22)',
    };
  }

  if (isFloor) {
    return {
      stroke: '#8b5cf6',
      selectedStroke: '#ef4444',
      normalStroke: '#6d28d9',
      label: elementLabel,
      labelColor: '#6d28d9',
      badge: 'CZ piso',
      lineWidth: 3,
      dash: [3, 4],
      glow: 'rgba(139, 92, 246, 0.18)',
    };
  }

  return {
    stroke: '#f97316',
    selectedStroke: '#ef4444',
    normalStroke: '#c2410c',
    label: elementLabel,
    labelColor: '#c2410c',
    badge: 'CZ muro',
    lineWidth: 3.5,
    dash: [],
    glow: 'rgba(249, 115, 22, 0.2)',
  };
}

export function getControlledZoneCanvasSummary(floorPlan: FloorPlan | null | undefined): ControlledZoneCanvasSummary {
  const empty = buildEmptySummary();
  if (!floorPlan) return empty;

  const barriers = (floorPlan.barriers || []).filter(isControlledZoneBarrier);
  const sources = (floorPlan.sources || []).filter(isControlledZoneSource);
  const regions = (floorPlan.occupiedRegions || floorPlan.regions || []).filter(isControlledZoneRegion);
  const planIds = Array.from(new Set(barriers.map((barrier) => barrier.controlledZonePlanId).filter(Boolean) as string[]));
  const wallCount = barriers.filter((barrier) => (barrier.structuralElement || 'wall') === 'wall').length;
  const ceilingCount = barriers.filter((barrier) => barrier.structuralElement === 'ceiling' || barrier.controlledZoneElement === 'ceiling').length;
  const floorCount = barriers.filter((barrier) => barrier.structuralElement === 'floor' || barrier.controlledZoneElement === 'floor').length;
  const thicknessValues = barriers
    .map(readBarrierThickness)
    .filter((value): value is number => Number.isFinite(value));
  const kermaValues = barriers
    .map((barrier) => barrier.maxKerma)
    .filter((value): value is number => Number.isFinite(value));

  if (!barriers.length && !regions.length && !sources.length) return empty;

  const warnings: string[] = [];
  if (ceilingCount > 0) {
    warnings.push('Techo/losa representado en 2D; validar corte arquitectonico y ocupacion superior.');
  }
  if (floorCount === 0) {
    warnings.push('Piso/suelo no generado; agregarlo si hay ocupacion inferior relevante.');
  }
  if (regions.length === 0) {
    warnings.push('No hay poligono de zona controlada asociado al plano.');
  }

  return {
    hasControlledZone: true,
    planIds,
    barrierCount: barriers.length,
    wallCount,
    ceilingCount,
    floorCount,
    sourceCount: sources.length,
    regionCount: regions.length,
    maxThickness_mm: thicknessValues.length ? Math.max(...thicknessValues) : null,
    maxKerma_mSvWeek: kermaValues.length ? Math.max(...kermaValues) : null,
    warnings,
  };
}

function buildEmptySummary(): ControlledZoneCanvasSummary {
  return {
    hasControlledZone: false,
    planIds: [],
    barrierCount: 0,
    wallCount: 0,
    ceilingCount: 0,
    floorCount: 0,
    sourceCount: 0,
    regionCount: 0,
    maxThickness_mm: null,
    maxKerma_mSvWeek: null,
    warnings: [],
  };
}

function readBarrierThickness(barrier: Barrier): number {
  if (typeof barrier.thickness_mm === 'number') return barrier.thickness_mm;
  if (typeof barrier.requiredThickness_mm === 'number') return barrier.requiredThickness_mm;
  if (barrier.requiredThickness_mm && typeof barrier.requiredThickness_mm === 'object') {
    const values = Object.values(barrier.requiredThickness_mm).filter((value): value is number => Number.isFinite(value));
    return values.length ? Math.max(...values) : Number.NaN;
  }
  return Number.NaN;
}

function getElementLabel(
  element: Barrier['controlledZoneElement'],
  structuralElement: Barrier['structuralElement'],
): string {
  if (element === 'north') return 'Norte';
  if (element === 'south') return 'Sur';
  if (element === 'east') return 'Este';
  if (element === 'west') return 'Oeste';
  if (element === 'ceiling' || structuralElement === 'ceiling') return 'Techo/losa';
  if (element === 'floor' || structuralElement === 'floor') return 'Piso';
  return 'Zona controlada';
}
