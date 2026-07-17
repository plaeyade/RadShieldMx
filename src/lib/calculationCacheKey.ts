import type { FloorPlan } from '@/types/radshield';

function stableRound(value: unknown, digits = 4): unknown {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function buildCalculationCachePayload(fp: FloorPlan) {
  return {
    version: 'f193-cache-v1',
    scale_m_per_pixel: stableRound(fp.scale_m_per_pixel, 8),
    barriers: fp.barriers.map((barrier) => ({
      id: barrier.id,
      geometry: [barrier.x1, barrier.y1, barrier.x2, barrier.y2].map((v) => stableRound(v, 3)),
      type: barrier.barrierType,
      materialCode: barrier.materialCode,
      thickness_mm: stableRound(barrier.thickness_mm ?? 0, 3),
      P: stableRound(barrier.designGoal_mSv_per_wk, 8),
      T: stableRound(barrier.occupancyFactor, 6),
      U: stableRound(barrier.useFactor, 6),
      layers: barrier.shieldingLayers?.map((layer) => [layer.materialCode, stableRound(layer.thickness_mm, 3)]) ?? [],
    })),
    sources: fp.sources.map((source) => ({
      id: source.id,
      position: [source.x, source.y, source.isocenterHeight_m].map((v) => stableRound(v, 4)),
      modalityId: source.modality.id,
      standard: source.modality.standard ?? '',
      category: source.modality.category ?? '',
      energy_MeV: stableRound(source.modality.energy_MeV ?? 0, 5),
      workloadValue: stableRound(source.workloadValue, 6),
      workloadUnit: source.workloadUnit,
      useFactor: stableRound(source.useFactor, 6),
      workloadHoursPerWeek: stableRound(source.workloadHoursPerWeek ?? 0, 4),
      nuclearActivity_GBq: stableRound(source.nuclearActivity_GBq ?? 0, 6),
      ctDLP_mGy_cm: stableRound(source.ctDLP_mGy_cm ?? 0, 4),
      ctScansPerPatient: stableRound(source.ctScansPerPatient ?? 0, 4),
    })),
    criticalPoints: fp.criticalPoints?.map((point) => ({
      id: point.id,
      position: [point.x, point.y].map((v) => stableRound(v, 3)),
      P: stableRound(point.designGoal_mSv_per_wk, 8),
      T: stableRound(point.occupancyFactor, 6),
      enabled: point.enabled !== false,
    })) ?? [],
    regions: fp.occupiedRegions.map((region) => ({
      id: region.id,
      points: region.points.map((point) => [stableRound(point.x, 3), stableRound(point.y, 3)]),
      P: stableRound(region.designGoal_mSv_per_wk, 8),
      T: stableRound(region.occupancyFactor, 6),
    })),
  };
}

export function buildCalculationCacheKey(fp: FloorPlan): string {
  return `calc:f193:${fnv1a(JSON.stringify(buildCalculationCachePayload(fp)))}`;
}
