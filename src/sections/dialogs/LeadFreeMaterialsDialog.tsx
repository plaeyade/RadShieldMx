// =============================================================================
// LeadFreeMaterialsDialog.tsx — Lead-Free Shielding Alternatives Database
// HDPE composites with Bi2O3, WO3, Gd2O3, TeO2 as lead replacements
// Based on: Alipoor et al. (PMC) — HDPE composite studies
// =============================================================================
import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Shield, Leaf, TrendingDown, DollarSign, Hammer,
  Beaker, CheckCircle, AlertTriangle, Download,
  Info, BarChart3,
} from 'lucide-react';
import { LEAD_FREE_MATERIALS, type LeadFreeMaterial } from '@/lib/phyXData';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function getEfficiencyColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-500';
  if (pct >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getEfficiencyText(pct: number): string {
  if (pct >= 80) return 'Excellent';
  if (pct >= 60) return 'Good';
  if (pct >= 40) return 'Moderate';
  return 'Fair';
}

export default function LeadFreeMaterialsDialog({ open, onOpenChange }: Props) {
  const [search, setSearch] = useState('');
  const [filterEnergy, setFilterEnergy] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState<LeadFreeMaterial | null>(null);

  const filtered = useMemo(() => {
    let mats = LEAD_FREE_MATERIALS;
    if (search) {
      const q = search.toLowerCase();
      mats = mats.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.filler.toLowerCase().includes(q) ||
        m.applications.some(a => a.toLowerCase().includes(q))
      );
    }
    return mats;
  }, [search]);

  const exportData = () => {
    const headers = 'ID,Name,Base Polymer,Filler,Filler %,Density (g/cm3),SE@6MV,SE@10MV,SE@Co60,SE@Dental,Cost Factor,Flexural Strength (MPa)\n';
    const rows = LEAD_FREE_MATERIALS.map(m =>
      `${m.id},"${m.name}","${m.basePolymer}","${m.filler}",${m.fillerPercent},${m.density_g_cm3},${m.relativeToPb_6MV},${m.relativeToPb_10MV},${m.relativeToPb_Co60},${m.relativeToPb_dental},${m.costFactor},${m.flexuralStrength_MPa}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_free_shielding_materials.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Database exported');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Leaf className="h-5 w-5 text-emerald-500" />
            Lead-Free Shielding Alternatives Database
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Environmentally-friendly shielding materials as lead replacements. HDPE + high-Z oxide composites.
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4">
            {/* Info Banner */}
            <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200">
              <CardContent className="pt-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-800 dark:text-emerald-200">Why lead-free?</p>
                  <p className="text-emerald-700 dark:text-emerald-300">
                    Lead is toxic and regulated under RoHS/REACH. HDPE + high-Z oxide composites offer
                    comparable attenuation with reduced toxicity, lighter weight, and easier fabrication.
                    Reference: Alipoor et al., PMC — HDPE-based composites for radiation shielding.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex gap-2">
              <Input
                placeholder="Search materials, fillers, applications..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Material Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map(mat => (
                <Card
                  key={mat.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedMaterial?.id === mat.id ? 'ring-2 ring-emerald-500' : ''}`}
                  onClick={() => setSelectedMaterial(mat)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{mat.name}</h4>
                        <p className="text-xs text-muted-foreground">{mat.basePolymer} + {mat.fillerPercent}% {mat.filler}</p>
                      </div>
                      <Badge variant={mat.relativeToPb_6MV >= 70 ? 'default' : 'secondary'} className="text-xs">
                        {mat.relativeToPb_6MV}% Pb eq. @ 6 MV
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="text-center p-1.5 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">Density</p>
                        <p className="text-sm font-semibold">{mat.density_g_cm3} <span className="text-xs font-normal">g/cm³</span></p>
                      </div>
                      <div className="text-center p-1.5 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">Cost</p>
                        <p className="text-sm font-semibold">{mat.costFactor}×</p>
                      </div>
                      <div className="text-center p-1.5 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">Strength</p>
                        <p className="text-sm font-semibold">{mat.flexuralStrength_MPa} <span className="text-xs font-normal">MPa</span></p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {mat.applications.slice(0, 3).map(app => (
                        <Badge key={app} variant="outline" className="text-xs">{app}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detail View */}
            {selectedMaterial && (
              <Card className="border-emerald-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-emerald-500" />
                    {selectedMaterial.name} — Detailed Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Shielding Efficiency Bars */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Shielding Efficiency (% relative to lead)
                    </h5>
                    {[
                      { label: '6 MV (Linac)', value: selectedMaterial.relativeToPb_6MV },
                      { label: '10 MV (Linac)', value: selectedMaterial.relativeToPb_10MV },
                      { label: '⁶⁰Co (Teletherapy)', value: selectedMaterial.relativeToPb_Co60 },
                      { label: 'Diagnostic (60-100 keV)', value: selectedMaterial.relativeToPb_dental },
                    ].map(item => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{item.label}</span>
                          <span className="font-medium">{item.value}% — {getEfficiencyText(item.value)}</span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getEfficiencyColor(item.value)} transition-all`}
                            style={{ width: `${Math.min(item.value, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Cost-Benefit Analysis */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-amber-500" />
                        Cost Analysis
                      </h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Material cost factor:</span>
                          <span className="font-medium">{selectedMaterial.costFactor}× lead</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Disposal savings:</span>
                          <span className="font-medium text-emerald-600">Non-hazardous</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Regulatory:</span>
                          <span className="font-medium text-emerald-600">RoHS/REACH compliant</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <Hammer className="h-4 w-4 text-blue-500" />
                        Mechanical Properties
                      </h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Flexural strength:</span>
                          <span className="font-medium">{selectedMaterial.flexuralStrength_MPa} MPa</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Density:</span>
                          <span className="font-medium">{selectedMaterial.density_g_cm3} g/cm³</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Filler loading:</span>
                          <span className="font-medium">{selectedMaterial.fillerPercent}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Applications */}
                  <div>
                    <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Recommended Applications
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedMaterial.applications.map(app => (
                        <Badge key={app} variant="secondary">{app}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    <p className="font-medium text-xs text-muted-foreground mb-1">NOTES</p>
                    <p>{selectedMaterial.notes}</p>
                    <p className="text-xs text-muted-foreground mt-1">Ref: {selectedMaterial.reference}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comparison Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Comparison Matrix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1.5 px-2">Material</th>
                        <th className="text-right py-1.5 px-2">Density</th>
                        <th className="text-right py-1.5 px-2">6 MV</th>
                        <th className="text-right py-1.5 px-2">10 MV</th>
                        <th className="text-right py-1.5 px-2">⁶⁰Co</th>
                        <th className="text-right py-1.5 px-2">Diagnostic</th>
                        <th className="text-right py-1.5 px-2">Cost</th>
                        <th className="text-right py-1.5 px-2">Strength</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Lead reference */}
                      <tr className="border-b bg-amber-50 dark:bg-amber-950/20 font-medium">
                        <td className="py-1.5 px-2">Pb (reference)</td>
                        <td className="text-right py-1.5 px-2">11.34</td>
                        <td className="text-right py-1.5 px-2">100%</td>
                        <td className="text-right py-1.5 px-2">100%</td>
                        <td className="text-right py-1.5 px-2">100%</td>
                        <td className="text-right py-1.5 px-2">100%</td>
                        <td className="text-right py-1.5 px-2">1.0×</td>
                        <td className="text-right py-1.5 px-2">—</td>
                      </tr>
                      {LEAD_FREE_MATERIALS.map(mat => (
                        <tr key={mat.id} className="border-b hover:bg-muted/50">
                          <td className="py-1.5 px-2">{mat.name}</td>
                          <td className="text-right py-1.5 px-2 font-mono">{mat.density_g_cm3}</td>
                          <td className="text-right py-1.5 px-2">
                            <span className={mat.relativeToPb_6MV >= 70 ? 'text-emerald-600 font-medium' : ''}>
                              {mat.relativeToPb_6MV}%
                            </span>
                          </td>
                          <td className="text-right py-1.5 px-2">{mat.relativeToPb_10MV}%</td>
                          <td className="text-right py-1.5 px-2">{mat.relativeToPb_Co60}%</td>
                          <td className="text-right py-1.5 px-2">{mat.relativeToPb_dental}%</td>
                          <td className="text-right py-1.5 px-2">{mat.costFactor}×</td>
                          <td className="text-right py-1.5 px-2">{mat.flexuralStrength_MPa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
