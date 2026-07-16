import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'scripts/f170-rag-citation-governance.mjs',
  'scripts/check-f170-rag-citation-governance-contracts.mjs',
  'outputs/f170_rag_citation_governance/f170_rag_citation_governance.json',
  'outputs/fase_170_rag_citation_governance.md',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
];

const requiredTokens = [
  ['scripts/f170-rag-citation-governance.mjs', 'radshield-mx.rag-citation-governance.f170.v1'],
  ['scripts/f170-rag-citation-governance.mjs', 'document_chunks'],
  ['scripts/f170-rag-citation-governance.mjs', 'citationPolicy'],
  ['scripts/f170-rag-citation-governance.mjs', 'minimum-seed-corpus'],
  ['package.json', 'prepare:f170:rag-citations'],
  ['package.json', 'test:f170:rag-citations'],
  ['CHANGELOG.md', 'F170'],
  ['MANUAL_VERSIONES_v50.md', 'F170'],
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

for (const [file, token] of requiredTokens) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing token file ${file}`);
    continue;
  }
  if (!fs.readFileSync(full, 'utf8').includes(token)) failures.push(`Missing token "${token}" in ${file}`);
}

const manifestPath = path.join(root, 'outputs', 'f170_rag_citation_governance', 'f170_rag_citation_governance.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F170') failures.push('F170 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.rag-citation-governance.f170.v1') failures.push('F170 schema mismatch');
  if (!['rag-citation-governance-ready', 'rag-citation-governance-gated'].includes(manifest.status)) failures.push(`Unexpected F170 status ${manifest.status}`);
  if (manifest.status === 'rag-citation-governance-ready') {
    for (const [gate, ok] of Object.entries(manifest.gates ?? {})) {
      if (!ok) failures.push(`F170 gate failed: ${gate}`);
    }
    if ((manifest.db?.totals?.totalChunks ?? 0) < 2) failures.push('F170 requires at least seed RAG chunks');
    if (!Array.isArray(manifest.citationPolicy) || manifest.citationPolicy.length < 4) failures.push('F170 citation policy too small');
    if (!manifest.upstream?.f168Status || !manifest.upstream?.f169Status) failures.push('F170 upstream status missing');
  }
}

if (failures.length) {
  console.error('F170 RAG citation governance contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F170 RAG citation governance contracts OK.');
