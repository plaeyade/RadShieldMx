/**
 * ═══════════════════════════════════════════════════════════
 * Document Chunker — Smart text segmentation for RAG
 * Handles NCRP/IAEA style documents with section detection
 * ═══════════════════════════════════════════════════════════
 */

export interface TextChunk {
  content: string;
  section?: string;
  page?: number;
  charStart: number;
  charEnd: number;
}

const DEFAULT_CHUNK_SIZE = 512;
const DEFAULT_OVERLAP = 100;
const MIN_CHUNK_SIZE = 100;

// ─── Section header patterns for shielding documents ───
const SECTION_PATTERNS = [
  /^\s*(?:\d+\.\d*\s+|[IVX]+[.\)]\s+|(?:Section|Appendix|Annex|Table|Figure)\s+[A-Z\d][.\d]*[:.\s])/im,
  /^\s*(?:\d+\.\d+\s+[A-Z][^a-z]{3,})/m, // "2.1 PRIMARY BARRIERS"
  /^\s*(?:Abstract|Introduction|Methods?|Results?|Discussion|Conclusion|References?|Bibliography)/im,
];

/** Detect if a line is a section header */
function isSectionHeader(line: string): boolean {
  return SECTION_PATTERNS.some(p => p.test(line));
}

/** Extract section name from header line */
function extractSectionName(line: string): string | undefined {
  const clean = line.trim().replace(/^\d+[.\d]*\s*/, '').replace(/[:.\s]+$/, '');
  return clean.length > 2 ? clean.substring(0, 80) : undefined;
}

/**
 * Chunk text with smart section-aware splitting.
 * Priorizes section boundaries over fixed size.
 */
export function chunkDocument(
  text: string,
  options: {
    chunkSize?: number;
    overlap?: number;
    preserveSections?: boolean;
  } = {}
): TextChunk[] {
  const { chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_OVERLAP, preserveSections = true } = options;

  if (text.length <= chunkSize) {
    return [{ content: text.trim(), charStart: 0, charEnd: text.length }];
  }

  const chunks: TextChunk[] = [];
  const sentences = splitIntoSentences(text);

  let currentChunk = '';
  let currentSection: string | undefined;
  let charStart = 0;
  let lastBoundary = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];

    // Detect section headers
    if (preserveSections && isSectionHeader(sentence)) {
      // Flush current chunk if it has content
      if (currentChunk.length >= MIN_CHUNK_SIZE) {
        chunks.push({
          content: currentChunk.trim(),
          section: currentSection,
          charStart,
          charEnd: lastBoundary,
        });
      }
      currentSection = extractSectionName(sentence) || currentSection;
      currentChunk = sentence + ' ';
      charStart = lastBoundary;
      lastBoundary += sentence.length + 1;
      continue;
    }

    // Check if adding this sentence exceeds chunkSize
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length >= MIN_CHUNK_SIZE) {
      chunks.push({
        content: currentChunk.trim(),
        section: currentSection,
        charStart,
        charEnd: lastBoundary,
      });

      // Overlap: keep last N characters
      if (overlap > 0) {
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + ' ' + sentence + ' ';
        charStart = lastBoundary - overlapText.length;
      } else {
        currentChunk = sentence + ' ';
        charStart = lastBoundary;
      }
    } else {
      currentChunk += sentence + ' ';
    }

    lastBoundary += sentence.length + 1;
  }

  // Flush remaining
  if (currentChunk.trim().length >= MIN_CHUNK_SIZE / 2) {
    chunks.push({
      content: currentChunk.trim(),
      section: currentSection,
      charStart,
      charEnd: text.length,
    });
  }

  return chunks;
}

/** Split text into sentences respecting abbreviations */
function splitIntoSentences(text: string): string[] {
  // Protect common abbreviations
  const protected_text = text
    .replace(/\b(?:Fig|Table|Eq|Ref|e\.g|i\.e|vs|et al|Dr|Mr|Mrs|Ms|Prof|Jr|Sr|Inc|Ltd|Co)\./g, m => m.replace('.', '\x00'));

  const sentences = protected_text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.replace(/\x00/g, '.').trim())
    .filter(s => s.length > 0);

  return sentences;
}

/**
 * Chunk a PDF-like document with page markers.
 * Input format: "--- Page N ---\n content"
 */
export function chunkPDFDocument(
  text: string,
  options: { chunkSize?: number; overlap?: number } = {}
): TextChunk[] {
  const pages = text.split(/---\s*Page\s*(\d+)\s*---/);
  const allChunks: TextChunk[] = [];

  for (let i = 1; i < pages.length; i += 2) {
    const pageNum = parseInt(pages[i], 10);
    const pageContent = pages[i + 1] || '';
    const pageChunks = chunkDocument(pageContent, options);
    for (const c of pageChunks) {
      allChunks.push({ ...c, page: pageNum });
    }
  }

  // If no page markers found, treat as single document
  if (allChunks.length === 0) {
    return chunkDocument(text, options);
  }

  return allChunks;
}

/**
 * Auto-detect document type and apply appropriate chunking.
 */
export function autoChunk(
  text: string,
  docType: 'ncrp' | 'iaea' | 'icru' | 'generic' | 'web' = 'generic',
  options: { chunkSize?: number; overlap?: number } = {}
): TextChunk[] {
  const typeOptions: Record<string, { chunkSize: number; overlap: number }> = {
    ncrp: { chunkSize: 400, overlap: 80 },   // Dense regulatory text
    iaea: { chunkSize: 450, overlap: 90 },   // Safety reports
    icru: { chunkSize: 500, overlap: 100 },  // Scientific reports
    generic: { chunkSize: options.chunkSize || 512, overlap: options.overlap || 100 },
    web: { chunkSize: 300, overlap: 50 },    // Web articles are shorter
  };

  const opts = { ...typeOptions[docType], ...options };
  return chunkDocument(text, opts);
}

/** Estimate token count (rough: 1 token ≈ 4 chars for English) */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Batch chunks for embedding API limits */
export function batchChunks<T>(chunks: T[], batchSize: number = 100): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    batches.push(chunks.slice(i, i + batchSize));
  }
  return batches;
}
