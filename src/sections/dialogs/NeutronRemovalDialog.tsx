// =============================================================================
// NeutronRemovalDialog.tsx — Fast Neutron Removal Cross Section (Sigma_R) Calculator
// ANSI/ANS-6.4.3 methodology for neutron shielding design
// Calculates transmission, required thickness, and dose rates
// =============================================================================
import { useState, useMemo, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Atom, Calculator, ArrowRight, Shield, Zap,
  TrendingDown, AlertTriangle, Info, Download, Table,
} from 'lucide-react';
import {
  NEUTRON_REMOVAL_DATA, calculateNeutronTransmission, calculateNeutronShieldingThickness,
  type NeutronRemovalData,
} from '@/lib/phyXData';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface CalcResult {
  thickness_cm: number;
  transmission: number;
  attenuation_db: number;
  dose_rate_rem: number; // rem/h at 1 m from 1 Ci source (approximate)
}

export default function NeutronRemovalDialog({ open, onOpenChange }: Props) {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('Ordinary Concrete');
  const [thickness, setThickness] = useState('100');
  const [targetReduction, setTargetReduction] = useState('100'); // factor
  const [sourceStrength, setSourceStrength] = useState('1000'); // Ci equivalent
  const [distance_m, setDistance_m] = useState('1');
  const [calcMode, setCalcMode] = useState<'transmission' | 'thickness'>('transmission');
  const [results, setResults] = useState<CalcResult[]>([]);
  const [singleResult, setSingleResult] = useState<CalcResult | null>(null);

  const material = useMemo(() =>
    NEUTRON_REMOVAL_DATA.find(m => m.material === selectedMaterial),
    [selectedMaterial]
  );

  const calculate = useCallback(() => {
    if (!material) { toast.error('Select a material'); return; }

    if (calcMode === 'transmission') {
      const t = parseFloat(thickness) || 0;
      if (t <= 0) { toast.error('Thickness must be > 0'); return; }

      // Generate thickness sweep
      const sweep: CalcResult[] = [];
      for (let d = 0; d <= t * 2; d += t / 20) {
        const trans = calculateNeutronTransmission(material.sigma_R_cm_1, d);
        sweep.push({
          thickness_cm: d,
          transmission: trans,
          attenuation_db: trans > 0 ? -10 * Math.log10(trans) : 100,
          dose_rate_rem: 0, // placeholder
        });
      }
      setResults(sweep);

      // Single point result
      const trans = calculateNeutronTransmission(material.sigma_R_cm_1, t);
      setSingleResult({
        thickness_cm: t,
        transmission: trans,
        attenuation_db: trans > 0 ? -10 * Math.log10(trans) : 100,
        dose_rate_rem: (parseFloat(sourceStrength) || 0) * trans * 0.01 / (parseFloat(distance_m) || 1) ** 2,
      });
    } else {
      const reduction = parseFloat(targetReduction) || 2;
      const target_trans = 1 / reduction;
      const req_thickness = calculateNeutronShieldingThickness(material.sigma_R_cm_1, target_trans);
      const actual_trans = calculateNeutronTransmission(material.sigma_R_cm_1, req_thickness);

      setSingleResult({
        thickness_cm: req_thickness,
        transmission: actual_trans,
        attenuation_db: actual_trans > 0 ? -10 * Math.log10(actual_trans) : 100,
        dose_rate_rem: (parseFloat(sourceStrength) || 0) * actual_trans * 0.01 / (parseFloat(distance_m) || 1) ** 2,
      });

      // Generate sweep around calculated thickness
      const sweep: CalcResult[] = [];
      for (let d = 0; d <= req_thickness * 2; d += req_thickness / 20 || 1) {
        const trans = calculateNeutronTransmission(material.sigma_R_cm_1, d);
        sweep.push({
          thickness_cm: d,
          transmission: trans,
          attenuation_db: trans > 0 ? -10 * Math.log10(trans) : 100,
          dose_rate_rem: 0,
        });
      }
      setResults(sweep);
    }

    toast.success('Neutron shielding calculation complete');
  }, [material, thickness, targetReduction, calcMode, sourceStrength, distance_m]);

  const exportCSV = useCallback(() => {
    if (results.length === 0) { toast.error('No results'); return; }
    const headers = 'Thickness (cm),Transmission,Attenuation (dB)\n';
    const rows = results.map(r => `${r.thickness_cm.toFixed(2)},${r.transmission.toExponential(4)},${r.attenuation_db.toFixed(2)}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neutron_shielding_${material?.material.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, material]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Atom className="h-5 w-5 text-blue-500" />
            Fast Neutron Removal Cross Section (Σᵣ) Calculator
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            ANSI/ANS-6.4.3 methodology — Calculate neutron shielding thickness and transmission
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4">
            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
              <CardContent className="pt-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Fast Neutron Removal Cross Section</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Σᵣ (sigma-R) is the macroscopic cross section for fast neutron removal.
                    It describes the probability per unit path length that a fast neutron is removed
                    from the beam (by scattering or absorption). Key for accelerator &gt;10 MV bunkers.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Material Selection */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Material</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Shielding Material</Label>
                    <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NEUTRON_REMOVAL_DATA.map(m => (
                          <SelectItem key={m.material} value={m.material}>
                            {m.material} (Σᵣ = {m.sigma_R_cm_1.toFixed(4)} cm⁻¹)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {material && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs text-muted-foreground">Density</p>
                        <p className="font-medium">{material.density_g_cm3} g/cm³</p>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs text-muted-foreground">Σᵣ (linear)</p>
                        <p className="font-medium">{material.sigma_R_cm_1.toFixed(4)} cm⁻¹</p>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs text-muted-foreground">Σᵣ (mass)</p>
                        <p className="font-medium">{material.sigma_R_cm2_g.toFixed(4)} cm²/g</p>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs text-muted-foreground">HVL (fast n)</p>
                        <p className="font-medium">{material.HVL_fast_n_cm.toFixed(1)} cm</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Calculation Mode */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4" />Calculation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm" variant={calcMode === 'transmission' ? 'default' : 'outline'}
                      onClick={() => setCalcMode('transmission')} className="flex-1"
                    >
                      Transmission
                    </Button>
                    <Button
                      size="sm" variant={calcMode === 'thickness' ? 'default' : 'outline'}
                      onClick={() => setCalcMode('thickness')} className="flex-1"
                    >
                      Find Thickness
                    </Button>
                  </div>

                  {calcMode === 'transmission' ? (
                    <div>
                      <Label>Thickness (cm)</Label>
                      <Input type="number" value={thickness} onChange={e => setThickness(e.target.value)} min="0.1" step="0.1" />
                    </div>
                  ) : (
                    <div>
                      <Label>Required Dose Reduction Factor</Label>
                      <Input type="number" value={targetReduction} onChange={e => setTargetReduction(e.target.value)} min="1" step="1" placeholder="e.g., 100 for 1% transmission" />
                      <p className="text-xs text-muted-foreground mt-1">Target = 1/N of original dose</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Source (Ci eq)</Label>
                      <Input type="number" value={sourceStrength} onChange={e => setSourceStrength(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Distance (m)</Label>
                      <Input type="number" value={distance_m} onChange={e => setDistance_m(e.target.value)} />
                    </div>
                  </div>

                  <Button onClick={calculate} className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Calculate
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Single Result */}
            {singleResult && (
              <div className="grid grid-cols-4 gap-3">
                <Card className="bg-blue-50 dark:bg-blue-950">
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">Thickness</p>
                    <p className="text-2xl font-bold text-blue-600">{singleResult.thickness_cm.toFixed(1)} cm</p>
                  </CardContent>
                </Card>
                <Card className={singleResult.transmission < 0.01 ? 'bg-emerald-50 dark:bg-emerald-950' : singleResult.transmission < 0.1 ? 'bg-amber-50 dark:bg-amber-950' : 'bg-red-50 dark:bg-red-950'}>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">Transmission</p>
                    <p className={`text-2xl font-bold ${singleResult.transmission < 0.01 ? 'text-emerald-600' : singleResult.transmission < 0.1 ? 'text-amber-600' : 'text-red-600'}`}>
                      {(singleResult.transmission * 100).toFixed(4)}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-950">
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">Attenuation</p>
                    <p className="text-2xl font-bold text-purple-600">{singleResult.attenuation_db.toFixed(1)} dB</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 dark:bg-orange-950">
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">TVL</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {material ? (Math.log(10) / material.sigma_R_cm_1).toFixed(1) : '—'} cm
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Material Comparison Table */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Table className="h-4 w-4" />Material Comparison (Fast Neutrons)</CardTitle>
                <Button size="sm" variant="outline" onClick={exportCSV}>
                  <Download className="h-3 w-3 mr-1" />Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b">
                        <th className="text-left py-1.5 px-2">Material</th>
                        <th className="text-right py-1.5 px-2">ρ (g/cm³)</th>
                        <th className="text-right py-1.5 px-2">Σᵣ (cm⁻¹)</th>
                        <th className="text-right py-1.5 px-2">Σᵣ (cm²/g)</th>
                        <th className="text-right py-1.5 px-2">HVL (cm)</th>
                        <th className="text-right py-1.5 px-2">TVL (cm)</th>
                        <th className="py-1.5 px-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {NEUTRON_REMOVAL_DATA.map(m => (
                        <tr
                          key={m.material}
                          className={`border-b hover:bg-muted/50 ${m.material === selectedMaterial ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                          onClick={() => setSelectedMaterial(m.material)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="py-1.5 px-2 font-medium">{m.material}</td>
                          <td className="text-right py-1.5 px-2 font-mono">{m.density_g_cm3.toFixed(2)}</td>
                          <td className="text-right py-1.5 px-2 font-mono">{m.sigma_R_cm_1.toFixed(4)}</td>
                          <td className="text-right py-1.5 px-2 font-mono">{m.sigma_R_cm2_g.toFixed(4)}</td>
                          <td className="text-right py-1.5 px-2 font-mono">{m.HVL_fast_n_cm.toFixed(1)}</td>
                          <td className="text-right py-1.5 px-2 font-mono">{(Math.log(10) / m.sigma_R_cm_1).toFixed(1)}</td>
                          <td className="py-1.5 px-2 text-muted-foreground max-w-[200px] truncate">{m.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Results Chart Data */}
            {results.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Transmission Curve Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto max-h-48">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b">
                          <th className="text-left py-1 px-2">Thickness (cm)</th>
                          <th className="text-right py-1 px-2">Transmission</th>
                          <th className="text-right py-1 px-2">Attenuation (dB)</th>
                          <th className="text-right py-1 px-2">% Reduction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.filter((_, i) => i % 5 === 0).map((r, i) => (
                          <tr key={i} className="border-b hover:bg-muted/50">
                            <td className="py-1 px-2 font-mono">{r.thickness_cm.toFixed(1)}</td>
                            <td className="text-right py-1 px-2 font-mono">{r.transmission.toExponential(3)}</td>
                            <td className="text-right py-1 px-2 font-mono">{r.attenuation_db.toFixed(2)}</td>
                            <td className="text-right py-1 px-2 font-mono">{((1 - r.transmission) * 100).toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Multi-layer recommendation */}
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  Multi-Layer Neutron Shielding Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
                <p>
                  For photoneutron fields (&gt;10 MV linacs), a multi-layer approach is recommended:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li><strong>Inner layer (high-Z):</strong> Lead or steel — attenuates primary photons and inelastic neutron scattering</li>
                  <li><strong>Middle layer (moderator):</strong> Polyethylene or paraffin — thermalizes fast neutrons via H scattering</li>
                  <li><strong>Outer layer (absorber):</strong> Borated polyethylene or concrete with boron — captures thermal neutrons</li>
                </ol>
                <p className="text-xs mt-2">
                  Typical bunker wall: 150-200 cm ordinary concrete provides adequate neutron shielding for 18 MV linacs.
                  Add 2-5 cm borated polyethylene for enhanced thermal neutron capture near maze entrance.
                </p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
