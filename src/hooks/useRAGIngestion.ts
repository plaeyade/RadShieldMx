/**
 * ═══════════════════════════════════════════════════════════
 * useRAGIngestion — RAG document ingestion pipeline
 * Chunks documents, generates embeddings, stores in VectorDB
 * ═══════════════════════════════════════════════════════════
 */
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { autoChunk, estimateTokens } from '@/lib/rag/chunker';
import { storeChunks, getVectorDBStats, deleteDocument, getAllDocuments, clearVectorDB, exportVectorDB, importVectorDB, type StoredDocument } from '@/lib/rag/vectorDB';
import { generateEmbeddingsBatch } from '@/lib/llm/client';
import { PRELOADED_DOCUMENTS } from '@/lib/rag/preloadedDocuments';

export interface IngestionJob {
  id: string;
  docId: string;
  title: string;
  status: 'queued' | 'chunking' | 'embedding' | 'storing' | 'done' | 'error';
  progress: number;
  chunksTotal: number;
  chunksDone: number;
  error?: string;
  startTime: string;
  endTime?: string;
}

export interface WebSource {
  id: string;
  url: string;
  title: string;
  standard?: string;
  status: 'pending' | 'scraped' | 'ingested' | 'error';
  lastChecked?: string;
}

const BUILT_IN_SOURCES: WebSource[] = [
  { id: 'ncrp-151', url: 'https://ncrponline.org/publications/reports/', title: 'NCRP Report No. 151 — Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities', standard: 'NCRP-151', status: 'pending' },
  { id: 'ncrp-144', url: 'https://ncrponline.org/publications/reports/', title: 'NCRP Report No. 144 — Radiation Protection for Particle Accelerator Facilities', standard: 'NCRP-144', status: 'pending' },
  { id: 'ncrp-147', url: 'https://ncrponline.org/publications/reports/', title: 'NCRP Report No. 147 — Structural Shielding Design for Medical X-Ray Imaging Facilities', standard: 'NCRP-147', status: 'pending' },
  { id: 'iaea-47', url: 'https://www.iaea.org/publications/7231/radiation-protection-in-the-design-of-radiotherapy-facilities', title: 'IAEA Safety Reports Series No. 47 — Radiation Protection in the Design of Radiotherapy Facilities', standard: 'IAEA-47', status: 'pending' },
  { id: 'icru-57', url: 'https://www.icru.org/report/secondary-electron-spectra-from-charged-particle-interactions-icru-report-57-2006/', title: 'ICRU Report 57 — Secondary Electron Spectra from Charged Particle Interactions', standard: 'ICRU-57', status: 'pending' },
  { id: 'icru-78', url: 'https://www.icru.org/report/prescribing-recording-and-reporting-proton-beam-therapy-icru-report-78-2007/', title: 'ICRU Report 78 — Prescribing, Recording, and Reporting Proton-Beam Therapy', standard: 'ICRU-78', status: 'pending' },
  { id: 'aapm-tg108', url: 'https://www.aapm.org/pubs/reports/', title: 'AAPM TG-108 — PET and PET/CT Shielding Requirements', standard: 'AAPM-TG108', status: 'pending' },
  { id: 'aapm-tg96', url: 'https://www.aapm.org/pubs/reports/', title: 'AAPM TG-96 — The Measurement, Reporting, and Management of Radiation Dose in CT', standard: 'AAPM-TG96', status: 'pending' },
  { id: 'ipem-109', url: 'https://www.ipem.ac.uk/publications/ipem-reports/', title: 'IPEM Report 109 — Guidance for the Clinical Implementation of Monte Carlo Treatment Planning', standard: 'IPEM-109', status: 'pending' },
];

export function useRAGIngestion() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [stats, setStats] = useState<{ totalDocs: number; totalChunks: number; standards: string[]; lastUpdated: string | null } | null>(null);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [webSources, setWebSources] = useState<WebSource[]>(() => {
    const saved = localStorage.getItem('radshield_web_sources');
    return saved ? JSON.parse(saved) : BUILT_IN_SOURCES;
  });
  const [isIngesting, setIsIngesting] = useState(false);
  const queueRef = useRef<IngestionJob[]>([]);
  const processingRef = useRef(false);

  // ─── Refresh stats and documents list ───
  const refresh = useCallback(async () => {
    const s = await getVectorDBStats();
    setStats(s);
    const docs = await getAllDocuments();
    setDocuments(docs);
  }, []);

  // ─── Ingest a text document ───
  const ingestDocument = useCallback(async (
    text: string,
    metadata: {
      docId: string;
      title: string;
      source: string;
      authors?: string;
      year?: number;
      standard?: string;
      isWebSourced?: boolean;
      url?: string;
      docType?: 'ncrp' | 'iaea' | 'icru' | 'generic' | 'web';
    }
  ) => {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const job: IngestionJob = {
      id: jobId,
      docId: metadata.docId,
      title: metadata.title,
      status: 'queued',
      progress: 0,
      chunksTotal: 0,
      chunksDone: 0,
      startTime: new Date().toISOString(),
    };

    setJobs(prev => [...prev, job]);
    queueRef.current.push(job);

    if (processingRef.current) return job;
    processingRef.current = true;
    setIsIngesting(true);

    try {
      // Process queue
      while (queueRef.current.length > 0) {
        const currentJob = queueRef.current[0];

        try {
          // 1. Chunking
          setJobs(prev => prev.map(j => j.id === currentJob.id ? { ...j, status: 'chunking' } : j));
          const chunks = autoChunk(text, metadata.docType || 'generic');
          const estimatedTokens = estimateTokens(text);

          setJobs(prev => prev.map(j => j.id === currentJob.id ? { ...j, status: 'embedding', chunksTotal: chunks.length, progress: 10 } : j));

          // 2. Generate embeddings in batches of 20
          const BATCH_SIZE = 20;
          const embeddings: number[][] = [];
          for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            const results = await generateEmbeddingsBatch(batch.map(c => c.content));
            embeddings.push(...results.map(r => r.embedding));

            const progress = 10 + Math.round(((i + batch.length) / chunks.length) * 70);
            const chunksDone = Math.min(i + BATCH_SIZE, chunks.length);
            setJobs(prev => prev.map(j => j.id === currentJob.id ? { ...j, progress, chunksDone } : j));
          }

          // 3. Store in VectorDB
          setJobs(prev => prev.map(j => j.id === currentJob.id ? { ...j, status: 'storing', progress: 85 } : j));

          await storeChunks(
            metadata.docId,
            chunks.map((c, i) => ({ content: c.content, embedding: embeddings[i], section: c.section, page: c.page })),
            {
              title: metadata.title,
              source: metadata.source,
              authors: metadata.authors,
              year: metadata.year,
              standard: metadata.standard,
              isWebSourced: metadata.isWebSourced,
              url: metadata.url,
            }
          );

          setJobs(prev => prev.map(j => j.id === currentJob.id ? { ...j, status: 'done', progress: 100, endTime: new Date().toISOString() } : j));
          toast.success(`Documento ingestado: ${metadata.title}`, { description: `${chunks.length} chunks, ~${estimatedTokens} tokens` });

        } catch (err: any) {
          setJobs(prev => prev.map(j => j.id === currentJob.id ? { ...j, status: 'error', error: err.message || 'Unknown error', endTime: new Date().toISOString() } : j));
          toast.error(`Error ingestando: ${metadata.title}`, { description: err.message });
        }

        queueRef.current.shift();
      }
    } finally {
      processingRef.current = false;
      setIsIngesting(false);
      await refresh();
    }

    return job;
  }, [refresh]);

  // ─── Delete document ───
  const removeDocument = useCallback(async (docId: string) => {
    await deleteDocument(docId);
    toast.success('Documento eliminado');
    await refresh();
  }, [refresh]);

  // ─── Clear all ───
  const clearAll = useCallback(async () => {
    await clearVectorDB();
    toast.success('Base de datos vectorial limpiada');
    await refresh();
  }, [refresh]);

  // ─── Export/Import ───
  const exportDB = useCallback(async () => {
    const data = await exportVectorDB();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radshield-vectordb-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Base de datos exportada');
  }, []);

  const importDB = useCallback(async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text);
    await importVectorDB(data);
    toast.success('Base de datos importada');
    await refresh();
  }, [refresh]);

  // ─── Add web source ───
  const addWebSource = useCallback((source: Omit<WebSource, 'id'>) => {
    const id = `web_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newSource: WebSource = { ...source, id };
    setWebSources(prev => {
      const updated = [...prev, newSource];
      localStorage.setItem('radshield_web_sources', JSON.stringify(updated));
      return updated;
    });
    return id;
  }, []);

  // ─── Update web source status ───
  const updateWebSource = useCallback((id: string, updates: Partial<WebSource>) => {
    setWebSources(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates, lastChecked: new Date().toISOString() } : s);
      localStorage.setItem('radshield_web_sources', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ─── Ingest preloaded documents (NCRP 144, NCRP 151 extended, Concreto Baritado) ───
  const ingestPreloadedDocuments = useCallback(async (docIds?: string[]) => {
    const docsToIngest = docIds
      ? PRELOADED_DOCUMENTS.filter(d => docIds.includes(d.docId))
      : PRELOADED_DOCUMENTS;

    const results: { docId: string; title: string; status: 'done' | 'error'; error?: string }[] = [];

    for (const doc of docsToIngest) {
      try {
        await ingestDocument(doc.content, {
          docId: doc.docId,
          title: doc.title,
          source: doc.source,
          authors: doc.authors,
          year: doc.year,
          standard: doc.standard,
          docType: doc.docType,
        });
        results.push({ docId: doc.docId, title: doc.title, status: 'done' });
      } catch (err: any) {
        results.push({ docId: doc.docId, title: doc.title, status: 'error', error: err.message });
      }
    }

    return results;
  }, [ingestDocument]);

  return {
    jobs,
    stats,
    documents,
    webSources,
    isIngesting,
    ingestDocument,
    removeDocument,
    clearAll,
    exportDB,
    importDB,
    refresh,
    addWebSource,
    updateWebSource,
    ingestPreloadedDocuments,
  };
}
