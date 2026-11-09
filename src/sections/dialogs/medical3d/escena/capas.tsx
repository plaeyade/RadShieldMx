import { useMemo } from 'react';
import { Box, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Medical3DMode, MedicalScene } from '@/lib/medical3D/sceneBuilder';
import type { F147InspectionStation } from '@/lib/f147Medical3DInspection';
import type { InspectionTarget } from '../constantes';
import { SurfaceMaterial } from './materiales';

export function ZoneOverlays({
  scene,
  visible,
  onInspect,
}: {
  scene: MedicalScene;
  visible: boolean;
  onInspect?: (target: InspectionTarget) => void;
}) {
  if (!visible) return null;
  return (
    <>
      {scene.zones.map((zone) => {
        const shape = new THREE.Shape(zone.points.map((point) => new THREE.Vector2(point[0], point[2])));
        return (
          <group key={zone.id}>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.018, 0]}
              onClick={(event) => {
                event.stopPropagation();
                onInspect?.({
                  type: 'zone',
                  id: zone.id,
                  title: zone.name,
                  details: [
                    zone.controlled ? 'Zona controlada/restringida' : 'Zona ocupada',
                    `Vertices: ${zone.points.length}`,
                  ],
                });
              }}
            >
              <shapeGeometry args={[shape]} />
              <meshBasicMaterial color={zone.color} transparent opacity={zone.controlled ? 0.24 : 0.16} side={THREE.DoubleSide} />
            </mesh>
            <Html position={zone.center} center distanceFactor={8}>
              <div className="rounded border bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow">
                {zone.name}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

export function DoseOverlays({ scene, visible }: { scene: MedicalScene; visible: boolean }) {
  if (!visible) return null;
  return (
    <>
      {/* Fase 3: celdas del motor de campo (doseFieldEngine), color por nivel NCRP 147/151. */}
      {scene.dosePoints.map((point) => (
        <mesh key={point.id} position={point.position} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[point.radius * 2, point.radius * 2]} />
          <meshBasicMaterial color={point.nivel === 'controlada' ? '#ef4444' : point.nivel === 'supervisada' ? '#f59e0b' : '#22c55e'} transparent opacity={point.intensity} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

export function MaterialBands({ scene, visible }: { scene: MedicalScene; visible: boolean }) {
  if (!visible) return null;
  const maxThickness = Math.max(1, ...scene.walls.map((wall) => wall.requiredThickness_mm || 0));
  return (
    <group data-testid="f363-three-material-bands">
      {scene.walls.map((wall) => {
        const thickness = wall.requiredThickness_mm || 0;
        const ratio = THREE.MathUtils.clamp(thickness / maxThickness, 0.12, 1);
        const color = wall.barrierType === 'primary' ? '#ef4444' : wall.barrierType === 'secondary' ? '#f59e0b' : '#38bdf8';
        return (
          <group key={`band-${wall.id}`} position={wall.center} rotation={[0, wall.rotationY, 0]}>
            <Box args={[wall.size[0], 0.055, 0.045]} position={[0, wall.size[1] / 2 + 0.08, wall.size[2] / 2 + 0.035]}>
              <meshBasicMaterial color={color} transparent opacity={0.32 + ratio * 0.36} />
            </Box>
            <Box args={[Math.max(0.16, wall.size[0] * ratio), 0.065, 0.055]} position={[-wall.size[0] * (1 - ratio) / 2, wall.size[1] / 2 + 0.17, wall.size[2] / 2 + 0.04]}>
              <meshBasicMaterial color={color} transparent opacity={0.68} />
            </Box>
          </group>
        );
      })}
    </group>
  );
}

export function EquipmentFootprints({ scene, visible }: { scene: MedicalScene; visible: boolean }) {
  if (!visible) return null;
  return (
    <group data-testid="f363-three-equipment-footprints">
      {scene.equipment.map((item) => (
        <group key={`footprint-${item.id}`} position={[item.position[0], 0.022, item.position[2]]} rotation={[-Math.PI / 2, 0, item.rotationY]}>
          <planeGeometry args={[item.footprint_m[0], item.footprint_m[1]]} />
          <meshBasicMaterial color="#0ea5e9" transparent opacity={0.14} side={THREE.DoubleSide} />
        </group>
      ))}
    </group>
  );
}

export function BeamGuides({ scene, visible }: { scene: MedicalScene; visible: boolean }) {
  if (!visible) return null;
  return (
    <group data-testid="f363-three-beam-guides">
      {scene.equipment.map((item) => {
        if (!['linac', 'gammaKnife', 'radiofarmacia'].includes(item.kind)) return null;
        const beamColor = item.kind === 'linac' ? '#38bdf8' : item.kind === 'gammaKnife' ? '#818cf8' : '#f97316';
        const beamLength = item.kind === 'radiofarmacia' ? 1.8 : 2.8;
        return (
          <group key={`beam-${item.id}`} position={[item.position[0], 1.12, item.position[2]]} rotation={[Math.PI / 2, 0, item.rotationY]}>
            <coneGeometry args={[item.kind === 'gammaKnife' ? 0.72 : 0.34, beamLength, 48, 1, true]} />
            <meshBasicMaterial color={beamColor} transparent opacity={item.kind === 'radiofarmacia' ? 0.1 : 0.16} side={THREE.DoubleSide} />
          </group>
        );
      })}
    </group>
  );
}

export function PhotorealDecals({ scene, visible }: { scene: MedicalScene; visible: boolean }) {
  if (!visible) return null;
  const doorWall = scene.walls.find((wall) => wall.name.toLowerCase().includes('door') || wall.name.toLowerCase().includes('puerta')) || scene.walls[0];
  const primaryWall = scene.walls.find((wall) => wall.barrierType === 'primary') || scene.walls[0];
  const firstEquipment = scene.equipment[0];
  return (
    <group data-testid="f481-photoreal-decals">
      {doorWall && (
        <Html position={[doorWall.center[0], Math.min(doorWall.size[1] + 0.42, 3), doorWall.center[2]]} center distanceFactor={7}>
          <div className="rounded border border-amber-300 bg-amber-50/95 px-2 py-1 text-[10px] font-bold text-amber-900 shadow">
            RADIACION / ACCESO CONTROLADO
          </div>
        </Html>
      )}
      {primaryWall && (
        <Html position={[primaryWall.center[0], primaryWall.size[1] + 0.36, primaryWall.center[2]]} center distanceFactor={7}>
          <div className="rounded border border-red-200 bg-white/95 px-2 py-1 text-[10px] font-semibold text-red-700 shadow">
            Barrera primaria / espesor visible
          </div>
        </Html>
      )}
      {firstEquipment && (
        <Html position={[firstEquipment.position[0], 1.82, firstEquipment.position[2]]} center distanceFactor={7}>
          <div className="rounded border border-sky-200 bg-sky-50/95 px-2 py-1 text-[10px] font-semibold text-sky-800 shadow">
            Footprint equipo / isocentro
          </div>
        </Html>
      )}
      {scene.zones.slice(0, 2).map((zone) => (
        <Html key={`decal-zone-${zone.id}`} position={[zone.center[0], 0.18, zone.center[2]]} center distanceFactor={8}>
          <div className="rounded border border-violet-200 bg-violet-50/95 px-2 py-1 text-[10px] font-semibold text-violet-800 shadow">
            Zona {zone.controlled ? 'controlada' : 'ocupacion'}
          </div>
        </Html>
      ))}
    </group>
  );
}

export function RoomRulers({ scene, visible }: { scene: MedicalScene; visible: boolean }) {
  if (!visible) return null;
  const [cx, , cz] = scene.bounds.center;
  const y = 0.055;
  const z = cz + scene.bounds.depth / 2 + 0.25;
  const x = cx - scene.bounds.width / 2 - 0.25;
  return (
    <group data-testid="f363-three-room-rulers">
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              cx - scene.bounds.width / 2, y, z,
              cx + scene.bounds.width / 2, y, z,
              x, y, cz - scene.bounds.depth / 2,
              x, y, cz + scene.bounds.depth / 2,
            ]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#0f172a" transparent opacity={0.55} />
      </lineSegments>
      <Html position={[cx, 0.2, z + 0.12]} center distanceFactor={9}>
        <div className="rounded border bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow">
          {scene.bounds.width.toFixed(1)} m
        </div>
      </Html>
      <Html position={[x - 0.16, 0.2, cz]} center distanceFactor={9}>
        <div className="rounded border bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow">
          {scene.bounds.depth.toFixed(1)} m
        </div>
      </Html>
    </group>
  );
}

export function RouteSegment({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const start = useMemo(() => new THREE.Vector3(from[0], 0.09, from[2]), [from]);
  const end = useMemo(() => new THREE.Vector3(to[0], 0.09, to[2]), [to]);
  const middle = useMemo(() => start.clone().add(end).multiplyScalar(0.5), [end, start]);
  const direction = useMemo(() => end.clone().sub(start), [end, start]);
  const length = Math.max(direction.length(), 0.01);
  const quaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()),
    [direction],
  );

  return (
    <mesh position={middle.toArray()} quaternion={quaternion}>
      <cylinderGeometry args={[0.025, 0.025, length, 12]} />
      <meshBasicMaterial color="#0f766e" transparent opacity={0.62} />
    </mesh>
  );
}

export function InspectionRoute({
  stations,
  visible,
  activeStationId,
}: {
  stations: F147InspectionStation[];
  visible: boolean;
  activeStationId?: string | null;
}) {
  if (!visible || stations.length === 0) return null;
  return (
    <group data-testid="f364-three-inspection-route">
      {stations.slice(0, -1).map((station, index) => (
        <RouteSegment key={`route-${station.id}`} from={station.position} to={stations[index + 1].position} />
      ))}
      {stations.map((station, index) => {
        const isActive = activeStationId === station.id;
        return (
          <group key={`station-marker-${station.id}`} position={[station.position[0], 0.12, station.position[2]]}>
            <mesh>
              <cylinderGeometry args={[isActive ? 0.2 : 0.14, isActive ? 0.2 : 0.14, 0.08, 24]} />
              <meshBasicMaterial color={isActive ? '#f97316' : '#14b8a6'} transparent opacity={0.82} />
            </mesh>
            <Html position={[0, 0.42, 0]} center distanceFactor={7}>
              <div className={`rounded border px-2 py-1 text-[10px] font-semibold shadow ${isActive ? 'border-orange-200 bg-orange-50 text-orange-900' : 'border-teal-200 bg-white/95 text-teal-900'}`}>
                {index + 1}. {station.label}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export function ClinicalFixtures({ scene, mode }: { scene: MedicalScene; mode: Medical3DMode }) {
  const [cx, , cz] = scene.bounds.center;
  const halfWidth = scene.bounds.width / 2;
  const halfDepth = scene.bounds.depth / 2;
  const leftX = cx - halfWidth + 0.35;
  const backZ = cz - halfDepth + 0.35;
  const frontZ = cz + halfDepth - 0.35;
  const rightX = cx + halfWidth - 0.35;

  return (
    <group>
      <Box args={[1.05, 2.15, 0.08]} position={[leftX + 0.55, 1.08, frontZ]} castShadow>
        <meshStandardMaterial color="#64748b" roughness={0.5} metalness={0.18} />
      </Box>
      <Box args={[1.2, 0.72, 0.07]} position={[rightX, 1.55, cz - 0.8]} castShadow>
        <SurfaceMaterial kind="glass" color="#93c5bd" roughness={0.18} metalness={0.02} opacity={0.72} />
      </Box>
      <Box args={[1.55, 0.85, 0.55]} position={[rightX - 0.25, 0.52, cz + 1.1]} castShadow>
        <meshStandardMaterial color="#e2e8f0" roughness={0.42} />
      </Box>
      <Box args={[0.72, 0.42, 0.08]} position={[rightX - 0.25, 1.03, cz + 0.84]} castShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.18} emissive="#0f766e" emissiveIntensity={0.16} />
      </Box>
      <mesh position={[leftX + 0.22, 2.45, backZ + 0.22]}>
        <sphereGeometry args={[0.12, 18, 12]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={mode === 'dose' ? 0.8 : 0.36} />
      </mesh>
      {[cx - 2.4, cx, cx + 2.4].map((x) => (
        <group key={`ceiling-light-${x}`} position={[x, 3.03, cz]}>
          <Box args={[1.15, 0.035, 0.28]} receiveShadow>
            <meshStandardMaterial color="#f8fafc" emissive="#e0f2fe" emissiveIntensity={0.45} />
          </Box>
          <pointLight intensity={0.18} distance={4.2} color="#e0f2fe" />
        </group>
      ))}
    </group>
  );
}
