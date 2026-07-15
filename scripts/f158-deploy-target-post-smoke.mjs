import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f158_deploy_target_post_smoke');
const manifestPath = path.join(outDir, 'f158_deploy_target_post_smoke.json');
const mdPath = path.join(root, 'outputs', 'fase_158_deploy_target_post_smoke.md');

const evidenceFiles = [
  ['F154', 'outputs/f154_public_url_smoke/f154_public_url_smoke.json'],
  ['F155', 'outputs/f155_controlled_release_decision/f155_controlled_release_decision.json'],
  ['F156', 'outputs/f156_final_package/f156_final_package.json'],
  ['F157', 'outputs/f157_operational_closure/f157_operational_closure.json'],
];

function readJson(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function fileHash(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
}

function fileInfo(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) return { path: relativePath, present: false, bytes: 0, sha256: null };
  const stat = fs.statSync(full);
  return {
    path: relativePath,
    present: stat.isFile(),
    bytes: stat.isFile() ? stat.size : 0,
    sha256: stat.isFile() ? fileHash(relativePath) : null,
  };
}

function classifyOrigin(origin) {
  if (!origin) return 'missing';
  try {
    const url = new URL(origin);
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) return 'local';
    if (url.protocol === 'https:') return 'external-public';
    return 'external-non-tls';
  } catch {
    return 'invalid';
  }
}

fs.mkdirSync(outDir, { recursive: true });

const f154 = readJson('outputs/f154_public_url_smoke/f154_public_url_smoke.json');
const evidence = evidenceFiles.map(([phase, relativePath]) => {
  const manifest = readJson(relativePath);
  return {
    phase,
    ...fileInfo(relativePath),
    status: manifest?.status ?? 'missing',
    decision: manifest?.decision ?? null,
    schema: manifest?.schema ?? null,
  };
});

const origin = f154?.publicUrlOrigin ?? null;
const originClass = classifyOrigin(origin);
const hasGit = fs.existsSync(path.join(root, '.git'));
const hasHostingJson = fs.existsSync(path.join(root, '.openai', 'hosting.json'));
const hasDist = fs.existsSync(path.join(root, 'dist', 'index.html'));

const f154Ready = f154?.status === 'ready' && Boolean(f154?.result?.ok);
const f155Ready = evidence.find((item) => item.phase === 'F155')?.status === 'public-release-ready';
const f156Ready = evidence.find((item) => item.phase === 'F156')?.status === 'public-package-ready';
const f157Ready = evidence.find((item) => item.phase === 'F157')?.status === 'controlled-local-ready'
  || evidence.find((item) => item.phase === 'F157')?.status === 'external-public-ready';

const externalDeployBlockers = [];
if (originClass !== 'external-public') externalDeployBlockers.push('F154 smoke was not run against external HTTPS PUBLIC_DEPLOY_URL');
if (!hasHostingJson) externalDeployBlockers.push('Missing .openai/hosting.json for Sites deploy flow');
if (!hasGit) externalDeployBlockers.push('Missing local .git source state required by Sites save/deploy flow');

const blockingReasons = [];
if (!hasDist) blockingReasons.push('dist/index.html missing');
if (!f154Ready) blockingReasons.push('F154 post-deploy smoke is not ready');
if (!f155Ready) blockingReasons.push('F155 release decision is not ready');
if (!f156Ready) blockingReasons.push('F156 final package is not ready');
if (!f157Ready) blockingReasons.push('F157 operational closure is not ready');

let status = 'deploy-target-gated';
let decision = 'NO-GO deploy target';
if (!blockingReasons.length && originClass === 'external-public') {
  status = 'external-postdeploy-ready';
  decision = 'GO external HTTPS post-deploy smoke';
} else if (!blockingReasons.length && originClass === 'local') {
  status = 'local-postdeploy-ready';
  decision = 'GO controlled local/staging post-deploy smoke';
}

const manifest = {
  phase: 'F158',
  title: 'Deploy target + F154 post-deploy smoke',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.deploy-target-post-smoke.f158.v1',
  status,
  decision,
  validatedTarget: origin,
  targetClass: originClass,
  deployCapabilities: {
    distReady: hasDist,
    sitesHostingMetadata: hasHostingJson,
    gitSourceState: hasGit,
  },
  evidence,
  externalDeployBlockers,
  blockingReasons,
  nextActions:
    status === 'external-postdeploy-ready'
      ? ['Archive F154-F158 external deployment evidence', 'Monitor first production session']
      : [
          'For public release, deploy dist/backend to external HTTPS target',
          'Set PUBLIC_DEPLOY_URL=https://<final-url>',
          'Rerun F154-F158',
        ],
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F158 - Deploy Target + F154 Post-Deploy Smoke',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  `Estado: **${manifest.status}**`,
  `Decision: **${manifest.decision}**`,
  `Target validado: ${manifest.validatedTarget || 'pendiente'}`,
  `Clase: ${manifest.targetClass}`,
  '',
  '## Capacidades Deploy',
  '',
  `- dist: ${manifest.deployCapabilities.distReady ? 'OK' : 'PENDIENTE'}`,
  `- Sites metadata: ${manifest.deployCapabilities.sitesHostingMetadata ? 'OK' : 'PENDIENTE'}`,
  `- Git source state: ${manifest.deployCapabilities.gitSourceState ? 'OK' : 'PENDIENTE'}`,
  '',
  '## Evidencia',
  '',
  ...manifest.evidence.map((item) => `- ${item.phase}: ${item.status}`),
  '',
  '## Bloqueos Deploy Externo',
  '',
  ...(manifest.externalDeployBlockers.length ? manifest.externalDeployBlockers.map((item) => `- ${item}`) : ['- Ninguno.']),
  '',
  '## Siguientes Acciones',
  '',
  ...manifest.nextActions.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F158 deploy target post-smoke written: ${path.relative(root, manifestPath)}`);
console.log(`Status: ${manifest.status}`);
console.log(`Decision: ${manifest.decision}`);

if (manifest.status === 'deploy-target-gated') process.exit(1);
