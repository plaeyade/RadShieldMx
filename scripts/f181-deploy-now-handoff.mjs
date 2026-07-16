import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f181_deploy_now_handoff');
const jsonPath = path.join(outputDir, 'f181_deploy_now_handoff.json');
const mdPath = path.join(root, 'outputs', 'fase_181_deploy_now_handoff.md');
const readmePath = path.join(outputDir, 'README_F181_DEPLOY_NOW.md');
const staticArchivePath = path.join(outputDir, 'radshield-mx-static-dist.zip');

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function sha256File(fullPath) {
  if (!fs.existsSync(fullPath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
}

function fileEvidence(relativePath) {
  const fullPath = path.join(root, relativePath);
  const present = fs.existsSync(fullPath);
  return {
    path: relativePath,
    present,
    bytes: present ? fs.statSync(fullPath).size : 0,
    sha256: present ? sha256File(fullPath) : null,
  };
}

function probeTcp(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const finish = (ok, message = '') => {
      socket.destroy();
      resolve({ host, port, ok, message });
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false, 'timeout'));
    socket.once('error', (error) => finish(false, error.message));
    socket.connect(port, host);
  });
}

function ensureStaticArchive() {
  fs.mkdirSync(outputDir, { recursive: true });
  if (fs.existsSync(staticArchivePath)) fs.rmSync(staticArchivePath, { force: true });
  const distGlob = path.join(root, 'dist', '*');
  execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path '${distGlob}' -DestinationPath '${staticArchivePath}' -Force`,
    ],
    { stdio: 'pipe' },
  );
  return {
    path: path.relative(root, staticArchivePath),
    present: fs.existsSync(staticArchivePath),
    bytes: fs.existsSync(staticArchivePath) ? fs.statSync(staticArchivePath).size : 0,
    sha256: sha256File(staticArchivePath),
  };
}

const f176 = readJson('outputs/f176_local_smoke_final/f176_local_smoke_final.json');
const f180 = readJson('outputs/f180_static_publish_runbook/f180_static_publish_runbook.json');
const gitHead = execFileSync('C:\\Program Files\\Git\\cmd\\git.exe', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const gitStatus = execFileSync('C:\\Program Files\\Git\\cmd\\git.exe', ['status', '--short'], {
  cwd: root,
  encoding: 'utf8',
}).trim();

const tcpProbe = await probeTcp('git.chatgpt-team.site', 443);
const staticArchive = ensureStaticArchive();
const artifacts = [
  fileEvidence('dist/index.html'),
  fileEvidence('dist/reset-cache.html'),
  fileEvidence('vercel.json'),
  fileEvidence('netlify.toml'),
  fileEvidence('public/_redirects'),
  fileEvidence('public/_headers'),
  staticArchive,
];

const blockers = [];
if (f176?.status !== 'local-smoke-ready') blockers.push('F176 local smoke is not ready.');
if (f180?.status !== 'static-publish-runbook-ready') blockers.push('F180 static publish runbook is not ready.');
if (gitStatus) blockers.push('Git worktree is not clean before deployment handoff.');
if (!tcpProbe.ok) blockers.push('Sites source push is blocked: git.chatgpt-team.site:443 is unreachable from this environment.');
for (const artifact of artifacts) {
  if (!artifact.present) blockers.push(`Missing artifact: ${artifact.path}`);
}

const status =
  blockers.length === 1 && blockers[0].startsWith('Sites source push is blocked')
    ? 'sites-deploy-blocked-static-package-ready'
    : blockers.length === 0
      ? 'sites-deploy-network-ready-static-package-ready'
      : 'deploy-handoff-blocked';

const manifest = {
  phase: 'F181',
  title: 'Deploy now handoff',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.deploy-now-handoff.f181.v1',
  status,
  commitSha: gitHead,
  prerequisites: {
    f176Status: f176?.status ?? 'missing',
    f180Status: f180?.status ?? 'missing',
    worktreeClean: gitStatus.length === 0,
  },
  sites: {
    projectId: 'appgprj_6a576e3dc13881919e470d181d0f7bb8',
    attempted: true,
    tcpProbe,
    saveVersionAttempted: false,
    deployAttempted: false,
    reason:
      'Sites requires pushing the exact source commit before saving a version. The network push is blocked, so saving/deploying was intentionally skipped.',
  },
  staticDeploy: {
    recommendedProvider: 'vercel-static',
    archive: staticArchive,
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    postDeployEnv: 'PUBLIC_DEPLOY_URL=https://<final-url>/',
    postDeployCommands: [
      'npm run prepare:f154:public-smoke',
      'npm run test:f154:public-smoke',
      'npm run prepare:f158:deploy-target',
      'npm run test:f158:deploy-target',
    ],
  },
  artifacts,
  blockers,
  nextActions:
    status === 'sites-deploy-blocked-static-package-ready'
      ? [
          'Upload/import the repository or static dist package to Vercel/Netlify.',
          'Use npm run build and output directory dist.',
          'Copy the final HTTPS URL into PUBLIC_DEPLOY_URL.',
          'Rerun F154-F158 against the final URL.',
        ]
      : ['Proceed with Sites save/deploy when network allows source push.'],
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`);

const markdown = `# F181 - Deploy now handoff

Status: **${manifest.status}**

## Result

Sites deployment was attempted as the first option because the project has hosting metadata. The source push is blocked from this environment, so no Sites version was saved and no production deployment was created.

## Static Package

- Archive: \`${staticArchive.path}\`
- SHA-256: \`${staticArchive.sha256}\`
- Recommended provider: \`${manifest.staticDeploy.recommendedProvider}\`
- Build command: \`${manifest.staticDeploy.buildCommand}\`
- Output directory: \`${manifest.staticDeploy.outputDirectory}\`

## Manual Deploy Steps

- Import the repository in Vercel, or upload the static archive to a static host.
- Use build command \`npm run build\`.
- Use output directory \`dist\`.
- Do not publish \`.env\`, \`DATABASE_URL\`, DB dumps, private RAG corpus or clinical documents.
- After deployment, set \`${manifest.staticDeploy.postDeployEnv}\`.
- Rerun F154-F158 against the final URL.

## Blockers

${manifest.blockers.length > 0 ? manifest.blockers.map((item) => `- ${item}`).join('\n') : '- None.'}
`;

fs.writeFileSync(mdPath, markdown);
fs.writeFileSync(readmePath, markdown);

console.log(
  JSON.stringify(
    {
      status: manifest.status,
      archive: staticArchive.path,
      tcp: tcpProbe,
      blockers,
    },
    null,
    2,
  ),
);
