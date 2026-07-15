import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputsDir = path.join(root, 'outputs');
const jsonPath = path.join(outputsDir, 'f137_production_cutover_checklist.json');
const mdPath = path.join(outputsDir, 'fase_137_production_cutover_checklist.md');

const releaseEvidence = [
  ['F130', 'f130_db_live_release.json'],
  ['F131', 'f131_fullstack_live_smoke.json'],
  ['F132', 'f132_rc_persistence_smoke.json'],
  ['F133', 'f133_api_authenticated_smoke.json'],
  ['F134', 'f134_release_candidate_browser_smoke.json'],
  ['F135', 'f135_release_candidate_package.json'],
  ['F136', 'f136_production_deploy_rehearsal.json'],
];

function readJson(file) {
  return JSON.parse(readFileSync(path.join(outputsDir, file), 'utf8'));
}

const gates = releaseEvidence.map(([phase, file]) => {
  const fullPath = path.join(outputsDir, file);
  if (!existsSync(fullPath)) {
    return { phase, file: `outputs/${file}`, ok: false, status: 'missing', sizeBytes: 0 };
  }
  const data = readJson(file);
  return {
    phase,
    file: `outputs/${file}`,
    ok: data.status === 'ready',
    status: data.status,
    sizeBytes: statSync(fullPath).size,
    generatedAt: data.generatedAt ?? null,
  };
});

const f135PackageManifest = path.join(outputsDir, 'f135_release_candidate_package', 'manifest.json');
const f135DistIndex = path.join(outputsDir, 'f135_release_candidate_package', 'dist', 'index.html');
const f136Screenshot = path.join(outputsDir, 'f136_production_deploy_rehearsal.png');

const cutoverGates = [
  {
    name: 'release-evidence-f130-f136-ready',
    ok: gates.every((gate) => gate.ok),
    detail: gates.map((gate) => `${gate.phase}:${gate.status}`).join(' | '),
  },
  {
    name: 'f135-package-manifest-present',
    ok: existsSync(f135PackageManifest),
    detail: 'outputs/f135_release_candidate_package/manifest.json',
  },
  {
    name: 'f135-packaged-dist-present',
    ok: existsSync(f135DistIndex),
    detail: 'outputs/f135_release_candidate_package/dist/index.html',
  },
  {
    name: 'f136-browser-screenshot-present',
    ok: existsSync(f136Screenshot),
    detail: 'outputs/f136_production_deploy_rehearsal.png',
  },
  {
    name: 'public-url-smoke-required',
    ok: false,
    blocker: true,
    detail: 'Must run after target hosting/public URL is selected.',
  },
  {
    name: 'production-secrets-required',
    ok: false,
    blocker: true,
    detail: 'DATABASE_URL, APP_SECRET/JWT secret and integration secrets must be injected by host, not committed.',
  },
  {
    name: 'production-db-backup-required',
    ok: false,
    blocker: true,
    detail: 'Take and verify MySQL backup/restore immediately before production migration.',
  },
];

const localReady = cutoverGates
  .filter((gate) => !gate.blocker)
  .every((gate) => gate.ok);

const output = {
  phase: 'F137',
  status: localReady ? 'ready' : 'blocked',
  generatedAt: new Date().toISOString(),
  releaseBasis: gates,
  cutoverGates,
  goNoGoDecision: localReady
    ? 'GO for controlled production cutover preparation. NO-GO for public launch until public URL smoke, host secrets and DB backup are confirmed.'
    : 'NO-GO. Resolve local release evidence blockers before production cutover.',
  publicDeployDecision: localReady
    ? 'Local release train is cutover-ready. Public deployment remains intentionally gated by external hosting and production controls.'
    : 'Public deployment blocked by local evidence gaps.',
  productionBlockers: cutoverGates
    .filter((gate) => gate.blocker)
    .map((gate) => gate.name),
  rollbackPlan: [
    'Keep outputs/f135_release_candidate_package immutable for this RC.',
    'Preserve previous deployed artifact until final public URL smoke passes.',
    'Capture MySQL snapshot before production migration.',
    'Restore previous artifact and DB snapshot if target URL smoke fails.',
  ],
  evidence: [
    'outputs/f137_production_cutover_checklist.json',
    'outputs/fase_137_production_cutover_checklist.md',
  ],
  nextPhase: localReady
    ? 'F138 target hosting/deploy configuration or final public URL smoke'
    : 'Resolve F137 release train blockers',
};

writeFileSync(jsonPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(
  mdPath,
  [
    '# F137 Production Cutover Checklist',
    '',
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    '',
    '## Release Basis',
    ...gates.map((gate) => `- ${gate.ok ? 'OK' : 'FAIL'} ${gate.phase}: ${gate.file} (${gate.status})`),
    '',
    '## Cutover Gates',
    ...cutoverGates.map((gate) => `- ${gate.ok ? 'OK' : gate.blocker ? 'GATED' : 'FAIL'} ${gate.name}: ${gate.detail}`),
    '',
    '## Go / No-Go',
    output.goNoGoDecision,
    '',
    '## Rollback',
    ...output.rollbackPlan.map((item) => `- ${item}`),
    '',
    `Next: ${output.nextPhase}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F137 production cutover checklist ${output.status}: ${output.goNoGoDecision}`);
if (!localReady) process.exit(1);
