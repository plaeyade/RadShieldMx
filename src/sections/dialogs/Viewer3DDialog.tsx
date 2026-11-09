// Fase 6: 3D Viewer — Visualizar geometria GEANT4 generada desde plano 2D
import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html, Box } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, RotateCcw } from 'lucide-react';
import type { FloorPlan, Barrier } from '@/types/radshield';
import { MATERIALS } from '@/types/radshield';
import * as THREE from 'three';

interface Viewer3DDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floorPlan: FloorPlan;
}

// Barrier wall as 3D box
function BarrierWall({ barrier, scale, color }: { barrier: Barrier; scale: number; color: string }) {
  const dx = barrier.x2 - barrier.x1;
  const dy = barrier.y2 - barrier.y1;
  const length_px = Math.sqrt(dx * dx + dy * dy);
  const length_m = length_px * scale;
  const thickness_m = (barrier.requiredThickness_mm && Object.values(barrier.requiredThickness_mm)[0])
    ? Object.values(barrier.requiredThickness_mm)[0]! / 1000 : 0.2;

  const midX = (barrier.x1 + barrier.x2) / 2 * scale;
  const midY = (barrier.y1 + barrier.y2) / 2 * scale;
  const angle = Math.atan2(dy, dx);

  return (
    <group position={[midX, thickness_m / 2, midY]} rotation={[0, -angle, 0]}>
      <Box args={[length_m, 3.0, thickness_m]}>
        <meshStandardMaterial color={color} transparent opacity={0.7} />
      </Box>
      {/* Edge lines */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(length_m, 3.0, thickness_m)]} />
        <lineBasicMaterial color="#333333" />
      </lineSegments>
    </group>
  );
}

// Source as glowing sphere
function SourceMarker({ x, y, scale, name }: { x: number; y: number; scale: number; name: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + 0.1 * Math.sin(clock.elapsedTime * 3);
      ref.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={[x * scale, 1.5, y * scale]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
      {/* <Html> en lugar de <Text>: troika descargaba la fuente de un CDN (falla sin red). */}
      <Html position={[0, 0.4, 0]} center><span style={{ color: '#000', fontSize: 11, whiteSpace: 'nowrap' }}>{name}</span></Html>
      {/* Radiation beam indicator */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ff4444" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Scene with all elements
function Scene3D({ floorPlan }: { floorPlan: FloorPlan }) {
  const barriers = useMemo(() => floorPlan.barriers, [floorPlan.barriers]);
  const sources = useMemo(() => floorPlan.sources, [floorPlan.sources]);
  const scale = floorPlan.scale_m_per_pixel;

  // Calculate world bounds
  const bounds = useMemo(() => {
    let minX = 0, maxX = 10, minY = 0, maxY = 10;
    [...barriers, ...sources].forEach(item => {
      const x = ('x1' in item) ? (item.x1 + item.x2) / 2 : item.x;
      const y = ('y1' in item) ? (item.y1 + item.y2) / 2 : item.y;
      minX = Math.min(minX, x * scale); maxX = Math.max(maxX, x * scale);
      minY = Math.min(minY, y * scale); maxY = Math.max(maxY, y * scale);
    });
    return { minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cz: (minY + maxY) / 2 };
  }, [barriers, sources, scale]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[bounds.cx, 5, bounds.cz]} intensity={0.5} />

      {/* Floor grid */}
      <Grid
        position={[bounds.cx, 0, bounds.cz]}
        args={[Math.max(bounds.maxX - bounds.minX + 5, 20), Math.max(bounds.maxY - bounds.minY + 5, 20)]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#cccccc"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#aaaaaa"
        fadeDistance={30}
      />

      {/* Barriers */}
      {barriers.map((b) => (
        <BarrierWall
          key={b.id}
          barrier={b}
          scale={scale}
          color={b.barrierType === 'primary' ? '#EF4444' : b.barrierType === 'secondary' ? '#F59E0B' : '#6B7280'}
        />
      ))}

      {/* Sources */}
      {sources.map(s => (
        <SourceMarker key={s.id} x={s.x} y={s.y} scale={scale} name={s.name} />
      ))}

      {/* Floor plan image as plane if available */}
      {floorPlan.imageUrl && (
        <mesh position={[bounds.cx, -0.01, bounds.cz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[bounds.maxX - bounds.minX + 2, bounds.maxY - bounds.minY + 2]} />
          <meshStandardMaterial color="#f0f0f0" transparent opacity={0.3} />
        </mesh>
      )}

      <OrbitControls
        target={[bounds.cx, 1, bounds.cz]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={2}
        maxDistance={50}
      />
    </>
  );
}

// Export GEANT4-style geometry description
function exportGEANT4Geometry(floorPlan: FloorPlan): string {
  const scale = floorPlan.scale_m_per_pixel;
  let macro = `# Geometria 3D generada desde RadShield-MX v1.2
# Proyecto: ${floorPlan.name}
# Fecha: ${new Date().toISOString()}
# ${floorPlan.barriers.length} barreras, ${floorPlan.sources.length} fuentes

# === MUNDO ===
/world/expr World G4Box ${floorPlan.width_pixels * scale / 1000} ${floorPlan.height_pixels * scale / 1000} 10 m

`;

  floorPlan.barriers.forEach((b, i) => {
    const dx = b.x2 - b.x1;
    const dy = b.y2 - b.y1;
    const length_m = Math.sqrt(dx * dx + dy * dy) * scale;
    const midX = (b.x1 + b.x2) / 2 * scale;
    const midY = (b.y1 + b.y2) / 2 * scale;
    const angle = Math.atan2(dy, dx);
    const matName = b.requiredThickness_mm
      ? MATERIALS.find(m => m.code === Object.entries(b.requiredThickness_mm!)[0]?.[0])?.name || 'G4_CONCRETE'
      : 'G4_CONCRETE';

    macro += `# Barrera ${i + 1}: ${b.name} (${b.barrierType})
/gate/geometry/setMaterial ${matName.replace(/\s/g, '_')}
/gate/daughters/name Barrier_${i + 1}
/gate/daughters/insert box
/gate/Barrier_${i + 1}/placement/setTranslation ${midX.toFixed(3)} 1.500 ${midY.toFixed(3)} m
/gate/Barrier_${i + 1}/geometry/setXLength ${length_m.toFixed(3)} m
/gate/Barrier_${i + 1}/geometry/setYLength 3.000 m
/gate/Barrier_${i + 1}/geometry/setZLength 0.200 m
/gate/Barrier_${i + 1}/placement/setRotationAxis 0 1 0
/gate/Barrier_${i + 1}/placement/setRotationAngle ${(-angle * 180 / Math.PI).toFixed(1)} deg

`;
  });

  return macro;
}

export default function Viewer3DDialog({ open, onOpenChange, floorPlan }: Viewer3DDialogProps) {
  const handleExportGeometry = () => {
    const macro = exportGEANT4Geometry(floorPlan);
    const blob = new Blob([macro], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Geometria3D_${floorPlan.name.replace(/\s+/g, '_')}.mac`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasGeometry = floorPlan.barriers.length > 0 || floorPlan.sources.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Visualizador 3D — Geometria GEANT4</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleExportGeometry} disabled={!hasGeometry}>
                <Download className="w-4 h-4 mr-1" />Exportar .mac
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-gray-500">
          Vista 3D de barreras y fuentes. Orbitar: click+arrastrar | Zoom: rueda | Pan: click derecho+arrastrar
          Barreras rojas = primarias, amarillas = secundarias, grises = otras. Esfera roja = fuente de radiacion.
        </p>

        <div className="w-full h-[500px] border rounded bg-black relative">
          {hasGeometry ? (
            <Canvas camera={{ position: [5, 8, 10], fov: 50 }}>
              <Suspense fallback={null}>
                <Scene3D floorPlan={floorPlan} />
              </Suspense>
            </Canvas>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay geometria para visualizar</p>
                <p className="text-xs mt-1">Agregue barreras y fuentes en el plano 2D primero</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Barreras: {floorPlan.barriers.length} | Fuentes: {floorPlan.sources.length}</span>
          <span>Escala: {floorPlan.scale_m_per_pixel.toFixed(4)} m/px</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
