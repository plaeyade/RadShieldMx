import { MATERIALS, MODALITIES, type Barrier, type RadiationSource, type ShieldingMaterial } from '@/types/radshield';
import {
  calculateCTKerma,
  calculateNuclearKerma,
  getCalculationAuditWarnings,
  getShieldingEnergyKey,
  getShieldingFormulaId,
  tvlThickness,
  tvlTransmission,
} from './shieldingMath';
import { getKnownNumericValidationCases } from './numericValidationCases';

export type NumericQaStatus = 'pass' | 'review-required' | 'fail';

export interface NumericQaCheck {
  name: string;
  observed: number | string | boolean;
  expected: string;
  pass: boolean;
  tolerance: string;
}

export interface NumericQaValidationResult {
  id: string;
  standard: string;
  modality: string;
  status: NumericQaStatus;
  checks: NumericQaCheck[];
  warnings: string[];
  citationIds: string[];
}

export interface NumericQaSummary {
  total: number;
  pass: number;
  reviewRequired: number;
  fail: number;
  releaseReady: boolean;
}

function material(code: string): ShieldingMaterial {
  const found = MATERIALS.find((item) => item.code === code);
  if (!found) throw new Error(`Missing QA material ${code}`);
  return found;
}

function source(modalityId: string, overrides: Partial<RadiationSource> = {}): RadiationSource {
  const modality = MODALITIES.find((item) => item.id === modalityId);
  if (!modality) throw new Error(`Missing QA modality ${modalityId}`);
  return {
    id: `qa-${modalityId}`,
    name: `QA ${modality.name}`,
    x: 0,
    y: 0,
    modality,
    workloadValue: 25,
    workloadUnit: modality.unit,
    useFactor: 1,
    isocenterHeight_m: modality.isocenterHeightDefault_m || 1,
    ...overrides,
  };
}

function barrier(overrides: Partial<Barrier> = {}): Barrier {
  return {
    id: 'qa-barrier',
    name: 'QA barrier',
    x1: 0,
    y1: 0,
    x2: 100,
    y2: 0,
    barrierType: 'primary',
    materialCode: 'CONCRETE235',
    thickness_mm: 0,
    occupancyFactor: 1,
    useFactor: 1,
    designGoal_mSv_per_wk: 0.02,
    ...overrides,
  };
}

function statusFor(checks: NumericQaCheck[], warnings: string[] = []): NumericQaStatus {
  if (checks.some((check) => !check.pass)) return 'fail';
  if (warnings.some((warning) => warning.includes('requires RSO') || warning.includes('UAQ'))) return 'review-required';
  return 'pass';
}

function passCheck(
  name: string,
  observed: number | string | boolean,
  expected: string,
  pass: boolean,
  tolerance: string,
): NumericQaCheck {
  return { name, observed, expected, pass, tolerance };
}

function linac6MvPrimaryCase(): NumericQaValidationResult {
  const concrete = material('CONCRETE235');
  const tvl = concrete.TVL_mm?.['6MV'] || 0;
  const oneTvlTransmission = tvlTransmission(tvl, concrete, '6MV');
  const oneTvlThickness = tvlThickness(0.2, 0.02, concrete, '6MV');
  const checks = [
    passCheck('one TVL transmission', oneTvlTransmission, '0.1', Math.abs(oneTvlTransmission - 0.1) <= 1e-6, '<= 1e-6'),
    passCheck('one TVL thickness', oneTvlThickness, `${tvl} mm`, Math.abs(oneTvlThickness - tvl) <= 1, '<= 1 mm'),
  ];
  return {
    id: 'linac-6mv-primary-tvl',
    standard: 'NCRP151',
    modality: 'LINAC_6MV',
    status: statusFor(checks),
    checks,
    warnings: [],
    citationIds: ['NCRP-151'],
  };
}

function linac18MvNeutronCase(): NumericQaValidationResult {
  const src = source('linac-18mv');
  const warnings = getCalculationAuditWarnings({
    barrier: barrier(),
    sources: [src],
    scale_m_per_pixel: 0.01,
    maxKerma_mSv_per_wk: 20,
    materialCount: 2,
    samplePointCount: 5,
    materials: [material('CONCRETE235'), material('PB')],
    energyKey: '18MV',
    minSourceDistance_m: 1,
  }).map((warning) => `${warning.field}: ${warning.message}`);
  const checks = [
    passCheck('neutron warning', warnings.some((warning) => warning.includes('energy_MeV')), 'energy_MeV warning present', warnings.some((warning) => warning.includes('energy_MeV')), 'required for >10 MV'),
  ];
  return {
    id: 'linac-18mv-neutron-warning',
    standard: 'NCRP151',
    modality: 'LINAC_18MV',
    status: statusFor(checks),
    checks,
    warnings,
    citationIds: ['NCRP-151', 'NCRP-151-neutrons'],
  };
}

function ctRxRouteCase(): NumericQaValidationResult {
  const ct = source('ct-body', { workloadValue: 20, ctDLP_mGy_cm: 350, ctScansPerPatient: 1 });
  const rx = source('rad-chest', { workloadValue: 100 });
  const nearKerma = calculateCTKerma(ct, 100, 0, 0.01);
  const farKerma = calculateCTKerma(ct, 200, 0, 0.01);
  const checks = [
    passCheck('CT formula route', getShieldingFormulaId(ct), 'NCRP147_CT_DLP_ISODOSE', getShieldingFormulaId(ct) === 'NCRP147_CT_DLP_ISODOSE', 'exact'),
    passCheck('RX formula route', getShieldingFormulaId(rx), 'NCRP147_ARCHER', getShieldingFormulaId(rx) === 'NCRP147_ARCHER', 'exact'),
    passCheck('CT inverse distance trend', nearKerma > farKerma, 'near > far', nearKerma > farKerma, 'monotonic screen'),
  ];
  return {
    id: 'ct-rx-ncrp147-archer',
    standard: 'NCRP147',
    modality: 'CT_RX',
    status: statusFor(checks),
    checks,
    warnings: [],
    citationIds: ['NCRP-147'],
  };
}

function gammaKnifeCo60Case(): NumericQaValidationResult {
  const src = source('gamma-knife');
  const concrete = material('CONCRETE235');
  const thickness = tvlThickness(2, 0.02, concrete, 'Co60');
  const checks = [
    passCheck('energy key', getShieldingEnergyKey(src), 'Co60', getShieldingEnergyKey(src) === 'Co60', 'exact'),
    passCheck('therapy formula route', getShieldingFormulaId(src), 'NCRP151_TVL', getShieldingFormulaId(src) === 'NCRP151_TVL', 'exact'),
    passCheck('Co60 concrete thickness positive', thickness, '> 0 mm', thickness > 0, 'screening positivity'),
  ];
  return {
    id: 'gamma-knife-co60-energy-key',
    standard: 'NCRP151/AAPMTG56',
    modality: 'GAMMA_KNIFE_CO60',
    status: statusFor(checks),
    checks,
    warnings: ['Gamma Knife/Co-60 requires source-model and site-planning review beyond generic TVL screening.'],
    citationIds: ['NCRP-151', 'AAPM-TG-56'],
  };
}

function petNmPointKernelCase(): NumericQaValidationResult {
  const src = source('pet-f18', { workloadValue: 7.4, nuclearActivity_GBq: 7.4, workloadHoursPerWeek: 40 });
  const nearKerma = calculateNuclearKerma(src, 100, 0, 0.01);
  const farKerma = calculateNuclearKerma(src, 200, 0, 0.01);
  const ratio = nearKerma / farKerma;
  const checks = [
    passCheck('PET formula route', getShieldingFormulaId(src), 'AAPM_TG108_POINT_KERNEL', getShieldingFormulaId(src) === 'AAPM_TG108_POINT_KERNEL', 'exact'),
    passCheck('PET energy key', getShieldingEnergyKey(src), '511keV', getShieldingEnergyKey(src) === '511keV', 'exact'),
    passCheck('point-kernel inverse-square trend', ratio, '~4 when distance doubles', Math.abs(ratio - 4) <= 0.05, '<= 0.05 ratio'),
  ];
  return {
    id: 'pet-nm-point-kernel',
    standard: 'AAPM_TG108',
    modality: 'PET_NM',
    status: statusFor(checks),
    checks,
    warnings: [],
    citationIds: ['AAPM-TG-108'],
  };
}

function uaqLocalReviewGateCase(): NumericQaValidationResult {
  const warnings = getCalculationAuditWarnings({
    barrier: barrier({ designGoal_mSv_per_wk: 0.02 }),
    sources: [source('linac-6mv')],
    scale_m_per_pixel: 0.01,
    maxKerma_mSv_per_wk: 2,
    materialCount: 1,
    samplePointCount: 3,
    materials: [material('CONCRETE235')],
    energyKey: '6MV',
    minSourceDistance_m: 0.25,
  }).map((warning) => `${warning.field}: ${warning.message}`);
  const hasReviewWarning = warnings.some((warning) => warning.includes('clinicalReview'));
  const hasDistanceWarning = warnings.some((warning) => warning.includes('distance_m'));
  const checks = [
    passCheck('RSO/physicist review gate', hasReviewWarning, 'clinicalReview warning present', hasReviewWarning, 'required'),
    passCheck('nearest distance warning', hasDistanceWarning, 'distance_m warning present below 0.3 m', hasDistanceWarning, 'required'),
  ];
  return {
    id: 'uaq-local-review-gate',
    standard: 'UAQ_LOCAL',
    modality: 'UAQ_REVIEW',
    status: checks.every((check) => check.pass) ? 'review-required' : 'fail',
    checks,
    warnings: [...warnings, 'UAQ/CNSNS memory release remains review-required, not auto-certified.'],
    citationIds: ['UAQ-LOCAL-REVIEW', 'CNSNS-REVIEW'],
  };
}

export function runNumericQaValidationCases(): NumericQaValidationResult[] {
  const implementedIds = new Set(getKnownNumericValidationCases().map((item) => item.id));
  const results = [
    linac6MvPrimaryCase(),
    linac18MvNeutronCase(),
    ctRxRouteCase(),
    gammaKnifeCo60Case(),
    petNmPointKernelCase(),
    uaqLocalReviewGateCase(),
  ];
  return results.filter((result) => implementedIds.has(result.id));
}

export function summarizeNumericQaValidation(results: NumericQaValidationResult[]): NumericQaSummary {
  const pass = results.filter((result) => result.status === 'pass').length;
  const reviewRequired = results.filter((result) => result.status === 'review-required').length;
  const fail = results.filter((result) => result.status === 'fail').length;
  return {
    total: results.length,
    pass,
    reviewRequired,
    fail,
    releaseReady: fail === 0 && results.length > 0,
  };
}
