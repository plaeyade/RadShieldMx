import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f279_local_free_ocr_gate/f279_local_free_ocr_gate.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const evidence = read('src/lib/f125CalculationEvidenceGate.ts');
const lib = read('src/lib/f279LocalFreeOcrGate.ts');
const f269 = JSON.parse(read('outputs/f269_ocr_cloud_adapter_gate/f269_ocr_cloud_adapter_gate.json'));

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F279 status', manifest.status === 'local-free-ocr-gate');
expect('Paid OCR rolled back', manifest.paidCloudOcrRolledBack === true);
expect('No live OCR executed', manifest.liveOcrExecuted === false);
expect('Tesseract tracked', manifest.tools.some((tool) => tool.id === 'tesseract'));
expect('Poppler render tracked', manifest.tools.some((tool) => tool.id === 'pdftoppm'));
expect('Pending docs tracked', manifest.pendingDocuments.length === 2);
expect('F269 includes local free provider', f269.providers.some((provider) => provider.id === 'local-free-ocr'));
expect('F269 cloud providers deferred', f269.providers.filter((provider) => ['google-document-ai', 'amazon-textract'].includes(provider.id)).every((provider) => provider.status === 'deferred-cost-rollback'));
expect('Lib builder present', lib.includes('buildF279LocalFreeOcrGate'));
expect('Update Center documents F279', update.includes('F279 Local/free OCR rollback'));
expect('F125 summarizes F279', evidence.includes('summarizeF279LocalFreeOcrGate'));

if (failures.length) {
  console.error('F279 local free OCR contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F279 local free OCR contracts passed.');
