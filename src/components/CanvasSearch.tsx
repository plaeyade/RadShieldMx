/**
 * CanvasSearch — Fase 2.10: Busqueda visual en el canvas (Ctrl+F)
 * Encuentra y resalta barreras/fuentes por nombre
 * Ref: Card, Mackinlay & Shneiderman (1999) — Information Visualization
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { FloorPlan, Barrier, RadiationSource } from '@/types/radshield';

interface Props {
  floorPlan: FloorPlan;
  canvasOffset: { x: number; y: number };
  canvasScale: number;
  onFocusElement: (x: number, y: number) => void;
}

interface SearchResult {
  element: Barrier | RadiationSource;
  type: 'barrier' | 'source';
  x: number;
  y: number;
}

export default function CanvasSearch({ floorPlan, onFocusElement }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setIsOpen(v => !v);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    const found: SearchResult[] = [];
    floorPlan.barriers.forEach(b => {
      if (b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)) {
        found.push({ element: b, type: 'barrier', x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2 });
      }
    });
    floorPlan.sources.forEach(s => {
      if (s.name.toLowerCase().includes(q) || s.modality.name.toLowerCase().includes(q)) {
        found.push({ element: s, type: 'source', x: s.x, y: s.y });
      }
    });
    setResults(found);
    setActiveIndex(0);
  }, [query, floorPlan]);

  const navigate = useCallback((dir: 1 | -1) => {
    if (!results.length) return;
    const next = (activeIndex + dir + results.length) % results.length;
    setActiveIndex(next);
    const r = results[next];
    onFocusElement(r.x, r.y);
  }, [results, activeIndex, onFocusElement]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-4 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-72">
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') navigate(1); if (e.key === 'ArrowDown') navigate(1); if (e.key === 'ArrowUp') navigate(-1); }}
          placeholder="Buscar barrera o fuente..."
          className="flex-1 text-xs outline-none"
          aria-label="Buscar en canvas"
        />
        {results.length > 0 && (
          <span className="text-[10px] text-slate-400">{activeIndex + 1}/{results.length}</span>
        )}
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600" aria-label="Anterior">
          <ChevronUp className="w-3 h-3" />
        </button>
        <button onClick={() => navigate(1)} className="text-slate-400 hover:text-slate-600" aria-label="Siguiente">
          <ChevronDown className="w-3 h-3" />
        </button>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Cerrar">
          <X className="w-3 h-3" />
        </button>
      </div>
      {results.length > 0 && (
        <div className="max-h-40 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.element.id}-${i}`}
              className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 transition-colors ${i === activeIndex ? 'bg-orange-50 text-orange-700' : 'hover:bg-slate-50'}`}
              onClick={() => { setActiveIndex(i); onFocusElement(r.x, r.y); }}
            >
              <span className={`w-2 h-2 rounded-full ${r.type === 'barrier' ? 'bg-orange-400' : 'bg-blue-400'}`} />
              <span className="truncate">{r.element.name}</span>
              <span className="text-[9px] text-slate-400 ml-auto">{r.type === 'barrier' ? 'Barrera' : 'Fuente'}</span>
            </button>
          ))}
        </div>
      )}
      {query && results.length === 0 && (
        <div className="px-3 py-2 text-[11px] text-slate-400">Sin resultados</div>
      )}
    </div>
  );
}
