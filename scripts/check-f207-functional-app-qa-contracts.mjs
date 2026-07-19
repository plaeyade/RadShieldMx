import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'scripts/check-f207-functional-app-qa-smoke.mjs',
  'outputs/f207_functional_app_qa_smoke_result.json',
  'outputs/fase_207_functional_app_qa.md',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'MANUAL_USUARIO_v99.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const missingFiles = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missingFiles.length > 0) throw new Error(`Missing F207 files: ${missingFiles.join(', ')}`);

const smoke = JSON.parse(fs.readFileSync(path.join(root, 'outputs/f207_functional_app_qa_smoke_result.json'), 'utf8'));
const failedChecks = (smoke.checks ?? []).filter((check) => !check.ok);

const expectations = [
  ['phase', smoke.phase === 'F207'],
  ['schema', smoke.schema === 'radshield-mx.functional-app-qa.f207.v1'],
  ['status', smoke.status === 'functional-app-qa-pass'],
  ['all smoke checks pass', failedChecks.length === 0],
  ['startup canvas guard', smoke.checks?.some((check) => check.name === 'startup sidebar/canvas/toolbar' && check.ok)],
  ['DXF apply guard', smoke.checks?.some((check) => check.name === 'after DXF apply sidebar/canvas/toolbar' && check.ok)],
  ['Memoria surface', smoke.checks?.some((check) => check.name === 'memoria-ai signal memoria-evidence-snapshot' && check.ok)],
  ['PDF surface', smoke.checks?.some((check) => check.name === 'pdf-report signal pdf-report-dialog' && check.ok)],
  ['Evidence surface', smoke.checks?.some((check) => check.name === 'evidence-pack signal f125-calculation-evidence-gate' && check.ok)],
];

const failedExpectations = expectations.filter(([, ok]) => !ok).map(([name]) => name);
if (failedExpectations.length > 0) {
  throw new Error(`F207 contract failed: ${failedExpectations.join(', ')}. Failed smoke checks: ${failedChecks.map((check) => check.name).join(', ')}`);
}

const combinedText = [
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'MANUAL_USUARIO_v99.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'outputs/fase_207_functional_app_qa.md',
]
  .map((relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8'))
  .join('\n');

const requiredTokens = [
  'F207',
  'Functional App QA',
  'functional-app-qa-pass',
  'test:f207:functional-app-qa',
  'Canvas',
  'DXF',
  'Memoria IA',
  'Evidence Pack',
];

const missingTokens = requiredTokens.filter((token) => !combinedText.includes(token));
if (missingTokens.length > 0) throw new Error(`F207 tokens missing: ${missingTokens.join(', ')}`);

console.log(
  JSON.stringify(
    {
      status: 'f207-contracts-ready',
      smokeStatus: smoke.status,
      checks: smoke.checks.length,
    },
    null,
    2,
  ),
);
