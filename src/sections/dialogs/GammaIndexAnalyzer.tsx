/**
 * GammaIndexAnalyzer — Inspired by TopasGraphSim
 * Gamma Index analysis for QA dosimetry: PDD, profiles, 2D heatmap
 * Implements: 2mm/2%, 3mm/3% criteria, pass/fail statistics
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/useI18n';
import {
  Activity, BarChart3, Grid3X3, CheckCircle, XCircle,
  Download, RefreshCw, Info, ArrowRight
} from 'lucide-react';

interface DosePoint {
  x: number; // depth (mm) for PDD, or lateral position (mm) for profiles
  doseRef: number; // reference dose (%)
  doseEval: number; // evaluated dose (%)
}

interface GammaPoint extends DosePoint {
  gamma: number;
  pass: boolean;
}

interface GammaStats {
  passRate: number;
  meanGamma: number;
  maxGamma: number;
  minGamma: number;
  stdGamma: number;
  totalPoints: number;
  passPoints: number;
}

function generateSamplePDD(): DosePoint[] {
  const points: DosePoint[] = [];
  for (let d = 0; d <= 300; d += 2) {
    const ddRef = 100 * Math.exp(-d / 100) * (1 - 0.15 * Math.pow(d / 150, 2));
    const noise = (Math.random() - 0.5) * 1.5;
    const ddEval = ddRef + noise + (d > 100 ? (d - 100) * 0.005 : 0);
    points.push({ x: d, doseRef: Math.max(0, ddRef), doseEval: Math.max(0, ddEval) });
  }
  return points;
}

function generateSampleProfile(): DosePoint[] {
  const points: DosePoint[] = [];
  for (let p = -100; p <= 100; p += 2) {
    const ddRef = 100 * Math.exp(-Math.pow(p / 40, 2) / 2);
    const noise = (Math.random() - 0.5) * 1.0;
    const ddEval = ddRef + noise + p * 0.02;
    points.push({ x: p, doseRef: Math.max(0, ddRef), doseEval: Math.max(0, ddEval) });
  }
  return points;
}

function calculateGamma(
  points: DosePoint[],
  dtaMm: number,
  ddPct: number,
  thresholdPct: number
): GammaPoint[] {
  const maxDose = Math.max(...points.map(p => p.doseRef));
  const threshold = (thresholdPct / 100) * maxDose;

  return points.map((p, i) => {
    if (p.doseRef < threshold) return { ...p, gamma: 0, pass: true };

    let minGamma = Infinity;
    // Search within DTA window
    const dtaIdxRange = Math.ceil(dtaMm / 2);
    for (let j = Math.max(0, i - dtaIdxRange); j <= Math.min(points.length - 1, i + dtaIdxRange); j++) {
      const ref = points[j];
      const spatialDiff = Math.abs(p.x - ref.x);
      const doseDiff = Math.abs(p.doseEval - ref.doseRef);
      const gammaSq = Math.pow(spatialDiff / dtaMm, 2) + Math.pow(doseDiff / (ddPct / 100 * maxDose), 2);
      const g = Math.sqrt(gammaSq);
      if (g < minGamma) minGamma = g;
    }

    return { ...p, gamma: minGamma === Infinity ? 999 : minGamma, pass: minGamma <= 1.0 };
  });
}

function computeStats(gammaPoints: GammaPoint[]): GammaStats {
  const evaluated = gammaPoints.filter(p => p.gamma > 0);
  const passPoints = evaluated.filter(p => p.pass).length;
  const gammas = evaluated.map(p => p.gamma);
  const mean = gammas.reduce((a, b) => a + b, 0) / (gammas.length || 1);
  const max = gammas.length ? Math.max(...gammas) : 0;
  const min = gammas.length ? Math.min(...gammas) : 0;
  const std = Math.sqrt(gammas.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (gammas.length || 1));

  return {
    passRate: evaluated.length ? (passPoints / evaluated.length) * 100 : 100,
    meanGamma: mean,
    maxGamma: max,
    minGamma: min,
    stdGamma: std,
    totalPoints: evaluated.length,
    passPoints
  };
}

function GammaCanvas({
  points, mode, dtaMm, ddPct, thresholdPct
}: {
  points: DosePoint[]; mode: 'pdd' | 'profile' | 'gamma';
  dtaMm: number; ddPct: number; thresholdPct: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gammaPoints = useMemo(() => calculateGamma(points, dtaMm, ddPct, thresholdPct), [points, dtaMm, ddPct, thresholdPct]);
  const stats = useMemo(() => computeStats(gammaPoints), [gammaPoints]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, w, h);

    const padding = { top: 30, right: 30, bottom: 50, left: 60 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    const xs = points.map(p => p.x);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const xRange = xMax - xMin || 1;

    const toX = (x: number) => padding.left + ((x - xMin) / xRange) * plotW;
    const toY = (y: number) => padding.top + plotH - (y / 120) * plotH;

    if (mode === 'gamma') {
      // Gamma index heatmap visualization
      const evaluated = gammaPoints.filter(p => p.gamma > 0);
      if (evaluated.length === 0) return;

      const barW = plotW / evaluated.length;
      evaluated.forEach((p, i) => {
        const g = Math.min(p.gamma, 2);
        const r = Math.floor(Math.min(1, g) * 220 + (g > 1 ? 35 : 0));
        const gr = Math.floor(Math.max(0, 1 - g) * 200);
        const b = 40;
        ctx.fillStyle = `rgb(${r},${gr},${b})`;
        ctx.fillRect(padding.left + i * barW, padding.top, Math.max(1, barW), plotH);
      });

      // Gamma = 1 line
      const y1 = padding.top + plotH * 0.5;
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y1);
      ctx.lineTo(padding.left + plotW, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('γ = 1.0', padding.left + 5, y1 - 5);
    } else {
      // Dose curves
      // Grid
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const y = padding.top + (plotH / 10) * i;
        ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + plotW, y); ctx.stroke();
      }

      // Reference curve
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = toX(p.x);
        const y = toY(p.doseRef);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Evaluated curve
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = toX(p.x);
        const y = toY(p.doseEval);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Legend
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(padding.left + plotW - 120, padding.top + 5, 12, 3);
      ctx.fillStyle = '#374151';
      ctx.fillText('Reference', padding.left + plotW - 105, padding.top + 12);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(padding.left + plotW - 120, padding.top + 18, 12, 3);
      ctx.fillStyle = '#374151';
      ctx.fillText('Evaluated', padding.left + plotW - 105, padding.top + 25);
    }

    // Axes
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + plotH);
    ctx.lineTo(padding.left + plotW, padding.top + plotH);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const xLabel = mode === 'pdd' ? 'Depth (mm)' : 'Position (mm)';
    ctx.fillText(xLabel, padding.left + plotW / 2, h - 10);

    ctx.save();
    ctx.translate(15, padding.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(mode === 'gamma' ? 'Gamma Index' : 'Dose (%)', 0, 0);
    ctx.restore();

  }, [points, gammaPoints, mode]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {mode === 'gamma' ? (
            <Badge className={stats.passRate >= 95 ? 'bg-green-500' : stats.passRate >= 90 ? 'bg-amber-500' : 'bg-red-500'}>
              {stats.passRate >= 95 ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              {stats.passRate.toFixed(1)}% PASS
            </Badge>
          ) : (
            <Badge variant="outline" className="text-slate-600">{mode.toUpperCase()} Comparison</Badge>
          )}
          <Badge variant="outline" className="text-slate-500 text-[10px]">
            DTA {dtaMm}mm / DD {ddPct}% / Threshold {thresholdPct}%
          </Badge>
        </div>
        {mode === 'gamma' && (
          <div className="flex gap-3 text-[10px] text-slate-500">
            <span>Mean γ: <b>{stats.meanGamma.toFixed(3)}</b></span>
            <span>Max γ: <b>{stats.maxGamma.toFixed(3)}</b></span>
            <span>σ: <b>{stats.stdGamma.toFixed(3)}</b></span>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="w-full h-[300px] border rounded-lg bg-white" />
    </div>
  );
}

function generate2DGammaGrid(dtaMm: number, ddPct: number): {
  x: number; y: number; gamma: number; pass: boolean;
}[] {
  const grid: { x: number; y: number; gamma: number; pass: boolean }[] = [];
  const size = 40;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const x = (i / size) * 200 - 100;
      const y = (j / size) * 200 - 100;
      const r = Math.sqrt(x * x + y * y);
      // Simulated beam profile with perturbation
      const refDose = 100 * Math.exp(-Math.pow(r / 50, 2));
      const perturbation = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 3;
      const evalDose = refDose + perturbation;
      const doseDiff = Math.abs(evalDose - refDose);
      const spatialDiff = 0;
      const g = Math.sqrt(Math.pow(spatialDiff / dtaMm, 2) + Math.pow(doseDiff / ddPct, 2));
      grid.push({ x: i, y: j, gamma: Math.min(g, 3), pass: g <= 1.0 });
    }
  }
  return grid;
}

function Gamma2DHeatmap({ dtaMm, ddPct }: { dtaMm: number; ddPct: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grid = useMemo(() => generate2DGammaGrid(dtaMm, ddPct), [dtaMm, ddPct]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 320;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cellSize = size / 40;
    grid.forEach(cell => {
      const g = cell.gamma;
      let r: number, gr: number, b: number;
      if (g <= 1.0) {
        const t = g;
        r = Math.floor(t * 100);
        gr = Math.floor(200 + t * 55);
        b = Math.floor(t * 80);
      } else {
        const t = Math.min((g - 1.0) / 2.0, 1);
        r = Math.floor(100 + t * 155);
        gr = Math.floor(255 * (1 - t));
        b = Math.floor(80 * (1 - t));
      }
      ctx.fillStyle = `rgb(${r},${gr},${b})`;
      ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize + 0.5, cellSize + 0.5);
    });
  }, [grid]);

  const passRate = useMemo(() => {
    const total = grid.length;
    const pass = grid.filter(c => c.pass).length;
    return (pass / total) * 100;
  }, [grid]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge className={passRate >= 95 ? 'bg-green-500' : passRate >= 90 ? 'bg-amber-500' : 'bg-red-500'}>
          {passRate >= 95 ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
          {passRate.toFixed(1)}% PASS
        </Badge>
        <span className="text-[10px] text-slate-500">2D Gamma Map — {grid.length} points</span>
      </div>
      <div className="flex justify-center">
        <canvas ref={canvasRef} className="border rounded-lg" />
      </div>
      <div className="flex items-center gap-2 justify-center text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#00c853' }} /> Pass (γ≤1)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#ff9100' }} /> Marginal</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#ff1744' }} /> Fail (γ&gt;1)</span>
      </div>
    </div>
  );
}

interface GammaIndexAnalyzerProps {
  open: boolean;
  onClose: () => void;
}

export default function GammaIndexAnalyzer({ open, onClose }: GammaIndexAnalyzerProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('pdd');
  const [dtaMm, setDtaMm] = useState(3);
  const [ddPct, setDdPct] = useState(3);
  const [thresholdPct, setThresholdPct] = useState(10);
  const [pddData, setPddData] = useState<DosePoint[]>(generateSamplePDD);
  const [profileData, setProfileData] = useState<DosePoint[]>(generateSampleProfile);

  const regenerateData = () => {
    setPddData(generateSamplePDD());
    setProfileData(generateSampleProfile());
  };

  const exportCSV = () => {
    const gammaPDD = calculateGamma(pddData, dtaMm, ddPct, thresholdPct);
    let csv = 'Depth_mm,RefDose_pct,EvalDose_pct,Gamma,Pass\n';
    gammaPDD.forEach(p => {
      csv += `${p.x},${p.doseRef.toFixed(4)},${p.doseEval.toFixed(4)},${p.gamma.toFixed(4)},${p.pass ? 'PASS' : 'FAIL'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gamma_index_dta${dtaMm}_dd${ddPct}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-[#f97316]" />
            Gamma Index Analyzer
            <Badge variant="outline" className="text-[10px] ml-2">TopasGraphSim-inspired</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Parameters */}
        <div className="bg-slate-50 rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-600 font-medium">Gamma Analysis Parameters</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-[10px] text-slate-500">DTA (mm)</Label>
              <Select value={String(dtaMm)} onValueChange={v => setDtaMm(Number(v))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(v => <SelectItem key={v} value={String(v)}>{v} mm</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-slate-500">Dose Diff (%)</Label>
              <Select value={String(ddPct)} onValueChange={v => setDdPct(Number(v))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(v => <SelectItem key={v} value={String(v)}>{v}%</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-slate-500">Threshold (%)</Label>
              <Input type="number" value={thresholdPct} onChange={e => setThresholdPct(Number(e.target.value))}
                className="h-8 text-xs" min={1} max={50} />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={regenerateData}>
                <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={exportCSV}>
                <Download className="w-3 h-3 mr-1" /> CSV
              </Button>
            </div>
          </div>
          <div className="mt-2 flex gap-2 text-[10px] text-slate-500">
            <Badge variant="outline" className="text-[10px]">Common: 2mm/2% (clinical), 3mm/3% (routine)</Badge>
            <Badge variant="outline" className="text-[10px]">Low-dose threshold excludes noise regions</Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="pdd" className="flex-1 text-xs">
              <BarChart3 className="w-3 h-3 mr-1" /> PDD
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-1 text-xs">
              <ArrowRight className="w-3 h-3 mr-1" /> Lateral Profile
            </TabsTrigger>
            <TabsTrigger value="gamma1d" className="flex-1 text-xs">
              <Activity className="w-3 h-3 mr-1" /> 1D Gamma
            </TabsTrigger>
            <TabsTrigger value="gamma2d" className="flex-1 text-xs">
              <Grid3X3 className="w-3 h-3 mr-1" /> 2D Gamma Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdd" className="mt-4">
            <GammaCanvas points={pddData} mode="pdd" dtaMm={dtaMm} ddPct={ddPct} thresholdPct={thresholdPct} />
          </TabsContent>

          <TabsContent value="profile" className="mt-4">
            <GammaCanvas points={profileData} mode="profile" dtaMm={dtaMm} ddPct={ddPct} thresholdPct={thresholdPct} />
          </TabsContent>

          <TabsContent value="gamma1d" className="mt-4">
            <GammaCanvas points={pddData} mode="gamma" dtaMm={dtaMm} ddPct={ddPct} thresholdPct={thresholdPct} />
          </TabsContent>

          <TabsContent value="gamma2d" className="mt-4">
            <Gamma2DHeatmap dtaMm={dtaMm} ddPct={ddPct} />
          </TabsContent>
        </Tabs>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700">
          <b>Methodology:</b> Gamma index combines DTA (Distance-To-Agreement) and DD (Dose-Difference) criteria.
          A point passes if γ ≤ 1.0. Based on Low et al. (1998) and TG-218 recommendations.
          Pass rate ≥ 95% with 3mm/3% is typically acceptable for routine QA.
        </div>
      </DialogContent>
    </Dialog>
  );
}
