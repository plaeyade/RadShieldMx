export const CONTROLLED_ZONE_CONTRACTS = {
  feasibilityPacket: 'radshield-controlled-zone-feasibility-v1',
  shieldingPlan: 'radshield-controlled-zone-shielding-plan-v1',
  dbDraft: 'radshield-controlled-zone-db-draft-v1',
  floorPlanMetadata: 'radshield-controlled-zone-floorplan-metadata-v1',
  reportAppendix: 'radshield-controlled-zone-report-appendix-v1',
} as const;

export type ControlledZoneContractName = keyof typeof CONTROLLED_ZONE_CONTRACTS;

export interface ControlledZoneDbTableDraft {
  tableName: string;
  purpose: string;
  requiredColumns: string[];
  jsonColumns: string[];
  indexes: string[];
}

export interface ControlledZoneMigrationDecision {
  strategy: 'incremental_migration';
  rebuildDatabase: false;
  rationale: string[];
  prerequisiteChecks: string[];
  proposedTables: ControlledZoneDbTableDraft[];
  rollbackPlan: string[];
  smokeTest: string[];
}

export function buildControlledZoneMigrationDecision(): ControlledZoneMigrationDecision {
  return {
    strategy: 'incremental_migration',
    rebuildDatabase: false,
    rationale: [
      'The current Drizzle schema already contains users, projects, calculations, reports and dosimetry persistence tables.',
      'F55-F59 introduced additive controlled-zone contracts and does not require destructive changes to existing rows.',
      'MySQL migrations can add controlled-zone tables while preserving project/report history.',
      'Full reconstruction should be reserved for disposable local development databases or corrupt schema state.',
    ],
    prerequisiteChecks: [
      'Confirm DATABASE_URL points to the intended MySQL instance.',
      'Export a SQL dump before running any Drizzle migration.',
      'Verify latest source backup and focused F55-F60 backups exist.',
      'Run TypeScript app/server builds before migration generation.',
      'Run backend contract checks after migration generation.',
    ],
    proposedTables: [
      {
        tableName: 'controlled_zone_plans',
        purpose: 'Stores the versioned shielding-plan header and profile used for layout-driven shielding.',
        requiredColumns: [
          'id',
          'plan_key',
          'project_id',
          'user_id',
          'option_id',
          'option_name',
          'modality',
          'schema_version',
          'generated_at',
          'created_at',
          'updated_at',
        ],
        jsonColumns: ['profile_json', 'assumptions_json', 'summary_json', 'missing_inputs_json'],
        indexes: ['plan_key_unique', 'project_id_idx', 'user_id_idx', 'modality_idx'],
      },
      {
        tableName: 'controlled_zone_calculations',
        purpose: 'Stores each preliminary barrier calculation linked to a controlled-zone plan.',
        requiredColumns: [
          'id',
          'plan_key',
          'seed_id',
          'barrier',
          'adjacent_zone',
          'calculation_family',
          'method',
          'distance_m',
          'occupancy_factor',
          'design_goal_msv_week',
          'unshielded_msv_week',
          'required_thickness_mm',
          'material_code',
          'status',
          'sort_order',
          'created_at',
        ],
        jsonColumns: ['notes_json'],
        indexes: ['plan_key_idx', 'barrier_idx', 'status_idx'],
      },
      {
        tableName: 'analytic_memory_snapshots',
        purpose: 'Stores generated preliminary/final analytic-memory text linked to project and plan.',
        requiredColumns: [
          'id',
          'snapshot_id',
          'project_id',
          'plan_key',
          'user_id',
          'format',
          'status',
          'created_at',
        ],
        jsonColumns: ['content_json', 'evidence_links_json'],
        indexes: ['snapshot_id_unique', 'project_id_idx', 'plan_key_idx'],
      },
      {
        tableName: 'project_report_exports',
        purpose: 'Stores report export metadata and generated document pointers for CNSNS/evidence workflows.',
        requiredColumns: [
          'id',
          'export_id',
          'project_id',
          'plan_key',
          'user_id',
          'report_type',
          'file_name',
          'mime_type',
          'hash_sha256',
          'created_at',
        ],
        jsonColumns: ['metadata_json'],
        indexes: ['export_id_unique', 'project_id_idx', 'plan_key_idx', 'hash_idx'],
      },
    ],
    rollbackPlan: [
      'Stop application writes during migration window.',
      'Keep SQL dump and source backup available.',
      'If migration fails before data writes, drop only newly added controlled-zone tables.',
      'If migration fails after data writes, restore SQL dump and redeploy previous source backup.',
      'Never alter existing projects/calculations/reports tables destructively in the first controlled-zone migration.',
    ],
    smokeTest: [
      'Generate controlled-zone feasibility option.',
      'Create preliminary shielding plan.',
      'Export shielding-plan.json and db-draft.json.',
      'Import shielding-plan.json back into the UI.',
      'Apply the plan to floorPlan/canvas.',
      'Generate CNSNS report and confirm section 3.1 appears.',
      'Persist db-draft through the future backend endpoint and reload linked project.',
    ],
  };
}

export function shouldRebuildControlledZoneDatabase(decision = buildControlledZoneMigrationDecision()): boolean {
  return decision.rebuildDatabase;
}
