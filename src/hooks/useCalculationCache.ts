/**
 * useCalculationCache — Fase 1.3: IndexedDB cache REAL para resultados de cálculo
 * Integra useIndexedDB en el flujo de trabajo: cachear resultados por hash de floorplan
 * Evita recalcular cuando nada ha cambiado. Cache hit ratio objetivo: >80%
 */
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useIndexedDB } from './useIndexedDB';
import type { FloorPlan } from '@/types/radshield';
import { buildCalculationCacheKey } from '@/lib/calculationCacheKey';

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
  barrierResults: CachedBarrierResult[];
  sampleLines: CachedSampleLine[];
  timestamp: number;
}

export function useCalculationCache() {
  const indexedDB = useIndexedDB();
  const statsRef = useRef({ hits: 0, misses: 0 });

  /** Intentar recuperar resultados cacheados */
  const getCached = useCallback(async (floorPlan: FloorPlan): Promise<{ barrierResults: CachedBarrierResult[]; sampleLines: CachedSampleLine[] } | null> => {
    if (!indexedDB.isAvailable) return null;
    const hash = buildCalculationCacheKey(floorPlan);
    try {
      const cached = await indexedDB.getCachedResult(hash);
      const entry = (((cached as any)?.result ?? cached) as CacheEntry | null);
      if (entry && entry.barrierResults && entry.sampleLines) {
        const age = Date.now() - entry.timestamp;
        const ageStr = age < 60000 ? 'hace segundos' : age < 3600000 ? `hace ${Math.floor(age / 60000)} min` : `hace ${Math.floor(age / 3600000)} h`;
        statsRef.current.hits++;
        toast.success(`Cache hit (${statsRef.current.hits})`, {
          description: `Resultados recuperados de IndexedDB ${ageStr}`,
        });
        return { barrierResults: entry.barrierResults, sampleLines: entry.sampleLines };
      }
    } catch { /* silent fail */ }
    statsRef.current.misses++;
    return null;
  }, [indexedDB]);

  /** Guardar resultados en cache */
  const setCached = useCallback(async (floorPlan: FloorPlan, barrierResults: CachedBarrierResult[], sampleLines: CachedSampleLine[]): Promise<void> => {
    if (!indexedDB.isAvailable) return;
    const hash = buildCalculationCacheKey(floorPlan);
    try {
      await indexedDB.saveResult({
        id: hash,
        type: 'shielding-calculation',
        result: { hash, barrierResults, sampleLines, timestamp: Date.now() },
        timestamp: Date.now(),
        inputHash: hash,
      });
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
  };
}
