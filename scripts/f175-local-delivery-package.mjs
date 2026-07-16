import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f175_local_delivery_package');
const manifestPath = path.join(outDir, 'f175_local_delivery_package.json');
const readmePath = path.join(outDir, 'README_F175_LOCAL_DELIVERY.md');
const mdPath = path.join(root, 'outputs', 'fase_175_local_delivery_package.md');

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

function latestAsset(prefix, ext) {
  const assetsDir = path.join(root, 'dist', 'assets');
  if (!fs.existsSync(assetsDir)) return null;
  const candidates = fs.readdirSync(assetsDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith(ext))
    .map((name) => path.join('dist', 'assets', name))
    .sort((a, b) => fs.statSync(path.join(root, b)).mtimeMs - fs.statSync(path.join(root, a)).mtimeMs);
  return candidates[0] ?? null;
}

const evidence = [
  ['F153', 'outputs/f153_db_backup_restore/f153_db_backup_restore.json'],
  ['F156', 'outputs/f156_final_package/f156_final_package.json'],
  ['F172', 'outputs/f172_release_candidate_final/f172_release_candidate_final.json'],
  ['F173', 'outputs/f173_canvas_low_risk_polish/f173_canvas_low_risk_polish.json'],
  ['F174A', 'outputs/f174a_predeploy_hardening/f174a_predeploy_hardening.json'],
].map(([phase, relativePath]) => {
  const manifest = readJson(relativePath);
  return {
    phase,
    ...fileInfo(relativePath),
    status: manifest?.status ?? 'missing',
    decision: manifest?.decision ?? null,
    schema: manifest?.schema ?? null,
  };
});

const artifacts = [
  fileInfo('dist/index.html'),
  fileInfo('dist/reset-cache.html'),
  fileInfo(latestAsset('index-', '.js') ?? 'dist/assets/index-unknown.js'),
  fileInfo(latestAsset('index-', '.css') ?? 'dist/assets/index-unknown.css'),
  fileInfo('dist-backend/server/boot.js'),
  fileInfo('MANUAL_VERSIONES_v50.md'),
  fileInfo('CHANGELOG.md'),
  fileInfo('MANUAL_USUARIO_v99.md'),
];

const missingArtifacts = artifacts.filter((item) => !item.present).map((item) => item.path);
const missingEvidence = evidence.filter((item) => !item.present).map((item) => item.phase);
const f174aReady = evidence.some((item) => item.phase === 'F174A' && item.status === 'predeploy-hardening-ready');
const resetReady = artifacts.some((item) => item.path === 'dist/reset-cache.html' && item.present);
const frontendReady = artifacts.some((item) => item.path === 'dist/index.html' && item.present);

const blockingReasons = [];
if (missingArtifacts.length) blockingReasons.push(`Missing artifacts: ${missingArtifacts.join(', ')}`);
if (missingEvidence.length) blockingReasons.push(`Missing evidence: ${missingEvidence.join(', ')}`);
if (!f174aReady) blockingReasons.push('F174A predeploy hardening is not ready');
if (!resetReady) blockingReasons.push('Cache reset page is missing');
if (!frontendReady) blockingReasons.push('Frontend dist is missing');

const status = blockingReasons.length ? 'local-delivery-gated' : 'local-delivery-ready';
const manifest = {
  phase: 'F175',
  title: 'Local delivery package + cache recovery',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.local-delivery-package.f175.v1',
  status,
  localUrls: {
    currentPreview: 'http://127.0.0.1:4174/',
    freshStaticFallback: 'http://127.0.0.1:4175/',
    cacheReset: 'http://127.0.0.1:4175/reset-cache.html',
  },
  diagnosis: [
    'If menus/canvas disappear after a new build, the most likely cause is stale service worker or radshield cache mixing old index/chunks.',
    'The app now unregisters RadShield service workers by default unless enable-sw=1 is present.',
    'The reset-cache page gives a manual recovery path before final public deploy smoke.',
  ],
  artifacts,
  evidence,
  blockingReasons,
  nextActions: status === 'local-delivery-ready'
    ? [
        'Open reset-cache.html if the old 4174 tab is blank.',
        'Use the fresh static URL to verify menus/canvas.',
        'After visual recovery, retry Sites/Git hosting and repeat F154-F158 against the final URL.',
      ]
    : [
        'Run npm run build.',
        'Run npm run prepare:f174a:predeploy-hardening.',
        'Rerun npm run prepare:f175:local-package.',
      ],
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const readme = [
  '# F175 Local Delivery Package',
  '',
  `Generated: ${manifest.generatedAt}`,
  `Status: ${manifest.status}`,
  '',
  '## Why Menus Or Canvas Can Disappear',
  '',
  ...manifest.diagnosis.map((item) => `- ${item}`),
  '',
  '## Local URLs',
  '',
  `- Current preview: ${manifest.localUrls.currentPreview}`,
  `- Fresh static fallback: ${manifest.localUrls.freshStaticFallback}`,
  `- Cache reset: ${manifest.localUrls.cacheReset}`,
  '',
  '## Artifacts',
  '',
  ...artifacts.map((item) => `- ${item.path}: ${item.present ? `${item.bytes} bytes / ${item.sha256}` : 'missing'}`),
  '',
  '## Evidence',
  '',
  ...evidence.map((item) => `- ${item.phase}: ${item.status}`),
  '',
  '## Blocking Reasons',
  '',
  ...(blockingReasons.length ? blockingReasons.map((item) => `- ${item}`) : ['- None']),
  '',
].join('\n');

fs.writeFileSync(readmePath, readme, 'utf8');
fs.writeFileSync(mdPath, [
  '# F175 - Local Delivery Package + Cache Recovery',
  '',
  `Generado: ${manifest.generatedAt}`,
  `Estado: **${manifest.status}**`,
  '',
  '## Diagnostico',
  '',
  ...manifest.diagnosis.map((item) => `- ${item}`),
  '',
  '## URLs',
  '',
  `- Preview actual: ${manifest.localUrls.currentPreview}`,
  `- Fallback estatico fresco: ${manifest.localUrls.freshStaticFallback}`,
  `- Reset cache: ${manifest.localUrls.cacheReset}`,
  '',
  '## Siguientes acciones',
  '',
  ...manifest.nextActions.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F175 local delivery package ${status}.`);
if (status !== 'local-delivery-ready') process.exit(1);
