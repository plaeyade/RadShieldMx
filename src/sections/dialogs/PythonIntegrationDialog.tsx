import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Code, Play, Terminal, Cpu, Globe, AlertTriangle, Zap, BookOpen } from 'lucide-react';
import { getPyodideIndexUrl, getPyodideModuleUrl } from '@/lib/pyodideConfig';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const PYTHON_EXAMPLES = [
  {
    id: 'shielding-calc', name: 'Shielding Calculation (NCRP 151)',
    description: 'Calculate required shielding thickness using NCRP 151 methodology',
    code: `import numpy as np
import math

# NCRP 151 Shielding Calculation
def calculate_barrier_thickness(
    workload_cGy_week=1000,
    use_factor=0.25,
    occupancy_factor=1.0,
    distance_m=5.0,
    design_goal_mSv_week=0.02,
    tvl_cm=37.0  # TVL for concrete @ 6 MV
):
    \"\"\"Calculate required barrier thickness (cm) per NCRP 151.\"\"\"
    B = (design_goal_mSv_week * distance_m**2) / (workload_cGy_week * use_factor * occupancy_factor)
    n = -math.log10(B) if B > 0 else 10
    thickness = n * tvl_cm
    return {
        'transmission': B,
        'n_tvl': n,
        'thickness_cm': thickness,
        'thickness_mm': thickness * 10,
        'standard_block': math.ceil(thickness / 20)  # 20 cm standard blocks
    }

# Example: Primary barrier for LINAC 6 MV
result = calculate_barrier_thickness(
    workload_cGy_week=500,
    use_factor=0.25,
    occupancy_factor=0.2,
    distance_m=4.5,
    design_goal_mSv_week=0.02,
    tvl_cm=37.0
)

for key, value in result.items():
    print(f"{key}: {value:.4f}" if isinstance(value, float) else f"{key}: {value}")
`,
  },
  {
    id: 'dose-calc', name: 'Point Kernel Dose Calculation',
    description: 'Calculate dose at a point from a radiation source',
    code: `# Point Kernel Dose Calculation
def point_kernel_dose(activity_Bq, gamma_constant, distance_m, 
                       shield_thickness_cm=0, tvl_cm=None):
    \"\"\"Calculate air kerma rate from a point source.\"\"\"
    import math
    # Unshielded dose rate
    kerma_rate = gamma_constant * activity_Bq / (distance_m ** 2)
    
    # Apply shielding if provided
    if shield_thickness_cm and tvl_cm:
        transmission = 10 ** (-shield_thickness_cm / tvl_cm)
        kerma_rate *= transmission
    
    return kerma_rate  # Gy/h

# Co-60 source: 3.7 TBq at 5m with 80cm concrete wall
dose = point_kernel_dose(
    activity_Bq=3.7e12,
    gamma_constant=3.09e-13,  # Gy.m^2/(Bq.h) for Co-60
    distance_m=5.0,
    shield_thickness_cm=80,
    tvl_cm=21.0  # Concrete TVL for Co-60
)
print(f"Dose rate: {dose * 1e6:.2f} microSv/h")
print(f"Dose rate: {dose * 1000:.4f} mSv/h")
`,
  },
  {
    id: 'decay-calc', name: 'Radioactive Decay Calculator',
    description: 'Calculate activity over time for any radionuclide',
    code: `import math

# Radioactive Decay Calculations
def decay_activity(A0, half_life, time):
    \"\"\"Calculate remaining activity after time.\"\"\"
    return A0 * (0.5 ** (time / half_life))

def time_to_reach_activity(A0, half_life, target_A):
    \"\"\"Calculate time to reach target activity.\"\"\"
    return half_life * math.log2(A0 / target_A)

# F-18 PET radionuclide
A0 = 370e6  # 370 MBq
half_life_f18 = 109.8  # minutes

# Activity after 2, 4, 6, 8, 10 hours
print("F-18 Decay Schedule:")
print("-" * 40)
for hours in [0, 2, 4, 6, 8, 10]:
    t_min = hours * 60
    A = decay_activity(A0, half_life_f18, t_min)
    print(f"  t = {hours:2d}h: {A/1e6:6.1f} MBq ({A/A0*100:5.1f}%)")

# Time to reach 10% of initial activity
t_10pct = time_to_reach_activity(A0, half_life_f18, 0.1 * A0)
print(f"\\nTime to reach 10%: {t_10pct:.1f} min ({t_10pct/60:.1f} h)")
`,
  },
  {
    id: 'mcnp-macro', name: 'Generate MCNP6 Input',
    description: 'Generate MCNP6 input file for a shielding problem',
    code: `# MCNP6 Input File Generator
def generate_mcnp_input(
    source_energy_MeV=6.0,
    source_activity_Bq=1e12,
    shield_material='concrete',
    shield_thickness_cm=100,
    detector_distance_m=3.0
):
    \"\"\"Generate MCNP6 input for shielding calculation.\"\"\"
    
    mcnp = f\"\"\"MCNP6 Shielding Calculation
C Cell cards
1 1 -2.35 -10 20              $ Concrete shield
2 2 -0.0012 -20 30            $ Air gap  
3 0 -30                       $ Outside world
10 3 -11.35 -40 10            $ Optional lead layer

C Surface cards  
10 RPP -{shield_thickness_cm/2} {shield_thickness_cm/2} -50 50 -50 50
20 RPP -{shield_thickness_cm/2+5} {shield_thickness_cm/2+detector_distance_m*100+10} -50 50 -50 50
30 SO 200
40 RPP -{shield_thickness_cm/2-1} {shield_thickness_cm/2+1} -50 50 -50 50

C Material cards
M1  1000 0.168 8000 1.0  13000 0.108 $ Concrete (H, O, Al)
    14000 0.752 20000 0.196 26000 0.014
    6000 0.001
M2  8016 0.21 7014 0.79                    $ Air
M3  82000 1.0                              $ Lead

C Source definition
SDEF ERG={source_energy_MeV} POS=0 0 0
     PAR=2                              $ Photons
     NPS=10000000

C Tallies
F4:N 2                                 $ Flux in air cell  
E4 0.001 0.01 0.1 1.0 10.0 LOG

C Cutoffs
CUT:N J 0.001                          $ 1 keV cutoff
"\"\"\"
    return mcnp

# Generate for a typical LINAC vault
input_file = generate_mcnp_input(
    source_energy_MeV=10.0,
    shield_thickness_cm=180,
    detector_distance_m=5.5
)
print(input_file)
`,
  },
  {
    id: 'tvl-table', name: 'TVL Reference Table Generator',
    description: 'Generate TVL tables for common shielding materials and energies',
    code: `# TVL Reference Table for Shielding Materials
TVL_TABLE = {
    'concrete': {
        'Co-60': 21.0, '6 MV': 37.0, '10 MV': 41.0,
        '15 MV': 44.0, '18 MV': 45.0, '24 MV': 46.0
    },
    'lead': {
        'Co-60': 1.1, '6 MV': 1.65, '10 MV': 1.75,
        '15 MV': 1.8, '18 MV': 1.85, '24 MV': 1.9
    },
    'steel': {
        'Co-60': 3.5, '6 MV': 9.9, '10 MV': 10.5,
        '15 MV': 11.0, '18 MV': 11.2, '24 MV': 11.4
    },
    'barite_concrete': {
        'Co-60': 15.0, '6 MV': 27.0, '10 MV': 30.0,
        '15 MV': 32.0, '18 MV': 33.0, '24 MV': 34.0
    }
}

def get_tvl(material, energy):
    \"\"\"Get TVL value for a material and energy combination.\"\"\"
    if material not in TVL_TABLE:
        return None
    if energy not in TVL_TABLE[material]:
        # Interpolate between known values
        energies = sorted(TVL_TABLE[material].keys(), 
                         key=lambda x: float(x.split()[0]))
        return None  # Simplified - would need proper interpolation
    return TVL_TABLE[material][energy]

def calculate_shielding_from_tvl(n_tvl, material, energy):
    \"\"\"Calculate thickness given number of TVLs.\"\"\"
    tvl = get_tvl(material, energy)
    if tvl is None:
        return None
    return n_tvl * tvl

# Print formatted table
print(f"{'Energy':<10} {'Concrete':<12} {'Lead':<12} {'Steel':<12} {'Barite':<12}")
print("-" * 60)
for energy in ['Co-60', '6 MV', '10 MV', '15 MV', '18 MV']:
    c = TVL_TABLE['concrete'].get(energy, '-')
    p = TVL_TABLE['lead'].get(energy, '-')
    s = TVL_TABLE['steel'].get(energy, '-')
    b = TVL_TABLE['barite_concrete'].get(energy, '-')
    print(f"{energy:<10} {c:<12} {p:<12} {s:<12} {b:<12}")

# Example
thickness = calculate_shielding_from_tvl(5.5, 'concrete', '6 MV')
print(f"\\n5.5 TVL concrete @ 6 MV = {thickness:.1f} cm")
`,
  },
];

export default function PythonIntegrationDialog({ open, onOpenChange }: Props) {
  const [selectedExample, setSelectedExample] = useState(PYTHON_EXAMPLES[0]);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const pyodideRef = useRef<any>(null);

  const loadPyodide = async () => {
    try {
      const pyodideModuleUrl = getPyodideModuleUrl();
      if (!pyodideModuleUrl) {
        throw new Error('Pyodide no configurado para modo offline. Configure VITE_PYODIDE_URL o VITE_ENABLE_PYODIDE_CDN=true.');
      }

      setOutput('Loading Pyodide (WebAssembly Python)...\\nThis may take 10-20 seconds on first load.\\n');
      const { loadPyodide } = await import(/* @vite-ignore */ pyodideModuleUrl);
      const pyodide = await loadPyodide({
        indexURL: getPyodideIndexUrl(pyodideModuleUrl),
        stdout: (text: string) => setOutput(prev => prev + text + '\\n'),
      });
      pyodideRef.current = pyodide;
      setPyodideReady(true);
      setOutput(prev => prev + '✓ Pyodide loaded successfully!\\n');
      toast.success('Python (Pyodide) loaded');
    } catch (err) {
      setOutput('✗ Could not load Pyodide. This feature requires internet access.\\nYou can still copy the code and run it in your local Python environment.\\n\\nAlternative options:\\n1. Install Python locally: python3 -m pip install numpy\\n2. Use Jupyter Notebook\\n3. Use Google Colab\\n4. Use the server-side API endpoint');
      const message = err instanceof Error ? err.message : 'Could not load Pyodide.';
      setOutput(`Pyodide no disponible: ${message}\\nPuede copiar el codigo y ejecutarlo en Python local.\\n\\nOpciones:\\n1. Configure VITE_PYODIDE_URL con un bundle local de Pyodide\\n2. Active VITE_ENABLE_PYODIDE_CDN=true solo si acepta CDN\\n3. Use Python/Jupyter local o el API backend`);
      toast.error('Pyodide load failed - code available for copy');
    }
  };

  const runCode = async () => {
    if (!pyodideRef.current) { toast.error('Load Pyodide first'); return; }
    setRunning(true);
    setOutput('');
    try {
      await pyodideRef.current.loadPackage('numpy');
      await pyodideRef.current.runPythonAsync(selectedExample.code);
    } catch (err: any) {
      setOutput(prev => prev + '\\nERROR: ' + err.message + '\\n');
    }
    setRunning(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1100px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Code className="w-5 h-5 text-blue-500" />
            Python Integration — Pyodide (WebAssembly)
            <Badge variant="outline" className="text-[10px]">Run Python in Browser</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="runner" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-3 w-full shrink-0">
            <TabsTrigger value="runner" className="text-xs gap-1"><Play className="w-3.5 h-3.5" />Code Runner</TabsTrigger>
            <TabsTrigger value="about" className="text-xs gap-1"><BookOpen className="w-3.5 h-3.5" />About</TabsTrigger>
            <TabsTrigger value="examples" className="text-xs gap-1"><Code className="w-3.5 h-3.5" />All Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="runner" className="flex-1 flex flex-col min-h-0 mt-2 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <select value={selectedExample.id} onChange={e => setSelectedExample(PYTHON_EXAMPLES.find(ex => ex.id === e.target.value) || PYTHON_EXAMPLES[0])}
                className="h-8 px-2 border rounded text-xs flex-1">
                {PYTHON_EXAMPLES.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
              {!pyodideReady ? (
                <Button size="sm" className="h-8 text-xs gap-1" onClick={loadPyodide}><Cpu className="w-3 h-3" />Load Python</Button>
              ) : (
                <Button size="sm" className="h-8 text-xs gap-1" onClick={runCode} disabled={running}>
                  {running ? <Zap className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}{running ? 'Running...' : 'Run'}
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(selectedExample.code); toast.success('Code copied'); }}>Copy</Button>
            </div>
            <div className="flex gap-2 flex-1 min-h-0">
              <ScrollArea className="flex-1 border rounded bg-slate-950">
                <pre className="p-3 text-[11px] font-mono text-green-400 whitespace-pre">{selectedExample.code}</pre>
              </ScrollArea>
              <ScrollArea className="w-72 border rounded bg-slate-900">
                <pre className="p-3 text-[11px] font-mono text-blue-300 whitespace-pre-wrap">{output || '# Output will appear here...'}</pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="about" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2 text-xs">
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Cpu className="w-4 h-4" />Python in the Browser</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p>Since RadShield-MX is a TypeScript/React application, Python code <strong>cannot be embedded directly</strong> into the frontend bundle. However, several approaches enable Python functionality:</p>
                    <div className="space-y-2">
                      <div className="p-2 bg-emerald-50 rounded border border-emerald-200"><strong className="flex items-center gap-1"><Zap className="w-3 h-3" />1. Pyodide (WebAssembly) — IMPLEMENTED</strong><p className="text-[10px] mt-1">Runs Python entirely in the browser via WebAssembly. No server needed. Limited to available Pyodide packages (numpy, scipy, etc.).</p></div>
                      <div className="p-2 bg-blue-50 rounded border border-blue-200"><strong className="flex items-center gap-1"><Globe className="w-3 h-3" />2. Backend API (FastAPI/Python)</strong><p className="text-[10px] mt-1">Run Python on a server and expose REST API endpoints. Full package support. Requires backend deployment.</p></div>
                      <div className="p-2 bg-amber-50 rounded border border-amber-200"><strong className="flex items-center gap-1"><Code className="w-3 h-3" />3. Code Export (Copy-Paste)</strong><p className="text-[10px] mt-1">Generate Python scripts for local execution. User copies and runs in their Python environment with full package access.</p></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Current Implementation</CardTitle></CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p>• <strong>Pyodide v0.25.0</strong> loaded from CDN on demand</p>
                    <p>• <strong>numpy</strong> available for numerical computations</p>
                    <p>• <strong>5 pre-loaded examples</strong> for common shielding calculations</p>
                    <p>• <strong>Code export</strong> for local Python execution</p>
                    <p>• <strong>MCNP6/Geant4/FLUKA</strong> macro generation already in Multi-Source dialog</p>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="examples" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 gap-2 pr-2">
                {PYTHON_EXAMPLES.map(ex => (
                  <Card key={ex.id} className={`cursor-pointer hover:shadow-md transition-shadow ${selectedExample.id === ex.id ? 'border-blue-400' : ''}`} onClick={() => setSelectedExample(ex)}>
                    <CardHeader className="pb-2"><CardTitle className="text-xs">{ex.name}</CardTitle></CardHeader>
                    <CardContent><p className="text-[10px] text-muted-foreground">{ex.description}</p></CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
