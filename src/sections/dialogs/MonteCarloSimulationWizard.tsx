import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Cpu, Atom, Box, Layers, Zap, Globe, Database, Crosshair,
  ChevronRight, ChevronLeft, X, FileText, Download, Play,
  Pause, RotateCcw, Code, Terminal, Settings, Eye, Activity
} from 'lucide-react';
import { SyntheticResultBanner } from '@/components/SyntheticResultBanner';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

interface SimState {
  step: number;
  tool: 'geant4' | 'gate' | 'root' | 'mcnp' | 'fluka' | 'srim';
  equipment: string;
  energy_MeV: number;
  particles: number;
  geometry: string;
  material: string;
  outputType: string;
  threads: number;
  status: 'idle' | 'running' | 'done' | 'error';
  progress: number;
  results: SimResult | null;
}

interface SimResult {
  doseMap: number[][];
  isodoses: number[];
  maxDose: number;
  minDose: number;
  meanDose: number;
  cpuTime_s: number;
  particlesSimulated: number;
  statisticalError_percent: number;
}

const SIM_TOOLS = [
  { id: 'geant4' as const, name: 'Geant4', version: '11.2', icon: '🔬', description: 'C++ toolkit for simulating passage of particles through matter', status: 'ready', features: ['EM physics', 'Hadronic physics', 'Optical photons', 'Stepping action'] },
  { id: 'gate' as const, name: 'GATE', version: '9.4', icon: '🏥', description: 'Geant4 Application for Tomographic Emission — medical imaging & radiotherapy', status: 'ready', features: ['PET/SPECT', 'LINAC dose', 'CT imaging', 'Time management'] },
  { id: 'root' as const, name: 'ROOT', version: '6.30', icon: '📊', description: 'Data analysis framework for high-energy physics', status: 'ready', features: ['Histograms', 'NTuples', 'TTree', 'Visualization'] },
  { id: 'mcnp' as const, name: 'MCNP', version: '6.2', icon: '⚛️', description: 'Monte Carlo N-Particle Transport Code — LANL', status: 'future', features: ['Neutron transport', 'Criticality', 'SDEF source', 'F4/F5 tallies'] },
  { id: 'fluka' as const, name: 'FLUKA', version: '4-3.4', icon: '🔮', description: 'Fully integrated particle physics Monte Carlo simulation package', status: 'future', features: ['Heavy ions', 'Activation', 'Residual dose', 'Neutronics'] },
  { id: 'srim' as const, name: 'SRIM', version: '2013', icon: '🎯', description: 'Stopping and Range of Ions in Matter', status: 'future', features: ['Ion range', 'Straggling', 'Damage', 'Sputtering'] },
];

const EQUIPMENT_PRESETS = [
  { id: 'linac-6mv', name: 'LINAC 6 MV', energy: 6, particles: 1e6, geometry: 'water_phantom_40x40x30', material: 'water' },
  { id: 'linac-18mv', name: 'LINAC 18 MV', energy: 18, particles: 5e6, geometry: 'water_phantom_40x40x30', material: 'water' },
  { id: 'kiube-100', name: 'IBA Cyclone KIUBE 100', energy: 18, particles: 1e7, geometry: 'concrete_vault_4x4x2.5', material: 'concrete_2350' },
  { id: 'kiube-300', name: 'IBA Cyclone KIUBE 300', energy: 18, particles: 2e7, geometry: 'concrete_vault_4x4x2.5', material: 'concrete_2350' },
  { id: 'pet-ct', name: 'PET-CT F-18', energy: 0.511, particles: 1e6, geometry: 'phantom_nema', material: 'water' },
  { id: 'gamma-knife', name: 'Gamma Knife Co-60', energy: 1.25, particles: 1e6, geometry: 'head_phantom', material: 'water' },
  { id: 'hdr-192ir', name: 'HDR Ir-192', energy: 0.38, particles: 5e5, geometry: 'water_phantom_15x15x15', material: 'water' },
];

const ISODOSE_PRESETS = [90, 80, 70, 60, 50, 40, 30, 20, 10];

const STEPS = [
  { num: 1, label: 'Herramienta', icon: Cpu },
  { num: 2, label: 'Equipo', icon: Box },
  { num: 3, label: 'Geometría', icon: Layers },
  { num: 4, label: 'Simular', icon: Play },
  { num: 5, label: 'Resultados', icon: FileText },
];

// Generate mock dose distribution
function generateMockDoseMap(width: number, height: number, energy: number, particles: number): number[][] {
  const map: number[][] = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDose = energy * particles / 1e6; // arbitrary scaling
  
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Gaussian-like falloff + some noise
      const dose = maxDose * Math.exp(-dist * dist / (width * height / 8)) * (0.8 + 0.4 * Math.random());
      row.push(dose);
    }
    map.push(row);
  }
  return map;
}

// Mock simulation runner
function runMockSimulation(state: SimState): SimResult {
  const w = 100;
  const h = 100;
  const doseMap = generateMockDoseMap(w, h, state.energy_MeV, state.particles);
  
  let maxDose = 0;
  let minDose = Infinity;
  let sumDose = 0;
  doseMap.forEach(row => row.forEach(d => {
    maxDose = Math.max(maxDose, d);
    minDose = Math.min(minDose, d);
    sumDose += d;
  }));
  
  return {
    doseMap,
    isodoses: ISODOSE_PRESETS.map(p => maxDose * p / 100),
    maxDose,
    minDose,
    meanDose: sumDose / (w * h),
    cpuTime_s: state.particles / 1e6 * (state.tool === 'mcnp' ? 300 : state.tool === 'geant4' ? 120 : 60),
    particlesSimulated: state.particles,
    statisticalError_percent: 100 / Math.sqrt(state.particles),
  };
}

// Isodose Canvas Renderer
function IsodoseCanvas({ doseMap, levels, maxDose }: { doseMap: number[][]; levels: number[]; maxDose: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    const rows = doseMap.length;
    const cols = doseMap[0].length;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const mapY = Math.floor(y * rows / h);
        const mapX = Math.floor(x * cols / w);
        const dose = doseMap[mapY]?.[mapX] || 0;
        const normalized = dose / maxDose;
        
        const idx = (y * w + x) * 4;
        // Jet colormap
        if (normalized < 0.125) {
          imgData.data[idx] = 0;
          imgData.data[idx + 1] = 0;
          imgData.data[idx + 2] = 128 + normalized * 8 * 127;
        } else if (normalized < 0.375) {
          imgData.data[idx] = 0;
          imgData.data[idx + 1] = (normalized - 0.125) * 4 * 255;
          imgData.data[idx + 2] = 255;
        } else if (normalized < 0.625) {
          imgData.data[idx] = (normalized - 0.375) * 4 * 255;
          imgData.data[idx + 1] = 255;
          imgData.data[idx + 2] = 255 - (normalized - 0.375) * 4 * 255;
        } else if (normalized < 0.875) {
          imgData.data[idx] = 255;
          imgData.data[idx + 1] = 255 - (normalized - 0.625) * 4 * 255;
          imgData.data[idx + 2] = 0;
        } else {
          imgData.data[idx] = 255;
          imgData.data[idx + 1] = (normalized - 0.875) * 8 * 128;
          imgData.data[idx + 2] = (normalized - 0.875) * 8 * 128;
        }
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw isodose contour lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    levels.forEach((level, li) => {
      const normLevel = level / maxDose;
      ctx.strokeStyle = li < 3 ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)';
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const d = doseMap[y][x] / maxDose;
          // Simple marching squares-ish contour
          if ((d > normLevel && doseMap[y][x-1] / maxDose <= normLevel) ||
              (d <= normLevel && doseMap[y][x-1] / maxDose > normLevel)) {
            const px = x * w / cols;
            const py = y * h / rows;
            ctx.beginPath();
            ctx.moveTo(px, py - 2);
            ctx.lineTo(px, py + 2);
            ctx.stroke();
          }
        }
      }
    });
  }, [doseMap, levels, maxDose]);

  return <canvas ref={canvasRef} width={400} height={400} className="w-full max-w-md border rounded" />;
}

// 3D Dose Mapping Canvas
function Dose3DCanvas({ doseMap }: { doseMap: number[][] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const rows = doseMap.length;
    const cols = doseMap[0].length;
    const maxDose = Math.max(...doseMap.flat());
    const cellW = w / cols;
    const cellH = h / rows;

    // Draw pseudo-3D bars
    for (let y = 0; y < rows; y += 2) {
      for (let x = 0; x < cols; x += 2) {
        const dose = doseMap[y][x];
        const height = (dose / maxDose) * h * 0.6;
        const px = x * cellW;
        const py = h - y * cellH - height;
        
        const colorVal = Math.floor((dose / maxDose) * 255);
        ctx.fillStyle = `rgb(${colorVal}, ${100}, ${255 - colorVal})`;
        ctx.fillRect(px, py, cellW * 1.8, height);
        
        // Top face
        ctx.fillStyle = `rgb(${colorVal + 30}, ${130}, ${255 - colorVal + 30})`;
        ctx.fillRect(px, py - 3, cellW * 1.8, 3);
      }
    }
  }, [doseMap]);

  return <canvas ref={canvasRef} width={500} height={350} className="w-full border rounded bg-slate-50" />;
}

export default function MonteCarloSimulationWizard({ open, onOpenChange }: Props) {
  const [state, setState] = useState<SimState>({
    step: 1,
    tool: 'geant4',
    equipment: 'linac-6mv',
    energy_MeV: 6,
    particles: 1e6,
    geometry: 'water_phantom_40x40x30',
    material: 'water',
    outputType: 'dose_3d',
    threads: 4,
    status: 'idle',
    progress: 0,
    results: null,
  });

  const update = (partial: Partial<SimState>) => setState(s => ({ ...s, ...partial }));
  const preset = EQUIPMENT_PRESETS.find(p => p.id === state.equipment);

  const handleRunSimulation = async () => {
    update({ status: 'running', progress: 0, results: null });
    
    // Simulate progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 100));
      update({ progress: i });
    }

    const results = runMockSimulation(state);
    update({ status: 'done', progress: 100, results, step: 5 });
  };

  const handleExportMacro = () => {
    let macro = '';
    if (state.tool === 'geant4') {
      macro = `# Geant4 Macro — RadSHIELD Mx Simulation\n` +
        `/run/verbose 0\n/event/verbose 0\n` +
        `/run/numberOfThreads ${state.threads}\n` +
        `/run/initialize\n` +
        `# Source: ${preset?.name}\n` +
        `/gun/particle gamma\n` +
        `/gun/energy ${state.energy_MeV} MeV\n` +
        `/gun/position 0 0 0\n` +
        `/gun/direction 0 0 1\n` +
        `/run/beamOn ${state.particles}\n` +
        `/score/dumpQuantityToFile boxMesh_1 dose dose.csv\n`;
    } else if (state.tool === 'gate') {
      macro = `# GATE Macro — RadSHIELD Mx\n` +
        `/gate/run/verbose 0\n` +
        `/gate/random/setEngineName MersenneTwister\n` +
        `/gate/application/setTotalNumberOfPrimaries ${state.particles}\n` +
        `/gate/source/addSource source1 gps\n` +
        `/gate/source/source1/gps/particle gamma\n` +
        `/gate/source/source1/gps/energy ${state.energy_MeV} MeV\n` +
        `/gate/application/startDAQ\n`;
    } else if (state.tool === 'mcnp') {
      macro = `# MCNP Input — RadSHIELD Mx (FUTURE)\n` +
        `C ${preset?.name} simulation\n` +
        `1   1  -1.0  1 -2 3 -4 5 -6  imp:p=1\n` +
        `2   2  -2.35  2 -7 8 -9 10 -11  imp:p=1 imp:n=1\n` +
        `99  0        -1:7:-8:9:-10:11  imp:p=0 imp:n=0\n` +
        `C Material cards...\n` +
        `SDEF  pos=d1  erg=${state.energy_MeV}  par=p\n` +
        `SI1 0 1\n` +
        `SP1 0 1\n` +
        `F4:p 1\n` +
        `F5:p 10 20 30 1\n` +
        `NPS ${state.particles}\n`;
    }
    const blob = new Blob([macro], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radshield_${state.tool}_macro.mac`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <SyntheticResultBanner />
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold">Simulación Monte Carlo — RadSHIELD Mx</h2>
          <Badge variant="outline" className="text-[10px] border-cyan-400 text-cyan-300">v14.1</Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Geant4 | GATE | ROOT | MCNP (future)</span>
          <Button
            aria-label="Cerrar Monte Carlo Simulation Wizard"
            size="sm"
            variant="ghost"
            className="text-white hover:bg-slate-700"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b">
        {STEPS.map(s => {
          const Icon = s.icon;
          const isActive = state.step === s.num;
          const isDone = state.step > s.num;
          return (
            <div key={s.num} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-cyan-600 text-white' : isDone ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <Icon className="w-3 h-3" />
              <span>{s.num}. {s.label}</span>
            </div>
          );
        })}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-5xl mx-auto">
          {/* STEP 1: TOOL */}
          {state.step === 1 && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Seleccione herramienta de simulación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {SIM_TOOLS.map(tool => (
                      <Button
                        key={tool.id}
                        variant={state.tool === tool.id ? 'default' : 'outline'}
                        className={`h-auto py-3 flex flex-col items-center ${state.tool === tool.id ? 'bg-cyan-600' : ''} ${tool.status === 'future' ? 'opacity-60' : ''}`}
                        onClick={() => update({ tool: tool.id })}
                      >
                        <span className="text-2xl">{tool.icon}</span>
                        <span className="text-xs font-medium">{tool.name} v{tool.version}</span>
                        <span className="text-[10px] opacity-80">{tool.description}</span>
                        {tool.status === 'future' && <Badge variant="outline" className="text-[9px] mt-1">Futuro</Badge>}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 2: EQUIPMENT */}
          {state.step === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Seleccione equipo a simular</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {EQUIPMENT_PRESETS.map(eq => (
                      <Button
                        key={eq.id}
                        variant={state.equipment === eq.id ? 'default' : 'outline'}
                        className={`h-auto py-2 justify-start ${state.equipment === eq.id ? 'bg-cyan-600' : ''}`}
                        onClick={() => update({ 
                          equipment: eq.id, 
                          energy_MeV: eq.energy, 
                          particles: eq.particles,
                          geometry: eq.geometry,
                          material: eq.material
                        })}
                      >
                        <div className="text-left">
                          <div className="text-xs font-medium">{eq.name}</div>
                          <div className="text-[10px] opacity-80">{eq.energy} MeV | {eq.particles.toExponential(0)} partículas</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Energía (MeV)</Label>
                      <Input type="number" value={state.energy_MeV} onChange={e => update({ energy_MeV: parseFloat(e.target.value) || 6 })} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs">Partículas a simular</Label>
                      <Select value={state.particles.toExponential(0)} onValueChange={v => update({ particles: parseFloat(v) })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1e+5">1×10⁵ (rápido)</SelectItem>
                          <SelectItem value="1e+6">1×10⁶ (estándar)</SelectItem>
                          <SelectItem value="5e+6">5×10⁶ (preciso)</SelectItem>
                          <SelectItem value="1e+7">1×10⁷ (alta precisión)</SelectItem>
                          <SelectItem value="2e+7">2×10⁷ (MCNP-level)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 3: GEOMETRY */}
          {state.step === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Configurar geometría y salida</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Geometría</Label>
                      <Select value={state.geometry} onValueChange={v => update({ geometry: v })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="water_phantom_40x40x30">Water phantom 40×40×30 cm</SelectItem>
                          <SelectItem value="water_phantom_15x15x15">Water phantom 15×15×15 cm</SelectItem>
                          <SelectItem value="concrete_vault_4x4x2.5">Concrete vault 4×4×2.5 m</SelectItem>
                          <SelectItem value="phantom_nema">NEMA phantom</SelectItem>
                          <SelectItem value="head_phantom">Anthropomorphic head</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Material</Label>
                      <Select value={state.material} onValueChange={v => update({ material: v })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="water">Water (ICRU 44)</SelectItem>
                          <SelectItem value="concrete_2350">Concrete 2350 kg/m³</SelectItem>
                          <SelectItem value="concrete_2400">Concrete 2400 kg/m³</SelectItem>
                          <SelectItem value="lead">Lead 11340 kg/m³</SelectItem>
                          <SelectItem value="tissue_soft">Soft tissue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Tipo de salida</Label>
                      <Select value={state.outputType} onValueChange={v => update({ outputType: v })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dose_3d">3D Dose Map</SelectItem>
                          <SelectItem value="isodose">Isodose Curves</SelectItem>
                          <SelectItem value="heatmap">Heat Map</SelectItem>
                          <SelectItem value="bragg_peak">Bragg Peak</SelectItem>
                          <SelectItem value="pdd">Percentage Depth Dose</SelectItem>
                          <SelectItem value="profile">Lateral Profile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Hilos (threads)</Label>
                      <Input type="number" min={1} max={64} value={state.threads} onChange={e => update({ threads: parseInt(e.target.value) || 1 })} className="h-8" />
                    </div>
                  </div>

                  <div className="p-3 bg-cyan-50 rounded-lg text-xs space-y-1">
                    <div className="font-medium text-cyan-800">Configuración {state.tool.toUpperCase()}:</div>
                    <div>• Partículas: {state.particles.toExponential(0)}</div>
                    <div>• Energía: {state.energy_MeV} MeV</div>
                    <div>• Geometría: {state.geometry}</div>
                    <div>• Material: {state.material}</div>
                    <div>• Salida: {state.outputType}</div>
                    <div>• Hilos: {state.threads}</div>
                    <div>• Estimación CPU: ~{(state.particles / 1e6 * (state.tool === 'mcnp' ? 300 : state.tool === 'geant4' ? 120 : 60) / state.threads).toFixed(0)}s</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 4: RUN */}
          {state.step === 4 && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Ejecutar Simulación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2 bg-slate-50 rounded"><strong>Herramienta:</strong> {SIM_TOOLS.find(t => t.id === state.tool)?.name}</div>
                    <div className="p-2 bg-slate-50 rounded"><strong>Equipo:</strong> {preset?.name}</div>
                    <div className="p-2 bg-slate-50 rounded"><strong>Partículas:</strong> {state.particles.toExponential(0)}</div>
                    <div className="p-2 bg-slate-50 rounded"><strong>Energía:</strong> {state.energy_MeV} MeV</div>
                    <div className="p-2 bg-slate-50 rounded"><strong>Geometría:</strong> {state.geometry}</div>
                    <div className="p-2 bg-slate-50 rounded"><strong>Hilos:</strong> {state.threads}</div>
                  </div>

                  {state.status === 'running' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-cyan-700">
                        <Activity className="w-4 h-4 animate-pulse" />
                        Simulando... {state.progress}%
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-600 transition-all" style={{ width: `${state.progress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleRunSimulation} 
                      disabled={state.status === 'running'}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {state.status === 'running' ? 'Simulando...' : 'Iniciar Simulación'}
                    </Button>
                    <Button variant="outline" onClick={handleExportMacro}>
                      <Code className="w-4 h-4 mr-2" /> Exportar Macro
                    </Button>
                  </div>

                  {state.tool === 'mcnp' && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                      <strong>MCNP:</strong> Requiere licencia LANL. Integración futura v14.x con exportación de archivos INP.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 5: RESULTS */}
          {state.step === 5 && state.results && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <Card className="bg-cyan-50"><CardContent className="p-3 text-center"><div className="text-xl font-bold">{state.results.maxDose.toExponential(1)}</div><div className="text-[10px] text-slate-600">Dosis máxima</div></CardContent></Card>
                <Card className="bg-green-50"><CardContent className="p-3 text-center"><div className="text-xl font-bold">{state.results.meanDose.toExponential(1)}</div><div className="text-[10px] text-slate-600">Dosis media</div></CardContent></Card>
                <Card className="bg-amber-50"><CardContent className="p-3 text-center"><div className="text-xl font-bold">{state.results.cpuTime_s.toFixed(0)}s</div><div className="text-[10px] text-slate-600">Tiempo CPU</div></CardContent></Card>
                <Card className="bg-purple-50"><CardContent className="p-3 text-center"><div className="text-xl font-bold">{state.results.statisticalError_percent.toFixed(2)}%</div><div className="text-[10px] text-slate-600">Error estadístico</div></CardContent></Card>
              </div>

              <Tabs defaultValue="isodose">
                <TabsList>
                  <TabsTrigger value="isodose"><Eye className="w-3 h-3 mr-1" />Isodosis</TabsTrigger>
                  <TabsTrigger value="3d"><Layers className="w-3 h-3 mr-1" />3D Dose</TabsTrigger>
                  <TabsTrigger value="heatmap"><Activity className="w-3 h-3 mr-1" />Heat Map</TabsTrigger>
                  <TabsTrigger value="data"><Database className="w-3 h-3 mr-1" />Datos</TabsTrigger>
                </TabsList>

                <TabsContent value="isodose" className="flex justify-center">
                  <div>
                    <IsodoseCanvas doseMap={state.results.doseMap} levels={state.results.isodoses} maxDose={state.results.maxDose} />
                    <div className="text-center text-[10px] text-slate-500 mt-1">Curvas isodosis — Jet colormap</div>
                  </div>
                </TabsContent>

                <TabsContent value="3d">
                  <Dose3DCanvas doseMap={state.results.doseMap} />
                  <div className="text-center text-[10px] text-slate-500 mt-1">3D Dose Mapping — Pseudo-barras</div>
                </TabsContent>

                <TabsContent value="heatmap" className="flex justify-center">
                  <div>
                    <HeatMapVisualizationMock doseMap={state.results.doseMap} maxDose={state.results.maxDose} />
                    <div className="text-center text-[10px] text-slate-500 mt-1">Heat Map 2D — Distribución de dosis</div>
                  </div>
                </TabsContent>

                <TabsContent value="data">
                  <Card>
                    <CardContent className="p-3 text-xs space-y-1">
                      <div><strong>Partículas simuladas:</strong> {state.results.particlesSimulated.toExponential(0)}</div>
                      <div><strong>Tiempo CPU:</strong> {state.results.cpuTime_s.toFixed(1)} segundos</div>
                      <div><strong>Error estadístico (1σ):</strong> {state.results.statisticalError_percent.toFixed(3)}%</div>
                      <div><strong>Dosis máxima:</strong> {state.results.maxDose.toExponential(3)} Gy</div>
                      <div><strong>Dosis mínima:</strong> {state.results.minDose.toExponential(3)} Gy</div>
                      <div><strong>Dosis media:</strong> {state.results.meanDose.toExponential(3)} Gy</div>
                      <Separator className="my-2" />
                      <div className="text-[10px] text-slate-500">
                        <strong>Nota:</strong> Esta es una simulación de demostración. Para resultados reales, 
                        ejecute el macro exportado en {state.tool.toUpperCase()} con la geometría y física completas.
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t">
        <Button size="sm" variant="outline" onClick={() => update({ step: Math.max(1, state.step - 1) })} disabled={state.step === 1 || state.status === 'running'}>
          <ChevronLeft className="w-3 h-3 mr-1" /> Anterior
        </Button>
        <span className="text-xs text-slate-500">Paso {state.step} de 5</span>
        <Button size="sm" onClick={() => state.step < 4 ? update({ step: state.step + 1 }) : handleRunSimulation()} disabled={state.status === 'running' || state.step === 5}>
          {state.step === 4 ? <><Play className="w-3 h-3 mr-1" /> Simular</> : <><ChevronRight className="w-3 h-3 mr-1" /> Siguiente</>}
        </Button>
      </div>
    </div>
  );
}

// Heat Map Mock Component
function HeatMapVisualizationMock({ doseMap, maxDose }: { doseMap: number[][]; maxDose: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const rows = doseMap.length;
    const cols = doseMap[0].length;
    const imgData = ctx.createImageData(w, h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const my = Math.floor(y * rows / h);
        const mx = Math.floor(x * cols / w);
        const dose = doseMap[my]?.[mx] || 0;
        const normalized = Math.max(0, Math.min(1, dose / maxDose));
        
        const idx = (y * w + x) * 4;
        // Heat colormap
        const r = Math.min(255, normalized * 3 * 255);
        const g = normalized < 0.33 ? normalized * 3 * 255 : normalized < 0.66 ? 255 : 255 - (normalized - 0.66) * 3 * 255;
        const b = normalized < 0.33 ? 255 - normalized * 3 * 255 : 0;
        
        imgData.data[idx] = r;
        imgData.data[idx + 1] = g;
        imgData.data[idx + 2] = b;
        imgData.data[idx + 3] = 200;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [doseMap, maxDose]);

  return <canvas ref={canvasRef} width={400} height={300} className="w-full max-w-md border rounded" />;
}
