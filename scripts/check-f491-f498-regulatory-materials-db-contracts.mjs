import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const lib = read('src/lib/f491F498RegulatoryMaterialsDb.ts');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const pkg = JSON.parse(read('package.json'));

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('exports builder', lib.includes('buildF491F498RegulatoryMaterialsDb'));
expect('exports markdown formatter', lib.includes('formatF491F498RegulatoryMaterialsDbMarkdown'));
expect('declares dry-run seed mode', lib.includes("seedMode: 'dry-run-first'"));
expect('declares live DATABASE_URL requirement', lib.includes('DATABASE_URL'));
expect('declares restore probe requirement', lib.includes('restore probe'));
expect('declares document_chunks requirement', lib.includes('document_chunks contains canonical'));
expect('guards commercial constants', lib.includes('Only approved-reference values can feed final calculation constants'));
expect('covers Material Toolbox', lib.includes('MaterialComparisonDialog / Material Toolbox'));
expect('covers Evidence Pack', lib.includes('Evidence Pack source ledger'));
expect('covers Medical 3D', lib.includes('Medical 3D visual material labels'));
expect('package prepare script exists', pkg.scripts?.['prepare:f491-f498:regulatory-materials-db'] === 'node scripts/f491-f498-regulatory-materials-db-audit.mjs');
expect('package contract script exists', pkg.scripts?.['test:f491-f498:regulatory-materials-db'] === 'node scripts/check-f491-f498-regulatory-materials-db-contracts.mjs');
expect('package unit script exists', pkg.scripts?.['test:f491-f498:regulatory-materials-db:unit'] === 'node scripts/check-f491-f498-regulatory-materials-db-values.mjs');
expect('Update Center documents F491-F498', update.includes('F491-F498 DB regulatoria/materiales'));
expect('Changelog documents F491-F498', changelog.includes('F491-F498'));
expect('Version manual documents F491-F498', versions.includes('F491-F498'));
expect('User manual documents F491-F498', manual.includes('Addendum F491-F498'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F491-F498 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F491-F498 regulatory materials DB contracts passed.');
