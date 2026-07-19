import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function includes(relativePath, tokens) {
  const content = read(relativePath);
  for (const token of tokens) {
    expect(content.includes(token), `${relativePath} missing token: ${token}`);
  }
}

const requiredFiles = [
  'scripts/f203-manual-public-verification.mjs',
  'scripts/check-f203-manual-public-verification-contracts.mjs',
  'outputs/f203_manual_public_verification/f203_manual_public_verification.json',
  'outputs/f203_manual_public_verification/CHECKLIST_OPERADOR_F203_PUBLICO.md',
  'outputs/f203_manual_public_verification/f203_operator_public_checklist.template.json',
  'outputs/fase_203_manual_public_verification.md',
];

for (const file of requiredFiles) {
  expect(fs.existsSync(path.join(root, file)), `missing F203 file: ${file}`);
}

includes('package.json', ['prepare:f203:manual-public-verification', 'test:f203:manual-public-verification']);
includes('CHANGELOG.md', ['F203', 'Verificacion publica manual']);
includes('MANUAL_VERSIONES_v50.md', ['F203', 'manual-public-verification']);
includes('MANUAL_USUARIO_v99.md', ['Addendum F203', 'CHECKLIST_OPERADOR_F203_PUBLICO']);
includes('src/sections/dialogs/UpdateAppDialog.tsx', ['F203 Manual public verification', 'manual-public-verification-required']);

const manifestPath = path.join(root, 'outputs/f203_manual_public_verification/f203_manual_public_verification.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  expect(manifest.phase === 'F203', 'F203 phase mismatch');
  expect(manifest.schema === 'radshield-mx.manual-public-verification.f203.v1', 'F203 schema mismatch');
  expect(['manual-public-verification-required', 'manual-public-verification-optional'].includes(manifest.status), `F203 status unsupported: ${manifest.status}`);
  expect(manifest.publicUrl?.startsWith('https://'), 'F203 public URL must be HTTPS');
  expect(Array.isArray(manifest.checks) && manifest.checks.length >= 16, 'F203 checklist too small');
  expect(manifest.checks.some((check) => check.id === 'canvas-floorplan-visible'), 'F203 missing canvas check');
  expect(manifest.checks.some((check) => check.id === 'memoria-ai-opens'), 'F203 missing Memoria IA check');
  expect(manifest.checks.some((check) => check.id === 'evidence-pack-opens'), 'F203 missing Evidence Pack check');
  expect(manifest.releaseDecision?.current === 'pending-operator-review', 'F203 release decision should be pending operator review');
}

if (failures.length) {
  console.error('F203 manual public verification contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F203 manual public verification contracts OK');
