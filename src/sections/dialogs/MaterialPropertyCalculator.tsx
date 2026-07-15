// =============================================================================
// MaterialPropertyCalculator.tsx — Phy-X/PSD-style Material Property Calculator
// Calculates MAC, HVL, TVL, MFP, Zeff, Neff, EABF, EBF for any compound
// Energy range: 1 keV – 100 GeV
// =============================================================================
import { useState, useCallback, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  FlaskConical, Calculator, Table, TrendingUp, Atom,
  Shield, Zap, ArrowRight, Download, Copy,
} from 'lucide-react';
import {
  COMPOUNDS, ELEMENTS, ENERGY_GRID_KEV,
  calculateCompoundMAC, calculateHVL, calculateTVL, calculateMFP,
  calculateZeff, calculateNeff, calculateEABF,
  type CompoundData,
} from '@/lib/phyXData';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface CalcResult {
  energy_keV: number;
  mu_rho: number;       // cm²/g
  mu_cm1: number;       // linear attenuation (cm⁻¹)
  hvl_cm: number;       // Half-value layer (cm)
  tvl_cm: number;       // Tenth-value layer (cm)
  mfp_cm: number;       // Mean free path (cm)
  eabf: number;         // Energy absorption buildup factor
  ebf: number;          // Exposure buildup factor
}

function formatEnergy(keV: number): string {
  if (keV >= 1e6) return `${(keV / 1e6).toFixed(0)} TeV`;
  if (keV >= 1e3) return `${(keV / 1e3).toFixed(1)} MeV`;
  if (keV >= 100) return `${(keV / 1e3).toFixed(2)} MeV`;
  return `${keV.toFixed(1)} keV`;
}

export default function MaterialPropertyCalculator({ open, onOpenChange }: Props) {
  const [selectedCompound, setSelectedCompound] = useState<string>('H2O');
  const [customFormula, setCustomFormula] = useState('');
  const [customElements, setCustomElements] = useState<{ symbol: string; fraction: number }[]>([
    { symbol: 'Pb', fraction: 1.0 },
  ]);
  const [customDensity, setCustomDensity] = useState('11.34');
  const [energyMin, setEnergyMin] = useState('1');
  const [energyMax, setEnergyMax] = useState('10000');
  const [numPoints, setNumPoints] = useState('50');
  const [results, setResults] = useState<CalcResult[]>([]);
  const [zeff, setZeff] = useState(0);
  const [neff, setNeff] = useState(0);
  const [activeTab, setActiveTab] = useState('preset');
  const [selectedElement, setSelectedElement] = useState('');

  const compound = useMemo(() =>
    COMPOUNDS.find(c => c.formula === selectedCompound),
    [selectedCompound]
  );

  const addCustomElement = useCallback(() => {
    if (selectedElement) {
      setCustomElements(prev => [...prev, { symbol: selectedElement, fraction: 0 }]);
      setSelectedElement('');
    }
  }, [selectedElement]);

  const removeCustomElement = useCallback((idx: number) => {
    setCustomElements(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const updateCustomElement = useCallback((idx: number, field: 'symbol' | 'fraction', value: string) => {
    setCustomElements(prev => prev.map((el, i) =>
      i === idx ? { ...el, [field]: field === 'fraction' ? parseFloat(value) || 0 : value } : el
    ));
  }, []);

  const getActiveCompound = useCallback((): CompoundData | null => {
    if (activeTab === 'preset' && compound) {
      return compound;
    }
    if (activeTab === 'custom' && customElements.length > 0) {
      const totalFraction = customElements.reduce((s, e) => s + e.fraction, 0);
      if (Math.abs(totalFraction - 1.0) > 0.05) {
        toast.error(`Weight fractions must sum to 1.0 (current: ${totalFraction.toFixed(3)})`);
        return null;
      }
      return {
        formula: customFormula || 'Custom',
        name: customFormula || 'Custom Compound',
        elements: customElements.map(e => ({ symbol: e.symbol, weightFraction: e.fraction })),
        density_g_cm3: parseFloat(customDensity) || 1.0,
        category: 'shielding',
      };
    }
    return null;
  }, [activeTab, compound, customElements, customFormula, customDensity]);

  const runCalculation = useCallback(() => {
    const comp = getActiveCompound();
    if (!comp) return;

    const emin = parseFloat(energyMin) || 1;
    const emax = parseFloat(energyMax) || 10000;
    const npts = Math.min(parseInt(numPoints) || 50, 200);

    // Calculate Zeff and Neff
    const z = calculateZeff(comp.elements);
    const n = calculateNeff(comp.elements, comp.density_g_cm3);
    setZeff(z);
    setNeff(n);

    // Generate energy grid
    const logEmin = Math.log10(emin);
    const logEmax = Math.log10(emax);
    const step = (logEmax - logEmin) / (npts - 1);

    const newResults: CalcResult[] = [];
    for (let i = 0; i < npts; i++) {
      const e_keV = Math.pow(10, logEmin + i * step);
      const mu_rho = calculateCompoundMAC(comp.elements, e_keV);
      const mu_cm1 = mu_rho * comp.density_g_cm3;
      const hvl = calculateHVL(mu_rho, comp.density_g_cm3);
      const tvl = calculateTVL(mu_rho, comp.density_g_cm3);
      const mfp = calculateMFP(mu_rho, comp.density_g_cm3);
      const matKey = comp.formula.trim();
      const eabf = calculateEABF(matKey, mfp, e_keV);
      const ebf = eabf * 0.95; // Approximate

      newResults.push({
        energy_keV: e_keV,
        mu_rho, mu_cm1, hvl_cm: hvl, tvl_cm: tvl,
        mfp_cm: mfp, eabf, ebf,
      });
    }
    setResults(newResults);
    toast.success(`Calculated ${npts} energy points for ${comp.name}`);
  }, [getActiveCompound, energyMin, energyMax, numPoints]);

  const exportCSV = useCallback(() => {
    if (results.length === 0) { toast.error('No results to export'); return; }
    const comp = getActiveCompound();
    const headers = 'Energy (keV),MAC (cm2/g),mu (cm-1),HVL (cm),TVL (cm),MFP (cm),EABF,EBF\n';
    const rows = results.map(r =>
      `${r.energy_keV.toExponential(4)},${r.mu_rho.toExponential(4)},${r.mu_cm1.toExponential(4)},${r.hvl_cm.toFixed(4)},${r.tvl_cm.toFixed(4)},${r.mfp_cm.toFixed(4)},${r.eabf.toFixed(4)},${r.ebf.toFixed(4)}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phyx_${comp?.name.replace(/\s+/g, '_') || 'material'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  }, [results, getActiveCompound]);

  const copyRow = useCallback((r: CalcResult) => {
    const text = `E=${formatEnergy(r.energy_keV)}, MAC=${r.mu_rho.toExponential(3)} cm²/g, HVL=${r.hvl_cm.toFixed(3)} cm, TVL=${r.tvl_cm.toFixed(3)} cm`;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Atom className="h-5 w-5 text-indigo-500" />
            Material Property Calculator — Phy-X/PSD
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Calculate MAC, HVL, TVL, MFP, Zeff, EABF for any chemical composition (1 keV – 100 GeV)
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4">
            {/* Material Selection */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preset">Preset Compounds</TabsTrigger>
                <TabsTrigger value="custom">Custom Formula</TabsTrigger>
              </TabsList>

              <TabsContent value="preset" className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Select Compound</Label>
                    <Select value={selectedCompound} onValueChange={setSelectedCompound}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMPOUNDS.map(c => (
                          <SelectItem key={c.formula} value={c.formula}>
                            {c.name} (ρ={c.density_g_cm3} g/cm³)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Density (g/cm³)</Label>
                    <Input value={compound?.density_g_cm3 ?? ''} disabled />
                  </div>
                </div>
                {compound && (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 text-sm">
                      <p className="font-medium">{compound.name}</p>
                      <p className="text-muted-foreground">Formula: {compound.formula}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {compound.elements.map(el => (
                          <Badge key={el.symbol} variant="secondary" className="text-xs">
                            {el.symbol}: {(el.weightFraction * 100).toFixed(1)}%
                          </Badge>
                        ))}
                      </div>
                      <Badge variant="outline" className="mt-2">{compound.category}</Badge>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="custom" className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Compound Name</Label>
                    <Input value={customFormula} onChange={e => setCustomFormula(e.target.value)} placeholder="e.g., My Custom Shield" />
                  </div>
                  <div>
                    <Label>Density (g/cm³)</Label>
                    <Input type="number" value={customDensity} onChange={e => setCustomDensity(e.target.value)} step="0.01" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedElement} onValueChange={setSelectedElement}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="Element" /></SelectTrigger>
                    <SelectContent>
                      {Object.values(ELEMENTS).map(el => (
                        <SelectItem key={el.symbol} value={el.symbol}>
                          {el.symbol} — {el.name} (Z={el.Z})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={addCustomElement} variant="outline">Add</Button>
                </div>
                {customElements.map((el, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select value={el.symbol} onValueChange={v => updateCustomElement(idx, 'symbol', v)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.values(ELEMENTS).map(e => (
                          <SelectItem key={e.symbol} value={e.symbol}>{e.symbol}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number" value={el.fraction} onChange={e => updateCustomElement(idx, 'fraction', e.target.value)}
                      step="0.01" min="0" max="1" className="w-24"
                      placeholder="wt frac"
                    />
                    <span className="text-xs text-muted-foreground w-12">{(el.fraction * 100).toFixed(0)}%</span>
                    <Button size="sm" variant="ghost" onClick={() => removeCustomElement(idx)}>×</Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            {/* Energy Range */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" />Energy Range</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">E min (keV)</Label>
                    <Input type="number" value={energyMin} onChange={e => setEnergyMin(e.target.value)} min="1" max="1e8" />
                  </div>
                  <div>
                    <Label className="text-xs">E max (keV)</Label>
                    <Input type="number" value={energyMax} onChange={e => setEnergyMax(e.target.value)} min="1" max="1e8" />
                  </div>
                  <div>
                    <Label className="text-xs"># Points (max 200)</Label>
                    <Input type="number" value={numPoints} onChange={e => setNumPoints(e.target.value)} min="10" max="200" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calculate */}
            <div className="flex gap-2">
              <Button onClick={runCalculation} className="flex-1">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Properties
              </Button>
              {results.length > 0 && (
                <Button variant="outline" onClick={exportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>

            {/* Results Summary */}
            {results.length > 0 && (
              <>
                <div className="grid grid-cols-4 gap-3">
                  <Card className="bg-indigo-50 dark:bg-indigo-950">
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-muted-foreground">Zeff</p>
                      <p className="text-2xl font-bold text-indigo-600">{zeff.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Effective Z</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-emerald-50 dark:bg-emerald-950">
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-muted-foreground">Neff</p>
                      <p className="text-2xl font-bold text-emerald-600">{neff.toFixed(3)}</p>
                      <p className="text-xs text-muted-foreground">×10²³ e⁻/cm³</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 dark:bg-amber-950">
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-muted-foreground">HVL @ 100 keV</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {results.find(r => r.energy_keV >= 100)?.hvl_cm.toFixed(3) || '—'} cm
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-rose-50 dark:bg-rose-950">
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-muted-foreground">TVL @ 100 keV</p>
                      <p className="text-2xl font-bold text-rose-600">
                        {results.find(r => r.energy_keV >= 100)?.tvl_cm.toFixed(3) || '—'} cm
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Results Table */}
                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><Table className="h-4 w-4" />Results Table</CardTitle>
                    <Badge variant="secondary">{results.length} points</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-background z-10">
                          <tr className="border-b">
                            <th className="text-left py-1 px-2">Energy</th>
                            <th className="text-right py-1 px-2">MAC (cm²/g)</th>
                            <th className="text-right py-1 px-2">μ (cm⁻¹)</th>
                            <th className="text-right py-1 px-2">HVL (cm)</th>
                            <th className="text-right py-1 px-2">TVL (cm)</th>
                            <th className="text-right py-1 px-2">MFP (cm)</th>
                            <th className="text-right py-1 px-2">EABF</th>
                            <th className="py-1 px-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((r, i) => (
                            <tr key={i} className="border-b hover:bg-muted/50">
                              <td className="py-1 px-2 font-mono">{formatEnergy(r.energy_keV)}</td>
                              <td className="text-right py-1 px-2 font-mono">{r.mu_rho.toExponential(3)}</td>
                              <td className="text-right py-1 px-2 font-mono">{r.mu_cm1.toExponential(3)}</td>
                              <td className="text-right py-1 px-2 font-mono">{r.hvl_cm.toFixed(4)}</td>
                              <td className="text-right py-1 px-2 font-mono">{r.tvl_cm.toFixed(4)}</td>
                              <td className="text-right py-1 px-2 font-mono">{r.mfp_cm.toFixed(4)}</td>
                              <td className="text-right py-1 px-2 font-mono">{r.eabf.toFixed(3)}</td>
                              <td className="py-1 px-2">
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => copyRow(r)}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
