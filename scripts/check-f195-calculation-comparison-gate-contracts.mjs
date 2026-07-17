import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const gate = read('src/lib/f195CalculationComparisonGate.ts');
const f125 = read('src/lib/f125CalculationEvidenceGate.ts');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('F195 module exports gate builder', gate.includes('buildF195CalculationComparisonGate'));
expect('F195 module exports text section', gate.includes('buildF195CalculationComparisonSection'));
expect('F195 statuses are explicit', gate.includes("'complete' | 'review-required' | 'missing-comparison'"));
expect('F195 severity tiers are explicit', gate.includes("'none' | 'low' | 'medium' | 'high'"));
expect('F195 checks base thickness', gate.includes('baseThickness_mm'));
expect('F195 checks conservative thickness', gate.includes('conservativeThickness_mm'));
expect('F195 checks delta percent', gate.includes('deltaPercent'));
expect('F195 emits recommendations', gate.includes('recommendationFromComparison'));
expect('F195 handles missing comparison safely', gate.includes('missing-comparison') && gate.includes('Run the hardened calculation engine'));
expect('F125 imports F195 gate', f125.includes("import { buildF195CalculationComparisonGate"));
expect('F125 exposes F195 counters', f125.includes('comparisonReviewRequiredCount') && f125.includes('comparisonMissingCount'));
expect('F125 appends F195 section', f125.includes('buildF195CalculationComparisonSection(floorPlan, barrierResults)'));
expect('Package exposes F195 contract', pkg.scripts?.['test:f195:comparison-gate'] === 'node scripts/check-f195-calculation-comparison-gate-contracts.mjs');
expect('Changelog documents F195', changelog.includes('F195'));
expect('Manual documents F195', manual.includes('F195'));
expect('Update Center documents F195', update.includes('F195 Base/conservative comparison gate'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F195 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F195 calculation comparison gate contracts passed.');
