import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f178_alternate_deploy_readiness');
const jsonPath = path.join(outDir, 'f178_alternate_deploy_readiness.json');
const mdPath = path.join(root, 'outputs', 'fase_178_alternate_deploy_readiness.md');
const guidePath = path.join(outDir, 'README_F178_ALTERNATE_DEPLOY.md');
fs.mkdirSync(outDir, { recursive: true });

function sha256(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
}

function fileInfo(relativePath) {
  const full = path.join(root, relativePath);
  const present = fs.existsSync(full) && fs.statSync(full).isFile();
  return {
    path: relativePath,
    present,
    bytes: present ? fs.statSync(full).size : 0,
    sha256: present ? sha256(relativePath) : null,
  };
}

function readJson(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

const f176 = readJson('outputs/f176_local_smoke_final/f176_local_smoke_final.json');
const f177 = readJson('outputs/f177_sites_deploy_retry/f177_sites_deploy_retry.json');
const artifacts = [
  fileInfo('vercel.json'),
  fileInfo('netlify.toml'),
  fileInfo('public/_redirects'),
  fileInfo('public/_headers'),
  fileInfo('dist/index.html'),
  fileInfo('dist/reset-cache.html'),
  fileInfo('dist/_redirects'),
  fileInfo('dist/_headers'),
  fileInfo('dist-backend/server/boot.js'),
  fileInfo('docker-compose.yml'),
  fileInfo('Dockerfile'),
  fileInfo('nginx.conf'),
];

const providers = [
  {
    id: 'vercel-static',
    label: 'Vercel static frontend',
    readiness: 'ready-after-account-connect',
    bestFor: 'Public frontend URL fast, no server management.',
    limitation: 'Backend, MySQL and private RAG need separate API hosting.',
    commandHint: 'Import Git repo in Vercel or run vercel with outputDirectory=dist.',
  },
  {
    id: 'netlify-static',
    label: 'Netlify static frontend',
    readiness: 'ready-after-account-connect',
    bestFor: 'Fast static hosting with SPA fallback from netlify.toml/_redirects.',
    limitation: 'Backend/API must be deployed separately.',
    commandHint: 'Import Git repo in Netlify; build npm run build; publish dist.',
  },
  {
    id: 'cloudflare-pages',
    label: 'Cloudflare Pages static frontend',
    readiness: 'ready-after-account-connect',
    bestFor: 'Static frontend close to Sites model, using dist and _redirects.',
    limitation: 'Backend/API and MySQL still require external services or Workers integration.',
    commandHint: 'Create Pages project; build npm run build; output dist.',
  },
  {
    id: 'vps-fullstack',
    label: 'VPS full-stack',
    readiness: 'manual-server-required',
    bestFor: 'Frontend, backend, MySQL, RAG seed and controlled secrets in one environment.',
    limitation: 'Requires server, firewall, TLS, backups and operations.',
    commandHint: 'Provision VPS, install Node/MySQL/Nginx, deploy dist + dist-backend, configure .env.',
  },
  {
    id: 'local-offline',
    label: 'Local/offline validated package',
    readiness: 'ready-now',
    bestFor: 'Immediate validated delivery while public hosting is blocked.',
    limitation: 'Not a public URL; runs on local machine/network only.',
    commandHint: 'Use http://127.0.0.1:4175/ and reset-cache.html.',
  },
];

const requiredReadyFiles = ['vercel.json', 'netlify.toml', 'public/_redirects', 'public/_headers', 'dist/index.html', 'dist/reset-cache.html'];
const blockers = [];
for (const file of requiredReadyFiles) {
  if (!fs.existsSync(path.join(root, file))) blockers.push(`Missing ${file}`);
}
if (f176?.status !== 'local-smoke-ready') blockers.push('F176 local smoke is not ready.');
if (f177?.status !== 'sites-deploy-network-gated' && f177?.status !== 'sites-deploy-source-ready') {
  blockers.push('F177 deploy retry evidence is missing or invalid.');
}

const status = blockers.length ? 'alternate-deploy-gated' : 'alternate-deploy-ready';
const manifest = {
  phase: 'F178',
  title: 'Alternate deploy readiness',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.alternate-deploy-readiness.f178.v1',
  status,
  sitesStatus: f177?.status ?? 'missing',
  recommendedOrder: ['local-offline', 'vercel-static', 'netlify-static', 'cloudflare-pages', 'vps-fullstack'],
  artifacts,
  providers,
  releasePolicy: [
    'Static providers are acceptable for public frontend demo/review only.',
    'Clinical multi-user release requires backend/API, database, secrets, backup and auth hardening.',
    'After any alternate public deployment, set PUBLIC_DEPLOY_URL and rerun F154-F158.',
    'Do not publish secrets, DATABASE_URL, DB dumps or private document corpora to static hosts.',
  ],
  blockers,
  nextActions: status === 'alternate-deploy-ready'
    ? [
        'Choose provider: Vercel, Netlify, Cloudflare Pages, VPS or local/offline.',
        'Deploy static frontend first if a public URL is needed quickly.',
        'For full product release, prepare VPS/API/MySQL deployment and rerun F154-F158.',
      ]
    : [
        'Run npm run build.',
        'Run npm run prepare:f176:local-smoke.',
        'Rerun npm run prepare:f178:alternate-deploy.',
      ],
};

fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const guide = [
  '# F178 Alternate Deploy Readiness',
  '',
  `Generated: ${manifest.generatedAt}`,
  `Status: ${manifest.status}`,
  '',
  '## Recommended Order',
  '',
  ...manifest.recommendedOrder.map((id, index) => {
    const provider = providers.find((item) => item.id === id);
    return `${index + 1}. ${provider.label}: ${provider.bestFor}`;
  }),
  '',
  '## Provider Notes',
  '',
  ...providers.map((provider) => [
    `### ${provider.label}`,
    `- Readiness: ${provider.readiness}`,
    `- Best for: ${provider.bestFor}`,
    `- Limitation: ${provider.limitation}`,
    `- Command hint: ${provider.commandHint}`,
  ].join('\n')),
  '',
  '## Release Policy',
  '',
  ...manifest.releasePolicy.map((item) => `- ${item}`),
  '',
].join('\n');

fs.writeFileSync(guidePath, guide, 'utf8');
fs.writeFileSync(mdPath, [
  '# F178 - Alternate Deploy Readiness',
  '',
  `Generado: ${manifest.generatedAt}`,
  `Estado: **${manifest.status}**`,
  `Sites: ${manifest.sitesStatus}`,
  '',
  '## Proveedores',
  '',
  ...providers.map((provider) => `- ${provider.label}: ${provider.readiness} / ${provider.limitation}`),
  '',
  '## Politica',
  '',
  ...manifest.releasePolicy.map((item) => `- ${item}`),
  '',
  '## Bloqueos',
  '',
  ...(blockers.length ? blockers.map((item) => `- ${item}`) : ['- Ninguno.']),
  '',
].join('\n'), 'utf8');

console.log(`F178 alternate deploy readiness ${status}.`);
if (status !== 'alternate-deploy-ready') process.exit(1);
