/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v31 — Dose Map Visualization Dialog
 *  2D heatmap + isodose contours on canvas + 3D preview in Three.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Palette, Play, Layers,
  Radio, Shield, Settings, RotateCcw, Map, Activity
} from 'lucide-react';
import {
  calculateDoseGrid, renderDoseHeatmap, generateDose3DMesh,
  calculateDoseStats, TVL_PRIMARY_CONCRETE_MM,
  type DoseGridConfig, type DoseGridResult, type ColorMap,
} from '@/lib/doseMapEngine';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export default function DoseMapDialog({ open, onOpenChange }: Props) {
  const canvas2DRef = useRef<HTMLCanvasElement>(null);
  const canvas3DRef = useRef<HTMLCanvasElement>(null);
  const renderer3DRef = useRef<THREE.WebGLRenderer | null>(null);
  const animRef = useRef<number>(0);
  const [activeTab, setActiveTab] = useState('2d');
  const [colorMap, setColorMap] = useState<ColorMap>('jet');
  const [showContours, setShowContours] = useState(true);
  const [gridRes, setGridRes] = useState('80');
  const [roomWidth, setRoomWidth] = useState('8');
  const [roomDepth, setRoomDepth] = useState('8');
  const [occupancyFactor, setOccupancyFactor] = useState('0.2');
  const [designDose, setDesignDose] = useState('0.02');
  const [sourceEnergy, setSourceEnergy] = useState('6MV');
  const [sourceWorkload, setSourceWorkload] = useState('40');
  const [sourceUseFactor, setSourceUseFactor] = useState('0.25');
  const [barrierThickness, setBarrierThickness] = useState('1000');
  const [result, setResult] = useState<DoseGridResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [stats, setStats] = useState<ReturnType<typeof calculateDoseStats> | null>(null);
  const [showSources, setShowSources] = useState(true);
  const [showBarriers, setShowBarriers] = useState(true);

  // ─── Calculate dose map ───
  const handleCalculate = useCallback(() => {
    setIsCalculating(true);
    const t0 = performance.now();

    const w = parseInt(gridRes) || 80;
    const h = parseInt(gridRes) || 80;
    const rw = parseFloat(roomWidth) || 8;
    const rd = parseFloat(roomDepth) || 8;
    const cellSize = rw / w;

    const config: DoseGridConfig = {
      width: w, height: h, cellSize_m: cellSize,
      sources: [
        { x: rw * 0.5, y: rd * 0.5, energyLabel: sourceEnergy,
          workload_Gy_week: parseFloat(sourceWorkload) || 40,
          useFactor: parseFloat(sourceUseFactor) || 0.25, isPrimary: true },
      ],
      barriers: [
        { x1: rw * 0.2, y1: rd * 0.3, x2: rw * 0.8, y2: rd * 0.3,
          thickness_mm: parseFloat(barrierThickness) || 1000,
          material: 'concreto',
          tvl_mm: TVL_PRIMARY_CONCRETE_MM[sourceEnergy] || 369 },
        { x1: rw * 0.2, y1: rd * 0.7, x2: rw * 0.8, y2: rd * 0.7,
          thickness_mm: parseFloat(barrierThickness) || 1000,
          material: 'concreto',
          tvl_mm: TVL_PRIMARY_CONCRETE_MM[sourceEnergy] || 369 },
        { x1: rw * 0.3, y1: rd * 0.3, x2: rw * 0.3, y2: rd * 0.7,
          thickness_mm: parseFloat(barrierThickness) || 800,
          material: 'concreto',
          tvl_mm: TVL_PRIMARY_CONCRETE_MM[sourceEnergy] || 369 },
      ],
      occupancyFactor: parseFloat(occupancyFactor) || 0.2,
      designDose_mSv_week: parseFloat(designDose) || 0.02,
      colorMap,
      contourLevels: [0.02, 0.1, 0.5, 1.0, 2.0, 5.0],
    };

    try {
      const res = calculateDoseGrid(config);
      setResult(res);
      setStats(calculateDoseStats(res));

      // Render 2D
      if (canvas2DRef.current) {
        const ctx = canvas2DRef.current.getContext('2d');
        if (ctx) {
          canvas2DRef.current.width = canvas2DRef.current.clientWidth;
          canvas2DRef.current.height = canvas2DRef.current.clientHeight;
          // Draw room outline
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, canvas2DRef.current.width, canvas2DRef.current.height);
          renderDoseHeatmap(ctx, res, canvas2DRef.current.width, canvas2DRef.current.height, colorMap, showContours);

          // Draw source
          if (showSources) {
            const sx = (config.sources[0].x / rw) * canvas2DRef.current.width;
            const sy = (config.sources[0].y / rd) * canvas2DRef.current.height;
            ctx.fillStyle = '#ff3300';
            ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif';
            ctx.fillText('FUENTE', sx - 18, sy - 14);
          }

          // Draw barriers
          if (showBarriers) {
            for (const b of config.barriers) {
              const bx1 = (b.x1 / rw) * canvas2DRef.current.width;
              const by1 = (b.y1 / rd) * canvas2DRef.current.height;
              const bx2 = (b.x2 / rw) * canvas2DRef.current.width;
              const by2 = (b.y2 / rd) * canvas2DRef.current.height;
              ctx.strokeStyle = 'rgba(255,255,255,0.8)';
              ctx.lineWidth = 4;
              ctx.setLineDash([5, 3]);
              ctx.beginPath(); ctx.moveTo(bx1, by1); ctx.lineTo(bx2, by2); ctx.stroke();
              ctx.setLineDash([]);
            }
          }

          // Legend
          drawLegend(ctx, canvas2DRef.current.width, canvas2DRef.current.height, res, colorMap);
        }
      }

      // Render 3D
      render3D(res);

      const dt = performance.now() - t0;
      toast.success(`Dose map calculado: ${w}×${h} = ${w * h} celdas en ${dt.toFixed(0)} ms`);
    } catch (e) {
      toast.error('Error: ' + (e as Error).message);
    } finally {
      setIsCalculating(false);
    }
  }, [colorMap, showContours, gridRes, roomWidth, roomDepth, occupancyFactor, designDose,
      sourceEnergy, sourceWorkload, sourceUseFactor, barrierThickness, showSources, showBarriers]);

  // ─── 3D rendering ───
  const render3D = useCallback((res: DoseGridResult) => {
    if (!canvas3DRef.current) return;
    const canvas = canvas3DRef.current;

    // Cleanup old renderer
    if (renderer3DRef.current) {
      renderer3DRef.current.dispose();
      cancelAnimationFrame(animRef.current);
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);

    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.01, 100);
    camera.position.set(6, 8, 6);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer3DRef.current = renderer;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target.set(4, 0, 4);

    scene.add(new THREE.AmbientLight(0x404040, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 0.7);
    dl.position.set(5, 10, 5); scene.add(dl);

    // Dose surface mesh
    const meshData = generateDose3DMesh(res, colorMap, 0.3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(Array.from(meshData.vertices), 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from(meshData.normals), 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(Array.from(meshData.colors), 3));
    geometry.setIndex(Array.from(meshData.indices));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide,
    });
    scene.add(new THREE.Mesh(geometry, material));

    // Grid
    scene.add(new THREE.GridHelper(10, 20, 0x333355, 0x222233));

    // Source indicator
    const sg = new THREE.SphereGeometry(0.15, 16, 16);
    const sm = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sp = new THREE.Mesh(sg, sm);
    sp.position.set(4, 0.3, 4);
    scene.add(sp);

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  }, [colorMap]);

  // ─── Legend ───
  function drawLegend(
    ctx: CanvasRenderingContext2D, w: number, h: number,
    res: DoseGridResult, cmap: ColorMap
  ) {
    const lh = 12; const lw = 120; const ly = h - 80;
    const lx = w - lw - 10;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(lx - 4, ly - 16, lw + 8, 76);

    ctx.fillStyle = '#fff'; ctx.font = '9px sans-serif';
    ctx.fillText('mSv/semana', lx, ly - 6);

    for (let i = 0; i < 20; i++) {
      const t = i / 19;
      const val = res.minDose + t * (res.maxDose - res.minDose);
      const [r, g, b] = (() => {
        const colors = {
          jet: [[0,0,0.5],[0,0,1],[0,0.5,1],[0,1,1],[0.5,1,0.5],[1,1,0],[1,0.5,0],[1,0,0],[0.5,0,0]],
          viridis: [[0.267,0.004,0.329],[0.283,0.141,0.458],[0.254,0.265,0.529],[0.207,0.372,0.553],[0.163,0.471,0.558],[0.128,0.567,0.551],[0.135,0.659,0.518],[0.267,0.749,0.441],[0.478,0.821,0.318],[0.741,0.873,0.154],[0.993,0.906,0.144]],
          hot: [[0,0,0],[0.3,0,0],[0.6,0,0],[0.9,0,0],[1,0.3,0],[1,0.6,0],[1,0.9,0],[1,1,0.3],[1,1,0.7],[1,1,1]],
        } as Record<string, [number,number,number][]>;
        const c = colors[cmap] || colors.jet;
        const idx = t * (c.length - 1);
        const i0 = Math.floor(idx); const i1 = Math.min(i0 + 1, c.length - 1);
        const f = idx - i0;
        const a = c[i0], b = c[i1];
        return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f];
      })();
      ctx.fillStyle = `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;
      ctx.fillRect(lx + (i / 20) * lw, ly, lw / 20 + 1, 8);
    }

    ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif';
    ctx.fillText(res.minDose.toFixed(2), lx, ly + 18);
    ctx.fillText(res.maxDose.toFixed(2), lx + lw - 20, ly + 18);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Palette className="w-5 h-5 text-rose-500" />
            Dose Map Visualization — v31
            <Badge className="text-[9px] bg-rose-100 text-rose-700 ml-1">HEATMAP 2D/3D</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <TabsList className="mx-5 mt-2 grid grid-cols-3 h-8">
            <TabsTrigger value="2d" className="text-[11px]"><Map className="w-3 h-3 mr-1" /> 2D Heatmap + Contours</TabsTrigger>
            <TabsTrigger value="3d" className="text-[11px]"><Layers className="w-3 h-3 mr-1" /> 3D Volumetric</TabsTrigger>
            <TabsTrigger value="config" className="text-[11px]"><Settings className="w-3 h-3 mr-1" /> Configuración</TabsTrigger>
          </TabsList>

          <div className="h-[58vh]">
            {/* ═══ 2D HEATMAP ═══ */}
            <TabsContent value="2d" className="mt-0 h-full m-0 relative">
              <canvas ref={canvas2DRef} className="w-full h-full block" />
              {!result && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
                  <div className="text-center space-y-2">
                    <Palette className="w-8 h-8 mx-auto text-rose-400" />
                    <p className="text-sm">Configura los parámetros y presiona Calcular</p>
                    <p className="text-[10px] text-slate-400">Grilla 2D + líneas isodosis superpuestas</p>
                  </div>
                </div>
              )}
              {/* Overlay controls */}
              {result && (
                <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] p-2 rounded space-y-0.5">
                  <div><strong>Grid:</strong> {result.width}×{result.height}</div>
                  <div><strong>Min:</strong> {result.minDose.toFixed(3)} mSv/sem</div>
                  <div><strong>Max:</strong> {result.maxDose.toFixed(3)} mSv/sem</div>
                  <div><strong>Contours:</strong> {result.contourLines.length} niveles</div>
                </div>
              )}
            </TabsContent>

            {/* ═══ 3D VOLUMETRIC ═══ */}
            <TabsContent value="3d" className="mt-0 h-full m-0 relative">
              <canvas ref={canvas3DRef} className="w-full h-full block" />
              {!result && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
                  <div className="text-center space-y-2">
                    <Layers className="w-8 h-8 mx-auto text-blue-400" />
                    <p className="text-sm">Calcula primero el dose map 2D</p>
                    <p className="text-[10px] text-slate-400">Superficie 3D: altura proporcional a dosis</p>
                  </div>
                </div>
              )}
              {result && (
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] p-2 rounded">
                  <div>Orbit: Click+drag | Zoom: Scroll</div>
                </div>
              )}
            </TabsContent>

            {/* ═══ CONFIG ═══ */}
            <TabsContent value="config" className="mt-0 h-full m-0">
              <ScrollArea className="h-full px-5 py-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {/* Source */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5" /> Fuente de Radiación
                    </div>
                    <div><Label className="text-[10px]">Energía</Label>
                      <Select value={sourceEnergy} onValueChange={setSourceEnergy}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.keys(TVL_PRIMARY_CONCRETE_MM).map(e => (
                            <SelectItem key={e} value={e} className="text-xs">{e}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-[10px]">Workload (Gy/sem)</Label><Input value={sourceWorkload} onChange={e => setSourceWorkload(e.target.value)} type="number" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Factor de uso (U)</Label><Input value={sourceUseFactor} onChange={e => setSourceUseFactor(e.target.value)} type="number" step="0.05" className="h-7 text-xs" /></div>
                  </div>

                  {/* Room */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Habitación y Barreras
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-[10px]">Ancho (m)</Label><Input value={roomWidth} onChange={e => setRoomWidth(e.target.value)} type="number" className="h-7 text-xs" /></div>
                      <div><Label className="text-[10px]">Profundidad (m)</Label><Input value={roomDepth} onChange={e => setRoomDepth(e.target.value)} type="number" className="h-7 text-xs" /></div>
                    </div>
                    <div><Label className="text-[10px]">Espesor barrera (mm)</Label><Input value={barrierThickness} onChange={e => setBarrierThickness(e.target.value)} type="number" className="h-7 text-xs" /></div>
                    <div className="text-[9px] text-slate-400">
                      TVL primario {sourceEnergy}: {TVL_PRIMARY_CONCRETE_MM[sourceEnergy] || '-'} mm concreto
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <Map className="w-3.5 h-3.5" /> Grilla y Visualización
                    </div>
                    <div><Label className="text-[10px]">Resolución grid</Label>
                      <Select value={gridRes} onValueChange={setGridRes}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="40" className="text-xs">40×40 (rápido)</SelectItem>
                          <SelectItem value="80" className="text-xs">80×80 (balance)</SelectItem>
                          <SelectItem value="120" className="text-xs">120×120 (alta)</SelectItem>
                          <SelectItem value="160" className="text-xs">160×160 (máxima)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-[10px]">Color map</Label>
                      <Select value={colorMap} onValueChange={(v) => setColorMap(v as ColorMap)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(['jet', 'viridis', 'plasma', 'inferno', 'hot', 'cool'] as ColorMap[]).map(c => (
                            <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <Label>Mostrar contornos</Label><Switch checked={showContours} onCheckedChange={setShowContours} />
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" /> Límites Regulatorios
                    </div>
                    <div><Label className="text-[10px]">Factor ocupación (T)</Label><Input value={occupancyFactor} onChange={e => setOccupancyFactor(e.target.value)} type="number" step="0.05" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Dosis diseño público (mSv/sem)</Label><Input value={designDose} onChange={e => setDesignDose(e.target.value)} type="number" step="0.01" className="h-7 text-xs" /></div>
                    <div className="text-[9px] text-amber-600">
                      NCRP 151: 0.02 mSv/sem (público), 0.4 mSv/sem (personal controlado)
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="text-xs gap-1" onClick={handleCalculate} disabled={isCalculating}>
                    <Play className="w-3.5 h-3.5" /> {isCalculating ? 'Calculando...' : 'Calcular Dose Map'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleCalculate} disabled={!result}>
                    <RotateCcw className="w-3.5 h-3.5" /> Recalcular
                  </Button>
                </div>

                {/* Stats */}
                {stats && (
                  <div className="mt-4 bg-slate-50 rounded-lg p-3 border text-[11px] space-y-1">
                    <div className="font-semibold text-slate-700">Estadísticas de Dosis</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>Media: <strong>{stats.mean.toFixed(3)}</strong> mSv/sem</div>
                      <div>Mediana: <strong>{stats.median.toFixed(3)}</strong></div>
                      <div>P95: <strong>{stats.p95.toFixed(3)}</strong></div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-[10px]">
                      <div>Supera 0.02: <strong className="text-amber-600">{((stats.areaAbove_0_02_mSv / stats.totalCells) * 100).toFixed(1)}%</strong></div>
                      <div>Supera 0.1: <strong className="text-orange-600">{((stats.areaAbove_0_1_mSv / stats.totalCells) * 100).toFixed(1)}%</strong></div>
                      <div>Supera 0.5: <strong className="text-red-600">{((stats.areaAbove_0_5_mSv / stats.totalCells) * 100).toFixed(1)}%</strong></div>
                      <div>Supera 1.0: <strong className="text-red-800">{((stats.areaAbove_1_0_mSv / stats.totalCells) * 100).toFixed(1)}%</strong></div>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
