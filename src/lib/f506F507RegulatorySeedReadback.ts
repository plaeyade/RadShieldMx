export interface F506F507RegulatorySeedReadback {
  schema: string;
  phases: ['F506', 'F507'];
  sourceReadback: {
    requiredFlag: string;
    targetTable: 'document_chunks';
    outputFiles: string[];
    resolutionPolicy: string[];
  };
  controlledSeed: {
    requiredFlags: string[];
    targetTables: string[];
    writePolicy: string[];
    rollbackPolicy: string;
  };
  nextPhase: string;
}

export function buildF506F507RegulatorySeedReadback(): F506F507RegulatorySeedReadback {
  return {
    schema: 'radshield-mx.db.regulatory-materials.f506-f507.v1',
    phases: ['F506', 'F507'],
    sourceReadback: {
      requiredFlag: 'F506_DB_READBACK=1',
      targetTable: 'document_chunks',
      outputFiles: [
        'f506_regulatory_source_readback_manifest.json',
        'f506_resolved_regulatory_sources.jsonl',
        'f506_unresolved_review_queue.csv',
      ],
      resolutionPolicy: [
        'Only resolve a source when document_chunks has a clear source/tags/content match.',
        'Use page_ref and content hash from the best matching chunk as evidence.',
        'Keep vendor/lab/material rows in review unless they are already approved-reference and matched.',
        'Never promote review-required values to calculation constants in F506.',
      ],
    },
    controlledSeed: {
      requiredFlags: [
        'F507_SEED_LIVE=1',
        'F507_CONFIRM_APPROVED_ONLY=1',
        'F507_CONFIRM_RESTORE_PROBE=1',
        'DATABASE_URL',
      ],
      targetTables: ['regulatory_sources', 'material_constants', 'material_value_versions', 'material_source_links'],
      writePolicy: [
        'Insert only approved-reference calculation/evidence rows whose source was resolved by F506.',
        'Run inside a transaction and rollback on any duplicate or failed insert.',
        'Do not DELETE, UPDATE, ALTER or truncate existing live rows.',
        'Repeat F500/F484-F490 after live seed readback.',
      ],
      rollbackPolicy: 'If any INSERT fails or target tables are not empty, rollback and leave DB unchanged.',
    },
    nextPhase: 'F508 post-seed F500/F484-F490 readback and calculation QA against DB values.',
  };
}
