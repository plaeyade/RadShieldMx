import { describe, expect, it } from 'vitest';
import { buildF264RealClinicalTrialGate, runRealClinicalTrialCases } from './realClinicalTrialCases';

describe('F264 real clinical trial calculation gate', () => {
  it('runs real-app trial cases across modalities without calculation metadata failures', () => {
    const results = runRealClinicalTrialCases();
    expect(results.length).toBeGreaterThanOrEqual(6);
    expect(new Set(results.map((result) => result.modalityProfile))).toEqual(new Set(['DX', 'TX', 'NM']));

    for (const result of results) {
      expect(result.status).not.toBe('fail');
      expect(result.traceReady).toBe(true);
      expect(result.citationReady).toBe(true);
      expect(result.comparisonReady).toBe(true);
      expect(result.cacheReady).toBe(true);
      expect(result.unitErrorCount).toBe(0);
      expect(result.selectedThickness_mm).toBeGreaterThanOrEqual(0);
      expect(result.selectedBarrier.calculationUnitSnapshot?.mass_kg_per_m2).toBeGreaterThanOrEqual(0);
      expect(result.selectedBarrier.calculationUnitSnapshot?.structuralLoad_kPa).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps high-energy and clinical review warnings visible before signed release', () => {
    const results = runRealClinicalTrialCases();
    const highEnergy = results.find((result) => result.id === 'linac-18mv-secondary-neutron-review');
    expect(highEnergy?.selectedBarrier.calculationWarnings?.some((warning) => warning.field === 'energy_MeV')).toBe(true);
    expect(results.every((result) => result.selectedBarrier.calculationWarnings?.some((warning) => warning.field === 'clinicalReview'))).toBe(true);
  });

  it('builds a release-facing gate ready for controlled real app testing', () => {
    const gate = buildF264RealClinicalTrialGate();
    expect(gate.schema).toBe('radshield-mx.real-clinical-trial.f264.v1');
    expect(gate.status).toBe('ready-for-real-app-testing');
    expect(gate.failCount).toBe(0);
    expect(gate.nextActions.join(' ')).toContain('Compare exported Memoria IA/PDF/Evidence');
  });
});
