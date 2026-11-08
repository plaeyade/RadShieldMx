import type { FloorPlan } from '@/types/radshield';

export const CALCULATION_CACHE_VERSION = 'f196-cache-v1';
const LEGACY_CALCULATION_CACHE_VERSION_NOTE = "version: 'f193-cache-v1'";

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
    version: CALCULATION_CACHE_VERSION,
    legacyVersion: 'f193-cache-v1',
    legacyContract: LEGACY_CALCULATION_CACHE_VERSION_NOTE,
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
      // Modelo por paciente (TG-108 en PET, «estilo TG-108» en SPECT/I-131): cambia la dosis.
      tg108: source.tg108
        ? {
            A0_MBq: stableRound(source.tg108.A0_MBq, 4),
            pacientesSemana: stableRound(source.tg108.pacientesSemana, 4),
            tU_h: stableRound(source.tg108.tU_h, 4),
            tI_h: stableRound(source.tg108.tI_h, 4),
            sala: source.tg108.sala,
          }
        : null,
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

export type CalculationCachePayload = ReturnType<typeof buildCalculationCachePayload>;

export function buildCalculationCacheKey(fp: FloorPlan): string {
  return `calc:f196:${fnv1a(JSON.stringify(buildCalculationCachePayload(fp)))}`;
}

function collectDiffPaths(current: unknown, cached: unknown, prefix = ''): string[] {
  if (JSON.stringify(current) === JSON.stringify(cached)) return [];
  if (
    current === null ||
    cached === null ||
    typeof current !== 'object' ||
    typeof cached !== 'object' ||
    Array.isArray(current) !== Array.isArray(cached)
  ) {
    return [prefix || 'root'];
  }

  if (Array.isArray(current) && Array.isArray(cached)) {
    if (current.length !== cached.length) return [prefix || 'array'];
    return current.flatMap((value, index) => collectDiffPaths(value, cached[index], `${prefix}[${index}]`));
  }

  const currentRecord = current as Record<string, unknown>;
  const cachedRecord = cached as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(currentRecord), ...Object.keys(cachedRecord)]));
  return keys.flatMap((key) => collectDiffPaths(currentRecord[key], cachedRecord[key], prefix ? `${prefix}.${key}` : key));
}

export function classifyCalculationCacheDiff(paths: string[]): string[] {
  const categories = new Set<string>();
  for (const path of paths) {
    if (path.includes('scale_m_per_pixel')) categories.add('scale');
    if (path.includes('barriers') && path.includes('geometry')) categories.add('geometry');
    if (path.includes('materialCode') || path.includes('layers') || path.includes('thickness_mm')) categories.add('material');
    if (path.includes('sources')) categories.add('source');
    if (path.includes('.P') || path.includes('.T') || path.includes('.U') || path.includes('workload')) categories.add('P/T/U/W');
    if (path.includes('regions')) categories.add('regions');
    if (path.includes('criticalPoints')) categories.add('criticalPoints');
    if (path.includes('standard') || path.includes('category') || path.includes('modalityId')) categories.add('norms');
    if (path.includes('version')) categories.add('version');
  }
  return [...categories].sort();
}

export function explainCalculationCacheInvalidation(
  currentPayload: CalculationCachePayload,
  cachedPayload?: CalculationCachePayload | null,
): { valid: boolean; changedPaths: string[]; categories: string[]; reason: string } {
  if (!cachedPayload) {
    return {
      valid: false,
      changedPaths: ['cachePayload'],
      categories: ['missingPayload'],
      reason: 'Cached entry has no F196 payload metadata; recomputation is required.',
    };
  }

  const changedPaths = collectDiffPaths(currentPayload, cachedPayload);
  const categories = classifyCalculationCacheDiff(changedPaths);
  return {
    valid: changedPaths.length === 0,
    changedPaths,
    categories,
    reason: changedPaths.length === 0
      ? 'Cache payload matches scale, geometry, material, sources, P/T/U/W, regions, critical points and norms.'
      : `Cache invalidated by ${categories.join(', ') || 'payload'} changes.`,
  };
}
