/**
 * NuclearDoseGrid — Inspired by pyshield (heydude1337/pyshield)
 * Dose calculation on configurable grid for PET/SPECT shielding
 * Radionuclides: F-18, Ga-68, Tc-99m, I-131, Y-90, Lu-177
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { RADIONUCLIDOS_MALLA as RADIONUCLIDES, calculateDoseAtPoint, type ShieldingBarrier } from '@/lib/mallaNuclear';
import {
  Grid3X3, Download, Activity, Map, BarChart3,
  CheckCircle, AlertTriangle, Info
} from 'lucide-react';

// Fase 8a: los datos de nucleidos y el cálculo por punto están en `lib/mallaNuclear` (Γ por MBq y transmisión de
// banda ancha de TG-108 a 511 keV). Antes Γ por MBq se multiplicaba por la actividad en GBq (1000× bajo) y la
// atenuación era «espesor_mm/10 TVL» o un número de TVL fijo (3 mm de Pb = 3 TVL a 511 keV, cuando B ≈ 0.8).
interface GridPoint {
  x: number; // m
  y: number; // m
  doseRate_uSv_h: number;
  cumulativeDose_uSv: number;
  distance_m: number;
}

function generateGrid(
  nx: number, ny: number,
  xMin: number, xMax: number, yMin: number, yMax: number,
  sources: Array<{ x: number; y: number; activity_GBq: number; nuclide: string; useTime_h: number }>,
  barriers: ShieldingBarrier[]
): GridPoint[] {
  const points: GridPoint[] = [];
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const x = xMin + (i / (nx - 1)) * (xMax - xMin);
      const y = yMin + (j / (ny - 1)) * (yMax - yMin);
      const { doseRate, cumulative } = calculateDoseAtPoint(x, y, sources, barriers);
      const centerDist = Math.sqrt(x * x + y * y);
      points.push({ x, y, doseRate_uSv_h: doseRate, cumulativeDose_uSv: cumulative, distance_m: centerDist });
    }
  }
  return points;
}

function DoseGridCanvas({ points, nx, ny, maxDose, showIsodoses }: {
  points: GridPoint[]; nx: number; ny: number; maxDose: number; showIsodoses: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 400;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cellW = size / nx;
    const cellH = size / ny;

    // Draw heatmap cells
    points.forEach(p => {
      const ix = Math.round((p.x + 3) / 6 * (nx - 1));
      const iy = Math.round((p.y + 3) / 6 * (ny - 1));
      const ratio = Math.min(p.doseRate_uSv_h / (maxDose || 1), 1);

      // Color scale: dark blue -> cyan -> green -> yellow -> red
      let r: number, g: number, b: number;
      if (ratio < 0.25) {
        const t = ratio / 0.25;
        r = 0; g = Math.floor(t * 150); b = Math.floor(100 + t * 155);
      } else if (ratio < 0.5) {
        const t = (ratio - 0.25) / 0.25;
        r = 0; g = Math.floor(150 + t * 105); b = Math.floor(255 * (1 - t));
      } else if (ratio < 0.75) {
        const t = (ratio - 0.5) / 0.25;
        r = Math.floor(t * 255); g = 255; b = 0;
      } else {
        const t = (ratio - 0.75) / 0.25;
        r = 255; g = Math.floor(255 * (1 - t * 0.5)); b = 0;
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(ix * cellW, (ny - 1 - iy) * cellH, cellW + 0.5, cellH + 0.5);
    });

    // Isodose lines
    if (showIsodoses) {
      const levels = [0.1, 0.25, 0.5, 0.75];
      ctx.lineWidth = 1.5;
      levels.forEach(level => {
        const threshold = level * maxDose;
        ctx.strokeStyle = level === 0.5 ? '#000' : `rgba(0,0,0,${0.3 + level * 0.4})`;
        ctx.setLineDash(level === 0.5 ? [] : [3, 3]);

        for (let i = 0; i < nx - 1; i++) {
          for (let j = 0; j < ny - 1; j++) {
            const p00 = points[i * ny + j]?.doseRate_uSv_h || 0;
            const p10 = points[(i + 1) * ny + j]?.doseRate_uSv_h || 0;
            const p01 = points[i * ny + (j + 1)]?.doseRate_uSv_h || 0;
            const p11 = points[(i + 1) * ny + (j + 1)]?.doseRate_uSv_h || 0;

            const avg = (p00 + p10 + p01 + p11) / 4;
            if (Math.abs(avg - threshold) < threshold * 0.15) {
              const cx = i * cellW + cellW / 2;
              const cy = (ny - 1 - j) * cellH + cellH / 2;
              ctx.beginPath();
              ctx.arc(cx, cy, cellW * 0.4, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }
        ctx.setLineDash([]);
      });
    }

    // Draw source positions
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    const sx = (0 + 3) / 6 * size;
    const sy = (ny - 1 - Math.round((0 + 3) / 6 * (ny - 1))) * cellH;
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SOURCE', sx, sy - 10);

  }, [points, nx, ny, maxDose, showIsodoses]);

  return <canvas ref={canvasRef} className="border rounded-lg" />;
}

interface NuclearDoseGridProps {
  open: boolean;
  onClose: () => void;
}

export default function NuclearDoseGrid({ open, onClose }: NuclearDoseGridProps) {
  const [nuclide, setNuclide] = useState('F-18');
  const [activity_GBq, setActivity] = useState(5);
  const [useTime_h, setUseTime] = useState(2);
  const [gridSize, setGridSize] = useState(30);
  const [showIsodoses, setShowIsodoses] = useState(true);
  const [activeTab, setActiveTab] = useState('grid');
  const [barriers] = useState<ShieldingBarrier[]>([
    { name: 'Blindaje de plomo', material: 'Pb', thickness_mm: 3, position_x: 1.5 },
  ]);

  const sources = useMemo(() => [{
    x: 0, y: 0, activity_GBq, nuclide, useTime_h
  }], [activity_GBq, nuclide, useTime_h]);

  const gridPoints = useMemo(() =>
    generateGrid(gridSize, gridSize, -3, 3, -3, 3, sources, barriers),
    [gridSize, sources, barriers]
  );

  const maxDose = useMemo(() =>
    Math.max(...gridPoints.map(p => p.doseRate_uSv_h), 0.001),
    [gridPoints]
  );

  const stats = useMemo(() => {
    const doses = gridPoints.map(p => p.doseRate_uSv_h);
    const sorted = [...doses].sort((a, b) => a - b);
    const max = sorted[sorted.length - 1];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const mean = doses.reduce((a, b) => a + b, 0) / doses.length;
    const exceeds20 = gridPoints.filter(p => p.doseRate_uSv_h > 20).length;
    const exceeds7_5 = gridPoints.filter(p => p.doseRate_uSv_h > 7.5).length;
    return { max, p95, mean, exceeds20, exceeds7_5, total: gridPoints.length };
  }, [gridPoints]);

  const exportCSV = () => {
    let csv = 'X_m,Y_m,DoseRate_uSv_h,CumulativeDose_uSv,Distance_m\n';
    gridPoints.forEach(p => {
      csv += `${p.x.toFixed(3)},${p.y.toFixed(3)},${p.doseRate_uSv_h.toFixed(6)},${p.cumulativeDose_uSv.toFixed(6)},${p.distance_m.toFixed(3)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nuclear_dose_grid_${nuclide}_${activity_GBq}GBq.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const nucData = RADIONUCLIDES[nuclide];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Grid3X3 className="w-5 h-5 text-[#f97316]" />
            Nuclear Medicine Dose Grid Calculator
            <Badge variant="outline" className="text-[10px] ml-2">pyshield-inspired</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-4">
          {/* Left: Parameters */}
          <div className="col-span-4 space-y-4">
            {/* Radionuclide */}
            <div className="bg-slate-50 rounded-lg p-3 border space-y-3">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Radionuclide & Activity
              </Label>
              <Select value={nuclide} onValueChange={setNuclide}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RADIONUCLIDES).map(([key, n]) => (
                    <SelectItem key={key} value={key}>{key} — {n.name} (T½={n.halfLife_h}h)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-slate-500">Activity (GBq)</Label>
                  <Input type="number" value={activity_GBq} onChange={e => setActivity(Number(e.target.value))}
                    className="h-8 text-xs" min={0.1} step={0.1} />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">Use Time (h)</Label>
                  <Input type="number" value={useTime_h} onChange={e => setUseTime(Number(e.target.value))}
                    className="h-8 text-xs" min={0.1} step={0.1} />
                </div>
              </div>
              {nucData && (
                <div className="text-[10px] text-slate-500 space-y-0.5 bg-white rounded p-2 border">
                  <div>Γ = {nucData.gammaConstant_uSv_m2_per_MBq_h} μSv·m²/(MBq·h)</div>
                  <div>T½ = {nucData.halfLife_h} h</div>
                  {nucData.betaPlus_frac > 0 && <div>β⁺ = {(nucData.betaPlus_frac * 100).toFixed(1)}%</div>}
                  <div>γ lines: {nucData.gammaKeV.map((e, i) => `${e}keV (${(nucData.gammaIntensity[i] * 100).toFixed(1)}%)`).join(', ') || 'None (pure beta)'}</div>
                </div>
              )}
            </div>

            {/* Grid Settings */}
            <div className="bg-slate-50 rounded-lg p-3 border space-y-3">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Map className="w-3 h-3" /> Grid Configuration
              </Label>
              <div>
                <Label className="text-[10px] text-slate-500">Grid Resolution</Label>
                <Select value={String(gridSize)} onValueChange={v => setGridSize(Number(v))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[20, 30, 40, 50, 60].map(v => <SelectItem key={v} value={String(v)}>{v}×{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Area: 6m × 6m (centered on source)</Label>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-slate-500">Show Isodose Lines</Label>
                <Switch checked={showIsodoses} onCheckedChange={setShowIsodoses} />
              </div>
            </div>

            {/* Barriers */}
            <div className="bg-slate-50 rounded-lg p-3 border space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Shielding Barriers</Label>
              {barriers.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] bg-white rounded p-2 border">
                  <div className="flex-1">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-slate-500">{b.material} {b.thickness_mm}mm @ x={b.position_x}m</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs flex-1" onClick={exportCSV}>
                <Download className="w-3 h-3 mr-1" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Right: Visualization */}
          <div className="col-span-8 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="grid" className="flex-1 text-xs">
                  <Grid3X3 className="w-3 h-3 mr-1" /> Dose Grid Map
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex-1 text-xs">
                  <BarChart3 className="w-3 h-3 mr-1" /> Statistics
                </TabsTrigger>
                <TabsTrigger value="info" className="flex-1 text-xs">
                  <Info className="w-3 h-3 mr-1" /> Methodology
                </TabsTrigger>
              </TabsList>

              <TabsContent value="grid" className="mt-4">
                <div className="flex flex-col items-center gap-3">
                  <DoseGridCanvas
                    points={gridPoints}
                    nx={gridSize}
                    ny={gridSize}
                    maxDose={maxDose}
                    showIsodoses={showIsodoses}
                  />
                  {/* Color bar */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span>0</span>
                    <div className="w-48 h-3 rounded" style={{
                      background: 'linear-gradient(to right, rgb(0,0,100), rgb(0,150,255), rgb(0,255,255), rgb(0,255,150), rgb(255,255,0), rgb(255,128,0), rgb(255,0,0))'
                    }} />
                    <span>{maxDose.toFixed(1)} μSv/h</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3 border text-center">
                    <div className="text-2xl font-bold text-slate-800">{stats.max.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">Max Dose Rate (μSv/h)</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border text-center">
                    <div className="text-2xl font-bold text-slate-800">{stats.p95.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">95th Percentile (μSv/h)</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border text-center">
                    <div className="text-2xl font-bold text-slate-800">{stats.mean.toFixed(3)}</div>
                    <div className="text-[10px] text-slate-500">Mean Dose Rate (μSv/h)</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border text-center">
                    <div className="text-2xl font-bold text-slate-800">{gridSize * gridSize}</div>
                    <div className="text-[10px] text-slate-500">Total Grid Points</div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between bg-red-50 rounded p-2 border border-red-100">
                    <span className="text-xs text-red-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Points exceeding 20 μSv/h (controlled area)
                    </span>
                    <Badge variant="destructive">{stats.exceeds20} / {stats.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between bg-amber-50 rounded p-2 border border-amber-100">
                    <span className="text-xs text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Points exceeding 7.5 μSv/wk (public limit)
                    </span>
                    <Badge className="bg-amber-500">{stats.exceeds7_5} / {stats.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between bg-green-50 rounded p-2 border border-green-100">
                    <span className="text-xs text-green-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Points below public limit
                    </span>
                    <Badge className="bg-green-500">{stats.total - stats.exceeds7_5} / {stats.total}</Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="info" className="mt-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3 text-[11px] text-blue-800">
                  <p><b>Point Source Model:</b> Dose rate at distance d from a point source of activity A (GBq):
                    H = Γ × A / d², where Γ is the specific gamma constant (μSv·m²/GBq·h).</p>
                  <p><b>Barriers:</b> Attenuation through shielding is modeled using tenth-value layers (TVL):
                    H_shielded = H_unshielded × 10^(-n_TVL).</p>
                  <p><b>Cumulative Dose:</b> Total dose = Dose Rate × Exposure Time, assuming constant occupancy during the procedure.</p>
                  <p><b>Reference Limits (Mexico CNSNS):</b></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Controlled area: 20 μSv/h (instantaneous)</li>
                    <li>Public area: 7.5 μSv/week (0.375 mSv/yr ÷ 50 weeks)</li>
                    <li>Worker: 100 mSv/5-year averaging (20 mSv/yr)</li>
                  </ul>
                  <p className="text-slate-500 mt-2">Based on pyshield methodology (heydude1337/pyshield) with NCRP 147/151 dose constraints.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
