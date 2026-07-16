import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'scripts/f170b_extract_pdf_text.py',
  'scripts/f170b-reindex-canonical-pdfs.mjs',
  'scripts/check-f170b-canonical-reindex-contracts.mjs',
  'outputs/f170b_canonical_reindex/f170b_canonical_reindex.json',
  'outputs/fase_170b_canonical_reindex.md',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
];

const failures = [];
const read = (file) => readFileSync(file, 'utf8');

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const manifest = existsSync(requiredFiles[3]) ? JSON.parse(read(requiredFiles[3])) : null;
if (manifest) {
  if (manifest.phase !== 'F170B') failures.push('Manifest phase must be F170B');
  if (manifest.status !== 'canonical-reindex-ready') failures.push(`Manifest status not ready: ${manifest.status}`);
  if (manifest.schema !== 'radshield-mx.canonical-reindex.f170b.v1') failures.push('Manifest schema mismatch');
  if ((manifest.chunkCount ?? 0) < 2) failures.push('F170B chunk count is too low');
  const sources = new Set((manifest.documents || []).map((doc) => doc.source));
  for (const source of ['f170b-ncrp147', 'f170b-aapm-tg108']) {
    if (!sources.has(source)) failures.push(`Missing canonical source in manifest: ${source}`);
  }
  for (const doc of manifest.documents || []) {
    if (!doc.sha256 || String(doc.sha256).length !== 64) failures.push(`Missing sha256 for ${doc.source}`);
    if ((doc.chunkCount ?? 0) <= 0) failures.push(`Missing chunks for ${doc.source}`);
  }
}

const pkg = existsSync('package.json') ? read('package.json') : '';
for (const token of ['prepare:f170b:canonical-reindex', 'test:f170b:canonical-reindex']) {
  if (!pkg.includes(token)) failures.push(`package.json missing script: ${token}`);
}

for (const token of ['F170B', 'canonical-reindex-ready', 'f170b-ncrp147', 'f170b-aapm-tg108']) {
  const joined = ['CHANGELOG.md', 'MANUAL_VERSIONES_v50.md', 'outputs/fase_170b_canonical_reindex.md']
    .filter((file) => existsSync(file))
    .map((file) => read(file))
    .join('\n');
  if (!joined.includes(token)) failures.push(`Documentation/output missing token: ${token}`);
}

if (failures.length) {
  console.error('F170B canonical reindex contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F170B canonical reindex contracts OK.');
