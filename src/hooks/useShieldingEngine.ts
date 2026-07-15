import { useCallback } from 'react';
import {
  type Barrier,
  type RadiationSource,
  MATERIALS,
} from '@/types/radshield';
import { type CTIsodosisProfile } from '@/types/ctIsodosis';
import {
  inverseArcher,
  tvlThickness,
  exponentialThickness,
  calculateUnshieldedKerma,
  generateSamplePoints,
  roundThickness,
  calculateHeatmapGrid,
} from '@/lib/shieldingMath';

export function useShieldingEngine() {

  const calculateAllBarriers = useCallback((
    barriers: Barrier[],
    sources: RadiationSource[],
    scale_m_per_pixel: number,
    ctIsodosisProfile?: CTIsodosisProfile
  ): Barrier[] => {
    if (!sources.length) return barriers;
    return barriers.map(b => {
      const points = generateSamplePoints(b, scale_m_per_pixel);
      if (!points.length) return b;

      let maxKerma = 0;
      for (const p of points) {
        let kerma = 0;
        for (const s of sources) {
          kerma += calculateUnshieldedKerma(s, p.x, p.y, scale_m_per_pixel, ctIsodosisProfile);
        }
        maxKerma = Math.max(maxKerma, kerma);
      }

      const requiredThickness: Record<string, number> = {};
      const energy_MeV = sources[0]?.modality.energy_MeV || 6;
      const energyKey = String(Math.round(energy_MeV));

      for (const mat of MATERIALS) {
        let thickness = 0;
        if (sources[0]?.modality.category === 'diagnostic') {
          const B = Math.max(1e-10, b.designGoal_mSv_per_wk / (maxKerma || 1));
          thickness = inverseArcher(B, mat);
        } else if (sources[0]?.modality.category === 'therapy') {
          thickness = tvlThickness(maxKerma, b.designGoal_mSv_per_wk, mat, energyKey);
        } else {
          thickness = exponentialThickness(maxKerma, b.designGoal_mSv_per_wk, mat, energyKey);
        }
        if (thickness > 0) requiredThickness[mat.code] = thickness;
      }

      return { ...b, maxKerma, requiredThickness_mm: requiredThickness };
    });
  }, []);

  const calculateHeatmap = useCallback((
    sources: RadiationSource[],
    scale_m_per_pixel: number,
    gridSize: number = 50,
    ctIsodosisProfile?: CTIsodosisProfile
  ) => {
    return calculateHeatmapGrid(sources, scale_m_per_pixel, gridSize, ctIsodosisProfile);
  }, []);

  return { calculateAllBarriers, calculateHeatmap, roundThickness };
}
