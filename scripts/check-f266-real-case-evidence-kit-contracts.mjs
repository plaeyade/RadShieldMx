import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

execFileSync(process.execPath, ['scripts/f266-real-case-evidence-kit.mjs'], { stdio: 'inherit' });

const files = [
  'src/lib/f266RealCaseEvidenceKit.ts',
  'scripts/f266-real-case-evidence-kit.mjs',
  'scripts/check-f266-real-case-evidence-kit-contracts.mjs',
  'outputs/f266_real_case_evidence_kit/f266_real_case_evidence_kit.json',
  'outputs/f266_real_case_evidence_kit/real_case_deviation_log_template.csv',
  'outputs/fase_266_real_case_evidence_kit.md',
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
const manifest = existsSync(files[3]) ? JSON.parse(read(files[3])) : null;
const csv = existsSync(files[4]) ? read(files[4]) : '';

function expect(label, condition) {
  if (!condition) failures.push(label);
}

for (const token of [
  'F266',
  'radshield-mx.real-case-evidence-kit.f266.v1',
  'buildF266RealCaseEvidenceKit',
  'formatF266DeviationCsvTemplate',
  'summarizeF266RealCaseEvidenceKit',
  'blocker',
  'major',
  'accepted-limitation',
  'memoria-ia-export.txt',
  'evidence-pack.json',
  'real_case_deviation_log_template.csv',
]) {
  expect(`Missing token ${token}`, joined.includes(token));
}

expect('package exposes prepare script', pkg.scripts?.['prepare:f266:real-case-kit'] === 'node scripts/f266-real-case-evidence-kit.mjs');
expect('package exposes test script', pkg.scripts?.['test:f266:real-case-kit'] === 'node scripts/check-f266-real-case-evidence-kit-contracts.mjs');
expect('CSV has expected header', csv.includes('caseId,modalityProfile,sourceDocument,expectedFromSignedMemory,radshieldOutput,difference,classification,severity,disposition,owner,evidencePath,notes'));
if (manifest) {
  expect('manifest schema', manifest.schema === 'radshield-mx.real-case-evidence-kit.f266.v1');
  expect('manifest covers profiles', ['DX', 'TX', 'NM', 'CY'].every((profile) => manifest.profiles?.includes(profile)));
  expect('manifest has stop rules', (manifest.releaseStopRules?.length ?? 0) >= 5);
  expect('manifest has minimum evidence names', (manifest.evidenceNames?.length ?? 0) >= 9);
}

if (failures.length) {
  console.error('F266 real case evidence kit contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F266 real case evidence kit contracts passed.');
