// =============================================================================
// DoseMapping3D.tsx — Advanced 3D Dose Mapping with Virtual Detector Mesh
// Particle types: photons, electrons, positrons, neutrons
// Legal radiological zoning, merge mappings
// Fase 5 (docs/plan-motores-calculo.md): por omisión mapea el PLANO DEL LIENZO (fuentes, barreras y escala
// reales) con `meshDoseMapping3D` (visoresDosis → doseFieldEngine); la sala sintética de la Fase 3 queda como
// opción. Tasa media = kerma semanal / 40 h. Sigue inactivo tras `VISOR_DOSE_MAPPING_3D` hasta que se autorice.
// =============================================================================
import { Suspense, useMemo, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html, Instances, Instance } from '@react-three/drei';
import { BoxGeometry } from 'three';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import '@/components/ui/scroll-area';
import '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Box, Merge, Atom, Zap, RotateCcw, Shield
} from 'lucide-react';
import {
  PARTICLE_TYPES, RADIOLOGICAL_ZONES,
  generateDetectorMesh, mergeMappings, computeMeshStats,
  type ParticleType, type DetectorMesh, type MergedMapping,
} from '@/lib/doseMappingEngine';
import { meshDoseMapping3D, HORAS_OPERACION_SEMANA } from '@/lib/visoresDosis';
import { useCanvasStore } from '@/stores/canvasStore';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

interface DoseMappingStats {
  voxelCount: number;
  maxDose_uSv_h: number;
  minDose_uSv_h: number;
  avgDose_uSv_h: number;
  medianDose_uSv_h: number;
  zoneDistribution: Record<string, number>;
  volume_m3: number;
  resolution: number;
}

function isMergedMapping(mesh: DetectorMesh | MergedMapping): mesh is MergedMapping {
  return 'sources' in mesh;
}

// Jet colormap
function jetColor(v: number): [number, number, number] {
  v = Math.max(0, Math.min(1, v));
  let r = 0, g = 0, b = 0;
  if (v < 0.125) { b = 0.5 + v * 4; }
  else if (v < 0.375) { g = (v - 0.125) * 4; b = 1; }
  else if (v < 0.625) { r = (v - 0.375) * 4; g = 1; b = 1 - (v - 0.375) * 4; }
  else if (v < 0.875) { r = 1; g = 1 - (v - 0.625) * 4; }
  else { r = 1; g = (v - 0.875) * 2; }
  return [r, g, b];
}

function ZoneVoxels({ mesh, showZones }: { mesh: DetectorMesh | MergedMapping; showZones: boolean }) {
  const instances = useMemo(() => {
    const maxDose = Math.max(...mesh.voxels.map(v => v.doseRate_uSv_h), 0.001);
    return mesh.voxels
      .filter(v => v.doseRate_uSv_h > maxDose * 0.001) // filter near-zero
      .map(v => {
        const zone = RADIOLOGICAL_ZONES.find(z => z.id === v.zone);
        const normDose = v.doseRate_uSv_h / maxDose;
        const [jr, jg, jb] = jetColor(normDose);
        const isZoneMode = showZones;
        const zc = zone?.color || '#666';
        const zr = parseInt(zc.slice(1, 3), 16) / 255;
        const zg = parseInt(zc.slice(3, 5), 16) / 255;
        const zb = parseInt(zc.slice(5, 7), 16) / 255;
        return {
          position: [v.x, v.y, v.z] as [number, number, number],
          scale: 0.15 + normDose * 0.25,
          color: isZoneMode ? [zr, zg, zb] as [number, number, number] : [jr, jg, jb] as [number, number, number],
        };
      });
  }, [mesh, showZones]);

  return (
    <Instances limit={10000} range={instances.length}>
      <boxGeometry />
      <meshStandardMaterial roughness={0.4} metalness={0.1} transparent opacity={0.85} />
      {instances.map((inst, i) => (
        <Instance key={i} position={inst.position} scale={inst.scale} color={inst.color} />
      ))}
    </Instances>
  );
}

function Scene({ mesh, showZones }: { mesh: DetectorMesh | MergedMapping; showZones: boolean }) {
  const source = 'sourcePosition' in mesh ? mesh.sourcePosition : mesh.sources[0]?.position;
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1} castShadow />
      <pointLight position={[source?.x || 0, 2, source?.z || 0]} intensity={0.6} color="#ff4444" />

      <Grid position={[mesh.dimensions.x / 2, 0, mesh.dimensions.z / 2]}
        args={[mesh.dimensions.x + 2, mesh.dimensions.z + 2]}
        cellSize={1} cellThickness={0.2} cellColor="#888"
        sectionSize={5} sectionThickness={0.6} sectionColor="#555"
      />

      <ZoneVoxels mesh={mesh} showZones={showZones} />

      {/* Source marker */}
      {source && (
        <group position={[source.x, 1, source.z]}>
          <mesh>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} />
          </mesh>
          {/* Fase 8: <Text> de drei (troika) descarga la fuente de un CDN y fallaba sin red («Failed to fetch»). */}
          <Html position={[0, 0.6, 0]} center><span style={{ color: '#f00', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>FUENTE</span></Html>
        </group>
      )}

      {/* Room boundary */}
      <lineSegments position={[mesh.dimensions.x / 2, mesh.dimensions.y / 2, mesh.dimensions.z / 2]}>
        <edgesGeometry args={[new BoxGeometry(mesh.dimensions.x, mesh.dimensions.y, mesh.dimensions.z)]} />
        <lineBasicMaterial color="#444" transparent opacity={0.3} />
      </lineSegments>

      <OrbitControls target={[mesh.dimensions.x / 2, 1.5, mesh.dimensions.z / 2]} maxPolarAngle={Math.PI / 2} minDistance={2} maxDistance={30} />
    </>
  );
}

export default function DoseMapping3D({ open, onOpenChange }: Props) {
  const floorPlan = useCanvasStore((st) => st.floorPlan);
  const [origen, setOrigen] = useState<'plano' | 'sintetica'>('plano');
  const [particleType, setParticleType] = useState<ParticleType>('photon');
  const [activity_GBq, setActivity_GBq] = useState('3.7');
  const [roomX, setRoomX] = useState('6');
  const [roomY, setRoomY] = useState('3');
  const [roomZ, setRoomZ] = useState('5');
  const [resolution, setResolution] = useState('30');
  const [shieldCm, setShieldCm] = useState('0');
  const [shieldMat, setShieldMat] = useState('none');
  const [showZones, setShowZones] = useState(false);
  const [meshes, setMeshes] = useState<DetectorMesh[]>([]);
  const [merged, setMerged] = useState<MergedMapping | null>(null);
  const [activeTab, setActiveTab] = useState('single');

  const computeMesh = useCallback(() => {
    if (origen === 'plano') {
      const mesh = meshDoseMapping3D(floorPlan);
      if (!mesh.voxels.length) { toast.error(mesh.nota ?? 'El plano no tiene fuentes: agrega una fuente en el lienzo.'); return null; }
      setMeshes(prev => [...prev, mesh]);
      setMerged(null);
      toast.success(`Malla del plano: ${mesh.voxels.length} vóxeles (motor de campo)`);
      return mesh;
    }
    const mesh = generateDetectorMesh(
      particleType,
      { x: parseFloat(roomX) / 2, y: 1.5, z: parseFloat(roomZ) / 2 },
      parseFloat(activity_GBq) || 1,
      { x: parseFloat(roomX), y: parseFloat(roomY), z: parseFloat(roomZ) },
      parseInt(resolution) || 30,
      parseFloat(shieldCm) || 0,
      shieldMat,
    );
    if (mesh.nota) { toast.error(mesh.nota); return null; }
    setMeshes(prev => [...prev, mesh]);
    setMerged(null);
    toast.success(`Mesh computed: ${mesh.voxels.length} voxels for ${particleType}s`);
    return mesh;
  }, [origen, floorPlan, particleType, activity_GBq, roomX, roomY, roomZ, resolution, shieldCm, shieldMat]);

  const handleMerge = useCallback(() => {
    if (meshes.length < 2) { toast.error('Need at least 2 meshes to merge'); return; }
    const mergedResult = mergeMappings(meshes);
    setMerged(mergedResult);
    toast.success(`Merged ${meshes.length} mappings with ${mergedResult.voxels.length} voxels`);
  }, [meshes]);

  const clearMeshes = useCallback(() => {
    setMeshes([]);
    setMerged(null);
    toast.success('All meshes cleared');
  }, []);

  const currentMesh = merged || (meshes.length > 0 ? meshes[meshes.length - 1] : null);
  const stats = useMemo<DoseMappingStats | null>(() => {
    if (!currentMesh) return null;
    if (!isMergedMapping(currentMesh)) {
      return computeMeshStats(currentMesh);
    }
    return {
      voxelCount: currentMesh.voxels.length,
      maxDose_uSv_h: currentMesh.maxDose_uSv_h,
      minDose_uSv_h: 0,
      avgDose_uSv_h: currentMesh.avgDose_uSv_h,
      medianDose_uSv_h: 0,
      zoneDistribution: currentMesh.zoneDistribution,
      volume_m3: currentMesh.dimensions.x * currentMesh.dimensions.y * currentMesh.dimensions.z,
      resolution: 30,
    };
  }, [currentMesh]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Box className="h-5 w-5 text-violet-500" />
            3D Dose Mapping — Virtual Detector Mesh
            <Badge variant="outline" className="text-[10px]">Three.js</Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Photons, electrons, positrons, neutrons — with legal radiological zoning (ICRP 103)
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single"><Atom className="h-3.5 w-3.5 mr-1" />Single Mapping</TabsTrigger>
            <TabsTrigger value="merge"><Merge className="h-3.5 w-3.5 mr-1" />Merge ({meshes.length})</TabsTrigger>
            <TabsTrigger value="zones"><Shield className="h-3.5 w-3.5 mr-1" />Zoning</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-3 mt-2">
            <div className="flex items-center gap-2 text-xs">
              <Label className="text-xs">Origen</Label>
              <Select value={origen} onValueChange={(v) => setOrigen(v as 'plano' | 'sintetica')}>
                <SelectTrigger className="h-8 text-xs w-56" data-testid="dose3d-origen"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="plano">Plano del lienzo (motor de campo)</SelectItem>
                  <SelectItem value="sintetica">Sala sintética (fuente 511 keV)</SelectItem>
                </SelectContent>
              </Select>
              {origen === 'plano' && (
                <span className="text-muted-foreground" data-testid="dose3d-plano-info">
                  {floorPlan.sources.length} fuente(s), {floorPlan.barriers.length} barrera(s); tasa media = kerma semanal / {HORAS_OPERACION_SEMANA} h
                </span>
              )}
            </div>
            {origen === 'sintetica' && <div className="grid grid-cols-5 gap-2">
              <div>
                <Label className="text-xs">Particle</Label>
                <Select value={particleType} onValueChange={(v) => setParticleType(v as ParticleType)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PARTICLE_TYPES.map(p => (
                      <SelectItem key={p.type} value={p.type}>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.symbol} {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Activity (GBq)</Label>
                <Input type="number" value={activity_GBq} onChange={e => setActivity_GBq(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Room (m) X×Y×Z</Label>
                <div className="flex gap-1">
                  <Input value={roomX} onChange={e => setRoomX(e.target.value)} className="h-8 text-xs w-12" />
                  <Input value={roomY} onChange={e => setRoomY(e.target.value)} className="h-8 text-xs w-12" />
                  <Input value={roomZ} onChange={e => setRoomZ(e.target.value)} className="h-8 text-xs w-12" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Res (cm)</Label>
                <Input type="number" value={resolution} onChange={e => setResolution(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Shield (cm)</Label>
                <div className="flex gap-1">
                  <Input type="number" value={shieldCm} onChange={e => setShieldCm(e.target.value)} className="h-8 text-xs w-14" />
                  <Select value={shieldMat} onValueChange={setShieldMat}>
                    <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="concrete">Concrete</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="steel">Steel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>}
            <div className="flex gap-2">
              <Button size="sm" onClick={computeMesh} className="flex-1"><Zap className="h-3.5 w-3.5 mr-1" />Compute Mesh</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowZones(!showZones); }}>
                <Shield className="h-3.5 w-3.5 mr-1" />{showZones ? 'Dose' : 'Zones'}
              </Button>
              <Button size="sm" variant="ghost" onClick={clearMeshes}><RotateCcw className="h-3.5 w-3.5" /></Button>
            </div>
          </TabsContent>

          <TabsContent value="merge" className="space-y-3 mt-2">
            <div className="flex gap-2 items-center">
              <Button size="sm" onClick={handleMerge} disabled={meshes.length < 2} className="flex-1">
                <Merge className="h-3.5 w-3.5 mr-1" />Merge All Mappings
              </Button>
              <Button size="sm" variant="outline" onClick={clearMeshes}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />Clear
              </Button>
            </div>
            {meshes.length === 0 && <p className="text-sm text-muted-foreground">No mappings yet. Compute at least 2 to merge.</p>}
            <div className="space-y-1 max-h-24 overflow-auto">
              {meshes.map((m, i) => {
                const p = PARTICLE_TYPES.find(pt => pt.type === m.particleType);
                return (
                  <div key={i} className="flex items-center justify-between text-xs bg-muted p-1.5 rounded">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p?.color }} />
                      #{i + 1} {p?.symbol} — {m.voxels.length} voxels
                    </span>
                    <span className="text-muted-foreground">{m.shieldMaterial === 'plano' ? 'Plano del lienzo' : m.shieldThickness_cm > 0 ? `${m.shieldThickness_cm}cm ${m.shieldMaterial}` : 'No shield'}</span>
                  </div>
                );
              })}
            </div>
            {merged && (
              <Card className="bg-emerald-50 dark:bg-emerald-950/30">
                <CardContent className="pt-3 text-sm">
                  <p className="font-medium text-emerald-800 dark:text-emerald-200">Merged Result</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {merged.sources.length} sources | Max: {merged.maxDose_uSv_h.toFixed(2)} uSv/h |
                    Avg: {merged.avgDose_uSv_h.toFixed(2)} uSv/h
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="zones" className="space-y-2 mt-2">
            <div className="grid grid-cols-2 gap-2">
              {RADIOLOGICAL_ZONES.map(zone => (
                <Card key={zone.id} style={{ borderLeftColor: zone.color, borderLeftWidth: 4 }}>
                  <CardContent className="pt-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                      <p className="text-sm font-medium">{zone.nameEs}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{zone.description}</p>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span><strong>&lt;{zone.doseRateLimit_uSv_h === Infinity ? '∞' : zone.doseRateLimit_uSv_h}</strong> uSv/h</span>
                      <span><strong>{zone.annualLimit_mSv === Infinity ? '∞' : zone.annualLimit_mSv}</strong> mSv/a</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* 3D Canvas */}
        <div className="flex-1 min-h-[400px] border rounded bg-black relative mx-6 mb-2">
          {currentMesh ? (
            <Canvas camera={{ position: [8, 6, 8], fov: 55 }}>
              <Suspense fallback={null}>
                <Scene mesh={currentMesh} showZones={showZones} />
              </Suspense>
            </Canvas>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Box className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Configure parameters and click "Compute Mesh"</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="px-6 pb-2">
            <div className="grid grid-cols-5 gap-2 text-xs">
              <div className="bg-muted p-2 rounded text-center">
                <p className="text-muted-foreground">Voxels</p>
                <p className="font-semibold font-mono">{stats.voxelCount.toLocaleString()}</p>
              </div>
              <div className="bg-muted p-2 rounded text-center">
                <p className="text-muted-foreground">Max Dose</p>
                <p className="font-semibold font-mono">{stats.maxDose_uSv_h.toFixed(2)} uSv/h</p>
              </div>
              <div className="bg-muted p-2 rounded text-center">
                <p className="text-muted-foreground">Avg Dose</p>
                <p className="font-semibold font-mono">{stats.avgDose_uSv_h.toFixed(2)} uSv/h</p>
              </div>
              <div className="bg-muted p-2 rounded text-center">
                <p className="text-muted-foreground">Volume</p>
                <p className="font-semibold font-mono">{stats.volume_m3.toFixed(1)} m3</p>
              </div>
              <div className="bg-muted p-2 rounded text-center">
                <p className="text-muted-foreground">Resolution</p>
                <p className="font-semibold font-mono">{stats.resolution} cm</p>
              </div>
            </div>

            {/* Zone Legend */}
            {stats.zoneDistribution && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {Object.entries(stats.zoneDistribution).map(([zoneId, count]) => {
                  const zone = RADIOLOGICAL_ZONES.find(z => z.id === zoneId);
                  const pct = stats.voxelCount > 0 ? (count / stats.voxelCount * 100).toFixed(1) : '0';
                  return zone ? (
                    <div key={zoneId} className="flex items-center gap-1 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
                      <span>{zone.nameEs}: {pct}%</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}

        <div className="px-6 pb-4 text-[10px] text-muted-foreground">
          <p>Controls: Orbit=drag | Zoom=wheel | Pan=right-drag | Colors: Blue=low → Green → Yellow → Red=high</p>
          <p>Zone colors when enabled: Green=Free, Orange=Supervised, Red=Controlled, Dark Red=Excluded</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
