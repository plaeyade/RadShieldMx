import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f155_controlled_release_decision');
const jsonPath = path.join(outDir, 'f155_controlled_release_decision.json');
const mdPath = path.join(root, 'outputs', 'fase_155_controlled_release_decision.md');

const sources = [
  ['F150', path.join(root, 'outputs', 'f150_release_candidate_controlled', 'f150_release_candidate_controlled.json')],
  ['F151', path.join(root, 'outputs', 'f151_prepublish_hardening', 'f151_prepublish_hardening.json')],
  ['F152', path.join(root, 'outputs', 'f152_production_environment_prep', 'f152_production_environment_prep.json')],
  ['F153', path.join(root, 'outputs', 'f153_db_backup_restore', 'f153_db_backup_restore.json')],
  ['F154', path.join(root, 'outputs', 'f154_public_url_smoke', 'f154_public_url_smoke.json')],
];

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function isOk(value) {
  return Boolean(value);
}

function evidenceFor([phase, file]) {
  const manifest = readJson(file);
  return {
    phase,
    file: path.relative(root, file),
    present: Boolean(manifest),
    status: manifest?.status ?? 'missing',
    schema: manifest?.schema ?? null,
    decision: manifest?.decision ?? null,
    generatedAt: manifest?.generatedAt ?? null,
  };
}

fs.mkdirSync(outDir, { recursive: true });

const evidence = sources.map(evidenceFor);
const byPhase = Object.fromEntries(evidence.map((item) => [item.phase, item]));
const f153 = readJson(sources.find(([phase]) => phase === 'F153')[1]);
const f154 = readJson(sources.find(([phase]) => phase === 'F154')[1]);
const f150 = readJson(sources.find(([phase]) => phase === 'F150')[1]);

const allowOfflineWaiver = process.env.RADSHIELD_ALLOW_OFFLINE_RELEASE_WAIVER === '1';
const distReady = fs.existsSync(path.join(root, 'dist', 'index.html'));
const backendReady = fs.existsSync(path.join(root, 'dist-backend', 'server', 'boot.js'));
const f150Ready = f150?.status === 'release-candidate-controlled';
const f153BackupOk = Boolean(f153?.backup?.ok);
const f153RestoreReady = f153?.status === 'ready';
const f154Ready = f154?.status === 'ready' && Boolean(f154?.result?.ok);
const urlKnown = Boolean(f154?.publicUrlOrigin && f154.publicUrlOrigin !== 'invalid-url');

const blockingReasons = [];
if (!distReady) blockingReasons.push('dist/index.html missing');
if (!backendReady) blockingReasons.push('dist-backend/server/boot.js missing');
if (!f150Ready) blockingReasons.push('F150 release candidate controlled is missing or not ready');
if (!f153BackupOk) blockingReasons.push('F153 DB backup is missing or failed');
if (!f153RestoreReady) blockingReasons.push('F153 restore probe is not ready');
if (!f154Ready) blockingReasons.push('F154 public URL smoke is not ready');
if (!urlKnown) blockingReasons.push('Final public/staging URL is missing or invalid');

let status = 'blocked';
let decision = 'NO-GO public release';
if (f150Ready && f153BackupOk && f153RestoreReady && f154Ready && distReady && backendReady) {
  status = 'public-release-ready';
  decision = 'GO controlled public release';
} else if (f150Ready && f153BackupOk && distReady && allowOfflineWaiver) {
  status = 'offline-rc-ready';
  decision = 'GO controlled offline RC / NO-GO public release';
}

const releaseLanes = [
  {
    id: 'public',
    label: 'Public/staging release',
    status: status === 'public-release-ready' ? 'go' : 'no-go',
    required: ['F153 restore probe ready', 'F154 smoke final URL ready', 'dist/frontend ready', 'backend ready'],
  },
  {
    id: 'offline-rc',
    label: 'Offline/local release candidate',
    status: status === 'offline-rc-ready' || status === 'public-release-ready' ? 'go' : 'gated',
    required: ['F150 controlled RC ready', 'F153 backup ok', 'dist/frontend ready', 'explicit waiver if public gates pending'],
  },
];

const manifest = {
  phase: 'F155',
  title: 'Decision de release controlado',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.controlled-release-decision.f155.v1',
  status,
  decision,
  allowOfflineWaiver,
  prerequisites: {
    distReady,
    backendReady,
    f150Ready,
    f153BackupOk,
    f153RestoreReady,
    f154Ready,
    urlKnown,
  },
  evidence,
  releaseLanes,
  blockingReasons: status === 'public-release-ready' ? [] : blockingReasons,
  nextActions:
    status === 'public-release-ready'
      ? ['Publish controlled URL', 'Archive F150-F155 evidence pack', 'Run post-deploy smoke once more']
      : [
          'Run F153 restore probe after applying admin SQL grants',
          'Set PUBLIC_DEPLOY_URL or PLAYWRIGHT_TEST_BASE_URL',
          'Run F154 with RADSHIELD_ALLOW_PUBLIC_SMOKE=1',
          'Rerun F155 release decision',
        ],
};

fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F155 - Decision De Release Controlado',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  `Estado: **${manifest.status}**`,
  `Decision: **${manifest.decision}**`,
  '',
  '## Evidencia',
  '',
  ...manifest.evidence.map((item) => `- ${item.phase}: ${item.present ? item.status : 'missing'} (${item.file})`),
  '',
  '## Prerrequisitos',
  '',
  ...Object.entries(manifest.prerequisites).map(([key, value]) => `- ${key}: ${value ? 'OK' : 'PENDIENTE'}`),
  '',
  '## Carriles',
  '',
  ...manifest.releaseLanes.map((lane) => `- ${lane.label}: ${lane.status}`),
  '',
  '## Bloqueos',
  '',
  ...(manifest.blockingReasons.length ? manifest.blockingReasons.map((item) => `- ${item}`) : ['- Ninguno.']),
  '',
  '## Siguientes Acciones',
  '',
  ...manifest.nextActions.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F155 controlled release decision written: ${path.relative(root, jsonPath)}`);
console.log(`Status: ${manifest.status}`);
console.log(`Decision: ${manifest.decision}`);

if (manifest.status === 'blocked') process.exit(1);
