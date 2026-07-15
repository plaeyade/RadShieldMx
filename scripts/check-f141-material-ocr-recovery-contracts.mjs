import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'src/lib/f141MaterialOcrRecovery.ts',
  'scripts/f141-material-ocr-recovery.mjs',
  'scripts/check-f141-material-ocr-recovery-contracts.mjs',
  'outputs/f141_material_ocr_recovery/f141_material_ocr_recovery.json',
  'outputs/fase_141_material_ocr_recovery.md',
];

const failures = [];
const read = (file) => readFileSync(path.join(root, file), 'utf8');

for (const file of requiredFiles) {
  if (!existsSync(path.join(root, file))) failures.push(`Missing required file: ${file}`);
}

const reportPath = path.join(root, 'outputs', 'f141_material_ocr_recovery', 'f141_material_ocr_recovery.json');
const f139Path = path.join(root, 'outputs', 'f139_material_audit', 'f139_material_citation_ocr_audit.json');

if (existsSync(reportPath)) {
  const report = JSON.parse(read('outputs/f141_material_ocr_recovery/f141_material_ocr_recovery.json'));
  if (report.phase !== 'F141') failures.push('F141 report phase mismatch');
  if (report.status !== 'ready') failures.push(`F141 report must be ready, got ${report.status}`);
  if (report.recovered?.length !== 2) failures.push('F141 must track exactly two recovered OCR documents');
  for (const id of ['bloques-hd-characterization', 'scanpro-hd-materials']) {
    const item = report.recovered?.find((doc) => doc.id === id);
    if (!item) failures.push(`F141 missing recovered item ${id}`);
    if (Number(item?.textLength ?? 0) < 400) failures.push(`F141 recovered item ${id} text is still too short`);
    if (Number(item?.dbChunkCount ?? 0) < 1) failures.push(`F141 recovered item ${id} not found in DB chunks`);
    if (item?.f138Status !== 'rag-ready') failures.push(`F141 recovered item ${id} not reflected as rag-ready in F138 manifest`);
  }
}

if (existsSync(f139Path)) {
  const audit = JSON.parse(read('outputs/f139_material_audit/f139_material_citation_ocr_audit.json'));
  if (audit.status !== 'ready') failures.push(`F139 should be ready after F141, got ${audit.status}`);
  if (Number(audit.ocr?.pendingCount ?? -1) !== 0) failures.push('F139 OCR pending count should be zero after F141');
}

const f139Lib = read('src/lib/f139MaterialCitationOcrAudit.ts');
for (const token of ["status: F139AuditStatus = 'ready'", 'ocrPending: []', 'No material OCR blockers remain']) {
  if (!f139Lib.includes(token)) failures.push(`F139 UI summary missing token: ${token}`);
}

const updateDialog = read('src/sections/dialogs/UpdateAppDialog.tsx');
for (const token of ['buildF141MaterialOcrRecoverySummary', 'f141-material-ocr-recovery', 'F141 Material OCR recovery']) {
  if (!updateDialog.includes(token)) failures.push(`UpdateAppDialog missing F141 token: ${token}`);
}

const packageJson = read('package.json');
for (const token of ['prepare:f141:material-ocr', 'test:f141:material-ocr']) {
  if (!packageJson.includes(token)) failures.push(`package.json missing script: ${token}`);
}

if (failures.length > 0) {
  console.error('F141 material OCR recovery contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F141 material OCR recovery contract passed.');
