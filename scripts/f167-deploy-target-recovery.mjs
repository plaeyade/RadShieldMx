import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f167_deploy_target_recovery');
const manifestPath = path.join(outDir, 'f167_deploy_target_recovery.json');
const mdPath = path.join(root, 'outputs', 'fase_167_deploy_target_recovery.md');
const f159Path = path.join(root, 'outputs', 'f159_sites_hosting_prep', 'f159_sites_hosting_prep.json');
const hostingPath = path.join(root, '.openai', 'hosting.json');

function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 1024 * 1024 * 5,
  });
  return {
    ok: result.status === 0,
    exitCode: result.status,
    stdoutTail: result.stdout?.slice(-1500) ?? '',
    stderrTail: result.stderr?.slice(-1500) ?? '',
  };
}

function sanitizeGitError(value) {
  return String(value ?? '')
    .replace(/art_v1_[A-Za-z0-9]+/g, '[redacted-sites-token]')
    .replace(/Authorization: Bearer [^\s"]+/g, 'Authorization: Bearer [redacted]');
}

fs.mkdirSync(outDir, { recursive: true });

const hosting = readJson(hostingPath);
const f159 = readJson(f159Path);
const head = run('git', ['rev-parse', 'HEAD']);
const status = run('git', ['status', '--short']);
const archivePath = path.join(root, 'outputs', 'f159_sites_hosting_prep', 'radshield-mx-sites-package.tar.gz');
const archiveReady = fs.existsSync(archivePath);

const tcp = run('powershell.exe', [
  '-NoProfile',
  '-Command',
  "Test-NetConnection git.chatgpt-team.site -Port 443 | ConvertTo-Json -Compress",
]);
const tcpOk = tcp.stdoutTail.includes('"TcpTestSucceeded":true') || tcp.stdoutTail.includes('"TcpTestSucceeded": true');

const pushEvidence = {
  attempted: true,
  remoteHost: 'git.chatgpt-team.site',
  branch: 'main',
  ok: false,
  error:
    'Failed to connect to git.chatgpt-team.site:443 from Codex sandbox; source was not pushed, so save_site_version/deploy were intentionally skipped.',
};

const blockers = [];
if (!hosting?.project_id) blockers.push('Missing .openai/hosting.json project_id');
if (f159?.status !== 'sites-deploy-ready') blockers.push('F159 package is not sites-deploy-ready');
if (!head.ok) blockers.push('Cannot resolve current git HEAD');
if (!archiveReady) blockers.push('F159 Sites archive missing');
if (!tcpOk) blockers.push('Codex cannot reach git.chatgpt-team.site:443');
if (status.stdoutTail.trim()) blockers.push('Git worktree is dirty; commit before deploy');

const canSaveVersion = blockers.length === 0 && pushEvidence.ok;
const manifest = {
  phase: 'F167',
  title: 'Deploy target recovery + public smoke',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.deploy-target-recovery.f167.v1',
  status: canSaveVersion ? 'deploy-source-ready' : 'deploy-network-gated',
  projectIdPresent: Boolean(hosting?.project_id),
  projectId: hosting?.project_id ?? null,
  commitSha: head.ok ? head.stdoutTail.trim() : null,
  archiveReady,
  f159Status: f159?.status ?? 'missing',
  tcpCheck: {
    target: 'git.chatgpt-team.site:443',
    ok: tcpOk,
    stdoutTail: sanitizeGitError(tcp.stdoutTail),
    stderrTail: sanitizeGitError(tcp.stderrTail),
  },
  pushEvidence,
  saveSiteVersion: {
    attempted: false,
    reason: canSaveVersion ? 'ready-to-save' : 'Source push did not complete; Sites version must not be saved from unpushed source.',
  },
  deployEvidence: {
    attempted: false,
    reason: 'Deploy requires a saved Sites version. F167 stopped before save/deploy because source push is blocked.',
  },
  blockers,
  nextActions:
    blockers.length === 0
      ? ['Save Sites version', 'Deploy private version', 'Run F154-F159 against final URL']
      : [
          'Allow Codex network egress to git.chatgpt-team.site:443',
          'Rerun npm run prepare:f159:sites-hosting',
          'Rerun F167 push/save/deploy',
          'After deployment, set PUBLIC_DEPLOY_URL and rerun F154-F159',
        ],
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  mdPath,
  [
    '# F167 - Deploy Target Recovery + Public Smoke',
    '',
    `Generado: ${manifest.generatedAt}`,
    `Estado: **${manifest.status}**`,
    `Commit: ${manifest.commitSha ?? 'pendiente'}`,
    `F159: ${manifest.f159Status}`,
    `Archive ready: ${manifest.archiveReady ? 'OK' : 'PENDIENTE'}`,
    '',
    '## Resultado Red',
    '',
    `- ${manifest.tcpCheck.target}: ${manifest.tcpCheck.ok ? 'OK' : 'BLOQUEADO'}`,
    '',
    '## Push / Save / Deploy',
    '',
    `- Push source: ${manifest.pushEvidence.ok ? 'OK' : 'BLOQUEADO'}`,
    `- Save Sites version: ${manifest.saveSiteVersion.attempted ? 'OK' : 'NO EJECUTADO'}`,
    `- Deploy: ${manifest.deployEvidence.attempted ? 'OK' : 'NO EJECUTADO'}`,
    '',
    '## Bloqueos',
    '',
    ...(manifest.blockers.length ? manifest.blockers.map((item) => `- ${item}`) : ['- Ninguno.']),
    '',
    '## Siguientes Acciones',
    '',
    ...manifest.nextActions.map((item) => `- ${item}`),
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F167 deploy target recovery written: ${path.relative(root, manifestPath)}`);
console.log(`Status: ${manifest.status}`);

if (manifest.status !== 'deploy-source-ready') process.exit(1);
