export type F268MemoryModality = 'DX' | 'TX' | 'NM' | 'CY' | 'Brachy' | 'GammaKnife';

export interface F268MemoryDocumentSummary {
  id: string;
  title: string;
  modality: F268MemoryModality;
  equipmentFamily: string;
  status: 'rag-ready' | 'duplicate-skipped' | 'needs-ocr' | 'missing-source' | 'error';
  pages: number;
  chunks: number;
  sha256: string | null;
  duplicateOf?: string;
}

export interface F268RealAnalyticMemoryIngestionSummary {
  phase: 'F268';
  status: 'real-memory-ingestion-ready';
  documentCount: number;
  canonicalCount: number;
  duplicateCount: number;
  ragReadyCount: number;
  needsOcrCount: number;
  chunkCount: number;
  modalities: F268MemoryModality[];
  documents: F268MemoryDocumentSummary[];
  evidence: string[];
  releaseDecision: string;
  nextPhase: 'F268A';
}

export const F268_EXPECTED_MEMORY_SCOPE = [
  'LINAC Versa HD 15 MV analytic examples',
  'Gamma Knife HAHS Pedregal analytic memory',
  'Braqui Co-60 analytic example',
  'Cyclotron KIUBE / production lab analytic memories',
  'Cyclotron calculation memory',
];

export function buildF268RealAnalyticMemoryIngestionSummary(
  documents: F268MemoryDocumentSummary[] = [],
): F268RealAnalyticMemoryIngestionSummary {
  const canonical = documents.filter((doc) => doc.status !== 'duplicate-skipped');
  const modalities = Array.from(new Set(canonical.map((doc) => doc.modality))).sort() as F268MemoryModality[];
  const ragReadyCount = canonical.filter((doc) => doc.status === 'rag-ready').length;
  const needsOcrCount = canonical.filter((doc) => doc.status === 'needs-ocr').length;
  return {
    phase: 'F268',
    status: 'real-memory-ingestion-ready',
    documentCount: documents.length,
    canonicalCount: canonical.length,
    duplicateCount: documents.length - canonical.length,
    ragReadyCount,
    needsOcrCount,
    chunkCount: canonical.reduce((sum, doc) => sum + doc.chunks, 0),
    modalities,
    documents,
    evidence: [
      'outputs/f268_real_memory_ingestion/f268_real_memory_ingestion.json',
      'outputs/f268_real_memory_ingestion/f268_document_chunks_db_draft.json',
      'outputs/f268_real_memory_ingestion/f268_document_chunks.jsonl',
      'outputs/fase_268_real_memory_ingestion.md',
    ],
    releaseDecision:
      'F268 memories are examples/training/evidence references for Memoria IA and QA. They do not override normative NCRP/IAEA/UAQ formulas and require source governance before signed clinical output.',
    nextPhase: 'F268A',
  };
}

export function summarizeF268RealAnalyticMemoryIngestion(summary?: F268RealAnalyticMemoryIngestionSummary): string {
  const value = summary ?? buildF268RealAnalyticMemoryIngestionSummary();
  return [
    'F268 REAL ANALYTIC MEMORY INGESTION',
    `Status: ${value.status}`,
    `Documents: ${value.documentCount}; canonical: ${value.canonicalCount}; duplicates: ${value.duplicateCount}`,
    `RAG ready: ${value.ragReadyCount}; needs OCR: ${value.needsOcrCount}; chunks: ${value.chunkCount}`,
    `Modalities: ${value.modalities.join(', ') || 'pending live manifest'}`,
    `Decision: ${value.releaseDecision}`,
  ].join('\n');
}
