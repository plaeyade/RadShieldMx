import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = process.cwd();
const outputsDir = join(root, 'outputs');
const manifestPath = join(outputsDir, 'f75_pdf_ingestion', 'f75_pdf_ingestion_manifest.json');
const chunksPath = join(outputsDir, 'f75_pdf_ingestion', 'f75_pdf_rag_chunks.jsonl');
const seedPath = join(outputsDir, 'f76_seed', 'f76_seed_document_chunks_report.json');
const ocrPath = join(outputsDir, 'f76_ocr', 'f76_ocr_status.json');
const ocrDbPath = join(outputsDir, 'f77_ocr_db', 'f77_ocr_install_db_readiness.json');
const outputJsonPath = join(outputsDir, 'f104_document_closure_manifest.json');
const outputMdPath = join(outputsDir, 'fase_104_document_rag_ocr_menu_closure.md');

function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readChunks(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function hashText(text) {
  return createHash('sha256').update(text).digest('hex');
}

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return [...map.entries()].filter(([, group]) => group.length > 1);
}

mkdirSync(outputsDir, { recursive: true });

const f75Manifest = readJson(manifestPath, { documents: [] });
const seedReport = readJson(seedPath, {});
const ocrStatus = readJson(ocrPath, {});
const ocrDbStatus = readJson(ocrDbPath, {});
const chunks = readChunks(chunksPath);

const chunkHashGroups = groupBy(
  chunks.map((chunk) => ({
    id: chunk.id,
    docId: chunk.docId,
    standard: chunk.standard,
    page: chunk.page,
    hash: hashText(String(chunk.content || '').replace(/\s+/g, ' ').trim()),
  })),
  (chunk) => chunk.hash,
);

const documents = (f75Manifest.documents || []).map((doc) => {
  const docChunks = chunks.filter((chunk) => chunk.docId === doc.id);
  const liveDbStatus = seedReport.mode === 'live' && seedReport.ok && Number(seedReport.inserted) > 0
    ? 'seeded-live'
    : 'prepared-only';
  const ingestionStatus = doc.status === 'prepared'
    ? liveDbStatus
    : doc.status === 'empty'
      ? 'needs-ocr'
      : doc.status === 'pending'
        ? 'missing-source'
        : doc.status;

  return {
    id: doc.id,
    title: doc.title,
    sourceFile: basename(doc.path || ''),
    standard: doc.standard,
    kind: doc.kind,
    status: doc.status,
    ingestionStatus,
    sha256: doc.sha256,
    sizeBytes: doc.sizeBytes,
    pages: doc.pages,
    extractedPages: doc.extractedPages,
    chunks: docChunks.length || doc.chunks || 0,
    reason: doc.reason,
    path: doc.path,
  };
});

const exactDocumentDuplicates = groupBy(
  documents.filter((doc) => doc.sha256),
  (doc) => doc.sha256,
).map(([sha256, group]) => ({
  sha256,
  documentIds: group.map((doc) => doc.id),
  titles: [...new Set(group.map((doc) => doc.title))],
}));

const semanticDocumentDuplicates = groupBy(
  documents,
  (doc) => `${doc.standard}|${normalizeTitle(doc.title)}`,
).map(([key, group]) => ({
  key,
  documentIds: group.map((doc) => doc.id),
  statuses: group.map((doc) => doc.status),
}));

const preparedDocuments = documents.filter((doc) => doc.status === 'prepared');
const needsOcr = documents.filter((doc) => doc.ingestionStatus === 'needs-ocr');
const missingSources = documents.filter((doc) => doc.ingestionStatus === 'missing-source');
const liveSeeded = seedReport.mode === 'live' && seedReport.ok && Number(seedReport.inserted) > 0;

const closure = {
  phase: 'F104',
  generatedAt: new Date().toISOString(),
  ok: true,
  f102Reconciliation: {
    currentMeaning: 'F102 in codebase is Memoria IA design plan; user-requested RAG/OCR closure is handled here in F104.',
    memoriaDesignPlanContract: 'test:f102:memoria-design-plan',
    memoriaActionFlowContract: 'test:f103:memoria-action-flow',
  },
  documentSummary: {
    totalDocuments: documents.length,
    preparedDocuments: preparedDocuments.length,
    preparedChunks: chunks.length,
    liveDbSeeded: liveSeeded,
    liveDbInsertedRows: Number(seedReport.inserted || 0),
    needsOcr: needsOcr.length,
    missingSources: missingSources.length,
    exactDuplicateGroups: exactDocumentDuplicates.length,
    semanticDuplicateGroups: semanticDocumentDuplicates.length,
    duplicateChunkGroups: chunkHashGroups.length,
  },
  seedReport: {
    mode: seedReport.mode || 'unknown',
    databaseUrlConfigured: Boolean(seedReport.databaseUrlConfigured),
    reason: seedReport.reason || '',
    sources: seedReport.sources || [],
  },
  ocrStatus: {
    ok: Boolean(ocrStatus.ok),
    candidateCount: Number(ocrStatus.candidateCount || 0),
    missingTools: Object.entries(ocrStatus.tools || {})
      .filter(([, value]) => !value)
      .map(([key]) => key),
    candidates: (ocrStatus.results || []).map((item) => ({
      id: item.id,
      status: item.status,
      textPath: item.textPath,
      reason: item.reason,
    })),
  },
  ocrDbReadiness: {
    ok: Boolean(ocrDbStatus.ok),
    databaseUrlConfigured: Boolean(ocrDbStatus.databaseUrlConfigured),
    canRunAutomaticOcr: Boolean(ocrDbStatus.canRunAutomaticOcr),
    liveSeedArmed: Boolean(ocrDbStatus.liveSeedArmed),
    blockers: ocrDbStatus.blockers || [],
  },
  duplicates: {
    exactDocumentDuplicates,
    semanticDocumentDuplicates,
    duplicateChunkGroups: chunkHashGroups.map(([hash, group]) => ({
      hash,
      count: group.length,
      sample: group.slice(0, 4),
    })),
  },
  menuFinalGate: {
    requestedFlow: ['Diseno', 'Equipos', 'Blindaje', 'Verificacion', 'Reportes', 'Evidencia', 'Integraciones'],
    currentStatus: 'staged-not-final',
    evidence: [
      'F94/F95 dejaron physicalMoveNow=false hasta smoke.',
      'F96 migro Diseno parcialmente.',
      'F97 migro Equipos parcialmente.',
      'F101 quito duplicidad visible de Diseno legacy.',
    ],
    decision: 'No hacer remocion masiva de menus hasta pasar smoke completo por grupo.',
    nextContracts: [
      'test:f94:dropdown-parity',
      'test:f95:dropdown-smoke',
      'test:f101:access-dedup',
      'test:submenus:smoke',
    ],
  },
  documents,
};

const mdLines = [
  '# F104 - Cierre RAG/documentos/OCR y gate de menus',
  '',
  '## Que paso con F102/F103',
  '',
  '- F102 en codigo quedo como plan de diseno de Memoria IA basado en floorplan/equipo.',
  '- F103 en codigo quedo como flujo accionable de Memoria IA.',
  '- La peticion actual de RAG/documentos/OCR se cierra formalmente en F104 para evitar mezclar nombres de fase.',
  '',
  '## Documentos realmente listos',
  '',
  `- Documentos declarados: ${closure.documentSummary.totalDocuments}.`,
  `- Documentos preparados para RAG: ${closure.documentSummary.preparedDocuments}.`,
  `- Chunks preparados: ${closure.documentSummary.preparedChunks}.`,
  `- Seed live DB: ${liveSeeded ? `si (${closure.documentSummary.liveDbInsertedRows} filas)` : 'no; solo dry-run/preparado'}.`,
  `- Requieren OCR: ${closure.documentSummary.needsOcr}.`,
  `- Fuentes no accesibles: ${closure.documentSummary.missingSources}.`,
  '',
  '## Preparados para RAG',
  '',
  ...preparedDocuments.map((doc) => `- ${doc.id}: ${doc.standard}, ${doc.chunks} chunks, sha256 ${doc.sha256?.slice(0, 12) || 'n/a'}...`),
  '',
  '## Pendientes OCR o fuente',
  '',
  ...[...needsOcr, ...missingSources].map((doc) => `- ${doc.id}: ${doc.ingestionStatus}; ${doc.reason || 'sin razon'}`),
  '',
  '## Duplicados',
  '',
  `- Duplicados exactos por sha256: ${closure.documentSummary.exactDuplicateGroups}.`,
  `- Duplicados semanticos por titulo/norma: ${closure.documentSummary.semanticDuplicateGroups}.`,
  `- Chunks duplicados exactos: ${closure.documentSummary.duplicateChunkGroups}.`,
  '',
  '## DB',
  '',
  `- DATABASE_URL configurada durante F76: ${closure.seedReport.databaseUrlConfigured ? 'si' : 'no'}.`,
  `- Motivo seed: ${closure.seedReport.reason || 'n/a'}.`,
  '',
  '## OCR',
  '',
  `- OCR automatico disponible: ${closure.ocrDbReadiness.canRunAutomaticOcr ? 'si' : 'no'}.`,
  `- Herramientas faltantes: ${closure.ocrStatus.missingTools.join(', ') || 'ninguna'}.`,
  '- Convencion sidecar segura: `outputs/f76_ocr/extracted_text/{documentId}.txt` o `data/rag/ocr/{documentId}.txt`.',
  '',
  '## Menus finales',
  '',
  '- Estado: staged-not-final.',
  '- Flujo objetivo: Diseno -> Equipos -> Blindaje -> Verificacion -> Reportes -> Evidencia -> Integraciones.',
  '- Decision: no quitar mas duplicados ni mover menus masivamente hasta pasar smoke por grupo.',
  '',
  '## Siguiente fase recomendada',
  '',
  '- F105: ejecutar smoke de menus/submenus y entonces hacer migracion fisica final por grupos.',
  '- F106: habilitar OCR externo o sidecars para NCRP-49 y Memoria AL, regenerar chunks y repetir este manifiesto.',
  '- F107: cuando MySQL este estable, ejecutar seed live y cerrar DB/RAG como producto multiusuario.',
  '',
];

writeFileSync(outputJsonPath, `${JSON.stringify(closure, null, 2)}\n`, 'utf8');
writeFileSync(outputMdPath, `${mdLines.join('\n')}\n`, 'utf8');
console.log(JSON.stringify({
  ok: true,
  json: outputJsonPath,
  md: outputMdPath,
  summary: closure.documentSummary,
}, null, 2));
