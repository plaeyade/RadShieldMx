import { useState, useRef, useEffect } from 'react';
import { X, FileBarChart, Download, Printer, Eye, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AirKermaPoint {
  x: number; // along barrier (m)
  kerma: number; // unshielded air kerma (mGy/wk)
  shieldedKerma: number; // after barrier
  thickness: number; // required thickness (mm)
}

interface BarrierDistribution {
  barrierId: string;
  barrierName: string;
  points: AirKermaPoint[];
  maxKerma: number;
  maxKermaX: number;
  maxThickness: number;
  designGoal: number;
  material: string;
}

interface AirKermaOverlayProps {
  distributions: BarrierDistribution[];
  onClose: () => void;
  onExportPDF: () => void;
}

export default function AirKermaOverlay({ distributions, onClose, onExportPDF }: AirKermaOverlayProps) {
  const [selectedBarrier, setSelectedBarrier] = useState(0);
  const [showShielded, setShowShielded] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dist = distributions[selectedBarrier];

  // Draw air kerma distribution graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dist) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const pad = { t: 30, r: 30, b: 50, l: 60 };

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fafaf9';
    ctx.fillRect(0, 0, w, h);

    const xs = dist.points.map(p => p.x);
    const ks = dist.points.map(p => p.kerma);
    const sks = dist.points.map(p => p.shieldedKerma);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const kMax = Math.max(...ks) * 1.1;

    const sx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * (w - pad.l - pad.r);
    const sy = (k: number) => pad.t + (1 - k / kMax) * (h - pad.t - pad.b);

    // Grid
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (i / 5) * (h - pad.t - pad.b);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      ctx.fillStyle = '#78716c'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText((kMax * (1 - i / 5)).toFixed(1), pad.l - 5, y + 3);
    }

    // Unshielded kerma curve (red)
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    dist.points.forEach((p, i) => { if (i === 0) ctx.moveTo(sx(p.x), sy(p.kerma)); else ctx.lineTo(sx(p.x), sy(p.kerma)); });
    ctx.stroke();

    // Shielded kerma curve (green)
    if (showShielded) {
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      dist.points.forEach((p, i) => { if (i === 0) ctx.moveTo(sx(p.x), sy(p.shieldedKerma)); else ctx.lineTo(sx(p.x), sy(p.shieldedKerma)); });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Design goal line
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    const dy = sy(dist.designGoal);
    ctx.moveTo(pad.l, dy); ctx.lineTo(w - pad.r, dy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#2563eb'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Design Goal: ${dist.designGoal} mSv/wk`, pad.l + 5, dy - 5);

    // Max point marker
    const mki = dist.points.findIndex(p => p.kerma === dist.maxKerma);
    if (mki >= 0) {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(sx(dist.points[mki].x), sy(dist.maxKerma), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`Kmax = ${dist.maxKerma.toFixed(3)}`, sx(dist.points[mki].x), sy(dist.maxKerma) - 10);
    }

    // Axes labels
    ctx.fillStyle = '#57534e'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Position Along Barrier (m)', pad.l + (w - pad.l - pad.r) / 2, h - 10);
    ctx.save();
    ctx.translate(12, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Air Kerma (mGy/wk)', 0, 0);
    ctx.restore();

  }, [dist, showShielded]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-[#fff7ed]">
          <div className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-[#f97316]" />
            <h2 className="text-sm font-bold text-slate-800">Air Kerma Distribution Overlay</h2>
            <span className="text-[10px] text-slate-400 ml-2">Report-ready overlays for each evaluated barrier</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={onExportPDF}><Download className="w-3.5 h-3.5" /> Export PDF</Button>
            <button
              aria-label="Cerrar Air Kerma Distribution Overlay"
              onClick={onClose}
              className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Barrier Selector */}
          <div className="w-56 border-r border-slate-200 bg-slate-50 overflow-auto">
            <div className="p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Barriers ({distributions.length})</p>
              {distributions.map((d, i) => (
                <button key={d.barrierId} onClick={() => setSelectedBarrier(i)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-colors mb-1 ${
                    selectedBarrier === i ? 'bg-[#f97316] text-white' : 'hover:bg-white text-slate-600'
                  }`}>
                  <p className="font-semibold truncate">{d.barrierName}</p>
                  <p className={`${selectedBarrier === i ? 'text-white/70' : 'text-slate-400'}`}>Max: {d.maxKerma.toFixed(3)} mGy/wk</p>
                </button>
              ))}
            </div>
          </div>

          {/* Graph + Stats */}
          <div className="flex-1 overflow-auto p-5">
            {dist && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-700">{dist.barrierName}</h3>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={showShielded} onChange={e => setShowShielded(e.target.checked)} className="rounded" />
                      Show Shielded
                    </label>
                  </div>
                </div>

                <canvas ref={canvasRef} width={700} height={350} className="w-full border border-slate-200 rounded-lg bg-white" />

                <div className="grid grid-cols-4 gap-3 mt-4">
                  <div className="bg-red-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-red-600">{dist.maxKerma.toFixed(4)}</p><p className="text-[9px] text-slate-500">Max Air Kerma (mGy/wk)</p></div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-blue-600">{dist.designGoal}</p><p className="text-[9px] text-slate-500">Design Goal (mSv/wk)</p></div>
                  <div className="bg-green-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-green-600">{dist.maxThickness.toFixed(2)}</p><p className="text-[9px] text-slate-500">Max Thickness (mm)</p></div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-amber-600">{dist.material}</p><p className="text-[9px] text-slate-500">Material</p></div>
                </div>

                <p className="text-[10px] text-slate-500 mt-3">
                  Generate report-ready overlays and air kerma distributions for each evaluated barrier.
                  Red line = unshielded air kerma. Green dashed = shielded. Blue = design goal.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
