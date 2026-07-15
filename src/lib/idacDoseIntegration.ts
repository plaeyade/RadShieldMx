import type { MIRDDose, Radionuclide } from './nuclearMedicine';

export const IDAC_DOSE_ARTICLE = {
  title:
    'IDAC-Dose 2.2, an internal dosimetry software for diagnostic nuclear medicine based on the latest ICRP adult and paediatric reference computational phantoms',
  doi: '10.1186/s40658-025-00774-z',
  url: 'https://doi.org/10.1186/s40658-025-00774-z',
  softwareUrl: 'http://www.idac-dose.org',
  journal: 'EJNMMI Physics',
  year: 2025,
  authors: ['Martin Andersson', 'Keith Eckerman', 'Soren Mattsson'],
} as const;

export const IDAC_DOSE_EXTERNAL_NOTE =
  'IDAC-Dose 2.2 queda como referencia externa para dosimetria interna diagnostica basada en ICRP 133/155, ICRP 107 y fantomas adultos/pediatricos; RadShield exporta paquetes de comparacion sin sustituir coeficientes validados.';

export type IdacSex = 'male' | 'female' | 'reference-person';

export type IdacAgeGroup =
  | 'adult'
  | '15y'
  | '10y'
  | '5y'
  | '1y'
  | '100d'
  | '0d'
  | 'interpolated';

export interface IdacReferencePhantom {
  id: string;
  label: string;
  ageGroup: IdacAgeGroup;
  sex: IdacSex;
  sourcePublication: 'ICRP 133' | 'ICRP 155' | 'ICRP 133/155 interpolation';
  interpolationEligible: boolean;
  paperRole: string;
}

export const IDAC_REFERENCE_PHANTOMS: IdacReferencePhantom[] = [
  {
    id: 'adult-reference-person',
    label: 'Adult reference person (sex-averaged effective dose)',
    ageGroup: 'adult',
    sex: 'reference-person',
    sourcePublication: 'ICRP 133',
    interpolationEligible: true,
    paperRole: 'Adult effective-dose reference built from male/female equivalent-dose averaging.',
  },
  {
    id: 'adult-male',
    label: 'Adult male reference phantom',
    ageGroup: 'adult',
    sex: 'male',
    sourcePublication: 'ICRP 133',
    interpolationEligible: true,
    paperRole: 'Adult male absorbed-dose phantom.',
  },
  {
    id: 'adult-female',
    label: 'Adult female reference phantom',
    ageGroup: 'adult',
    sex: 'female',
    sourcePublication: 'ICRP 133',
    interpolationEligible: true,
    paperRole: 'Adult female absorbed-dose phantom.',
  },
  ...(['15y', '10y', '5y', '1y', '100d', '0d'] as const).flatMap((ageGroup) => [
    {
      id: `${ageGroup}-male`,
      label: `${ageGroup} male reference phantom`,
      ageGroup,
      sex: 'male' as const,
      sourcePublication: 'ICRP 155' as const,
      interpolationEligible: true,
      paperRole: 'Paediatric absorbed-dose phantom.',
    },
    {
      id: `${ageGroup}-female`,
      label: `${ageGroup} female reference phantom`,
      ageGroup,
      sex: 'female' as const,
      sourcePublication: 'ICRP 155' as const,
      interpolationEligible: true,
      paperRole: 'Paediatric absorbed-dose phantom.',
    },
  ]),
];

export interface IdacEffectiveDoseCoefficient {
  procedureId: 'f18-fdg-iv' | 'tc99m-pertechnetate-oral' | 'i131-iodide-oral-medium-thyroid';
  displayName: string;
  radionuclideSymbol: string;
  route: 'intravenous' | 'oral';
  unit: 'mSv/MBq';
  coefficients_mSv_per_MBq: Partial<Record<IdacAgeGroup, number>>;
  highestDoseOrgans: string[];
  note: string;
}

export const IDAC_EFFECTIVE_DOSE_COEFFICIENTS: IdacEffectiveDoseCoefficient[] = [
  {
    procedureId: 'f18-fdg-iv',
    displayName: '2-[18F]FDG, intravenous',
    radionuclideSymbol: 'F-18',
    route: 'intravenous',
    unit: 'mSv/MBq',
    coefficients_mSv_per_MBq: {
      adult: 0.017,
      '15y': 0.020,
      '10y': 0.029,
      '5y': 0.044,
      '1y': 0.075,
      '100d': 0.16,
      '0d': 0.16,
      interpolated: 0.034,
    },
    highestDoseOrgans: ['Urinary bladder wall', 'Heart wall'],
    note: 'Paper example includes an interpolated 8-year reference person.',
  },
  {
    procedureId: 'tc99m-pertechnetate-oral',
    displayName: '99mTc-pertechnetate, oral',
    radionuclideSymbol: 'Tc-99m',
    route: 'oral',
    unit: 'mSv/MBq',
    coefficients_mSv_per_MBq: {
      adult: 0.013,
      '15y': 0.017,
      '10y': 0.024,
      '5y': 0.040,
      '1y': 0.082,
      '100d': 0.16,
      '0d': 0.16,
    },
    highestDoseOrgans: ['Thyroid'],
    note: 'Paper example reports thyroid as the highest absorbed-dose organ across phantoms.',
  },
  {
    procedureId: 'i131-iodide-oral-medium-thyroid',
    displayName: '131I-iodide, oral, medium thyroid uptake',
    radionuclideSymbol: 'I-131',
    route: 'oral',
    unit: 'mSv/MBq',
    coefficients_mSv_per_MBq: {
      adult: 16,
      '15y': 24,
      '10y': 35,
      '5y': 74,
      '1y': 120,
      '100d': 140,
      '0d': 140,
      interpolated: 100,
    },
    highestDoseOrgans: ['Thyroid'],
    note: 'Paper example includes an interpolated 45 kg female, representative of an 8-year individual.',
  },
];

export interface BuildIdacDoseReadinessPackInput {
  nuclide: Radionuclide;
  activityMBq: number;
  phantomId: string;
  mirdDose: MIRDDose[];
  patientAgeYears?: number;
  patientWeightKg?: number;
}

export function findIdacPhantom(phantomId: string): IdacReferencePhantom {
  return IDAC_REFERENCE_PHANTOMS.find((phantom) => phantom.id === phantomId) ?? IDAC_REFERENCE_PHANTOMS[0];
}

export function getIdacCoefficientForNuclide(symbol: string): IdacEffectiveDoseCoefficient | undefined {
  return IDAC_EFFECTIVE_DOSE_COEFFICIENTS.find((coefficient) => coefficient.radionuclideSymbol === symbol);
}

export function estimateIdacEffectiveDose(
  coefficient: IdacEffectiveDoseCoefficient | undefined,
  phantom: IdacReferencePhantom,
  activityMBq: number,
): { coefficient_mSv_per_MBq: number | null; estimatedEffectiveDose_mSv: number | null; sourceAgeGroup: IdacAgeGroup | null } {
  if (!coefficient) {
    return { coefficient_mSv_per_MBq: null, estimatedEffectiveDose_mSv: null, sourceAgeGroup: null };
  }
  const ageGroup = phantom.ageGroup === 'interpolated' ? 'interpolated' : phantom.ageGroup;
  const coefficientValue = coefficient.coefficients_mSv_per_MBq[ageGroup] ?? coefficient.coefficients_mSv_per_MBq.adult;
  if (coefficientValue === undefined) {
    return { coefficient_mSv_per_MBq: null, estimatedEffectiveDose_mSv: null, sourceAgeGroup: null };
  }
  return {
    coefficient_mSv_per_MBq: coefficientValue,
    estimatedEffectiveDose_mSv: coefficientValue * activityMBq,
    sourceAgeGroup: ageGroup,
  };
}

export function suggestIdacPhantomId(ageYears: number | undefined, sex: IdacSex = 'reference-person'): string {
  if (ageYears === undefined || Number.isNaN(ageYears) || ageYears >= 20) {
    return sex === 'female' ? 'adult-female' : sex === 'male' ? 'adult-male' : 'adult-reference-person';
  }
  const targetSex = sex === 'female' ? 'female' : 'male';
  if (ageYears < 0.25) return `0d-${targetSex}`;
  if (ageYears < 0.75) return `100d-${targetSex}`;
  if (ageYears < 3) return `1y-${targetSex}`;
  if (ageYears < 7.5) return `5y-${targetSex}`;
  if (ageYears < 12.5) return `10y-${targetSex}`;
  return `15y-${targetSex}`;
}

export function buildIdacDoseReadinessPack(input: BuildIdacDoseReadinessPackInput) {
  const phantom = findIdacPhantom(input.phantomId);
  const coefficient = getIdacCoefficientForNuclide(input.nuclide.symbol);
  const idacEstimate = estimateIdacEffectiveDose(coefficient, phantom, input.activityMBq);
  const localEffectiveDose = input.mirdDose.find((dose) => dose.organ.toLowerCase().includes('effective'));
  return {
    schemaVersion: 'radshield-idac-dose-readiness-v1',
    generatedAt: new Date().toISOString(),
    source: IDAC_DOSE_ARTICLE,
    limitation:
      'This pack is a traceability and comparison artifact. It is not a replacement for IDAC-Dose 2.2, DCAL, OLINDA, or institutional patient-specific dosimetry review.',
    selectedProcedure: {
      radionuclide: input.nuclide.symbol,
      name: input.nuclide.name,
      activityMBq: input.activityMBq,
      patientAgeYears: input.patientAgeYears ?? null,
      patientWeightKg: input.patientWeightKg ?? null,
    },
    selectedPhantom: phantom,
    paperCoefficient: coefficient
      ? {
          procedureId: coefficient.procedureId,
          displayName: coefficient.displayName,
          unit: coefficient.unit,
          sourceAgeGroup: idacEstimate.sourceAgeGroup,
          coefficient_mSv_per_MBq: idacEstimate.coefficient_mSv_per_MBq,
          estimatedEffectiveDose_mSv: idacEstimate.estimatedEffectiveDose_mSv,
          highestDoseOrgans: coefficient.highestDoseOrgans,
          note: coefficient.note,
        }
      : null,
    radshieldCurrentMirdEstimate: {
      method: 'Simplified local MIRD-style estimate currently used for screening.',
      effectiveDose_mSv: localEffectiveDose?.effectiveDose_mSv ?? null,
      organDoses: input.mirdDose,
    },
    readinessChecklist: [
      'Map selected radiopharmaceutical to route-specific IDAC procedure.',
      'Select ICRP 133/155 phantom or age/weight interpolation target.',
      'Import or externally compute validated source-region TIACs and S-values before regulatory use.',
      'Attach IDAC-Dose 2.2 or DCAL output to Evidence Pack for clinical/regulatory review.',
      'Keep shielding calculations separated from patient internal dosimetry decisions.',
    ],
    integrationStatus: {
      coefficients: coefficient ? 'paper-example-effective-dose-only' : 'not-available-for-selected-nuclide',
      sourceRegions: 'not-imported',
      targetRegions: 'not-imported',
      validation: 'external-validation-required',
    },
  };
}
