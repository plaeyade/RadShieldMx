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
  buildCalculationTrace,
  buildCalculationUnitSnapshot,
  buildConservativeCalculationComparison,
  getCalculationAuditWarnings,
  getShieldingEnergyKey,
} from '@/lib/shieldingMath';
import { buildCalculationCacheKey } from '@/lib/calculationCacheKey';

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
      let minSourceDistance_m = Infinity;
      for (const p of points) {
        let kerma = 0;
        for (const s of sources) {
          const dx = (p.x - s.x) * scale_m_per_pixel;
          const dy = (p.y - s.y) * scale_m_per_pixel;
          const dz = s.isocenterHeight_m || 0;
          minSourceDistance_m = Math.min(minSourceDistance_m, Math.sqrt(dx * dx + dy * dy + dz * dz));
          kerma += calculateUnshieldedKerma(s, p.x, p.y, scale_m_per_pixel, ctIsodosisProfile);
        }
        maxKerma = Math.max(maxKerma, kerma);
      }

      const requiredThickness: Record<string, number> = {};
      const energy_MeV = sources[0]?.modality.energy_MeV || 6;
      const energyKey = getShieldingEnergyKey(sources[0]) || String(Math.round(energy_MeV));

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

      const calculationTrace = buildCalculationTrace({
        barrier: b,
        sources,
        scale_m_per_pixel,
        maxKerma_mSv_per_wk: maxKerma,
        requiredThickness_mm: requiredThickness,
        samplePointCount: points.length,
      });
      const calculationWarnings = getCalculationAuditWarnings({
        barrier: b,
        sources,
        scale_m_per_pixel,
        maxKerma_mSv_per_wk: maxKerma,
        materialCount: Object.keys(requiredThickness).length,
        samplePointCount: points.length,
        materials: MATERIALS,
        energyKey,
        minSourceDistance_m,
      });
      const selectedMaterial = MATERIALS.find((mat) => mat.code === b.materialCode) ?? MATERIALS[0];
      const selectedThickness = typeof requiredThickness[b.materialCode] === 'number'
        ? requiredThickness[b.materialCode]
        : Math.max(0, ...Object.values(requiredThickness).filter(Number.isFinite));
      const unitSnapshot = buildCalculationUnitSnapshot({
        barrier: b,
        sources,
        material: selectedMaterial,
        scale_m_per_pixel,
        maxKerma_mSv_per_wk: maxKerma,
        selectedThickness_mm: selectedThickness,
        minSourceDistance_m,
      });
      const calculationComparison = buildConservativeCalculationComparison({
        baseThickness_mm: selectedThickness,
        maxKerma_mSv_per_wk: maxKerma,
        designGoal_mSv_per_wk: b.designGoal_mSv_per_wk,
        material: selectedMaterial,
        energyKey,
      });
      const calculationUnitSnapshot = {
        scale_m_per_pixel: unitSnapshot.length.scale_m_per_pixel,
        barrierLength_m: unitSnapshot.length.barrierLength_m,
        sampleOffset_m: unitSnapshot.length.sampleOffset_m,
        minSourceDistance_m: unitSnapshot.length.minSourceDistance_m,
        maxKerma_mSv_per_wk: unitSnapshot.dose.maxKerma_mSv_per_wk,
        maxKerma_uSv_per_h_40h: unitSnapshot.dose.maxKerma_uSv_per_h_40h,
        selectedThickness_mm: unitSnapshot.material.selectedThickness_mm,
        selectedThickness_cm: unitSnapshot.material.selectedThickness_cm,
        density_g_cm3: unitSnapshot.material.density_g_cm3,
        density_kg_m3: unitSnapshot.material.density_kg_m3,
        mass_kg_per_m2: unitSnapshot.material.mass_kg_per_m2,
        cost_per_m2: unitSnapshot.material.cost_per_m2,
        structuralLoad_kPa: unitSnapshot.material.structuralLoad_kPa,
      };
      const calculationCacheKey = buildCalculationCacheKey({
        id: `calc-${b.id}`,
        name: 'calculation-barrier',
        imageUrl: '',
        width_pixels: 0,
        height_pixels: 0,
        scale_m_per_pixel,
        barriers: [b],
        sources,
        occupiedRegions: [],
        criticalPoints: [],
      });

      return { ...b, maxKerma, requiredThickness_mm: requiredThickness, calculationTrace, calculationWarnings, calculationComparison, calculationUnitSnapshot, calculationCacheKey };
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
