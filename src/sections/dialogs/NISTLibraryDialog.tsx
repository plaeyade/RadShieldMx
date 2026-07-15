import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Database, Search, Atom, Layers, DollarSign, FileText, Shield } from 'lucide-react';
import { NIST_MATERIALS, TVL_DATA, getTVL, searchNISTMaterials, type NISTMaterial } from '@/lib/nistMaterialLibrary';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export default function NISTLibraryDialog({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState('');
  const [selectedMat, setSelectedMat] = useState<NISTMaterial | null>(null);
  const [category, setCategory] = useState('');

  const filtered = useMemo(() => {
    let mats = searchNISTMaterials(query);
    if (category) {
      mats = mats.filter(m => {
        if (category === 'concrete') return m.id.includes('concrete');
        if (category === 'metal') return ['lead', 'iron', 'tungsten', 'aluminum', 'copper', 'tin', 'brass'].some(k => m.id.includes(k));
        if (category === 'polymer') return m.id.includes('poly') || m.id.includes('pvc') || m.id.includes('teflon');
        if (category === 'composite') return m.id.includes('glass') || m.id.includes('boron');
        return true;
      });
    }
    return mats;
  }, [query, category]);

  const energies = [0.5, 1.0, 2.0, 4.0, 6.0, 10.0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1100px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Database className="w-5 h-5 text-blue-500" />
            NIST Material Library + JEFF Isotopes
            <Badge variant="outline" className="text-[10px]">v26</Badge>
            <Badge variant="secondary" className="text-[10px]">{NIST_MATERIALS.length} materials</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 shrink-0 mb-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search materials by name, formula, ID..." value={query} onChange={e => setQuery(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
          <div className="flex gap-1">
            {['', 'concrete', 'metal', 'polymer', 'composite'].map(c => (
              <Badge key={c} variant={category === c ? 'default' : 'outline'} className="text-[9px] cursor-pointer capitalize" onClick={() => setCategory(category === c ? '' : c)}>{c || 'All'}</Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-3 flex-1 min-h-0">
          {/* Material List */}
          <ScrollArea className="w-72 shrink-0 border rounded">
            <div className="space-y-0.5 p-1">
              {filtered.map(mat => (
                <div key={mat.id} className={`text-xs p-2 rounded cursor-pointer ${selectedMat?.id === mat.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'}`} onClick={() => setSelectedMat(mat)}>
                  <div className="font-medium">{mat.name}</div>
                  <div className="text-[10px] text-muted-foreground">{mat.formula} | {mat.density_g_cm3} g/cm³</div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Material Detail */}
          <ScrollArea className="flex-1">
            {selectedMat ? (
              <div className="space-y-3 pr-2">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{selectedMat.name}</CardTitle>
                      <Badge variant="outline" className="text-[9px]">{selectedMat.id}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/30 p-2 rounded"><p className="text-[10px] text-muted-foreground">Formula</p><p className="font-mono">{selectedMat.formula}</p></div>
                      <div className="bg-muted/30 p-2 rounded"><p className="text-[10px] text-muted-foreground">Density</p><p className="font-mono">{selectedMat.density_g_cm3} g/cm³</p></div>
                      <div className="bg-muted/30 p-2 rounded"><p className="text-[10px] text-muted-foreground">Z_eff</p><p className="font-mono">{selectedMat.Z_eff}</p></div>
                      <div className="bg-muted/30 p-2 rounded"><p className="text-[10px] text-muted-foreground">A_eff</p><p className="font-mono">{selectedMat.A_eff}</p></div>
                      {selectedMat.cost_USD_per_kg && (
                        <div className="bg-emerald-50 p-2 rounded"><p className="text-[10px] text-emerald-600">Cost</p><p className="font-mono text-emerald-700">${selectedMat.cost_USD_per_kg}/kg</p></div>
                      )}
                      {selectedMat.compressive_strength_MPa && (
                        <div className="bg-blue-50 p-2 rounded"><p className="text-[10px] text-blue-600">Strength</p><p className="font-mono text-blue-700">{selectedMat.compressive_strength_MPa} MPa</p></div>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold mb-1">Composition:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedMat.composition.map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-[8px]">{c.element}: {(c.fraction_by_weight * 100).toFixed(1)}%</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {TVL_DATA[selectedMat.id] && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" />TVL vs Energy</CardTitle></CardHeader>
                    <CardContent>
                      <table className="w-full text-xs">
                        <thead><tr className="bg-muted"><th className="p-1">Energy (MeV)</th>{energies.map(e => <th key={e} className="p-1 text-right">{e}</th>)}</tr></thead>
                        <tbody><tr><td className="p-1 font-medium">TVL (cm)</td>{TVL_DATA[selectedMat.id]?.map((v, i) => <td key={i} className="p-1 text-right font-mono">{v.toFixed(1)}</td>)}</tr></tbody>
                      </table>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12 text-sm">Select a material to view details</div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
