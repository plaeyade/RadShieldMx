export interface F510SupplementalValue {
  id: string;
  materialId: string;
  valueKind: 'tvl-primary' | 'tvl-diagnostic';
  energyKey: string;
  value: number;
  unit: 'mm';
  sourceId: string;
  reviewState: 'approved-reference';
  allowedUse: 'calculation';
  standard: 'AAPM-TG108' | 'NCRP147';
  rationale: string;
}

export interface F510DiagnosticPetTvlPromotion {
  schema: 'radshield-mx.db.regulatory-materials.supplemental-tvl.f510.v1';
  phase: 'F510';
  status: 'supplemental-seed-gate-ready';
  requiredFlags: string[];
  supplementalValues: F510SupplementalValue[];
  dbPolicy: {
    targetTable: 'material_value_versions';
    insertMode: 'insert-missing-only';
    noOverwrite: true;
    requiredSourceState: 'approved-reference';
    requiredMaterialId: 'lead-cast';
  };
  outputFiles: string[];
  postChecks: string[];
  nextPhase: string;
}

export function buildF510DiagnosticPetTvlPromotion(): F510DiagnosticPetTvlPromotion {
  return {
    schema: 'radshield-mx.db.regulatory-materials.supplemental-tvl.f510.v1',
    phase: 'F510',
    status: 'supplemental-seed-gate-ready',
    requiredFlags: [
      'F510_DB_READBACK=1',
      'F510_SEED_LIVE=1',
      'F510_CONFIRM_EXACT_VALUES=1',
      'F510_CONFIRM_RESTORE_PROBE=1',
      'DATABASE_URL',
    ],
    supplementalValues: [
      {
        id: 'lead-cast-tvl-primary-511kev',
        materialId: 'lead-cast',
        valueKind: 'tvl-primary',
        energyKey: '511keV',
        // TG-108/NCRP: 16.6 mm (el 11.8 previo subestimaba; revisión física 2026-11, F10).
        value: 16.6,
        unit: 'mm',
        sourceId: 'src-norm-lead-cast',
        reviewState: 'approved-reference',
        allowedUse: 'calculation',
        standard: 'AAPM-TG108',
        rationale: 'Promotes the existing RadShield lead 511 keV TVL constant into the live versioned material registry for PET/NM QA readback.',
      },
      {
        id: 'lead-cast-tvl-diagnostic-120kvp',
        materialId: 'lead-cast',
        valueKind: 'tvl-diagnostic',
        energyKey: '120kVp',
        value: 0.27,
        unit: 'mm',
        sourceId: 'src-norm-lead-cast',
        reviewState: 'approved-reference',
        allowedUse: 'calculation',
        standard: 'NCRP147',
        rationale: 'Promotes the NCRP147 validation-suite diagnostic lead TVL near 120-125 kVp into the live registry for CT/RX QA readback.',
      },
    ],
    dbPolicy: {
      targetTable: 'material_value_versions',
      insertMode: 'insert-missing-only',
      noOverwrite: true,
      requiredSourceState: 'approved-reference',
      requiredMaterialId: 'lead-cast',
    },
    outputFiles: [
      'f510_manifest.json',
      'f510_summary.md',
      'f510_supplemental_value_candidates.jsonl',
      'f510_live_insert_report.csv',
    ],
    postChecks: [
      'Run npm run prepare:f508-f509:post-seed-qa with F508_DB_READBACK=1.',
      'PET 511 keV and CT/RX diagnostic lead cases must move from review to pass.',
      'material_value_versions count should increase from 106 to 108 unless rows were already present.',
    ],
    nextPhase: 'F511 expand source-specific PET/DX values from canonical PDF extraction when more energies/materials are approved.',
  };
}
