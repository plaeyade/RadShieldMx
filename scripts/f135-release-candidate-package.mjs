import crypto from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputsDir = path.join(root, 'outputs');
const packageDir = path.join(outputsDir, 'f135_release_candidate_package');

const evidence = [
  'f130_db_live_release.json',
  'fase_130_db_live_release.md',
  'f131_fullstack_live_smoke.json',
  'fase_131_fullstack_live_smoke.md',
  'f132_rc_persistence_smoke.json',
  'fase_132_rc_persistence_smoke.md',
  'f133_api_authenticated_smoke.json',
  'fase_133_api_authenticated_smoke.md',
  'f134_release_candidate_browser_smoke.json',
  'fase_134_release_candidate_browser_smoke.md',
  'f134_release_candidate_browser_smoke.png',
];

function readJson(file) {
  return JSON.parse(readFileSync(path.join(outputsDir, file), 'utf8'));
}

function sha256(file) {
  const hash = crypto.createHash('sha256');
  hash.update(readFileSync(file));
  return hash.digest('hex');
}

function walkFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      entries.push(...walkFiles(full, base));
    } else {
      entries.push({
        path: path.relative(base, full).replaceAll('\\', '/'),
        sizeBytes: stat.size,
        sha256: sha256(full),
      });
    }
  }
  return entries;
}

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (statSync(from).isDirectory()) {
      copyDir(from, to);
    } else {
      copyFileSync(from, to);
    }
  }
}

const missing = evidence.filter((file) => !existsSync(path.join(outputsDir, file)));
if (missing.length > 0) {
  throw new Error(`Missing release evidence: ${missing.join(', ')}`);
}

const statusChecks = [
  ['F130', readJson('f130_db_live_release.json').status === 'ready'],
  ['F131', readJson('f131_fullstack_live_smoke.json').status === 'ready'],
  ['F132', readJson('f132_rc_persistence_smoke.json').status === 'ready'],
  ['F133', readJson('f133_api_authenticated_smoke.json').status === 'ready'],
  ['F134', readJson('f134_release_candidate_browser_smoke.json').status === 'ready'],
];

const distDir = path.join(root, 'dist');
const distFiles = walkFiles(distDir);
const distSizeBytes = distFiles.reduce((sum, file) => sum + file.sizeBytes, 0);
const distReady = existsSync(path.join(distDir, 'index.html')) && distFiles.length > 0;

rmSync(packageDir, { recursive: true, force: true });
mkdirSync(packageDir, { recursive: true });
for (const file of evidence) {
  copyFileSync(path.join(outputsDir, file), path.join(packageDir, file));
}
copyDir(distDir, path.join(packageDir, 'dist'));

const deployFiles = ['package.json', 'Dockerfile.frontend', 'Dockerfile.api', 'docker-compose.yml', 'nginx.conf', 'env.example'];
for (const file of deployFiles) {
  const source = path.join(root, file);
  if (existsSync(source)) copyFileSync(source, path.join(packageDir, file));
}

const packageFiles = walkFiles(packageDir);
const ready = statusChecks.every(([, ok]) => ok) && distReady;
const manifest = {
  phase: 'F135',
  status: ready ? 'ready' : 'blocked',
  generatedAt: new Date().toISOString(),
  packageDirectory: 'outputs/f135_release_candidate_package',
  releaseCandidate: 'RadShield-MX RC F135',
  deployDecision: ready
    ? 'Ready for local/full-stack RC package. Public production deploy requires explicit hosting/secrets/DB-backup decision.'
    : 'Blocked until all required evidence and dist inventory are ready.',
  evidence: evidence.map((file) => ({
    file: `outputs/${file}`,
    copiedTo: `outputs/f135_release_candidate_package/${file}`,
    sizeBytes: statSync(path.join(outputsDir, file)).size,
    sha256: sha256(path.join(outputsDir, file)),
  })),
  gates: statusChecks.map(([phase, ok]) => ({ phase, ok })),
  dist: {
    ready: distReady,
    fileCount: distFiles.length,
    sizeBytes: distSizeBytes,
    indexSha256: existsSync(path.join(distDir, 'index.html')) ? sha256(path.join(distDir, 'index.html')) : null,
    copiedTo: 'outputs/f135_release_candidate_package/dist',
    largestFiles: [...distFiles].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 12),
  },
  packageFiles,
  productionCutoverChecklist: [
    'Confirm target hosting/runtime and public URL.',
    'Set production DATABASE_URL, JWT_SECRET and KIMI_* outside source control.',
    'Backup MySQL before cutover and verify restore path.',
    'Run migrations intentionally, not implicitly from docker-compose.',
    'Run full Playwright smoke against production URL.',
    'Archive F130-F135 evidence with the deployed version.',
  ],
  nextPhase: ready ? 'F136 production deploy rehearsal or release hardening backlog' : 'Resolve package blockers before F136',
};

writeFileSync(path.join(packageDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
writeFileSync(path.join(outputsDir, 'f135_release_candidate_package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const markdown = [
  '# F135 Release Candidate Package',
  '',
  `Status: ${manifest.status}`,
  `Generated: ${manifest.generatedAt}`,
  `Package directory: ${manifest.packageDirectory}`,
  '',
  '## Deploy Decision',
  manifest.deployDecision,
  '',
  '## Gates',
  ...manifest.gates.map((gate) => `- ${gate.ok ? 'OK' : 'FAIL'} ${gate.phase}`),
  `- ${manifest.dist.ready ? 'OK' : 'FAIL'} dist inventory (${manifest.dist.fileCount} files, ${manifest.dist.sizeBytes} bytes)`,
  '',
  '## Evidence',
  ...manifest.evidence.map((item) => `- ${item.file} -> ${item.copiedTo}`),
  '',
  '## Production Cutover Checklist',
  ...manifest.productionCutoverChecklist.map((item) => `- ${item}`),
  '',
  `Next: ${manifest.nextPhase}`,
  '',
].join('\n');

writeFileSync(path.join(packageDir, 'README_F135_RC.md'), markdown, 'utf8');
writeFileSync(path.join(outputsDir, 'fase_135_release_candidate_package.md'), markdown, 'utf8');

console.log(`F135 release candidate package ${manifest.status}: ${manifest.packageDirectory}`);
if (!ready) process.exit(1);
