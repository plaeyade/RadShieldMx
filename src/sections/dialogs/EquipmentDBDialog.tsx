import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Database } from 'lucide-react';
import { COMMERCIAL_EQUIPMENT } from '@/types/equipmentDB';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; onSelect?: (equipmentId: string) => void; }

const CATEGORY_LABELS: Record<string, string> = {
  LINAC: 'Acelerador Lineal', CT: 'Tomografia', 'PET-CT': 'PET-CT',
  GammaKnife: 'Gamma Knife', HDR: 'Braquiterapia HDR',
  Mammography: 'Mamografia', Cyclotron: 'Ciclotron', SPECT: 'SPECT',
};

export default function EquipmentDBDialog({ open, onOpenChange, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const categories = useMemo(() => ['ALL', ...Array.from(new Set(COMMERCIAL_EQUIPMENT.map(e => e.category)))], []);

  const filtered = useMemo(() => {
    return COMMERCIAL_EQUIPMENT.filter(eq => {
      const matchCat = categoryFilter === 'ALL' || eq.category === categoryFilter;
      const matchSearch = !search || `${eq.manufacturer} ${eq.model}`.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, categoryFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Base de Datos de Equipos ({COMMERCIAL_EQUIPMENT.length} equipos)
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar equipo..." className="pl-8 h-8 text-sm" />
          </div>
        </div>

        <div className="flex gap-1 flex-wrap">
          {categories.map(cat => (
            <Button key={cat} size="sm" variant={categoryFilter === cat ? 'default' : 'outline'} className="h-7 text-[10px]" onClick={() => setCategoryFilter(cat)}>
              {cat === 'ALL' ? 'Todos' : CATEGORY_LABELS[cat] || cat}
            </Button>
          ))}
        </div>

        <ScrollArea className="h-64 border rounded">
          <div className="p-2 space-y-1">
            {filtered.length === 0 && <div className="text-center text-gray-400 py-8">Sin resultados</div>}
            {filtered.map(eq => (
              <div key={eq.id} className="flex items-center gap-2 p-2 rounded border hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{eq.manufacturer} — {eq.model}</div>
                  <div className="text-[10px] text-gray-500">
                    {CATEGORY_LABELS[eq.category]} | {eq.energy_MeV_or_kVp}
                    {eq.doseRate_Gy_min && ` | ${eq.doseRate_Gy_min} Gy/min`}
                    {eq.tvlConcrete_cm_6MV && ` | TVL ${eq.tvlConcrete_cm_6MV} cm`}
                  </div>
                </div>
                {eq.workload_Gy_week && <Badge variant="outline" className="text-[10px]">{eq.workload_Gy_week} Gy/sem</Badge>}
                {onSelect && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onSelect(eq.id)}>Usar</Button>}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="text-[10px] text-gray-400">Fuentes: NCRP 151/147, datasheets fabricantes. Los valores TVL son referenciales.</div>
      </DialogContent>
    </Dialog>
  );
}
