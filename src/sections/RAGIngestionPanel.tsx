/**
 * ═══════════════════════════════════════════════════════════
 * RAGIngestionPanel — UI for managing the vector database
 * Ingest documents, view stats, manage web sources
 * ═══════════════════════════════════════════════════════════
 */
import { useEffect, useState, useRef } from 'react';
import { Database, Upload, Globe, Trash2, Download, FileUp, BookOpen, Sparkles, X, Loader2, Search, FileText, RefreshCw, CheckCircle, AlertTriangle, Clock, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRAGIngestion } from '@/hooks/useRAGIngestion';
import { useWebScraper, TRUSTED_SOURCES } from '@/hooks/useWebScraper';
import { extractPdfText } from '@/lib/rag/pdfTextExtractor';

type RAGDocType = 'ncrp' | 'iaea' | 'icru' | 'generic' | 'web';

interface Props {
  onClose: () => void;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  ncrp: 'NCRP', iaea: 'IAEA', icru: 'ICRU', generic: 'General', web: 'Web',
};

function inferStandardFromFileName(fileName: string): string {
  const normalized = fileName.toLowerCase();
  if (normalized.includes('ncrp') && normalized.includes('151')) return 'NCRP-151';
  if (normalized.includes('ncrp') && normalized.includes('147')) return 'NCRP-147';
  if (normalized.includes('ncrp') && normalized.includes('144')) return 'NCRP-144';
  if (normalized.includes('particle') || normalized.includes('partic')) return 'NCRP-144';
  if (normalized.includes('structural shielding') || normalized.includes('medical x-ray')) return 'NCRP-147';
  if (normalized.includes('iaea') || normalized.includes('radiation protection in the design')) return 'IAEA-SRS-47';
  if (normalized.includes('pet')) return 'MEMORIA-PET';
  if (normalized.includes('hdr') || normalized.includes('braqui')) return 'MEMORIA-HDR';
  if (normalized.includes('zumaya')) return 'MEMORIA-CLINICA';
  return '';
}

function inferDocTypeFromStandard(standard: string): RAGDocType | '' {
  if (standard.startsWith('NCRP')) return 'ncrp';
  if (standard.startsWith('IAEA')) return 'iaea';
  return standard ? 'generic' : '';
}

export default function RAGIngestionPanel({ onClose }: Props) {
  const rag = useRAGIngestion();
  const scraper = useWebScraper();
  const [activeTab, setActiveTab] = useState<'docs' | 'ingest' | 'web' | 'jobs'>('docs');
  const [textInput, setTextInput] = useState('');
  const [f377Minimized, setF377Minimized] = useState(false);
  const [ingestMeta, setIngestMeta] = useState({
    title: '',
    source: '',
    standard: '',
    authors: '',
    year: '',
    docType: 'generic' as RAGDocType,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  // Load stats on mount
  useEffect(() => { void rag.refresh(); }, [rag]);

  const handleFileUpload = async (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const extracted = isPdf ? await extractPdfText(file) : null;
    const text = extracted?.text || await file.text();
    const inferredStandard = inferStandardFromFileName(file.name);
    const inferredDocType = inferDocTypeFromStandard(inferredStandard);
    setTextInput(text);
    setIngestMeta(prev => ({
      ...prev,
      title: file.name.replace(/\.[^/.]+$/, ''),
      source: file.name,
      standard: inferredStandard || prev.standard,
      docType: inferredDocType || prev.docType,
    }));
    setActiveTab('ingest');
  };

  const handleIngest = async () => {
    if (!textInput.trim() || !ingestMeta.title) return;
    await rag.ingestDocument(textInput, {
      docId: `doc_${Date.now()}`,
      title: ingestMeta.title,
      source: ingestMeta.source || 'manual-upload',
      authors: ingestMeta.authors || undefined,
      year: ingestMeta.year ? parseInt(ingestMeta.year) : undefined,
      standard: ingestMeta.standard || undefined,
      docType: ingestMeta.docType,
    });
    setTextInput('');
  };

  const handleWebScrape = async (sourceIndex: number) => {
    const docs = await scraper.scrapeSource(sourceIndex);
    for (const doc of docs) {
      if (doc.isRelevant && doc.content.length > 200) {
        await rag.ingestDocument(doc.content, {
          docId: `web_${doc.id}`,
          title: doc.title,
          source: doc.url,
          standard: doc.standard,
          isWebSourced: true,
          url: doc.url,
          docType: 'web',
        });
      }
    }
    const source = TRUSTED_SOURCES[sourceIndex];
    const webSourceId = rag.webSources.find(w => w.standard === source?.standard)?.id ?? '';
    rag.updateWebSource(webSourceId, {
      status: docs.length > 0 ? 'ingested' : 'error',
    });
  };

  return (
    <div
      className={`fixed right-0 z-50 flex bg-white shadow-2xl border border-slate-200 ${f377Minimized ? 'bottom-4 w-[340px] rounded-lg' : 'inset-y-0 w-[480px] border-l flex-col'}`}
      data-testid="f377-side-panel-shell"
      data-f377-panel="rag-ingestion"
      data-f377-side-panel-minimized={f377Minimized ? 'true' : 'false'}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-white">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-violet-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-800">RAG Vector Database</h2>
            <p className="text-[10px] text-slate-500">v70 — Knowledge Base Manager</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => rag.refresh()}>
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setF377Minimized((value) => !value)} data-testid="f377-side-panel-minimize" title={f377Minimized ? 'Restaurar panel' : 'Minimizar panel'} aria-label={f377Minimized ? 'Restaurar RAG Vector Database' : 'Minimizar RAG Vector Database'}>
            {f377Minimized ? <Maximize2 className="w-4 h-4 text-slate-500" /> : <Minimize2 className="w-4 h-4 text-slate-500" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} data-testid="f377-side-panel-close" title="Cerrar panel" aria-label="Cerrar RAG Vector Database">
            <X className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {f377Minimized ? (
        <button type="button" className="px-4 py-2 text-left text-[11px] font-medium text-slate-600 hover:bg-violet-50" onClick={() => setF377Minimized(false)} data-testid="f377-side-panel-restore">
          Panel minimizado. Pulse para restaurar.
        </button>
      ) : (
      <>

      {/* Stats bar */}
      {rag.stats && (
        <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
          <div className="text-center">
            <div className="text-lg font-bold text-violet-600">{rag.stats.totalDocs}</div>
            <div className="text-[9px] text-slate-500 uppercase">Documentos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-violet-600">{rag.stats.totalChunks}</div>
            <div className="text-[9px] text-slate-500 uppercase">Chunks</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-violet-600">{rag.stats.standards.length}</div>
            <div className="text-[9px] text-slate-500 uppercase">Standards</div>
          </div>
        </div>
      )}

      {/* Standards badges */}
      {rag.stats && rag.stats.standards.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 py-2 border-b border-slate-100">
          {rag.stats.standards.map(s => (
            <Badge key={s} variant="outline" className="text-[9px] bg-violet-50 text-violet-700 border-violet-200">{s}</Badge>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {(['docs', 'ingest', 'web', 'jobs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
              activeTab === tab
                ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab === 'docs' && 'Docs'}
            {tab === 'ingest' && 'Ingest'}
            {tab === 'web' && 'Web'}
            {tab === 'jobs' && `Jobs ${rag.jobs.length > 0 ? `(${rag.jobs.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* DOCS TAB */}
        {activeTab === 'docs' && (
          <>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={() => fileRef.current?.click()}>
                <Upload className="w-3.5 h-3.5" /> Subir archivo
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={() => rag.exportDB()}>
                <Download className="w-3.5 h-3.5" /> Exportar
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={() => fileRef.current?.click()}>
                <FileUp className="w-3.5 h-3.5" /> Importar
              </Button>
            </div>
            <input ref={fileRef} type="file" accept=".txt,.md,.json,.pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />

            {rag.documents.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No hay documentos ingestados</p>
                <p className="text-[10px] mt-1">Sube textos o activa scraper web explicitamente</p>
              </div>
            )}

            {rag.documents.map(doc => (
              <div key={doc.id} className="border border-slate-200 rounded-lg p-3 hover:border-violet-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-semibold text-slate-800 truncate">{doc.title}</h4>
                    <p className="text-[10px] text-slate-500 truncate">{doc.source}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => rag.removeDocument(doc.id)}>
                    <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                  </Button>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {doc.standard && <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700">{doc.standard}</Badge>}
                  <Badge variant="outline" className="text-[9px]">{doc.totalChunks} chunks</Badge>
                  {doc.year && <Badge variant="outline" className="text-[9px]">{doc.year}</Badge>}
                  {doc.isWebSourced && <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700">web</Badge>}
                </div>
              </div>
            ))}
          </>
        )}

        {/* INGEST TAB */}
        {activeTab === 'ingest' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Título" className="h-8 text-[11px]" value={ingestMeta.title} onChange={e => setIngestMeta(p => ({ ...p, title: e.target.value }))} />
              <Input placeholder="Fuente" className="h-8 text-[11px]" value={ingestMeta.source} onChange={e => setIngestMeta(p => ({ ...p, source: e.target.value }))} />
              <Input placeholder="Standard (NCRP-151)" className="h-8 text-[11px]" value={ingestMeta.standard} onChange={e => setIngestMeta(p => ({ ...p, standard: e.target.value }))} />
              <Input placeholder="Año" className="h-8 text-[11px]" value={ingestMeta.year} onChange={e => setIngestMeta(p => ({ ...p, year: e.target.value }))} />
            </div>
            <select
              className="w-full h-8 text-[11px] border border-slate-200 rounded-md px-2"
              value={ingestMeta.docType}
              onChange={e => setIngestMeta(p => ({ ...p, docType: e.target.value as RAGDocType }))}
            >
              {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <textarea
              className="w-full h-40 text-[11px] border border-slate-200 rounded-md p-2 resize-none font-mono"
              placeholder="Pega aquí el texto del documento..."
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
            />
            <Button
              className="w-full h-9 bg-violet-600 hover:bg-violet-700 text-white text-[11px] gap-1"
              disabled={!textInput.trim() || !ingestMeta.title || rag.isIngesting}
              onClick={handleIngest}
            >
              {rag.isIngesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {rag.isIngesting ? 'Ingestando...' : 'Ingestar a VectorDB'}
            </Button>
          </div>
        )}

        {/* WEB TAB */}
        {activeTab === 'web' && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-500">
              Scraper web {scraper.isEnabled ? 'habilitado' : 'deshabilitado por defecto'}. Para usar red externa configure VITE_ENABLE_WEB_SCRAPER=true.
            </p>
            {TRUSTED_SOURCES.map((src, i) => {
              const ws = rag.webSources.find(w => w.standard === src.standard);
              return (
                <div key={src.name} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-blue-500" />
                        {src.name}
                      </h4>
                      <p className="text-[9px] text-slate-500 truncate">{src.searchUrl}</p>
                    </div>
                    <Button
                      size="sm" variant="outline" className="h-7 text-[10px] gap-1"
                      disabled={scraper.isScraping || !scraper.isEnabled}
                      onClick={() => handleWebScrape(i)}
                    >
                      {scraper.isScraping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                      Scrape
                    </Button>
                  </div>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="outline" className="text-[8px]">{src.standard}</Badge>
                    <Badge variant="outline" className="text-[8px]">{src.type}</Badge>
                    {ws && <Badge variant="outline" className={`text-[8px] ${ws.status === 'ingested' ? 'bg-green-50 text-green-700' : ws.status === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{ws.status}</Badge>}
                  </div>
                </div>
              );
            })}

            {scraper.progress.total > 0 && (
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-[10px] text-slate-600">
                  <span>Progreso: {scraper.progress.current}/{scraper.progress.total}</span>
                  <span className="truncate max-w-[250px]">{scraper.progress.currentUrl}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                  <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${scraper.progress.total > 0 ? (scraper.progress.current / scraper.progress.total) * 100 : 0}%` }} />
                </div>
              </div>
            )}

            {scraper.results.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-700">Resultados del scraper:</p>
                {scraper.results.map(r => (
                  <div key={r.id} className={`flex items-center gap-2 text-[10px] p-1.5 rounded ${r.isRelevant ? 'bg-green-50' : 'bg-slate-50'}`}>
                    {r.isRelevant ? <CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> : <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
                    <span className="truncate flex-1">{r.title}</span>
                    <Badge variant="outline" className="text-[8px]">{r.wordCount} words</Badge>
                    <Badge variant="outline" className="text-[8px]">{Math.round(r.relevanceScore * 100)}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* JOBS TAB */}
        {activeTab === 'jobs' && (
          <div className="space-y-2">
            {rag.jobs.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Sin trabajos activos</p>
              </div>
            )}
            {rag.jobs.map(job => (
              <div key={job.id} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-medium text-slate-800 truncate flex-1">{job.title}</h4>
                  <Badge variant="outline" className={`text-[8px] ${
                    job.status === 'done' ? 'bg-green-50 text-green-700' :
                    job.status === 'error' ? 'bg-red-50 text-red-700' :
                    job.status === 'embedding' ? 'bg-blue-50 text-blue-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>{job.status}</Badge>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1 mt-2">
                  <div className={`h-1 rounded-full transition-all ${
                    job.status === 'done' ? 'bg-green-500' : job.status === 'error' ? 'bg-red-500' : 'bg-violet-500'
                  }`} style={{ width: `${job.progress}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>{job.chunksDone}/{job.chunksTotal} chunks</span>
                  <span>{job.progress}%</span>
                </div>
                {job.error && <p className="text-[9px] text-red-500 mt-1">{job.error}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-4 py-2 flex justify-between items-center bg-slate-50">
        <Button variant="ghost" size="sm" className="h-7 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50 gap-1" onClick={() => { if (confirm('¿Eliminar TODA la base de datos vectorial?')) rag.clearAll(); }}>
          <Trash2 className="w-3 h-3" /> Limpiar todo
        </Button>
        {rag.stats?.lastUpdated && (
          <span className="text-[9px] text-slate-400">
            Actualizado: {new Date(rag.stats.lastUpdated).toLocaleDateString()}
          </span>
        )}
      </div>
      </>
      )}
    </div>
  );
}
