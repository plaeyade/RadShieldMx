/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v29 — Real-Time 3D Design Exploration Dialog
 * ═══════════════════════════════════════════════════════════════════════════
 *  • Interactive 3D preview (Three.js) with orbit controls
 *  • Export: glTF/glB, FBX, USD, OBJ
 *  • Connectors: Enscape, Rhino, Autodesk Viewer, SketchUp
 *  • Integration: Unreal Engine 5, Unity
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Box, Download, ExternalLink, Eye, FileBox, Layers, Globe, CheckCircle,
  Settings, RotateCcw
} from 'lucide-react';
import {
  exportBunker3D, generateBunkerMesh,
  CONNECTORS, BARRIER_MATERIAL_COLORS,
  type ExportFormat, type ExportOptions,
} from '@/lib/realTime3DEngine';
import type { FloorPlan } from '@/types/radshield';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  floorPlan?: FloorPlan;
}

export default function RealTime3DDialog({ open, onOpenChange, floorPlan }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const animRef = useRef<number>(0);
  const [activeTab, setActiveTab] = useState('preview');
  const [format, setFormat] = useState<ExportFormat>('glb');
  const [includeSources, setIncludeSources] = useState(true);
  const [wallThickness, setWallThickness] = useState('0.3');
  const [ceilingHeight, setCeilingHeight] = useState('3.0');
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<string>('unreal');

  function loadBunkerIntoScene(scene: any) {
    const opts: ExportOptions = {
      format: 'glb',
      includeDoseOverlay: false,
      includeSources,
      includeLabels: false,
      unitScale: 0.5,
      wallThickness_m: parseFloat(wallThickness) || 0.3,
      ceilingHeight_m: parseFloat(ceilingHeight) || 3.0,
    };

    const mesh = generateBunkerMesh(floorPlan || ({ barriers: [], sources: [{ id: 'src1', x: 2, y: 0, type: 'linac', energy: 6 }]} as any), opts);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(Array.from(mesh.vertices), 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from(mesh.normals), 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(Array.from(mesh.colors), 4));
    geometry.setIndex(Array.from(mesh.indices));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const threeMesh = new THREE.Mesh(geometry, material);
    (threeMesh as any).userData = { isBunker: true };
    threeMesh.castShadow = true;
    threeMesh.receiveShadow = true;
    scene.add(threeMesh);

    // Source glow spheres
    if (opts.includeSources) {
      (floorPlan?.sources || [{ x: 2, y: 0 }]).forEach((src) => {
        const sg = new THREE.SphereGeometry(0.15, 16, 16);
        const sm = new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0.85 });
        const sp = new THREE.Mesh(sg, sm);
        sp.position.set((src.x || 2) * opts.unitScale, opts.ceilingHeight_m * opts.unitScale / 2, (src.y || 0) * opts.unitScale);
        (sp as any).userData = { isBunker: true };
        scene.add(sp);

        // Point light at source
        const pl = new THREE.PointLight(0xff3300, 2, 5);
        pl.position.copy(sp.position);
        scene.add(pl);
      });
    }
  }

  // ─── 3D Preview ───
  const init3D = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.01, 100);
    camera.position.set(6, 4, 6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.5, 0);
    controlsRef.current = controls;

    // Lighting
    const ambient = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x88ccff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Grid
    const grid = new THREE.GridHelper(12, 24, 0x444466, 0x222244);
    scene.add(grid);

    // Axes
    const axes = new THREE.AxesHelper(1.5);
    scene.add(axes);

    loadBunkerIntoScene(scene);
    setIsPreviewReady(true);

    // Animation loop
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    let cleanup: (() => void) | undefined;
    // Wait for canvas to be in DOM
    const timer = setTimeout(() => {
      cleanup = init3D();
    }, 200);
    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, [open, init3D]);

  // Reload when options change
  useEffect(() => {
    if (!sceneRef.current || !isPreviewReady) return;
    // Remove old bunker mesh
    const toRemove: any[] = [];
    sceneRef.current.traverse((child: any) => {
      if (child.userData?.isBunker) toRemove.push(child);
    });
    toRemove.forEach(c => sceneRef.current?.remove(c));
    loadBunkerIntoScene(sceneRef.current);
  }, [isPreviewReady, includeSources, wallThickness, ceilingHeight, floorPlan]);

  // ─── Export handler ───
  const handleExport = useCallback(() => {
    try {
      const opts: ExportOptions = {
        format, includeDoseOverlay: false, includeSources,
        includeLabels: false, unitScale: 0.5,
        wallThickness_m: parseFloat(wallThickness) || 0.3,
        ceilingHeight_m: parseFloat(ceilingHeight) || 3.0,
      };
      const result = exportBunker3D(floorPlan || ({ barriers: [], sources: [] } as any), opts);
      const url = URL.createObjectURL(result.data as Blob);
      const a = document.createElement('a');
      a.href = url; a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exportado: ${result.filename}`);
    } catch (e) {
      toast.error('Error: ' + (e as Error).message);
    }
  }, [format, includeSources, wallThickness, ceilingHeight, floorPlan]);

  // ─── Reset camera ───
  const handleResetView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(6, 4, 6);
      controlsRef.current.target.set(0, 1.5, 0);
      controlsRef.current.update();
    }
  }, []);

  const connector = CONNECTORS[selectedConnector];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Box className="w-5 h-5 text-violet-500" />
            Real-Time 3D Design Exploration — v29
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <TabsList className="mx-5 mt-2 grid grid-cols-4 h-8">
            <TabsTrigger value="preview" className="text-[11px]">
              <Eye className="w-3 h-3 mr-1" /> 3D Preview
            </TabsTrigger>
            <TabsTrigger value="export" className="text-[11px]">
              <Download className="w-3 h-3 mr-1" /> Export
            </TabsTrigger>
            <TabsTrigger value="connectors" className="text-[11px]">
              <ExternalLink className="w-3 h-3 mr-1" /> Connectors
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-[11px]">
              <Settings className="w-3 h-3 mr-1" /> Config
            </TabsTrigger>
          </TabsList>

          <div className="h-[60vh]">
            {/* ═══ 3D PREVIEW ═══ */}
            <TabsContent value="preview" className="mt-0 h-full m-0">
              <div className="relative h-full">
                <canvas ref={canvasRef} className="w-full h-full block" style={{ minHeight: '400px' }} />
                {!isPreviewReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
                    <div className="text-center space-y-2">
                      <Box className="w-8 h-8 mx-auto animate-pulse" />
                      <p className="text-sm">Cargando preview 3D...</p>
                    </div>
                  </div>
                )}
                {/* Overlay controls */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge variant="outline" className="bg-black/50 text-white text-[10px] border-white/20">
                    <Eye className="w-2.5 h-2.5 mr-1" /> Three.js WebGL
                  </Badge>
                </div>
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] bg-black/50 text-white hover:bg-black/70" onClick={handleResetView}>
                    <RotateCcw className="w-3 h-3 mr-1" /> Reset
                  </Button>
                </div>
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] p-2 rounded space-y-0.5">
                  <div><strong>Orbit:</strong> Click + drag</div>
                  <div><strong>Zoom:</strong> Scroll</div>
                  <div><strong>Pan:</strong> Right-click drag</div>
                </div>
                {/* Material legend */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] p-2 rounded">
                  <div className="font-semibold mb-1">Materiales</div>
                  {Object.entries(BARRIER_MATERIAL_COLORS).slice(0, 5).map(([k, c]) => (
                    <div key={k} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: `rgb(${c.r*255},${c.g*255},${c.b*255})` }} />
                      <span>{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ═══ EXPORT ═══ */}
            <TabsContent value="export" className="mt-0 h-full m-0">
              <ScrollArea className="h-full px-5 py-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Format selection */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-semibold text-slate-700">Formato de exportacion</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'glb' as ExportFormat, label: 'glTF Binary (.glb)', icon: FileBox, desc: 'Web, Unity, UE5, SketchUp', color: 'bg-blue-100 text-blue-700' },
                        { id: 'fbx' as ExportFormat, label: 'Autodesk FBX', icon: Box, desc: 'Maya, 3ds Max, Revit', color: 'bg-emerald-100 text-emerald-700' },
                        { id: 'usda' as ExportFormat, label: 'USD (Pixar)', icon: Layers, desc: 'UE5, Omniverse, Rhino 7+', color: 'bg-purple-100 text-purple-700' },
                        { id: 'obj' as ExportFormat, label: 'Wavefront OBJ', icon: Globe, desc: 'Universal, importador basico', color: 'bg-slate-100 text-slate-700' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            format === f.id ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-200' : 'border-slate-200 hover:bg-slate-50'
                          }`}
                          onClick={() => setFormat(f.id)}
                        >
                          <div className="flex items-center gap-2">
                            <f.icon className="w-4 h-4 text-slate-500" />
                            <span className="text-[11px] font-semibold">{f.label}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5 ml-6">{f.desc}</div>
                        </button>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px]">Incluir fuentes de radiacion</Label>
                        <Switch checked={includeSources} onCheckedChange={setIncludeSources} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px]">Espesor paredes (m)</Label>
                        <Input value={wallThickness} onChange={e => setWallThickness(e.target.value)} className="h-7 w-20 text-xs" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px]">Altura techo (m)</Label>
                        <Input value={ceilingHeight} onChange={e => setCeilingHeight(e.target.value)} className="h-7 w-20 text-xs" />
                      </div>
                    </div>

                    <Button size="sm" className="w-full text-xs" onClick={handleExport}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Exportar {format.toUpperCase()}
                    </Button>
                  </div>

                  {/* Format info */}
                  <div className="bg-slate-50 rounded-lg p-3 border text-[11px] space-y-2">
                    <div className="font-semibold text-slate-700">Compatibilidad del formato</div>
                    {format === 'glb' && (
                      <div className="space-y-1.5 text-slate-600">
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Unreal Engine 5 (plugin)</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Unity (URP/HDRP)</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Enscape Asset Library</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> SketchUp 2021+</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Three.js / Web</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Blender 2.80+</div>
                      </div>
                    )}
                    {format === 'fbx' && (
                      <div className="space-y-1.5 text-slate-600">
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Autodesk Maya / 3ds Max</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Autodesk Revit (Link FBX)</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Autodesk Viewer (Forge)</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Navisworks</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Unreal Engine (Importer)</div>
                      </div>
                    )}
                    {format === 'usda' && (
                      <div className="space-y-1.5 text-slate-600">
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Unreal Engine 5 (native)</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> NVIDIA Omniverse</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Rhino 7+ (USD import)</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Houdini</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Cinema 4D</div>
                      </div>
                    )}
                    {format === 'obj' && (
                      <div className="space-y-1.5 text-slate-600">
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Cualquier software 3D</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Rhinoceros 3D</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> SketchUp (via import)</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> MeshLab</div>
                      </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[10px] text-amber-700 mt-2">
                      <strong>Nota:</strong> Los materiales se exportan como colores por vertice. En el software destino, asigne materiales PBR (Physically Based Rendering) para visualizacion fotorealista.
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ═══ CONNECTORS ═══ */}
            <TabsContent value="connectors" className="mt-0 h-full m-0">
              <ScrollArea className="h-full px-5 py-4">
                <div className="grid grid-cols-3 gap-3">
                  {/* Connector selection */}
                  <div className="col-span-1 space-y-2">
                    {Object.entries(CONNECTORS).map(([key, info]) => (
                      <button
                        key={key}
                        className={`w-full p-2.5 rounded-lg border text-left transition-all ${
                          selectedConnector === key ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedConnector(key)}
                      >
                        <div className="text-[11px] font-semibold">{info.name}</div>
                        <div className="text-[9px] text-slate-400">{info.supportedFormats.join(', ')}</div>
                      </button>
                    ))}
                  </div>

                  {/* Connector detail */}
                  {connector && (
                    <div className="col-span-2 space-y-3">
                      <div className="bg-slate-50 rounded-lg p-3 border">
                        <div className="text-sm font-bold text-slate-800">{connector.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{connector.description}</div>
                        <div className="flex gap-1 mt-1.5">
                          {connector.supportedFormats.map(f => (
                            <Badge key={f} variant="outline" className="text-[9px] h-4">{f}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold text-slate-700">Pasos de configuracion</div>
                        {connector.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-2 text-[11px]">
                            <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</span>
                            <span className="text-slate-600 pt-0.5">{step}</span>
                          </div>
                        ))}
                      </div>

                      <Button size="sm" variant="outline" className="text-[11px] gap-1" onClick={() => window.open(connector.setupUrl, '_blank')}>
                        <ExternalLink className="w-3.5 h-3.5" /> Sitio oficial de {connector.name}
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ═══ SETTINGS ═══ */}
            <TabsContent value="settings" className="mt-0 h-full m-0">
              <ScrollArea className="h-full px-5 py-4">
                <div className="space-y-4 max-w-md">
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                    <div className="text-[12px] font-semibold text-violet-800 flex items-center gap-1.5">
                      <Box className="w-4 h-4" /> Real-Time 3D Design Exploration v29
                    </div>
                    <div className="text-[11px] text-violet-600 mt-1">
                      Motor de exportacion 3D nativo con soporte para glTF 2.0, FBX, USD y OBJ. 
                      Compatible con Unreal Engine 5, Unity, Enscape, Rhino, Autodesk Viewer y SketchUp.
                    </div>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between"><span className="text-slate-500">Formatos soportados:</span><strong>glTF, glB, FBX, USD, OBJ</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Conectores:</span><strong>Enscape, Rhino, Autodesk, SketchUp, UE5, Unity</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Materiales por barrera:</span><strong>7 tipos con colores</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Render 3D:</span><strong>Three.js WebGL 2.0</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Iluminacion:</span><strong>PBR + shadow mapping</strong></div>
                  </div>

                  <Separator />

                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div><strong>Atajos en preview 3D:</strong></div>
                    <div>• Orbit: Click izquierdo + arrastrar</div>
                    <div>• Zoom: Rueda del mouse</div>
                    <div>• Pan: Click derecho + arrastrar</div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
