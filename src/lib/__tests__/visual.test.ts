/**
 * Tests Visuales — Prevencion de bugs que afectan interpretacion
 * Verifica consistencia de colores, estados, y formatos de salida.
 */
import { describe, it, expect } from 'vitest';
import { runValidation, summarize } from '../validation/NCRPValidationSuite';
import { createProfiler } from '../performance/Profiler';

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
