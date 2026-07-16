import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/shieldingMath.ts',
  'src/lib/f174aPredeployHardening.ts',
  'src/__tests__/lib/f174aPredeployHardening.test.ts',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'scripts/f174a-predeploy-hardening.mjs',
  'scripts/check-f174a-predeploy-hardening-unit.mjs',
  'scripts/check-f174a-predeploy-hardening-contracts.mjs',
  'outputs/f174a_predeploy_hardening/f174a_predeploy_hardening.json',
  'outputs/fase_174a_predeploy_hardening.md',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
];

const failures = [];
const read = (file) => readFileSync(file, 'utf8');

for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const manifest = existsSync(files[7]) ? JSON.parse(read(files[7])) : null;
if (manifest) {
  if (manifest.phase !== 'F174A') failures.push('F174A manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.predeploy-hardening.f174a.v1') failures.push('F174A schema mismatch');
  if (manifest.status !== 'predeploy-hardening-ready') failures.push(`F174A status not ready: ${manifest.status}`);
  if (!manifest.gates?.calculationGuardsPresent) failures.push('F174A calculation guards missing');
  if (!manifest.gates?.ragPolicyPresent) failures.push('F174A RAG policy missing');
  if (!manifest.gates?.frontendVisible) failures.push('F174A frontend visibility missing');
  if (!manifest.gates?.noDbMigration) failures.push('F174A must not add DB migration');
}

const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');
for (const token of [
  'F174A',
  'predeploy-hardening-ready',
  'isFinitePositive',
  'clampTransmission',
  'getCalculationInputWarnings',
  'classifyF174RagSource',
  'getF174RagCitationWarning',
  'buildF174APredeployHardening',
  'F174A Predeploy hardening',
  'prepare:f174a:predeploy-hardening',
  'test:f174a:predeploy-hardening',
  'test:f174a:predeploy-hardening:unit',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

for (const sourceClass of ['canonical', 'research', 'material-evidence', 'analytic-memory', 'external']) {
  if (!joined.includes(sourceClass)) failures.push(`Missing RAG source class: ${sourceClass}`);
}

if (failures.length) {
  console.error('F174A predeploy hardening contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F174A predeploy hardening contracts OK.');
