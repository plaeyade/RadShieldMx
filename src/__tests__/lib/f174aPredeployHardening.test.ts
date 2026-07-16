import { describe, expect, it } from 'vitest';
import { clampTransmission, getCalculationInputWarnings, isFinitePositive } from '@/lib/shieldingMath';
import {
  buildF174APredeployHardening,
  classifyF174RagSource,
  getF174RagCitationWarning,
} from '@/lib/f174aPredeployHardening';

describe('F174A predeploy hardening', () => {
  it('keeps transmission values physically bounded', () => {
    expect(clampTransmission(-0.2)).toBe(0);
    expect(clampTransmission(0.42)).toBe(0.42);
    expect(clampTransmission(1.8)).toBe(1);
    expect(clampTransmission(Number.NaN)).toBe(0);
  });

  it('flags invalid release calculation inputs', () => {
    expect(isFinitePositive(3)).toBe(true);
    expect(isFinitePositive(0)).toBe(false);

    const warnings = getCalculationInputWarnings({
      distance_m: -1,
      designGoal_mSv: 0,
      workloadValue: Number.POSITIVE_INFINITY,
      transmission: 1.4,
    });

    expect(warnings.map((warning) => warning.field)).toEqual([
      'distance_m',
      'workloadValue',
      'designGoal_mSv',
      'transmission',
    ]);
  });

  it('classifies RAG sources with release-safe warnings', () => {
    expect(classifyF174RagSource('f170b-ncrp147')).toBe('canonical');
    expect(classifyF174RagSource('f138-tm-nipoll', ['density', 'tvl'])).toBe('material-evidence');
    expect(classifyF174RagSource('f143-zumaya-memory')).toBe('analytic-memory');
    expect(classifyF174RagSource('f172a-arxiv-2407')).toBe('research');

    expect(getF174RagCitationWarning('canonical')).toContain('formulas');
    expect(getF174RagCitationWarning('research')).toContain('validated');
  });

  it('declares calculation, frontend and RAG guardrails', () => {
    const guardrails = buildF174APredeployHardening();
    expect(guardrails.some((guardrail) => guardrail.area === 'calculation')).toBe(true);
    expect(guardrails.some((guardrail) => guardrail.area === 'frontend')).toBe(true);
    expect(guardrails.some((guardrail) => guardrail.area === 'rag')).toBe(true);
    expect(guardrails.every((guardrail) => guardrail.status === 'ready')).toBe(true);
  });
});
