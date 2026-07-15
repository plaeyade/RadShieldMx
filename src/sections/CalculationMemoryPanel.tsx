/**
 * ═══════════════════════════════════════════════════════════
 * CalculationMemoryPanel — UI for viewing and managing
 * auto-fed calculation memories with similarity search
 * ═══════════════════════════════════════════════════════════
 */
import { useState } from 'react';
import { Brain, X, Search, Star, Trash2, Download, FileUp, Filter, TrendingUp, Calendar, Zap, BarChart3, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCalculationMemory, type MemoryQuery } from '@/hooks/useCalculationMemory';

interface Props {
  onClose: () => void;
}

export default function CalculationMemoryPanel({ onClose }: Props) {
  const memory = useCalculationMemory();
  const [query, setQuery] = useState<MemoryQuery>({});
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stats = memory.getStats();
  const filtered = memory.filter({ ...query, searchText: searchText || undefined });
  const selected = memory.memories.find(m => m.id === selectedId);

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-800">Memorias de Cálculo</h2>
            <p className="text-[10px] text-slate-500">v70 — Auto-alimentadas por uso de la app</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4 text-slate-500" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-600">{stats.total}</div>
          <div className="text-[9px] text-slate-500 uppercase">Total</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-600">{stats.passRate}%</div>
          <div className="text-[9px] text-slate-500 uppercase">Pass Rate</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-600">{memory.memories.filter(m => m.isFavorite).length}</div>
          <div className="text-[9px] text-slate-500 uppercase">Favoritos</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-600">{Object.keys(stats.byStandard).length}</div>
          <div className="text-[9px] text-slate-500 uppercase">Standards</div>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 px-4 py-2 border-b border-slate-100">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            className="h-8 text-[11px] pl-8"
            placeholder="Buscar memorias..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className={`h-8 w-8 p-0 ${showFilters ? 'bg-emerald-50 border-emerald-300' : ''}`} onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => memory.exportMemories()}>
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex gap-2">
            <Input className="h-7 text-[10px]" placeholder="Modalidad" onChange={e => setQuery(p => ({ ...p, modality: e.target.value }))} />
            <Input className="h-7 text-[10px]" placeholder="Energía (MeV)" onChange={e => setQuery(p => ({ ...p, energy_MeV: parseFloat(e.target.value) || undefined }))} />
            <select className="h-7 text-[10px] border border-slate-200 rounded-md px-1" onChange={e => setQuery(p => ({ ...p, standard: e.target.value || undefined }))}>
              <option value="">Standard</option>
              <option>NCRP-151</option>
              <option>NCRP-147</option>
              <option>IAEA-47</option>
              <option>ICRU-57</option>
              <option>AAPM-TG108</option>
            </select>
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-[10px] text-slate-600">
              <input type="checkbox" onChange={e => setQuery(p => ({ ...p, isFavorite: e.target.checked || undefined }))} /> Solo favoritos
            </label>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs">
              {memory.memories.length === 0 ? 'Sin memorias aún' : 'Sin resultados para el filtro'}
            </p>
            {memory.memories.length === 0 && (
              <p className="text-[10px] mt-1 max-w-[250px] mx-auto">
                Las memorias se generan automáticamente al ejecutar cálculos de blindaje. También puedes importar desde archivo.
              </p>
            )}
          </div>
        )}

        {filtered.map(m => (
          <div
            key={m.id}
            className={`border-b border-slate-100 p-3 cursor-pointer transition-colors hover:bg-slate-50 ${
              selectedId === m.id ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : ''
            }`}
            onClick={() => setSelectedId(m.id === selectedId ? null : m.id)}
          >
            <div className="flex items-start gap-2">
              <button
                className="mt-0.5 shrink-0"
                onClick={e => { e.stopPropagation(); memory.toggleFavorite(m.id); }}
              >
                <Star className={`w-3.5 h-3.5 ${m.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-[11px] font-semibold text-slate-800 truncate">{m.projectName}</h4>
                  <Badge variant="outline" className="text-[8px] shrink-0">{m.standardUsed}</Badge>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                  <span className="flex items-center gap-0.5"><Zap className="w-3 h-3" /> {m.energy_MeV} MeV</span>
                  <span className="flex items-center gap-0.5"><BarChart3 className="w-3 h-3" /> {m.modality}</span>
                  <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {new Date(m.timestamp).toLocaleDateString()}</span>
                </div>

                {/* Expanded detail */}
                {selectedId === m.id && (
                  <div className="mt-2 space-y-2 border-t border-emerald-100 pt-2">
                    {/* Sources */}
                    <div>
                      <p className="text-[9px] font-semibold text-slate-600 uppercase">Fuentes</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {m.sources.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-[8px]">{s.name} ({s.x}, {s.y})</Badge>
                        ))}
                      </div>
                    </div>
                    {/* Results */}
                    <div>
                      <p className="text-[9px] font-semibold text-slate-600 uppercase">Resultados</p>
                      <div className="space-y-1 mt-0.5">
                        {m.results.map((r, i) => (
                          <div key={i} className={`flex items-center justify-between text-[10px] px-2 py-1 rounded ${r.isPassing ? 'bg-green-50' : 'bg-red-50'}`}>
                            <span className="truncate">{r.barrierName}</span>
                            <div className="flex gap-2 shrink-0">
                              <span>{r.requiredThickness_mm ? `${(r.requiredThickness_mm / 10).toFixed(1)} cm` : 'N/A'}</span>
                              <span className={r.isPassing ? 'text-green-600' : 'text-red-600'}>{r.isPassing ? 'PASS' : 'FAIL'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Tags */}
                    {m.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {m.tags.map(t => <Badge key={t} variant="outline" className="text-[8px] bg-slate-50">{t}</Badge>)}
                      </div>
                    )}
                    {/* Actions */}
                    <div className="flex gap-1 pt-1">
                      <Button variant="ghost" size="sm" className="h-6 text-[9px] text-red-500 hover:text-red-700 hover:bg-red-50 gap-1" onClick={() => memory.deleteMemory(m.id)}>
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-4 py-2 flex justify-between items-center bg-slate-50">
        <span className="text-[9px] text-slate-400">{filtered.length} de {memory.memories.length} memorias</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1" onClick={() => memory.exportMemories()}>
            <Download className="w-3 h-3" /> Exportar
          </Button>
        </div>
      </div>
    </div>
  );
}
