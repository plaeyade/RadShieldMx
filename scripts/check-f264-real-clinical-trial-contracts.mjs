import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

execFileSync(process.execPath, ['scripts/f264-real-clinical-trial-gate.mjs'], { stdio: 'inherit' });

const files = [
  'src/lib/realClinicalTrialCases.ts',
  'src/lib/realClinicalTrialCases.test.ts',
  'src/lib/unitNormalization.ts',
  'src/lib/f125CalculationEvidenceGate.ts',
  'scripts/f264-real-clinical-trial-gate.mjs',
  'scripts/check-f264-real-clinical-trial-contracts.mjs',
  'outputs/f264_real_clinical_trial_gate/f264_real_clinical_trial_gate.json',
  'outputs/fase_264_real_clinical_trial_gate.md',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_USUARIO_v99.md',
  'MANUAL_VERSIONES_v50.md',
  'CONTROL_DE_CAMBIOS_v99.md',
  'public/manual_usuario.html',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const failures = [];
const read = (file) => readFileSync(file, 'utf8');
for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');
const pkg = existsSync('package.json') ? JSON.parse(read('package.json')) : {};
const manifest = existsSync(files[6]) ? JSON.parse(read(files[6])) : null;

function expect(label, condition) {
  if (!condition) failures.push(label);
}

for (const token of [
  'F264',
  'radshield-mx.real-clinical-trial.f264.v1',
  'runRealClinicalTrialCases',
  'buildF264RealClinicalTrialGate',
  'summarizeF264RealClinicalTrialGate',
  'validateNormalizedCalculationUnits',
  'linac-6mv-primary-public',
  'linac-18mv-secondary-neutron-review',
  'ct-body-public-control',
  'pet-f18-uptake-room',
  'gamma-knife-co60-primary',
  'hdr-ir192-control-room',
  'Compare exported Memoria IA/PDF/Evidence',
]) {
  expect(`Missing token ${token}`, joined.includes(token));
}

expect('package exposes prepare script', pkg.scripts?.['prepare:f264:real-trial'] === 'node scripts/f264-real-clinical-trial-gate.mjs');
expect('package exposes test script', pkg.scripts?.['test:f264:real-trial'] === 'node scripts/check-f264-real-clinical-trial-contracts.mjs');
if (manifest) {
  expect('manifest schema', manifest.schema === 'radshield-mx.real-clinical-trial-gate.f264.v1');
  expect('manifest status ready', manifest.status === 'ready-for-real-app-testing');
}

if (failures.length) {
  console.error('F264 real clinical trial contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F264 real clinical trial contracts passed.');
