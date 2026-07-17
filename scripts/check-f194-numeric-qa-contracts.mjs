import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const qa = read('src/lib/numericQaValidation.ts');
const cases = read('src/lib/numericValidationCases.ts');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('QA module exports runner', qa.includes('runNumericQaValidationCases'));
expect('QA module exports summary', qa.includes('summarizeNumericQaValidation'));
expect('QA result statuses include pass/review/fail', qa.includes("'pass' | 'review-required' | 'fail'"));
expect('LINAC 6MV TVL case is executable', qa.includes('linac6MvPrimaryCase') && qa.includes('one TVL transmission'));
expect('LINAC 18MV neutron warning case is executable', qa.includes('linac18MvNeutronCase') && qa.includes('energy_MeV'));
expect('CT/RX NCRP147 case is executable', qa.includes('ctRxRouteCase') && qa.includes('NCRP147_CT_DLP_ISODOSE') && qa.includes('NCRP147_ARCHER'));
expect('Gamma Knife Co60 case is executable', qa.includes('gammaKnifeCo60Case') && qa.includes('Co60'));
expect('PET/NM point kernel case is executable', qa.includes('petNmPointKernelCase') && qa.includes('AAPM_TG108_POINT_KERNEL'));
expect('UAQ local review gate is executable', qa.includes('uaqLocalReviewGateCase') && qa.includes('UAQ/CNSNS memory release remains review-required'));
expect('Known cases include UAQ review gate', cases.includes('uaq-local-review-gate') && cases.includes('UAQ_REVIEW'));
expect('Package exposes F194 contract', pkg.scripts?.['test:f194:numeric-qa'] === 'node scripts/check-f194-numeric-qa-contracts.mjs');
expect('Changelog documents F194', changelog.includes('F194'));
expect('Manual documents F194', manual.includes('F194'));
expect('Update Center documents F194', update.includes('F194 Numeric QA known cases'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F194 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F194 numeric QA contracts passed.');
