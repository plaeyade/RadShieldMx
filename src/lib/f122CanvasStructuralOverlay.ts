import type { Barrier, FloorPlan } from '@/types/radshield';
import {
  estimateBarrierStructuralImpact,
  F121_SHIELDING_MATERIAL_IMPACT,
  type F121StructuralRisk,
} from '@/lib/f121StructuralShieldingImpact';

export interface F122StructuralOverlayBarrier {
  barrierId: string;
  name: string;
  materialCode: string;
  materialId: string;
  materialLabel: string;
  lengthM: number;
  heightM: number;
  thicknessMm: number;
  kgM2: number;
  kgPerLinearM: number;
  massKg: number;
  structuralRisk: F121StructuralRisk;
  color: string;
  reviewRequired: boolean;
  datasheetRequired: boolean;
  overlayLabel: string;
}

export interface F122CanvasStructuralOverlay {
  phase: 'F122';
  status: 'ready' | 'needs-floorplan';
  barrierCount: number;
  totalMassKg: number;
  averageKgM2: number;
  reviewRequiredCount: number;
  datasheetRequiredCount: number;
  highOrCriticalCount: number;
  overlayReady: boolean;
  barriers: F122StructuralOverlayBarrier[];
  legend: Record<F121StructuralRisk, string>;
  nextAction: string;
}

const MATERIAL_CODE_TO_F121: Record<string, string> = {
  PB: 'lead_sheet',
  LEAD: 'lead_sheet',
  PLOMO: 'lead_sheet',
  CONCRETE: 'ordinary_concrete',
  CONCRETE235: 'ordinary_concrete',
  CONCRETE240: 'ordinary_concrete',
  CONCRETEBARITE: 'barite_magnetite_concrete',
  BARITE: 'barite_magnetite_concrete',
  MAGNETITE: 'barite_magnetite_concrete',
  HD_CONCRETE: 'high_density_concrete',
  HIGH_DENSITY_CONCRETE: 'high_density_concrete',
  HD_BLOCK: 'high_density_block',
  HIGH_DENSITY_BLOCK: 'high_density_block',
  TM_NIPOLL: 'tm_nipoll_dense_block',
  NIPOLL: 'tm_nipoll_dense_block',
  NELCO: 'nelco_modular_panel',
  VERISHIELD: 'verishield_modular_panel',
  STEEL: 'steel_plate',
  ACERO: 'steel_plate',
  HYBRID: 'multilayer_hybrid',
  MULTILAYER: 'multilayer_hybrid',
  GYPSUM: 'multilayer_hybrid',
};

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function normalizeCode(value: unknown): string {
  return String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

export function mapBarrierMaterialToF121(barrier: Barrier): string {
  if ((barrier.shieldingLayers?.length ?? 0) > 1) return 'multilayer_hybrid';
  const rawCode = normalizeCode(barrier.materialCode || barrier.material || barrier.shieldingLayers?.[0]?.materialCode);
  return MATERIAL_CODE_TO_F121[rawCode] ?? 'ordinary_concrete';
}

function getBarrierThicknessMm(barrier: Barrier, materialId: string): number {
  const layerTotal = barrier.shieldingLayers?.reduce((sum, layer) => sum + (Number(layer.thickness_mm) || 0), 0) ?? 0;
  const direct = Number(barrier.thickness_mm);
  const required = typeof barrier.requiredThickness_mm === 'number' ? barrier.requiredThickness_mm : Number.NaN;
  const fallback = F121_SHIELDING_MATERIAL_IMPACT.find((item) => item.id === materialId)?.defaultThicknessMm ?? 150;
  const value = layerTotal || direct || required || fallback;
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getBarrierLengthM(barrier: Barrier, scaleMPerPixel: number): number {
  const dx = Number(barrier.x2) - Number(barrier.x1);
  const dy = Number(barrier.y2) - Number(barrier.y1);
  const pixels = Math.sqrt(dx * dx + dy * dy);
  const length = pixels * scaleMPerPixel;
  return Number.isFinite(length) && length > 0 ? length : 1;
}

export function getF122StructuralOverlayColor(risk: F121StructuralRisk): string {
  return {
    low: '#16a34a',
    moderate: '#f59e0b',
    high: '#ea580c',
    critical: '#dc2626',
  }[risk];
}

export function buildF122CanvasStructuralOverlay(
  floorPlan: FloorPlan | undefined,
  wallHeightM = 2.8,
): F122CanvasStructuralOverlay {
  const barriers = floorPlan?.barriers ?? [];
  const scaleMPerPixel = floorPlan?.scale_m_per_pixel && floorPlan.scale_m_per_pixel > 0 ? floorPlan.scale_m_per_pixel : 0.01;
  const overlayBarriers = barriers.map((barrier) => {
    const materialId = mapBarrierMaterialToF121(barrier);
    const thicknessMm = getBarrierThicknessMm(barrier, materialId);
    const lengthM = round(getBarrierLengthM(barrier, scaleMPerPixel), 2);
    const impact = estimateBarrierStructuralImpact({
      materialId,
      lengthM,
      heightM: wallHeightM,
      thicknessMm,
    });

    return {
      barrierId: barrier.id,
      name: barrier.name,
      materialCode: barrier.materialCode || barrier.material || impact.material.id,
      materialId,
      materialLabel: impact.material.label,
      lengthM,
      heightM: wallHeightM,
      thicknessMm: impact.thicknessMm,
      kgM2: impact.kgM2,
      kgPerLinearM: impact.kgPerLinearM,
      massKg: impact.massKg,
      structuralRisk: impact.structuralRisk,
      color: getF122StructuralOverlayColor(impact.structuralRisk),
      reviewRequired: impact.reviewRequired,
      datasheetRequired: impact.datasheetRequired,
      overlayLabel: `${barrier.name}: ${impact.kgM2} kg/m2 ${impact.structuralRisk}`,
    };
  });

  const totalMassKg = round(overlayBarriers.reduce((sum, barrier) => sum + barrier.massKg, 0));
  const averageKgM2 =
    overlayBarriers.length > 0 ? round(overlayBarriers.reduce((sum, barrier) => sum + barrier.kgM2, 0) / overlayBarriers.length) : 0;
  const reviewRequiredCount = overlayBarriers.filter((barrier) => barrier.reviewRequired).length;
  const datasheetRequiredCount = overlayBarriers.filter((barrier) => barrier.datasheetRequired).length;
  const highOrCriticalCount = overlayBarriers.filter((barrier) => barrier.structuralRisk === 'high' || barrier.structuralRisk === 'critical').length;

  return {
    phase: 'F122',
    status: overlayBarriers.length > 0 ? 'ready' : 'needs-floorplan',
    barrierCount: overlayBarriers.length,
    totalMassKg,
    averageKgM2,
    reviewRequiredCount,
    datasheetRequiredCount,
    highOrCriticalCount,
    overlayReady: overlayBarriers.length > 0,
    barriers: overlayBarriers,
    legend: {
      low: 'Carga ligera',
      moderate: 'Revisar compatibilidad con losa/muro existente',
      high: 'Requiere revision estructural',
      critical: 'No liberar sin calculo estructural formal',
    },
    nextAction:
      overlayBarriers.length > 0
        ? 'F123 should connect selected barrier material changes to structural impact, cost and memoria evidence.'
        : 'Import or draw barriers before enabling the structural shielding overlay.',
  };
}

export function buildF122StructuralOverlayPhaseSummary() {
  return {
    phase: 'F122',
    status: 'implemented-canvas-overlay-readiness',
    inputs: ['floorPlan.barriers', 'scale_m_per_pixel', 'materialCode', 'thickness_mm', 'shieldingLayers'],
    outputs: ['kg/m2', 'kg/ml', 'masa por barrera', 'riesgo visual', 'revision estructural', 'ficha proveedor'],
    canvasPanel: 'f122-structural-overlay-panel',
    nextPhase: 'F123 material editor and cost/schedule comparator',
    decision:
      'F122 prepares visual structural impact overlay in canvas while keeping final structural design outside RadShield-MX until engineer/vendor data is attached.',
  };
}
