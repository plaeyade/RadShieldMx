import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f159_sites_hosting_prep');
const manifestPath = path.join(outDir, 'f159_sites_hosting_prep.json');
const mdPath = path.join(root, 'outputs', 'fase_159_sites_hosting_prep.md');
const hostingPath = path.join(root, '.openai', 'hosting.json');
const workerPath = path.join(root, 'dist', 'server', 'index.js');
const archivePath = path.join(outDir, 'radshield-mx-sites-package.tar.gz');
const packageScript = path.join(
  process.env.USERPROFILE || 'C:\\Users\\carlo',
  '.codex',
  'plugins',
  'cache',
  'openai-bundled',
  'sites',
  '0.1.27',
  'scripts',
  'package-site.sh',
);

function sha256(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function fileInfo(file) {
  const relative = path.relative(root, file);
  if (!fs.existsSync(file)) return { path: relative, present: false, bytes: 0, sha256: null };
  const stat = fs.statSync(file);
  return {
    path: relative,
    present: stat.isFile(),
    bytes: stat.isFile() ? stat.size : 0,
    sha256: stat.isFile() ? sha256(file) : null,
  };
}

function commandExists(command) {
  const result = spawnSync(process.platform === 'win32' ? 'where.exe' : 'command', process.platform === 'win32' ? [command] : ['-v', command], {
    encoding: 'utf8',
    shell: false,
  });
  return result.status === 0;
}

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(workerPath), { recursive: true });

const worker = `export default {
  async fetch(request, env) {
    if (!env || !env.ASSETS || typeof env.ASSETS.fetch !== 'function') {
      return new Response('RadShield-MX static assets binding is unavailable.', {
        status: 503,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== 'GET') return response;

    const url = new URL(request.url);
    const lastSegment = url.pathname.split('/').pop() ?? '';
    if (lastSegment.includes('.')) return response;

    return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
  },
};
`;

fs.writeFileSync(workerPath, worker, 'utf8');

const hasGit = commandExists('git');
const hasGitDir = fs.existsSync(path.join(root, '.git'));
const hasHosting = fs.existsSync(hostingPath);
const hasDist = fs.existsSync(path.join(root, 'dist', 'index.html'));
const hasWorker = fs.existsSync(workerPath);
const hasPackageScript = fs.existsSync(packageScript);
let archive = null;
let packageResult = null;

if (hasHosting && hasDist && hasWorker && hasPackageScript) {
  const bash = commandExists('bash') ? 'bash' : null;
  if (bash) {
    const result = spawnSync(bash, [packageScript, root, archivePath], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10,
    });
    packageResult = {
      ok: result.status === 0,
      exitCode: result.status,
      stdoutTail: result.stdout.slice(-1000),
      stderrTail: result.stderr.slice(-1000),
    };
    if (result.status === 0) archive = fileInfo(archivePath);
  } else {
    packageResult = { ok: false, reason: 'bash unavailable for Sites package helper' };
  }
}

if (!archive?.present && hasHosting && hasDist && hasWorker) {
  const stage = path.join(outDir, 'stage');
  fs.rmSync(stage, { recursive: true, force: true });
  fs.mkdirSync(path.join(stage, 'dist', '.openai'), { recursive: true });
  fs.cpSync(path.join(root, 'dist'), path.join(stage, 'dist'), { recursive: true });
  fs.copyFileSync(hostingPath, path.join(stage, 'dist', '.openai', 'hosting.json'));
  fs.rmSync(archivePath, { force: true });

  const tar = spawnSync('tar', ['-czf', archivePath, '-C', stage, 'dist'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
  });
  const entries = fs.existsSync(archivePath)
    ? spawnSync('tar', ['-tzf', archivePath], { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 })
    : null;
  const entryList = entries?.stdout?.split(/\r?\n/) ?? [];
  const validArchive = tar.status === 0
    && entries?.status === 0
    && entryList.includes('dist/server/index.js')
    && entryList.includes('dist/.openai/hosting.json');

  packageResult = {
    ...(packageResult ?? {}),
    nodeFallback: {
      ok: validArchive,
      exitCode: tar.status,
      stdoutTail: tar.stdout.slice(-1000),
      stderrTail: tar.stderr.slice(-1000),
      requiredEntriesPresent: validArchive,
    },
  };
  if (validArchive) archive = fileInfo(archivePath);
}

const blockers = [];
if (!hasHosting) blockers.push('Missing .openai/hosting.json');
if (!hasDist) blockers.push('Missing dist/index.html');
if (!hasWorker) blockers.push('Missing dist/server/index.js');
if (!archive?.present) blockers.push('Sites archive was not created');
if (!hasGit) blockers.push('Git executable unavailable');
if (!hasGitDir) blockers.push('Local .git source state unavailable');

let status = 'sites-deploy-gated';
if (archive?.present && (!hasGit || !hasGitDir)) status = 'sites-local-package-ready';
if (archive?.present && hasGit && hasGitDir) status = 'sites-deploy-ready';

const manifest = {
  phase: 'F159',
  title: 'Sites hosting metadata and package prep',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.sites-hosting-prep.f159.v1',
  status,
  projectIdPresent: hasHosting,
  gitExecutable: hasGit,
  gitSourceState: hasGitDir,
  artifacts: {
    hosting: fileInfo(hostingPath),
    worker: fileInfo(workerPath),
    archive,
  },
  packageResult,
  blockers,
  nextActions:
    status === 'sites-deploy-ready'
      ? ['Commit exact source state', 'Push source to Sites repository', 'Save Sites version', 'Deploy and rerun F154-F158']
      : ['Install/enable Git or move source into Git worktree', 'Commit/push exact source state', 'Save/deploy Sites version', 'Rerun F154-F158 against HTTPS URL'],
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F159 - Sites Hosting Prep',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  `Estado: **${manifest.status}**`,
  `Git executable: ${manifest.gitExecutable ? 'OK' : 'PENDIENTE'}`,
  `Git source state: ${manifest.gitSourceState ? 'OK' : 'PENDIENTE'}`,
  '',
  '## Artefactos',
  '',
  `- hosting.json: ${manifest.artifacts.hosting.present ? 'OK' : 'PENDIENTE'}`,
  `- worker adapter: ${manifest.artifacts.worker.present ? 'OK' : 'PENDIENTE'}`,
  `- archive: ${manifest.artifacts.archive?.present ? 'OK' : 'PENDIENTE'}`,
  '',
  '## Bloqueos',
  '',
  ...(manifest.blockers.length ? manifest.blockers.map((item) => `- ${item}`) : ['- Ninguno.']),
  '',
].join('\n'), 'utf8');

console.log(`F159 Sites hosting prep written: ${path.relative(root, manifestPath)}`);
console.log(`Status: ${manifest.status}`);
if (status === 'sites-deploy-gated') process.exit(1);
