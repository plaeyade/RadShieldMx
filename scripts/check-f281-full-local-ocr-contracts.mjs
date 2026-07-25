import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f281_full_local_ocr/f281_full_local_ocr.json'));
const pages = read('outputs/f281_full_local_ocr/f281_full_local_ocr_pages.jsonl').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const evidence = read('src/lib/f125CalculationEvidenceGate.ts');
const lib = read('src/lib/f281FullLocalOcr.ts');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F281 status', manifest.status === 'full-local-ocr-draft');
expect('No paid cloud OCR', manifest.paidCloudOcrUsed === false);
expect('No automatic DB seed', manifest.seedDbAutomatically === false);
expect('Tool policy tracks Spanish OCR visibility', Object.hasOwn(manifest.tools, 'spanishOcrOperational'));
expect('Documents tracked', manifest.documents.length >= 6);
expect('Pages extracted/OCRed', pages.length > 10);
expect('Page records keep source hash', pages.every((page) => page.documentId && page.sourceHash && page.page > 0));
expect('Page records have review status', pages.every((page) => ['draft-needs-review', 'native-text-review'].includes(page.reviewStatus)));
expect('Duplicate suppression is allowed and explicit', manifest.documents.every((doc) => doc.status !== 'duplicate-suppressed' || doc.duplicateOf));
expect('Lib summary present', lib.includes('summarizeF281FullLocalOcr'));
expect('Update Center documents F281', update.includes('F281 Full local OCR'));
expect('F125 summarizes F281', evidence.includes('summarizeF281FullLocalOcr'));
expect('Manual documents F281', manual.includes('Addendum F281'));
expect('Version manual documents F281', versions.includes('F281'));
expect('Changelog documents F281', changelog.includes('F281'));

if (failures.length) {
  console.error('F281 full local OCR contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F281 full local OCR contracts passed.');
