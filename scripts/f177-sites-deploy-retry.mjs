import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f177_sites_deploy_retry');
const jsonPath = path.join(outDir, 'f177_sites_deploy_retry.json');
const mdPath = path.join(root, 'outputs', 'fase_177_sites_deploy_retry.md');
fs.mkdirSync(outDir, { recursive: true });

function readJson(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function git(args) {
  const gitExe = 'C:\\Program Files\\Git\\cmd\\git.exe';
  const command = fs.existsSync(gitExe) ? gitExe : 'git';
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', shell: false });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function tcpProbe(host, port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (ok, message) => {
      socket.destroy();
      resolve({ host, port, ok, message });
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true, 'connected'));
    socket.once('timeout', () => finish(false, 'timeout'));
    socket.once('error', (error) => finish(false, error.message));
  });
}

const hosting = readJson('.openai/hosting.json');
const f159 = readJson('outputs/f159_sites_hosting_prep/f159_sites_hosting_prep.json');
const f176 = readJson('outputs/f176_local_smoke_final/f176_local_smoke_final.json');
const head = git(['rev-parse', 'HEAD']);
const branch = git(['branch', '--show-current']);
const status = git(['status', '--short']);
const tcp = await tcpProbe('git.chatgpt-team.site', 443);

const blockers = [];
if (!hosting?.project_id) blockers.push('Missing Sites project_id.');
if (f159?.status !== 'sites-deploy-ready') blockers.push('F159 Sites package is not ready.');
if (f176?.status !== 'local-smoke-ready') blockers.push('F176 local smoke is not ready.');
if (!head.ok) blockers.push('Git HEAD unavailable.');
if (status.stdout) blockers.push('Git worktree has uncommitted changes.');
if (!tcp.ok) blockers.push('Cannot reach git.chatgpt-team.site:443 from this environment.');

const manifest = {
  phase: 'F177',
  title: 'Sites deploy retry',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.sites-deploy-retry.f177.v1',
  status: blockers.length ? 'sites-deploy-network-gated' : 'sites-deploy-source-ready',
  projectIdPresent: Boolean(hosting?.project_id),
  projectId: hosting?.project_id ?? null,
  commitSha: head.stdout || null,
  branch: branch.stdout || null,
  f159Status: f159?.status ?? 'missing',
  f176Status: f176?.status ?? 'missing',
  archive: f159?.artifacts?.archive ?? null,
  tcpProbe: tcp,
  pushPolicy: {
    attemptedByConnectorFlow: false,
    reason: tcp.ok
      ? 'Network probe passed; use short-lived Sites credential to push exact HEAD.'
      : 'Network probe failed; source push/save/deploy must not proceed.',
  },
  saveSiteVersion: {
    attempted: false,
    reason: 'Sites version can only be saved after exact source state is pushed.',
  },
  deployEvidence: {
    attempted: false,
    reason: 'Deploy requires a saved Sites version.',
  },
  blockers,
  nextActions: blockers.length
    ? [
        'Allow outbound HTTPS to git.chatgpt-team.site:443 from Codex.',
        'Rerun F177 to push source, save Sites version and deploy.',
        'If network remains blocked, use Vercel/Netlify/Cloudflare Pages or a VPS deployment path.',
      ]
    : [
        'Create short-lived Sites source credential.',
        'Push exact HEAD to Sites source repository.',
        'Save Sites version with the current archive and commit SHA.',
        'Deploy saved version and rerun F154-F158 against the deployed URL.',
      ],
};

fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F177 - Sites Deploy Retry',
  '',
  `Generado: ${manifest.generatedAt}`,
  `Estado: **${manifest.status}**`,
  `Commit: ${manifest.commitSha ?? 'pendiente'}`,
  '',
  '## Estado',
  '',
  `- F159 Sites package: ${manifest.f159Status}`,
  `- F176 local smoke: ${manifest.f176Status}`,
  `- TCP git.chatgpt-team.site:443: ${manifest.tcpProbe.ok ? 'OK' : manifest.tcpProbe.message}`,
  '',
  '## Bloqueos',
  '',
  ...(manifest.blockers.length ? manifest.blockers.map((item) => `- ${item}`) : ['- Ninguno.']),
  '',
  '## Siguientes acciones',
  '',
  ...manifest.nextActions.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F177 Sites deploy retry ${manifest.status}.`);
if (manifest.status !== 'sites-deploy-source-ready') process.exit(1);
