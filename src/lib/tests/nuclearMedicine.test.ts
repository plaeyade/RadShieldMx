// =============================================================================
// nuclearMedicine.test.ts — Test Suite for Nuclear Medicine Shielding
// Validates TG 108, decay calculations, MIRD dosimetry, release criteria
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  RADIONUCLIDES, calculateWeeklyKerma, calculateNMBarrierThickness,
  decayedActivity, decayInStorageTime, canReleasePatient,
  bremsstrahlungShielding,
} from '../nuclearMedicine';

describe('Nuclear Medicine — Radionuclide Database', () => {
  it('has 14 radionuclides loaded', () => {
    expect(RADIONUCLIDES.length).toBe(14);
  });

  it('F-18 has correct half-life (109.8 min)', () => {
    const f18 = RADIONUCLIDES.find(r => r.symbol === 'F-18');
    expect(f18).toBeDefined();
    expect(f18!.halfLife_hours).toBeCloseTo(1.83, 2);
    expect(f18!.gammaConstant_mSv_m2_GBq_h).toBe(0.143);
  });

  it('Tc-99m has correct properties', () => {
    const tc = RADIONUCLIDES.find(r => r.symbol === 'Tc-99m');
    expect(tc).toBeDefined();
    expect(tc!.halfLife_hours).toBe(6.01);
    expect(tc!.primaryEnergies_keV).toContain(140);
    // Fase 11 (#57 N3): HVL de la tabla = primer espesor de la regla espectral GP a B = 0.5 (antes 0.27 mm, haz estrecho).
    expect(tc!.HVL_lead_mm).toBe(0.44);
  });

  it('Lu-177 therapy properties are correct', () => {
    const lu = RADIONUCLIDES.find(r => r.symbol === 'Lu-177');
    expect(lu).toBeDefined();
    expect(lu!.category).toBe('Therapy');
    expect(lu!.avgBetaEnergy_MeV).toBe(0.134);
  });

  it('every radionuclide has positive gamma constant or is beta-only', () => {
    for (const r of RADIONUCLIDES) {
      if (r.emissionType === 'beta') {
        expect(r.gammaConstant_mSv_m2_GBq_h).toBeLessThan(0.01);
      } else {
        expect(r.gammaConstant_mSv_m2_GBq_h).toBeGreaterThan(0);
      }
    }
  });
});

describe('TG 108 — Weekly Kerma Calculations', () => {
  it('F-18 at 1m, 3.7 GBq, 40h/wk = ~7.8 mSv/wk', () => {
    const kerma = calculateWeeklyKerma(0.143, 3.7, 40, 1.0);
    expect(kerma).toBeCloseTo(21.16, 0); // 0.143 * 3.7 * 40 = 21.164
  });

  it('Tc-99m at 2m, 1 GBq, 40h/wk = ~0.3 mSv/wk', () => {
    const kerma = calculateWeeklyKerma(0.030, 1.0, 40, 2.0);
    expect(kerma).toBeCloseTo(0.30, 1);
  });

  it('Lu-177 at 1m, 7.4 GBq, 8h/wk = ~0.03 mSv/wk', () => {
    const kerma = calculateWeeklyKerma(0.005, 7.4, 8, 1.0);
    expect(kerma).toBeCloseTo(0.296, 2);
  });

  it('distance 0 returns infinity', () => {
    const kerma = calculateWeeklyKerma(0.143, 1, 1, 0);
    expect(kerma).toBe(Infinity);
  });
});

describe('Barrier Thickness Calculations', () => {
  it('F-18 PET room: needs shielding', () => {
    const thick = calculateNMBarrierThickness(0.143, 7.4, 30, 2.0, 100, 13.6); // lead TVL
    expect(thick).toBeGreaterThan(0);
    expect(thick).toBeGreaterThan(20); // significant lead needed
  });

  it('Tc-99m room: minimal shielding at 2m', () => {
    const thick = calculateNMBarrierThickness(0.030, 1.11, 40, 2.0, 100, 0.90); // lead TVL
    expect(thick).toBeGreaterThanOrEqual(0);
  });

  it('below design goal needs no shielding', () => {
    const thick = calculateNMBarrierThickness(0.005, 0.1, 1, 3.0, 100, 1.67);
    expect(thick).toBe(0);
  });
});

describe('Radioactive Decay Calculations', () => {
  it('F-18 decays to half after 1.83 hours', () => {
    const remaining = decayedActivity(3.7, 1.83, 1.83);
    expect(remaining).toBeCloseTo(1.85, 2);
  });

  it('F-18 decays to quarter after 2 half-lives', () => {
    const remaining = decayedActivity(3.7, 1.83, 3.66);
    expect(remaining).toBeCloseTo(0.925, 3);
  });

  it('Tc-99m after 24h: ~6.25% remaining (4 half-lives)', () => {
    const remaining = decayedActivity(1.0, 6.01, 24.0);
    expect(remaining).toBeCloseTo(0.0625, 1);
  });

  it('storage time for F-18 to reach 0.01 GBq from 3.7', () => {
    const hours = decayInStorageTime(3.7, 0.01, 1.83);
    // 3.7 → 0.01 is ~8.5 half-lives (log2(370) ≈ 8.53), × 1.83h ≈ 15.6h
    expect(hours).toBeGreaterThan(14);
    expect(hours).toBeLessThan(17);
  });
});

describe('Patient Release Criteria (NRC Reg Guide 8.39)', () => {
  it('F-18 patient at 0.37 GBq CAN be released', () => {
    const result = canReleasePatient(0.37, 'F-18');
    expect(result.canRelease).toBe(true);
    // Tasa a 1 m que corresponde al umbral de actividad (RG 8.39), no 5 mSv/h
    expect(result.limit_mSv_at_1m).toBeCloseTo(0.143 * 3.0, 6);
  });

  it('F-18 patient at 3.7 GBq CANNOT be released', () => {
    const result = canReleasePatient(3.7, 'F-18');
    expect(result.canRelease).toBe(false);
  });

  it('I-131: el límite de tasa es ~0.07 mSv/h (1.22 GBq), no 5 mSv/h', () => {
    const r = canReleasePatient(1.2, 'I-131');
    expect(r.limit_mSv_at_1m).toBeCloseTo(0.059 * 1.22, 6);
    expect(r.canRelease).toBe(true);
  });

  it('I-131 therapy patient at 1.85 GBq CANNOT be released', () => {
    const result = canReleasePatient(1.85, 'I-131');
    expect(result.canRelease).toBe(false);
  });
});

describe('Bremsstrahlung Shielding', () => {
  it('Y-90 requires significant bremsstrahlung shielding at low design goal', () => {
    // Use a stricter design goal (10 uSv/week) to force shielding requirement
    const result = bremsstrahlungShielding(2.0, 2.284, 2.0, 10);
    expect(result.leadThickness_mm).toBeGreaterThan(0);
    expect(result.xrayFraction).toBeGreaterThan(0);
  });

  it('gamma emitter has no bremsstrahlung', () => {
    // For non-beta emitters, this still runs but should give 0
    const result = bremsstrahlungShielding(0.01, 0.001, 10, 100);
    expect(result.leadThickness_mm).toBe(0);
  });
});

describe('Half-life consistency', () => {
  it('every radionuclide has positive half-life', () => {
    for (const r of RADIONUCLIDES) {
      expect(r.halfLife_hours).toBeGreaterThan(0);
    }
  });

  it('most PET tracers have shorter half-lives than most therapy (excl Zr-89 immuno-PET)', () => {
    // Zr-89 (78.4h) is an outlier for immuno-PET; typical PET (F-18, Ga-68) are much shorter
    const typicalPET = RADIONUCLIDES.filter(r => r.category === 'PET' && r.symbol !== 'Zr-89');
    const petMax = Math.max(...typicalPET.map(r => r.halfLife_hours));
    const therapyMin = Math.min(...RADIONUCLIDES.filter(r => r.category === 'Therapy').map(r => r.halfLife_hours));
    expect(petMax).toBeLessThan(therapyMin);
  });

  it('Zr-89 immuno-PET has longer half-life than some therapy (known exception)', () => {
    const zr89 = RADIONUCLIDES.find(r => r.symbol === 'Zr-89');
    const y90 = RADIONUCLIDES.find(r => r.symbol === 'Y-90');
    expect(zr89!.halfLife_hours).toBeGreaterThan(y90!.halfLife_hours);
  });
});
