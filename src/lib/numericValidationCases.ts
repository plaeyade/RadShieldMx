export interface KnownNumericValidationCase {
  id: string;
  modality: 'LINAC_6MV' | 'LINAC_18MV' | 'CT_RX' | 'GAMMA_KNIFE_CO60' | 'PET_NM' | 'UAQ_REVIEW';
  standard: 'NCRP147' | 'NCRP151' | 'AAPM_TG108' | 'IAEA_SRS47' | 'UAQ_LOCAL';
  scenario: string;
  expectedCheck: string;
  tolerance: string;
  status: 'implemented-reference' | 'requires-physicist-review';
}

export const KNOWN_NUMERIC_VALIDATION_CASES: KnownNumericValidationCase[] = [
  {
    id: 'linac-6mv-primary-tvl',
    modality: 'LINAC_6MV',
    standard: 'NCRP151',
    scenario: 'Primary barrier, concrete 2.35 g/cm3, one TVL should reduce transmission by factor 10.',
    expectedCheck: 'tvlTransmission(TVL_6MV) ~= 0.1 and tvlThickness(K/P=10) ~= one TVL.',
    tolerance: '<= 1e-6 transmission, <= 1 mm thickness for reference materials.',
    status: 'implemented-reference',
  },
  {
    id: 'linac-18mv-neutron-warning',
    modality: 'LINAC_18MV',
    standard: 'NCRP151',
    scenario: 'High-energy photon calculation must flag neutron/maze/door evaluation.',
    expectedCheck: 'calculationWarnings includes energy_MeV warning.',
    tolerance: 'warning must be present for energy >10 MV.',
    status: 'implemented-reference',
  },
  {
    id: 'ct-rx-ncrp147-archer',
    modality: 'CT_RX',
    standard: 'NCRP147',
    scenario: 'Diagnostic shielding uses Archer or CT DLP/isodose method depending on modality.',
    expectedCheck: 'formulaId NCRP147_ARCHER or NCRP147_CT_DLP_ISODOSE.',
    tolerance: 'formula route must match modality id/category.',
    status: 'implemented-reference',
  },
  {
    id: 'gamma-knife-co60-energy-key',
    modality: 'GAMMA_KNIFE_CO60',
    standard: 'NCRP151',
    scenario: 'Gamma Knife/Co-60 uses Co60 energy key and Co-60 citations.',
    expectedCheck: 'energyKey Co60 and formula route therapy TVL.',
    tolerance: 'exact energy key match.',
    status: 'implemented-reference',
  },
  {
    id: 'pet-nm-point-kernel',
    modality: 'PET_NM',
    standard: 'AAPM_TG108',
    scenario: 'PET/NM point source calculations route to TG-108 point-kernel screening.',
    expectedCheck: 'formulaId AAPM_TG108_POINT_KERNEL and energyKey 511keV for PET.',
    tolerance: 'exact route match.',
    status: 'implemented-reference',
  },
  {
    id: 'uaq-local-review-gate',
    modality: 'UAQ_REVIEW',
    standard: 'UAQ_LOCAL',
    scenario: 'Local analytic-memory release must remain gated by qualified RSO/medical physicist review.',
    expectedCheck: 'clinicalReview warning must be emitted before using a result for CNSNS/UAQ submissions.',
    tolerance: 'review warning must be present in every release-facing calculation trace.',
    status: 'requires-physicist-review',
  },
];

export function getKnownNumericValidationCases(): KnownNumericValidationCase[] {
  return KNOWN_NUMERIC_VALIDATION_CASES;
}
