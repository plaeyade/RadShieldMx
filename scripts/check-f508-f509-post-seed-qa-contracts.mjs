import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const lib = read('src/lib/f508F509PostSeedQa.ts');
const script = read('scripts/f508-f509-post-seed-qa.mjs');
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const userManual = read('MANUAL_USUARIO_v99.md');
const publicManual = read('public/manual_usuario.html');

const checks = [];
const expect = (label, ok) => checks.push({ label, ok });

expect('exports F508/F509 builder', lib.includes('buildF508F509PostSeedQa'));
expect('declares F508 readback flag', lib.includes('F508_DB_READBACK=1'));
expect('declares minimum seeded counts', lib.includes('minimumExpectedCounts'));
expect('script joins source/material/value tables', script.includes('JOIN material_constants') && script.includes('JOIN regulatory_sources'));
expect('script reads seeded values only', script.includes('material_value_versions') && script.includes('approved-reference'));
expect('script has required LINAC DB case', script.includes('f509-db-linac-6mv-primary-concrete-normal'));
expect('script has diagnostic/PET review cases', script.includes('511keV') && script.includes('120kVp'));
expect('script writes CSV and JSONL outputs', script.includes('f508_seeded_value_readback.csv') && script.includes('f509_db_backed_qa_cases.jsonl'));
expect('script does not write live DB', !/INSERT INTO|DELETE FROM|UPDATE\s+|ALTER\s+|DROP\s+/i.test(script));
expect('package prepare script exists', pkg.scripts['prepare:f508-f509:post-seed-qa'] === 'node scripts/f508-f509-post-seed-qa.mjs');
expect('package test script exists', pkg.scripts['test:f508-f509:post-seed-qa'] === 'node scripts/check-f508-f509-post-seed-qa-contracts.mjs');
expect('Update Center documents F508/F509', update.includes('F508-F509 post-seed QA DB'));
expect('Changelog documents F508/F509', changelog.includes('F508-F509'));
expect('Version manual documents F508/F509', versions.includes('F508-F509'));
expect('User manual documents F508/F509', userManual.includes('Addendum F508-F509'));
expect('Public manual documents F508/F509', publicManual.includes('F508-F509'));

const failed = checks.filter((check) => !check.ok);
if (failed.length) {
  console.error(`F508-F509 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F508-F509 post-seed QA contracts passed.');
