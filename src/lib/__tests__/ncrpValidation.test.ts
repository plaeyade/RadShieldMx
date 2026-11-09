/**
 * Tests NCRPValidationSuite (Fase 8b): cada caso llama al motor real y se compara con un ejemplo publicado.
 */
import { describe, it, expect } from 'vitest';
import { runValidation, summarize, toCSV, complianceText, CASES, type ValCase } from '../validation/NCRPValidationSuite';

describe('NCRPValidationSuite', () => {
  it('todos los casos reproducen el valor publicado dentro de su tolerancia', () => {
    const results = runValidation(CASES);
    expect(results).toHaveLength(CASES.length);
    for (const r of results) expect(r.passed, r.details).toBe(true);
  });

  it('ningún caso devuelve el valor esperado sin calcular (calc ≠ () => expected)', () => {
    for (const c of CASES) expect(c.calc.toString()).not.toMatch(/=>\s*expected\b/);
    // El motor da valores propios: al menos la mitad difiere del publicado (redondeos del informe).
    const distintos = runValidation(CASES).filter((r) => r.diffPercent > 0).length;
    expect(distintos).toBeGreaterThan(CASES.length / 2);
  });

  it('un motor que se desvía hace fallar la suite', () => {
    const roto: ValCase[] = CASES.map((c) => ({ ...c, calc: () => c.calc() * 1.2 }));
    const s = summarize(runValidation(roto));
    expect(s.allPassed).toBe(false);
    expect(complianceText(s)).toContain('fallaron');
  });

  it('cubre NCRP 147, NCRP 151 y TG-108', () => {
    const cats = new Set(CASES.map((c) => c.category));
    expect([...cats].sort()).toEqual(['NCRP147', 'NCRP151', 'TG108']);
  });

  it('summarize, toCSV y complianceText', () => {
    const results = runValidation(CASES);
    const s = summarize(results);
    expect(s.total).toBe(CASES.length);
    expect(s.allPassed).toBe(true);
    expect(toCSV(results).split('\n')).toHaveLength(CASES.length + 1);
    expect(complianceText(s)).toContain('validado');
  });
});
