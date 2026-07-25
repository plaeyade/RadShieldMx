import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f270_aps_dwg_fixture_smoke');
fs.mkdirSync(outputDir, { recursive: true });

const fixtureCandidates = [
  { fixtureId: 'dwg-0760030003b', sourcePath: 'C:/Users/carlo/Downloads/0760030003b.dwg' },
  { fixtureId: 'dwg-neuro-oncologia-bind-050726', sourcePath: 'C:/Users/carlo/Downloads/PLANTAS ARQUITECTONICAS NEURO-ONCOLOGIA bind 050726.dwg' },
];

const sha256 = (filePath) => {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
};

const apsSecrets = ['DWG_CONVERSION_PROVIDER', 'APS_CLIENT_ID', 'APS_CLIENT_SECRET', 'APS_BUCKET_KEY'];
const fixtures = fixtureCandidates.map((candidate) => {
  const exists = fs.existsSync(candidate.sourcePath);
  const stats = exists ? fs.statSync(candidate.sourcePath) : undefined;
  return {
    fixtureId: candidate.fixtureId,
    fileName: path.basename(candidate.sourcePath),
    sourcePath: candidate.sourcePath,
    exists,
    status: exists ? 'available' : 'missing',
    sizeBytes: stats?.size ?? 0,
    sha256: exists ? sha256(candidate.sourcePath) : undefined,
    expectedRoute: 'DWG -> APS backend/operator -> DXF/SVG -> layer/scale audit -> canvas import smoke',
  };
});

const manifest = {
  phase: 'F270',
  schema: 'radshield-mx.aps-dwg-fixture-smoke.f270.v1',
  generatedAt: new Date().toISOString(),
  status: 'aps-dwg-fixture-smoke-ready',
  liveConversionExecuted: false,
  provider: 'autodesk-aps-design-automation',
  fallbackProvider: 'oda-drawings-sdk-deferred',
  envStatus: {
    configured: apsSecrets.filter((name) => Boolean(process.env[name])),
    missing: apsSecrets.filter((name) => !process.env[name]),
  },
  fixtures,
  expectedOutputs: ['converted.dxf', 'preview.svg', 'layer-map.json', 'scale-audit.json', 'conversion-manifest.json'],
  acceptanceCriteria: [
    'At least one DWG fixture exists and is hashed.',
    'No APS credential is exposed in VITE_* or static assets.',
    'Conversion manifest preserves file hash, units, layers, blocks and extents.',
    'Canvas consumes DXF/SVG output; native DWG bytes remain backend/operator only.',
  ],
  releaseDecision:
    'F270 is ready for APS smoke when credentials are configured. Until then the release continues with DXF/manual import and hashed DWG fixtures.',
};

fs.writeFileSync(path.join(outputDir, 'f270_aps_dwg_fixture_smoke.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_270_aps_dwg_fixture_smoke.md'),
  [
    '# F270 APS DWG Fixture Smoke',
    '',
    `Status: ${manifest.status}`,
    `Live conversion: ${manifest.liveConversionExecuted ? 'yes' : 'no'}`,
    '',
    '## Fixtures',
    ...fixtures.map((fixture) => `- ${fixture.fixtureId}: ${fixture.status}; ${fixture.sizeBytes} bytes; ${fixture.sha256 ?? 'no-hash'}`),
    '',
    '## Acceptance',
    ...manifest.acceptanceCriteria.map((item) => `- ${item}`),
    '',
    `Decision: ${manifest.releaseDecision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  availableFixtures: fixtures.filter((fixture) => fixture.exists).length,
  liveConversionExecuted: manifest.liveConversionExecuted,
}, null, 2));
