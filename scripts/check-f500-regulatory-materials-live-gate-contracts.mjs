import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const lib = read('src/lib/f500RegulatoryMaterialsLiveGate.ts');
const script = read('scripts/f500-regulatory-materials-live-gate.mjs');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const publicManual = read('public/manual_usuario.html');
const pkg = JSON.parse(read('package.json'));

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('exports F500 builder', lib.includes('buildF500RegulatoryMaterialsLiveGate'));
expect('exports F500 formatter', lib.includes('formatF500RegulatoryMaterialsLiveGateMarkdown'));
expect('schema marker', lib.includes('radshield-mx.db.regulatory-materials.live-gate.f500.v1'));
expect('live writes disallowed in contract', lib.includes('liveWriteAllowed: false'));
expect('script reads F499 manifest', script.includes('f499_seed_manifest.json'));
expect('script checks restore probe', script.includes('f153_db_backup_restore'));
expect('script supports optional DB readback', script.includes('F500_DB_READBACK') && script.includes('information_schema.tables'));
expect('script produces output manifest', script.includes('f500_live_gate_manifest.json'));
expect('script does not insert rows', !/\bINSERT\s+INTO\b/i.test(script));
expect('script does not delete rows', !/\bDELETE\s+FROM\b/i.test(script));
expect('package prepare script', pkg.scripts?.['prepare:f500:regulatory-materials-live-gate'] === 'node scripts/f500-regulatory-materials-live-gate.mjs');
expect('package contract script', pkg.scripts?.['test:f500:regulatory-materials-live-gate'] === 'node scripts/check-f500-regulatory-materials-live-gate-contracts.mjs');
expect('Update Center documents F500', update.includes('F500 live gate regulatorio/materiales'));
expect('Changelog documents F500', changelog.includes('F500'));
expect('Version manual documents F500', versions.includes('F500'));
expect('User manual documents F500', manual.includes('Addendum F500'));
expect('Public manual documents F500', publicManual.includes('F500 live gate'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F500 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F500 regulatory/material live gate contracts passed.');
