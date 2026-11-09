import { DatosEjemploBanner } from '@/components/SyntheticResultBanner';
import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Cpu, Plus, Trash2, Play, Download, FileText, Activity, Zap,
  Shield, Crosshair, Radio, Layers, GitBranch, BarChart3, Copy, ExternalLink
} from 'lucide-react';
import {
  type MultiSourceJob, type MCSource, type MCDetector,
  type ShieldingObject, PREDEFINED_SOURCES,
  runMultiSourceMultiDetector, generateGeant4MultiSourceMacro,
  generateFLUKAMultiSourceInput, generateGDMLSnippet,
  generatePyg4ometryScript, createDefaultJob
} from '@/lib/multiSourceDetector';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function SourceCard({ source, index, onUpdate, onRemove }: {
  source: MCSource; index: number;
  onUpdate: (i: number, s: MCSource) => void; onRemove: (i: number) => void;
}) {
  const presets = PREDEFINED_SOURCES;
  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500" /> Source {index + 1}: {source.name}
          </CardTitle>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={() => onRemove(index)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Preset</Label>
            <Select value={source.id} onValueChange={(v) => {
              const preset = presets.find(p => p.id === v);
              if (preset) onUpdate(index, { ...preset, position: source.position });
            }}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {presets.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px]">Type</Label>
            <Select value={source.sourceType} onValueChange={(v) => onUpdate(index, { ...source, sourceType: v as any })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['point', 'isotropic', 'collimated', 'volume'].map(t =>
                  <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-[10px]">X (m)</Label>
            <input type="number" step="0.1" value={source.position.x}
              onChange={e => onUpdate(index, { ...source, position: { ...source.position, x: parseFloat(e.target.value) } })}
              className="w-full h-7 px-2 border rounded text-xs" /></div>
          <div><Label className="text-[10px]">Y (m)</Label>
            <input type="number" step="0.1" value={source.position.y}
              onChange={e => onUpdate(index, { ...source, position: { ...source.position, y: parseFloat(e.target.value) } })}
              className="w-full h-7 px-2 border rounded text-xs" /></div>
          <div><Label className="text-[10px]">Z (m)</Label>
            <input type="number" step="0.1" value={source.position.z}
              onChange={e => onUpdate(index, { ...source, position: { ...source.position, z: parseFloat(e.target.value) } })}
              className="w-full h-7 px-2 border rounded text-xs" /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Activity (Bq)</Label>
            <input type="text" value={source.activity_Bq.toExponential(2)}
              onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onUpdate(index, { ...source, activity_Bq: v }); }}
              className="w-full h-7 px-2 border rounded text-xs font-mono" /></div>
          <div><Label className="text-[10px]">Energy (MeV)</Label>
            <input type="number" step="0.01" value={source.energy_MeV}
              onChange={e => onUpdate(index, { ...source, energy_MeV: parseFloat(e.target.value) })}
              className="w-full h-7 px-2 border rounded text-xs" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetectorCard({ detector, index, onUpdate, onRemove }: {
  detector: MCDetector; index: number;
  onUpdate: (i: number, d: MCDetector) => void; onRemove: (i: number) => void;
}) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-blue-500" /> Detector {index + 1}: {detector.name}
          </CardTitle>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={() => onRemove(index)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Name</Label>
            <input type="text" value={detector.name}
              onChange={e => onUpdate(index, { ...detector, name: e.target.value })}
              className="w-full h-7 px-2 border rounded text-xs" /></div>
          <div><Label className="text-[10px]">Type</Label>
            <Select value={detector.detectorType} onValueChange={(v) => onUpdate(index, { ...detector, detectorType: v as any })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['dose_equivalent', 'photon_flux', 'absorbed_dose', 'ambient_dose', 'directional_dose'].map(t =>
                  <SelectItem key={t} value={t} className="text-xs">{t.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-[10px]">X (m)</Label>
            <input type="number" step="0.1" value={detector.position.x}
              onChange={e => onUpdate(index, { ...detector, position: { ...detector.position, x: parseFloat(e.target.value) } })}
              className="w-full h-7 px-2 border rounded text-xs" /></div>
          <div><Label className="text-[10px]">Y (m)</Label>
            <input type="number" step="0.1" value={detector.position.y}
              onChange={e => onUpdate(index, { ...detector, position: { ...detector.position, y: parseFloat(e.target.value) } })}
              className="w-full h-7 px-2 border rounded text-xs" /></div>
          <div><Label className="text-[10px]">Z (m)</Label>
            <input type="number" step="0.1" value={detector.position.z}
              onChange={e => onUpdate(index, { ...detector, position: { ...detector.position, z: parseFloat(e.target.value) } })}
              className="w-full h-7 px-2 border rounded text-xs" /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Sensitive Material</Label>
            <Select value={detector.sensitiveMaterial} onValueChange={(v) => onUpdate(index, { ...detector, sensitiveMaterial: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['tissue', 'silicon', 'air'].map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
              </SelectContent>
            </Select></div>
          <div><Label className="text-[10px]">Volume (cm³)</Label>
            <input type="number" value={detector.volume_cm3}
              onChange={e => onUpdate(index, { ...detector, volume_cm3: parseFloat(e.target.value) })}
              className="w-full h-7 px-2 border rounded text-xs" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function ShieldingCard({ shield, index, onUpdate, onRemove }: {
  shield: ShieldingObject; index: number;
  onUpdate: (i: number, s: ShieldingObject) => void; onRemove: (i: number) => void;
}) {
  return (
    <Card className="border-l-4 border-l-gray-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" /> Shield {index + 1}: {shield.name}
          </CardTitle>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={() => onRemove(index)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Material</Label>
            <Select value={shield.material} onValueChange={(v) => onUpdate(index, { ...shield, material: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['concrete', 'lead', 'steel'].map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
              </SelectContent>
            </Select></div>
          <div><Label className="text-[10px]">Thickness (cm)</Label>
            <input type="number" step="0.1" value={shield.thickness_cm}
              onChange={e => onUpdate(index, { ...shield, thickness_cm: parseFloat(e.target.value) })}
              className="w-full h-7 px-2 border rounded text-xs" /></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-[10px]">X (m)</Label>
            <input type="number" step="0.1" value={shield.position.x}
              onChange={e => onUpdate(index, { ...shield, position: { ...shield.position, x: parseFloat(e.target.value) } })}
              className="w-full h-7 px-2 border rounded text-xs" /></div>
          <div><Label className="text-[10px]">Y (m)</Label>
            <input type="number" step="0.1" value={shield.position.y}
              onChange={e => onUpdate(index, { ...shield, position: { ...shield.position, y: parseFloat(e.target.value) } })}
              className="w-full h-7 px-2 border rounded text-xs" /></div>
          <div><Label className="text-[10px]">Z (m)</Label>
            <input type="number" step="0.1" value={shield.position.z}
              onChange={e => onUpdate(index, { ...shield, position: { ...shield.position, z: parseFloat(e.target.value) } })}
              className="w-full h-7 px-2 border rounded text-xs" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MultiSourceDetectorDialog({ open, onOpenChange }: Props) {
  const [job, setJob] = useState<MultiSourceJob>(createDefaultJob);
  const [results, setResults] = useState<ReturnType<typeof runMultiSourceMultiDetector>>([]);
  const [activeTab, setActiveTab] = useState('setup');
  const [macroOutput, setMacroOutput] = useState('');
  const [macroFormat, setMacroFormat] = useState<'geant4' | 'fluka' | 'gdml' | 'pyg4ometry'>('geant4');

  const addSource = useCallback(() => {
    const preset = PREDEFINED_SOURCES[0];
    const newSrc: MCSource = {
      ...preset,
      id: `${preset.id}-${Date.now()}`,
      name: `${preset.name} (copy)`,
      position: { x: 0, y: 0, z: 0 },
    };
    setJob(prev => ({ ...prev, sources: [...prev.sources, newSrc] }));
  }, []);

  const updateSource = useCallback((i: number, s: MCSource) => {
    setJob(prev => {
      const sources = [...prev.sources]; sources[i] = s; return { ...prev, sources };
    });
  }, []);

  const removeSource = useCallback((i: number) => {
    setJob(prev => ({ ...prev, sources: prev.sources.filter((_, j) => j !== i) }));
  }, []);

  const addDetector = useCallback(() => {
    const newDet: MCDetector = {
      id: `det-${Date.now()}`,
      name: `Detector ${job.detectors.length + 1}`,
      position: { x: 0, y: 0, z: 0 },
      detectorType: 'dose_equivalent',
      sensitiveMaterial: 'tissue',
      volume_cm3: 1000,
    };
    setJob(prev => ({ ...prev, detectors: [...prev.detectors, newDet] }));
  }, [job.detectors.length]);

  const updateDetector = useCallback((i: number, d: MCDetector) => {
    setJob(prev => {
      const detectors = [...prev.detectors]; detectors[i] = d; return { ...prev, detectors };
    });
  }, []);

  const removeDetector = useCallback((i: number) => {
    setJob(prev => ({ ...prev, detectors: prev.detectors.filter((_, j) => j !== i) }));
  }, []);

  const addShielding = useCallback(() => {
    const newShield: ShieldingObject = {
      id: `shield-${Date.now()}`,
      name: `Shield ${job.shieldingObjects.length + 1}`,
      material: 'concrete', density_g_cm3: 2.35, thickness_cm: 80,
      position: { x: 0, y: 0, z: 0 }, dimensions: { width: 400, height: 300, depth: 80 },
    };
    setJob(prev => ({ ...prev, shieldingObjects: [...prev.shieldingObjects, newShield] }));
  }, [job.shieldingObjects.length]);

  const updateShielding = useCallback((i: number, s: ShieldingObject) => {
    setJob(prev => {
      const shields = [...prev.shieldingObjects]; shields[i] = s; return { ...prev, shieldingObjects: shields };
    });
  }, []);

  const removeShielding = useCallback((i: number) => {
    setJob(prev => ({ ...prev, shieldingObjects: prev.shieldingObjects.filter((_, j) => j !== i) }));
  }, []);

  const runSimulation = useCallback(() => {
    if (job.sources.length === 0) { toast.error('Add at least one source'); return; }
    if (job.detectors.length === 0) { toast.error('Add at least one detector'); return; }
    const res = runMultiSourceMultiDetector(job);
    setResults(res);
    setActiveTab('results');
    toast.success(`Simulation complete: ${res.length} detectors calculated`);
  }, [job]);

  const generateMacro = useCallback(() => {
    let output = '';
    switch (macroFormat) {
      case 'geant4': output = generateGeant4MultiSourceMacro(job); break;
      case 'fluka': output = generateFLUKAMultiSourceInput(job); break;
      case 'gdml': output = generateGDMLSnippet(job); break;
      case 'pyg4ometry': output = generatePyg4ometryScript(job); break;
    }
    setMacroOutput(output);
    setActiveTab('macro');
    toast.success(`${macroFormat.toUpperCase()} macro generated`);
  }, [job, macroFormat]);

  const downloadMacro = useCallback(() => {
    const ext = macroFormat === 'pyg4ometry' ? 'py' : macroFormat === 'gdml' ? 'gdml' : macroFormat === 'fluka' ? 'inp' : 'mac';
    const filename = `${job.name.replace(/\\s+/g, '_').toLowerCase()}.${ext}`;
    const blob = new Blob([macroOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded: ${filename}`);
  }, [macroOutput, macroFormat, job.name]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <GitBranch className="w-5 h-5 text-violet-500" />
            Multi-Source & Multi-Detector MC
            <Badge variant="outline" className="text-[10px]">pyg4ometry-inspired</Badge>
            <Badge variant="secondary" className="text-[10px]">{job.sources.length} src / {job.detectors.length} det</Badge>
          </DialogTitle>
        </DialogHeader>
        <DatosEjemploBanner detalle="Resultados e incertidumbres de un modelo propio sin validar contra el motor de dosis." />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-4 w-full shrink-0">
            <TabsTrigger value="setup" className="text-xs gap-1"><Cpu className="w-3.5 h-3.5" />Setup</TabsTrigger>
            <TabsTrigger value="results" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" />Results</TabsTrigger>
            <TabsTrigger value="macro" className="text-xs gap-1"><FileText className="w-3.5 h-3.5" />Macro Export</TabsTrigger>
            <TabsTrigger value="info" className="text-xs gap-1"><ExternalLink className="w-3.5 h-3.5" />About</TabsTrigger>
          </TabsList>

          {/* SETUP TAB */}
          <TabsContent value="setup" className="flex-1 flex gap-3 min-h-0 mt-2">
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-2">
                {/* Sources */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><Radio className="w-4 h-4 text-red-500" />Sources</h3>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addSource}><Plus className="w-3 h-3" />Add</Button>
                  </div>
                  <div className="space-y-2">
                    {job.sources.map((s, i) => <SourceCard key={s.id} source={s} index={i} onUpdate={updateSource} onRemove={removeSource} />)}
                  </div>
                </div>
                <Separator />
                {/* Detectors */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><Crosshair className="w-4 h-4 text-blue-500" />Detectors</h3>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addDetector}><Plus className="w-3 h-3" />Add</Button>
                  </div>
                  <div className="space-y-2">
                    {job.detectors.map((d, i) => <DetectorCard key={d.id} detector={d} index={i} onUpdate={updateDetector} onRemove={removeDetector} />)}
                  </div>
                </div>
                <Separator />
                {/* Shielding */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-gray-500" />Shielding Objects</h3>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addShielding}><Plus className="w-3 h-3" />Add</Button>
                  </div>
                  <div className="space-y-2">
                    {job.shieldingObjects.map((s, i) => <ShieldingCard key={s.id} shield={s} index={i} onUpdate={updateShielding} onRemove={removeShielding} />)}
                  </div>
                </div>
                <Separator />
                {/* Biasing */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" />Variance Reduction (Biasing)</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                      <Switch checked={job.biasing.enabled} onCheckedChange={(v) => setJob(prev => ({ ...prev, biasing: { ...prev.biasing, enabled: v } }))} />
                      <Label>Enable automated biasing</Label>
                    </div>
                    {job.biasing.enabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[10px]">Technique</Label>
                          <Select value={job.biasing.technique} onValueChange={(v) => setJob(prev => ({ ...prev, biasing: { ...prev.biasing, technique: v as any } }))}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['importance_sampling', 'weight_windows', 'Russian_roulette', 'splitting', 'force_collision'].map(t =>
                                <SelectItem key={t} value={t} className="text-xs">{t.replace('_', ' ')}</SelectItem>)}
                            </SelectContent>
                          </Select></div>
                        <div><Label className="text-[10px]">Particles</Label>
                          <input type="text" value={job.numParticles.toLocaleString()}
                            onChange={e => { const v = parseInt(e.target.value.replace(/,/g, '')); if (!isNaN(v)) setJob(prev => ({ ...prev, numParticles: v })); }}
                            className="w-full h-7 px-2 border rounded text-xs font-mono" /></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            {/* Quick Actions sidebar */}
            <div className="w-48 shrink-0 space-y-2">
              <Button className="w-full gap-1 text-xs h-9" onClick={runSimulation}>
                <Play className="w-3.5 h-3.5" />Run Simulation
              </Button>
              <Button variant="outline" className="w-full gap-1 text-xs h-9" onClick={generateMacro}>
                <FileText className="w-3.5 h-3.5" />Generate Macro
              </Button>
              <Separator />
              <Card className="bg-muted/30">
                <CardContent className="pt-3 space-y-2 text-[10px]">
                  <div className="flex justify-between"><span>Sources:</span><strong>{job.sources.length}</strong></div>
                  <div className="flex justify-between"><span>Detectors:</span><strong>{job.detectors.length}</strong></div>
                  <div className="flex justify-between"><span>Shielding:</span><strong>{job.shieldingObjects.length}</strong></div>
                  <div className="flex justify-between"><span>Biasing:</span><strong>{job.biasing.enabled ? job.biasing.technique : 'off'}</strong></div>
                  <div className="flex justify-between"><span>Particles:</span><strong className="font-mono">{job.numParticles.toLocaleString()}</strong></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* RESULTS TAB */}
          <TabsContent value="results" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              {results.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Run a simulation to see results</p>
                </div>
              ) : (
                <div className="space-y-3 pr-2">
                  <div className="grid grid-cols-4 gap-2">
                    <Card><CardContent className="pt-4 text-center"><p className="text-[10px] text-muted-foreground">Detectors</p><p className="text-2xl font-bold">{results.length}</p></CardContent></Card>
                    <Card><CardContent className="pt-4 text-center"><p className="text-[10px] text-muted-foreground">Converged</p><p className="text-2xl font-bold text-emerald-500">{results.filter(r => r.convergenceStatus === 'converged').length}</p></CardContent></Card>
                    <Card><CardContent className="pt-4 text-center"><p className="text-[10px] text-muted-foreground">Avg Biasing Gain</p><p className="text-2xl font-bold text-amber-500">{results.length > 0 ? (results.reduce((s, r) => s + r.biasingGain, 0) / results.length).toFixed(1) : 0}x</p></CardContent></Card>
                    <Card><CardContent className="pt-4 text-center"><p className="text-[10px] text-muted-foreground">Sim Time</p><p className="text-2xl font-bold">{results.length > 0 ? results[0].simulationTime_s : 0}s</p></CardContent></Card>
                  </div>
                  <div className="space-y-2">
                    {results.map((res) => (
                      <Card key={res.detectorId} className={`border-l-4 ${res.convergenceStatus === 'converged' ? 'border-l-emerald-500' : res.convergenceStatus === 'acceptable' ? 'border-l-amber-500' : 'border-l-red-500'}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Crosshair className="w-4 h-4 text-blue-500" />
                              {res.detectorName}
                              <Badge variant={res.convergenceStatus === 'converged' ? 'default' : 'secondary'} className="text-[9px]">{res.convergenceStatus}</Badge>
                            </CardTitle>
                            <Badge variant="outline" className="text-[9px]">Gain: {res.biasingGain.toFixed(1)}x</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-4 text-xs">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Dose Equivalent</p>
                              <p className="font-mono font-bold">{(res.doseEquivalent_Sv_per_h * 1e6).toFixed(2)} <span className="text-[9px] font-normal">µSv/h</span></p>
                              <p className="text-[10px] text-muted-foreground">±{(res.doseEquivalent_uncertainty / res.doseEquivalent_Sv_per_h * 100).toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Photon Flux</p>
                              <p className="font-mono font-bold">{res.photonFlux_cm2_per_s > 1e4 ? res.photonFlux_cm2_per_s.toExponential(2) : res.photonFlux_cm2_per_s.toFixed(2)} <span className="text-[9px] font-normal">cm⁻²s⁻¹</span></p>
                              <p className="text-[10px] text-muted-foreground">±{(res.photonFlux_uncertainty / (res.photonFlux_cm2_per_s || 1) * 100).toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Absorbed Dose</p>
                              <p className="font-mono font-bold">{(res.absorbedDose_Gy_per_h * 1e3).toFixed(3)} <span className="text-[9px] font-normal">mGy/h</span></p>
                              <p className="text-[10px] text-muted-foreground">±{(res.absorbedDose_uncertainty / (res.absorbedDose_Gy_per_h || 1) * 100).toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Conv. Coefficient</p>
                              <p className="font-mono font-bold">{res.conversionCoefficient.toFixed(2)}</p>
                              <p className="text-[10px] text-muted-foreground">Sv/Gy (ICRP 116)</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* MACRO TAB */}
          <TabsContent value="macro" className="flex-1 flex flex-col min-h-0 mt-2 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <Select value={macroFormat} onValueChange={(v) => setMacroFormat(v as any)}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="geant4" className="text-xs">Geant4 (.mac)</SelectItem>
                  <SelectItem value="fluka" className="text-xs">FLUKA (.inp)</SelectItem>
                  <SelectItem value="gdml" className="text-xs">GDML (.gdml)</SelectItem>
                  <SelectItem value="pyg4ometry" className="text-xs">pyg4ometry (.py)</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={generateMacro}><Cpu className="w-3 h-3" />Generate</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={downloadMacro} disabled={!macroOutput}><Download className="w-3 h-3" />Download</Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(macroOutput); toast.success('Copied to clipboard'); }} disabled={!macroOutput}><Copy className="w-3 h-3" />Copy</Button>
            </div>
            <ScrollArea className="flex-1 border rounded bg-slate-950">
              <pre className="p-3 text-[11px] font-mono text-green-400 whitespace-pre">{macroOutput || '# Click "Generate" to create macro'}</pre>
            </ScrollArea>
          </TabsContent>

          {/* INFO TAB */}
          <TabsContent value="info" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-2 text-xs">
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ExternalLink className="w-4 h-4" />pyg4ometry Integration</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p><strong>pyg4ometry</strong> (GitHub: g4edge/pyg4ometry) is a Python library for rapid creation and conversion of Monte Carlo radiation transport geometries for Geant4, FLUKA, and MCNP.</p>
                    <p>Key features applicable to RadShield-MX:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>GDML I/O</strong>: Read/write Geometry Description Markup Language</li>
                      <li><strong>CAD Import</strong>: STEP/IGES → GDML via FreeCAD/OpenCascade</li>
                      <li><strong>FLUKA ↔ Geant4</strong>: Bidirectional geometry conversion</li>
                      <li><strong>Overlap Detection</strong>: BSP tree-based overlap detection</li>
                      <li><strong>Tessellation</strong>: STL/PLY mesh generation for visualization</li>
                    </ul>
                    <p className="text-muted-foreground mt-2">Since RadShield-MX is a TypeScript/React frontend app, we cannot directly embed pyg4ometry (Python). Instead, we export compatible formats (GDML, Geant4 macro, FLUKA input, pyg4ometry script) that users can run locally with pyg4ometry installed.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Layers className="w-4 h-4" />Multi-Source & Multi-Detector</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p>This module enables simultaneous definition of multiple radiation sources and virtual detectors with automated variance reduction (biasing) for Monte Carlo convergence acceleration.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/30 p-2 rounded"><strong>8 predefined sources</strong>: Ir-192, Co-60, Cs-137, F-18, Am-241, Se-75, LINAC 6MV, LINAC 10MV</div>
                      <div className="bg-muted/30 p-2 rounded"><strong>5 detector types</strong>: H*(10), photon flux, absorbed dose, ambient dose, directional dose</div>
                    </div>
                    <p className="text-muted-foreground">Results: equivalent dose rates, photon fluxes, absorbed dose by electronic components. Supports 5 biasing techniques: importance sampling, weight windows, Russian roulette, splitting, force collision.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">References</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-[11px]">
                    <p>• Walko et al., "pyg4ometry: a Python library for Monte Carlo radiation transport geometries", CPC 2022</p>
                    <p>• ICRP 116: Conversion Coefficients for Radiological Protection Quantities (2010)</p>
                    <p>• ICRP 74: Conversion Coefficients for Use in Radiological Protection (1996)</p>
                    <p>• ICRU 57: Conversion Coefficients for Use in Radiological Protection (1998)</p>
                    <p>• ANSI/ANS-6.1.1: Neutron and Gamma-Ray Fluence-to-Dose Factors (1991)</p>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
