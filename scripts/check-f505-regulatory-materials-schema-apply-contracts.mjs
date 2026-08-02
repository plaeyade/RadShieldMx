import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const lib = read('src/lib/f505RegulatoryMaterialsSchemaApply.ts');
const script = read('scripts/f505-regulatory-materials-schema-apply.mjs');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const pkg = JSON.parse(read('package.json'));

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('exports F505 builder', lib.includes('buildF505RegulatoryMaterialsSchemaApply'));
expect('schema marker', lib.includes('radshield-mx.db.regulatory-materials.schema-apply.f505.v1'));
expect('script loads schema draft', script.includes('f501_f504_regulatory_materials_schema.sql'));
expect('script requires explicit apply flag', script.includes('F505_APPLY_SCHEMA') && script.includes('F505_CONFIRM_RESTORE_PROBE'));
expect('script blocks destructive keywords', script.includes('DROP|TRUNCATE|DELETE|INSERT|UPDATE|ALTER|REPLACE'));
expect('script readback information_schema', script.includes('information_schema.tables'));
expect('script output manifest', script.includes('f505_schema_apply_manifest.json'));
expect('package prepare script', pkg.scripts?.['prepare:f505:regulatory-materials-schema'] === 'node scripts/f505-regulatory-materials-schema-apply.mjs');
expect('package test script', pkg.scripts?.['test:f505:regulatory-materials-schema'] === 'node scripts/check-f505-regulatory-materials-schema-apply-contracts.mjs');
expect('Update Center documents F505', update.includes('F505 schema DB regulatoria/materiales'));
expect('Changelog documents F505', changelog.includes('F505'));
expect('Version manual documents F505', versions.includes('F505'));
expect('User manual documents F505', manual.includes('Addendum F505'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F505 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F505 regulatory/material schema apply contracts passed.');
