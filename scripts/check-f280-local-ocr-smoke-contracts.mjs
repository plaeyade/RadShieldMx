import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f280_local_ocr_smoke/f280_local_ocr_smoke.json'));
const pages = read('outputs/f280_local_ocr_smoke/f280_local_ocr_pages.jsonl').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const evidence = read('src/lib/f125CalculationEvidenceGate.ts');
const lib = read('src/lib/f280LocalOcrSmoke.ts');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F280 status', manifest.status === 'local-ocr-smoke');
expect('No paid cloud OCR', manifest.paidCloudOcrUsed === false);
expect('Two docs tracked', manifest.documents.length === 2);
expect('Tesseract tracked', Object.hasOwn(manifest.tools, 'tesseract'));
expect('Page JSONL is array-compatible', Array.isArray(pages));
expect('Page records have review status when present', pages.every((page) => page.reviewStatus === 'draft-needs-review'));
expect('Lib summary present', lib.includes('summarizeF280LocalOcrSmoke'));
expect('Update Center documents F280', update.includes('F280 Local OCR smoke'));
expect('F125 summarizes F280', evidence.includes('summarizeF280LocalOcrSmoke'));

if (failures.length) {
  console.error('F280 local OCR smoke contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F280 local OCR smoke contracts passed.');
