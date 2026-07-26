import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = join(root, 'outputs', 'f361_post_beta_repair');
mkdirSync(outDir, { recursive: true });

const pdfPath = process.env.F361_KIUBE_PDF || 'C:\\Users\\carlo\\Downloads\\MID_55672_F_Cyclone_KIUBE_SRG_Rev G_No drawings.pdf';
const expectedHash = '5f64cf65a48c59a295c2bae60d7f801ed17e1984aa349f6724ba833ea08087ce';
const python = process.env.PYTHON_EXE || 'C:\\Users\\carlo\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
const extractor = join(root, 'scripts', 'f75_extract_pdf_text.py');

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function simpleEmbedding(text, dims = 128) {
  const vec = new Array(dims).fill(0);
  const words = String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i += 1) hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
    vec[Math.abs(hash) % dims] += 1;
  }
  const norm = Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0));
  return norm > 0 ? vec.map((value) => value / norm) : vec;
}

function extractPdf(filePath) {
  if (!existsSync(filePath)) {
    return { ok: false, pages: 0, extractedPages: 0, text: '', error: 'missing-source' };
  }
  const result = spawnSync(python, [extractor, filePath], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.status !== 0) {
    return { ok: false, pages: 0, extractedPages: 0, text: '', error: result.stderr || result.stdout || 'extractor-failed' };
  }
  return JSON.parse(result.stdout || '{}');
}

function chunkText(text, chunkSize = 1800, overlap = 240) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  const chunks = [];
  for (let start = 0; start < normalized.length; start += chunkSize - overlap) {
    const content = normalized.slice(start, start + chunkSize).trim();
    if (content.length < 180) continue;
    const pageMatch = content.match(/\[page\s+(\d+)\]/i);
    chunks.push({
      source: 'f361-kiube-mid-55672-rev-g',
      section: `Cyclone KIUBE SRG Rev G chunk ${chunks.length + 1}`,
      modality: 'CY',
      content,
      pageRef: pageMatch ? `p.${pageMatch[1]}` : null,
      tags: ['F361', 'Cyclone KIUBE', 'IBA', 'MID 55672 Rev G', 'vendor-source', 'No drawings'],
    });
  }
  return chunks;
}

const sourceExists = existsSync(pdfPath);
const hash = sourceExists ? sha256(pdfPath) : null;
const sizeBytes = sourceExists ? statSync(pdfPath).size : 0;
const kiubeCode = readFileSync(join(root, 'src', 'lib', 'cycloneKIUBEData.ts'), 'utf8');
const alreadyModeledInCode = kiubeCode.includes('MID 55672') || kiubeCode.includes('Cyclone KIUBE');
const extracted = extractPdf(pdfPath);
const chunks = extracted.ok ? chunkText(extracted.text) : [];
const dbDraft = chunks.map((chunk) => ({
  ...chunk,
  embedding: JSON.stringify(simpleEmbedding(chunk.content)),
  tags: JSON.stringify([...chunk.tags, `pdf-hash:${hash}`, `chunk-hash:${createHash('sha256').update(chunk.content).digest('hex').slice(0, 16)}`]),
}));

const repairChecklist = [
  { id: 'canvas-right-click', status: 'implemented', evidence: 'src/sections/CanvasArea.tsx data-testid=canvas-context-menu' },
  { id: 'dialog-window-controls', status: 'implemented', evidence: 'src/components/DialogShell.tsx data-testid=draggable-dialog-shell' },
  { id: 'quick-access-fallbacks', status: 'implemented', evidence: 'Toolbar invoke(handler, fallbackDialog)' },
  { id: 'file-menu-alignment', status: 'implemented', evidence: 'f295-primary-file-menu width/collision + command fallbacks' },
  { id: 'update-center-reflects-post-beta', status: 'implemented', evidence: 'F361 entry in UpdateAppDialog' },
  { id: 'manual-v99-to-v360-gap', status: 'implemented', evidence: 'MANUAL_USUARIO_v99.md addendum F99-F360 + F361' },
  { id: 'kiube-pdf-rag', status: chunks.length > 0 ? 'rag-ready' : 'needs-ocr-or-resubmission', evidence: `chunks=${chunks.length}` },
];

const manifest = {
  schema: 'radshield-mx.f361.post-beta-repair.v1',
  generatedAt: new Date().toISOString(),
  status: 'post-beta-repair-ready',
  betaStatus: 'incomplete-until-f361-repair-is-validated',
  sourcePdf: {
    path: pdfPath,
    exists: sourceExists,
    sizeBytes,
    sha256: hash,
    expectedSha256: expectedHash,
    matchesKnownHash: hash === expectedHash,
    alreadyModeledInCode,
    dedupeDecision: alreadyModeledInCode
      ? 'technical-model-already-present; keep-pdf-as-canonical-rag-evidence'
      : 'new-vendor-source; index-as-canonical-rag-evidence',
    pages: extracted.pages || 0,
    extractedPages: extracted.extractedPages || 0,
    chunkCount: chunks.length,
    extractionStatus: chunks.length > 0 ? 'searchable-text-indexed' : 'needs-ocr-or-readable-pdf',
  },
  repairChecklist,
  artifacts: {
    manifest: 'outputs/f361_post_beta_repair/f361_post_beta_repair.json',
    chunksJsonl: 'outputs/f361_post_beta_repair/f361_kiube_document_chunks.jsonl',
    dbDraft: 'outputs/f361_post_beta_repair/f361_kiube_document_chunks_db_draft.json',
    manualMatrix: 'outputs/f361_post_beta_repair/f361_manual_update_matrix.csv',
  },
  releaseNote: 'F361 repairs post-beta UI regressions and refreshes documentation/update evidence. Clinical calculations remain preliminary until QA/sign-off.',
};

writeFileSync(join(outDir, 'f361_post_beta_repair.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
writeFileSync(join(outDir, 'f361_kiube_document_chunks.jsonl'), chunks.map((chunk) => JSON.stringify(chunk)).join('\n') + (chunks.length ? '\n' : ''), 'utf8');
writeFileSync(join(outDir, 'f361_kiube_document_chunks_db_draft.json'), `${JSON.stringify({ chunks: dbDraft }, null, 2)}\n`, 'utf8');
writeFileSync(join(outDir, 'f361_manual_update_matrix.csv'), [
  'document,update',
  'MANUAL_USUARIO_v99.md,F99-F360 coverage plus F361 post-beta repair',
  'MANUAL_VERSIONES_v50.md,F361 version entry',
  'CHANGELOG.md,F361 repair entry',
  'UpdateAppDialog.tsx,F361 visible in Update Center',
].join('\n') + '\n', 'utf8');

console.log(`F361 post-beta repair manifest generated (${chunks.length} KIUBE chunks).`);
