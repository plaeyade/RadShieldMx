/**
 * Tests NCRPValidationSuite — VV-01
 * Umbral: 5ms por test individual (entorno CI/VM).
 * Batch: 1000x en <100ms.
 */
import { describe, it, expect } from 'vitest';
import { runValidation, summarize, toCSV, complianceText, CASES } from '../validation/NCRPValidationSuite';

const t = (fn: () => void): number => { const t0 = performance.now(); fn(); return performance.now() - t0; };

describe('NCRPValidationSuite', () => {
  it('24 casos — todos pasan', () => {
    const results = runValidation(CASES);
    expect(results).toHaveLength(24);
    expect(results.every(r => r.passed)).toBe(true);
  });

  it('24 casos en <5ms', () => {
    const ms = t(() => runValidation(CASES));
    console.log(`  runValidation(24): ${ms.toFixed(3)}ms`);
    expect(ms).toBeLessThan(5);
  });

  it('summarize correcto', () => {
    const results = runValidation(CASES);
    const s = summarize(results);
    expect(s.total).toBe(24);
    expect(s.passed).toBe(24);
    expect(s.failed).toBe(0);
    expect(s.allPassed).toBe(true);
    expect(s.maxDiff).toBeLessThan(5);
  });

  it('summarize en <2ms', () => {
    const results = runValidation(CASES);
    const ms = t(() => summarize(results));
    console.log(`  summarize(24): ${ms.toFixed(3)}ms`);
    expect(ms).toBeLessThan(2);
  });

  it('toCSV genera formato correcto', () => {
    const csv = toCSV(runValidation(CASES));
    expect(csv).toContain('CaseID,Nombre,Diff%,Estado');
    expect(csv.split('\n').length).toBe(25);
  });

  it('complianceText para suite pasada', () => {
    const s = summarize(runValidation(CASES));
    expect(complianceText(s)).toContain('validado');
  });

  it('caso 147-TVL-01: Pb 100kVp = 0.25mm', () => {
    const r = runValidation(CASES).find(c => c.caseId === '147-TVL-01');
    expect(r).toBeDefined();
    expect(r!.passed).toBe(true);
    expect(r!.diffPercent).toBe(0);
  });

  it('caso 147-ARCH-01: Archer 1mmPb 120kVp', () => {
    const r = runValidation(CASES).find(c => c.caseId === '147-ARCH-01');
    expect(r).toBeDefined();
    expect(r!.passed).toBe(true);
    expect(r!.diffPercent).toBeLessThan(5);
  });

  it('rendimiento: 1000x en <100ms', () => {
    const ms = t(() => { for (let i = 0; i < 1000; i++) runValidation(CASES); });
    console.log(`  1000x runValidation: ${ms.toFixed(3)}ms (${(ms / 1000).toFixed(4)}ms/call)`);
    expect(ms).toBeLessThan(100);
  });
});
