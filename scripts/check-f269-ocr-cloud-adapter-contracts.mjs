import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f269_ocr_cloud_adapter_gate/f269_ocr_cloud_adapter_gate.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const evidence = read('src/lib/f125CalculationEvidenceGate.ts');
const lib = read('src/lib/f269OcrCloudAdapterGate.ts');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F269 status', manifest.status === 'ocr-cloud-adapter-gate-ready');
expect('No live OCR calls', manifest.liveCallsExecuted === false);
expect('Google provider present', manifest.providers.some((provider) => provider.id === 'google-document-ai'));
expect('Textract provider present', manifest.providers.some((provider) => provider.id === 'amazon-textract'));
expect('Two pending OCR docs tracked', manifest.pendingDocuments.length === 2);
expect('Output contract includes DB draft', manifest.outputContracts.includes('document_chunks_db_draft.json'));
expect('Static frontend secret control', manifest.smokePolicy.some((item) => item.includes('static frontend')));
expect('Lib builder present', lib.includes('buildF269OcrCloudAdapterGate'));
expect('Update Center documents F269', update.includes('F269 OCR cloud adapter gate'));
expect('F125 summarizes F269', evidence.includes('summarizeF269OcrCloudAdapterGate'));

if (failures.length) {
  console.error('F269 OCR cloud adapter contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F269 OCR cloud adapter contracts passed.');
