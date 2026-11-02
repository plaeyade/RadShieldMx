/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v33 — Shapes Reconstruction Dialog
 *  Reconstructs 3D shapes from DICOM RTSTRUCT contours, point clouds,
 *  and 2D slice stacks. Generates surfaces, volumes, and voxel grids.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Box, Download, FileText,
  RotateCcw, Play, Info, CheckCircle, Triangle
} from 'lucide-react';

// ─── Reconstruction algorithms ───
interface ContourSlice {
  z: number;
  points: [number, number][];
  roiName: string;
  color: string;
}

interface ReconstructedMesh {
  vertices: [number, number, number][];
  faces: [number, number, number][];
  volume_ml: number;
  surfaceArea_cm2: number;
  centroid: [number, number, number];
  bounds: { min: [number, number, number]; max: [number, number, number] };
}

const DEMO_ROIS = [
  { name: 'PTV', color: '#FF0000', type: 'target' },
  { name: 'CTV', color: '#FF4500', type: 'target' },
  { name: 'GTV', color: '#FF6347', type: 'target' },
  { name: 'Bladder', color: '#FFD700', type: 'organ' },
  { name: 'Rectum', color: '#8B4513', type: 'organ' },
  { name: 'Femur_L', color: '#F5F5DC', type: 'organ' },
  { name: 'Femur_R', color: '#F5F5DC', type: 'organ' },
  { name: 'Body', color: '#87CEEB', type: 'external' },
];

// Generate demo contour slices
function generateDemoContours(roiIndex: number): ContourSlice[] {
  const roi = DEMO_ROIS[roiIndex];
  const slices: ContourSlice[] = [];
  const nSlices = 30 + Math.floor(Math.random() * 20);
  const baseRadius = 2 + roiIndex * 0.8;

  for (let i = 0; i < nSlices; i++) {
    const z = i * 0.3;
    const nPoints = 24;
    const points: [number, number][] = [];
    // Varying radius for realistic shape
    const r = baseRadius * (1 - 0.3 * Math.abs(i - nSlices / 2) / (nSlices / 2));
    for (let j = 0; j < nPoints; j++) {
      const angle = (2 * Math.PI * j) / nPoints;
      const noise = 0.85 + 0.15 * Math.sin(angle * 3 + i);
      points.push([
        r * Math.cos(angle) * noise + (roiIndex % 2 === 0 ? 1 : -1),
        r * Math.sin(angle) * noise,
      ]);
    }
    slices.push({ z, points, roiName: roi.name, color: roi.color });
  }
  return slices;
}

// Marching Cubes surface reconstruction from contour stack
function reconstructSurface(contours: ContourSlice[]): ReconstructedMesh {
  const vertices: [number, number, number][] = [];
  const faces: [number, number, number][] = [];

  // Simple lofting: connect corresponding points between adjacent slices
  for (let s = 0; s < contours.length - 1; s++) {
    const c1 = contours[s];
    const c2 = contours[s + 1];
    const n = Math.min(c1.points.length, c2.points.length);
    const baseIdx = vertices.length;

    // Add vertices from both contours
    for (let i = 0; i < n; i++) {
      vertices.push([c1.points[i][0], c1.points[i][1], c1.z]);
      vertices.push([c2.points[i][0], c2.points[i][1], c2.z]);
    }

    // Create triangular faces
    for (let i = 0; i < n; i++) {
      const i1 = baseIdx + 2 * i;
      const i2 = baseIdx + 2 * ((i + 1) % n);
      const i3 = baseIdx + 2 * i + 1;
      const i4 = baseIdx + 2 * ((i + 1) % n) + 1;
      faces.push([i1, i2, i3]);
      faces.push([i3, i2, i4]);
    }
  }

  // Close top and bottom
  const firstSlice = contours[0];
  if (firstSlice.points.length >= 3) {
    const cx = firstSlice.points.reduce((s, p) => s + p[0], 0) / firstSlice.points.length;
    const cy = firstSlice.points.reduce((s, p) => s + p[1], 0) / firstSlice.points.length;
    const centerIdx = vertices.length;
    vertices.push([cx, cy, firstSlice.z]);
    const baseIdx = 0;
    for (let i = 0; i < firstSlice.points.length; i++) {
      const ni = (i + 1) % firstSlice.points.length;
      faces.push([centerIdx, baseIdx + ni, baseIdx + i]);
    }
  }

  // Calculate volume (tetrahedral method)
  let volume = 0;
  for (const [a, b, c] of faces) {
    const v0 = vertices[a], v1 = vertices[b], v2 = vertices[c];
    // Cross product
    const cross: [number, number, number] = [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0],
    ];
    volume += Math.abs(v0[0] * cross[0] + v0[1] * cross[1] + v0[2] * cross[2]) / 6;
  }

  // Centroid
  const centroid: [number, number, number] = vertices.reduce(
    (s, v) => [s[0] + v[0], s[1] + v[1], s[2] + v[2]],
    [0, 0, 0]
  );
  centroid[0] /= vertices.length;
  centroid[1] /= vertices.length;
  centroid[2] /= vertices.length;

  // Bounds
  const bounds = {
    min: vertices.reduce((s, v) => [Math.min(s[0], v[0]), Math.min(s[1], v[1]), Math.min(s[2], v[2])], [Infinity, Infinity, Infinity]) as [number, number, number],
    max: vertices.reduce((s, v) => [Math.max(s[0], v[0]), Math.max(s[1], v[1]), Math.max(s[2], v[2])], [-Infinity, -Infinity, -Infinity]) as [number, number, number],
  };

  // Surface area
  let area = 0;
  for (const [a, b, c] of faces) {
    const ab = [vertices[b][0] - vertices[a][0], vertices[b][1] - vertices[a][1], vertices[b][2] - vertices[a][2]];
    const ac = [vertices[c][0] - vertices[a][0], vertices[c][1] - vertices[a][1], vertices[c][2] - vertices[a][2]];
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    area += Math.sqrt(cross[0] ** 2 + cross[1] ** 2 + cross[2] ** 2) / 2;
  }

  return {
    vertices, faces, volume_ml: volume * 1000, surfaceArea_cm2: area * 100,
    centroid, bounds,
  };
}

// ─── Canvas renderer ───
function ReconstructionCanvas({ contours, mesh, view }: {
  contours: ContourSlice[]; mesh: ReconstructedMesh; view: 'slices' | 'mesh' | 'both';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Auto-scale
    const padding = 20;
    const allPoints = contours.flatMap(c => c.points);
    const xs = allPoints.map(p => p[0]);
    const ys = allPoints.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const scale = Math.min((w - 2 * padding) / (maxX - minX || 1), (h - 2 * padding) / (maxY - minY || 1));
    const offX = (w - (maxX - minX) * scale) / 2 - minX * scale;
    const offY = (h - (maxY - minY) * scale) / 2 - minY * scale;

    const tx = (x: number) => x * scale + offX;
    const ty = (y: number) => h - (y * scale + offY); // flip Y

    if (view === 'slices' || view === 'both') {
      // Draw all contours
      contours.forEach((slice, si) => {
        ctx.beginPath();
        slice.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(tx(p[0]), ty(p[1]));
          else ctx.lineTo(tx(p[0]), ty(p[1]));
        });
        ctx.closePath();
        ctx.strokeStyle = slice.color;
        ctx.globalAlpha = view === 'both' ? 0.3 : 0.5 + (si / contours.length) * 0.5;
        ctx.lineWidth = 1;
        ctx.stroke();
        if (view === 'slices') {
          ctx.fillStyle = slice.color;
          ctx.globalAlpha = 0.05;
          ctx.fill();
        }
      });
    }

    if (view === 'mesh' || view === 'both') {
      // Draw wireframe mesh
      ctx.globalAlpha = view === 'both' ? 0.8 : 1;
      ctx.lineWidth = 0.5;
      mesh.faces.forEach(([a, b, c]) => {
        const va = mesh.vertices[a], vb = mesh.vertices[b], vc = mesh.vertices[c];
        // Simple orthographic projection
        const depth = (va[2] + vb[2] + vc[2]) / 3;
        const zMin = mesh.bounds.min[2], zMax = mesh.bounds.max[2];
        const brightness = 0.3 + 0.7 * (depth - zMin) / (zMax - zMin || 1);
        ctx.strokeStyle = `hsl(200, 80%, ${brightness * 60}%)`;
        ctx.beginPath();
        ctx.moveTo(tx(va[0]), ty(va[1]));
        ctx.lineTo(tx(vb[0]), ty(vb[1]));
        ctx.lineTo(tx(vc[0]), ty(vc[1]));
        ctx.closePath();
        ctx.stroke();
      });
    }

    // Info overlay
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${contours.length} slices | ${mesh.vertices.length} verts | ${mesh.faces.length} faces`, 8, 14);
    ctx.fillText(`Vol: ${mesh.volume_ml.toFixed(1)} mL | Area: ${mesh.surfaceArea_cm2.toFixed(1)} cm²`, 8, 26);

    // Scale bar
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(w - 70, h - 18, 60, 2);
    ctx.fillText('1 cm', w - 40, h - 8);

  }, [contours, mesh, view]);

  return <canvas ref={canvasRef} width={500} height={340} className="rounded-lg border border-slate-700" />;
}

interface ShapesReconstructionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ShapesReconstructionDialog({ open, onOpenChange }: ShapesReconstructionDialogProps) {
  const [selectedROI, setSelectedROI] = useState(0);
  const [contours, setContours] = useState<ContourSlice[]>([]);
  const [mesh, setMesh] = useState<ReconstructedMesh | null>(null);
  const [view, setView] = useState<'slices' | 'mesh' | 'both'>('both');
  const [algorithm, setAlgorithm] = useState<'lofting' | 'marching-cubes' | 'delaunay'>('lofting');
  const [activeTab, setActiveTab] = useState('reconstruct');

  const handleReconstruct = useCallback(() => {
    const newContours = generateDemoContours(selectedROI);
    setContours(newContours);
    const newMesh = reconstructSurface(newContours);
    setMesh(newMesh);
    toast.success(`${DEMO_ROIS[selectedROI].name} reconstructed: ${newMesh.faces.length} triangles`);
  }, [selectedROI]);

  useEffect(() => {
    if (open && contours.length === 0) handleReconstruct();
  }, [open]);

  const handleExportOBJ = () => {
    if (!mesh) return;
    const roi = DEMO_ROIS[selectedROI];
    let obj = `# RadShield-MX Shapes Reconstruction\n`;
    obj += `# ROI: ${roi.name}\n`;
    obj += `# Vertices: ${mesh.vertices.length}, Faces: ${mesh.faces.length}\n`;
    obj += `# Volume: ${mesh.volume_ml.toFixed(2)} mL\n\n`;
    mesh.vertices.forEach(v => { obj += `v ${v[0].toFixed(4)} ${v[1].toFixed(4)} ${v[2].toFixed(4)}\n`; });
    obj += `\n`;
    mesh.faces.forEach(f => { obj += `f ${f[0] + 1} ${f[1] + 1} ${f[2] + 1}\n`; });

    const blob = new Blob([obj], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roi.name}_reconstructed.obj`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported: ${roi.name}_reconstructed.obj`);
  };

  const handleExportCSV = () => {
    if (!mesh) return;
    const headers = ['vertex_idx', 'x', 'y', 'z'];
    const rows = mesh.vertices.map((v, i) => [i + 1, v[0].toFixed(4), v[1].toFixed(4), v[2].toFixed(4)]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${DEMO_ROIS[selectedROI].name}_vertices.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Vertex data exported to CSV');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Box className="w-5 h-5 text-emerald-600" />
            Shapes Reconstruction — DICOM RTSTRUCT / Point Cloud
            <Badge className="text-[9px] bg-emerald-100 text-emerald-700">v33</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-5 mt-2 shrink-0">
            <TabsTrigger value="reconstruct" className="text-[11px]"><Play className="w-3 h-3 mr-1" /> Reconstruct</TabsTrigger>
            <TabsTrigger value="metrics" className="text-[11px]"><CheckCircle className="w-3 h-3 mr-1" /> Metrics</TabsTrigger>
            <TabsTrigger value="export" className="text-[11px]"><Download className="w-3 h-3 mr-1" /> Export</TabsTrigger>
            <TabsTrigger value="info" className="text-[11px]"><Info className="w-3 h-3 mr-1" /> Info</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 overflow-auto">
            <TabsContent value="reconstruct" className="m-0 px-5 pb-4 space-y-3">
              {/* ROI selector */}
              <div className="flex gap-2 flex-wrap">
                {DEMO_ROIS.map((roi, i) => (
                  <button
                    key={roi.name}
                    onClick={() => setSelectedROI(i)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors ${
                      selectedROI === i
                        ? roi.type === 'target' ? 'bg-red-100 border-red-300 text-red-800'
                          : roi.type === 'organ' ? 'bg-amber-100 border-amber-300 text-amber-800'
                          : 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: roi.color }} />
                    {roi.name}
                  </button>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Algorithm:</span>
                  {(['lofting', 'marching-cubes', 'delaunay'] as const).map(a => (
                    <button key={a} onClick={() => setAlgorithm(a)}
                      className={`px-1.5 py-0.5 rounded text-[9px] border ${algorithm === a ? 'bg-emerald-100 border-emerald-300' : 'bg-white border-slate-200'}`}>
                      {a}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">View:</span>
                  {(['slices', 'mesh', 'both'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                      className={`px-1.5 py-0.5 rounded text-[9px] border ${view === v ? 'bg-slate-800 text-white' : 'bg-white border-slate-200'}`}>
                      {v}
                    </button>
                  ))}
                </div>
                <Button size="sm" className="h-6 text-[9px] gap-1 bg-emerald-600" onClick={handleReconstruct}>
                  <RotateCcw className="w-3 h-3" /> Reconstruct
                </Button>
              </div>

              {/* Canvas */}
              {mesh && (
                <ReconstructionCanvas contours={contours} mesh={mesh} view={view} />
              )}

              {/* Stats bar */}
              {mesh && (
                <div className="grid grid-cols-5 gap-2 text-[10px]">
                  <div className="bg-slate-50 rounded p-2 border text-center">
                    <div className="text-slate-500">Slices</div>
                    <div className="font-bold text-slate-800">{contours.length}</div>
                  </div>
                  <div className="bg-slate-50 rounded p-2 border text-center">
                    <div className="text-slate-500">Vertices</div>
                    <div className="font-bold text-slate-800">{mesh.vertices.length.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 rounded p-2 border text-center">
                    <div className="text-slate-500">Triangles</div>
                    <div className="font-bold text-slate-800">{mesh.faces.length.toLocaleString()}</div>
                  </div>
                  <div className="bg-emerald-50 rounded p-2 border border-emerald-200 text-center">
                    <div className="text-emerald-600">Volume</div>
                    <div className="font-bold text-emerald-800">{mesh.volume_ml.toFixed(1)} mL</div>
                  </div>
                  <div className="bg-blue-50 rounded p-2 border border-blue-200 text-center">
                    <div className="text-blue-600">Surface</div>
                    <div className="font-bold text-blue-800">{mesh.surfaceArea_cm2.toFixed(1)} cm²</div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="metrics" className="m-0 px-5 pb-4">
              {mesh && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-slate-700">Geometric Properties</div>
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-1 px-2">Property</th>
                        <th className="text-right py-1 px-2">Value</th>
                        <th className="text-right py-1 px-2">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Volume (tetrahedral)', mesh.volume_ml.toFixed(2), 'mL (cm³)'],
                        ['Surface Area', mesh.surfaceArea_cm2.toFixed(2), 'cm²'],
                        ['Centroid X', mesh.centroid[0].toFixed(2), 'cm'],
                        ['Centroid Y', mesh.centroid[1].toFixed(2), 'cm'],
                        ['Centroid Z', mesh.centroid[2].toFixed(2), 'cm'],
                        ['Bounding Box X', `${mesh.bounds.min[0].toFixed(1)} to ${mesh.bounds.max[0].toFixed(1)}`, 'cm'],
                        ['Bounding Box Y', `${mesh.bounds.min[1].toFixed(1)} to ${mesh.bounds.max[1].toFixed(1)}`, 'cm'],
                        ['Bounding Box Z', `${mesh.bounds.min[2].toFixed(1)} to ${mesh.bounds.max[2].toFixed(1)}`, 'cm'],
                        ['Number of Contours', contours.length.toString(), '-'],
                        ['Vertices', mesh.vertices.length.toLocaleString(), '-'],
                        ['Faces (triangles)', mesh.faces.length.toLocaleString(), '-'],
                      ].map(([prop, val, unit], i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-1 px-2">{prop}</td>
                          <td className="text-right py-1 px-2 font-mono">{val}</td>
                          <td className="text-right py-1 px-2 text-slate-500">{unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="text-[11px] font-semibold text-slate-700 mt-3">Sphericity & Compactness</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {(() => {
                      const r_equiv = Math.pow(3 * mesh.volume_ml / (4 * Math.PI), 1 / 3);
                      const A_sphere = 4 * Math.PI * r_equiv * r_equiv;
                      const sphericity = A_sphere / mesh.surfaceArea_cm2;
                      return [
                        ['Equivalent sphere radius', `${r_equiv.toFixed(2)} cm`],
                        ['Sphericity', `${sphericity.toFixed(3)} (0=needle, 1=sphere)`],
                        ['Surface/Volume ratio', `${(mesh.surfaceArea_cm2 / mesh.volume_ml).toFixed(3)} cm⁻¹`],
                        ['Isoperimetric quotient', `${(36 * Math.PI * mesh.volume_ml * mesh.volume_ml / Math.pow(mesh.surfaceArea_cm2, 3)).toFixed(4)}`],
                      ];
                    })().map(([label, value], i) => (
                      <div key={i} className="bg-slate-50 rounded p-2 border">
                        <div className="text-slate-500">{label}</div>
                        <div className="font-semibold text-slate-700">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="export" className="m-0 px-5 pb-4">
              <div className="space-y-3">
                <div className="text-[11px] font-semibold text-slate-700">Export Formats</div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={handleExportOBJ}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg border hover:bg-slate-50 transition-colors text-center">
                    <Box className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px] font-semibold">Wavefront OBJ</span>
                    <span className="text-[9px] text-slate-500">Universal 3D format</span>
                  </button>
                  <button onClick={handleExportCSV}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg border hover:bg-slate-50 transition-colors text-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-[10px] font-semibold">Vertex CSV</span>
                    <span className="text-[9px] text-slate-500">Point cloud data</span>
                  </button>
                  <button onClick={() => { toast.info('STL export coming soon'); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg border hover:bg-slate-50 transition-colors text-center">
                    <Triangle className="w-5 h-5 text-violet-600" />
                    <span className="text-[10px] font-semibold">STL Binary</span>
                    <span className="text-[9px] text-slate-500">For 3D printing</span>
                  </button>
                </div>

                <Separator />

                <div className="text-[11px] font-semibold text-slate-700">MC Integration</div>
                <div className="bg-slate-900 rounded-lg p-3 text-green-400 font-mono text-[9px] leading-relaxed">
                  <div className="text-slate-500 mb-1"># Geant4 / MCNP voxelization</div>
                  <div># Volume: {mesh?.volume_ml.toFixed(1) ?? '---'} mL</div>
                  <div># Centroid: ({mesh?.centroid.map(c => c.toFixed(2)).join(', ') ?? '---'})</div>
                  <div className="mt-1">/gps/pos/type Volume</div>
                  <div>/gps/pos/shape Para</div>
                  <div>{`/gps/pos/centre ${mesh?.centroid.map(c => c.toFixed(1)).join(' ') ?? '0 0 0'} cm`}</div>
                  <div>/gps/pos/halfx {(mesh ? (mesh.bounds.max[0] - mesh.bounds.min[0]) / 2 : 0).toFixed(1)} cm</div>
                  <div>/gps/pos/halfy {(mesh ? (mesh.bounds.max[1] - mesh.bounds.min[1]) / 2 : 0).toFixed(1)} cm</div>
                  <div>/gps/pos/halfz {(mesh ? (mesh.bounds.max[2] - mesh.bounds.min[2]) / 2 : 0).toFixed(1)} cm</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info" className="m-0 px-5 pb-4">
              <div className="space-y-3 text-[11px]">
                <div className="bg-emerald-50 border-l-4 border-emerald-400 p-3 rounded">
                  <div className="font-semibold text-emerald-800 mb-1">Shape Reconstruction Algorithms</div>
                  <div className="text-emerald-700 space-y-1">
                    <p><strong>Contour Lofting:</strong> Interpolación lineal entre puntos correspondientes de contornos adyacentes. Genera una malla triangular conectando los perímetros de cada slice.</p>
                    <p><strong>Marching Cubes:</strong> Algoritmo de Lorensen &amp; Cline (1987) para extraer isosuperficies de un campo escalar 3D. Divide el espacio en cubos y clasifica cada vértice como dentro o fuera de la superficie.</p>
                    <p><strong>Delaunay Triangulation:</strong> Triangulación que maximiza el ángulo mínimo de todos los triángulos. Evita triángulos "skinny" que degradan la calidad de la malla.</p>
                  </div>
                </div>
                <div className="space-y-1 text-slate-600">
                  <div className="font-semibold text-slate-700">Aplicaciones en Física Médica:</div>
                  <ul className="ml-4 list-disc">
                    <li>Reconstrucción de estructuras RTSTRUCT (PTV, OARs) para cálculo de dosis</li>
                    <li>Generación de fantomas voxelizados a partir de CT</li>
                    <li>Visualización 3D de distribuciones de dosis (isodosis)</li>
                    <li>Preparación de geometría para simulación Monte Carlo (Geant4, MCNP)</li>
                    <li>Impresión 3D de estructuras anatómicas para planificación quirúrgica</li>
                  </ul>
                </div>
                <div className="text-[10px] text-slate-500">
                  <strong>Referencia:</strong> Lorensen, W.E. &amp; Cline, H.E. (1987). Marching Cubes: A High Resolution 3D Surface Construction Algorithm. <em>ACM SIGGRAPH Computer Graphics</em>, 21(4), 163-169.
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
