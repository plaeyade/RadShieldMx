import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f172aArxivResearchMethodology.ts',
  'src/sections/dialogs/AAPMTG108PETDialog.tsx',
  'src/sections/dialogs/MaterialComparisonDialog.tsx',
  'scripts/f172a-index-arxiv-research.mjs',
  'scripts/check-f172a-arxiv-research-contracts.mjs',
  'outputs/f172a_arxiv_research/f172a_arxiv_research.json',
  'outputs/fase_172a_arxiv_research.md',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
];

const failures = [];
const read = (file) => readFileSync(file, 'utf8');
for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const manifest = existsSync(files[5]) ? JSON.parse(read(files[5])) : null;
if (manifest) {
  if (manifest.phase !== 'F172A') failures.push('F172A manifest phase mismatch');
  if (manifest.status !== 'arxiv-research-integrated') failures.push(`F172A status not integrated: ${manifest.status}`);
  if (manifest.schema !== 'radshield-mx.arxiv-research.f172a.v1') failures.push('F172A schema mismatch');
  if ((manifest.chunkCount ?? 0) < 2) failures.push('F172A chunk count too low');
  const sources = new Set((manifest.documents || []).map((doc) => doc.source));
  for (const source of ['f172a-arxiv-2601-10336v2', 'f172a-arxiv-2407-12991v2']) {
    if (!sources.has(source)) failures.push(`Missing indexed source: ${source}`);
  }
  for (const doc of manifest.documents || []) {
    if (!doc.sha256 || String(doc.sha256).length !== 64) failures.push(`Missing sha256 for ${doc.source}`);
    if (doc.status !== 'indexed-research') failures.push(`Document is not indexed-research: ${doc.source}`);
  }
}

const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');
for (const token of [
  'F172A',
  'arxiv-research-integrated',
  'buildF172AResearchMethodology',
  'f172a-material-methodology',
  'f172a-pet-methodology',
  'prepare:f172a:arxiv-research',
  'test:f172a:arxiv-research',
  'research-methodology-only',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

if (failures.length) {
  console.error('F172A arXiv research contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F172A arXiv research contracts OK.');
