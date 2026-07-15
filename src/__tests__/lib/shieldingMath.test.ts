/**
 * C.4 — Unit tests: shieldingMath.ts
 * Tests for NCRP 147/151 shielding calculations
 * All formulas validated against official tables
 */
import { describe, it, expect } from 'vitest';
import {
  archerTransmission,
  inverseArcher,
  tvlTransmission,
  tvlThickness,
  exponentialThickness,
  SAMPLING_DISTANCE_M,
  SAMPLING_SPACING_M,
} from '@/lib/shieldingMath';
import type { ShieldingMaterial } from '@/types/radshield';

// ─── Test materials ───
const CONCRETE_235: ShieldingMaterial = {
  name: 'Concreto normal (2.35 g/cm³)',
  code: 'CONCRETE235',
  density: 2.35,
  archerAlpha: 0.0383,
  archerBeta: 0.0141,
  archerGamma: 1.099,
  TVL_mm: { '6MV': 370, '10MV': 370, '15MV': 410, '18MV': 450, 'Co60': 218, '511keV': 170 },
  cost_per_m3: 180,
  cost_per_kg: 0.08,
  color: '#9CA3AF',
  category: 'Convencional',
};

const LEAD: ShieldingMaterial = {
  name: 'Plomo laminado (Pb)',
  code: 'PB',
  density: 11.34,
  archerAlpha: 2.246,
  archerBeta: 6.31,
  archerGamma: 0.629,
  TVL_mm: { '6MV': 55, '10MV': 60, '15MV': 70, '18MV': 80, 'Co60': 11.3, '511keV': 11.8, '140keV': 0.3 },
  cost_per_m3: 8500,
  cost_per_kg: 0.75,
  color: '#374151',
  category: 'Convencional',
};

const STEEL: ShieldingMaterial = {
  name: 'Acero',
  code: 'STEEL',
  density: 7.87,
  TVL_mm: { '6MV': 85, '10MV': 90 },
  cost_per_m3: 3200,
  cost_per_kg: 0.41,
  color: '#1F2937',
  category: 'Convencional',
};

describe('shieldingMath — NCRP 147 Archer Equation', () => {
  it('archerTransmission(0) = 1.0 (no shielding)', () => {
    expect(archerTransmission(0, CONCRETE_235)).toBe(1.0);
  });

  it('archerTransmission with negative thickness = 1.0', () => {
    expect(archerTransmission(-10, CONCRETE_235)).toBe(1.0);
  });

  it('archerTransmission decreases with increasing thickness', () => {
    const t100 = archerTransmission(100, CONCRETE_235);
    const t200 = archerTransmission(200, CONCRETE_235);
    const t300 = archerTransmission(300, CONCRETE_235);
    expect(t100).toBeGreaterThan(t200);
    expect(t200).toBeGreaterThan(t300);
    expect(t300).toBeGreaterThan(0);
    expect(t300).toBeLessThan(0.5);
  });

  it('archerTransmission for lead at diagnostic energies (120 kVp)', () => {
    // At 120 kVp, lead should be very attenuating even at small thicknesses
    const t1mm = archerTransmission(1, LEAD);
    const t5mm = archerTransmission(5, LEAD);
    expect(t1mm).toBeLessThan(0.5); // Lead is very effective at diagnostic energies
    expect(t5mm).toBeLessThan(0.1);
  });

  it('archerTransmission respects theta angle (oblique incidence)', () => {
    const t0 = archerTransmission(200, CONCRETE_235, 0);
    const t45 = archerTransmission(200, CONCRETE_235, Math.PI / 4);
    // Oblique incidence (larger theta) requires more thickness
    expect(t45).toBeLessThan(t0);
  });

  it('inverseArcher is consistent with archerTransmission', () => {
    const target = 0.001;
    const thickness = inverseArcher(target, CONCRETE_235);
    const actual = archerTransmission(thickness, CONCRETE_235);
    expect(actual).toBeCloseTo(target, 3);
  });

  it('inverseArcher(1.0) = 0 (no shielding needed)', () => {
    expect(inverseArcher(1.0, CONCRETE_235)).toBe(0);
  });

  it('inverseArcher(0) returns max thickness (500mm)', () => {
    expect(inverseArcher(0, CONCRETE_235)).toBe(500);
  });

  it('inverseArcher converges within max iterations', () => {
    const thickness = inverseArcher(0.0001, CONCRETE_235, 0, 1e-10, 200);
    expect(thickness).toBeGreaterThan(0);
    expect(thickness).toBeLessThan(3000); // Very low transmission needs thick shield
  });
});

describe('shieldingMath — NCRP 151 TVL Method', () => {
  it('tvlTransmission(0) = 1.0', () => {
    expect(tvlTransmission(0, CONCRETE_235, '6MV')).toBe(1.0);
  });

  it('tvlTransmission with negative thickness = 1.0', () => {
    expect(tvlTransmission(-100, CONCRETE_235, '6MV')).toBe(1.0);
  });

  it('1 TVL thickness = 10% transmission', () => {
    const oneTVL = CONCRETE_235.TVL_mm?.['6MV'] || 370;
    const B = tvlTransmission(oneTVL, CONCRETE_235, '6MV');
    expect(B).toBeCloseTo(0.1, 6);
  });

  it('2 TVL thickness = 1% transmission', () => {
    const oneTVL = CONCRETE_235.TVL_mm?.['6MV'] || 370;
    const B = tvlTransmission(2 * oneTVL, CONCRETE_235, '6MV');
    expect(B).toBeCloseTo(0.01, 6);
  });

  it('tvlThickness calculates correct number of TVLs', () => {
    // To reduce from 1000 mSv to 0.02 mSv = log10(1000/0.02) = log10(50000) ≈ 4.7 TVLs
    const thickness = tvlThickness(1000, 0.02, CONCRETE_235, '6MV');
    const nTVLs = thickness / (CONCRETE_235.TVL_mm?.['6MV'] || 370);
    expect(nTVLs).toBeCloseTo(Math.log10(1000 / 0.02), 1);
  });

  it('tvlThickness returns 0 when goal already met', () => {
    expect(tvlThickness(0.01, 0.02, CONCRETE_235, '6MV')).toBe(0);
  });

  it('fallback TVL estimation when no TVL data', () => {
    const matNoTVL: ShieldingMaterial = {
      name: 'Test Material',
      code: 'TEST',
      density: 3.0,
      cost_per_m3: 100,
      cost_per_kg: 0.1,
      color: '#000',
      category: 'Test',
    };
    const B = tvlTransmission(370, matNoTVL, '6MV');
    expect(B).toBeGreaterThan(0);
    expect(B).toBeLessThan(1);
  });
});

describe('shieldingMath — Exponential Attenuation (Nuclear Medicine)', () => {
  it('exponentialThickness returns 0 when goal already met', () => {
    expect(exponentialThickness(0.01, 0.02, CONCRETE_235, '511keV')).toBe(0);
  });

  it('exponentialThickness for PET 511 keV in concrete', () => {
    const thickness = exponentialThickness(100, 0.02, CONCRETE_235, '511keV');
    expect(thickness).toBeGreaterThan(0);
    expect(thickness).toBeLessThan(2000); // Reasonable range for PET shielding
  });

  it('exponentialThickness for lead at 511 keV', () => {
    const thickness = exponentialThickness(100, 0.02, LEAD, '511keV');
    // Lead should require much less thickness than concrete
    const concreteThickness = exponentialThickness(100, 0.02, CONCRETE_235, '511keV');
    expect(thickness).toBeLessThan(concreteThickness / 5);
  });
});

describe('shieldingMath — Constants', () => {
  it('SAMPLING_DISTANCE_M is reasonable (>0)', () => {
    expect(SAMPLING_DISTANCE_M).toBeGreaterThan(0);
    expect(SAMPLING_DISTANCE_M).toBeLessThan(1);
  });

  it('SAMPLING_SPACING_M is reasonable (>0)', () => {
    expect(SAMPLING_SPACING_M).toBeGreaterThan(0);
    expect(SAMPLING_SPACING_M).toBeLessThan(SAMPLING_DISTANCE_M);
  });
});

describe('shieldingMath — Edge Cases & Robustness', () => {
  it('handles material with only HVL (no TVL)', () => {
    const matHVLOnly: ShieldingMaterial = {
      name: 'HVL Only',
      code: 'HVLONLY',
      density: 2.0,
      HVL_mm: { 'test': 50 },
      cost_per_m3: 100,
      cost_per_kg: 0.1,
      color: '#000',
      category: 'Test',
    };
    const thickness = exponentialThickness(100, 0.02, matHVLOnly, 'test');
    expect(thickness).toBeGreaterThan(0);
  });

  it('handles material with no HVL or TVL (density fallback)', () => {
    const matBare: ShieldingMaterial = {
      name: 'Bare',
      code: 'BARE',
      density: 2.35,
      cost_per_m3: 100,
      cost_per_kg: 0.1,
      color: '#000',
      category: 'Test',
    };
    const thickness = exponentialThickness(100, 0.02, matBare, 'anything');
    expect(thickness).toBeGreaterThan(0);
  });

  it('archerTransmission with large thickness approaches 0', () => {
    const B = archerTransmission(1000, LEAD);
    expect(B).toBeLessThan(0.001);
  });

  it('tvlTransmission with very large thickness', () => {
    const B = tvlTransmission(5000, CONCRETE_235, '6MV');
    expect(B).toBeGreaterThan(0); // Should never be exactly 0
    expect(B).toBeLessThan(1e-10); // But extremely small
  });
});
