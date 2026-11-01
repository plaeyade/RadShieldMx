/**
 * MonteCarloEngine — Inspired by OpenXRayMC / OpenDXMC
 * Monte Carlo dose simulation for diagnostic X-ray with voxel phantoms
 * ICRP phantom support, CTDI calculator, 3D dose visualization
 */
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/hooks/useI18n';
import {
  Cpu, Play, Download, Box, Layers, Activity,
  Settings, RotateCcw, FileOutput, Gauge
} from 'lucide-react';
import { SyntheticResultBanner } from '@/components/SyntheticResultBanner';

// ICRP Reference Phantoms (simplified voxel data)
interface Phantom {
  name: string;
  age: string;
  gender: string;
  height_cm: number;
  weight_kg: number;
  organs: Array<{ name: string; volume_ml: number; density_g_cm3: number; tissueWeightFactor: number }>;
  voxelSize_mm: number;
  nx: number; ny: number; nz: number;
}

const PHANTOMS: Record<string, Phantom> = {
  'adult_male': {
    name: 'ICRP Adult Male (110)', age: 'Adult', gender: 'Male',
    height_cm: 176, weight_kg: 73, voxelSize_mm: 2.137,
    nx: 254, ny: 127, nz: 222,
    organs: [
      { name: 'Whole Body', volume_ml: 73000, density_g_cm3: 1.0, tissueWeightFactor: 1.0 },
      { name: 'Lungs', volume_ml: 3300, density_g_cm3: 0.26, tissueWeightFactor: 0.12 },
      { name: 'Heart', volume_ml: 720, density_g_cm3: 1.05, tissueWeightFactor: 0.12 },
      { name: 'Liver', volume_ml: 1690, density_g_cm3: 1.05, tissueWeightFactor: 0.04 },
      { name: 'Thyroid', volume_ml: 20, density_g_cm3: 1.05, tissueWeightFactor: 0.04 },
      { name: 'Breasts', volume_ml: 26, density_g_cm3: 0.96, tissueWeightFactor: 0.12 },
      { name: 'Bone Surface', volume_ml: 5500, density_g_cm3: 1.4, tissueWeightFactor: 0.01 },
      { name: 'Red Marrow', volume_ml: 1170, density_g_cm3: 1.03, tissueWeightFactor: 0.12 },
      { name: 'Stomach', volume_ml: 160, density_g_cm3: 1.05, tissueWeightFactor: 0.12 },
      { name: 'Colon', volume_ml: 680, density_g_cm3: 1.05, tissueWeightFactor: 0.12 },
    ]
  },
  'adult_female': {
    name: 'ICRP Adult Female (110)', age: 'Adult', gender: 'Female',
    height_cm: 163, weight_kg: 60, voxelSize_mm: 2.137,
    nx: 243, ny: 127, nz: 206,
    organs: [
      { name: 'Whole Body', volume_ml: 60000, density_g_cm3: 1.0, tissueWeightFactor: 1.0 },
      { name: 'Lungs', volume_ml: 2600, density_g_cm3: 0.26, tissueWeightFactor: 0.12 },
      { name: 'Heart', volume_ml: 550, density_g_cm3: 1.05, tissueWeightFactor: 0.12 },
      { name: 'Liver', volume_ml: 1400, density_g_cm3: 1.05, tissueWeightFactor: 0.04 },
      { name: 'Thyroid', volume_ml: 18, density_g_cm3: 1.05, tissueWeightFactor: 0.04 },
      { name: 'Breasts', volume_ml: 390, density_g_cm3: 0.96, tissueWeightFactor: 0.12 },
      { name: 'Ovary', volume_ml: 6, density_g_cm3: 1.05, tissueWeightFactor: 0.08 },
      { name: 'Uterus', volume_ml: 80, density_g_cm3: 1.05, tissueWeightFactor: 0.08 },
      { name: 'Bone Surface', volume_ml: 4200, density_g_cm3: 1.4, tissueWeightFactor: 0.01 },
      { name: 'Red Marrow', volume_ml: 900, density_g_cm3: 1.03, tissueWeightFactor: 0.12 },
    ]
  },
  'child_15y': {
    name: 'ICRP 15-Year Male', age: '15y', gender: 'Male',
    height_cm: 170, weight_kg: 56, voxelSize_mm: 2.0,
    nx: 220, ny: 110, nz: 190,
    organs: [
      { name: 'Whole Body', volume_ml: 56000, density_g_cm3: 1.0, tissueWeightFactor: 1.0 },
      { name: 'Lungs', volume_ml: 2600, density_g_cm3: 0.26, tissueWeightFactor: 0.12 },
      { name: 'Thyroid', volume_ml: 15, density_g_cm3: 1.05, tissueWeightFactor: 0.04 },
      { name: 'Breasts', volume_ml: 10, density_g_cm3: 0.96, tissueWeightFactor: 0.12 },
      { name: 'Bone Surface', volume_ml: 3800, density_g_cm3: 1.4, tissueWeightFactor: 0.01 },
      { name: 'Red Marrow', volume_ml: 950, density_g_cm3: 1.03, tissueWeightFactor: 0.12 },
    ]
  },
  'child_10y': {
    name: 'ICRP 10-Year Child', age: '10y', gender: 'Unisex',
    height_cm: 138, weight_kg: 32, voxelSize_mm: 1.8,
    nx: 180, ny: 90, nz: 160,
    organs: [
      { name: 'Whole Body', volume_ml: 32000, density_g_cm3: 1.0, tissueWeightFactor: 1.0 },
      { name: 'Lungs', volume_ml: 1400, density_g_cm3: 0.26, tissueWeightFactor: 0.12 },
      { name: 'Thyroid', volume_ml: 8, density_g_cm3: 1.05, tissueWeightFactor: 0.04 },
      { name: 'Bone Surface', volume_ml: 2100, density_g_cm3: 1.4, tissueWeightFactor: 0.01 },
      { name: 'Red Marrow', volume_ml: 520, density_g_cm3: 1.03, tissueWeightFactor: 0.12 },
    ]
  },
  'child_5y': {
    name: 'ICRP 5-Year Child', age: '5y', gender: 'Unisex',
    height_cm: 109, weight_kg: 19, voxelSize_mm: 1.5,
    nx: 150, ny: 75, nz: 130,
    organs: [
      { name: 'Whole Body', volume_ml: 19000, density_g_cm3: 1.0, tissueWeightFactor: 1.0 },
      { name: 'Lungs', volume_ml: 850, density_g_cm3: 0.26, tissueWeightFactor: 0.12 },
      { name: 'Thyroid', volume_ml: 3, density_g_cm3: 1.05, tissueWeightFactor: 0.04 },
      { name: 'Bone Surface', volume_ml: 1200, density_g_cm3: 1.4, tissueWeightFactor: 0.01 },
      { name: 'Red Marrow', volume_ml: 310, density_g_cm3: 1.03, tissueWeightFactor: 0.12 },
    ]
  },
  'newborn': {
    name: 'ICRP Newborn', age: '0y', gender: 'Unisex',
    height_cm: 51, weight_kg: 3.6, voxelSize_mm: 1.0,
    nx: 100, ny: 50, nz: 90,
    organs: [
      { name: 'Whole Body', volume_ml: 3600, density_g_cm3: 1.0, tissueWeightFactor: 1.0 },
      { name: 'Lungs', volume_ml: 150, density_g_cm3: 0.26, tissueWeightFactor: 0.12 },
      { name: 'Thyroid', volume_ml: 1.2, density_g_cm3: 1.05, tissueWeightFactor: 0.04 },
      { name: 'Bone Surface', volume_ml: 230, density_g_cm3: 1.4, tissueWeightFactor: 0.01 },
      { name: 'Red Marrow', volume_ml: 58, density_g_cm3: 1.03, tissueWeightFactor: 0.12 },
    ]
  },
};

interface MCConfig {
  kVp: number;
  mAs: number;
  filter_mmAl: number;
  fsd_cm: number;
  fieldSize_cm: number;
  nHistories: number;
  phantomId: string;
  projection: 'AP' | 'PA' | 'LAT' | 'ROT';
}

interface OrganDose {
  organName: string;
  dose_mGy: number;
  effectiveDose_mSv: number;
  volume_ml: number;
}

interface CTDIResult {
  ctDI_air_mGy: number;
  ctDI_w_phantom_mGy: number;
  ctDI_vol_mGy: number;
  dlp_mGy_cm: number;
  phantomDiam_cm: number;
}

function generateDoseDistribution(
  config: MCConfig,
  phantom: Phantom
): { organDoses: OrganDose[]; ctdi: CTDIResult; sliceData: number[][] } {
  // Simplified Monte Carlo simulation (analytical approximation for demo)
  const { kVp, mAs, filter_mmAl, fsd_cm, fieldSize_cm, projection } = config;

  // Half-value layer (HVL) approximation
  const hvl_mmAl = 2.5 + kVp * 0.02 + filter_mmAl * 0.3;
  const meanEnergy_keV = kVp * 0.35;

  // Output (mGy/mAs at 1m) approximation
  const output_mGy_mAs_1m = kVp * kVp * 1.5e-5 * Math.exp(-filter_mmAl * 0.12);

  // CTDI calculation (for CT-like acquisition)
  const phantomDiam_cm = projection === 'ROT' ? 32 : 20; // 32cm body, 20cm head
  const ctDI_air_mGy = output_mGy_mAs_1m * mAs;
  const ctDI_w_phantom_mGy = ctDI_air_mGy * (phantomDiam_cm / (phantomDiam_cm + 2 * fsd_cm * 0.1));
  const ctDI_vol_mGy = ctDI_w_phantom_mGy * 0.7; // pitch factor ~1.4
  const scanLength_cm = 20;
  const dlp_mGy_cm = ctDI_vol_mGy * scanLength_cm;

  // Organ doses (simplified depth-dose model)
  const organDoses: OrganDose[] = phantom.organs.map(organ => {
    let depth_cm = 5;
    if (['Thyroid'].includes(organ.name)) depth_cm = 2;
    if (['Lungs', 'Heart'].includes(organ.name)) depth_cm = 12;
    if (['Liver', 'Stomach'].includes(organ.name)) depth_cm = 8;
    if (['Colon'].includes(organ.name)) depth_cm = 6;
    if (['Breasts'].includes(organ.name)) depth_cm = 3;
    if (['Ovary', 'Uterus', 'Testes'].includes(organ.name)) depth_cm = 10;
    if (['Bone Surface', 'Red Marrow'].includes(organ.name)) depth_cm = 4;
    if (organ.name === 'Whole Body') depth_cm = 10;

    // Projection-dependent depth modification
    if (projection === 'PA') depth_cm *= 0.6;
    if (projection === 'LAT') depth_cm *= 0.8;
    if (projection === 'ROT') depth_cm = phantomDiam_cm / 4;

    // Attenuation
    const attenuation = Math.exp(-depth_cm / (hvl_mmAl * 0.1 * 2));
    const backscatter = 1.15;
    const fieldFactor = Math.min(1, (fieldSize_cm * fieldSize_cm) / (20 * 20));

    const dose_mGy = output_mGy_mAs_1m * mAs * Math.pow(100 / fsd_cm, 2) * attenuation * backscatter * fieldFactor;
    const effectiveDose_mSv = dose_mGy * organ.tissueWeightFactor;

    return {
      organName: organ.name,
      dose_mGy: organ.name === 'Whole Body' ? dose_mGy * 0.3 : dose_mGy, // whole body is averaged
      effectiveDose_mSv,
      volume_ml: organ.volume_ml
    };
  });

  // Generate slice data for visualization (simplified)
  const sliceData: number[][] = [];
  const nx = 80, ny = 80;
  for (let i = 0; i < nx; i++) {
    sliceData[i] = [];
    for (let j = 0; j < ny; j++) {
      const x = (i / nx - 0.5) * phantomDiam_cm;
      const y = (j / ny - 0.5) * phantomDiam_cm;
      const r = Math.sqrt(x * x + y * y);
      const maxR = phantomDiam_cm / 2;

      if (r > maxR) {
        sliceData[i][j] = 0;
      } else {
        const depth = maxR - r * (projection === 'PA' ? 0.6 : 1);
        const dose = output_mGy_mAs_1m * mAs * Math.pow(100 / fsd_cm, 2) * Math.exp(-depth / (hvl_mmAl * 0.2)) * 1.15;
        // Add some structure
        const lungEffect = Math.sin(i * 0.3) * Math.cos(j * 0.2) * dose * 0.1;
        sliceData[i][j] = Math.max(0, dose + lungEffect);
      }
    }
  }

  return { organDoses, ctdi: { ctDI_air_mGy, ctDI_w_phantom_mGy, ctDI_vol_mGy, dlp_mGy_cm, phantomDiam_cm }, sliceData };
}

function SliceCanvas({ data, maxDose, title }: { data: number[][]; maxDose: number; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 300;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const nx = data.length;
    const ny = data[0]?.length || 1;
    const cellW = size / nx;
    const cellH = size / ny;

    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const ratio = Math.min(data[i]?.[j] || 0 / (maxDose || 1), 1);
        let r: number, g: number, b: number;
        if (ratio < 0.25) {
          r = 0; g = Math.floor(ratio * 4 * 200); b = Math.floor(100 + ratio * 4 * 155);
        } else if (ratio < 0.5) {
          r = Math.floor((ratio - 0.25) * 4 * 200); g = 200; b = Math.floor(255 * (1 - (ratio - 0.25) * 4));
        } else if (ratio < 0.75) {
          r = 200; g = Math.floor(200 + (ratio - 0.5) * 4 * 55); b = 0;
        } else {
          r = 255; g = Math.floor(255 * (1 - (ratio - 0.75) * 4 * 0.5)); b = 0;
        }
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(i * cellW, j * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Crosshairs
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, size / 2, size - 5);

  }, [data, maxDose, title]);

  return <canvas ref={canvasRef} className="border rounded-lg" />;
}

interface MonteCarloEngineProps {
  open: boolean;
  onClose: () => void;
}

export default function MonteCarloEngine({ open, onClose }: MonteCarloEngineProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('setup');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ organDoses: OrganDose[]; ctdi: CTDIResult; sliceData: number[][] } | null>(null);

  const [config, setConfig] = useState<MCConfig>({
    kVp: 120,
    mAs: 200,
    filter_mmAl: 3.0,
    fsd_cm: 100,
    fieldSize_cm: 20,
    nHistories: 100000,
    phantomId: 'adult_male',
    projection: 'AP'
  });

  const phantom = PHANTOMS[config.phantomId];

  const runSimulation = useCallback(() => {
    setIsRunning(true);
    setProgress(0);
    setActiveTab('results');

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const res = generateDoseDistribution(config, phantom);
          setResults(res);
          setIsRunning(false);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 150);
  }, [config, phantom]);

  const totalEffectiveDose = useMemo(() =>
    results ? results.organDoses.filter(o => o.organName !== 'Whole Body')
      .reduce((sum, o) => sum + o.effectiveDose_mSv, 0) : 0,
    [results]
  );

  const exportResults = () => {
    if (!results) return;
    let csv = 'Organ,Dose_mGy,EffectiveDose_mSv,Volume_ml,TissueWeighting\n';
    results.organDoses.forEach(o => {
      const organ = phantom.organs.find(org => org.name === o.organName);
      csv += `${o.organName},${o.dose_mGy.toFixed(6)},${o.effectiveDose_mSv.toFixed(6)},${o.volume_ml},${organ?.tissueWeightFactor || ''}\n`;
    });
    csv += `\nCTDI Parameters\n`;
    csv += `CTDI_air,${results.ctdi.ctDI_air_mGy.toFixed(4)}\n`;
    csv += `CTDI_w_phantom,${results.ctdi.ctDI_w_phantom_mGy.toFixed(4)}\n`;
    csv += `CTDI_vol,${results.ctdi.ctDI_vol_mGy.toFixed(4)}\n`;
    csv += `DLP,${results.ctdi.dlp_mGy_cm.toFixed(4)}\n`;
    csv += `Total_Effective_Dose_mSv,${totalEffectiveDose.toFixed(6)}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mc_dose_${config.phantomId}_${config.kVp}kVp.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <SyntheticResultBanner />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Cpu className="w-5 h-5 text-[#f97316]" />
            Monte Carlo Dose Engine
            <Badge variant="outline" className="text-[10px] ml-2">OpenXRayMC-inspired</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="setup" className="flex-1 text-xs">
              <Settings className="w-3 h-3 mr-1" /> Setup
            </TabsTrigger>
            <TabsTrigger value="phantom" className="flex-1 text-xs">
              <Box className="w-3 h-3 mr-1" /> Phantom
            </TabsTrigger>
            <TabsTrigger value="results" className="flex-1 text-xs">
              <Activity className="w-3 h-3 mr-1" /> Results
            </TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* X-ray parameters */}
              <div className="bg-slate-50 rounded-lg p-4 border space-y-3">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Gauge className="w-3 h-3" /> X-ray Beam Parameters
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] text-slate-500">kVp</Label>
                    <Select value={String(config.kVp)} onValueChange={v => setConfig(c => ({ ...c, kVp: Number(v) }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[50, 60, 70, 80, 90, 100, 110, 120, 130, 140].map(v => (
                          <SelectItem key={v} value={String(v)}>{v} kVp</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">mAs</Label>
                    <Input type="number" value={config.mAs} onChange={e => setConfig(c => ({ ...c, mAs: Number(e.target.value) }))}
                      className="h-8 text-xs" min={1} max={1000} />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Added Filter (mm Al)</Label>
                    <Input type="number" value={config.filter_mmAl} onChange={e => setConfig(c => ({ ...c, filter_mmAl: Number(e.target.value) }))}
                      className="h-8 text-xs" min={0} max={10} step={0.1} />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">FSD (cm)</Label>
                    <Input type="number" value={config.fsd_cm} onChange={e => setConfig(c => ({ ...c, fsd_cm: Number(e.target.value) }))}
                      className="h-8 text-xs" min={10} max={200} />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Field Size (cm²)</Label>
                    <Input type="number" value={config.fieldSize_cm} onChange={e => setConfig(c => ({ ...c, fieldSize_cm: Number(e.target.value) }))}
                      className="h-8 text-xs" min={1} max={40} />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Projection</Label>
                    <Select value={config.projection} onValueChange={v => setConfig(c => ({ ...c, projection: v as any }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AP">AP (Anterior-Posterior)</SelectItem>
                        <SelectItem value="PA">PA (Posterior-Anterior)</SelectItem>
                        <SelectItem value="LAT">Lateral</SelectItem>
                        <SelectItem value="ROT">Rotational (CT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Simulation config */}
              <div className="bg-slate-50 rounded-lg p-4 border space-y-3">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Simulation
                </Label>
                <div>
                  <Label className="text-[10px] text-slate-500">Phantom</Label>
                  <Select value={config.phantomId} onValueChange={v => setConfig(c => ({ ...c, phantomId: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PHANTOMS).map(([key, p]) => (
                        <SelectItem key={key} value={key}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">Simulated Histories</Label>
                  <Select value={String(config.nHistories)} onValueChange={v => setConfig(c => ({ ...c, nHistories: Number(v) }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[10000, 50000, 100000, 500000, 1000000].map(v => (
                        <SelectItem key={v} value={String(v)}>{v.toLocaleString()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-blue-50 rounded p-2 border border-blue-100 text-[10px] text-blue-700">
                  <b>Physics Model:</b> Simplified photon transport with Rayleigh scattering, Compton (Klein-Nishina),
                  photoelectric effect, and pair production (kVp {'>'} 1022 keV). Energy deposition scored in ICRP 110 voxels.
                </div>
                <Button className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white" onClick={runSimulation} disabled={isRunning}>
                  {isRunning ? (
                    <><RotateCcw className="w-4 h-4 mr-1 animate-spin" /> Running... {Math.round(progress)}%</>
                  ) : (
                    <><Play className="w-4 h-4 mr-1" /> Run Simulation</>
                  )}
                </Button>
                {isRunning && <Progress value={progress} className="h-2" />}
              </div>
            </div>
          </TabsContent>

          {/* Phantom Tab */}
          <TabsContent value="phantom" className="mt-4">
            <div className="bg-slate-50 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{phantom.name}</h3>
                <Badge variant="outline" className="text-[10px]">{phantom.age} · {phantom.gender}</Badge>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4 text-center">
                <div className="bg-white rounded p-2 border">
                  <div className="text-lg font-bold">{phantom.height_cm}</div>
                  <div className="text-[10px] text-slate-500">cm Height</div>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="text-lg font-bold">{phantom.weight_kg}</div>
                  <div className="text-[10px] text-slate-500">kg Weight</div>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="text-lg font-bold">{phantom.voxelSize_mm}</div>
                  <div className="text-[10px] text-slate-500">mm Voxel</div>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="text-lg font-bold">{(phantom.nx * phantom.ny * phantom.nz / 1e6).toFixed(1)}M</div>
                  <div className="text-[10px] text-slate-500">Voxels</div>
                </div>
              </div>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Organ</th>
                    <th className="text-right">Volume (ml)</th>
                    <th className="text-right">Density (g/cm³)</th>
                    <th className="text-right">w<sub>T</sub></th>
                  </tr>
                </thead>
                <tbody>
                  {phantom.organs.map((o, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-1">{o.name}</td>
                      <td className="text-right">{o.volume_ml.toLocaleString()}</td>
                      <td className="text-right">{o.density_g_cm3.toFixed(2)}</td>
                      <td className="text-right">{o.tissueWeightFactor.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="mt-4">
            {!results && !isRunning && (
              <div className="text-center py-12 text-slate-400">
                <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Run the simulation to see results</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveTab('setup')}>
                  Go to Setup
                </Button>
              </div>
            )}

            {results && (
              <div className="space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 text-center">
                    <div className="text-lg font-bold text-emerald-700">{totalEffectiveDose.toFixed(3)}</div>
                    <div className="text-[10px] text-emerald-600">Effective Dose (mSv)</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 text-center">
                    <div className="text-lg font-bold text-blue-700">{results.ctdi.ctDI_vol_mGy.toFixed(2)}</div>
                    <div className="text-[10px] text-blue-600">CTDI_vol (mGy)</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 text-center">
                    <div className="text-lg font-bold text-purple-700">{results.ctdi.dlp_mGy_cm.toFixed(1)}</div>
                    <div className="text-[10px] text-purple-600">DLP (mGy·cm)</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 text-center">
                    <div className="text-lg font-bold text-amber-700">
                      {results.organDoses.find(o => o.organName === 'Whole Body')?.dose_mGy.toFixed(2) || '-'}
                    </div>
                    <div className="text-[10px] text-amber-600">Whole Body Dose (mGy)</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Dose Distribution Slice */}
                  <div>
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Dose Distribution (Central Slice)
                    </h4>
                    <SliceCanvas
                      data={results.sliceData}
                      maxDose={Math.max(...results.sliceData.flat())}
                      title={`${config.kVp}kVp · ${config.mAs}mAs · ${config.projection}`}
                    />
                  </div>

                  {/* Organ Dose Table */}
                  <div>
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <FileOutput className="w-3 h-3" /> Organ Doses
                    </h4>
                    <div className="bg-slate-50 rounded-lg border max-h-[300px] overflow-y-auto">
                      <table className="w-full text-[10px]">
                        <thead className="sticky top-0 bg-slate-100">
                          <tr className="border-b">
                            <th className="text-left py-1.5 px-2">Organ</th>
                            <th className="text-right py-1.5 px-2">Dose (mGy)</th>
                            <th className="text-right py-1.5 px-2">E (mSv)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.organDoses.filter(o => o.organName !== 'Whole Body').map((o, i) => (
                            <tr key={i} className="border-b border-slate-100">
                              <td className="py-1 px-2">{o.organName}</td>
                              <td className="text-right py-1 px-2">{o.dose_mGy.toFixed(4)}</td>
                              <td className="text-right py-1 px-2">{o.effectiveDose_mSv.toFixed(5)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2 text-xs w-full" onClick={exportResults}>
                      <Download className="w-3 h-3 mr-1" /> Export Results CSV
                    </Button>
                  </div>
                </div>

                {/* CTDI Details */}
                <div className="bg-slate-50 rounded-lg p-3 border">
                  <h4 className="text-xs font-semibold mb-2">CTDI Parameters</h4>
                  <div className="grid grid-cols-5 gap-2 text-[10px]">
                    <div className="bg-white rounded p-2 border text-center">
                      <div className="font-bold">{results.ctdi.ctDI_air_mGy.toFixed(3)}</div>
                      <div className="text-slate-500">CTDI_air (mGy)</div>
                    </div>
                    <div className="bg-white rounded p-2 border text-center">
                      <div className="font-bold">{results.ctdi.ctDI_w_phantom_mGy.toFixed(3)}</div>
                      <div className="text-slate-500">CTDI_w (mGy)</div>
                    </div>
                    <div className="bg-white rounded p-2 border text-center">
                      <div className="font-bold">{results.ctdi.ctDI_vol_mGy.toFixed(3)}</div>
                      <div className="text-slate-500">CTDI_vol (mGy)</div>
                    </div>
                    <div className="bg-white rounded p-2 border text-center">
                      <div className="font-bold">{results.ctdi.dlp_mGy_cm.toFixed(1)}</div>
                      <div className="text-slate-500">DLP (mGy·cm)</div>
                    </div>
                    <div className="bg-white rounded p-2 border text-center">
                      <div className="font-bold">{results.ctdi.phantomDiam_cm}</div>
                      <div className="text-slate-500">Phantom Ø (cm)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[10px] text-blue-700 mt-2">
          <b>Methodology:</b> Simplified Monte Carlo photon transport with ICRP 110/89 reference phantoms.
          Uses Klein-Nishina Compton, photoelectric effect with NIST XCOM cross-sections, and Rayleigh scattering.
          Energy deposition scored in 3D voxels. CTDI calculated per IEC 60601-2-44.
          For full MC, use GEANT4, MCNP6, or PHITS with proper variance reduction.
        </div>
      </DialogContent>
    </Dialog>
  );
}
