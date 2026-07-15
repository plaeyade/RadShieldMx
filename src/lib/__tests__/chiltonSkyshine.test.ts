import { describe, it, expect } from 'vitest';
import { calculateSkyshine, DEFAULT_DISTANCES } from '../skyshine/ChiltonSkyshine';

const t = (fn: () => void): number => { const t0 = performance.now(); fn(); return performance.now() - t0; };

const base = {
  energyMV: 10, workloadGym2Week: 500, barrierHeightM: 3,
  roofThicknessMm: 300, beamAngleDeg: 0, distancesM: DEFAULT_DISTANCES,
} as const;

describe('ChiltonSkyshine', () => {
  it('calcula 11 puntos correctamente', () => {
    const r = calculateSkyshine(base);
    expect(r.points.length).toBe(11);
    expect(r.maxDoseUSv).toBeGreaterThan(0);
    expect(r.roofTransmission).toBeGreaterThan(0);
    expect(r.roofTransmission).toBeLessThan(1);
  });

  it('11 puntos en <2ms', () => {
    const ms = t(() => calculateSkyshine(base));
    console.log(`  calculateSkyshine(11 pts): ${ms.toFixed(3)}ms`);
    expect(ms).toBeLessThan(2);
  });

  it('dosis disminuye con distancia', () => {
    const r = calculateSkyshine(base);
    for (let i = 1; i < r.points.length; i++)
      expect(r.points[i].doseUSvWeek).toBeLessThanOrEqual(r.points[i - 1].doseUSvWeek);
  });

  it('angulo 45° > 0°', () => {
    const r0 = calculateSkyshine(base);
    const r45 = calculateSkyshine({ ...base, beamAngleDeg: 45 });
    expect(r45.angleCorrection).toBe(1.8);
    expect(r45.maxDoseUSv).toBeGreaterThan(r0.maxDoseUSv);
  });

  it('techo grueso = menor dosis', () => {
    expect(
      calculateSkyshine({ ...base, roofThicknessMm: 500 }).maxDoseUSv
    ).toBeLessThan(
      calculateSkyshine({ ...base, roofThicknessMm: 100 }).maxDoseUSv
    );
  });

  it('6MV vs 18MV: menor energia = menor transmision', () => {
    expect(calculateSkyshine({ ...base, energyMV: 6 }).roofTransmission)
      .toBeLessThan(calculateSkyshine({ ...base, energyMV: 18 }).roofTransmission);
  });

  it('rendimiento: 10000x en <200ms', () => {
    const ms = t(() => { for (let i = 0; i < 10000; i++) calculateSkyshine(base); });
    console.log(`  10000x calculateSkyshine: ${ms.toFixed(3)}ms (${(ms / 10000).toFixed(4)}ms/call)`);
    expect(ms).toBeLessThan(200);
  });
});
