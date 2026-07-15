/**
 * ═══════════════════════════════════════════════════════════
 * VectorDB — IndexedDB-based vector database for RAG
 * Stores embeddings with cosine similarity search
 * ═══════════════════════════════════════════════════════════
 */

const DB_NAME = 'RadShieldVectorDB';
const DB_VERSION = 1;
const STORE_CHUNKS = 'chunks';
const STORE_DOCS = 'documents';
const STORE_META = 'metadata';

interface VectorChunk {
  id: string;
  docId: string;
  content: string;
  embedding: number[];
  source: string;
  section?: string;
  page?: number;
  createdAt: string;
  version: number;
}

interface StoredDocument {
  id: string;
  title: string;
  source: string;
  authors?: string;
  year?: number;
  standard?: string; // e.g., "NCRP-151", "NCRP-147", "IAEA-47"
  totalChunks: number;
  chunkSize: number;
  overlap: number;
  createdAt: string;
  lastUpdated: string;
  version: number;
  isWebSourced?: boolean;
  url?: string;
}

interface DBMetadata {
  key: string;
  value: any;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_CHUNKS)) {
        const cs = db.createObjectStore(STORE_CHUNKS, { keyPath: 'id' });
        cs.createIndex('docId', 'docId', { unique: false });
        cs.createIndex('source', 'source', { unique: false });
        cs.createIndex('standard', 'standard', { unique: false });
        cs.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_DOCS)) {
        db.createObjectStore(STORE_DOCS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
  });
  return dbPromise;
}

// ─── Cosine Similarity ───
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-10);
}

// ─── Store chunks with embeddings ───
export async function storeChunks(
  docId: string,
  chunks: Array<{
    content: string;
    embedding: number[];
    section?: string;
    page?: number;
  }>,
  metadata: {
    title: string;
    source: string;
    authors?: string;
    year?: number;
    standard?: string;
    isWebSourced?: boolean;
    url?: string;
    chunkSize?: number;
    overlap?: number;
  }
): Promise<void> {
  const db = await openDB();

  // Delete old chunks for this doc
  await deleteDocument(docId);

  const now = new Date().toISOString();
  const version = Date.now();

  const storedChunks: VectorChunk[] = chunks.map((c, i) => ({
    id: `${docId}_chunk_${i}`,
    docId,
    content: c.content,
    embedding: c.embedding,
    source: metadata.source,
    section: c.section,
    page: c.page,
    createdAt: now,
    version,
  }));

  const doc: StoredDocument = {
    id: docId,
    title: metadata.title,
    source: metadata.source,
    authors: metadata.authors,
    year: metadata.year,
    standard: metadata.standard,
    totalChunks: chunks.length,
    chunkSize: metadata.chunkSize || 512,
    overlap: metadata.overlap || 50,
    createdAt: now,
    lastUpdated: now,
    version,
    isWebSourced: metadata.isWebSourced,
    url: metadata.url,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_CHUNKS, STORE_DOCS], 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    const cs = tx.objectStore(STORE_CHUNKS);
    for (const c of storedChunks) cs.put(c);

    tx.objectStore(STORE_DOCS).put(doc);
  });
}

// ─── Search by embedding similarity ───
export async function searchSimilar(
  queryEmbedding: number[],
  options: { topK?: number; threshold?: number; docIds?: string[]; standard?: string } = {}
): Promise<Array<{ chunk: VectorChunk; similarity: number }>> {
  const { topK = 5, threshold = 0.7, docIds, standard } = options;
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHUNKS, 'readonly');
    const store = tx.objectStore(STORE_CHUNKS);
    const req = store.openCursor();
    const results: Array<{ chunk: VectorChunk; similarity: number }> = [];

    req.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (!cursor) {
        // Sort by similarity desc and return topK
        results.sort((a, b) => b.similarity - a.similarity);
        resolve(results.slice(0, topK));
        return;
      }
      const chunk = cursor.value as VectorChunk;

      // Filter by docIds if specified
      if (docIds && !docIds.includes(chunk.docId)) { cursor.continue(); return; }

      const sim = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (sim >= threshold) {
        results.push({ chunk, similarity: sim });
      }
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── Get all documents ───
export async function getAllDocuments(): Promise<StoredDocument[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readonly');
    const req = tx.objectStore(STORE_DOCS).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Delete document and all its chunks ───
export async function deleteDocument(docId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_CHUNKS, STORE_DOCS], 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    const cs = tx.objectStore(STORE_CHUNKS);
    const idx = cs.index('docId');
    const req = idx.openCursor(IDBKeyRange.only(docId));
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result;
      if (cursor) { cs.delete(cursor.primaryKey); cursor.continue(); }
    };
    tx.objectStore(STORE_DOCS).delete(docId);
  });
}

// ─── Get DB stats ───
export async function getVectorDBStats(): Promise<{
  totalDocs: number;
  totalChunks: number;
  standards: string[];
  lastUpdated: string | null;
}> {
  const db = await openDB();
  const docs = await getAllDocuments();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHUNKS, 'readonly');
    const req = tx.objectStore(STORE_CHUNKS).count();
    req.onsuccess = () => {
      const standards = [...new Set(docs.filter(d => d.standard).map(d => d.standard!))];
      resolve({
        totalDocs: docs.length,
        totalChunks: req.result,
        standards,
        lastUpdated: docs.length > 0
          ? docs.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))[0].lastUpdated
          : null,
      });
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── Get chunks by document ───
export async function getChunksByDoc(docId: string): Promise<VectorChunk[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHUNKS, 'readonly');
    const idx = tx.objectStore(STORE_CHUNKS).index('docId');
    const req = idx.getAll(docId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Clear entire DB ───
export async function clearVectorDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_CHUNKS, STORE_DOCS, STORE_META], 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
    tx.objectStore(STORE_CHUNKS).clear();
    tx.objectStore(STORE_DOCS).clear();
    tx.objectStore(STORE_META).clear();
  });
}

// ─── Export/Import ───
export async function exportVectorDB(): Promise<{ docs: StoredDocument[]; chunks: VectorChunk[] }> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_CHUNKS, STORE_DOCS], 'readonly');
    const docsReq = tx.objectStore(STORE_DOCS).getAll();
    const chunksReq = tx.objectStore(STORE_CHUNKS).getAll();

    tx.oncomplete = () => resolve({ docs: docsReq.result, chunks: chunksReq.result });
    tx.onerror = () => reject(tx.error);
  });
}

export async function importVectorDB(data: { docs: StoredDocument[]; chunks: VectorChunk[] }): Promise<void> {
  await clearVectorDB();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_CHUNKS, STORE_DOCS], 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
    const cs = tx.objectStore(STORE_CHUNKS);
    const ds = tx.objectStore(STORE_DOCS);
    for (const c of data.chunks) cs.put(c);
    for (const d of data.docs) ds.put(d);
  });
}

// ─── Store/Retrieve metadata ───
export async function setMeta(key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readwrite');
    const req = tx.objectStore(STORE_META).put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getMeta(key: string): Promise<any | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readonly');
    const req = tx.objectStore(STORE_META).get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}

export type { VectorChunk, StoredDocument };
export { cosineSimilarity };
