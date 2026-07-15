import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'src/lib/f157OperationalClosure.ts',
  'scripts/f157-operational-closure.mjs',
  'scripts/check-f157-operational-closure-contracts.mjs',
  'outputs/f157_operational_closure/f157_operational_closure.json',
  'outputs/f157_operational_closure/RUNBOOK_F157_OPERACION.md',
  'outputs/fase_157_operational_closure.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const tokens = [
  ['src/lib/f157OperationalClosure.ts', 'buildF157OperationalClosure'],
  ['src/lib/f157OperationalClosure.ts', 'controlled-local-ready'],
  ['src/lib/f157OperationalClosure.ts', 'external-public-ready'],
  ['scripts/f157-operational-closure.mjs', 'External publication must repeat F154'],
  ['scripts/f157-operational-closure.mjs', 'No DATABASE_URL copied'],
  ['scripts/f157-operational-closure.mjs', 'originClass'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'f157-operational-closure'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'buildF157OperationalClosure'],
  ['package.json', 'prepare:f157:operational-closure'],
  ['package.json', 'test:f157:operational-closure'],
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

for (const [file, token] of tokens) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing token file ${file}`);
    continue;
  }
  if (!fs.readFileSync(full, 'utf8').includes(token)) failures.push(`Missing token "${token}" in ${file}`);
}

const manifestPath = path.join(root, 'outputs', 'f157_operational_closure', 'f157_operational_closure.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F157') failures.push('F157 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.operational-closure.f157.v1') failures.push('F157 schema mismatch');
  if (!['controlled-local-ready', 'external-public-ready', 'closure-gated'].includes(manifest.status)) {
    failures.push(`F157 invalid status: ${manifest.status}`);
  }
  if (!['local', 'external-public', 'external-non-tls', 'missing', 'invalid'].includes(manifest.originClass)) {
    failures.push(`F157 invalid origin class: ${manifest.originClass}`);
  }
  for (const phase of ['F153', 'F154', 'F155', 'F156']) {
    if (!manifest.evidence?.some((item) => item.phase === phase && item.present)) failures.push(`F157 missing evidence ${phase}`);
  }
  if (!manifest.operations?.some((item) => item.id === 'post-smoke')) failures.push('F157 missing post-smoke operation');
  if (!manifest.securityPolicy?.some((item) => item.includes('DATABASE_URL'))) failures.push('F157 missing DATABASE_URL safety policy');
  if (manifest.originClass === 'local' && !manifest.residualRisks?.some((item) => item.includes('local/staging'))) {
    failures.push('F157 local closure must keep public URL residual risk');
  }
  if (manifest.status === 'closure-gated' && (!manifest.blockingReasons || manifest.blockingReasons.length === 0)) {
    failures.push('F157 gated status must include blocking reasons');
  }
}

if (failures.length) {
  console.error('F157 operational closure contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F157 operational closure contracts OK.');
