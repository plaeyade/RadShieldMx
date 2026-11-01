import { useState, useCallback, useRef } from 'react';
import 'sonner';

export interface SmartBarrierResult {
  recommended_thickness_mm: number;
  recommended_thickness_display: string;
  material: string;
  is_primary: boolean;
  distance_from_source_m: number;
  tvl_cm: number;
  standard: string;
  ai_reasoning: string;
  visual_thickness_px: number;
  confidence: string;
  warnings: string[];
}

export interface SmartBarrierInput {
  barrierStart: { x: number; y: number };
  barrierEnd: { x: number; y: number };
  sourcePosition: { x: number; y: number };
  energyLabel: string;
  workloadGyWeek: number;
  scaleMPerPixel: number;
  material: string;
}

const TVL_TABLES: Record<string, { primary: number; secondary: number; hvl: number }> = {
  "6 MV": { primary: 34, secondary: 29, hvl: 11 },
  "10 MV": { primary: 39, secondary: 34, hvl: 12.6 },
  "15 MV": { primary: 43, secondary: 37, hvl: 13.9 },
  "18 MV": { primary: 46, secondary: 40, hvl: 14.9 },
  "Co-60": { primary: 19.6, secondary: 16.6, hvl: 6.6 },
  "140 kVp": { primary: 2.2, secondary: 1.8, hvl: 0.7 },
  "120 kVp": { primary: 2.0, secondary: 1.6, hvl: 0.65 },
  "511 keV": { primary: 6.5, secondary: 5.5, hvl: 2.2 },
  "140 keV": { primary: 1.5, secondary: 1.2, hvl: 0.5 },
};

export function isSmartBarrierBackendEnabled(): boolean {
  return Boolean(import.meta.env.VITE_API_URL);
}

export function calculateSmartBarrierLocally({
  barrierStart,
  barrierEnd,
  sourcePosition,
  energyLabel,
  workloadGyWeek,
  scaleMPerPixel,
  material,
}: SmartBarrierInput): SmartBarrierResult {
  const midX = (barrierStart.x + barrierEnd.x) / 2;
  const midY = (barrierStart.y + barrierEnd.y) / 2;
  const dx = sourcePosition.x - midX;
  const dy = sourcePosition.y - midY;
  const distancePx = Math.sqrt(dx * dx + dy * dy);
  const distanceM = distancePx * scaleMPerPixel;
  const isPrimary = distanceM < 6.0;
  const tvl = TVL_TABLES[energyLabel] || TVL_TABLES["6 MV"];
  const tvlCm = isPrimary ? tvl.primary : tvl.secondary;
  const designGoal = isPrimary ? 0.1 : 0.02;
  const useFactor = isPrimary ? 0.25 : 1.0;
  const transmission = designGoal / (workloadGyWeek * useFactor * 1.0);
  const nTvl = -Math.log10(Math.max(transmission, 1e-10));
  let thicknessMm: number;
  if (nTvl <= 1.0) {
    thicknessMm = nTvl * tvl.hvl * 10;
  } else {
    thicknessMm = (tvlCm + (nTvl - 1) * tvlCm) * 10;
  }
  thicknessMm *= isPrimary ? 1.15 : 1.10;
  const thicknessM = thicknessMm / 1000;
  const visualThicknessPx = Math.max(2, Math.min(thicknessM / scaleMPerPixel, 50));

  const warnings: string[] = [];
  if (["10 MV", "15 MV", "18 MV"].includes(energyLabel)) {
    warnings.push("Energia >10 MV: requiere blindaje de neutrones adicional");
  }

  return {
    recommended_thickness_mm: Math.round(thicknessMm * 10) / 10,
    recommended_thickness_display: `${(thicknessMm / 10).toFixed(1)} cm (${material})`,
    material,
    is_primary: isPrimary,
    distance_from_source_m: Math.round(distanceM * 100) / 100,
    tvl_cm: tvlCm,
    standard: "NCRP-151",
    ai_reasoning: `Distancia: ${distanceM.toFixed(2)}m. TVL: ${tvlCm}cm. Barrera ${isPrimary ? 'PRIMARIA' : 'SECUNDARIA'}.`,
    visual_thickness_px: Math.round(visualThicknessPx * 10) / 10,
    confidence: distanceM > 3.0 ? "high" : "medium",
    warnings,
  };
}

export function useSmartBarrier() {
  const [lastResult, setLastResult] = useState<SmartBarrierResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const cacheRef = useRef<Map<string, SmartBarrierResult>>(new Map());

  const calculateLocally = useCallback((input: SmartBarrierInput): SmartBarrierResult => {
    const result = calculateSmartBarrierLocally(input);
    setLastResult(result);
    return result;
  }, []);

  const calculateBarrier = useCallback(async (
    barrierStart: { x: number; y: number },
    barrierEnd: { x: number; y: number },
    sourcePosition: { x: number; y: number },
    energyLabel: string,
    workloadGyWeek: number,
    scaleMPerPixel: number,
    material: string,
  ) => {
    const input: SmartBarrierInput = {
      barrierStart,
      barrierEnd,
      sourcePosition,
      energyLabel,
      workloadGyWeek,
      scaleMPerPixel,
      material,
    };
    const cacheKey = JSON.stringify(input);
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!;
      setLastResult(cached);
      return cached;
    }
    setIsCalculating(true);
    try {
      if (isSmartBarrierBackendEnabled()) {
        const apiBase = import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiBase}/api/v1/ai/smart-barrier`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wall_length_m: Math.sqrt((barrierEnd.x - barrierStart.x) ** 2 + (barrierEnd.y - barrierStart.y) ** 2) * scaleMPerPixel,
            wall_angle_deg: Math.atan2(barrierEnd.y - barrierStart.y, barrierEnd.x - barrierStart.x) * 180 / Math.PI,
            source_position: sourcePosition,
            barrier_start: barrierStart,
            barrier_end: barrierEnd,
            source_type: 'linac',
            energy_label: energyLabel,
            workload_gy_week: workloadGyWeek,
            material_preference: material,
            scale_m_per_pixel: scaleMPerPixel,
          }),
        });
        if (!response.ok) throw new Error('Backend error');
        const result: SmartBarrierResult = await response.json();
        cacheRef.current.set(cacheKey, result);
        setLastResult(result);
        return result;
      }
    } catch {
      // Offline fallback below.
    } finally {
      setIsCalculating(false);
    }

    const result = calculateLocally(input);
    cacheRef.current.set(cacheKey, result);
    return result;
  }, [calculateLocally]);

  const clearResult = useCallback(() => {
    setLastResult(null);
    cacheRef.current.clear();
  }, []);

  return { lastResult, isCalculating, calculateBarrier, clearResult };
}
