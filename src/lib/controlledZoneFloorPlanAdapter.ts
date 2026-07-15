// =============================================================================
// controlledZoneFloorPlanAdapter.ts - F56 shielding plan to canvas floorPlan
// =============================================================================

import {
  MODALITIES,
  type Barrier,
  type FloorPlan,
  type Modality,
  type OccupiedRegion,
  type RadiationSource,
} from '@/types/radshield';
import type {
  ControlledZoneBarrierCalculation,
  ControlledZoneShieldingPlan,
} from './controlledZoneCalculationAdapter';
import { CONTROLLED_ZONE_CONTRACTS } from './controlledZoneContracts';

export interface ControlledZoneFloorPlanImportResult {
  floorPlan: FloorPlan;
  addedBarriers: number;
  addedSources: number;
  addedRegions: number;
  removedGeneratedObjects: number;
  generatedPrefix: string;
}

export interface ControlledZoneFloorPlanImportOptions {
  replaceGenerated?: boolean;
  originX_px?: number;
  originY_px?: number;
}

export const CONTROLLED_ZONE_SHIELDING_PLAN_STORAGE_KEY = 'radshield.controlledZone.lastShieldingPlan.v1';

export function isControlledZoneShieldingPlan(value: unknown): value is ControlledZoneShieldingPlan {
  const plan = value as ControlledZoneShieldingPlan;
  return Boolean(
    plan &&
    plan.schemaVersion === CONTROLLED_ZONE_CONTRACTS.shieldingPlan &&
    plan.profile &&
    Array.isArray(plan.calculations),
  );
}

export function saveControlledZoneShieldingPlanSnapshot(
  plan: ControlledZoneShieldingPlan,
  storage: Pick<Storage, 'setItem'> | undefined,
): boolean {
  if (!storage) return false;
  storage.setItem(CONTROLLED_ZONE_SHIELDING_PLAN_STORAGE_KEY, JSON.stringify(plan));
  return true;
}

export function loadControlledZoneShieldingPlanSnapshot(
  storage: Pick<Storage, 'getItem'> | undefined,
): ControlledZoneShieldingPlan | null {
  if (!storage) return null;
  const raw = storage.getItem(CONTROLLED_ZONE_SHIELDING_PLAN_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return isControlledZoneShieldingPlan(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function applyControlledZoneShieldingPlanToFloorPlan(
  floorPlan: FloorPlan,
  plan: ControlledZoneShieldingPlan,
  options: ControlledZoneFloorPlanImportOptions = {},
): ControlledZoneFloorPlanImportResult {
  const scale = floorPlan.scale_m_per_pixel || 0.01;
  const originX = options.originX_px ?? 80;
  const originY = options.originY_px ?? 80;
  const widthPx = metersToPixels(plan.profile.controlledZoneWidth_m, scale);
  const lengthPx = metersToPixels(plan.profile.controlledZoneLength_m, scale);
  const generatedPrefix = `cz-${plan.optionId}`;
  const replaceGenerated = options.replaceGenerated ?? true;

  const existingBarriers = floorPlan.barriers || [];
  const existingSources = floorPlan.sources || [];
  const existingRegions = floorPlan.occupiedRegions || [];
  const keptBarriers = replaceGenerated ? existingBarriers.filter((item) => !item.id.startsWith(generatedPrefix)) : existingBarriers;
  const keptSources = replaceGenerated ? existingSources.filter((item) => !item.id.startsWith(generatedPrefix)) : existingSources;
  const keptRegions = replaceGenerated ? existingRegions.filter((item) => !item.id.startsWith(generatedPrefix)) : existingRegions;
  const removedGeneratedObjects =
    existingBarriers.length - keptBarriers.length +
    existingSources.length - keptSources.length +
    existingRegions.length - keptRegions.length;

  const barrierMap = new Map(plan.calculations.map((calc) => [calc.barrier.toLowerCase(), calc]));
  const generatedBarriers = [
    buildBarrier(barrierMap.get('norte'), generatedPrefix, 'north', originX, originY, widthPx, lengthPx),
    buildBarrier(barrierMap.get('sur'), generatedPrefix, 'south', originX, originY, widthPx, lengthPx),
    buildBarrier(barrierMap.get('este'), generatedPrefix, 'east', originX, originY, widthPx, lengthPx),
    buildBarrier(barrierMap.get('oeste'), generatedPrefix, 'west', originX, originY, widthPx, lengthPx),
    buildBarrier(barrierMap.get('techo'), generatedPrefix, 'ceiling', originX, originY, widthPx, lengthPx),
  ].filter(Boolean) as Barrier[];

  const generatedRegion = buildControlledRegion(generatedPrefix, plan, originX, originY, widthPx, lengthPx);
  const generatedSource = buildSource(generatedPrefix, plan, originX + widthPx / 2, originY + lengthPx / 2);
  const requiredWidth = Math.ceil(originX + widthPx + 120);
  const requiredHeight = Math.ceil(originY + lengthPx + 120);

  return {
    floorPlan: {
      ...floorPlan,
      name: floorPlan.name || `Plano ${plan.optionName}`,
      width_pixels: Math.max(floorPlan.width_pixels || 0, requiredWidth),
      height_pixels: Math.max(floorPlan.height_pixels || 0, requiredHeight),
      barriers: [...keptBarriers, ...generatedBarriers],
      sources: [...keptSources, generatedSource],
      occupiedRegions: [...keptRegions, generatedRegion],
      regions: [...keptRegions, generatedRegion],
    },
    addedBarriers: generatedBarriers.length,
    addedSources: 1,
    addedRegions: 1,
    removedGeneratedObjects,
    generatedPrefix,
  };
}

function buildBarrier(
  calc: ControlledZoneBarrierCalculation | undefined,
  prefix: string,
  side: 'north' | 'south' | 'east' | 'west' | 'ceiling',
  x: number,
  y: number,
  width: number,
  length: number,
): Barrier | null {
  if (!calc) return null;
  const materialCode = normalizeMaterialCode(calc.materialCode);
  const coords = getBarrierCoordinates(side, x, y, width, length);
  const structuralElement = side === 'ceiling' ? 'ceiling' : 'wall';
  return {
    id: `${prefix}-barrier-${side}`,
    ...coords,
    name: `F57 ${calc.barrier} - ${calc.method}`,
    barrierType: getBarrierType(calc),
    useFactor: calc.method === 'NCRP151-primary' ? 0.25 : 1,
    occupancyFactor: calc.occupancyFactor,
    designGoal_mSv_per_wk: calc.designGoal_mSvWeek,
    materialCode,
    maxKerma: calc.unshielded_mSvWeek,
    requiredThickness_mm: { [materialCode]: calc.requiredThickness_mm },
    thickness_mm: calc.requiredThickness_mm,
    material: materialCode,
    radshieldGenerated: true,
    controlledZonePlanId: prefix.replace(/^cz-/, ''),
    controlledZoneElement: side,
    structuralElement,
    reportNote: structuralElement === 'ceiling'
      ? 'Representacion 2D de la losa/techo; validar en corte arquitectonico y con ocupacion superior.'
      : 'Muro perimetral generado desde factibilidad de zona controlada.',
  };
}

function getBarrierCoordinates(side: 'north' | 'south' | 'east' | 'west' | 'ceiling', x: number, y: number, width: number, length: number) {
  switch (side) {
    case 'north':
      return { x1: x, y1: y, x2: x + width, y2: y };
    case 'south':
      return { x1: x, y1: y + length, x2: x + width, y2: y + length };
    case 'east':
      return { x1: x + width, y1: y, x2: x + width, y2: y + length };
    case 'west':
      return { x1: x, y1: y, x2: x, y2: y + length };
    case 'ceiling':
      return { x1: x + width * 0.15, y1: y + length * 0.5, x2: x + width * 0.85, y2: y + length * 0.5 };
  }
}

function buildControlledRegion(
  prefix: string,
  plan: ControlledZoneShieldingPlan,
  x: number,
  y: number,
  width: number,
  length: number,
): OccupiedRegion {
  return {
    id: `${prefix}-controlled-region`,
    name: `Zona controlada - ${plan.optionName}`,
    occupancyFactor: 1,
    designGoal_mSv_per_wk: 0.1,
    points: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + length },
      { x, y: y + length },
    ],
  };
}

function buildSource(prefix: string, plan: ControlledZoneShieldingPlan, x: number, y: number): RadiationSource {
  const modality = findModality(plan.modality);
  return {
    id: `${prefix}-source`,
    x,
    y,
    name: `Fuente preliminar - ${plan.modality}`,
    modality,
    workloadValue: getWorkloadValue(plan),
    workloadUnit: modality.unit,
    isocenterHeight_m: modality.isocenterHeightDefault_m || 1.2,
    useFactor: plan.modality === 'LINAC' ? 0.25 : 1,
    workloadHoursPerWeek: plan.modality === 'PET-CT' ? plan.profile.targetThroughputPerDay * 5 : undefined,
    nuclearActivity_GBq: plan.modality === 'PET-CT' ? plan.assumptions.petActivity_MBQ_per_injection / 1000 : undefined,
  };
}

function findModality(modality: ControlledZoneShieldingPlan['modality']): Modality {
  const idByModality: Record<ControlledZoneShieldingPlan['modality'], string> = {
    LINAC: 'linac-15mv',
    'PET-CT': 'pet-f18',
    'Gamma Knife': 'gamma-knife',
    HDR: 'hdr-192ir',
    Radiofarmacia: 'pet-f18',
  };
  return MODALITIES.find((item) => item.id === idByModality[modality]) || MODALITIES[0];
}

function getWorkloadValue(plan: ControlledZoneShieldingPlan): number {
  if (plan.modality === 'LINAC') return 25;
  if (plan.modality === 'PET-CT') return plan.profile.targetThroughputPerDay * 5;
  if (plan.modality === 'Gamma Knife') return plan.profile.targetThroughputPerDay * 5;
  if (plan.modality === 'HDR') return plan.assumptions.hdrActivity_Ci;
  return plan.profile.targetThroughputPerDay * 5;
}

function getBarrierType(calc: ControlledZoneBarrierCalculation): Barrier['barrierType'] {
  if (calc.method === 'NCRP151-primary') return 'primary';
  if (calc.method === 'TG108-PETCT') return 'nuclear';
  if (calc.method === 'NCRP151-secondary') return 'secondary';
  return 'secondary';
}

function normalizeMaterialCode(code: string): string {
  if (code.toLowerCase() === 'concrete235') return 'CONCRETE235';
  return code.toUpperCase();
}

function metersToPixels(value_m: number, scale_m_per_pixel: number): number {
  return Math.max(1, value_m / Math.max(scale_m_per_pixel, 0.0001));
}
