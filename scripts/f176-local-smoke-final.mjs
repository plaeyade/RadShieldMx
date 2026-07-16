import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f176_local_smoke_final');
const jsonPath = path.join(outDir, 'f176_local_smoke_final.json');
const mdPath = path.join(root, 'outputs', 'fase_176_local_smoke_final.md');
const defaultBaseUrl = process.env.LOCAL_SMOKE_URL || 'http://127.0.0.1:4175/';

fs.mkdirSync(outDir, { recursive: true });

function readJson(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function getText(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const text = await response.text();
  return {
    url,
    ok: response.ok,
    status: response.status,
    bytes: Buffer.byteLength(text),
    sha256: sha256Text(text),
    text,
  };
}

function assetUrls(baseUrl, html) {
  const base = new URL(baseUrl);
  const urls = [];
  const scriptMatch = html.match(/<script[^>]+src="([^"]+)"/);
  const cssMatch = html.match(/<link[^>]+href="([^"]+\.css)"/);
  if (scriptMatch?.[1]) urls.push(new URL(scriptMatch[1], base).toString());
  if (cssMatch?.[1]) urls.push(new URL(cssMatch[1], base).toString());
  return urls;
}

const f175 = readJson('outputs/f175_local_delivery_package/f175_local_delivery_package.json');
const f174a = readJson('outputs/f174a_predeploy_hardening/f174a_predeploy_hardening.json');
const baseUrl = defaultBaseUrl.endsWith('/') ? defaultBaseUrl : `${defaultBaseUrl}/`;
const resetUrl = new URL('reset-cache.html', baseUrl).toString();

const manifest = {
  phase: 'F176',
  title: 'Local smoke final',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.local-smoke-final.f176.v1',
  status: 'local-smoke-gated',
  baseUrl,
  prerequisites: {
    f175Status: f175?.status ?? 'missing',
    f174aStatus: f174a?.status ?? 'missing',
    distIndexPresent: fs.existsSync(path.join(root, 'dist', 'index.html')),
    resetCachePresent: fs.existsSync(path.join(root, 'dist', 'reset-cache.html')),
  },
  http: [],
  uiReadinessSignals: [
    'HTML shell is served from fresh static local URL.',
    'Current hashed JS/CSS assets are reachable from the served HTML.',
    'reset-cache.html is reachable for stale service worker recovery.',
    'F175 local delivery package and F174A hardening evidence are ready.',
  ],
  blockingReasons: [],
  nextActions: [],
};

try {
  if (manifest.prerequisites.f175Status !== 'local-delivery-ready') {
    manifest.blockingReasons.push('F175 local delivery package is not ready.');
  }
  if (manifest.prerequisites.f174aStatus !== 'predeploy-hardening-ready') {
    manifest.blockingReasons.push('F174A predeploy hardening is not ready.');
  }
  if (!manifest.prerequisites.distIndexPresent) manifest.blockingReasons.push('dist/index.html is missing.');
  if (!manifest.prerequisites.resetCachePresent) manifest.blockingReasons.push('dist/reset-cache.html is missing.');

  const rootResponse = await getText(baseUrl);
  manifest.http.push({ ...rootResponse, text: undefined });
  if (!rootResponse.ok) manifest.blockingReasons.push(`Local app URL failed: ${rootResponse.status}`);
  if (!rootResponse.text.includes('<div id="root"></div>')) {
    manifest.blockingReasons.push('Served HTML does not contain React root.');
  }
  if (!rootResponse.text.includes('serviceWorker') || !rootResponse.text.includes('enable-sw=1')) {
    manifest.blockingReasons.push('Served HTML does not include defensive service worker cleanup.');
  }

  const resetResponse = await getText(resetUrl);
  manifest.http.push({ ...resetResponse, text: undefined });
  if (!resetResponse.ok) manifest.blockingReasons.push(`reset-cache.html failed: ${resetResponse.status}`);
  if (!resetResponse.text.includes('Clean cache and reload app')) {
    manifest.blockingReasons.push('reset-cache.html does not expose recovery action.');
  }

  for (const assetUrl of assetUrls(baseUrl, rootResponse.text)) {
    const assetResponse = await getText(assetUrl);
    manifest.http.push({ ...assetResponse, text: undefined });
    if (!assetResponse.ok) manifest.blockingReasons.push(`Asset failed: ${assetUrl}`);
    if (assetResponse.bytes < 1000) manifest.blockingReasons.push(`Asset too small: ${assetUrl}`);
  }
} catch (error) {
  manifest.blockingReasons.push(error instanceof Error ? error.message : String(error));
}

manifest.status = manifest.blockingReasons.length ? 'local-smoke-gated' : 'local-smoke-ready';
manifest.nextActions = manifest.status === 'local-smoke-ready'
  ? [
      'Use the local URL for final visual confirmation.',
      'Retry Sites/Git hosting when network credentials are ready.',
      'Set PUBLIC_DEPLOY_URL to the final external URL and rerun F154-F158.',
    ]
  : [
      'Open or restart the local static server.',
      'Run npm run build and npm run prepare:f175:local-package.',
      'Open reset-cache.html and reload the app.',
    ];

fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F176 - Local Smoke Final',
  '',
  `Generado: ${manifest.generatedAt}`,
  `Estado: **${manifest.status}**`,
  `URL local: ${manifest.baseUrl}`,
  '',
  '## Prerrequisitos',
  '',
  ...Object.entries(manifest.prerequisites).map(([key, value]) => `- ${key}: ${value}`),
  '',
  '## HTTP',
  '',
  ...manifest.http.map((item) => `- ${item.url}: ${item.status} / ${item.bytes} bytes / ${item.sha256}`),
  '',
  '## Senales UI',
  '',
  ...manifest.uiReadinessSignals.map((item) => `- ${item}`),
  '',
  '## Bloqueos',
  '',
  ...(manifest.blockingReasons.length ? manifest.blockingReasons.map((item) => `- ${item}`) : ['- Ninguno.']),
  '',
  '## Siguientes acciones',
  '',
  ...manifest.nextActions.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F176 local smoke final ${manifest.status}.`);
if (manifest.status !== 'local-smoke-ready') process.exit(1);
