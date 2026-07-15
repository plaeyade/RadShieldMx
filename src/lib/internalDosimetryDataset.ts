import {
  IDAC_DOSE_ARTICLE,
  IDAC_EFFECTIVE_DOSE_COEFFICIENTS,
  IDAC_REFERENCE_PHANTOMS,
  type IdacAgeGroup,
  type IdacEffectiveDoseCoefficient,
  type IdacReferencePhantom,
} from './idacDoseIntegration';

export type InternalDosimetrySchemaVersion = 'radshield-internal-dosimetry-dataset-v1';

export type InternalDosimetryValidationStatus =
  | 'paper-example'
  | 'external-validation-required'
  | 'validated-external-output'
  | 'deprecated';

export interface InternalDosimetryReference {
  id: string;
  title: string;
  doi?: string;
  url: string;
  year: number;
  sourceType: 'peerReviewed' | 'icrp' | 'software' | 'institutional';
  notes: string;
}

export interface InternalDosimetryPhantomRecord {
  id: string;
  label: string;
  ageGroup: IdacAgeGroup;
  sex: IdacReferencePhantom['sex'];
  sourcePublication: IdacReferencePhantom['sourcePublication'];
  interpolationEligible: boolean;
}

export interface InternalDosimetryProcedure {
  id: IdacEffectiveDoseCoefficient['procedureId'];
  displayName: string;
  radionuclideSymbol: string;
  route: IdacEffectiveDoseCoefficient['route'];
  unit: IdacEffectiveDoseCoefficient['unit'];
  coefficientSource: 'IDAC-Dose 2.2 paper example';
  validationStatus: InternalDosimetryValidationStatus;
  criticalOrgans: string[];
  notes: string;
}

export interface InternalDosimetryCoefficientRecord {
  id: string;
  procedureId: IdacEffectiveDoseCoefficient['procedureId'];
  phantomAgeGroup: IdacAgeGroup;
  coefficient_mSv_per_MBq: number;
  unit: 'mSv/MBq';
  sexAveragedEffectiveDose: boolean;
  sourceReferenceId: string;
  validationStatus: InternalDosimetryValidationStatus;
}

export interface InternalDosimetryDbRoadmap {
  tableName: string;
  primaryKey: string;
  purpose: string;
  suggestedColumns: string[];
}

export interface InternalDosimetryDataset {
  schemaVersion: InternalDosimetrySchemaVersion;
  generatedAt: string;
  datasetId: string;
  references: InternalDosimetryReference[];
  phantoms: InternalDosimetryPhantomRecord[];
  procedures: InternalDosimetryProcedure[];
  effectiveDoseCoefficients: InternalDosimetryCoefficientRecord[];
  dbRoadmap: InternalDosimetryDbRoadmap[];
  limitations: string[];
}

const IDAC_REFERENCE_ID = 'ref-idac-dose-2-2-2025';

function normalizeAgeGroupForCoefficient(ageGroup: string): IdacAgeGroup | null {
  const allowed: IdacAgeGroup[] = ['adult', '15y', '10y', '5y', '1y', '100d', '0d', 'interpolated'];
  return allowed.includes(ageGroup as IdacAgeGroup) ? (ageGroup as IdacAgeGroup) : null;
}

export function buildInternalDosimetryDataset(now = new Date()): InternalDosimetryDataset {
  const references: InternalDosimetryReference[] = [
    {
      id: IDAC_REFERENCE_ID,
      title: IDAC_DOSE_ARTICLE.title,
      doi: IDAC_DOSE_ARTICLE.doi,
      url: IDAC_DOSE_ARTICLE.url,
      year: IDAC_DOSE_ARTICLE.year,
      sourceType: 'peerReviewed',
      notes: 'Open-access article used only for explicit paper-example coefficients and schema alignment.',
    },
    {
      id: 'ref-idac-dose-software',
      title: 'IDAC-Dose software',
      url: IDAC_DOSE_ARTICLE.softwareUrl,
      year: IDAC_DOSE_ARTICLE.year,
      sourceType: 'software',
      notes: 'External software should remain the authoritative computation source until full coefficients and validation files are imported.',
    },
  ];

  const phantoms: InternalDosimetryPhantomRecord[] = IDAC_REFERENCE_PHANTOMS.map((phantom) => ({
    id: phantom.id,
    label: phantom.label,
    ageGroup: phantom.ageGroup,
    sex: phantom.sex,
    sourcePublication: phantom.sourcePublication,
    interpolationEligible: phantom.interpolationEligible,
  }));

  const procedures: InternalDosimetryProcedure[] = IDAC_EFFECTIVE_DOSE_COEFFICIENTS.map((coefficient) => ({
    id: coefficient.procedureId,
    displayName: coefficient.displayName,
    radionuclideSymbol: coefficient.radionuclideSymbol,
    route: coefficient.route,
    unit: coefficient.unit,
    coefficientSource: 'IDAC-Dose 2.2 paper example',
    validationStatus: 'paper-example',
    criticalOrgans: coefficient.highestDoseOrgans,
    notes: coefficient.note,
  }));

  const effectiveDoseCoefficients: InternalDosimetryCoefficientRecord[] = IDAC_EFFECTIVE_DOSE_COEFFICIENTS.flatMap((coefficient) =>
    Object.entries(coefficient.coefficients_mSv_per_MBq).flatMap(([ageGroup, value]) => {
      const normalizedAgeGroup = normalizeAgeGroupForCoefficient(ageGroup);
      if (normalizedAgeGroup === null || typeof value !== 'number') return [];
      return [{
        id: `${coefficient.procedureId}-${normalizedAgeGroup}`,
        procedureId: coefficient.procedureId,
        phantomAgeGroup: normalizedAgeGroup,
        coefficient_mSv_per_MBq: value,
        unit: coefficient.unit,
        sexAveragedEffectiveDose: true,
        sourceReferenceId: IDAC_REFERENCE_ID,
        validationStatus: 'paper-example' as const,
      }];
    }),
  );

  return {
    schemaVersion: 'radshield-internal-dosimetry-dataset-v1',
    generatedAt: now.toISOString(),
    datasetId: `internal-dosimetry-${now.toISOString().slice(0, 10)}`,
    references,
    phantoms,
    procedures,
    effectiveDoseCoefficients,
    dbRoadmap: [
      {
        tableName: 'dosimetry_references',
        primaryKey: 'id',
        purpose: 'Bibliografia, DOI, software externo y trazabilidad documental.',
        suggestedColumns: ['id', 'title', 'doi', 'url', 'year', 'source_type', 'notes', 'created_at'],
      },
      {
        tableName: 'dosimetry_phantoms',
        primaryKey: 'id',
        purpose: 'Fantomas ICRP adultos/pediatricos e interpolacion por edad/peso.',
        suggestedColumns: ['id', 'label', 'age_group', 'sex', 'source_publication', 'interpolation_eligible'],
      },
      {
        tableName: 'dosimetry_procedures',
        primaryKey: 'id',
        purpose: 'Radiofarmacos, ruta de administracion, radionuclido y organos criticos.',
        suggestedColumns: ['id', 'display_name', 'radionuclide_symbol', 'route', 'unit', 'validation_status', 'notes'],
      },
      {
        tableName: 'dosimetry_effective_coefficients',
        primaryKey: 'id',
        purpose: 'Coeficientes de dosis efectiva versionados por procedimiento y grupo de edad.',
        suggestedColumns: ['id', 'procedure_id', 'phantom_age_group', 'coefficient_msv_per_mbq', 'reference_id', 'validation_status'],
      },
      {
        tableName: 'dosimetry_workspaces',
        primaryKey: 'id',
        purpose: 'Puente entre proyecto, dataset dosimetrico local, evidence pack y plan de migracion.',
        suggestedColumns: ['id', 'workspace_id', 'user_id', 'project_id', 'dataset_version', 'dataset_json', 'evidence_pack_json', 'updated_at'],
      },
      {
        tableName: 'dosimetry_validation_attachments',
        primaryKey: 'id',
        purpose: 'Archivos IDAC/DCAL/OLINDA adjuntos por proyecto o memoria analitica.',
        suggestedColumns: ['id', 'workspace_id', 'project_id', 'procedure_id', 'file_name', 'hash_sha256', 'uploaded_at', 'review_status'],
      },
    ],
    limitations: [
      'Dataset v1 contains only paper-example effective-dose coefficients explicitly reported in the IDAC-Dose 2.2 article.',
      'No S-values, SAF tables, TIAC source-region curves, organ-dose coefficient matrices, or dynamic bladder model parameters are imported yet.',
      'Regulatory or clinical patient dosimetry must attach external IDAC-Dose 2.2, DCAL, OLINDA, or institutional outputs before sign-off.',
    ],
  };
}

export function summarizeInternalDosimetryDataset(dataset: InternalDosimetryDataset) {
  const procedureCount = dataset.procedures.length;
  const coefficientCount = dataset.effectiveDoseCoefficients.length;
  const phantomCount = dataset.phantoms.length;
  const externalValidationCount = dataset.effectiveDoseCoefficients.filter(
    (coefficient) => coefficient.validationStatus === 'validated-external-output',
  ).length;
  return {
    procedureCount,
    coefficientCount,
    phantomCount,
    externalValidationCount,
    readyForDb: dataset.dbRoadmap.length >= 4 && coefficientCount > 0 && phantomCount > 0,
  };
}
