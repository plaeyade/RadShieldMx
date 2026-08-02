import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const lib = read('src/lib/f510DiagnosticPetTvlPromotion.ts');
const script = read('scripts/f510-diagnostic-pet-tvl-promotion.mjs');
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const userManual = read('MANUAL_USUARIO_v99.md');
const publicManual = read('public/manual_usuario.html');

const checks = [];
const expect = (label, ok) => checks.push({ label, ok });

expect('exports F510 builder', lib.includes('buildF510DiagnosticPetTvlPromotion'));
expect('declares F510 flags', lib.includes('F510_DB_READBACK=1') && lib.includes('F510_SEED_LIVE=1'));
expect('declares PET 511 keV supplemental row', lib.includes('lead-cast-tvl-primary-511kev') && lib.includes('511keV') && lib.includes('11.8'));
expect('declares diagnostic 120 kVp supplemental row', lib.includes('lead-cast-tvl-diagnostic-120kvp') && lib.includes('120kVp') && lib.includes('0.27'));
expect('script reads live DB with flag', script.includes('F510_DB_READBACK') && script.includes('material_value_versions'));
expect('script inserts only supplemental rows', script.includes('INSERT INTO material_value_versions') && script.includes("currentStatus === 'missing'"));
expect('script has transaction rollback', script.includes('beginTransaction') && script.includes('rollback'));
expect('script blocks destructive SQL', !/DELETE FROM|UPDATE\s+|ALTER\s+|DROP\s+|TRUNCATE\s+/i.test(script));
expect('script writes F510 outputs', script.includes('f510_manifest.json') && script.includes('f510_live_insert_report.csv'));
expect('package prepare script exists', pkg.scripts['prepare:f510:diagnostic-pet-tvl'] === 'node scripts/f510-diagnostic-pet-tvl-promotion.mjs');
expect('package test script exists', pkg.scripts['test:f510:diagnostic-pet-tvl'] === 'node scripts/check-f510-diagnostic-pet-tvl-promotion-contracts.mjs');
expect('Update Center documents F510', update.includes('F510 PET/DX TVL exactos'));
expect('Changelog documents F510', changelog.includes('F510'));
expect('Version manual documents F510', versions.includes('F510'));
expect('User manual documents F510', userManual.includes('Addendum F510'));
expect('Public manual documents F510', publicManual.includes('F510'));

const failed = checks.filter((check) => !check.ok);
if (failed.length) {
  console.error(`F510 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F510 diagnostic/PET TVL promotion contracts passed.');
