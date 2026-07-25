import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f263_aps_dwg_adapter');
const jsonPath = path.join(outputDir, 'f263_aps_dwg_adapter.json');
const mdPath = path.join(root, 'outputs', 'fase_263_aps_dwg_adapter.md');
const fixturesDir = path.join(root, 'fixtures', 'dwg');

const requiredSecrets = ['APS_CLIENT_ID', 'APS_CLIENT_SECRET', 'APS_BUCKET_KEY'];
const requiredFixtures = ['small-architectural-plan.dwg', 'equipment-layout.dwg'];
const configuredProvider = process.env.DWG_CONVERSION_PROVIDER || 'disabled';
const presentFixtures = fs.existsSync(fixturesDir)
  ? fs.readdirSync(fixturesDir).filter((name) => name.toLowerCase().endsWith('.dwg'))
  : [];
const missingFixtures = requiredFixtures.filter((name) => !presentFixtures.includes(name));
const missingSecrets = requiredSecrets.filter((name) => !process.env[name]);
const providerEnabled = configuredProvider === 'aps-design-automation';

let status = 'disabled';
if (providerEnabled && missingSecrets.length === 0 && missingFixtures.length === 0) status = 'adapter-ready-to-smoke';
else if (providerEnabled && missingSecrets.length === 0) status = 'adapter-ready-waiting-for-fixtures';
else if (providerEnabled && missingFixtures.length === 0) status = 'adapter-ready-waiting-for-credentials';
else if (providerEnabled) status = 'adapter-ready-waiting-for-credentials-and-fixtures';

const manifest = {
  phase: 'F263',
  schema: 'radshield-mx.aps-dwg-adapter.f263.v1',
  generatedAt: new Date().toISOString(),
  status,
  provider: {
    selected: 'aps-design-automation',
    configured: configuredProvider,
    canonicalPath: 'dwg-upload-to-aps-workitem-to-dxf-to-existing-dxf-import',
    outputFormat: 'dxf',
    frontendSecretsAllowed: false,
  },
  environment: {
    missingSecrets,
    timeoutMs: Number(process.env.DWG_CONVERSION_TIMEOUT_MS || 120000),
    maxUploadMb: Number(process.env.DWG_MAX_UPLOAD_MB || 50),
  },
  fixtures: {
    directory: 'fixtures/dwg',
    present: presentFixtures,
    missing: missingFixtures,
  },
  backend: {
    router: 'api/cad-router.ts',
    statusProcedure: 'cad.apsDwgStatus',
    planProcedure: 'cad.apsDwgPlan',
    liveConversionProcedure: 'deferred-to-f264',
  },
  acceptanceChecks: [
    'inputSha256 recorded before upload',
    'APS workitem id recorded when live conversion is enabled',
    'outputSha256 recorded after download',
    'converted DXF passes existing DXF parser',
    'layer mapping classifies walls/equipment/zones/dimensions',
    'scale is operator-confirmed before calculations',
    'failed conversion does not mutate floorplan',
    'manual DXF fallback remains available',
  ],
  nextPhase: status === 'adapter-ready-to-smoke' ? 'F264 live APS DWG smoke' : 'Add APS credentials and non-sensitive DWG fixtures, then repeat F263',
};

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const markdown = [
  '# F263 APS DWG Adapter',
  '',
  `Status: **${manifest.status}**`,
  '',
  '## Backend',
  '',
  `- Router: ${manifest.backend.router}`,
  `- Status: ${manifest.backend.statusProcedure}`,
  `- Plan: ${manifest.backend.planProcedure}`,
  `- Live conversion: ${manifest.backend.liveConversionProcedure}`,
  '',
  '## Provider',
  '',
  `- Selected: ${manifest.provider.selected}`,
  `- Configured: ${manifest.provider.configured}`,
  `- Canonical path: ${manifest.provider.canonicalPath}`,
  `- Frontend secrets allowed: ${manifest.provider.frontendSecretsAllowed}`,
  '',
  '## Missing',
  '',
  `- Secrets: ${manifest.environment.missingSecrets.length ? manifest.environment.missingSecrets.join(', ') : 'none'}`,
  `- Fixtures: ${manifest.fixtures.missing.length ? manifest.fixtures.missing.join(', ') : 'none'}`,
  '',
  '## Acceptance Checks',
  '',
  ...manifest.acceptanceChecks.map((item) => `- ${item}`),
  '',
  `Next: ${manifest.nextPhase}`,
  '',
].join('\n');
fs.writeFileSync(mdPath, markdown, 'utf8');

console.log(`F263 APS DWG adapter ${manifest.status}; missingSecrets=${missingSecrets.length}; missingFixtures=${missingFixtures.length}`);
