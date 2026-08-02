export interface F505RegulatoryMaterialsSchemaApply {
  schema: 'radshield-mx.db.regulatory-materials.schema-apply.f505.v1';
  phase: 'F505';
  status: 'dry-run-ready' | 'live-apply-gated';
  schemaDraft: 'db/f501_f504_regulatory_materials_schema.sql';
  requiredFlags: string[];
  requiredTables: string[];
  safety: string[];
  nextPhase: string;
}

export function buildF505RegulatoryMaterialsSchemaApply(): F505RegulatoryMaterialsSchemaApply {
  return {
    schema: 'radshield-mx.db.regulatory-materials.schema-apply.f505.v1',
    phase: 'F505',
    status: 'live-apply-gated',
    schemaDraft: 'db/f501_f504_regulatory_materials_schema.sql',
    requiredFlags: ['F505_APPLY_SCHEMA=1', 'F505_CONFIRM_RESTORE_PROBE=1', 'DATABASE_URL'],
    requiredTables: ['regulatory_sources', 'material_constants', 'material_value_versions', 'material_source_links', 'document_chunks'],
    safety: [
      'Only CREATE TABLE IF NOT EXISTS statements are allowed.',
      'No INSERT, DELETE, UPDATE, DROP, TRUNCATE or ALTER statements are allowed.',
      'F153 restore probe must be ready before live apply.',
      'F500 readback must be repeated after live apply.',
    ],
    nextPhase: 'F506 repeat F500 readback and F507 controlled seed candidate.',
  };
}
