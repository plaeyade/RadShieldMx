import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f156_final_package');
const manifestPath = path.join(outDir, 'f156_final_package.json');
const mdPath = path.join(root, 'outputs', 'fase_156_final_package.md');
const readmePath = path.join(outDir, 'README_F156_FINAL_PACKAGE.md');
const dbBackupRelativeDir = 'outputs/f153_db_backup_restore/db_backup';

const evidenceFiles = [
  ['F150', 'outputs/f150_release_candidate_controlled/f150_release_candidate_controlled.json'],
  ['F151', 'outputs/f151_prepublish_hardening/f151_prepublish_hardening.json'],
  ['F152', 'outputs/f152_production_environment_prep/f152_production_environment_prep.json'],
  ['F153', 'outputs/f153_db_backup_restore/f153_db_backup_restore.json'],
  ['F154', 'outputs/f154_public_url_smoke/f154_public_url_smoke.json'],
  ['F155', 'outputs/f155_controlled_release_decision/f155_controlled_release_decision.json'],
];

function sha256(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function fileInfo(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) {
    return { path: relativePath, present: false, bytes: 0, sha256: null };
  }
  const stat = fs.statSync(full);
  return {
    path: relativePath,
    present: stat.isFile(),
    bytes: stat.isFile() ? stat.size : 0,
    sha256: stat.isFile() ? sha256(full) : null,
  };
}

function readJson(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function latestSqlDump() {
  const backupDir = path.join(root, dbBackupRelativeDir);
  if (!fs.existsSync(backupDir)) return null;
  const files = fs.readdirSync(backupDir)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => path.join(backupDir, name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!files[0]) return null;
  return path.relative(root, files[0]);
}

fs.mkdirSync(outDir, { recursive: true });

const f155 = readJson('outputs/f155_controlled_release_decision/f155_controlled_release_decision.json');
const dbDump = latestSqlDump();
const releaseArtifacts = [
  fileInfo('dist/index.html'),
  fileInfo('dist-backend/server/boot.js'),
  ...(dbDump ? [fileInfo(dbDump)] : []),
];

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

const f155Status = f155?.status ?? 'missing';
let status = 'package-gated';
let decision = 'NO-GO public package';
if (f155Status === 'public-release-ready') {
  status = 'public-package-ready';
  decision = 'GO public package';
} else if (f155Status === 'offline-rc-ready') {
  status = 'offline-package-ready';
  decision = 'GO offline RC package / NO-GO public';
}

const missingArtifacts = releaseArtifacts.filter((artifact) => !artifact.present).map((artifact) => artifact.path);
const missingEvidence = evidence.filter((item) => !item.present).map((item) => item.phase);
const blockingReasons = [];
if (missingArtifacts.length) blockingReasons.push(`Missing artifacts: ${missingArtifacts.join(', ')}`);
if (missingEvidence.length) blockingReasons.push(`Missing evidence: ${missingEvidence.join(', ')}`);
if (f155Status === 'blocked' || f155Status === 'missing') blockingReasons.push('F155 release decision is not ready');
if (!dbDump) blockingReasons.push('F153 DB dump not found');

const manifest = {
  phase: 'F156',
  title: 'Paquete final condicionado',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.final-package.f156.v1',
  status,
  decision,
  f155Status,
  releaseArtifacts,
  evidence,
  deliveryModes: {
    public: status === 'public-package-ready' ? 'ready' : 'blocked',
    offline: status === 'offline-package-ready' || status === 'public-package-ready' ? 'ready' : 'gated',
  },
  securityPolicy: [
    'No secrets copied.',
    'No DATABASE_URL copied.',
    'DB dump hash recorded, contents kept in controlled outputs folder.',
    'Public deploy requires F155 public-release-ready.',
  ],
  blockingReasons: status === 'public-package-ready' ? [] : blockingReasons,
  nextActions:
    status === 'public-package-ready'
      ? ['Deploy package to controlled target', 'Run F154 smoke again post-deploy', 'Archive release evidence']
      : [
          'Complete F153 restore probe',
          'Complete F154 final URL smoke',
          'Rerun F155',
          'Rerun F156',
        ],
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const readme = [
  '# F156 Final Package',
  '',
  `Generated: ${manifest.generatedAt}`,
  `Status: ${manifest.status}`,
  `Decision: ${manifest.decision}`,
  '',
  '## Artifacts',
  '',
  ...manifest.releaseArtifacts.map((item) => `- ${item.path}: ${item.present ? `${item.bytes} bytes / ${item.sha256}` : 'missing'}`),
  '',
  '## Evidence',
  '',
  ...manifest.evidence.map((item) => `- ${item.phase}: ${item.status} / ${item.path}`),
  '',
  '## Security',
  '',
  ...manifest.securityPolicy.map((item) => `- ${item}`),
  '',
  '## Blocking Reasons',
  '',
  ...(manifest.blockingReasons.length ? manifest.blockingReasons.map((item) => `- ${item}`) : ['- None']),
  '',
].join('\n');

fs.writeFileSync(readmePath, readme, 'utf8');
fs.writeFileSync(mdPath, [
  '# F156 - Paquete Final Condicionado',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  `Estado: **${manifest.status}**`,
  `Decision: **${manifest.decision}**`,
  '',
  '## Artefactos',
  '',
  ...manifest.releaseArtifacts.map((item) => `- ${item.path}: ${item.present ? 'OK' : 'PENDIENTE'}`),
  '',
  '## Evidencia F150-F155',
  '',
  ...manifest.evidence.map((item) => `- ${item.phase}: ${item.status}`),
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

console.log(`F156 final package written: ${path.relative(root, manifestPath)}`);
console.log(`Status: ${manifest.status}`);
console.log(`Decision: ${manifest.decision}`);

if (manifest.status === 'package-gated') process.exit(1);
