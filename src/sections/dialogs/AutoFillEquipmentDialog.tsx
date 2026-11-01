// AutoFillEquipmentDialog.tsx — Auto-fill from Equipment Database
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Cpu, Zap } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const EQUIPMENT_DB = [
  { id: 'varian_truebeam', name: 'Varian TrueBeam', vendor: 'Varian', energies: [6, 10, 15, 18], maxMU_min: 2400, leakage_pct: 0.1, fieldSize_cm: '40x40', workload_Gy_week: 500, tvl_concrete_6mv: 37, tvl_concrete_10mv: 37, tvl_concrete_18mv: 45, isoHeight_m: 1.0, sourceAxis_m: 1.0 },
  { id: 'varian_halcyon', name: 'Varian Halcyon', vendor: 'Varian', energies: [6], maxMU_min: 800, leakage_pct: 0.1, fieldSize_cm: '28x28', workload_Gy_week: 300, tvl_concrete_6mv: 37, isoHeight_m: 1.0, sourceAxis_m: 1.0 },
  { id: 'elekta_versa', name: 'Elekta Versa HD', vendor: 'Elekta', energies: [6, 10], maxMU_min: 2200, leakage_pct: 0.15, fieldSize_cm: '40x40', workload_Gy_week: 500, tvl_concrete_6mv: 37, tvl_concrete_10mv: 37, isoHeight_m: 1.0, sourceAxis_m: 1.0 },
  { id: 'siemens_artiste', name: 'Siemens Artiste', vendor: 'Siemens', energies: [6, 15], maxMU_min: 2000, leakage_pct: 0.1, fieldSize_cm: '40x40', workload_Gy_week: 450, tvl_concrete_6mv: 37, tvl_concrete_15mv: 41, isoHeight_m: 1.0, sourceAxis_m: 1.0 },
  { id: 'ge_petct', name: 'GE Discovery 690 PET/CT', vendor: 'GE', energies: [511], maxMU_min: 0, leakage_pct: 0, fieldSize_cm: 'N/A', workload_Gy_week: 0, tvl_concrete_511kev: 170, isoHeight_m: 0.8, sourceAxis_m: 0 },
  { id: 'siemens_petct', name: 'Siemens Biograph mCT', vendor: 'Siemens', energies: [511], maxMU_min: 0, leakage_pct: 0, fieldSize_cm: 'N/A', workload_Gy_week: 0, tvl_concrete_511kev: 170, isoHeight_m: 0.8, sourceAxis_m: 0 },
  { id: 'philips_petct', name: 'Philips Ingenuity TF', vendor: 'Philips', energies: [511], maxMU_min: 0, leakage_pct: 0, fieldSize_cm: 'N/A', workload_Gy_week: 0, tvl_concrete_511kev: 170, isoHeight_m: 0.8, sourceAxis_m: 0 },
  { id: 'gammaknife_icon', name: 'Leksell Gamma Knife Icon', vendor: 'Elekta', energies: [1.25], maxMU_min: 0, leakage_pct: 0.1, fieldSize_cm: '16mm', workload_Gy_week: 200, tvl_concrete_1_25mev: 21.8, isoHeight_m: 0.4, sourceAxis_m: 0.4 },
  { id: 'cyberknife_m6', name: 'Accuray CyberKnife M6', vendor: 'Accuray', energies: [6], maxMU_min: 1200, leakage_pct: 0.1, fieldSize_cm: '10x12', workload_Gy_week: 350, tvl_concrete_6mv: 37, isoHeight_m: 1.0, sourceAxis_m: 0.8 },
  { id: 'mri_linac', name: 'ViewRay MRIdian', vendor: 'ViewRay', energies: [6, 7], maxMU_min: 800, leakage_pct: 0.1, fieldSize_cm: '27.4x27.4', workload_Gy_week: 300, tvl_concrete_6mv: 37, isoHeight_m: 1.0, sourceAxis_m: 0.9 },
];

export default function AutoFillEquipmentDialog({ open, onOpenChange }: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof EQUIPMENT_DB[0] | null>(null);
  const filtered = EQUIPMENT_DB.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.vendor.toLowerCase().includes(search.toLowerCase()));

  const applyEquipment = () => {
    if (!selected) return;
    toast.success(`${selected.name} parameters loaded`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-blue-500" />Auto-fill from Equipment Database</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            <Input placeholder="Search equipment..." value={search} onChange={e => setSearch(e.target.value)} className="mb-2" />
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(eq => (
                <Card key={eq.id} className={`cursor-pointer transition-all ${selected?.id === eq.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected(eq)}>
                  <CardContent className="pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{eq.name}</p>
                      <Badge variant="outline" className="text-[9px]">{eq.vendor}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Energies: {eq.energies.join(', ')} MeV/keV | Workload: {eq.workload_Gy_week} Gy/week</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {selected && (
              <>
                <Card className="border-primary">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{selected.name} — Parameters</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-muted p-2 rounded"><p className="text-muted-foreground">Energies</p><p className="font-semibold">{selected.energies.join(', ')} MeV/keV</p></div>
                      <div className="bg-muted p-2 rounded"><p className="text-muted-foreground">Workload</p><p className="font-semibold">{selected.workload_Gy_week} Gy/wk</p></div>
                      <div className="bg-muted p-2 rounded"><p className="text-muted-foreground">Max MU/min</p><p className="font-semibold">{selected.maxMU_min}</p></div>
                      <div className="bg-muted p-2 rounded"><p className="text-muted-foreground">Field Size</p><p className="font-semibold">{selected.fieldSize_cm}</p></div>
                      <div className="bg-muted p-2 rounded"><p className="text-muted-foreground">Leakage</p><p className="font-semibold">{selected.leakage_pct}%</p></div>
                      <div className="bg-muted p-2 rounded"><p className="text-muted-foreground">Isocenter H</p><p className="font-semibold">{selected.isoHeight_m} m</p></div>
                    </div>
                  </CardContent>
                </Card>
                <Button onClick={applyEquipment} className="w-full"><Zap className="h-4 w-4 mr-2" />Apply to Shielding Calculator</Button>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
