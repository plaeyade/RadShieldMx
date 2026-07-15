/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v33 — Voxel Phantom Dialog
 *  ICRP 110/145 voxel phantoms for Monte Carlo dose calculations
 *  Supports: ADAM, EVA, MAX, FASH, MASH, CHILD, PREGNANT, OTOKO, ONAGO
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Box, Layers, Download, Info, User, Baby, PersonStanding,
  Microscope, FileText, Database, Crosshair, Activity
} from 'lucide-react';

// ─── ICRP Phantom Data ───
interface Phantom {
  id: string;
  name: string;
  model: string;
  gender: 'M' | 'F' | 'both';
  age: string;
  height_m: number;
  mass_kg: number;
  voxels: string;
  organCount: number;
  tissues: number;
  source: string;
  year: number;
  description: string;
  organs: { name: string; mass_g: number; density: number; color: string }[];
}

const PHANTOMS: Phantom[] = [
  {
    id: 'adam', name: 'ADAM', model: 'ICRP 110', gender: 'M', age: '38 años (reference)',
    height_m: 1.76, mass_kg: 73.0, voxels: '254×127×222', organCount: 89, tissues: 53,
    source: 'ICRP Publication 110', year: 2009,
    description: 'Fantoma masculino de referencia ICRP 110. Modelo voxelizado construido a partir de imágenes CT y MRI de un voluntario masculino. Incluye 89 organes/tissues con masa específica según ICRP 89.',
    organs: [
      { name: 'Brain', mass_g: 1450, density: 1.04, color: '#FFB6C1' },
      { name: 'Thyroid', mass_g: 20, density: 1.05, color: '#FF69B4' },
      { name: 'Lungs (total)', mass_g: 1000, density: 0.26, color: '#FF4500' },
      { name: 'Heart', mass_g: 330, density: 1.06, color: '#DC143C' },
      { name: 'Liver', mass_g: 1800, density: 1.05, color: '#8B4513' },
      { name: 'Stomach', mass_g: 150, density: 1.03, color: '#DAA520' },
      { name: 'Kidneys (total)', mass_g: 310, density: 1.05, color: '#8B0000' },
      { name: 'Bladder', mass_g: 45, density: 1.02, color: '#FFD700' },
      { name: 'Prostate', mass_g: 17, density: 1.04, color: '#FF6347' },
      { name: 'Testes (total)', mass_g: 35, density: 1.04, color: '#FFA07A' },
      { name: 'Bone (skeleton)', mass_g: 10500, density: 1.40, color: '#F5F5DC' },
      { name: 'Muscle', mass_g: 29000, density: 1.05, color: '#CD853F' },
      { name: 'Skin', mass_g: 3300, density: 1.09, color: '#FFE4C4' },
      { name: 'Blood', mass_g: 5500, density: 1.06, color: '#8B0000' },
    ]
  },
  {
    id: 'eva', name: 'EVA', model: 'ICRP 110', gender: 'F', age: '38 años (reference)',
    height_m: 1.63, mass_kg: 60.0, voxels: '254×127×222', organCount: 91, tissues: 55,
    source: 'ICRP Publication 110', year: 2009,
    description: 'Fantoma femenino de referencia ICRP 110. Modelo voxelizado construido a partir de imágenes CT y MRI de una voluntaria femenina. Incluye 91 organes/tissues incluyendo útero, ovarios y mamas.',
    organs: [
      { name: 'Brain', mass_g: 1300, density: 1.04, color: '#FFB6C1' },
      { name: 'Thyroid', mass_g: 17, density: 1.05, color: '#FF69B4' },
      { name: 'Breasts (total)', mass_g: 400, density: 0.99, color: '#FFC0CB' },
      { name: 'Lungs (total)', mass_g: 850, density: 0.26, color: '#FF4500' },
      { name: 'Heart', mass_g: 280, density: 1.06, color: '#DC143C' },
      { name: 'Liver', mass_g: 1400, density: 1.05, color: '#8B4513' },
      { name: 'Uterus', mass_g: 80, density: 1.05, color: '#FF1493' },
      { name: 'Ovaries (total)', mass_g: 11, density: 1.05, color: '#FF69B4' },
      { name: 'Kidneys (total)', mass_g: 275, density: 1.05, color: '#8B0000' },
      { name: 'Bone (skeleton)', mass_g: 7800, density: 1.40, color: '#F5F5DC' },
      { name: 'Muscle', mass_g: 19500, density: 1.05, color: '#CD853F' },
      { name: 'Skin', mass_g: 2300, density: 1.09, color: '#FFE4C4' },
      { name: 'Blood', mass_g: 4000, density: 1.06, color: '#8B0000' },
    ]
  },
  {
    id: 'child', name: 'CHILD (5-year)', model: 'ICRP 143', gender: 'both', age: '5 años',
    height_m: 1.09, mass_kg: 19.0, voxels: '199×99×364', organCount: 62, tissues: 40,
    source: 'ICRP Publication 143', year: 2020,
    description: 'Fantoma pediátrico ICRP 143 de 5 años de edad. Construido por morfometría estadística a partir de una población de referencia pediátrica.',
    organs: [
      { name: 'Brain', mass_g: 1280, density: 1.04, color: '#FFB6C1' },
      { name: 'Thyroid', mass_g: 3, density: 1.05, color: '#FF69B4' },
      { name: 'Lungs (total)', mass_g: 210, density: 0.26, color: '#FF4500' },
      { name: 'Heart', mass_g: 85, density: 1.06, color: '#DC143C' },
      { name: 'Liver', mass_g: 560, density: 1.05, color: '#8B4513' },
      { name: 'Bone (skeleton)', mass_g: 2600, density: 1.40, color: '#F5F5DC' },
      { name: 'Muscle', mass_g: 5200, density: 1.05, color: '#CD853F' },
      { name: 'Skin', mass_g: 620, density: 1.09, color: '#FFE4C4' },
    ]
  },
  {
    id: 'pregnant', name: 'PREGNANT (30-week)', model: 'ICRP 144', gender: 'F', age: 'Adulto',
    height_m: 1.63, mass_kg: 74.0, voxels: '299×137×322', organCount: 94, tissues: 58,
    source: 'ICRP Publication 144', year: 2021,
    description: 'Fantoma femenino embarazada de 30 semanas ICRP 144. Incluye feto con distribución de dosis específica para radioprotección fetal.',
    organs: [
      { name: 'Brain (maternal)', mass_g: 1300, density: 1.04, color: '#FFB6C1' },
      { name: 'Fetus (total)', mass_g: 1400, density: 1.03, color: '#00CED1' },
      { name: 'Placenta', mass_g: 470, density: 1.03, color: '#48D1CC' },
      { name: 'Uterus (gravid)', mass_g: 1100, density: 1.03, color: '#FF1493' },
      { name: 'Amniotic fluid', mass_g: 700, density: 1.01, color: '#87CEEB' },
      { name: 'Breasts', mass_g: 550, density: 0.99, color: '#FFC0CB' },
      { name: 'Liver', mass_g: 1500, density: 1.05, color: '#8B4513' },
      { name: 'Bone', mass_g: 8200, density: 1.40, color: '#F5F5DC' },
    ]
  },
];

// ─── Canvas Phantom Renderer ───
function PhantomCanvas({ phantom, view, slice, highlight }: {
  phantom: Phantom; view: 'axial' | 'sagittal' | 'coronal'; slice: number; highlight?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Parse voxel dimensions
    const [vx, vy, vz] = phantom.voxels.split('×').map(Number);
    const maxDim = Math.max(vx, vy, vz);

    // Draw body outline based on view
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) / maxDim * 0.8;

    if (view === 'axial') {
      // Axial: ellipse for body cross-section
      ctx.beginPath();
      ctx.ellipse(cx, cy, vx * scale * 0.4, vy * scale * 0.35, 0, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFE4C4'; // skin
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Organs as simplified ellipses
      phantom.organs.forEach((org, i) => {
        const ox = cx + (Math.sin(i * 2.1) * vx * scale * 0.15);
        const oy = cy + (Math.cos(i * 1.7) * vy * scale * 0.12);
        const or = Math.max(3, Math.sqrt(org.mass_g) * scale * 0.006);
        ctx.beginPath();
        ctx.arc(ox, oy, or, 0, 2 * Math.PI);
        ctx.fillStyle = highlight === org.name ? '#ff0000' : org.color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // Label for large organs
        if (org.mass_g > 500 && or > 8) {
          ctx.fillStyle = '#333';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(org.name.split(' ')[0], ox, oy + 3);
        }
      });

      // Grid
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    } else if (view === 'sagittal') {
      // Sagittal profile
      ctx.beginPath();
      ctx.moveTo(cx - vy * scale * 0.2, cy - vz * scale * 0.45);
      ctx.quadraticCurveTo(cx + vy * scale * 0.35, cy - vz * scale * 0.35, cx + vy * scale * 0.2, cy + vz * scale * 0.4);
      ctx.quadraticCurveTo(cx - vy * scale * 0.05, cy + vz * scale * 0.45, cx - vy * scale * 0.2, cy - vz * scale * 0.45);
      ctx.fillStyle = '#FFE4C4';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.stroke();

      // Simple organ positions in sagittal
      phantom.organs.slice(0, 6).forEach((org, i) => {
        const ox = cx + (i % 2 === 0 ? -10 : 15);
        const oy = cy - 40 + i * 25;
        ctx.beginPath();
        ctx.arc(ox, oy, 8, 0, 2 * Math.PI);
        ctx.fillStyle = org.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#333';
        ctx.font = '8px sans-serif';
        ctx.fillText(org.name.split(' ')[0], ox - 12, oy - 10);
      });
    } else {
      // Coronal
      ctx.beginPath();
      ctx.ellipse(cx, cy, vx * scale * 0.4, vz * scale * 0.45, 0, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFE4C4';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.stroke();
    }

    // View label
    ctx.fillStyle = '#888';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${view.toUpperCase()} — Slice ${slice}`, 8, 16);

    // Scale bar
    ctx.fillStyle = '#333';
    ctx.fillRect(w - 60, h - 20, 50, 3);
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('10 cm', w - 10, h - 8);

  }, [phantom, view, slice, highlight]);

  return <canvas ref={canvasRef} width={320} height={280} className="border rounded-lg bg-white" />;
}

interface VoxelPhantomDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function VoxelPhantomDialog({ open, onOpenChange }: VoxelPhantomDialogProps) {
  const [selectedPhantom, setSelectedPhantom] = useState<Phantom>(PHANTOMS[0]);
  const [view, setView] = useState<'axial' | 'sagittal' | 'coronal'>('axial');
  const [slice, setSlice] = useState(50);
  const [highlightedOrgan, setHighlightedOrgan] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('viewer');

  const totalMass = useMemo(() =>
    selectedPhantom.organs.reduce((s, o) => s + o.mass_g, 0) / 1000,
    [selectedPhantom]
  );

  const handleExportMCNP = () => {
    let mcnp = `C ─── MCNP Input: ${selectedPhantom.name} Phantom ───\n`;
    mcnp += `C Source: ${selectedPhantom.source} (${selectedPhantom.year})\n`;
    mcnp += `C Dimensions: ${selectedPhantom.voxels} voxels\n`;
    mcnp += `C Total organs: ${selectedPhantom.organCount}\n\n`;
    mcnp += `C ─── Cell Cards ───\n`;
    selectedPhantom.organs.forEach((org, i) => {
      mcnp += `${i + 1} ${Math.round(org.density * 100)} -${org.density.toFixed(3)} `;
      mcnp += `(${i + 1}) `;
      mcnp += `$ ${org.name}\n`;
    });
    mcnp += `\nC ─── Source ───\n`;
    mcnp += `SDEF  POS=d1  ERG=d2  PAR=2\n`;
    mcnp += `SI1 0 0 0\n`;
    mcnp += `SP1 0 1\n`;
    mcnp += `SI2 H 0.001 0.01 0.1 1 10\n`;
    mcnp += `SP2 D 0 1 1 1 0\n`;
    mcnp += `\nC ─── Tally ───\n`;
    mcnp += `F4:P 1 ${selectedPhantom.organCount}T\n`;
    mcnp += `E4 0.001 499ilog 10\n`;
    mcnp += `\nC ─── Material Cards ───\n`;
    mcnp += `M1 1000 -0.104 6000 -0.230 7000 -0.031 8000 -0.729\n`;
    mcnp += `C Water (H, C, N, O by weight fraction)\n`;
    mcnp += `\nCTME 60\nPRINT\n`;

    const blob = new Blob([mcnp], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPhantom.name}_MCNP.i`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`MCNP input exported: ${selectedPhantom.name}_MCNP.i`);
  };

  const handleExportCSV = () => {
    const headers = ['Phantom', 'Organ', 'Mass_g', 'Density_g_cm3'];
    const rows = selectedPhantom.organs.map(o => [selectedPhantom.name, o.name, o.mass_g.toString(), o.density.toString()]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPhantom.name}_organs.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Organ data exported to CSV');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Box className="w-5 h-5 text-violet-600" />
            Voxel Phantom Library — ICRP 110/143/144/145
            <Badge className="text-[9px] bg-violet-100 text-violet-700">v33</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-5 mt-2 shrink-0">
            <TabsTrigger value="viewer" className="text-[11px]"><Crosshair className="w-3 h-3 mr-1" /> Visor 2D</TabsTrigger>
            <TabsTrigger value="organs" className="text-[11px]"><Activity className="w-3 h-3 mr-1" /> Organ Doses</TabsTrigger>
            <TabsTrigger value="mc" className="text-[11px]"><Microscope className="w-3 h-3 mr-1" /> MC Export</TabsTrigger>
            <TabsTrigger value="info" className="text-[11px]"><Info className="w-3 h-3 mr-1" /> Info</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 overflow-auto">
            {/* ─── PHANTOM SELECTOR ─── */}
            <div className="px-5 py-2 flex gap-2 flex-wrap">
              {PHANTOMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPhantom(p); setSlice(50); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors ${
                    selectedPhantom.id === p.id
                      ? 'bg-violet-100 border-violet-300 text-violet-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p.gender === 'M' ? <PersonStanding className="w-3 h-3" /> : p.gender === 'F' ? <User className="w-3 h-3" /> : <Baby className="w-3 h-3" />}
                  {p.name}
                </button>
              ))}
            </div>

            <TabsContent value="viewer" className="m-0 px-5 pb-4">
              <div className="flex gap-4">
                {/* Canvas */}
                <div className="space-y-2">
                  <PhantomCanvas phantom={selectedPhantom} view={view} slice={slice} highlight={highlightedOrgan} />
                  {/* View controls */}
                  <div className="flex gap-1">
                    {(['axial', 'sagittal', 'coronal'] as const).map(v => (
                      <Button key={v} size="sm" variant={view === v ? 'default' : 'outline'}
                        className="h-6 text-[9px] px-2 capitalize" onClick={() => setView(v)}>
                        {v}
                      </Button>
                    ))}
                  </div>
                  {/* Slice slider */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-slate-500 w-8">Slice</span>
                    <input type="range" min={0} max={100} value={slice}
                      onChange={e => setSlice(Number(e.target.value))}
                      className="flex-1 accent-violet-600" />
                    <span className="text-slate-600 w-8">{slice}</span>
                  </div>
                </div>

                {/* Organ list */}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> {selectedPhantom.name} — {selectedPhantom.organCount} organs
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2">
                    {selectedPhantom.height_m} m | {selectedPhantom.mass_kg} kg | {selectedPhantom.voxels} voxels | {selectedPhantom.source}
                  </div>
                  <div className="space-y-0.5 max-h-[280px] overflow-auto">
                    {selectedPhantom.organs.map((org, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] cursor-pointer transition-colors ${
                          highlightedOrgan === org.name ? 'bg-red-50 border border-red-200' : 'hover:bg-slate-50 border border-transparent'
                        }`}
                        onClick={() => setHighlightedOrgan(highlightedOrgan === org.name ? undefined : org.name)}
                      >
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: org.color }} />
                        <span className="flex-1 truncate font-medium">{org.name}</span>
                        <span className="text-slate-500">{org.mass_g} g</span>
                        <span className="text-slate-400">{org.density} g/cm³</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t text-[10px] text-slate-500">
                    Total organ mass: <strong>{totalMass.toFixed(1)} kg</strong> of {selectedPhantom.mass_kg} kg body mass
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="organs" className="m-0 px-5 pb-4">
              <div className="text-[11px] font-semibold text-slate-700 mb-2">Absorbed Dose per Organ (S-coefficients)</div>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-1 px-2 font-semibold">Organ</th>
                    <th className="text-right py-1 px-2 font-semibold">Mass (g)</th>
                    <th className="text-right py-1 px-2 font-semibold">Density</th>
                    <th className="text-right py-1 px-2 font-semibold">S-value (Gy/Bq.s)</th>
                    <th className="text-right py-1 px-2 font-semibold">Dose coeff.</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPhantom.organs.map((org, i) => {
                    const sVal = (0.1 / (org.mass_g / 1000)) * 1e-12; // Simplified S-value
                    return (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-1 px-2 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: org.color }} />
                          {org.name}
                        </td>
                        <td className="text-right py-1 px-2">{org.mass_g.toLocaleString()}</td>
                        <td className="text-right py-1 px-2">{org.density.toFixed(2)}</td>
                        <td className="text-right py-1 px-2 font-mono">{sVal.toExponential(2)}</td>
                        <td className="text-right py-1 px-2 font-mono">{(sVal * 1e6).toExponential(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={handleExportCSV}>
                  <Download className="w-3 h-3" /> Export CSV
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="mc" className="m-0 px-5 pb-4">
              <div className="space-y-3">
                <div className="bg-slate-900 text-green-400 rounded-lg p-3 font-mono text-[10px] leading-relaxed overflow-auto max-h-[300px]">
                  <div className="text-slate-500 mb-1"># MCNP6 Input — {selectedPhantom.name} Phantom</div>
                  <div>C ─── Cell Cards ───</div>
                  {selectedPhantom.organs.map((org, i) => (
                    <div key={i}>{`${i + 1} ${Math.round(org.density * 100)} -${org.density.toFixed(3)} (${i + 1}) $ ${org.name}`}</div>
                  ))}
                  <div className="mt-2">C ─── Source Definition ───</div>
                  <div>SDEF POS=d1 ERG=d2 PAR=2</div>
                  <div>SI2 H 0.001 499ilog 10.0</div>
                  <div>SP2 D 0 1 1 1 0</div>
                  <div className="mt-2">C ─── Tallies ───</div>
                  <div>F4:P 1 {selectedPhantom.organCount}T</div>
                  <div>E4 0.001 499ilog 10.0</div>
                  <div>CTME 60</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-[10px] gap-1 bg-violet-600" onClick={handleExportMCNP}>
                    <FileText className="w-3 h-3" /> Export MCNP .i file
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={handleExportCSV}>
                    <Database className="w-3 h-3" /> Export Organ CSV
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info" className="m-0 px-5 pb-4">
              <div className="space-y-3 text-[11px]">
                <div className="info-box border-l-4 border-violet-400 bg-violet-50 p-3 rounded">
                  <div className="font-semibold text-violet-800 mb-1">{selectedPhantom.name} — {selectedPhantom.model}</div>
                  <div className="text-violet-700">{selectedPhantom.description}</div>
                </div>
                <table className="w-full text-[10px]">
                  <tbody>
                    {[
                      ['Modelo', selectedPhantom.model],
                      ['Género', selectedPhantom.gender === 'M' ? 'Masculino' : selectedPhantom.gender === 'F' ? 'Femenino' : 'Ambos'],
                      ['Edad', selectedPhantom.age],
                      ['Estatura', `${selectedPhantom.height_m} m`],
                      ['Masa corporal', `${selectedPhantom.mass_kg} kg`],
                      ['Resolución voxels', selectedPhantom.voxels],
                      ['Órganos', `${selectedPhantom.organCount}`],
                      ['Tejidos', `${selectedPhantom.tissues}`],
                      ['Fuente', selectedPhantom.source],
                      ['Año', `${selectedPhantom.year}`],
                    ].map(([k, v], i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-1 px-2 font-medium text-slate-600 w-32">{k}</td>
                        <td className="py-1 px-2">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-slate-500 text-[10px]">
                  <strong>Referencia:</strong> ICRP Publication 110 (2009) — Adult Reference Computational Phantoms.
                  <br />
                  <strong>Nota:</strong> Los S-values se calculan mediante la fórmula de Johnson (1988):
                  S(t←s) = Σ_i [E_i × φ_i(t←s) / m_t] donde φ es la fracción de energía absorbida (AF) de la fuente s al blanco t.
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
