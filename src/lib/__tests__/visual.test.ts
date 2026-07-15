/**
 * Tests Visuales — Prevencion de bugs que afectan interpretacion
 * Verifica consistencia de colores, estados, y formatos de salida.
 */
import { describe, it, expect } from 'vitest';
import { runValidation, summarize } from '../validation/NCRPValidationSuite';
import { calculateSkyshine, DEFAULT_DISTANCES } from '../skyshine/ChiltonSkyshine';
import { createProfiler } from '../performance/Profiler';
import { findScanner, calculateCTShielding } from '../ct/CTScatterDatabase';

describe('Visual Consistency — No visual bugs', () => {
  it('NCRP: PASS = diff < 5%, FAIL = diff >= 5%', () => {
    const results = runValidation();
    for (const r of results) {
      expect(r.passed).toBe(r.diffPercent <= 5);
    }
  });

  it('NCRP: diffPercent siempre >= 0', () => {
    const results = runValidation();
    for (const r of results) expect(r.diffPercent).toBeGreaterThanOrEqual(0);
  });

  it('NCRP: caseId siempre definido', () => {
    const results = runValidation();
    for (const r of results) {
      expect(r.caseId).toBeDefined();
      expect(r.caseId.length).toBeGreaterThan(0);
    }
  });

  it('NCRP: details no vacio', () => {
    const results = runValidation();
    for (const r of results) expect(r.details.length).toBeGreaterThan(0);
  });

  it('Skyshine: dosis nunca negativa', () => {
    const r = calculateSkyshine({
      energyMV: 10, workloadGym2Week: 500, barrierHeightM: 3,
      roofThicknessMm: 0, beamAngleDeg: 0, distancesM: DEFAULT_DISTANCES,
    });
    for (const p of r.points) expect(p.doseUSvWeek).toBeGreaterThanOrEqual(0);
  });

  it('Skyshine: dosis en 0m > dosis en 200m', () => {
    const r = calculateSkyshine({
      energyMV: 10, workloadGym2Week: 500, barrierHeightM: 3,
      roofThicknessMm: 100, beamAngleDeg: 0, distancesM: [1, 200],
    });
    expect(r.points[0].doseUSvWeek).toBeGreaterThan(r.points[1].doseUSvWeek);
  });

  it('Skyshine: NaN check en todos los puntos', () => {
    const r = calculateSkyshine({
      energyMV: 10, workloadGym2Week: 500, barrierHeightM: 3,
      roofThicknessMm: 300, beamAngleDeg: 0, distancesM: DEFAULT_DISTANCES,
    });
    expect(r.maxDoseUSv).not.toBeNaN();
    expect(r.roofTransmission).not.toBeNaN();
    for (const p of r.points) {
      expect(p.doseUSvWeek).not.toBeNaN();
      expect(p.distanceM).not.toBeNaN();
    }
  });

  it('CT: kappa siempre positivo', () => {
    const s = findScanner('Revolution CT')!;
    for (const kVp of [80, 100, 120, 140]) {
      const { weeklyKerma_uSv } = calculateCTShielding({
        scanner: s, kVp, patientsPerWeek: 10,
        avgDlp_mGycm: 500, distanceM: 2, designGoal_uSv: 100,
      });
      expect(weeklyKerma_uSv).toBeGreaterThanOrEqual(0);
      expect(weeklyKerma_uSv).not.toBeNaN();
    }
  });

  it('Profiler: report nunca retorna NaN', () => {
    const p = createProfiler();
    p.run('test', () => 1);
    const r = p.report()[0];
    expect(r.totalMs).not.toBeNaN();
    expect(r.avgMs).not.toBeNaN();
    expect(r.maxMs).not.toBeNaN();
    expect(r.calls).toBe(1);
  });

  it('Color semantics: PASS = allPassed cuando 0 fallos', () => {
    const results = runValidation();
    const s = summarize(results);
    expect(s.allPassed).toBe(s.failed === 0);
    expect(s.allPassed).toBe(s.passed === s.total);
  });
});
