import { describe, expect, it } from 'vitest';
import {
  buildMaterialTechnicalRegistry,
  buildMaterialDecisionRows,
  buildMaterialTechnicalClosure,
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

    expect(lead?.thickness_mm).toBe(57); // NCRP 151 Tabla B.2: TVL₁ del plomo 5.7 cm a 4–30 MV
    expect(nipol350?.thickness_mm).toBe(301);
    expect(nipol500?.thickness_mm).toBe(210);
    // A 15 MV la atenuación de fotones escala con el espesor másico (ρ·x): el material más denso
    // es más delgado pero pesa prácticamente lo mismo por m² (301 mm × 3,5 ≈ 210 mm × 5,0).
    expect(Math.abs(nipol500!.mass_kg_per_m2 - nipol350!.mass_kg_per_m2) / nipol350!.mass_kg_per_m2).toBeLessThan(0.02);
    expect(nipol500!.thickness_mm).toBeLessThan(nipol350!.thickness_mm);
    expect(nipol500!.structuralLoad_kPa).toBeGreaterThan(0);
    expect(comparison.every((item) => Number.isFinite(item.cost_per_m2))).toBe(true);
  });

  it('filters modality-ready materials for TX, NM, DX and CY workflows', () => {
    expect(getMaterialsForModality('TX').some((item) => item.code === 'CONCRETE235')).toBe(true);
    expect(getMaterialsForModality('NM').some((item) => item.tvl_mm['511keV'])).toBe(true);
    expect(getMaterialsForModality('CY').some((item) => /NIPOL|BPE|CONCRETE/i.test(item.code))).toBe(true);
    expect(getMaterialsForModality('DX').some((item) => item.sourceRefs.includes('NCRP147-Archer'))).toBe(true);
  });

  it('closes the beta material registry with planning rows and guardrails', () => {
    const rows = buildMaterialDecisionRows({ energyKey: '15MV', area_m2: 20, requiredTvls: 1 });
    const closure = buildMaterialTechnicalClosure();

    expect(rows.length).toBeGreaterThan(5);
    expect(rows.every((item) => item.totalMass_kg > 0)).toBe(true);
    expect(rows.some((item) => item.structuralStatus === 'structural-review')).toBe(true);
    expect(closure.status).toBe('beta-materials-ready');
    expect(closure.availableModalities).toMatchObject({ DX: expect.any(Number), TX: expect.any(Number), NM: expect.any(Number), CY: expect.any(Number) });
    expect(closure.releaseGuards.join(' ')).toContain('Commercial/vendor materials');
  });
});
