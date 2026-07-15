import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f142_memoria_material_evidence');
mkdirSync(outputDir, { recursive: true });

function readJson(file) {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

const f138 = readJson(path.join(root, 'outputs', 'f138_material_rag', 'f138_material_rag_manifest.json'));
const f139 = readJson(path.join(root, 'outputs', 'f139_material_audit', 'f139_material_citation_ocr_audit.json'));
const f141 = readJson(path.join(root, 'outputs', 'f141_material_ocr_recovery', 'f141_material_ocr_recovery.json'));

const materialSources = f139?.db?.sourceRows ?? [];
const output = {
  phase: 'F142',
  status: f138?.status === 'ready' && f139?.status === 'ready' && f141?.status === 'ready' ? 'ready' : 'blocked',
  generatedAt: new Date().toISOString(),
  materialChunks: f139?.db?.totalF138Chunks ?? 0,
  ocrPending: f139?.ocr?.pendingCount ?? null,
  materialSources,
  recovered: f141?.recovered ?? [],
  memoriaIaSurface: 'MemoriaAIWizard',
  implementedUi: [
    'F142 material evidence panel in Memoria IA.',
    'Generated memory text includes material evidence, OCR warning and reviewed-value policy.',
    'Update Center tracks F142 status and next improvements.',
  ],
  pendingDocuments: [
    'No F138/F141 material PDF needs reupload for RAG use.',
    'Optional OCR-review: CARACTERIZACION page 24 and ScanPRO pages 2/10.',
    'Historical F75 blockers if needed later: NCRP 49 and Memoria AL Zumaya.',
  ],
  nextImprovements: [
    'Clickable citation picker and reviewed/unreviewed vendor value state.',
    'Material appendix in PDF report with source/page/hash/OCR status.',
    'Selected-barrier material panel with evidence confidence and structural review flag.',
  ],
  decision:
    'F142 makes Memoria IA consume the recovered material evidence package and keeps vendor/lab data separate from normative calculation sources.',
};

writeFileSync(path.join(outputDir, 'f142_memoria_material_evidence.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(
  path.join(root, 'outputs', 'fase_142_memoria_material_evidence.md'),
  [
    '# F142 Memoria IA Material Evidence',
    '',
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    `Material chunks: ${output.materialChunks}`,
    `OCR pending: ${output.ocrPending}`,
    '',
    '## Material Sources',
    ...materialSources.map((row) => `- ${row.source}: ${row.count} chunks`),
    '',
    '## Pending Documents',
    ...output.pendingDocuments.map((item) => `- ${item}`),
    '',
    '## Next Improvements',
    ...output.nextImprovements.map((item) => `- ${item}`),
    '',
    `Decision: ${output.decision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F142 memoria material evidence ${output.status}: ${output.materialChunks} chunks, OCR pending ${output.ocrPending}`);
if (output.status === 'blocked') process.exit(1);
