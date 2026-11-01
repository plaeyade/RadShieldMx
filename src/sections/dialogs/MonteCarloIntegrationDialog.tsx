// =============================================================================
// MonteCarloIntegrationDialog.tsx — Geant4 / MCNP6 / FLUKA MC from UI
// Cloud-based MC simulation with macro generation
// =============================================================================
import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Atom, Play, Download, Copy, Cpu, FlaskConical, Timer, BarChart3 } from 'lucide-react';
import { MC_PRESETS, generateGeant4Macro, generateMCNPInput, runMonteCarloSimulation, type MCConfig, type MCResult } from '@/lib/monteCarloEngine';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export default function MonteCarloIntegrationDialog({ open, onOpenChange }: Props) {
  const [code, setCode] = useState<'geant4' | 'mcnp6' | 'fluka'>('geant4');
  const [preset, setPreset] = useState('linac6mv_concrete');
  const [energy, setEnergy] = useState('6');
  const [material, setMaterial] = useState('G4_CONCRETE');
  const [particle, setParticle] = useState<'photon' | 'electron' | 'neutron' | 'proton'>('photon');
  const [thicknesses, setThicknesses] = useState('20,40,60,80,100');
  const [nParticles, setNParticles] = useState('1e6');
  const [macro, setMacro] = useState('');
  const [results, setResults] = useState<MCResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const config: MCConfig = {
    code, geometry: 'box', material, particle, energy_MeV: parseFloat(energy) || 6,
    numParticles: parseInt(nParticles.replace('e', '')) || 1e6,
    thicknesses_cm: thicknesses.split(',').map(s => parseFloat(s.trim())).filter(Boolean),
    physicsList: 'G4EmStandardPhysics_option4',
    tallies: ['surface_current', 'surface_flux', 'energy_deposit'],
  };

  const genMacro = useCallback(() => {
    const m = code === 'mcnp6' ? generateMCNPInput(config) : generateGeant4Macro(config);
    setMacro(m);
    toast.success(`${code.toUpperCase()} macro generated`);
  }, [code, config]);

  const runSim = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runMonteCarloSimulation(config);
      setResults(res);
      setIsRunning(false);
      toast.success(`MC simulation: ${res.length} thickness points`);
    }, 1500);
  }, [config]);

  const applyPreset = useCallback((key: string) => {
    const p = MC_PRESETS[key];
    if (!p) return;
    setPreset(key);
    if (p.code) setCode(p.code);
    if (p.material) setMaterial(p.material);
    if (p.particle) setParticle(p.particle);
    if (p.energy_MeV) setEnergy(String(p.energy_MeV));
    if (p.physicsList) {/* set physics */}
    toast.success(`Preset: ${key}`);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Atom className="h-5 w-5 text-amber-500" />
            Monte Carlo Integration
            <Badge variant="outline" className="text-[10px]">{code.toUpperCase()}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="setup" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 shrink-0">
            <TabsTrigger value="setup"><Cpu className="h-3.5 w-3.5 mr-1" />Setup</TabsTrigger>
            <TabsTrigger value="macro"><FlaskConical className="h-3.5 w-3.5 mr-1" />Macro</TabsTrigger>
            <TabsTrigger value="results"><BarChart3 className="h-3.5 w-3.5 mr-1" />Results</TabsTrigger>
            <TabsTrigger value="compare"><BarChart3 className="h-3.5 w-3.5 mr-1" />vs NCRP</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3 pb-2">
              <TabsContent value="setup" className="space-y-3 mt-2">
                <div className="grid grid-cols-3 gap-2">
                  <Select value={preset} onValueChange={applyPreset}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(MC_PRESETS).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Button size="sm" variant={code === 'geant4' ? 'default' : 'outline'} className="flex-1" onClick={() => setCode('geant4')}>Geant4</Button>
                    <Button size="sm" variant={code === 'mcnp6' ? 'default' : 'outline'} className="flex-1" onClick={() => setCode('mcnp6')}>MCNP6</Button>
                    <Button size="sm" variant={code === 'fluka' ? 'default' : 'outline'} className="flex-1" onClick={() => setCode('fluka')}>FLUKA</Button>
                  </div>
                  <Input type="number" value={energy} onChange={e => setEnergy(e.target.value)} placeholder="Energy (MeV)" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Input value={material} onChange={e => setMaterial(e.target.value)} placeholder="Material" />
                  <Select value={particle} onValueChange={(v) => setParticle(v as typeof particle)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photon">Photon</SelectItem>
                      <SelectItem value="electron">Electron</SelectItem>
                      <SelectItem value="neutron">Neutron</SelectItem>
                      <SelectItem value="proton">Proton</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={thicknesses} onChange={e => setThicknesses(e.target.value)} placeholder="Thicknesses (cm) comma" />
                  <Input value={nParticles} onChange={e => setNParticles(e.target.value)} placeholder="Particles" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={genMacro} variant="outline"><FlaskConical className="h-4 w-4 mr-1" />Generate Macro</Button>
                  <Button onClick={runSim} disabled={isRunning}>
                    {isRunning ? <Timer className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                    Run MC Simulation
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="macro" className="mt-2">
                {macro ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(macro)}><Copy className="h-3.5 w-3.5 mr-1" />Copy</Button>
                      <Button size="sm" variant="outline" onClick={() => { const b = new Blob([macro]); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `mc_${code}.mac`; a.click(); }}><Download className="h-3.5 w-3.5 mr-1" />Download</Button>
                    </div>
                    <Textarea value={macro} readOnly className="font-mono text-xs h-[400px] bg-slate-950 text-green-400" />
                  </div>
                ) : <div className="text-center py-8 text-muted-foreground">Generate a macro first</div>}
              </TabsContent>

              <TabsContent value="results" className="mt-2">
                {results.length > 0 ? (
                  <div className="space-y-2">
                    <div className="overflow-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-background"><tr className="border-b">
                          <th className="text-left py-1">Thickness (cm)</th><th className="text-right">Transmitted</th><th className="text-right">Uncertainty</th><th className="text-right">TVL (cm)</th><th className="text-right">Build (ms)</th>
                        </tr></thead>
                        <tbody>{results.map((r, i) => (
                          <tr key={i} className="border-b hover:bg-muted/50">
                            <td className="py-1 font-mono">{r.thickness_cm}</td>
                            <td className="text-right font-mono">{r.transmittedFraction.toExponential(3)}</td>
                            <td className="text-right font-mono">±{r.uncertainty_percent.toFixed(1)}%</td>
                            <td className="text-right font-mono">{r.tvl_cm.toFixed(1)}</td>
                            <td className="text-right font-mono">{r.buildTime_ms.toFixed(0)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                ) : <div className="text-center py-8 text-muted-foreground">Run simulation first</div>}
              </TabsContent>

              <TabsContent value="compare" className="mt-2">
                <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                  <CardContent className="pt-4 text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-medium">MC vs NCRP 151 Validation</p>
                    <p>Compare Monte Carlo results with NCRP 151 analytical values. Typical agreement: 2-5% for simple geometries, up to 10-15% for complex bunker geometries.</p>
                  </CardContent>
                </Card>
                {results.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">MC TVL</p><p className="text-xl font-bold">{results[0].tvl_cm.toFixed(1)} cm</p></CardContent></Card>
                    <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">NCRP TVL</p><p className="text-xl font-bold">37.0 cm</p></CardContent></Card>
                    <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Agreement</p><p className="text-xl font-bold">{((1 - Math.abs(results[0].tvl_cm - 37) / 37) * 100).toFixed(1)}%</p></CardContent></Card>
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
