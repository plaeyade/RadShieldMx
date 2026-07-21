import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const governance = read('src/lib/f237CalculationEngineGovernance.ts');
const test = read('src/__tests__/lib/f237CalculationEngineGovernance.test.ts');
const f125 = read('src/lib/f125CalculationEvidenceGate.ts');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manualVersions = read('MANUAL_VERSIONES_v50.md');
const manualUser = read('MANUAL_USUARIO_v99.md');
const manualHtml = read('public/manual_usuario.html');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('F237 module exports governance builder', governance.includes('buildF237CalculationEngineGovernance'));
expect('F237 module exports report section', governance.includes('buildF237CalculationEngineGovernanceSection'));
expect('F237 statuses are explicit', governance.includes("'ready' | 'review-required' | 'blocked'"));
expect('F237 checks trace', governance.includes('traceReady') && governance.includes('formulaId') && governance.includes('citationIds'));
expect('F237 checks units', governance.includes('unitReady') && governance.includes('selectedThickness_cm') && governance.includes('structuralLoad_kPa'));
expect('F237 checks warnings', governance.includes('clinicalReviewPresent') && governance.includes('qualified medical physicist'));
expect('F237 checks TVL/HVL evidence', governance.includes('versioned-tvl-hvl') && governance.includes('TVL/HVL'));
expect('F237 checks comparison', governance.includes('comparisonReady') && governance.includes('base-vs-conservative'));
expect('F237 checks cache', governance.includes('cacheReady') && governance.includes('calc:f196:'));
expect('F237 imports numeric cases', governance.includes('getKnownNumericValidationCases'));
expect('F237 recommends priorities', governance.includes("releasePriority: 'P0'") && governance.includes("releasePriority: 'P1'") && governance.includes("releasePriority: 'P2'"));
expect('F125 includes F237 section', f125.includes('buildF237CalculationEngineGovernanceSection'));
expect('Vitest covers ready barrier', test.includes('marks barriers ready'));
expect('Vitest covers incomplete evidence', test.includes('holds signed output'));
expect('Package exposes F237 contract', pkg.scripts?.['test:f237:calculation-governance'] === 'node scripts/check-f237-calculation-engine-governance-contracts.mjs');
expect('Changelog documents F237', changelog.includes('F237'));
expect('Manual versions documents F237', manualVersions.includes('F237'));
expect('Manual user documents F237', manualUser.includes('F237'));
expect(
  'Manual HTML coverage includes F237 within current release range',
  /Cobertura de versiones: v1 - F(23[7-9]|24[0-9]|25[0-9]|26[0-9])/.test(manualHtml) && manualHtml.includes('F237'),
);
expect('Update Center documents F237', update.includes('F237 Calculation governance'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F237 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F237 calculation engine governance contracts passed.');
