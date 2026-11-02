// =============================================================================
// BibliographyDialog — Bibliografía completa validada (v14.5)
// 32 referencias: 14 del usuario + 18 existentes del sistema
// =============================================================================
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import '@/components/ui/scroll-area';
import { X, BookOpen, Search, ExternalLink, FileText } from 'lucide-react';
import { ALL_REFERENCES, searchRefs, getRefsByType } from '@/lib/bibliography';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

const TYPE_COLORS: Record<string, string> = {
  NCRP: 'bg-blue-100 text-blue-700', NRC: 'bg-indigo-100 text-indigo-700',
  AAPM: 'bg-emerald-100 text-emerald-700', IAEA: 'bg-cyan-100 text-cyan-700',
  ICRU: 'bg-violet-100 text-violet-700', ICRP: 'bg-purple-100 text-purple-700',
  PeerReviewed: 'bg-amber-100 text-amber-700', Book: 'bg-rose-100 text-rose-700',
  NOM: 'bg-red-100 text-red-700', EPA: 'bg-green-100 text-green-700',
  Manufacturer: 'bg-pink-100 text-pink-700', NIST: 'bg-slate-100 text-slate-700',
};

export default function BibliographyDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return <BibliographyContent onOpenChange={onOpenChange} />;
}

function BibliographyContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = useMemo(() => {
    let refs = search ? searchRefs(search) : ALL_REFERENCES;
    if (filterType !== 'all') refs = refs.filter(r => r.type === filterType);
    return refs;
  }, [search, filterType]);

  const types = [...new Set(ALL_REFERENCES.map(r => r.type))];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ width: '100vw', height: '100vh' }}>
      <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="bg-slate-700 text-white p-2 rounded-lg"><BookOpen className="w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Bibliografía Validada</h1>
            <p className="text-xs text-slate-500">{ALL_REFERENCES.length} referencias — 14 solicitadas + {ALL_REFERENCES.length - 14} del sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" /></div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-xs border rounded px-2 py-1.5 bg-white">
            <option value="all">Todos ({ALL_REFERENCES.length})</option>
            {types.map(t => <option key={t} value={t}>{t} ({getRefsByType(t).length})</option>)}
          </select>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Banner 14 referencias del usuario */}
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
            <FileText className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <strong>14 referencias validadas y agregadas:</strong> NCRP 147, Madero Ramírez TECCIENCIA 2017, Novartis EWG, Smith & Stabin Health Phys 2012, NRC 20.1302, NCRP 151, NRC Shielding Radiation, NRC 20.1208, NRC 20.1301, Pluvicto PI, Lutathera PI, Cherry Physics in Nuclear Medicine 4th ed, Stabin J Nucl Med 2022, NIST X-Ray Mass Attenuation.
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map(ref => (
              <Card key={ref.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${TYPE_COLORS[ref.type] || 'bg-gray-100'}`}>{ref.type}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">{ref.citation}</div>
                      {ref.notes && <div className="text-xs text-slate-600 mt-1">{ref.notes}</div>}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">{ref.id}</Badge>
                        {ref.pmid && <Badge variant="secondary" className="text-[10px]">PMID: {ref.pmid}</Badge>}
                        {ref.doi && <Badge variant="secondary" className="text-[10px]">DOI: {ref.doi}</Badge>}
                        {ref.url && <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3" />Enlace</a>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
