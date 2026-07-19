import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f200_static_frontend_release_gate');
const jsonPath = path.join(outputDir, 'f200_static_frontend_release_gate.json');
const mdPath = path.join(root, 'outputs', 'fase_200_static_frontend_release_gate.md');
const readmePath = path.join(outputDir, 'README_F200_STATIC_FRONTEND_RELEASE_GATE.md');
const archivePath = path.join(outputDir, 'radshield-mx-f200-static-dist.zip');

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
    sha256: present && fs.statSync(fullPath).isFile() ? sha256File(fullPath) : null,
  };
}

function git(args) {
  const gitExe = fs.existsSync('C:\\Program Files\\Git\\cmd\\git.exe') ? 'C:\\Program Files\\Git\\cmd\\git.exe' : 'git';
  return execFileSync(gitExe, args, { cwd: root, encoding: 'utf8' }).trim();
}

function ensureArchive() {
  fs.mkdirSync(outputDir, { recursive: true });
  if (fs.existsSync(archivePath)) fs.rmSync(archivePath, { force: true });
  const distGlob = path.join(root, 'dist', '*');
  execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path '${distGlob}' -DestinationPath '${archivePath}' -Force`,
    ],
    { stdio: 'pipe' },
  );
  return fileEvidence(path.relative(root, archivePath));
}

const f197 = readJson('outputs/f197_menu_canvas_smoke_result.json');
const f198 = readJson('outputs/f198_full_menu_function_smoke_result.json');
const f199 = readJson('outputs/f199_output_smoke_result.json');

const commitSha = git(['rev-parse', 'HEAD']);
const gitStatus = git(['status', '--short']);
const staticArchive = ensureArchive();

const artifacts = [
  fileEvidence('dist/index.html'),
  fileEvidence('vercel.json'),
  fileEvidence('netlify.toml'),
  fileEvidence('public/_redirects'),
  fileEvidence('public/_headers'),
  fileEvidence('outputs/f199_output_smoke_result.json'),
  fileEvidence('outputs/fase_199_output_smoke_result.md'),
  staticArchive,
];

const gates = [
  {
    id: 'f197-menu-canvas',
    label: 'F197 menu/canvas recovery smoke',
    status: f197?.ok === true ? 'pass' : 'missing-or-fail',
    evidence: 'outputs/f197_menu_canvas_smoke_result.json',
  },
  {
    id: 'f198-full-menus',
    label: 'F198 full canonical menu smoke',
    status: f198?.ok === true ? 'pass' : 'missing-or-fail',
    evidence: 'outputs/f198_full_menu_function_smoke_result.json',
  },
  {
    id: 'f199-output-surfaces',
    label: 'F199 Memoria/PDF/CNSNS/Evidence output smoke',
    status: f199?.ok === true ? 'pass' : 'missing-or-fail',
    evidence: 'outputs/f199_output_smoke_result.json',
  },
  {
    id: 'static-hosting-config',
    label: 'Vercel/Netlify SPA static hosting config',
    status:
      fs.existsSync(path.join(root, 'vercel.json')) &&
      fs.existsSync(path.join(root, 'netlify.toml')) &&
      fs.existsSync(path.join(root, 'public', '_redirects'))
        ? 'pass'
        : 'missing-or-fail',
    evidence: 'vercel.json, netlify.toml, public/_redirects',
  },
  {
    id: 'dist-package',
    label: 'Production dist package',
    status: staticArchive.present && staticArchive.bytes > 0 ? 'pass' : 'missing-or-fail',
    evidence: staticArchive.path,
  },
];

const blockers = [];
for (const gate of gates) {
  if (gate.status !== 'pass') blockers.push(`${gate.id}: ${gate.label}`);
}
for (const artifact of artifacts) {
  if (!artifact.present) blockers.push(`missing artifact: ${artifact.path}`);
}

const publicDeployUrl = process.env.PUBLIC_DEPLOY_URL || 'https://radshield-mx-static-dist.vercel.app/';
const status = blockers.length === 0 ? 'static-frontend-release-ready' : 'static-frontend-release-gated';

const manifest = {
  phase: 'F200',
  title: 'Static frontend release gate',
  schema: 'radshield-mx.static-frontend-release-gate.f200.v1',
  generatedAt: new Date().toISOString(),
  status,
  commitSha,
  worktreeClean: gitStatus.length === 0,
  worktreeWarning: gitStatus.length === 0 ? null : 'Local changes are present while preparing F200; commit after validation.',
  publicDeployUrl,
  gates,
  artifacts,
  releaseScope: {
    frontend: 'ready for static public review when uploaded/deployed from current dist',
    backend: 'not included in this static gate',
    database: 'not included in this static gate',
    clinicalUse: 'requires professional review, DB-backed citations and final public URL smoke before clinical release',
  },
  postDeployValidation: [
    'Set PUBLIC_DEPLOY_URL to the final HTTPS URL.',
    'Run F202 public Vercel smoke against that URL; if Codex network is blocked, keep the network-gated evidence and validate from an unrestricted browser.',
    'Validate canvas/sidebar, menus, Memoria IA, PDF, Evidence Pack and CNSNS outputs in the hosted build.',
    'Do not publish secrets, DB dumps, private PDFs or RAG corpus.',
  ],
  blockers,
  nextRecommendedPhase:
    blockers.length === 0
      ? 'F202 public URL smoke against deployed Vercel/Netlify URL or network-gated browser verification'
      : 'Fix missing gates, rerun F197-F199, rebuild dist, then rerun F200',
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const markdown = `# F200 - Static Frontend Release Gate

Status: **${manifest.status}**

## Scope

F200 freezes the current frontend build as a static release candidate. It does not claim full-stack, DB-live or clinical certification.

## Public URL

- Suggested/current URL: \`${manifest.publicDeployUrl}\`
- Commit: \`${manifest.commitSha}\`
- Static archive: \`${staticArchive.path}\`
- Archive SHA-256: \`${staticArchive.sha256}\`

## Gates

${manifest.gates.map((gate) => `- ${gate.status === 'pass' ? 'PASS' : 'FAIL'} ${gate.id}: ${gate.label} (${gate.evidence})`).join('\n')}

## Post-Deploy Validation

${manifest.postDeployValidation.map((item) => `- ${item}`).join('\n')}

## Blockers

${manifest.blockers.length > 0 ? manifest.blockers.map((item) => `- ${item}`).join('\n') : '- None for static frontend release.'}

## Next

${manifest.nextRecommendedPhase}
`;

fs.writeFileSync(mdPath, markdown, 'utf8');
fs.writeFileSync(readmePath, markdown, 'utf8');

console.log(
  JSON.stringify(
    {
      status: manifest.status,
      archive: staticArchive.path,
      publicDeployUrl: manifest.publicDeployUrl,
      gates: manifest.gates.map((gate) => `${gate.id}:${gate.status}`),
      blockers: manifest.blockers,
    },
    null,
    2,
  ),
);

if (manifest.status !== 'static-frontend-release-ready') process.exit(1);
