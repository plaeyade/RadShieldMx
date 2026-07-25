import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f269_ocr_cloud_adapter_gate');
fs.mkdirSync(outputDir, { recursive: true });

const pendingDocs = [
  {
    documentId: 'memoria-lab-prod-impsa-2309',
    title: '2309 MA LAB PROD IMPSA...',
    sourcePath: 'C:/Users/carlo/Downloads/RadShield Mx/2309 MA LAB PROD IMPSA...pdf',
    reason: 'needs-ocr',
  },
  {
    documentId: 'memoria-ciclotron-kiube-impsa-2309',
    title: '2309 MA CICLOTRON KIUBE IMPSA.. (1)',
    sourcePath: 'C:/Users/carlo/Downloads/RadShield Mx/2309 MA CICLOTRON KIUBE IMPSA.. (1).pdf',
    reason: 'needs-ocr',
  },
];

const hashFile = (filePath) => {
  if (!fs.existsSync(filePath)) return undefined;
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
};

const googleSecrets = ['GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_DOCUMENTAI_PROJECT_ID', 'GOOGLE_DOCUMENTAI_LOCATION', 'GOOGLE_DOCUMENTAI_PROCESSOR_ID'];
const textractSecrets = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_TEXTRACT_BUCKET'];
const secretState = (names) => ({
  configured: names.filter((name) => Boolean(process.env[name])),
  missing: names.filter((name) => !process.env[name]),
});

const manifest = {
  phase: 'F269',
  schema: 'radshield-mx.ocr-cloud-adapter-gate.f269.v1',
  generatedAt: new Date().toISOString(),
  status: 'ocr-cloud-adapter-gate-ready',
  liveCallsExecuted: false,
  providers: [
    {
      id: 'google-document-ai',
      role: 'primary-layout-ocr',
      status: googleSecrets.every((name) => Boolean(process.env[name])) ? 'ready-to-smoke' : 'server-only-waiting-for-credentials',
      requiredSecrets: googleSecrets,
      envStatus: secretState(googleSecrets),
      acceptedInputs: ['pdf', 'tiff', 'png'],
      expectedOutputs: ['text', 'page-layout', 'tables', 'confidence', 'source-page-map', 'provider-operation-id'],
    },
    {
      id: 'amazon-textract',
      role: 'fallback-table-form-ocr',
      status: textractSecrets.every((name) => Boolean(process.env[name])) ? 'ready-to-smoke' : 'server-only-waiting-for-credentials',
      requiredSecrets: textractSecrets,
      envStatus: secretState(textractSecrets),
      acceptedInputs: ['pdf', 'tiff', 'png', 'jpg'],
      expectedOutputs: ['text', 'tables', 'forms', 'confidence', 'blocks-json', 'source-page-map'],
    },
  ],
  pendingDocuments: pendingDocs.map((doc) => {
    const exists = fs.existsSync(doc.sourcePath);
    const stats = exists ? fs.statSync(doc.sourcePath) : undefined;
    return {
      ...doc,
      exists,
      sizeBytes: stats?.size ?? 0,
      sha256: hashFile(doc.sourcePath),
      canonicalAction: 'Generate OCR draft, preserve page/confidence, then re-run dedupe and seed as reviewed chunks.',
    };
  }),
  smokePolicy: [
    'No live OCR call is made by this preparation script.',
    'Google Document AI is primary for layout/page map; Textract is fallback/comparison for tables/forms.',
    'OCR result must be reviewed before it becomes canonical RAG content.',
    'No PHI/private document is sent from the static frontend.',
  ],
  outputContracts: ['ocr-draft.json', 'ocr-pages.jsonl', 'ocr-confidence.csv', 'document_chunks_db_draft.json'],
  releaseDecision:
    'F269 is ready for a credentialed backend smoke. Current static build remains stable and does not include OCR secrets or provider payloads.',
};

fs.writeFileSync(path.join(outputDir, 'f269_ocr_cloud_adapter_gate.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_269_ocr_cloud_adapter_gate.md'),
  [
    '# F269 OCR Cloud Adapter Gate',
    '',
    `Status: ${manifest.status}`,
    `Live calls: ${manifest.liveCallsExecuted ? 'yes' : 'no'}`,
    '',
    '## Pending OCR Documents',
    ...manifest.pendingDocuments.map((doc) => `- ${doc.documentId}: ${doc.exists ? 'available' : 'missing'} (${doc.sizeBytes} bytes)`),
    '',
    '## Providers',
    ...manifest.providers.map((provider) => `- ${provider.id}: ${provider.status}; missing=${provider.envStatus.missing.join(', ') || 'none'}`),
    '',
    '## Controls',
    ...manifest.smokePolicy.map((item) => `- ${item}`),
    '',
    `Decision: ${manifest.releaseDecision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  pendingDocuments: manifest.pendingDocuments.length,
  providers: manifest.providers.map((provider) => `${provider.id}:${provider.status}`),
}, null, 2));
