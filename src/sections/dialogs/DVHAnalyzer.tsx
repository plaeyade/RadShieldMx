/**
 * DVHAnalyzer — Inspired by matRad
 * Dose-Volume Histogram calculator with interactive chart
 * Supports: D95, D50, D2, V20, HI, CI metrics
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3, Download, Activity, TrendingUp, Target
} from 'lucide-react';
import { SyntheticResultBanner } from '@/components/SyntheticResultBanner';

interface DVHData {
  structureName: string;
  structureColor: string;
  prescribedDose_Gy: number;
  isTarget: boolean;
  // Cumulative DVH: for each dose level, volume % receiving >= that dose
  doses_Gy: number[];
  volumes_pct: number[];
}

interface DVHMetrics {
  d95_Gy: number;
  d50_Gy: number;
  d2_Gy: number;
  d98_Gy: number;
  dmean_Gy: number;
  dmin_Gy: number;
  dmax_Gy: number;
  v20_pct: number;
  v50_pct: number;
  v95_pct: number;
  homogeneityIndex: number; // (D2 - D98) / D50
  conformityIndex: number; // PIV / TV
}

function erfApprox(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * absX);
  const polynomial =
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const y = 1 - polynomial * Math.exp(-absX * absX);
  return sign * y;
}

function generateSampleDVH(
  structureName: string,
  prescribedDose_Gy: number,
  isTarget: boolean,
  volume_cc: number,
  color: string
): DVHData {
  const nBins = 200;
  const doses_Gy: number[] = [];
  const volumes_pct: number[] = [];

  if (isTarget) {
    // Target: sharp falloff around prescribed dose
    const sigma = prescribedDose_Gy * 0.04;
    for (let i = 0; i <= nBins; i++) {
      const d = (i / nBins) * prescribedDose_Gy * 1.3;
      doses_Gy.push(d);
      // Error function-like falloff
      const vol = 100 * (0.5 + 0.5 * erfApprox((prescribedDose_Gy - d) / (sigma * Math.sqrt(2))));
      // Add some noise for realism
      const noise = (Math.random() - 0.5) * 0.5;
      volumes_pct.push(Math.max(0, Math.min(100, vol + noise)));
    }
  } else {
    // OAR: gradual falloff
    const maxDose = prescribedDose_Gy * (structureName.includes('Cord') ? 0.45 : structureName.includes('Lung') ? 0.3 : 0.6);
    for (let i = 0; i <= nBins; i++) {
      const d = (i / nBins) * prescribedDose_Gy * 1.2;
      doses_Gy.push(d);
      if (d < maxDose * 0.3) {
        volumes_pct.push(100);
      } else {
        const vol = 100 * Math.exp(-(d - maxDose * 0.3) / (maxDose * 0.4));
        volumes_pct.push(Math.max(0, vol));
      }
    }
  }

  return { structureName, structureColor: color, prescribedDose_Gy, isTarget, doses_Gy, volumes_pct };
}

function computeMetrics(dvh: DVHData): DVHMetrics {
  const { doses_Gy, volumes_pct } = dvh;

  const interpolateDose = (targetVol: number): number => {
    for (let i = 0; i < volumes_pct.length - 1; i++) {
      if ((volumes_pct[i] >= targetVol && volumes_pct[i + 1] <= targetVol) ||
          (volumes_pct[i] <= targetVol && volumes_pct[i + 1] >= targetVol)) {
        const t = (targetVol - volumes_pct[i]) / (volumes_pct[i + 1] - volumes_pct[i]);
        return doses_Gy[i] + t * (doses_Gy[i + 1] - doses_Gy[i]);
      }
    }
    return doses_Gy[doses_Gy.length - 1] || 0;
  };

  const interpolateVolume = (targetDose: number): number => {
    for (let i = 0; i < doses_Gy.length - 1; i++) {
      if ((doses_Gy[i] <= targetDose && doses_Gy[i + 1] >= targetDose) ||
          (doses_Gy[i] >= targetDose && doses_Gy[i + 1] <= targetDose)) {
        const t = (targetDose - doses_Gy[i]) / (doses_Gy[i + 1] - doses_Gy[i]);
        return volumes_pct[i] + t * (volumes_pct[i + 1] - volumes_pct[i]);
      }
    }
    return 0;
  };

  const d95 = interpolateDose(95);
  const d50 = interpolateDose(50);
  const d2 = interpolateDose(2);
  const d98 = interpolateDose(98);
  const dmean = doses_Gy.reduce((a, b, i) => a + b * (volumes_pct[i] || 0), 0) / (volumes_pct.reduce((a, b) => a + b, 0) || 1);
  const dmin = Math.min(...doses_Gy.filter((_, i) => volumes_pct[i] > 0));
  const dmax = doses_Gy[volumes_pct.findIndex(v => v > 0) !== -1 ? doses_Gy.length - 1 - [...volumes_pct].reverse().findIndex(v => v > 0) : 0] || 0;

  const v20 = interpolateVolume(20);
  const v50 = interpolateVolume(50);
  const v95 = interpolateVolume(95);

  const hi = d50 > 0 ? (d2 - d98) / d50 : 0;
  const ci = v95 > 0 ? 95 / v95 : 0; // simplified CI

  return { d95_Gy: d95, d50_Gy: d50, d2_Gy: d2, d98_Gy: d98, dmean_Gy: dmean, dmin_Gy: dmin, dmax_Gy: dmax, v20_pct: v20, v50_pct: v50, v95_pct: v95, homogeneityIndex: hi, conformityIndex: ci };
}

function DVHCanvas({ dvhs, showDifferential }: { dvhs: DVHData[]; showDifferential: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const padding = { top: 25, right: 30, bottom: 50, left: 60 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    // Background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (plotW / 10) * i;
      const y = padding.top + (plotH / 10) * i;
      ctx.beginPath(); ctx.moveTo(x, padding.top); ctx.lineTo(x, padding.top + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + plotW, y); ctx.stroke();
    }

    // Max dose for scaling
    const maxDose = Math.max(...dvhs.map(d => Math.max(...d.doses_Gy)), 1);
    const maxVol = 100;

    const toX = (d: number) => padding.left + (d / (maxDose * 1.1)) * plotW;
    const toY = (v: number) => padding.top + plotH - (v / maxVol) * plotH;

    if (showDifferential) {
      // Differential DVH
      dvhs.forEach(dvh => {
        ctx.fillStyle = dvh.structureColor + '40';
        ctx.strokeStyle = dvh.structureColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        for (let i = 0; i < dvh.doses_Gy.length - 1; i++) {
          const dv = Math.abs(dvh.volumes_pct[i + 1] - dvh.volumes_pct[i]);
          const x = toX(dvh.doses_Gy[i]);
          const y = toY(dv * 5); // scale for visibility
          if (i === 0) ctx.moveTo(x, padding.top + plotH);
          ctx.lineTo(x, padding.top + plotH - y + padding.top);
        }
        ctx.lineTo(toX(dvh.doses_Gy[dvh.doses_Gy.length - 1]), padding.top + plotH);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    } else {
      // Cumulative DVH
      dvhs.forEach(dvh => {
        ctx.strokeStyle = dvh.structureColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        dvh.doses_Gy.forEach((d, i) => {
          const x = toX(d);
          const y = toY(dvh.volumes_pct[i]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });
    }

    // Prescribed dose line (for first target)
    const target = dvhs.find(d => d.isTarget);
    if (target) {
      const px = toX(target.prescribedDose_Gy);
      ctx.strokeStyle = '#f97316';
      ctx.setLineDash([6, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, padding.top);
      ctx.lineTo(px, padding.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`${target.prescribedDose_Gy} Gy (Rx)`, px + 3, padding.top + 12);
    }

    // Axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + plotH);
    ctx.lineTo(padding.left + plotW, padding.top + plotH);
    ctx.stroke();

    // Tick labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i++) {
      const dose = (maxDose * 1.1 / 10) * i;
      const x = padding.left + (plotW / 10) * i;
      ctx.fillText(dose.toFixed(0), x, padding.top + plotH + 15);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
      const vol = 10 * i;
      const y = padding.top + plotH - (plotH / 10) * i;
      ctx.fillText(`${vol}%`, padding.left - 5, y + 3);
    }

    // Axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Dose (Gy)', padding.left + plotW / 2, h - 5);
    ctx.save();
    ctx.translate(12, padding.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(showDifferential ? 'dV/dD (a.u.)' : 'Volume (%)', 0, 0);
    ctx.restore();

    // Legend
    ctx.textAlign = 'left';
    dvhs.forEach((dvh, i) => {
      const lx = padding.left + plotW - 100;
      const ly = padding.top + 10 + i * 14;
      ctx.strokeStyle = dvh.structureColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + 15, ly);
      ctx.stroke();
      ctx.fillStyle = '#374151';
      ctx.font = '9px sans-serif';
      ctx.fillText(dvh.structureName, lx + 18, ly + 3);
    });

  }, [dvhs, showDifferential]);

  return <canvas ref={canvasRef} className="w-full h-[380px] border rounded-lg bg-white" />;
}

interface DVHAnalyzerProps {
  open: boolean;
  onClose: () => void;
}

export default function DVHAnalyzer({ open, onClose }: DVHAnalyzerProps) {
  const [activeTab, setActiveTab] = useState('cumulative');
  const [prescribedDose, setPrescribedDose] = useState(60);
  const [selectedPlan, setSelectedPlan] = useState('prostate-imrt');

  const plans: Record<string, { structures: Array<{ name: string; isTarget: boolean; volume_cc: number; color: string }> }> = {
    'prostate-imrt': {
      structures: [
        { name: 'PTV-70', isTarget: true, volume_cc: 85, color: '#ef4444' },
        { name: 'PTV-60', isTarget: true, volume_cc: 152, color: '#f97316' },
        { name: 'Bladder', isTarget: false, volume_cc: 280, color: '#3b82f6' },
        { name: 'Rectum', isTarget: false, volume_cc: 65, color: '#22c55e' },
        { name: 'Femoral Heads', isTarget: false, volume_cc: 120, color: '#a855f7' },
      ]
    },
    'lung-sbrt': {
      structures: [
        { name: 'GTV', isTarget: true, volume_cc: 25, color: '#ef4444' },
        { name: 'ITV', isTarget: true, volume_cc: 45, color: '#f97316' },
        { name: 'Lungs-Total', isTarget: false, volume_cc: 4200, color: '#22c55e' },
        { name: 'Spinal Cord', isTarget: false, volume_cc: 28, color: '#a855f7' },
        { name: 'Esophagus', isTarget: false, volume_cc: 35, color: '#eab308' },
        { name: 'Heart', isTarget: false, volume_cc: 580, color: '#ec4899' },
      ]
    },
    'hn-imrt': {
      structures: [
        { name: 'PTV-70', isTarget: true, volume_cc: 320, color: '#ef4444' },
        { name: 'PTV-60', isTarget: true, volume_cc: 520, color: '#f97316' },
        { name: 'PTV-54', isTarget: true, volume_cc: 850, color: '#eab308' },
        { name: 'Parotid-L', isTarget: false, volume_cc: 28, color: '#3b82f6' },
        { name: 'Parotid-R', isTarget: false, volume_cc: 26, color: '#22c55e' },
        { name: 'Spinal Cord', isTarget: false, volume_cc: 25, color: '#a855f7' },
        { name: 'Brainstem', isTarget: false, volume_cc: 18, color: '#ec4899' },
      ]
    },
  };

  const currentPlan = plans[selectedPlan];

  const dvhs = useMemo(() =>
    currentPlan.structures.map(s =>
      generateSampleDVH(s.name, prescribedDose, s.isTarget, s.volume_cc, s.color)
    ),
    [currentPlan, prescribedDose]
  );

  const metrics = useMemo(() =>
    dvhs.map(dvh => ({ structure: dvh.structureName, color: dvh.structureColor, metrics: computeMetrics(dvh) })),
    [dvhs]
  );

  const exportCSV = () => {
    let csv = 'Structure,D95_Gy,D50_Gy,D2_Gy,D98_Gy,Dmean_Gy,V20_pct,V50_pct,HI,CI\n';
    metrics.forEach(m => {
      csv += `${m.structure},${m.metrics.d95_Gy.toFixed(3)},${m.metrics.d50_Gy.toFixed(3)},${m.metrics.d2_Gy.toFixed(3)},${m.metrics.d98_Gy.toFixed(3)},${m.metrics.dmean_Gy.toFixed(3)},${m.metrics.v20_pct.toFixed(2)},${m.metrics.v50_pct.toFixed(2)},${m.metrics.homogeneityIndex.toFixed(3)},${m.metrics.conformityIndex.toFixed(3)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dvh_metrics_${selectedPlan}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <SyntheticResultBanner />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-[#f97316]" />
            DVH Analyzer
            <Badge variant="outline" className="text-[10px] ml-2">matRad-inspired</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="bg-slate-50 rounded-lg p-3 border flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-400" />
            <Label className="text-xs">Plan:</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="h-8 text-xs w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="prostate-imrt">Prostate IMRT (70/60 Gy)</SelectItem>
                <SelectItem value="lung-sbrt">Lung SBRT (54 Gy/3fx)</SelectItem>
                <SelectItem value="hn-imrt">Head & Neck IMRT (70/60/54 Gy)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Rx Dose:</Label>
            <Input type="number" value={prescribedDose} onChange={e => setPrescribedDose(Number(e.target.value))}
              className="h-8 text-xs w-20" min={1} max={100} />
            <span className="text-xs text-slate-500">Gy</span>
          </div>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="text-xs" onClick={exportCSV}>
            <Download className="w-3 h-3 mr-1" /> Export
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="cumulative" className="flex-1 text-xs">
              <BarChart3 className="w-3 h-3 mr-1" /> Cumulative DVH
            </TabsTrigger>
            <TabsTrigger value="differential" className="flex-1 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" /> Differential DVH
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex-1 text-xs">
              <Activity className="w-3 h-3 mr-1" /> Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cumulative" className="mt-4">
            <DVHCanvas dvhs={dvhs} showDifferential={false} />
          </TabsContent>

          <TabsContent value="differential" className="mt-4">
            <DVHCanvas dvhs={dvhs} showDifferential={true} />
          </TabsContent>

          <TabsContent value="metrics" className="mt-4">
            <div className="space-y-3">
              {metrics.map((m, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                    <span className="text-xs font-semibold">{m.structure}</span>
                    {currentPlan.structures[i]?.isTarget && (
                      <Badge className="bg-red-500 text-[9px]">TARGET</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-9 gap-2 text-center text-[10px]">
                    <div className="bg-white rounded p-1 border">
                      <div className="font-bold text-slate-700">{m.metrics.d95_Gy.toFixed(2)}</div>
                      <div className="text-slate-500">D95 (Gy)</div>
                    </div>
                    <div className="bg-white rounded p-1 border">
                      <div className="font-bold text-slate-700">{m.metrics.d50_Gy.toFixed(2)}</div>
                      <div className="text-slate-500">D50 (Gy)</div>
                    </div>
                    <div className="bg-white rounded p-1 border">
                      <div className="font-bold text-slate-700">{m.metrics.d2_Gy.toFixed(2)}</div>
                      <div className="text-slate-500">D2 (Gy)</div>
                    </div>
                    <div className="bg-white rounded p-1 border">
                      <div className="font-bold text-slate-700">{m.metrics.d98_Gy.toFixed(2)}</div>
                      <div className="text-slate-500">D98 (Gy)</div>
                    </div>
                    <div className="bg-white rounded p-1 border">
                      <div className="font-bold text-slate-700">{m.metrics.dmean_Gy.toFixed(2)}</div>
                      <div className="text-slate-500">Dmean (Gy)</div>
                    </div>
                    <div className="bg-white rounded p-1 border">
                      <div className="font-bold text-slate-700">{m.metrics.v20_pct.toFixed(1)}%</div>
                      <div className="text-slate-500">V20</div>
                    </div>
                    <div className="bg-white rounded p-1 border">
                      <div className="font-bold text-slate-700">{m.metrics.homogeneityIndex.toFixed(3)}</div>
                      <div className="text-slate-500">HI</div>
                    </div>
                    <div className="bg-white rounded p-1 border">
                      <div className="font-bold text-slate-700">{m.metrics.conformityIndex.toFixed(3)}</div>
                      <div className="text-slate-500">CI</div>
                    </div>
                    <div className="bg-white rounded p-1 border">
                      <div className="font-bold text-slate-700">{m.metrics.dmax_Gy.toFixed(2)}</div>
                      <div className="text-slate-500">Dmax</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700">
          <b>Methodology:</b> Dose-Volume Histogram (DVH) is the standard tool for evaluating treatment plan quality.
          <b> HI</b> = (D2% - D98%) / D50% — measures dose uniformity (lower is better, {'<'}0.1 ideal).
          <b> CI</b> = PIV / TV — measures conformality (closer to 1 is better).
          Sample plans are generated with realistic dose gradients. For clinical use, import DVH from your TPS.
          Based on ICRU 83 and 91 recommendations.
        </div>
      </DialogContent>
    </Dialog>
  );
}
