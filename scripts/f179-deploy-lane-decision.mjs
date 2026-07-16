import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f179_deploy_lane_decision');
const jsonPath = path.join(outputDir, 'f179_deploy_lane_decision.json');
const mdPath = path.join(root, 'outputs', 'fase_179_deploy_lane_decision.md');
const readmePath = path.join(outputDir, 'README_F179_DEPLOY_LANE.md');

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function sha256(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
}

function artifact(relativePath) {
  const fullPath = path.join(root, relativePath);
  const present = fs.existsSync(fullPath);
  return {
    path: relativePath,
    present,
    bytes: present ? fs.statSync(fullPath).size : 0,
    sha256: present ? sha256(relativePath) : null,
  };
}

const f176 = readJson('outputs/f176_local_smoke_final/f176_local_smoke_final.json');
const f177 = readJson('outputs/f177_sites_deploy_retry/f177_sites_deploy_retry.json');
const f178 = readJson('outputs/f178_alternate_deploy_readiness/f178_alternate_deploy_readiness.json');

const requiredArtifacts = [
  'vercel.json',
  'netlify.toml',
  'public/_redirects',
  'public/_headers',
  'dist/index.html',
  'dist/reset-cache.html',
];

const artifacts = requiredArtifacts.map(artifact);
const missingArtifacts = artifacts.filter((item) => !item.present).map((item) => item.path);
const blockers = [];

if (f176?.status !== 'local-smoke-ready') {
  blockers.push('F176 local smoke is not ready.');
}
if (f178?.status !== 'alternate-deploy-ready') {
  blockers.push('F178 alternate deploy readiness is not ready.');
}
if (missingArtifacts.length > 0) {
  blockers.push(`Missing deploy artifacts: ${missingArtifacts.join(', ')}`);
}

const sitesNetworkGated = f177?.status === 'sites-deploy-network-gated';
const status = blockers.length === 0 ? 'deploy-lane-decided' : 'deploy-lane-blocked';

const manifest = {
  phase: 'F179',
  title: 'Deploy lane decision',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.deploy-lane-decision.f179.v1',
  status,
  evidence: {
    f176Status: f176?.status ?? 'missing',
    f177Status: f177?.status ?? 'missing',
    f178Status: f178?.status ?? 'missing',
    sitesNetworkGated,
  },
  decision: {
    primary: {
      id: 'vercel-static',
      label: 'Vercel static frontend',
      reason:
        'Fastest low-friction public review URL using the existing dist build, SPA fallback and no server administration.',
      scope:
        'Frontend demo/review only: canvas, menus, documentation views, static assets and local/offline evidence surfaces.',
      requiredAfterDeploy: ['Set PUBLIC_DEPLOY_URL to the final HTTPS URL.', 'Rerun F154-F158 against that URL.'],
    },
    secondary: {
      id: 'vps-fullstack',
      label: 'VPS full-stack clinical lane',
      reason:
        'Required for serious multi-user clinical release with backend API, Windows/MySQL-equivalent DB, secrets, RAG seed, backups and auth controls.',
      scope:
        'Clinical/staging/production lane: frontend, API, database persistence, private documents, restore probes and operational monitoring.',
      requiredBeforeGoLive: ['F153 restore probe ready.', 'F154 public smoke ready.', 'F155 release decision GO.'],
    },
    fallback: {
      id: 'local-offline',
      label: 'Validated local/offline package',
      reason:
        'Already validated by F175-F176 and safe while public hosting or git.chatgpt-team.site access remains blocked.',
      scope: 'Immediate local delivery, tester review and visual QA on 127.0.0.1.',
    },
    deferred: [
      {
        id: 'sites-hosting',
        reason: 'Keep deferred until outbound HTTPS to git.chatgpt-team.site:443 is reachable from Codex.',
      },
      {
        id: 'static-clinical-release',
        reason: 'Static hosts must not carry DATABASE_URL, secrets, DB dumps or private document corpora.',
      },
    ],
  },
  artifacts,
  releasePolicy: [
    'Use Vercel static first only for a public frontend/demo URL.',
    'Do not publish .env, DATABASE_URL, DB dumps, private RAG corpora or protected clinical files to static hosting.',
    'After any public URL exists, set PUBLIC_DEPLOY_URL and rerun F154-F158.',
    'Use VPS/full-stack for clinical multi-user release, backend API, MySQL, RAG seed, backups, secrets and audit operations.',
    'Sites remains valid but network-gated until git.chatgpt-team.site:443 is reachable.',
  ],
  operatorChecklist: [
    'Connect/import the Git repository into Vercel, or use another static provider from F178.',
    'Build command: npm run build.',
    'Output directory: dist.',
    'Confirm SPA fallback is active through vercel.json.',
    'Open the final HTTPS URL and verify menus, canvas and reset-cache.html.',
    'Set PUBLIC_DEPLOY_URL and rerun npm run prepare:f154:public-smoke through npm run test:f158:deploy-target.',
    'For the clinical lane, provision VPS/Node/MySQL/Nginx/TLS and keep secrets outside the frontend bundle.',
  ],
  blockers,
  nextActions:
    status === 'deploy-lane-decided'
      ? [
          'Proceed with Vercel static for the first public URL.',
          'Keep VPS full-stack as the release-grade clinical lane.',
          'Rerun F154-F158 after the final URL is available.',
        ]
      : ['Resolve blockers, rerun F176/F178 if needed, then repeat F179.'],
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`);

const markdown = `# F179 - Deploy lane decision

Status: **${manifest.status}**

## Decision

- Primary lane: **${manifest.decision.primary.id}** - ${manifest.decision.primary.label}
- Secondary lane: **${manifest.decision.secondary.id}** - ${manifest.decision.secondary.label}
- Fallback lane: **${manifest.decision.fallback.id}** - ${manifest.decision.fallback.label}

## Why

F177 shows Sites is still ${sitesNetworkGated ? 'network-gated' : 'available/unknown'} and F178 prepared alternate hosting. The lowest-risk path to a public review URL is a static frontend deployment now, followed by a full-stack VPS lane for the clinical release.

## Guardrails

${manifest.releasePolicy.map((item) => `- ${item}`).join('\n')}

## Operator checklist

${manifest.operatorChecklist.map((item) => `- ${item}`).join('\n')}

## Blockers

${manifest.blockers.length > 0 ? manifest.blockers.map((item) => `- ${item}`).join('\n') : '- None for the static deploy lane.'}
`;

fs.writeFileSync(mdPath, markdown);
fs.writeFileSync(readmePath, markdown);

console.log(JSON.stringify({ status: manifest.status, output: path.relative(root, jsonPath), blockers }, null, 2));
