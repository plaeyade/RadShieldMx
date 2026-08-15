import { describe, expect, it } from 'vitest';
import {
  buildMaterialTechnicalRegistry,
  compareMaterialsForEnergy,
  getMaterialsForModality,
  validateMaterialTechnicalRegistry,
} from '@/lib/materialTechnicalRegistry';

describe('material technical registry', () => {
  it('builds a deduplicated technical view from canonical materials', () => {
    const registry = buildMaterialTechnicalRegistry();
    const validation = validateMaterialTechnicalRegistry(registry);
    const codes = registry.map((item) => item.code);

    expect(validation.errors).toEqual([]);
    expect(validation.duplicateCodes).toEqual([]);
    expect(codes).toEqual(expect.arrayContaining(['CONCRETE235', 'PB', 'STEEL', 'NIPOL350', 'NIPOL400', 'NIPOL500']));
  });

  it('derives mass, cost and structural load for high energy materials', () => {
    const comparison = compareMaterialsForEnergy('15MV', 1);
    const lead = comparison.find((item) => item.code === 'PB');
    const nipol350 = comparison.find((item) => item.code === 'NIPOL350');
    const nipol500 = comparison.find((item) => item.code === 'NIPOL500');

    expect(lead?.thickness_mm).toBe(70);
    expect(nipol350?.thickness_mm).toBe(301);
    expect(nipol500?.thickness_mm).toBe(210);
    expect(nipol500!.mass_kg_per_m2).toBeGreaterThan(nipol350!.mass_kg_per_m2);
    expect(nipol500!.structuralLoad_kPa).toBeGreaterThan(0);
    expect(comparison.every((item) => Number.isFinite(item.cost_per_m2))).toBe(true);
  });

  it('filters modality-ready materials for TX, NM, DX and CY workflows', () => {
    expect(getMaterialsForModality('TX').some((item) => item.code === 'CONCRETE235')).toBe(true);
    expect(getMaterialsForModality('NM').some((item) => item.tvl_mm['511keV'])).toBe(true);
    expect(getMaterialsForModality('CY').some((item) => /NIPOL|BPE|CONCRETE/i.test(item.code))).toBe(true);
    expect(getMaterialsForModality('DX').some((item) => item.sourceRefs.includes('NCRP147-Archer'))).toBe(true);
  });
});
