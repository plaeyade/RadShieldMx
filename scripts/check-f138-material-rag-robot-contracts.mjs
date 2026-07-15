import fs from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f138MaterialRagRobot.ts',
  'scripts/f138-material-rag-robot.mjs',
  'scripts/check-f138-material-rag-robot-contracts.mjs',
  'outputs/f138_material_rag/f138_material_rag_manifest.json',
  'outputs/f138_material_rag/f138_material_chunks_db_draft.json',
  'outputs/f138_material_rag/f138_material_chunks.jsonl',
  'outputs/fase_138_material_rag_robot.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = fs.existsSync(requiredFiles[0]) ? fs.readFileSync(requiredFiles[0], 'utf8') : '';
const script = fs.existsSync(requiredFiles[1]) ? fs.readFileSync(requiredFiles[1], 'utf8') : '';
const output = fs.existsSync(requiredFiles[3]) ? JSON.parse(fs.readFileSync(requiredFiles[3], 'utf8')) : null;
const draft = fs.existsSync(requiredFiles[4]) ? JSON.parse(fs.readFileSync(requiredFiles[4], 'utf8')) : null;
const update = fs.existsSync(requiredFiles[7]) ? fs.readFileSync(requiredFiles[7], 'utf8') : '';
const pkg = fs.existsSync(requiredFiles[8]) ? fs.readFileSync(requiredFiles[8], 'utf8') : '';

for (const token of ['buildF138MaterialRagRobotSummary', 'F138_MATERIAL_DOCUMENTS', 'F138_ROBOT_STRUCTURAL_OPPORTUNITIES']) {
  if (!lib.includes(token)) failures.push(`F138 lib missing token: ${token}`);
}

for (const token of [
  'Tabique TD-550 CONTUPLEX.pdf',
  'TMNIPOL REPORTE DETERMINACION TVL',
  'F138_SEED_LIVE=1',
  'document_chunks',
  'robotStructuralAnalysis',
]) {
  if (!script.includes(token)) failures.push(`F138 script missing token: ${token}`);
}

if (output) {
  if (output.phase !== 'F138') failures.push('F138 output phase mismatch');
  if (!String(output.status || '').includes('ready')) failures.push(`F138 expected ready-ish status, got ${output.status}`);
  if ((output.materialDocumentCount ?? 0) < 8) failures.push('F138 expected 8 material PDFs');
  if ((output.ragReadyCount ?? 0) < 5) failures.push('F138 expected at least 5 RAG-ready PDFs');
  if ((output.chunkCount ?? 0) < 10) failures.push('F138 expected at least 10 chunks');
  if (!output.robotStructuralAnalysis?.radshieldAdditionsBeyondCypecad?.some((item) => item.includes('FEM'))) {
    failures.push('F138 expected Robot FEM addition');
  }
}

if (draft) {
  if (draft.phase !== 'F138') failures.push('F138 draft phase mismatch');
  if (draft.targetTable !== 'document_chunks') failures.push('F138 draft target table mismatch');
  if (!Array.isArray(draft.chunks) || draft.chunks.length < 10) failures.push('F138 draft expected chunks');
  if (!draft.chunks?.every((chunk) => String(chunk.source || '').startsWith('f138-'))) failures.push('F138 chunks must use f138-* sources');
}

for (const token of ['buildF138MaterialRagRobotSummary', 'F138 Material RAG + Robot', 'f138-material-rag-robot']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing token: ${token}`);
}

for (const token of ['prepare:f138:material-rag', 'test:f138:material-rag']) {
  if (!pkg.includes(token)) failures.push(`package.json missing script: ${token}`);
}

if (failures.length > 0) {
  console.error('F138 material RAG + Robot contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F138 material RAG + Robot contracts OK.');
