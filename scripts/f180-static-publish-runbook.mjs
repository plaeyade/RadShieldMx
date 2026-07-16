import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f180_static_publish_runbook');
const jsonPath = path.join(outputDir, 'f180_static_publish_runbook.json');
const mdPath = path.join(root, 'outputs', 'fase_180_static_publish_runbook.md');
const readmePath = path.join(outputDir, 'README_F180_STATIC_PUBLISH.md');

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function fileEvidence(relativePath) {
  const fullPath = path.join(root, relativePath);
  const present = fs.existsSync(fullPath);
  return {
    path: relativePath,
    present,
    bytes: present ? fs.statSync(fullPath).size : 0,
    sha256: present ? crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex') : null,
  };
}

const f176 = readJson('outputs/f176_local_smoke_final/f176_local_smoke_final.json');
const f178 = readJson('outputs/f178_alternate_deploy_readiness/f178_alternate_deploy_readiness.json');
const f179 = readJson('outputs/f179_deploy_lane_decision/f179_deploy_lane_decision.json');

const artifacts = [
  'vercel.json',
  'netlify.toml',
  'public/_redirects',
  'public/_headers',
  'dist/index.html',
  'dist/reset-cache.html',
  'package.json',
].map(fileEvidence);

const blockers = [];
if (f176?.status !== 'local-smoke-ready') blockers.push('F176 local smoke must be ready before static publish.');
if (f178?.status !== 'alternate-deploy-ready') blockers.push('F178 alternate deploy readiness must be ready.');
if (f179?.status !== 'deploy-lane-decided') blockers.push('F179 deploy lane decision must be ready.');
const missingArtifacts = artifacts.filter((item) => !item.present).map((item) => item.path);
if (missingArtifacts.length > 0) blockers.push(`Missing publish artifacts: ${missingArtifacts.join(', ')}`);

const manifest = {
  phase: 'F180',
  title: 'Static publish runbook',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.static-publish-runbook.f180.v1',
  status: blockers.length === 0 ? 'static-publish-runbook-ready' : 'static-publish-runbook-blocked',
  prerequisites: {
    f176Status: f176?.status ?? 'missing',
    f178Status: f178?.status ?? 'missing',
    f179Status: f179?.status ?? 'missing',
    selectedPrimaryLane: f179?.decision?.primary?.id ?? 'missing',
    selectedSecondaryLane: f179?.decision?.secondary?.id ?? 'missing',
  },
  artifacts,
  providers: [
    {
      id: 'vercel-static',
      recommended: true,
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      spaFallback: 'vercel.json rewrites every path to /index.html',
      steps: [
        'Create or open a Vercel account.',
        'Import the Git repository.',
        'Set Framework Preset to Vite if detected.',
        'Use build command: npm run build.',
        'Use output directory: dist.',
        'Do not add DATABASE_URL or private document secrets to the frontend project.',
        'Deploy and copy the final HTTPS URL.',
      ],
    },
    {
      id: 'netlify-static',
      recommended: false,
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      spaFallback: 'netlify.toml plus _redirects sends every route to /index.html',
      steps: [
        'Create or open a Netlify account.',
        'Import the Git repository or drag/drop the dist folder for a quick review build.',
        'Use build command: npm run build.',
        'Use publish directory: dist.',
        'Confirm _redirects and _headers are present in the published output.',
        'Deploy and copy the final HTTPS URL.',
      ],
    },
    {
      id: 'cloudflare-pages',
      recommended: false,
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      spaFallback: '_redirects sends every route to /index.html',
      steps: [
        'Create or open a Cloudflare Pages project.',
        'Connect the Git repository.',
        'Use build command: npm run build.',
        'Use build output directory: dist.',
        'Verify _redirects is published.',
        'Deploy and copy the final HTTPS URL.',
      ],
    },
    {
      id: 'vps-fullstack',
      recommended: false,
      buildCommand: 'npm run build && npm run build:backend',
      outputDirectory: 'dist plus dist-backend',
      spaFallback: 'Nginx try_files fallback to /index.html',
      steps: [
        'Provision a server with Node, MySQL, Nginx and TLS.',
        'Deploy dist and dist-backend.',
        'Configure backend environment variables on the server only.',
        'Run DB backup/restore and health checks.',
        'Use this lane for clinical multi-user release, not the first public demo URL.',
      ],
    },
  ],
  secretPolicy: {
    forbiddenOnStaticHosts: [
      '.env',
      'DATABASE_URL',
      'DB dumps',
      'private RAG corpus',
      'clinical PDFs',
      'OpenAI/provider API keys',
      'MySQL credentials',
      'signed cookie secrets',
    ],
    allowedOnStaticHosts: [
      'public frontend bundle',
      'public documentation',
      'static icons/assets',
      'reset-cache.html',
      'non-sensitive release metadata',
    ],
  },
  postDeploySmoke: {
    env: 'PUBLIC_DEPLOY_URL=https://<final-url>/',
    commands: [
      'npm run prepare:f154:public-smoke',
      'npm run test:f154:public-smoke',
      'npm run prepare:f155:release-decision',
      'npm run test:f155:release-decision',
      'npm run prepare:f156:final-package',
      'npm run test:f156:final-package',
      'npm run prepare:f157:operational-closure',
      'npm run test:f157:operational-closure',
      'npm run prepare:f158:deploy-target',
      'npm run test:f158:deploy-target',
    ],
  },
  goNoGo: {
    goForPublicDemo:
      'A static provider serves the app over HTTPS, reset-cache.html works, menus/canvas render, and F154-F158 pass with PUBLIC_DEPLOY_URL.',
    noGoForClinicalRelease:
      'A static-only host is not enough for protected projects, DB persistence, private RAG, secrets, audit trail or multi-user clinical operations.',
  },
  blockers,
  nextActions:
    blockers.length === 0
      ? [
          'Publish the static frontend through Vercel first.',
          'Copy the final URL into PUBLIC_DEPLOY_URL.',
          'Repeat F154-F158 against the final URL.',
          'Keep VPS full-stack as the clinical release lane.',
        ]
      : ['Resolve blockers and rerun F180.'],
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`);

const providerSections = manifest.providers
  .map(
    (provider) => `### ${provider.id}

- Recommended now: ${provider.recommended ? 'yes' : 'no'}
- Build: \`${provider.buildCommand}\`
- Output: \`${provider.outputDirectory}\`
- SPA fallback: ${provider.spaFallback}

${provider.steps.map((step) => `- ${step}`).join('\n')}
`,
  )
  .join('\n');

const markdown = `# F180 - Static publish runbook

Status: **${manifest.status}**

## Purpose

F180 turns the F179 deploy-lane decision into an operator-ready publication guide. The target is a fast public frontend URL first, followed by F154-F158 smoke against that URL.

## Provider Runbooks

${providerSections}
## Secret Policy

Forbidden on static hosts:

${manifest.secretPolicy.forbiddenOnStaticHosts.map((item) => `- ${item}`).join('\n')}

Allowed on static hosts:

${manifest.secretPolicy.allowedOnStaticHosts.map((item) => `- ${item}`).join('\n')}

## Post-Deploy Smoke

- Env: \`${manifest.postDeploySmoke.env}\`

${manifest.postDeploySmoke.commands.map((command) => `- \`${command}\``).join('\n')}

## GO / NO-GO

- GO public demo: ${manifest.goNoGo.goForPublicDemo}
- NO-GO clinical release: ${manifest.goNoGo.noGoForClinicalRelease}

## Blockers

${manifest.blockers.length > 0 ? manifest.blockers.map((item) => `- ${item}`).join('\n') : '- None.'}
`;

fs.writeFileSync(mdPath, markdown);
fs.writeFileSync(readmePath, markdown);

console.log(JSON.stringify({ status: manifest.status, output: path.relative(root, jsonPath), blockers }, null, 2));
