/**
 * CommunityTemplatesDialog — E.8: Community bunker templates
 * Share and download bunker templates from the community
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Download, Upload, Users, Star, Search } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; onLoadTemplate?: (template: any) => void; }

interface Template {
  id: string; name: string; author: string; modality: string;
  description: string; downloads: number; rating: number;
  tags: string[]; data: any;
}

const BUILTIN_TEMPLATES: Template[] = [
  {
    id: 't1', name: 'LINAC 6 MV Standard Bunker', author: 'RadShield-MX', modality: 'Linac',
    description: 'Bunker estándar NCRP 151 para acelerador lineal 6 MV. Laberinto en L, barrera primaria 1.8m concreto.', downloads: 1240, rating: 4.8,
    tags: ['NCRP151', '6MV', 'Primario', 'Labyrinth'], data: { barriers: 6, sources: 1 },
  },
  {
    id: 't2', name: 'PET/CT F-18 Suite', author: 'RadShield-MX', modality: 'PET/CT',
    description: 'Sala PET/CT con inyección, uptake room, y escáner. Blindaje Pb + BaSO₄. AAPM TG-108.', downloads: 890, rating: 4.7,
    tags: ['TG108', 'F18', 'Pb+BaSO4', 'NM'], data: { barriers: 8, sources: 3 },
  },
  {
    id: 't3', name: 'R&F Room NCRP 147', author: 'RadShield-MX', modality: 'Radiography/Fluoroscopy',
    description: 'Sala de rayos X diagnóstico con barreras NCRP 147. Protección para control y pasillo.', downloads: 650, rating: 4.5,
    tags: ['NCRP147', 'Diagnostic', 'X-ray'], data: { barriers: 5, sources: 2 },
  },
  {
    id: 't4', name: 'HDR Co-60 Brachytherapy', author: 'RadShield-MX', modality: 'HDR',
    description: 'Sala de braquiterapia HDR con Co-60. Bunker concreto 1.2m, puerta blindada.', downloads: 420, rating: 4.6,
    tags: ['HDR', 'Co60', 'Brachy', 'NCRP151'], data: { barriers: 4, sources: 1 },
  },
  {
    id: 't5', name: 'Cyclotron 18 MeV (Neutrons)', author: 'RadShield-MX', modality: 'Cyclotron',
    description: 'Ciclotrón 18 MeV con bunker para neutrones. Concreto 2.5m + laberinto extendido.', downloads: 310, rating: 4.9,
    tags: ['Neutrons', 'Cyclotron', 'NCRP144', 'Heavy'], data: { barriers: 10, sources: 2 },
  },
  {
    id: 't6', name: 'CT Suite Multi-Slice', author: 'RadShield-MX', modality: 'CT',
    description: 'Sala CT 128-slice con control adyacente. Blindaje NCRP 147 §5.6.', downloads: 780, rating: 4.4,
    tags: ['CT', 'NCRP147', 'Diagnostic'], data: { barriers: 4, sources: 1 },
  },
  {
    id: 't7', name: 'Gamma Knife Perfexion', author: 'RadShield-MX', modality: 'SRS',
    description: 'Sala Gamma Knife con blindaje especializado Co-60. NCRP 151 + consideraciones SRS.', downloads: 280, rating: 4.7,
    tags: ['SRS', 'GammaKnife', 'Co60', 'NCRP151'], data: { barriers: 5, sources: 1 },
  },
  {
    id: 't8', name: 'Mammography Suite', author: 'RadShield-MX', modality: 'Mammography',
    description: 'Sala de mamografía con blindaje ligero. NCRP 147 para baja energía (25-35 kVp).', downloads: 520, rating: 4.3,
    tags: ['Mammo', 'NCRP147', 'LowEnergy'], data: { barriers: 3, sources: 1 },
  },
];

export default function CommunityTemplatesDialog({ open, onClose, onLoadTemplate }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const templates = BUILTIN_TEMPLATES.filter(t => {
    const q = search.toLowerCase();
    return (t.name.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q))) &&
      (filter === 'All' || t.modality === filter);
  });
  const modalities = ['All', ...new Set(BUILTIN_TEMPLATES.map(t => t.modality))];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Community Bunker Templates
            <Badge variant="outline" className="text-[10px]">E.8</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar templates..." className="h-8 text-xs pl-8" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="h-8 text-xs border rounded px-2">
            {modalities.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {templates.map(t => (
            <div key={t.id} className="bg-slate-50 rounded-lg border p-3 hover:border-orange-300 transition-colors">
              <div className="flex items-start justify-between mb-1">
                <div className="text-xs font-semibold text-slate-800">{t.name}</div>
                <Badge variant="outline" className="text-[8px]">{t.modality}</Badge>
              </div>
              <div className="text-[10px] text-slate-500 mb-2 line-clamp-2">{t.description}</div>
              <div className="flex flex-wrap gap-1 mb-2">
                {t.tags.map(tag => <span key={tag} className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{tag}</span>)}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] text-slate-400">
                  <span className="flex items-center gap-0.5"><Download className="w-2.5 h-2.5" />{t.downloads}</span>
                  <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />{t.rating}</span>
                </div>
                <Button size="sm" className="h-6 text-[10px] bg-orange-500 hover:bg-orange-600" onClick={() => { onLoadTemplate?.(t.data); toast.success(`Template "${t.name}" cargado`); }}>
                  <Upload className="w-2.5 h-2.5 mr-1" />Cargar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
