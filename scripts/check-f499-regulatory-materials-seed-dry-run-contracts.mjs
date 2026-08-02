import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const lib = read('src/lib/f499RegulatoryMaterialsSeedDryRun.ts');
const script = read('scripts/f499-regulatory-materials-seed-dry-run.mjs');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const pkg = JSON.parse(read('package.json'));

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('exports F499 builder', lib.includes('buildF499RegulatoryMaterialsSeedDryRun'));
expect('exports F499 formatter', lib.includes('formatF499SeedDryRunMarkdown'));
expect('schema marker', lib.includes('radshield-mx.db.regulatory-materials.seed.f499.v1'));
expect('live write blocked in contract', lib.includes('liveWriteBlocked: true'));
expect('generates regulatory sources', lib.includes('regulatorySources'));
expect('generates material constants', lib.includes('materialConstants'));
expect('generates value versions', lib.includes('materialValueVersions'));
expect('generates source links', lib.includes('materialSourceLinks'));
expect('script blocks F499_SEED_LIVE', script.includes('F499_SEED_LIVE') && script.includes('dry-run only'));
expect('script writes SQL draft', script.includes('f499_seed_dry_run.sql'));
expect('script writes CSV and JSONL', script.includes('writeJsonl') && script.includes('writeCsv'));
expect('package prepare script', pkg.scripts?.['prepare:f499:regulatory-materials-seed'] === 'node scripts/f499-regulatory-materials-seed-dry-run.mjs');
expect('package contract script', pkg.scripts?.['test:f499:regulatory-materials-seed'] === 'node scripts/check-f499-regulatory-materials-seed-dry-run-contracts.mjs');
expect('Update Center documents F499', update.includes('F499 seed dry-run regulatorio/materiales'));
expect('Changelog documents F499', changelog.includes('F499'));
expect('Version manual documents F499', versions.includes('F499'));
expect('User manual documents F499', manual.includes('Addendum F499'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F499 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F499 regulatory/material seed dry-run contracts passed.');
