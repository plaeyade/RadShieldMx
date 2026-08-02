import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const lib = read('src/lib/f484F490NormativeQa.ts');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const pkg = JSON.parse(read('package.json'));

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('exports F484-F490 builder', lib.includes('buildF484F490NormativeQa'));
expect('exports markdown formatter', lib.includes('formatF484F490NormativeQaMarkdown'));
expect('covers NCRP151', lib.includes("'NCRP151'"));
expect('covers NCRP147', lib.includes("'NCRP147'"));
expect('covers IAEA-SRS47', lib.includes("'IAEA-SRS47'"));
expect('covers UAQ', lib.includes("'UAQ'"));
expect('covers AAPM-TG108', lib.includes("'AAPM-TG108'"));
expect('defines heavy asset route', lib.includes('heavyAssetImplementationRoute'));
expect('defines clinical release gate', lib.includes('requiredBeforeClinicalUse'));
expect('package prepare script exists', pkg.scripts?.['prepare:f484-f490:normative-qa'] === 'node scripts/f484-f490-normative-qa-audit.mjs');
expect('package unit script exists', pkg.scripts?.['test:f484-f490:normative-qa:unit'] === 'node scripts/check-f484-f490-normative-qa-values.mjs');
expect('Update Center documents phase', update.includes('F484-F490 Motor calculo QA'));
expect('Changelog documents phase', changelog.includes('F484-F490'));
expect('Manual versions documents phase', versions.includes('F484-F490'));
expect('User manual documents heavy assets route', manual.includes('public/unity/radshield-medical-3d') && manual.includes('public/medical3d/photoreal'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F484-F490 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F484-F490 normative QA contracts passed.');
