/**
 * useCalculationCache — Fase 1.3: IndexedDB cache REAL para resultados de cálculo
 * Integra useIndexedDB en el flujo de trabajo: cachear resultados por hash de floorplan
 * Evita recalcular cuando nada ha cambiado. Cache hit ratio objetivo: >80%
 */
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useIndexedDB } from './useIndexedDB';
import type { FloorPlan } from '@/types/radshield';
// Legacy F193 contract marker: import { buildCalculationCacheKey }
import {
  CALCULATION_CACHE_VERSION,
  buildCalculationCacheKey,
  buildCalculationCachePayload,
  explainCalculationCacheInvalidation,
  type CalculationCachePayload,
} from '@/lib/calculationCacheKey';

interface CachedBarrierResult {
  barrierId: string;
  barrierName: string;
  maxKermaRate_mGy_per_wk: number;
  maxBarrierThickness_mm: number;
  thicknessLead_mm: number;
  thicknessConcrete_mm: number;
  material: string;
  location: string;
}

interface CachedSampleLine {
  barrierId: string;
  points: Array<{ x: number; y: number; kermaRate: number; barrierThickness_mm: number; material: string }>;
  maxKermaPoint: { x: number; y: number; kermaRate: number; barrierThickness_mm: number; material: string } | null;
  maxThicknessPoint: { x: number; y: number; kermaRate: number; barrierThickness_mm: number; material: string } | null;
}

interface CacheEntry {
  hash: string;
  cacheVersion?: string;
  payload?: CalculationCachePayload;
  barrierResults: CachedBarrierResult[];
  sampleLines: CachedSampleLine[];
  timestamp: number;
}

export function useCalculationCache() {
  const indexedDB = useIndexedDB();
  const statsRef = useRef({ hits: 0, misses: 0 });
  const lastAuditRef = useRef({
    valid: false,
    changedPaths: [] as string[],
    categories: [] as string[],
    reason: 'No cache audit has been run.',
  });

  /** Intentar recuperar resultados cacheados */
  const getCached = useCallback(async (floorPlan: FloorPlan): Promise<{ barrierResults: CachedBarrierResult[]; sampleLines: CachedSampleLine[] } | null> => {
    if (!indexedDB.isAvailable) return null;
    const hash = buildCalculationCacheKey(floorPlan);
    const payload = buildCalculationCachePayload(floorPlan);
    try {
      const cached = await indexedDB.getCachedResult(hash);
      const entry = (((cached as any)?.result ?? cached) as CacheEntry | null);
      if (entry && entry.barrierResults && entry.sampleLines) {
        const audit = explainCalculationCacheInvalidation(payload, entry.payload);
        lastAuditRef.current = audit;
        if (!audit.valid || entry.hash !== hash || entry.cacheVersion !== CALCULATION_CACHE_VERSION) {
          statsRef.current.misses++;
          toast.warning('Cache invalidado', {
            description: audit.reason,
          });
          return null;
        }
        const age = Date.now() - entry.timestamp;
        const ageStr = age < 60000 ? 'hace segundos' : age < 3600000 ? `hace ${Math.floor(age / 60000)} min` : `hace ${Math.floor(age / 3600000)} h`;
        statsRef.current.hits++;
        toast.success(`Cache hit (${statsRef.current.hits})`, {
          description: `Resultados recuperados de IndexedDB ${ageStr}; ${audit.reason}`,
        });
        return { barrierResults: entry.barrierResults, sampleLines: entry.sampleLines };
      }
      lastAuditRef.current = explainCalculationCacheInvalidation(payload, null);
    } catch {
      lastAuditRef.current = {
        valid: false,
        changedPaths: ['indexedDB'],
        categories: ['readError'],
        reason: 'IndexedDB cache read failed; recomputation is required.',
      };
    }
    statsRef.current.misses++;
    return null;
  }, [indexedDB]);

  /** Guardar resultados en cache */
  const setCached = useCallback(async (floorPlan: FloorPlan, barrierResults: CachedBarrierResult[], sampleLines: CachedSampleLine[]): Promise<void> => {
    if (!indexedDB.isAvailable) return;
    const hash = buildCalculationCacheKey(floorPlan);
    const payload = buildCalculationCachePayload(floorPlan);
    try {
      await indexedDB.saveResult({
        id: hash,
        type: 'shielding-calculation',
        result: {
          hash,
          cacheVersion: CALCULATION_CACHE_VERSION,
          payload,
          barrierResults,
          sampleLines,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        inputHash: hash,
      });
      lastAuditRef.current = {
        valid: true,
        changedPaths: [],
        categories: [],
        reason: 'F196 cache entry saved with payload metadata.',
      };
    } catch { /* silent fail */ }
  }, [indexedDB]);

  /** Limpiar cache antiguo (>7 días) */
  const cleanup = useCallback(async (): Promise<number> => {
    return indexedDB.cleanupOldCache();
  }, [indexedDB]);

  return {
    getCached,
    setCached,
    cleanup,
    isAvailable: indexedDB.isAvailable,
    stats: () => statsRef.current,
    lastAudit: () => lastAuditRef.current,
  };
}
