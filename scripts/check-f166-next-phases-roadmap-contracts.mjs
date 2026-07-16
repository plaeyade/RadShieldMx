import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'scripts/f166-next-phases-roadmap.mjs',
  'outputs/f166_next_phases_roadmap/f166_next_phases_roadmap.json',
  'outputs/fase_166_next_phases_roadmap.md',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'package.json',
];

const tokens = [
  ['outputs/fase_166_next_phases_roadmap.md', 'Ya Implementado'],
  ['outputs/fase_166_next_phases_roadmap.md', 'Puntos De Mejora Pendientes'],
  ['outputs/fase_166_next_phases_roadmap.md', 'F167 - Deploy target recovery'],
  ['outputs/fase_166_next_phases_roadmap.md', 'F168 - DB live finalization'],
  ['outputs/fase_166_next_phases_roadmap.md', 'F169 - Numeric QA'],
  ['outputs/fase_166_next_phases_roadmap.md', 'F170 - RAG citation governance'],
  ['outputs/fase_166_next_phases_roadmap.md', 'F171 - Canvas clinical sync polish'],
  ['outputs/fase_166_next_phases_roadmap.md', 'F172 - Release candidate final'],
  ['CHANGELOG.md', 'F166'],
  ['MANUAL_VERSIONES_v50.md', 'F166'],
  ['package.json', 'prepare:f166:roadmap'],
  ['package.json', 'test:f166:roadmap'],
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

for (const [file, token] of tokens) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing token file ${file}`);
    continue;
  }
  if (!fs.readFileSync(full, 'utf8').includes(token)) failures.push(`Missing token "${token}" in ${file}`);
}

const manifestPath = path.join(root, 'outputs', 'f166_next_phases_roadmap', 'f166_next_phases_roadmap.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F166') failures.push('F166 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.next-phases-roadmap.f166.v1') failures.push('F166 schema mismatch');
  if (manifest.status !== 'roadmap-ready') failures.push('F166 roadmap not ready');
  for (const phase of ['F167', 'F168', 'F169', 'F170', 'F171', 'F172']) {
    if (!manifest.nextPhases?.some((item) => item.phase === phase)) failures.push(`Missing next phase ${phase}`);
  }
  for (const phase of ['F159', 'F161', 'F163', 'F164', 'F165']) {
    if (!manifest.implemented?.some((item) => item.phase === phase)) failures.push(`Missing implemented phase ${phase}`);
  }
  for (const id of ['public-deploy', 'db-live-final', 'numeric-qa', 'rag-citation-governance']) {
    if (!manifest.pendingImprovements?.some((item) => item.id === id)) failures.push(`Missing pending improvement ${id}`);
  }
}

if (failures.length) {
  console.error('F166 next phases roadmap contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F166 next phases roadmap contracts OK.');
