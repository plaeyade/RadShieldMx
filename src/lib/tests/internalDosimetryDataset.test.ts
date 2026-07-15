import { describe, expect, it } from 'vitest';
import {
  buildInternalDosimetryDataset,
  summarizeInternalDosimetryDataset,
} from '../internalDosimetryDataset';

describe('Internal dosimetry dataset', () => {
  it('builds a DB-ready dataset from IDAC-Dose 2.2 paper examples', () => {
    const dataset = buildInternalDosimetryDataset(new Date('2026-07-11T12:00:00.000Z'));
    expect(dataset.schemaVersion).toBe('radshield-internal-dosimetry-dataset-v1');
    expect(dataset.references.map((reference) => reference.doi)).toContain('10.1186/s40658-025-00774-z');
    expect(dataset.procedures).toHaveLength(3);
    expect(dataset.phantoms).toHaveLength(15);
    expect(dataset.effectiveDoseCoefficients).toHaveLength(23);
    expect(dataset.dbRoadmap.map((table) => table.tableName)).toContain('dosimetry_effective_coefficients');
  });

  it('summarizes readiness without marking examples as externally validated', () => {
    const dataset = buildInternalDosimetryDataset(new Date('2026-07-11T12:00:00.000Z'));
    const summary = summarizeInternalDosimetryDataset(dataset);
    expect(summary.readyForDb).toBe(true);
    expect(summary.externalValidationCount).toBe(0);
    expect(dataset.effectiveDoseCoefficients.every((row) => row.validationStatus === 'paper-example')).toBe(true);
  });
});
