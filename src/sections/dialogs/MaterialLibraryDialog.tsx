// =============================================================================
// MaterialLibraryDialog.tsx — v90: Material library (builtin + cloud custom)
// =============================================================================
import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  FlaskConical, Plus, Trash2, Search, Cloud, Database,
  Beaker, Hash, DollarSign,
} from 'lucide-react';

interface BuiltinMaterial {
  id: string;
  name: string;
  category: string;
  density_g_cm3: string;
  tvlJson: string;
  cost_MXN_per_m3: string;
}

interface CustomMaterial {
  id: number;
  name: string;
  category: string;
  density_g_cm3: string;
  tvlJson: string | null;
  cost_MXN_per_m3: string | null;
  notes: string | null;
  createdAt: Date;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  builtinMaterials: BuiltinMaterial[];
  customMaterials: CustomMaterial[];
  onCreateMaterial: (data: {
    name: string;
    category: 'concrete' | 'steel' | 'lead' | 'composite' | 'barite' | 'borated' | 'special';
    density_g_cm3: string;
    tvlJson?: string;
    cost_MXN_per_m3?: string;
    notes?: string;
  }) => void;
  onDeleteMaterial: (data: { id: number; userId: string }) => void;
  isLoading: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  concrete: 'bg-stone-100 text-stone-700 border-stone-200',
  steel: 'bg-slate-100 text-slate-700 border-slate-200',
  lead: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  composite: 'bg-orange-50 text-orange-700 border-orange-200',
  barite: 'bg-amber-50 text-amber-700 border-amber-200',
  borated: 'bg-blue-50 text-blue-700 border-blue-200',
  special: 'bg-purple-50 text-purple-700 border-purple-200',
};

const CATEGORY_LABELS: Record<string, string> = {
  concrete: 'Concreto', steel: 'Acero', lead: 'Plomo',
  composite: 'Compuesto', barite: 'Barita', borated: 'Borado', special: 'Especial',
};

export default function MaterialLibraryDialog({
  open, onOpenChange, builtinMaterials, customMaterials,
  onCreateMaterial, onDeleteMaterial, isLoading,
}: Props) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('builtin');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: 'concrete' as const, density: '', tvl: '', cost: '', notes: '',
  });

  const filteredBuiltin = useMemo(() =>
    builtinMaterials.filter(m => m.name.toLowerCase().includes(search.toLowerCase())),
    [builtinMaterials, search]
  );

  const filteredCustom = useMemo(() =>
    customMaterials.filter(m => m.name.toLowerCase().includes(search.toLowerCase())),
    [customMaterials, search]
  );

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.density.trim()) {
      toast.error('Nombre y densidad son requeridos');
      return;
    }
    onCreateMaterial({
      name: formData.name.trim(),
      category: formData.category,
      density_g_cm3: formData.density.trim(),
      tvlJson: formData.tvl.trim() || undefined,
      cost_MXN_per_m3: formData.cost.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    });
    setShowForm(false);
    setFormData({ name: '', category: 'concrete', density: '', tvl: '', cost: '', notes: '' });
    toast.success('Material guardado en la nube');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-orange-500" />
            Biblioteca de Materiales
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar materiales..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="builtin" className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5" /> Integrados ({filteredBuiltin.length})
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5" /> Personalizados ({filteredCustom.length})
            </TabsTrigger>
          </TabsList>

          {/* Builtin */}
          <TabsContent value="builtin" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-[380px]">
              <div className="space-y-1.5 pr-2">
                {filteredBuiltin.map(mat => (
                  <div key={mat.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-slate-50 transition-colors">
                    <Beaker className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{mat.name}</p>
                        <Badge variant="outline" className={`text-[9px] ${CATEGORY_COLORS[mat.category] || ''}`}>
                          {CATEGORY_LABELS[mat.category] || mat.category}
                        </Badge>
                      </div>
                      <div className="flex gap-3 mt-0.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5"><Hash className="w-3 h-3" /> {mat.density_g_cm3} g/cm³</span>
                        {mat.cost_MXN_per_m3 && <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" /> ${mat.cost_MXN_per_m3}/m³</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Custom */}
          <TabsContent value="custom" className="flex-1 min-h-0 mt-2">
            {showForm ? (
              <div className="space-y-2 p-3 border rounded-lg bg-slate-50">
                <p className="text-sm font-medium">Nuevo Material Personalizado</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Nombre *" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={formData.category}
                    onChange={e => setFormData(p => ({ ...p, category: e.target.value as any }))}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <Input placeholder="Densidad (g/cm³) *" value={formData.density} onChange={e => setFormData(p => ({ ...p, density: e.target.value }))} />
                  <Input placeholder="Costo (MXN/m³)" value={formData.cost} onChange={e => setFormData(p => ({ ...p, cost: e.target.value }))} />
                </div>
                <Input placeholder="TVL JSON (opcional) ej: {&quot;6MV&quot;:37,&quot;10MV&quot;:37}" value={formData.tvl} onChange={e => setFormData(p => ({ ...p, tvl: e.target.value }))} />
                <Input placeholder="Notas (opcional)" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={handleSubmit}>Guardar</Button>
                </div>
              </div>
            ) : (
              <>
                <Button size="sm" variant="outline" className="mb-2" onClick={() => setShowForm(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Material
                </Button>
                <ScrollArea className="h-[330px]">
                  {isLoading ? (
                    <p className="text-center text-slate-400 py-8 text-sm">Cargando...</p>
                  ) : filteredCustom.length === 0 ? (
                    <div className="text-center text-slate-400 py-12">
                      <Cloud className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No hay materiales personalizados</p>
                      <p className="text-xs mt-1">Guarde materiales custom para usarlos en calculos</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pr-2">
                      {filteredCustom.map(mat => (
                        <div key={mat.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-slate-50 transition-colors group">
                          <FlaskConical className="w-4 h-4 text-orange-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{mat.name}</p>
                              <Badge variant="outline" className={`text-[9px] ${CATEGORY_COLORS[mat.category] || ''}`}>
                                {CATEGORY_LABELS[mat.category] || mat.category}
                              </Badge>
                            </div>
                            <div className="flex gap-3 mt-0.5 text-[10px] text-slate-400">
                              <span className="flex items-center gap-0.5"><Hash className="w-3 h-3" /> {mat.density_g_cm3} g/cm³</span>
                              {mat.cost_MXN_per_m3 && <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" /> ${mat.cost_MXN_per_m3}/m³</span>}
                            </div>
                            {mat.notes && <p className="text-[10px] text-slate-400 mt-0.5 italic">{mat.notes}</p>}
                          </div>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                            onClick={() => { if (confirm('Eliminar material?')) onDeleteMaterial({ id: mat.id, userId: 'anonymous' }); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
