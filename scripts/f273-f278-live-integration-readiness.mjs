import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f273_f278_live_integration_readiness');
fs.mkdirSync(outputDir, { recursive: true });

const exists = (filePath) => Boolean(filePath && fs.existsSync(filePath));
const envHas = (name) => Boolean(process.env[name]);
const redactState = (names) => ({
  configured: names.filter(envHas),
  missing: names.filter((name) => !envHas(name)),
});
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const dependencyNames = new Set([...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.devDependencies ?? {})]);
const hasDep = (name) => dependencyNames.has(name);

function readGoogleCredentialState() {
  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const state = {
    pathConfigured: Boolean(credentialPath),
    fileExists: exists(credentialPath),
    jsonValid: false,
    hasClientEmail: false,
    hasPrivateKey: false,
    hasProjectId: false,
  };
  if (!state.fileExists) return state;
  try {
    const data = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
    state.jsonValid = true;
    state.hasClientEmail = Boolean(data.client_email);
    state.hasPrivateKey = Boolean(data.private_key);
    state.hasProjectId = Boolean(data.project_id);
  } catch {
    state.jsonValid = false;
  }
  return state;
}

async function probeHttpHealth(url, token) {
  if (!url) return { attempted: false, ok: false, reason: 'url-not-configured' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(new URL('/health', url), {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    });
    return { attempted: true, ok: response.ok, status: response.status };
  } catch (error) {
    return { attempted: true, ok: false, reason: error?.name === 'AbortError' ? 'timeout' : 'network-or-runner-error' };
  } finally {
    clearTimeout(timeout);
  }
}

const googleNames = ['GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_DOCUMENTAI_PROJECT_ID', 'GOOGLE_DOCUMENTAI_LOCATION', 'GOOGLE_DOCUMENTAI_PROCESSOR_ID'];
const awsNames = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_TEXTRACT_BUCKET'];
const apsNames = ['DWG_CONVERSION_PROVIDER', 'APS_CLIENT_ID', 'APS_CLIENT_SECRET', 'APS_BUCKET_KEY'];
const literatureNames = ['CROSSREF_MAILTO', 'SEMANTIC_SCHOLAR_API_KEY'];
const runnerNames = ['GATE_RUNNER_URL', 'GATE_RUNNER_TOKEN', 'GEANT4_RUNNER_URL', 'GEANT4_RUNNER_TOKEN', 'EGSNRC_RUNNER_URL', 'EGSNRC_RUNNER_TOKEN'];

const f270Path = path.join(root, 'outputs', 'f270_aps_dwg_fixture_smoke', 'f270_aps_dwg_fixture_smoke.json');
const f270 = fs.existsSync(f270Path) ? JSON.parse(fs.readFileSync(f270Path, 'utf8')) : undefined;
const dwgFixtures = f270?.fixtures ?? [];
const gateProbe = await probeHttpHealth(process.env.GATE_RUNNER_URL, process.env.GATE_RUNNER_TOKEN);
const googleServiceAccount = readGoogleCredentialState();
const cloudOcrRollbackByCost = true;
const googleCredentialReady = cloudOcrRollbackByCost ? false : googleNames.every(envHas)
  && googleServiceAccount.fileExists
  && googleServiceAccount.jsonValid
  && googleServiceAccount.hasClientEmail
  && googleServiceAccount.hasPrivateKey
  && googleServiceAccount.hasProjectId;

const manifest = {
  phase: 'F273-F278',
  schema: 'radshield-mx.live-integration-readiness.f273-f278.v1',
  generatedAt: new Date().toISOString(),
  status: 'live-integration-readiness-gate',
  secretsPrinted: false,
  liveProviderCalls: {
    googleDocumentAi: false,
    amazonTextract: false,
    apsConversion: false,
    crossref: false,
    semanticScholar: false,
    gateHealth: gateProbe.attempted,
    geant4: false,
    egsnrc: false,
  },
  cloudOcrRollbackByCost,
  credentials: {
    googleDocumentAi: {
      env: redactState(googleNames),
      serviceAccount: googleServiceAccount,
      sdkInstalled: hasDep('@google-cloud/documentai'),
    },
    amazonTextract: {
      env: redactState(awsNames),
      sdkInstalled: hasDep('@aws-sdk/client-textract'),
    },
    apsDesignAutomation: {
      env: redactState(apsNames),
      fixtures: dwgFixtures.map((fixture) => ({
        fixtureId: fixture.fixtureId,
        status: fixture.status,
        sizeBytes: fixture.sizeBytes,
        sha256: fixture.sha256,
      })),
    },
    literature: {
      env: redactState(literatureNames),
      crossrefReady: envHas('CROSSREF_MAILTO'),
      semanticScholarReady: envHas('SEMANTIC_SCHOLAR_API_KEY'),
    },
    runners: {
      env: redactState(runnerNames),
      gateProbe,
      geant4Deferred: true,
      egsnrcDeferred: true,
    },
  },
  phases: [
    {
      phase: 'F273',
      label: 'Credential validation',
      status: apsNames.every(envHas) && literatureNames.every(envHas) ? 'ready' : 'review-required',
      evidence: ['redacted-env-present', 'paid-ocr-rollback-by-cost', 'aps-fixture-check', 'runner-url-check'],
    },
    {
      phase: 'F274',
      label: 'OCR free/local preflight',
      status: 'local-free-ocr-preflight',
      evidence: ['no-document-processed', 'google-amazon-paid-ocr-deferred', 'run-f279-local-free-ocr-first'],
    },
    {
      phase: 'F275',
      label: 'APS DWG live smoke preflight',
      status: apsNames.every(envHas) && dwgFixtures.some((fixture) => fixture.status === 'available') ? 'ready-for-token-conversion-smoke' : 'review-required',
      evidence: ['no-dwg-uploaded', 'fixtures-hashed', 'aps-env-redacted'],
    },
    {
      phase: 'F276',
      label: 'Literature live metadata preflight',
      status: envHas('CROSSREF_MAILTO') && envHas('SEMANTIC_SCHOLAR_API_KEY') ? 'ready-for-live-query' : 'ready-without-live-query',
      evidence: ['no-live-query-executed', 'citation-candidate-only-policy'],
    },
    {
      phase: 'F277',
      label: 'Monte Carlo external runner preflight',
      status: gateProbe.ok ? 'gate-runner-health-ok' : 'gate-runner-review-required',
      evidence: ['gate-health-probe', 'geant4-deferred', 'egsnrc-deferred'],
    },
    {
      phase: 'F278',
      label: 'Integrated live QA',
      status: 'waiting-for-provider-smokes',
      evidence: ['requires-f274-ocr-output', 'requires-f275-dwg-output', 'requires-f276-citation-output', 'requires-f277-runner-output'],
    },
  ],
  blockers: [
    ...(gateProbe.attempted && !gateProbe.ok ? [`GATE runner health probe failed: ${gateProbe.reason ?? gateProbe.status}`] : []),
  ],
  paidOcrRollback: [
    'Google Document AI disabled/deferred because it may create per-page cloud cost.',
    'Amazon Textract disabled/deferred because it may create per-page cloud cost.',
    'Use F279 local/free OCR before any paid exception.',
  ],
  deferred: ['Geant4 live runner smoke deferred by operator request.', 'EGSnrc/egs_brachy live runner smoke deferred by operator request.'],
  releaseDecision:
    'F273-F278 confirms non-OCR live lanes are gated and rolls back paid OCR by cost. No OCR, DWG upload, external literature query or MC run was executed except optional GATE /health probe.',
};

fs.writeFileSync(path.join(outputDir, 'f273_f278_live_integration_readiness.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_273_f278_live_integration_readiness.md'),
  [
    '# F273-F278 Live Integration Readiness',
    '',
    `Status: ${manifest.status}`,
    `Secrets printed: ${manifest.secretsPrinted ? 'yes' : 'no'}`,
    '',
    '## Phases',
    ...manifest.phases.map((phase) => `- ${phase.phase} ${phase.label}: ${phase.status}`),
    '',
    '## Blockers',
    ...(manifest.blockers.length ? manifest.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    '## Paid OCR Rollback',
    ...manifest.paidOcrRollback.map((item) => `- ${item}`),
    '',
    '## Deferred',
    ...manifest.deferred.map((item) => `- ${item}`),
    '',
    `Decision: ${manifest.releaseDecision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  phases: manifest.phases.map((phase) => `${phase.phase}:${phase.status}`),
  blockers: manifest.blockers,
  deferred: manifest.deferred,
}, null, 2));
