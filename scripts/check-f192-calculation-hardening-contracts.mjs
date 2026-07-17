import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const math = read('src/lib/shieldingMath.ts');
const hook = read('src/hooks/useShieldingEngine.ts');
const types = read('src/types/radshield.ts');
const spec = read('src/__tests__/lib/f192CalculationEngineHardening.test.ts');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('types expose CalculationTrace', types.includes('export interface CalculationTrace'));
expect('types expose calculationTrace on Barrier', types.includes('calculationTrace?: CalculationTrace'));
expect('types expose calculationWarnings on Barrier', types.includes('calculationWarnings?: CalculationInputWarning[]'));
expect('math exposes energy normalizer', math.includes('export function getShieldingEnergyKey'));
expect('math exposes formula normalizer', math.includes('export function getShieldingFormulaId'));
expect('math exposes standard normalizer', math.includes('export function getShieldingStandard'));
expect('math exposes citation ids', math.includes('export function getShieldingCitationIds'));
expect('math exposes audit warnings', math.includes('export function getCalculationAuditWarnings'));
expect('math exposes trace builder', math.includes('export function buildCalculationTrace'));
expect('hardening warns high energy neutrons', math.includes('Energy >10 MV') && math.includes('neutron shielding'));
expect('hardening keeps finite empty thickness outputs', math.includes('finiteThicknesses.length ? Math.min') && math.includes('finiteThicknesses.length ? Math.max'));
expect('useShieldingEngine imports trace builder', hook.includes('buildCalculationTrace'));
expect('useShieldingEngine attaches trace', hook.includes('calculationTrace'));
expect('useShieldingEngine attaches warnings', hook.includes('calculationWarnings'));
expect('spec covers formula and citations', spec.includes('normalizes formula, standard, energy key and citations'));
expect('spec covers clinical warnings', spec.includes('emits clinical warnings'));
expect('spec covers finite outputs', spec.includes('keeps trace outputs finite'));
expect('package exposes F192 contract', pkg.scripts?.['test:f192:calculation-hardening'] === 'node scripts/check-f192-calculation-hardening-contracts.mjs');
expect('changelog documents F192', changelog.includes('F192'));
expect('manual documents F192', manual.includes('F192'));
expect('Update Center documents F192', update.includes('F192 Calculation hardening'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F192 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F192 calculation hardening contracts passed.');
