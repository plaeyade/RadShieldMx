export interface F508F509PostSeedQa {
  schema: string;
  phases: ['F508', 'F509'];
  dbReadback: {
    requiredFlag: string;
    targetTables: string[];
    minimumExpectedCounts: Record<string, number>;
  };
  qaPolicy: {
    usesLiveTables: string[];
    passCriteria: string[];
    reviewCriteria: string[];
  };
  outputFiles: string[];
  nextPhase: string;
}

export function buildF508F509PostSeedQa(): F508F509PostSeedQa {
  return {
    schema: 'radshield-mx.db.regulatory-materials.post-seed-qa.f508-f509.v1',
    phases: ['F508', 'F509'],
    dbReadback: {
      requiredFlag: 'F508_DB_READBACK=1',
      targetTables: ['regulatory_sources', 'material_constants', 'material_value_versions', 'material_source_links', 'document_chunks'],
      minimumExpectedCounts: {
        regulatory_sources: 12,
        material_constants: 8,
        material_value_versions: 106,
        material_source_links: 24,
      },
    },
    qaPolicy: {
      usesLiveTables: ['material_value_versions', 'material_constants', 'regulatory_sources'],
      passCriteria: [
        'Every seeded calculation value is approved-reference and allowed_use=calculation.',
        'Every seeded calculation value has a regulatory source with page_ref and document_hash.',
        'F509 cases using seeded TVL/density values calculate finite thickness and preserve citations.',
      ],
      reviewCriteria: [
        'Diagnostic/PET/cyclotron cases remain review when the exact energy/material value is not seeded.',
        'Vendor/lab/review-required materials remain excluded from calculation QA.',
        'Clinical release remains blocked until project-specific source terms and professional review are attached.',
      ],
    },
    outputFiles: [
      'f508_f509_manifest.json',
      'f508_f509_summary.md',
      'f508_seeded_value_readback.csv',
      'f509_db_backed_qa_cases.jsonl',
    ],
    nextPhase: 'F511 expand source-specific PET/DX/cyclotron values from canonical PDF extraction when more energies/materials are approved.',
  };
}
