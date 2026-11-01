import { useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Cpu, Play, Pause, RotateCcw, Download, Activity, Zap,
  Box, AlertTriangle, CheckCircle, BarChart3, Atom, Layers
} from 'lucide-react';
import {
  runNativeMC, parseSTEPFile, detectOverlaps,
  type MCSource, type MCDetector, type MCVolumeScoring, type MCConfig,
  type MCResult, type Triangle, type MeshRegion, type BRepModel,
  MATERIAL_XS,
} from '@/lib/nativeMCEngine';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const PRESET_SOURCES: MCSource[] = [
  { position: [0, 0, 100], energy_MeV: 1.25, particle: 'photon', activity_Bq: 3.7e12 }, // Co-60
  { position: [0, 0, 100], energy_MeV: 0.317, particle: 'photon', activity_Bq: 3.7e12, spectrum: [{ energy: 0.206, probability: 0.032 }, { energy: 0.296, probability: 0.286 }, { energy: 0.308, probability: 0.298 }, { energy: 0.316, probability: 0.831 }, { energy: 0.468, probability: 0.478 }] }, // Ir-192
  { position: [0, 0, 100], energy_MeV: 6.0, particle: 'photon', activity_Bq: 1e15 }, // LINAC 6MV
  { position: [0, 0, 100], energy_MeV: 10.0, particle: 'photon', activity_Bq: 1e15 }, // LINAC 10MV
  { position: [0, 0, 100], energy_MeV: 0.662, particle: 'photon', activity_Bq: 3.7e9 }, // Cs-137
  { position: [0, 0, 100], energy_MeV: 0.511, particle: 'photon', activity_Bq: 3.7e8 }, // F-18
];

const PRESET_DETECTORS: MCDetector[] = [
  { position: [500, 0, 150], radius_cm: 10, type: 'hstar10', name: 'Control Room' },
  { position: [0, 500, 150], radius_cm: 10, type: 'hstar10', name: 'Corridor' },
  { position: [-300, 0, 150], radius_cm: 10, type: 'hstar10', name: 'Entrance' },
  { position: [0, 0, 50], radius_cm: 5, type: 'hstar10', name: 'Patient Position' },
  { position: [800, 0, 150], radius_cm: 15, type: 'photon_flux', name: 'Outside Wall' },
];

// Create demo geometry (bunker)
function createDemoGeometry(): { regions: MeshRegion[]; triangles: Triangle[] } {
  const regions: MeshRegion[] = [];
  
  // Room (air)
  const roomTris = createBoxTris([-400, -300, 0], [400, 300, 350], 'air');
  regions.push({ name: 'Treatment Room', material: 'air', triangles: roomTris, bbox: { min: [-400, -300, 0], max: [400, 300, 350] } });
  
  // Primary wall (concrete)
  const wallTris = createBoxTris([300, -250, 0], [380, 250, 300], 'concrete');
  regions.push({ name: 'Primary Barrier', material: 'concrete', triangles: wallTris, bbox: { min: [300, -250, 0], max: [380, 250, 300] } });
  
  // Floor
  const floorTris = createBoxTris([-400, -300, -30], [400, 300, 0], 'concrete');
  regions.push({ name: 'Floor', material: 'concrete', triangles: floorTris, bbox: { min: [-400, -300, -30], max: [400, 300, 0] } });
  
  // Ceiling
  const ceilTris = createBoxTris([-400, -300, 350], [400, 300, 400], 'concrete');
  regions.push({ name: 'Ceiling', material: 'concrete', triangles: ceilTris, bbox: { min: [-400, -300, 350], max: [400, 300, 400] } });
  
  // Maze wall
  const mazeTris = createBoxTris([-200, -100, 0], [-100, 100, 300], 'concrete');
  regions.push({ name: 'Maze Wall', material: 'concrete', triangles: mazeTris, bbox: { min: [-200, -100, 0], max: [-100, 100, 300] } });
  
  // Secondary wall
  const secTris = createBoxTris([-400, -320, 0], [300, -300, 300], 'concrete');
  regions.push({ name: 'Secondary Barrier', material: 'concrete', triangles: secTris, bbox: { min: [-400, -320, 0], max: [300, -300, 300] } });
  
  return { regions, triangles: regions.flatMap(r => r.triangles) };
}

function createBoxTris(
  min: [number, number, number], max: [number, number, number], material: string
): Triangle[] {
  const [xmin, ymin, zmin] = min;
  const [xmax, ymax, zmax] = max;
  const v: [number, number, number][] = [
    [xmin, ymin, zmin], [xmax, ymin, zmin], [xmax, ymax, zmin], [xmin, ymax, zmin],
    [xmin, ymin, zmax], [xmax, ymin, zmax], [xmax, ymax, zmax], [xmin, ymax, zmax],
  ];
  const faces = [[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[2,6,7],[2,7,3],[0,3,7],[0,7,4],[1,5,6],[1,6,2]];
  const tris: Triangle[] = [];
  for (const f of faces) {
    const e1: [number,number,number] = [v[f[1]][0]-v[f[0]][0], v[f[1]][1]-v[f[0]][1], v[f[1]][2]-v[f[0]][2]];
    const e2: [number,number,number] = [v[f[2]][0]-v[f[0]][0], v[f[2]][1]-v[f[0]][1], v[f[2]][2]-v[f[0]][2]];
    const n = normalize([e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]]);
    const area = 0.5 * Math.sqrt((e1[1]*e2[2]-e1[2]*e2[1])**2 + (e1[2]*e2[0]-e1[0]*e2[2])**2 + (e1[0]*e2[1]-e1[1]*e2[0])**2);
    tris.push({ v0: v[f[0]], v1: v[f[1]], v2: v[f[2]], material, normal: n, area });
  }
  return tris;
}

function normalize(v: [number,number,number]): [number,number,number] {
  const len = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
  return len === 0 ? [0,0,1] : [v[0]/len, v[1]/len, v[2]/len];
}

export default function NativeMCDialog({ open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = useState('setup');
  const [sourceIdx, setSourceIdx] = useState(0);
  const [numParticles, setNumParticles] = useState(100000);
  const [maxScatters, setMaxScatters] = useState(50);
  const [energyCutoff, setEnergyCutoff] = useState(0.001);
  const [results, setResults] = useState<MCResult | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStats, setCurrentStats] = useState({ particlesDone: 0, totalInteractions: 0, currentDoseRate: 0 });
  const [geometry, setGeometry] = useState<{ regions: MeshRegion[]; triangles: Triangle[] } | null>(null);
  const [overlaps, setOverlaps] = useState<BRepModel['overlaps']>([]);
  const [useVolumeScoring, setUseVolumeScoring] = useState(false);
  const abortRef = useRef(false);
  
  // Initialize geometry on open
  useEffect(() => {
    if (open && !geometry) {
      const geo = createDemoGeometry();
      setGeometry(geo);
      setOverlaps(detectOverlaps(geo.regions));
    }
  }, [open, geometry]);
  
  const runSimulation = useCallback(async () => {
    if (!geometry) { toast.error('No geometry loaded'); return; }
    abortRef.current = false;
    setRunning(true);
    setProgress(0);
    setResults(null);
    setActiveTab('results');
    
    const source = PRESET_SOURCES[sourceIdx];
    const detectors = PRESET_DETECTORS;
    const volumeScoring: MCVolumeScoring | null = useVolumeScoring ? {
      nx: 20, ny: 15, nz: 10,
      min: [-400, -300, 0],
      max: [400, 300, 350],
      quantity: 'hstar10',
    } : null;
    
    const config: MCConfig = {
      numParticles,
      maxScatterEvents: maxScatters,
      energyCutoff_MeV: energyCutoff,
      batchSize: 5000,
    };
    
    try {
      // Run with a small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = runNativeMC(
        [source],
        detectors,
        volumeScoring,
        geometry.triangles,
        config,
        (prog, stats) => {
          setProgress(prog * 100);
          setCurrentStats(stats);
        }
      );
      
      if (!abortRef.current) {
        setResults(result);
        setProgress(100);
        toast.success(`Simulation complete: ${result.simulationTime_s.toFixed(1)}s, ${result.physicsSummary.totalInteractions.toLocaleString()} interactions`);
      }
    } catch (err: any) {
      toast.error('Simulation error: ' + err.message);
    } finally {
      setRunning(false);
    }
  }, [geometry, sourceIdx, numParticles, maxScatters, energyCutoff, useVolumeScoring]);
  
  const stopSimulation = useCallback(() => {
    abortRef.current = true;
    setRunning(false);
    toast.info('Simulation stopped');
  }, []);
  
  const handleSTEPImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const model = await parseSTEPFile(buffer);
      setGeometry({ regions: model.regions, triangles: model.allTriangles });
      setOverlaps(model.overlaps);
      toast.success(`STEP imported: ${model.regions.length} regions, ${model.overlaps.length} overlaps detected`);
    } catch (err: any) {
      toast.error('STEP import failed: ' + err.message);
    }
  }, []);
  
  const exportResults = useCallback(() => {
    if (!results) return;
    const data = JSON.stringify(results, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MC_results_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Results exported');
  }, [results]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Atom className="w-5 h-5 text-blue-500" />
            Native Monte Carlo Engine
            <Badge variant="outline" className="text-[10px]">v25</Badge>
            <Badge variant="secondary" className="text-[10px]">Photon Transport</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-4 w-full shrink-0">
            <TabsTrigger value="setup" className="text-xs gap-1"><Cpu className="w-3.5 h-3.5" />Setup</TabsTrigger>
            <TabsTrigger value="geometry" className="text-xs gap-1"><Box className="w-3.5 h-3.5" />Geometry & STEP</TabsTrigger>
            <TabsTrigger value="results" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" />Results</TabsTrigger>
            <TabsTrigger value="physics" className="text-xs gap-1"><Zap className="w-3.5 h-3.5" />Physics</TabsTrigger>
          </TabsList>
          
          {/* SETUP TAB */}
          <TabsContent value="setup" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                <div className="grid grid-cols-2 gap-3">
                  {/* Source */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" />Source</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div>
                        <Label className="text-[10px]">Preset</Label>
                        <Select value={String(sourceIdx)} onValueChange={v => setSourceIdx(Number(v))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0" className="text-xs">Co-60 (1.25 MeV)</SelectItem>
                            <SelectItem value="1" className="text-xs">Ir-192 (spectrum)</SelectItem>
                            <SelectItem value="2" className="text-xs">LINAC 6MV</SelectItem>
                            <SelectItem value="3" className="text-xs">LINAC 10MV</SelectItem>
                            <SelectItem value="4" className="text-xs">Cs-137 (0.662 MeV)</SelectItem>
                            <SelectItem value="5" className="text-xs">F-18 PET (0.511 MeV)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>Energy: <strong>{PRESET_SOURCES[sourceIdx].energy_MeV} MeV</strong></div>
                        <div>Particle: <strong>{PRESET_SOURCES[sourceIdx].particle}</strong></div>
                        <div>Activity: <strong>{PRESET_SOURCES[sourceIdx].activity_Bq.toExponential(1)} Bq</strong></div>
                        <div>Position: <strong>[{PRESET_SOURCES[sourceIdx].position.join(', ')}] cm</strong></div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Simulation Config */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Cpu className="w-4 h-4 text-blue-500" />Simulation</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div><Label className="text-[10px]">Particles: {numParticles.toLocaleString()}</Label>
                        <input type="range" min="10000" max="1000000" step="10000" value={numParticles}
                          onChange={e => setNumParticles(Number(e.target.value))} className="w-full" /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[10px]">Max scatters</Label>
                          <input type="number" value={maxScatters} onChange={e => setMaxScatters(Number(e.target.value))}
                            className="w-full h-7 px-2 border rounded text-xs" /></div>
                        <div><Label className="text-[10px]">Energy cutoff (MeV)</Label>
                          <input type="number" step="0.001" value={energyCutoff} onChange={e => setEnergyCutoff(Number(e.target.value))}
                            className="w-full h-7 px-2 border rounded text-xs" /></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={useVolumeScoring} onCheckedChange={setUseVolumeScoring} id="volscore" />
                        <Label htmlFor="volscore" className="text-xs cursor-pointer">Volume scoring (20x15x10 mesh)</Label>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Detectors */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-500" />Detectors ({PRESET_DETECTORS.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_DETECTORS.map((det, i) => (
                        <div key={i} className="bg-muted/30 rounded p-2 text-center">
                          <p className="text-[10px] font-semibold">{det.name}</p>
                          <p className="text-[9px] text-muted-foreground">[{det.position.join(',')}] cm</p>
                          <Badge variant="outline" className="text-[8px] mt-1">{det.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Progress & Actions */}
                {running && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2"><Cpu className="w-4 h-4 text-blue-500 animate-spin" />Running...</span>
                        <span className="font-mono">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex gap-4 text-[10px] text-muted-foreground">
                        <span>Particles: {currentStats.particlesDone.toLocaleString()}</span>
                        <span>Interactions: {currentStats.totalInteractions.toLocaleString()}</span>
                        <span>H*(10): {(currentStats.currentDoseRate * 1e6).toFixed(4)} uSv/h</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="flex gap-2">
                  {!running ? (
                    <Button className="gap-1 text-xs" onClick={runSimulation} disabled={!geometry}>
                      <Play className="w-3.5 h-3.5" />Run Simulation
                    </Button>
                  ) : (
                    <Button variant="destructive" className="gap-1 text-xs" onClick={stopSimulation}>
                      <Pause className="w-3.5 h-3.5" />Stop
                    </Button>
                  )}
                  <Button variant="outline" className="gap-1 text-xs" onClick={() => { setResults(null); setProgress(0); }} disabled={running}>
                    <RotateCcw className="w-3.5 h-3.5" />Reset
                  </Button>
                  {results && (
                    <Button variant="outline" className="gap-1 text-xs" onClick={exportResults}>
                      <Download className="w-3.5 h-3.5" />Export JSON
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* GEOMETRY TAB */}
          <TabsContent value="geometry" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Box className="w-4 h-4" />STEP Import (B-Rep)</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p className="text-muted-foreground">Import a STEP file (.stp, .step) with B-Rep geometry. Uses OpenCascade.js (WebAssembly) for parsing.</p>
                    <input type="file" accept=".stp,.step" onChange={handleSTEPImport} className="text-xs" />
                    <p className="text-[10px] text-muted-foreground">Demo geometry loaded: Treatment room with concrete barriers</p>
                  </CardContent>
                </Card>
                
                {/* Regions */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers className="w-4 h-4" />Regions ({geometry?.regions.length || 0})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {geometry?.regions.map((reg, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-1.5 bg-muted/30 rounded">
                          <Badge variant="outline" className="text-[8px]">{reg.material}</Badge>
                          <span className="font-medium">{reg.name}</span>
                          <span className="text-[9px] text-muted-foreground">{reg.triangles.length} triangles</span>
                          <span className="text-[9px] text-muted-foreground ml-auto">[{reg.bbox.min.map(v=>v.toFixed(0)).join(',')}] to [{reg.bbox.max.map(v=>v.toFixed(0)).join(',')}]</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Overlaps */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Overlap Detection</CardTitle></CardHeader>
                  <CardContent>
                    {overlaps.length === 0 ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-600">
                        <CheckCircle className="w-4 h-4" /> No overlaps detected
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {overlaps.map((ov, i) => (
                          <div key={i} className={`flex items-center gap-2 text-xs p-1.5 rounded ${ov.severity === 'critical' ? 'bg-red-50' : ov.severity === 'warning' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                            <Badge className={`text-[8px] ${ov.severity === 'critical' ? 'bg-red-500' : ov.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}>{ov.severity}</Badge>
                            <span>{ov.regionA} + {ov.regionB}</span>
                            <span className="text-[9px] text-muted-foreground ml-auto">Vol: {ov.overlapVolume.toExponential(1)} cm³</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* RESULTS TAB */}
          <TabsContent value="results" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              {!results ? (
                <div className="text-center text-muted-foreground py-12 text-sm">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Run a simulation to see results</p>
                </div>
              ) : (
                <div className="space-y-3 pr-2">
                  {/* Summary KPIs */}
                  <div className="grid grid-cols-4 gap-2">
                    <Card className="bg-emerald-50"><CardContent className="p-2 text-center"><p className="text-[10px] text-emerald-600">Sim Time</p><p className="text-xl font-bold text-emerald-700">{results.simulationTime_s.toFixed(1)}s</p></CardContent></Card>
                    <Card className="bg-blue-50"><CardContent className="p-2 text-center"><p className="text-[10px] text-blue-600">Particles</p><p className="text-xl font-bold text-blue-700">{results.particlesSimulated.toLocaleString()}</p></CardContent></Card>
                    <Card className="bg-amber-50"><CardContent className="p-2 text-center"><p className="text-[10px] text-amber-600">Interactions</p><p className="text-xl font-bold text-amber-700">{results.physicsSummary.totalInteractions.toLocaleString()}</p></CardContent></Card>
                    <Card className={`${results.convergenceStatus === 'converged' ? 'bg-emerald-50' : results.convergenceStatus === 'acceptable' ? 'bg-amber-50' : 'bg-red-50'}`}>
                      <CardContent className="p-2 text-center"><p className="text-[10px]">Convergence</p><p className="text-xl font-bold">{results.convergenceStatus}</p></CardContent></Card>
                  </div>
                  
                  {/* Detector Results */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Detector Results</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {results.detectorResults.map((dr, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs p-2 bg-muted/30 rounded">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">{i + 1}</div>
                          <div className="flex-1">
                            <p className="font-medium">{dr.detectorName}</p>
                            <p className="text-[10px] text-muted-foreground">{dr.detectorType} | {dr.numEvents} events</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold">{dr.meanValue.toFixed(4)} <span className="text-[9px] font-normal">{dr.unit}</span></p>
                            <p className="text-[10px] text-muted-foreground">±{dr.relativeError.toFixed(1)}%</p>
                          </div>
                          <Badge variant={dr.relativeError < 0.05 ? 'default' : dr.relativeError < 0.15 ? 'secondary' : 'destructive'} className="text-[9px]">
                            {dr.relativeError < 0.05 ? 'Converged' : dr.relativeError < 0.15 ? 'Acceptable' : 'Poor'}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  {/* Physics Summary */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4" />Physics Summary</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {Object.entries(results.physicsSummary).map(([key, val]) => (
                          <div key={key} className="bg-muted/30 rounded p-2">
                            <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <p className="font-mono font-bold">{typeof val === 'number' ? val.toLocaleString() : val}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          {/* PHYSICS TAB */}
          <TabsContent value="physics" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2 text-xs">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Physics Model</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Monte Carlo method:</strong> Analog photon transport with full physics</p>
                    <p><strong>Particles:</strong> Photons (gamma, X-ray)</p>
                    <p><strong>Energy range:</strong> 1 keV - 20 MeV</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-muted/30 p-2 rounded"><strong>Rayleigh scattering</strong><p className="text-[10px] text-muted-foreground">Coherent scattering, forward-peaked</p></div>
                      <div className="bg-muted/30 p-2 rounded"><strong>Compton scattering</strong><p className="text-[10px] text-muted-foreground">Klein-Nishina formula, Kahn rejection sampling</p></div>
                      <div className="bg-muted/30 p-2 rounded"><strong>Photoelectric effect</strong><p className="text-[10px] text-muted-foreground">Absorption with local energy deposit</p></div>
                      <div className="bg-muted/30 p-2 rounded"><strong>Pair production</strong><p className="text-[10px] text-muted-foreground">{'>'}1.022 MeV, local energy deposit</p></div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader><CardTitle className="text-sm">Cross-Sections (NIST XCOM)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {Object.entries(MATERIAL_XS).map(([key, mat]) => (
                        <div key={key} className="flex items-center gap-2 p-1.5 bg-muted/30 rounded">
                          <Badge variant="outline" className="text-[8px]">{key}</Badge>
                          <span className="font-medium">{mat.name}</span>
                          <span className="text-[9px] text-muted-foreground">Z={mat.Z}, A={mat.A}, rho={mat.density_g_cm3} g/cm³</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader><CardTitle className="text-sm">Scoring</CardTitle></CardHeader>
                  <CardContent className="space-y-1">
                    <p><strong>H*(10):</strong> Ambient dose equivalent (ICRP 74 conversion coefficients)</p>
                    <p><strong>Photon flux:</strong> cm⁻²s⁻¹ at detector positions</p>
                    <p><strong>Air kerma:</strong> In-air kerma rate</p>
                    <p><strong>Volume scoring:</strong> 3D mesh tally for dose mapping</p>
                    <p><strong>Estimator:</strong> Track-length estimator with path-integral scoring</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader><CardTitle className="text-sm">Geometry</CardTitle></CardHeader>
                  <CardContent className="space-y-1">
                    <p><strong>Representation:</strong> B-Rep (Boundary Representation) via triangle mesh</p>
                    <p><strong>Acceleration:</strong> KD-tree for O(log n) ray-triangle intersection</p>
                    <p><strong>STEP import:</strong> OpenCascade.js (WebAssembly) for CAD parsing</p>
                    <p><strong>Overlap detection:</strong> AABB intersection + volume computation</p>
                    <p><strong>Materials:</strong> Region-based material assignment</p>
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
