import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f157_operational_closure');
const manifestPath = path.join(outDir, 'f157_operational_closure.json');
const mdPath = path.join(root, 'outputs', 'fase_157_operational_closure.md');
const runbookPath = path.join(outDir, 'RUNBOOK_F157_OPERACION.md');

const evidenceFiles = [
  ['F153', 'outputs/f153_db_backup_restore/f153_db_backup_restore.json'],
  ['F154', 'outputs/f154_public_url_smoke/f154_public_url_smoke.json'],
  ['F155', 'outputs/f155_controlled_release_decision/f155_controlled_release_decision.json'],
  ['F156', 'outputs/f156_final_package/f156_final_package.json'],
];

function readJson(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function sha256(relativePath) {
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
    sha256: stat.isFile() ? sha256(relativePath) : null,
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
const f156 = readJson('outputs/f156_final_package/f156_final_package.json');
const originClass = classifyOrigin(f154?.publicUrlOrigin);
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

const evidenceReady = {
  f153Ready: evidence.find((item) => item.phase === 'F153')?.status === 'ready',
  f154Ready: evidence.find((item) => item.phase === 'F154')?.status === 'ready',
  f155Ready: evidence.find((item) => item.phase === 'F155')?.status === 'public-release-ready',
  f156Ready: evidence.find((item) => item.phase === 'F156')?.status === 'public-package-ready',
};

const blockingReasons = [];
for (const [key, ready] of Object.entries(evidenceReady)) {
  if (!ready) blockingReasons.push(`${key} is not ready`);
}
if (originClass === 'missing' || originClass === 'invalid') blockingReasons.push('F154 URL origin missing or invalid');

let status = 'closure-gated';
let decision = 'NO-GO operational closure';
if (Object.values(evidenceReady).every(Boolean)) {
  status = originClass === 'external-public' ? 'external-public-ready' : 'controlled-local-ready';
  decision =
    status === 'external-public-ready'
      ? 'GO external public operational closure'
      : 'GO controlled local/staging operational closure';
}

const operations = [
  {
    id: 'mysql',
    label: 'MySQL live DB',
    command: 'Start MySQL 8.0 service and keep DATABASE_URL configured outside release artifacts.',
  },
  {
    id: 'backend',
    label: 'Backend API',
    command: 'NODE_ENV=production node dist-backend/server/boot.js',
  },
  {
    id: 'frontend',
    label: 'Frontend static build',
    command: 'Serve dist/ or deploy static artifact to controlled target.',
  },
  {
    id: 'post-smoke',
    label: 'Post-deploy smoke',
    command: 'RADSHIELD_ALLOW_PUBLIC_SMOKE=1 PUBLIC_DEPLOY_URL=https://<url> npm run prepare:f154:public-smoke',
  },
];

const manifest = {
  phase: 'F157',
  title: 'Cierre operativo de release',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.operational-closure.f157.v1',
  status,
  decision,
  validatedOrigin: f154?.publicUrlOrigin ?? null,
  originClass,
  evidenceReady,
  evidence,
  f156DeliveryModes: f156?.deliveryModes ?? null,
  operations,
  securityPolicy: [
    'No secrets copied into F157 artifacts.',
    'No DATABASE_URL copied.',
    'DB dump is referenced by hash from F156/F153 evidence.',
    'External publication must repeat F154 against the final HTTPS URL.',
  ],
  blockingReasons: status === 'closure-gated' ? blockingReasons : [],
  residualRisks:
    originClass === 'external-public'
      ? ['Run one additional post-deploy smoke after DNS/CDN/cache changes.']
      : ['Current validated origin is local/staging, not an external public HTTPS URL.'],
  nextActions:
    originClass === 'external-public'
      ? ['Archive F153-F157 evidence', 'Monitor first production session', 'Freeze release notes']
      : ['Deploy to external HTTPS target when available', 'Rerun F154', 'Rerun F155-F157'],
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const runbook = [
  '# F157 Operational Runbook',
  '',
  `Generated: ${manifest.generatedAt}`,
  `Status: ${manifest.status}`,
  `Decision: ${manifest.decision}`,
  `Validated origin: ${manifest.validatedOrigin || 'pending'}`,
  `Origin class: ${manifest.originClass}`,
  '',
  '## Operations',
  '',
  ...manifest.operations.map((item) => `- ${item.label}: \`${item.command}\``),
  '',
  '## Evidence',
  '',
  ...manifest.evidence.map((item) => `- ${item.phase}: ${item.status} / ${item.path} / ${item.sha256}`),
  '',
  '## Security',
  '',
  ...manifest.securityPolicy.map((item) => `- ${item}`),
  '',
  '## Residual Risks',
  '',
  ...manifest.residualRisks.map((item) => `- ${item}`),
  '',
  '## Next Actions',
  '',
  ...manifest.nextActions.map((item) => `- ${item}`),
  '',
].join('\n');

fs.writeFileSync(runbookPath, runbook, 'utf8');
fs.writeFileSync(mdPath, [
  '# F157 - Cierre Operativo De Release',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  `Estado: **${manifest.status}**`,
  `Decision: **${manifest.decision}**`,
  `Origen validado: ${manifest.validatedOrigin || 'pendiente'}`,
  `Clase de origen: ${manifest.originClass}`,
  '',
  '## Evidencia',
  '',
  ...manifest.evidence.map((item) => `- ${item.phase}: ${item.status}`),
  '',
  '## Operacion',
  '',
  ...manifest.operations.map((item) => `- ${item.label}: \`${item.command}\``),
  '',
  '## Riesgos Residuales',
  '',
  ...manifest.residualRisks.map((item) => `- ${item}`),
  '',
  '## Bloqueos',
  '',
  ...(manifest.blockingReasons.length ? manifest.blockingReasons.map((item) => `- ${item}`) : ['- Ninguno para carril controlado/local.']),
  '',
].join('\n'), 'utf8');

console.log(`F157 operational closure written: ${path.relative(root, manifestPath)}`);
console.log(`Status: ${manifest.status}`);
console.log(`Decision: ${manifest.decision}`);

if (manifest.status === 'closure-gated') process.exit(1);
