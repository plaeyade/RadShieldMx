import { describe, expect, it } from 'vitest';
import { RADIONUCLIDES, estimateMIRDDose } from '../nuclearMedicine';
import {
  buildIdacDoseReadinessPack,
  estimateIdacEffectiveDose,
  findIdacPhantom,
  getIdacCoefficientForNuclide,
  IDAC_DOSE_ARTICLE,
  IDAC_EFFECTIVE_DOSE_COEFFICIENTS,
  IDAC_REFERENCE_PHANTOMS,
  suggestIdacPhantomId,
} from '../idacDoseIntegration';

describe('IDAC-Dose 2.2 integration metadata', () => {
  it('captures article identity and the 12 sex-specific reference phantoms plus adult reference person', () => {
    expect(IDAC_DOSE_ARTICLE.doi).toBe('10.1186/s40658-025-00774-z');
    expect(IDAC_REFERENCE_PHANTOMS.length).toBe(15);
    expect(IDAC_REFERENCE_PHANTOMS.map((phantom) => phantom.id)).toContain('0d-female');
    expect(IDAC_REFERENCE_PHANTOMS.map((phantom) => phantom.id)).toContain('adult-reference-person');
  });

  it('stores the three example effective-dose coefficient families from the paper', () => {
    expect(IDAC_EFFECTIVE_DOSE_COEFFICIENTS).toHaveLength(3);
    const fdg = getIdacCoefficientForNuclide('F-18');
    expect(fdg?.coefficients_mSv_per_MBq.adult).toBeCloseTo(0.017);
    expect(fdg?.coefficients_mSv_per_MBq['5y']).toBeCloseTo(0.044);
  });

  it('estimates paper-example effective dose for selected activity and phantom', () => {
    const phantom = findIdacPhantom('10y-male');
    const coefficient = getIdacCoefficientForNuclide('F-18');
    const estimate = estimateIdacEffectiveDose(coefficient, phantom, 100);
    expect(estimate.coefficient_mSv_per_MBq).toBeCloseTo(0.029);
    expect(estimate.estimatedEffectiveDose_mSv).toBeCloseTo(2.9);
  });

  it('suggests pediatric anchors conservatively from age and sex', () => {
    expect(suggestIdacPhantomId(0.1, 'female')).toBe('0d-female');
    expect(suggestIdacPhantomId(6, 'male')).toBe('5y-male');
    expect(suggestIdacPhantomId(17, 'female')).toBe('15y-female');
    expect(suggestIdacPhantomId(45, 'reference-person')).toBe('adult-reference-person');
  });

  it('builds a readiness pack without claiming validated local S-values', () => {
    const f18 = RADIONUCLIDES.find((nuclide) => nuclide.symbol === 'F-18');
    expect(f18).toBeDefined();
    const pack = buildIdacDoseReadinessPack({
      nuclide: f18!,
      activityMBq: 370,
      phantomId: 'adult-reference-person',
      mirdDose: estimateMIRDDose('F-18', 370, 'PET'),
    });
    expect(pack.schemaVersion).toBe('radshield-idac-dose-readiness-v1');
    expect(pack.source.doi).toBe('10.1186/s40658-025-00774-z');
    expect(pack.paperCoefficient?.coefficient_mSv_per_MBq).toBeCloseTo(0.017);
    expect(pack.integrationStatus.validation).toBe('external-validation-required');
  });
});
