/**
 * integration.test.ts — Fase 3.15: Tests de integracion E2E
 * Flujo completo: plano → barrera → calculo → verificacion contra NCRP 147
 * Valida que la cadena completa produce resultados correctos.
 */
import { describe, it, expect } from 'vitest';
import {
  archerTransmission,
  inverseArcher,
  tvlTransmission,
  tvlThickness,
  calculateUnshieldedKerma,
  roundThickness,
} from './shieldingMath';
import { MATERIALS, type RadiationSource, type Modality } from '@/types/radshield';

// ─── Fixtures ───
const concrete = MATERIALS.find(m => m.code === 'CONCRETE235')!;
const lead = MATERIALS.find(m => m.code === 'PB')!;

const linac6MV: Modality = {
  id: 'linac-6mv', name: 'Linac 6 MV', category: 'therapy',
  energies: [6], doseRateConstant: 4.0, workloadDefault: 35,
  unit: 'frac/week', description: 'Test Linac', workloadDistribution: undefined,
};

const source: RadiationSource = {
  id: 's-linac', x: 500, y: 500, name: 'Linac Source',
  modality: linac6MV, workloadValue: 35, workloadUnit: 'frac/week',
  isocenterHeight_m: 1.0, useFactor: 0.25, workloadHoursPerWeek: 40,
};

// ═══════════════════════════════════════════════════════════════════
// E2E TEST: Flujo completo de blindaje
// ═══════════════════════════════════════════════════════════════════
describe('E2E: Flujo completo NCRP 151 — Linac 6 MV', () => {
  it('Paso 1: Calcular kerma sin blindaje en barrera primaria', () => {
    // Barrera primaria a 4.5m del isocentro
    const barrierX = 950; // 4.5m away at 0.01 scale (450px × 0.01 = 4.5m)
    const barrierY = 500;
    const scale = 0.01; // 1px = 1cm

    const kerma = calculateUnshieldedKerma(source, barrierX, barrierY, scale);

    // K = W × D × U / d² × 1000 = 35 × 2 × 0.25 / 20.25 × 1000
    // Expected: ~864 mSv/week
    expect(kerma).toBeGreaterThan(700);
    expect(kerma).toBeLessThan(1000);
  });

  it('Paso 2: Determinar transmission requerida', () => {
    const designGoal = 0.02; // mSv/week for controlled area
    const kermaUnshielded = 864; // from previous test (approximate)
    const requiredB = designGoal / kermaUnshielded;

    expect(requiredB).toBeLessThan(1);
    expect(requiredB).toBeGreaterThan(0);
  });

  it('Paso 3: Calcular espesor de concreto requerido', () => {
    const kermaUnshielded = 864;
    const designGoal = 0.02;
    const thickness = tvlThickness(kermaUnshielded, designGoal, concrete, '6MV');

    // For 6 MV, TVL concrete ≈ 370 mm
    // n = log10(864/0.02) = log10(43200) ≈ 4.64
    // thickness ≈ 4.64 x 370 ≈ 1715 mm ≈ 1.7 m
    expect(thickness).toBeGreaterThan(1500);
    expect(thickness).toBeLessThan(1800);
  });

  it('Paso 4: Calcular espesor de plomo equivalente', () => {
    const kermaUnshielded = 864;
    const designGoal = 0.02;
    const thicknessPb = tvlThickness(kermaUnshielded, designGoal, lead, '6MV');

    // For 6 MV, TVL lead = 55 mm (from our data)
    // n = log10(43200) ≈ 4.64
    // thickness ≈ 4.64 x 55 ≈ 255 mm
    expect(thicknessPb).toBeGreaterThan(200);
    expect(thicknessPb).toBeLessThan(300);
  });

  it('Paso 5: Verificar que concreto es ~6.7x el plomo (per our TVL data)', () => {
    const kermaUnshielded = 864;
    const designGoal = 0.02;
    const tConc = tvlThickness(kermaUnshielded, designGoal, concrete, '6MV');
    const tPb = tvlThickness(kermaUnshielded, designGoal, lead, '6MV');

    expect(tConc / tPb).toBeCloseTo(370 / 55, 0); // TVL_concrete/TVL_lead ≈ 6.73
  });

  it('Paso 6: Redondear a estandar de construccion', () => {
    const thickness = 1715;
    const rounded = roundThickness(thickness, 'CONCRETE235');

    // Concrete rounds up to 5 mm increments
    expect(rounded).toBe(1715); // Already divisible by 5
    expect(rounded % 5).toBe(0); // Divisible by 5
  });

  it('Paso 7: Verificar transmission con espesor calculado', () => {
    const kermaUnshielded = 864;
    const designGoal = 0.02;
    const thickness = tvlThickness(kermaUnshielded, designGoal, concrete, '6MV');
    const rounded = roundThickness(thickness, 'CONCRETE235');
    const actualB = tvlTransmission(rounded, concrete, '6MV');
    const actualKerma = actualB * kermaUnshielded;

    // With rounded-up thickness, actual kerma should be ≤ design goal
    expect(actualKerma).toBeLessThanOrEqual(designGoal * 1.05); // 5% tolerance
  });

  it('Flujo completo end-to-end', () => {
    // Given: Linac 6MV, 35 fractions/week, 2 Gy/fraction, primary barrier at 4.5m
    // When: Calculate required shielding
    // Then: Concrete thickness should be ~1.7m (rounded up to construction standard)

    const W = 35; // fractions/week
    const D = 2.0; // Gy/fraction
    const U = 0.25; // use factor
    const d = 4.5; // meters
    const P = 0.02; // mSv/week design goal

    // Unshielded kerma (Gy/week × 1000 = mSv/week)
    const K_unshielded = (W * D * U) / (d * d) * 1000; // mSv/week
    expect(K_unshielded).toBeCloseTo(864, 0); // ≈ 864 mSv/week (±0.5)

    // Required thickness
    const thickness = tvlThickness(K_unshielded, P, concrete, '6MV');
    const rounded = roundThickness(thickness, 'CONCRETE235');

    // Verify final transmission
    const B = tvlTransmission(rounded, concrete, '6MV');
    const K_shielded = B * K_unshielded;

    expect(K_shielded).toBeLessThanOrEqual(P * 1.05);
    expect(rounded % 5).toBe(0); // Construction standard
  });
});

// ═══════════════════════════════════════════════════════════════════
// VALIDACION: Cross-check entre metodos
// ═══════════════════════════════════════════════════════════════════
describe('Cross-validation: NCRP 147 (Archer) vs NCRP 151 (TVL)', () => {
  it('Para energias de megavoltaje, Archer y TVL son orden-consistentes', () => {
    // Archer is fitted for diagnostic X-rays; TVL is for megavoltage.
    // They should not be compared quantitatively across energy domains.
    // Instead, verify both predict: thinner lead needed than concrete.
    const B = 0.01;
    const tArcherPb = inverseArcher(B, lead);
    const tArcherConc = inverseArcher(B, concrete);
    const tvlPb = (lead.TVL_mm?.['6MV'] || 55) * Math.log10(1 / B);
    const tvlConc = (concrete.TVL_mm?.['6MV'] || 370) * Math.log10(1 / B);

    // Both methods: lead << concrete
    expect(tArcherPb).toBeLessThan(tArcherConc / 5);
    expect(tvlPb).toBeLessThan(tvlConc / 5);
  });

  it('Archer transmission decreases monotonically', () => {
    const thicknesses = [0, 10, 50, 100, 200, 500];
    const transmissions = thicknesses.map(t => archerTransmission(t, lead));
    for (let i = 1; i < transmissions.length; i++) {
      expect(transmissions[i]).toBeLessThan(transmissions[i - 1]);
    }
  });

  it('TVL transmission follows exact base-10 exponential', () => {
    const tvl = 100;
    const mat = { ...concrete, TVL_mm: { 'test': tvl } };
    expect(tvlTransmission(0, mat as any, 'test')).toBe(1.0);
    expect(tvlTransmission(tvl, mat as any, 'test')).toBeCloseTo(0.1, 10);
    expect(tvlTransmission(2 * tvl, mat as any, 'test')).toBeCloseTo(0.01, 10);
    expect(tvlTransmission(3 * tvl, mat as any, 'test')).toBeCloseTo(0.001, 10);
  });
});
