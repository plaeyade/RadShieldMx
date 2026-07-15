import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

function assertFile(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
}

function assertDir(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!existsSync(fullPath) || !statSync(fullPath).isDirectory()) {
    throw new Error(`Missing required directory: ${relativePath}`);
  }
}

function assertLatestZip(prefix) {
  const outputsDir = path.join(root, 'outputs');
  const zip = readdirSync(outputsDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.zip'))
    .sort()
    .at(-1);
  if (!zip) {
    throw new Error(`Missing ${prefix}*.zip in outputs`);
  }
  return zip;
}

[
  'outputs/fase_75_pdf_rag_conversion_ui.md',
  'outputs/fase_76_ocr_seed_live.md',
  'outputs/fase_77_ocr_db_readiness.md',
  'outputs/fase_78_db_fullstack.md',
  'outputs/fase_79_security_permissions_qa.md',
  'outputs/fase_80_release_candidate.md',
  'scripts/run-release-validation.mjs',
  'scripts/check-f79-security-contracts.mjs',
  'scripts/check-deploy-config.mjs',
  'dist/index.html',
  'dist-backend/server/boot.js',
].forEach(assertFile);

[
  'dist/assets',
  'outputs/f75_pdf_ingestion',
].forEach(assertDir);

const releaseZip = assertLatestZip('radshield_mx_release_candidate_f80_');
const sourceBackup = assertLatestZip('radshield_mx_source_backup_f80_');

console.log(JSON.stringify({
  ok: true,
  phase: 'F80',
  releaseZip,
  sourceBackup,
}, null, 2));
