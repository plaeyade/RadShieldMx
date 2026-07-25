import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f261_f262_dwg_provider_fixture');
const fixturesDir = path.join(root, 'fixtures', 'dwg');
const jsonPath = path.join(outputDir, 'f261_f262_dwg_provider_fixture.json');
const mdPath = path.join(root, 'outputs', 'fase_261_262_dwg_provider_fixture.md');
const fixtureReadmePath = path.join(fixturesDir, 'README.md');

const manifest = {
  phaseRange: 'F261-F262',
  schema: 'radshield-mx.dwg-provider-fixture.f261-f262.v1',
  generatedAt: new Date().toISOString(),
  status: 'provider-selected-waiting-for-fixtures',
  recommendation: {
    primary: 'aps-design-automation',
    privateLongTerm: 'oda-self-hosted',
    previewOnly: 'cloudconvert-preview',
    fallback: 'manual-dxf-fallback',
    reason:
      'APS Design Automation is the safest primary route for DWG->DXF layer-preserving workflows; ODA is best for private enterprise control; CloudConvert is useful only for preview overlays.',
  },
  environment: {
    DWG_CONVERSION_PROVIDER: 'aps-design-automation',
    APS_CLIENT_ID: 'server secret required',
    APS_CLIENT_SECRET: 'server secret required',
    APS_BUCKET_KEY: 'server config required',
    DWG_CONVERSION_TIMEOUT_MS: 'recommended 120000',
    DWG_MAX_UPLOAD_MB: 'recommended 50',
  },
  fixtures: {
    directory: 'fixtures/dwg',
    required: ['small-architectural-plan.dwg', 'equipment-layout.dwg'],
    optional: ['known-bad-or-empty.dwg'],
    currentDwgCount: fs.existsSync(fixturesDir)
      ? fs.readdirSync(fixturesDir).filter((name) => name.toLowerCase().endsWith('.dwg')).length
      : 0,
  },
  validationCommands: [
    'npm run test:f258-f260:full',
    'npm run test:f204:canvas-dxf-recovery',
    'npm run test:f213:dxf-layer-mapping',
    'npm run test:f207:functional-app-qa',
  ],
  blockedUntil: [
    'APS credentials are configured on backend/server only',
    'at least two non-sensitive DWG fixtures are added to fixtures/dwg',
    'converted DXF output passes layer mapping and operator scale confirmation',
  ],
};

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const fixtureReadme = [
  '# DWG Fixtures For F262',
  '',
  'Place non-sensitive DWG test files here. Do not commit private patient, hospital, or proprietary construction drawings.',
  '',
  'Required fixtures:',
  '',
  '- `small-architectural-plan.dwg`: simple 2D plan with known scale, wall layers and at least one dimension.',
  '- `equipment-layout.dwg`: plan with medical equipment blocks or equipment-like symbols.',
  '',
  'Optional negative fixture:',
  '',
  '- `known-bad-or-empty.dwg`: corrupt/empty/unmappable file to test safe failure.',
  '',
  'Acceptance:',
  '',
  '- Record input SHA256.',
  '- Convert with the selected backend provider.',
  '- Record output SHA256.',
  '- Validate DXF layer mapping before applying to canvas.',
  '- Confirm scale manually before calculations.',
  '',
].join('\n');
fs.writeFileSync(fixtureReadmePath, fixtureReadme, 'utf8');

const markdown = [
  '# F261-F262 DWG Provider And Fixture Gate',
  '',
  `Status: **${manifest.status}**`,
  '',
  '## Recommendation',
  '',
  `- Primary: ${manifest.recommendation.primary}`,
  `- Private long-term: ${manifest.recommendation.privateLongTerm}`,
  `- Preview only: ${manifest.recommendation.previewOnly}`,
  `- Fallback: ${manifest.recommendation.fallback}`,
  `- Reason: ${manifest.recommendation.reason}`,
  '',
  '## Fixtures',
  '',
  `- Directory: ${manifest.fixtures.directory}`,
  `- Current DWG count: ${manifest.fixtures.currentDwgCount}`,
  ...manifest.fixtures.required.map((name) => `- Required: ${name}`),
  ...manifest.fixtures.optional.map((name) => `- Optional: ${name}`),
  '',
  '## Blocked Until',
  '',
  ...manifest.blockedUntil.map((item) => `- ${item}`),
  '',
].join('\n');
fs.writeFileSync(mdPath, markdown, 'utf8');

console.log(`F261-F262 DWG gate ${manifest.status}; fixtures=${manifest.fixtures.currentDwgCount}`);
