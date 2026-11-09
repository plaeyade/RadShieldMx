// =============================================================================
// MonteCarloIntegrationDialog.tsx — Geant4 / MCNP6 / FLUKA MC from UI
// Cloud-based MC simulation with macro generation
// Fase 9: la simulación propia (números aleatorios, sin caso de validación) queda desactivada; el diálogo genera el
// macro para correrlo en Geant4/MCNP6/FLUKA y muestra como referencia la transmisión de NCRP 151 (Tabla B.2) de los
// espesores capturados (`lib/referenciaMC`). Antes «vs NCRP» comparaba con un TVL fijo de 37 cm.
// =============================================================================
import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Atom, Download, Copy, Cpu, FlaskConical, BarChart3 } from 'lucide-react';
import { MC_PRESETS, generateGeant4Macro, generateMCNPInput, type MCConfig } from '@/lib/monteCarloEngine';
import { referenciaNCRP151 } from '@/lib/referenciaMC';

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

  const config: MCConfig = {
    code, geometry: 'box', material, particle, energy_MeV: parseFloat(energy) || 6,
    numParticles: Math.round(Number(nParticles)) || 1e6,
    thicknesses_cm: thicknesses.split(',').map(s => parseFloat(s.trim())).filter(Boolean),
    physicsList: 'G4EmStandardPhysics_option4',
    tallies: ['surface_current', 'surface_flux', 'energy_deposit'],
  };

  const genMacro = useCallback(() => {
    const m = code === 'mcnp6' ? generateMCNPInput(config) : generateGeant4Macro(config);
    setMacro(m);
    toast.success(`${code.toUpperCase()} macro generated`);
  }, [code, config]);

  const referencia = useMemo(
    () => referenciaNCRP151(particle, parseFloat(energy), material, thicknesses.split(',').map((s) => parseFloat(s.trim()))),
    [particle, energy, material, thicknesses],
  );

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
        <p data-testid="mc-simulacion-desactivada" role="note" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <strong>Simulación en el navegador desactivada:</strong> no hay un transporte validado. Exporte el macro, córralo en
          el código elegido y compare con la referencia de NCRP 151.
        </p>

        <Tabs defaultValue="setup" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 shrink-0">
            <TabsTrigger value="setup"><Cpu className="h-3.5 w-3.5 mr-1" />Setup</TabsTrigger>
            <TabsTrigger value="macro"><FlaskConical className="h-3.5 w-3.5 mr-1" />Macro</TabsTrigger>
            <TabsTrigger value="results"><BarChart3 className="h-3.5 w-3.5 mr-1" />Resultados</TabsTrigger>
            <TabsTrigger value="compare"><BarChart3 className="h-3.5 w-3.5 mr-1" />Referencia NCRP 151</TabsTrigger>
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
                  <Button onClick={genMacro} variant="outline"><FlaskConical className="h-4 w-4 mr-1" />Generar macro</Button>
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
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Sin resultados: la app no ejecuta Monte Carlo. Los resultados se obtienen corriendo el macro en el código externo.
                </div>
              </TabsContent>

              <TabsContent value="compare" className="mt-2">
                {referencia ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      NCRP 151 Ec. 2.3, Tabla B.2 (primaria, banda ancha): {referencia.energia === 'Co60' ? 'Co-60' : `${referencia.energia} MV`}, {referencia.material}
                      — TVL₁ {referencia.tvl.tvl1_cm} cm, TVLₑ {referencia.tvl.tvle_cm} cm.
                    </p>
                    <table data-testid="mc-referencia-ncrp151" className="w-full text-xs">
                      <thead><tr className="border-b"><th className="text-left py-1">Espesor (cm)</th><th className="text-right">Transmisión B</th></tr></thead>
                      <tbody>{referencia.filas.map((r) => (
                        <tr key={r.t_cm} className="border-b"><td className="py-1 font-mono">{r.t_cm}</td><td className="text-right font-mono">{r.transmision.toExponential(3)}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Sin referencia: NCRP 151 Tabla B.2 sólo tabula fotones de Co-60 y de 4–30 MV en concreto, acero y plomo (G4_CONCRETE, G4_Fe, G4_Pb).
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
