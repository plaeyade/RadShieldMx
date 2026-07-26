import { Suspense, type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Html, OrbitControls } from '@react-three/drei';
import { Activity, Camera, Download, Eye, Layers, MonitorCog, Navigation, RotateCcw, Sparkles, Stethoscope, Upload } from 'lucide-react';
import * as THREE from 'three';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FloorPlan } from '@/types/radshield';
import {
  buildMedicalScene,
  medicalSceneToOBJ,
  type Medical3DMode,
  type MedicalRoomPreset,
  type MedicalScene,
} from '@/lib/medical3D/sceneBuilder';
import { importCadBimFile, type CadBimImportSummary } from '@/lib/medical3D/cadBimBridge';
import { CADX_STUDIO_EXTERNAL_NOTE, buildCadxRenderBrief } from '@/lib/cadxStudioIntegration';
import { CAD_CODE_VERIFY_EXTERNAL_NOTE, buildCadCodeVerificationPack } from '@/lib/cadCodeVerify';
import { buildF923DInspectionSummary } from '@/lib/f92RealWorkflow';
import { buildF147Medical3DInspection, type F147InspectionStation } from '@/lib/f147Medical3DInspection';
import {
  MEDICAL_3D_RENDER_STRATEGIES,
  buildMedical3DEngineHandoff,
  getMedical3DRenderStrategy,
  type Medical3DRenderEngine,
} from '@/lib/medical3D/renderStrategy';
import { buildUnityExternalViewerLaunchPacket } from '@/lib/medical3D/unityExternalViewerBridge';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floorPlan: FloorPlan;
}

const materialColors: Record<string, string> = {
  concreto: '#b8b7b1',
  concreto_baritado: '#8f8a7e',
  plomo: '#3f424b',
  acero: '#8b949e',
  tungsteno: '#57595f',
  vidrio_plomo: '#8db8b4',
  poly_borado: '#eee8cf',
  default: '#a6a6a6',
};

type TextureKind = 'floor' | 'concrete' | 'lead' | 'steel' | 'glass' | 'ceiling' | 'equipment';
type InspectionTarget =
  | { type: 'wall'; id: string; title: string; details: string[] }
  | { type: 'equipment'; id: string; title: string; details: string[] }
  | { type: 'zone'; id: string; title: string; details: string[] };

function makeProceduralTexture(kind: TextureKind) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const palettes: Record<TextureKind, [string, string, string]> = {
    floor: ['#dce7ea', '#cdd9dc', '#eef4f5'],
    concrete: ['#d0cec8', '#bcb9b1', '#e0ded8'],
    lead: ['#424854', '#303642', '#5a616d'],
    steel: ['#aeb7c0', '#8995a1', '#d3d8dd'],
    glass: ['#9ccbc8', '#d9f4f2', '#5e9f9c'],
    ceiling: ['#f8fafc', '#e5e7eb', '#ffffff'],
    equipment: ['#f8fafc', '#d7dee8', '#ffffff'],
  };
  const [base, line, highlight] = palettes[kind];

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = line;
  ctx.lineWidth = kind === 'floor' || kind === 'ceiling' ? 2 : 1;

  if (kind === 'floor' || kind === 'ceiling') {
    for (let i = 0; i <= canvas.width; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
  } else {
    for (let i = -canvas.height; i < canvas.width; i += 18) {
      ctx.beginPath();
      ctx.moveTo(i, canvas.height);
      ctx.lineTo(i + canvas.height, 0);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = highlight;
  for (let i = 0; i < 42; i += 1) {
    const x = (i * 37) % canvas.width;
    const y = (i * 53) % canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === 'floor' ? 10 : 4, kind === 'floor' ? 10 : 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function useProceduralTexture(kind: TextureKind) {
  return useMemo(() => makeProceduralTexture(kind), [kind]);
}

function SurfaceMaterial({
  kind,
  color,
  roughness = 0.55,
  metalness = 0.04,
  opacity = 1,
}: {
  kind: TextureKind;
  color: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
}) {
  const map = useProceduralTexture(kind);
  return (
    <meshStandardMaterial
      color={color}
      map={map || undefined}
      roughness={roughness}
      metalness={metalness}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

function wallColor(materialCode: string, mode: Medical3DMode) {
  if (mode === 'technical') return materialColors[materialCode] || materialColors.default;
  if (mode === 'dose') return '#64748b';
  return materialCode.includes('plomo') ? '#4b5563' : '#d7d2c8';
}

function MedicalWall({
  wall,
  mode,
  inspect,
  onInspect,
}: {
  wall: MedicalScene['walls'][number];
  mode: Medical3DMode;
  inspect: boolean;
  onInspect?: (target: InspectionTarget) => void;
}) {
  const color = wallColor(wall.materialCode, mode);
  const opacity = mode === 'presentation' ? 0.92 : 0.78;
  const materialKind: TextureKind = wall.materialCode.includes('plomo')
    ? 'lead'
    : wall.materialCode.includes('acero')
      ? 'steel'
      : wall.materialCode.includes('vidrio')
        ? 'glass'
        : 'concrete';
  return (
    <group
      position={wall.center}
      rotation={[0, wall.rotationY, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onInspect?.({
          type: 'wall',
          id: wall.id,
          title: wall.name,
          details: [
            `Tipo: ${wall.barrierType}`,
            `Material: ${wall.materialCode}`,
            `Espesor requerido: ${Math.round(wall.requiredThickness_mm || 0)} mm`,
          ],
        });
      }}
    >
      <Box args={wall.size} castShadow receiveShadow>
        <SurfaceMaterial
          kind={materialKind}
          color={color}
          roughness={0.62}
          metalness={wall.materialCode.includes('acero') ? 0.35 : 0.05}
          opacity={opacity}
        />
      </Box>
      {mode === 'presentation' && (
        <Box args={[wall.size[0], 0.08, 0.035]} position={[0, 1.08, wall.size[2] / 2 + 0.022]}>
          <meshStandardMaterial color="#c7ced6" roughness={0.35} metalness={0.12} />
        </Box>
      )}
      {mode !== 'presentation' && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(...wall.size)]} />
          <lineBasicMaterial color={wall.barrierType === 'primary' ? '#ef4444' : '#f59e0b'} />
        </lineSegments>
      )}
      {inspect && (
        <Html position={[0, wall.size[1] + 0.18, 0]} center distanceFactor={8}>
          <div className="rounded border bg-white/95 px-2 py-1 text-[10px] leading-tight text-slate-700 shadow">
            <div className="font-semibold">{wall.name}</div>
            <div>{Math.round(wall.requiredThickness_mm || 0)} mm</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function LinacModel() {
  return (
    <group>
      <Box args={[1.55, 0.28, 0.92]} position={[0, 0.45, 0]} castShadow>
        <SurfaceMaterial kind="equipment" color="#edf2f7" roughness={0.36} />
      </Box>
      <mesh position={[0, 1.15, -0.35]} castShadow>
        <torusGeometry args={[0.42, 0.12, 18, 48]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.15} roughness={0.35} />
      </mesh>
      <Box args={[0.22, 0.95, 0.22]} position={[0, 0.88, -0.35]} castShadow>
        <meshStandardMaterial color="#9ca3af" />
      </Box>
      <mesh position={[0, 1.15, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.18, 0.55, 32, 1, true]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <Box args={[2.1, 0.16, 0.58]} position={[0.05, 0.35, 0.75]} castShadow>
        <SurfaceMaterial kind="equipment" color="#f8fafc" roughness={0.32} />
      </Box>
      <Box args={[0.38, 0.08, 0.48]} position={[1.0, 0.24, 0.75]} castShadow>
        <meshStandardMaterial color="#94a3b8" roughness={0.45} />
      </Box>
    </group>
  );
}

function CTModel({ pet = false }: { pet?: boolean }) {
  return (
    <group>
      <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.62, 0.18, 24, 64]} />
        <SurfaceMaterial kind="equipment" color={pet ? '#dbeafe' : '#f1f5f9'} roughness={0.32} metalness={0.08} />
      </mesh>
      <Box args={[2.2, 0.16, 0.5]} position={[0, 0.45, 0]} castShadow>
        <SurfaceMaterial kind="equipment" color="#f8fafc" roughness={0.32} />
      </Box>
      <Box args={[0.6, 0.28, 0.52]} position={[0, 0.32, 0]} castShadow>
        <meshStandardMaterial color="#cbd5e1" />
      </Box>
      {pet && (
        <Box args={[0.42, 0.88, 0.28]} position={[0.92, 0.68, -0.48]} castShadow>
          <meshStandardMaterial color="#bfdbfe" roughness={0.36} />
        </Box>
      )}
    </group>
  );
}

function GenericMedicalModel({ kind }: { kind: MedicalRoomPreset }) {
  if (kind === 'linac') return <LinacModel />;
  if (kind === 'petct') return <CTModel pet />;
  if (kind === 'ct') return <CTModel />;
  if (kind === 'gammaKnife') {
    return (
      <group>
        <mesh position={[0, 1.1, 0]} castShadow>
          <sphereGeometry args={[0.58, 32, 16]} />
          <meshStandardMaterial color="#e0e7ff" roughness={0.35} />
        </mesh>
        <Box args={[1.9, 0.16, 0.48]} position={[0, 0.42, 0.65]} castShadow>
          <meshStandardMaterial color="#f8fafc" />
        </Box>
      </group>
    );
  }
  if (kind === 'radiofarmacia') {
    return (
      <group>
        <Box args={[1.7, 1.25, 0.55]} position={[0, 0.7, 0]} castShadow>
          <meshStandardMaterial color="#d1d5db" roughness={0.45} metalness={0.18} />
        </Box>
        <Box args={[1.35, 0.58, 0.08]} position={[0, 0.78, 0.31]}>
          <meshStandardMaterial color="#8db8b4" transparent opacity={0.65} />
        </Box>
      </group>
    );
  }
  return (
    <group>
      <Box args={[1.6, 0.22, 0.55]} position={[0, 0.55, 0]} castShadow>
        <SurfaceMaterial kind="equipment" color="#f8fafc" roughness={0.32} />
      </Box>
      <Box args={[0.55, 0.85, 0.45]} position={[0, 0.88, -0.25]} castShadow>
        <meshStandardMaterial color="#cbd5e1" />
      </Box>
    </group>
  );
}

function Equipment({ item, onInspect }: { item: MedicalScene['equipment'][number]; onInspect?: (target: InspectionTarget) => void }) {
  const scaleX = Math.max(0.72, Math.min(1.8, item.footprint_m[0] / 2.6));
  const scaleZ = Math.max(0.72, Math.min(1.9, item.footprint_m[1] / 3.2));
  return (
    <group
      position={item.position}
      rotation={[0, item.rotationY, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onInspect?.({
          type: 'equipment',
          id: item.id,
          title: item.name,
          details: [
            `Tipo: ${item.kind}`,
            `Footprint: ${item.footprint_m[0].toFixed(1)} x ${item.footprint_m[1].toFixed(1)} m`,
            `Tags RAG: ${item.ragTags.slice(0, 4).join(', ')}`,
          ],
        });
      }}
    >
      <group scale={[scaleX, 1, scaleZ]}>
        <GenericMedicalModel kind={item.kind} />
      </group>
    </group>
  );
}

function ZoneOverlays({
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

function DoseOverlays({ scene, visible }: { scene: MedicalScene; visible: boolean }) {
  if (!visible) return null;
  return (
    <>
      {scene.dosePoints.map((point) => (
        <mesh key={point.id} position={point.position} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[point.radius * 0.72, point.radius, 96]} />
          <meshBasicMaterial color={point.intensity > 0.28 ? '#ef4444' : point.intensity > 0.2 ? '#f59e0b' : '#22c55e'} transparent opacity={point.intensity} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

function ClinicalFixtures({ scene, mode }: { scene: MedicalScene; mode: Medical3DMode }) {
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

function CameraRig({ scene, walkthrough }: { scene: MedicalScene; walkthrough: boolean }) {
  const { camera } = useThree();

  useEffect(() => {
    if (walkthrough) return;
    const [cx, , cz] = scene.bounds.center;
    const span = Math.max(scene.bounds.width, scene.bounds.depth, 7);
    camera.position.set(cx + span * 0.72, span * 0.58, cz + span * 0.86);
    camera.near = 0.05;
    camera.far = Math.max(120, span * 12);
    camera.lookAt(cx, 1.1, cz);
    camera.updateProjectionMatrix();
  }, [camera, scene, walkthrough]);

  return null;
}

function InspectionStationRig({ station }: { station?: F147InspectionStation }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!station) return;
    camera.position.set(...station.position);
    camera.lookAt(...station.lookAt);
    camera.updateProjectionMatrix();
  }, [camera, station]);

  return null;
}

function WalkthroughRig({ scene, enabled }: { scene: MedicalScene; enabled: boolean }) {
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const eyeHeight = useRef(1.65);

  useEffect(() => {
    if (!enabled) return;
    const [cx, , cz] = scene.bounds.center;
    camera.position.set(cx, 1.65, cz + Math.max(2.2, scene.bounds.depth * 0.35));
    eyeHeight.current = 1.65;
    yaw.current = Math.PI;
    pitch.current = -0.04;
    camera.lookAt(cx, 1.35, cz);

    const down = (event: KeyboardEvent) => keys.current.add(event.key.toLowerCase());
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    const move = (event: MouseEvent) => {
      if (!document.pointerLockElement) return;
      yaw.current -= event.movementX * 0.0022;
      pitch.current = THREE.MathUtils.clamp(pitch.current - event.movementY * 0.0018, -0.52, 0.42);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('mousemove', move);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('mousemove', move);
      keys.current.clear();
    };
  }, [camera, enabled, scene]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const speedModifier = keys.current.has('shift') ? 1.9 : keys.current.has('control') ? 0.42 : 1;
    const turnSpeed = 1.7 * speedModifier * delta;
    const moveSpeed = 2.6 * speedModifier * delta;
    const heightSpeed = 0.7 * delta;
    const [cx, , cz] = scene.bounds.center;
    const margin = 0.45;
    const minX = cx - scene.bounds.width / 2 + margin;
    const maxX = cx + scene.bounds.width / 2 - margin;
    const minZ = cz - scene.bounds.depth / 2 + margin;
    const maxZ = cz + scene.bounds.depth / 2 - margin;

    if (keys.current.has('arrowleft') || keys.current.has('q')) yaw.current += turnSpeed;
    if (keys.current.has('arrowright') || keys.current.has('e')) yaw.current -= turnSpeed;
    if (keys.current.has('r')) eyeHeight.current = Math.min(2.2, eyeHeight.current + heightSpeed);
    if (keys.current.has('f')) eyeHeight.current = Math.max(1.05, eyeHeight.current - heightSpeed);
    const forward = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    if (keys.current.has('w') || keys.current.has('arrowup')) camera.position.addScaledVector(forward, moveSpeed);
    if (keys.current.has('s') || keys.current.has('arrowdown')) camera.position.addScaledVector(forward, -moveSpeed);
    if (keys.current.has('a')) camera.position.addScaledVector(right, -moveSpeed);
    if (keys.current.has('d')) camera.position.addScaledVector(right, moveSpeed);
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, minX, maxX);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, minZ, maxZ);
    camera.position.y = eyeHeight.current;
    camera.lookAt(
      camera.position.x + forward.x,
      eyeHeight.current + Math.sin(pitch.current),
      camera.position.z + forward.z,
    );
  });

  return null;
}

function RoomScene({
  scene,
  mode,
  showCeiling,
  showClinicalDetail,
  walkthrough,
  showInspection,
  activeStation,
  onInspect,
}: {
  scene: MedicalScene;
  mode: Medical3DMode;
  showCeiling: boolean;
  showClinicalDetail: boolean;
  walkthrough: boolean;
  showInspection: boolean;
  activeStation?: F147InspectionStation;
  onInspect?: (target: InspectionTarget) => void;
}) {
  const [cx, , cz] = scene.bounds.center;
  const floorColor = mode === 'presentation' ? '#dce3e6' : '#e5e7eb';

  return (
    <>
      <ambientLight intensity={mode === 'presentation' ? 0.7 : 0.55} />
      <directionalLight position={[6, 8, 4]} intensity={0.9} castShadow />
      <pointLight position={[cx - 2, 2.8, cz + 2]} intensity={0.5} color="#e0f2fe" />
      <pointLight position={[cx + 2, 2.6, cz - 2]} intensity={0.35} color="#fff7ed" />
      <CameraRig scene={scene} walkthrough={walkthrough} />
      <InspectionStationRig station={activeStation} />
      <WalkthroughRig scene={scene} enabled={walkthrough} />

      <mesh position={[cx, -0.04, cz]} receiveShadow>
        <boxGeometry args={[scene.bounds.width, 0.08, scene.bounds.depth]} />
        <SurfaceMaterial kind="floor" color={floorColor} roughness={0.48} />
      </mesh>
      {showCeiling && (
        <mesh position={[cx, 3.14, cz]} receiveShadow>
          <boxGeometry args={[scene.bounds.width, 0.08, scene.bounds.depth]} />
          <SurfaceMaterial kind="ceiling" color="#f8fafc" roughness={0.6} opacity={0.32} />
        </mesh>
      )}

      <ZoneOverlays scene={scene} visible={showInspection || mode === 'technical'} onInspect={onInspect} />
      {scene.walls.map((wall) => <MedicalWall key={wall.id} wall={wall} mode={mode} inspect={showInspection} onInspect={onInspect} />)}
      {scene.equipment.map((item) => <Equipment key={item.id} item={item} onInspect={onInspect} />)}
      {showClinicalDetail && <ClinicalFixtures scene={scene} mode={mode} />}
      <DoseOverlays scene={scene} visible={mode === 'dose'} />

      <gridHelper args={[Math.max(scene.bounds.width, scene.bounds.depth) + 2, 24, '#94a3b8', '#d1d5db']} position={[cx, 0.01, cz]} />
      {!walkthrough && <OrbitControls target={[cx, 1.2, cz]} maxPolarAngle={Math.PI / 2.05} minDistance={2.5} maxDistance={42} makeDefault />}
    </>
  );
}

function downloadText(filename: string, content: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function MedicalFloorPlan3DDialog({ open, onOpenChange, floorPlan }: Props) {
  const [preset, setPreset] = useState<MedicalRoomPreset>('linac');
  const [mode, setMode] = useState<Medical3DMode>('presentation');
  const [showCeiling, setShowCeiling] = useState(false);
  const [showClinicalDetail, setShowClinicalDetail] = useState(true);
  const [showInspection, setShowInspection] = useState(true);
  const [walkthrough, setWalkthrough] = useState(false);
  const [mouseLookEnabled, setMouseLookEnabled] = useState(false);
  const [mouseLookLocked, setMouseLookLocked] = useState(false);
  const [renderEngine, setRenderEngine] = useState<Medical3DRenderEngine>('three-r3f');
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [inspectionTarget, setInspectionTarget] = useState<InspectionTarget | null>(null);
  const [importedFloorPlan, setImportedFloorPlan] = useState<FloorPlan | null>(null);
  const [cadSummary, setCadSummary] = useState<CadBimImportSummary | null>(null);
  const [cadError, setCadError] = useState<string | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeFloorPlan = importedFloorPlan || floorPlan;
  const scene = useMemo(() => buildMedicalScene(activeFloorPlan, preset), [activeFloorPlan, preset]);
  const f92Inspection = useMemo(() => buildF923DInspectionSummary(scene, activeFloorPlan), [activeFloorPlan, scene]);
  const f147Inspection = useMemo(() => buildF147Medical3DInspection(scene, activeFloorPlan), [activeFloorPlan, scene]);
  const renderStrategy = useMemo(() => getMedical3DRenderStrategy(renderEngine), [renderEngine]);
  const unityLaunchPacket = useMemo(() => buildUnityExternalViewerLaunchPacket(scene), [scene]);
  const activeStation = useMemo(
    () => f147Inspection.stations.find((station) => station.id === activeStationId),
    [activeStationId, f147Inspection.stations],
  );

  const safePlanName = activeFloorPlan.name.replace(/\W+/g, '_');

  useEffect(() => {
    const handlePointerLockChange = () => {
      setMouseLookLocked(document.pointerLockElement === canvasWrapperRef.current);
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
  }, []);

  useEffect(() => {
    if (walkthrough) return;
    setMouseLookEnabled(false);
    if (document.pointerLockElement === canvasWrapperRef.current) document.exitPointerLock();
  }, [walkthrough]);

  const handleExportOBJ = () => {
    downloadText(`medical_3d_${safePlanName}.obj`, medicalSceneToOBJ(scene));
  };

  const handleExportReviewJSON = () => {
    downloadText(
      `medical_3d_review_${safePlanName}.json`,
      JSON.stringify({
        generatedBy: 'RadShield-MX Medical 3D Floor Plan',
        roomName: scene.roomName,
        floorPlan: activeFloorPlan.name,
        importSummary: cadSummary,
        bounds: scene.bounds,
        review: scene.review,
        equipment: scene.equipment.map((item) => ({
          id: item.id,
          name: item.name,
          kind: item.kind,
          position: item.position,
          footprint_m: item.footprint_m,
          assetHint: item.assetHint,
          ragTags: item.ragTags,
        })),
        walls: scene.walls.map((wall) => ({
          id: wall.id,
          name: wall.name,
          barrierType: wall.barrierType,
          materialCode: wall.materialCode,
          requiredThickness_mm: wall.requiredThickness_mm,
          thickness_m: wall.thickness_m,
        })),
        zones: scene.zones.map((zone) => ({
          id: zone.id,
          name: zone.name,
          controlled: zone.controlled,
          points: zone.points,
        })),
      }, null, 2),
      'application/json',
    );
  };

  const handleExportCadxBrief = () => {
    downloadText(
      `cadx_ai_render_brief_${safePlanName}.json`,
      JSON.stringify(buildCadxRenderBrief({ scene, preset, mode }), null, 2),
      'application/json',
    );
  };

  const handleExportVerifyPack = () => {
    downloadText(
      `cadcodeverify_pack_${safePlanName}.json`,
      JSON.stringify(buildCadCodeVerificationPack({ scene, preset, mode }), null, 2),
      'application/json',
    );
  };

  const handleExportF147Pack = () => {
    downloadText(
      `medical_3d_f147_inspection_${safePlanName}.json`,
      JSON.stringify({
        generatedBy: 'RadShield-MX F147 Medical 3D Inspection',
        inspection: f147Inspection,
        roomName: scene.roomName,
        floorPlan: activeFloorPlan.name,
        bounds: scene.bounds,
        equipment: scene.equipment,
        walls: scene.walls,
        zones: scene.zones,
      }, null, 2),
      'application/json',
    );
  };

  const handleExportEngineHandoff = () => {
    downloadText(
      `medical_3d_engine_handoff_${safePlanName}.json`,
      JSON.stringify({
        ...buildMedical3DEngineHandoff(renderEngine),
        roomName: scene.roomName,
        floorPlan: activeFloorPlan.name,
        sceneSummary: {
          walls: scene.walls.length,
          equipment: scene.equipment.length,
          zones: scene.zones.length,
          bounds: scene.bounds,
          maxRequiredThickness_mm: scene.review.maxRequiredThickness_mm,
        },
      }, null, 2),
      'application/json',
    );
  };

  const handleExportUnityHandoff = () => {
    downloadText(
      `medical_3d_unity_handoff_${safePlanName}.json`,
      JSON.stringify(unityLaunchPacket, null, 2),
      'application/json',
    );
  };

  const handleOpenUnityExternalViewer = () => {
    if (!unityLaunchPacket.viewer.url) return;
    window.open(unityLaunchPacket.viewer.url, '_blank', 'noopener,noreferrer');
  };

  const handleCanvasPointerLock = () => {
    if (!walkthrough || !mouseLookEnabled || document.pointerLockElement) return;
    canvasWrapperRef.current?.requestPointerLock();
  };

  const handleSnapshot = () => {
    const canvas = canvasWrapperRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `medical_3d_${safePlanName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCadImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await importCadBimFile(file);
      setImportedFloorPlan(result.floorPlan);
      setCadSummary(result.summary);
      setCadError(null);
    } catch (error) {
      setCadError(error instanceof Error ? error.message : 'No se pudo importar el archivo CAD/BIM.');
      setCadSummary(null);
    } finally {
      event.target.value = '';
    }
  };

  const clearCadImport = () => {
    setImportedFloorPlan(null);
    setCadSummary(null);
    setCadError(null);
  };

  const hasGeometry = scene.walls.length > 0 || scene.equipment.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[1200px] sm:max-w-[1200px] max-h-[92vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b bg-slate-50">
          <DialogTitle className="flex items-center justify-between gap-3 text-base">
            <span className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              Medical 3D Floor Plan
            </span>
            <span className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">Offline</Badge>
              <Badge variant="outline" className="text-[10px]">{renderStrategy.label}</Badge>
              <Badge variant="outline" className="text-[10px]">CAD/BIM Fase 42</Badge>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[260px_minmax(0,1fr)] h-[72vh] min-h-[560px]">
          <aside className="border-r bg-white p-4 space-y-4 overflow-auto">
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Sala clinica</div>
              <Select value={preset} onValueChange={(value) => setPreset(value as MedicalRoomPreset)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linac">LINAC bunker</SelectItem>
                  <SelectItem value="petct">PET/CT suite</SelectItem>
                  <SelectItem value="ct">CT imaging room</SelectItem>
                  <SelectItem value="gammaKnife">Gamma Knife</SelectItem>
                  <SelectItem value="hdr">HDR brachytherapy</SelectItem>
                  <SelectItem value="radiofarmacia">Radiofarmacia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Modo</div>
              <Tabs value={mode} onValueChange={(value) => setMode(value as Medical3DMode)}>
                <TabsList className="grid grid-cols-1 h-auto gap-1 bg-transparent p-0">
                  <TabsTrigger value="presentation" className="justify-start h-8 text-xs border">
                    <MonitorCog className="w-3.5 h-3.5 mr-2" /> Presentacion
                  </TabsTrigger>
                  <TabsTrigger value="technical" className="justify-start h-8 text-xs border">
                    <Layers className="w-3.5 h-3.5 mr-2" /> Tecnico
                  </TabsTrigger>
                  <TabsTrigger value="dose" className="justify-start h-8 text-xs border">
                    <Activity className="w-3.5 h-3.5 mr-2" /> Dosis
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2 rounded border border-slate-200 bg-slate-50 p-2" data-testid="f307-f309-render-engine-selector">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Motor 3D</div>
              <Select value={renderEngine} onValueChange={(value) => setRenderEngine(value as Medical3DRenderEngine)}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDICAL_3D_RENDER_STRATEGIES.map((strategy) => (
                    <SelectItem key={strategy.id} value={strategy.id}>{strategy.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="rounded border bg-white p-2 text-[10px] leading-relaxed text-slate-600">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">{renderStrategy.status}</span>
                  <Badge variant="outline" className="text-[9px]">{renderStrategy.id}</Badge>
                </div>
                <div>{renderStrategy.role}</div>
                <div className="mt-1 text-amber-700">{renderStrategy.activationGate}</div>
              </div>
              <Button size="sm" variant="outline" className="w-full h-8 justify-start text-xs bg-white" onClick={handleExportEngineHandoff}>
                <Download className="w-3.5 h-3.5 mr-2" /> Exportar handoff 3D
              </Button>
              <div
                className="rounded border bg-white p-2 text-[10px] leading-relaxed text-slate-600"
                data-testid="f315-unity-external-viewer-bridge"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">Unity externo</span>
                  <Badge variant="outline" className="text-[9px]">{unityLaunchPacket.readiness}</Badge>
                </div>
                <div>{unityLaunchPacket.viewer.url || 'URL pendiente por VITE_MEDICAL_3D_UNITY_WEBGL_URL'}</div>
                <div className="mt-1 text-amber-700">Three/R3F queda como fallback clinico visual.</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" className="h-8 justify-start text-xs bg-white" onClick={handleExportUnityHandoff}>
                  <Download className="w-3.5 h-3.5 mr-2" /> Unity JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 justify-start text-xs bg-white"
                  onClick={handleOpenUnityExternalViewer}
                  disabled={!unityLaunchPacket.viewer.url}
                >
                  <MonitorCog className="w-3.5 h-3.5 mr-2" /> Abrir Unity
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded border p-2">
              <span className="text-xs text-slate-600">Techo translucido</span>
              <Switch checked={showCeiling} onCheckedChange={setShowCeiling} />
            </div>

            <div className="flex items-center justify-between rounded border p-2">
              <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Detalle clinico
              </span>
              <Switch checked={showClinicalDetail} onCheckedChange={setShowClinicalDetail} />
            </div>

            <div className="flex items-center justify-between rounded border p-2">
              <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                Inspeccion visual
              </span>
              <Switch checked={showInspection} onCheckedChange={setShowInspection} />
            </div>

            <div className="flex items-center justify-between rounded border p-2">
              <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                <Navigation className="w-3.5 h-3.5 text-cyan-600" />
                Recorrido WASD
              </span>
              <Switch checked={walkthrough} onCheckedChange={setWalkthrough} />
            </div>

            <div className="flex items-center justify-between rounded border p-2" data-testid="f324-pointer-lock-control">
              <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                <Navigation className="w-3.5 h-3.5 text-violet-600" />
                Mouse-look
              </span>
              <Switch checked={mouseLookEnabled} onCheckedChange={setMouseLookEnabled} disabled={!walkthrough} />
            </div>

            <div
              data-testid="f92-3d-inspection-readiness"
              className="rounded border border-teal-100 bg-teal-50 p-2 text-xs text-teal-900 space-y-1"
              title={f92Inspection.reviewItems.join(' ') || 'Inspeccion 3D lista'}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">F92 inspeccion 3D</span>
                <Badge variant="outline" className="text-[9px] bg-white">
                  {f92Inspection.inspectionReady ? 'ready' : 'draft'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                <span>Muros: {f92Inspection.walls}</span>
                <span>Equipos: {f92Inspection.equipment}</span>
                <span>Zonas: {f92Inspection.zones}</span>
                <span>Control: {f92Inspection.controlledZones}</span>
                <span className="col-span-2">
                  Max espesor: {(f92Inspection.maxWallThickness_m * 1000).toFixed(1)} mm
                </span>
              </div>
              {f92Inspection.reviewItems.length > 0 && (
                <div className="text-[9px] text-amber-700">
                  {f92Inspection.reviewItems.length} pendiente(s) antes de captura final.
                </div>
              )}
            </div>

            <div
              data-testid="f147-medical-3d-inspection"
              className="rounded border border-cyan-100 bg-cyan-50 p-2 text-xs text-cyan-950 space-y-2"
              title={f147Inspection.decision}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">F147 inspeccion medica 3D</span>
                <Badge variant="outline" className="text-[9px] bg-white">
                  {f147Inspection.stations.length} estaciones
                </Badge>
              </div>
              <div className="text-[10px] leading-relaxed">{f147Inspection.walkthroughMode}</div>
              <div className="space-y-1">
                {f147Inspection.stations.map((station) => (
                  <button
                    key={station.id}
                    type="button"
                    className="w-full rounded border border-cyan-100 bg-white/80 px-2 py-1 text-left hover:bg-white"
                    onClick={() => {
                      setWalkthrough(true);
                      setShowInspection(true);
                      setActiveStationId(station.id);
                      setInspectionTarget({
                        type: 'zone',
                        id: station.id,
                        title: station.label,
                        details: [
                          station.purpose,
                          `Posicion: ${station.position.map((value) => value.toFixed(2)).join(', ')}`,
                          `Evidencia: ${station.evidence.join(', ')}`,
                        ],
                      });
                    }}
                  >
                    <div className="font-semibold text-[10px]">{station.label}</div>
                    <div className="truncate text-[9px] text-cyan-800">{station.purpose}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1 text-[9px]">
                {f147Inspection.qaChecklist.map((item) => (
                  <div key={item.id} className="rounded bg-white/70 border border-cyan-100 px-1.5 py-1">
                    <span className={item.status === 'ready' ? 'text-emerald-700' : 'text-amber-700'}>{item.status.toUpperCase()}</span>
                    {' '}{item.label}
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="w-full h-8 justify-start text-xs bg-white" onClick={handleExportF147Pack}>
                <Download className="w-3.5 h-3.5 mr-2" /> Exportar F147 pack
              </Button>
            </div>

            <div className="rounded border bg-slate-50 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">CAD/BIM</div>
                {importedFloorPlan && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={clearCadImport}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Plano
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                data-testid="medical-cad-input"
                type="file"
                accept=".dxf,.ifc"
                className="hidden"
                onChange={handleCadImport}
              />
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 justify-start text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5 mr-2" /> Importar DXF/IFC
              </Button>
              {cadSummary && (
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700">{activeFloorPlan.name}</div>
                  <div>Tipo: {cadSummary.kind.toUpperCase()}</div>
                  <div>Entidades: {cadSummary.sourceEntities}</div>
                  <div>Mapeadas: {cadSummary.mappedBarriers}</div>
                  <div>Capas: {cadSummary.detectedLayers.length || 1}</div>
                  {cadSummary.warnings.map((warning) => (
                    <div key={warning} className="text-amber-700">{warning}</div>
                  ))}
                </div>
              )}
              {cadError && <div className="text-xs text-red-600">{cadError}</div>}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSnapshot}>
                <Camera className="w-3.5 h-3.5 mr-1" /> PNG
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExportOBJ}>
                <Download className="w-3.5 h-3.5 mr-1" /> OBJ
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExportReviewJSON}>
                <Download className="w-3.5 h-3.5 mr-1" /> JSON
              </Button>
            </div>

            <div className="rounded border bg-teal-50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-teal-800 uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                CADx / AI Render
              </div>
              <div className="text-[11px] text-teal-900 leading-relaxed">
                {CADX_STUDIO_EXTERNAL_NOTE}
              </div>
              <Button size="sm" variant="outline" className="w-full h-8 justify-start text-xs bg-white" onClick={handleExportCadxBrief}>
                <Download className="w-3.5 h-3.5 mr-2" /> Exportar AI Brief
              </Button>
            </div>

            <div className="rounded border bg-indigo-50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-800 uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                CADCodeVerify
              </div>
              <div className="text-[11px] text-indigo-900 leading-relaxed">
                {CAD_CODE_VERIFY_EXTERNAL_NOTE}
              </div>
              <Button size="sm" variant="outline" className="w-full h-8 justify-start text-xs bg-white" onClick={handleExportVerifyPack}>
                <Download className="w-3.5 h-3.5 mr-2" /> Exportar Verify Pack
              </Button>
            </div>

            <div className="rounded border bg-slate-50 p-3 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-700">{scene.roomName}</div>
              <div>Barreras: {scene.walls.length}</div>
              <div>Equipos: {scene.equipment.length}</div>
              <div>Zonas: {scene.zones.length}</div>
              <div>Primarias/sec.: {scene.review.primaryBarriers}/{scene.review.secondaryBarriers}</div>
              <div>Max. espesor: {Math.round(scene.review.maxRequiredThickness_mm)} mm</div>
              <div>Escala: {scene.floorScaleLabel}</div>
              <div>Area aprox.: {(scene.bounds.width * scene.bounds.depth).toFixed(1)} m2</div>
            </div>

            <div className="text-[11px] text-slate-500 leading-relaxed">
              El render es una visualizacion de revision. Los espesores y resultados regulatorios deben validarse en los modulos de calculo.
            </div>
          </aside>

          <main
            ref={canvasWrapperRef}
            className="relative min-w-0 h-full bg-[#eef3f5]"
            onClick={handleCanvasPointerLock}
            data-testid="f324-pointer-lock-workbench"
            title={walkthrough && mouseLookEnabled ? 'Click para capturar mouse. Esc para salir.' : undefined}
          >
            {hasGeometry ? (
              <Canvas className="h-full w-full" shadows camera={{ position: [7, 6, 9], fov: 45 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
                <Suspense fallback={null}>
                  <RoomScene
                    scene={scene}
                    mode={mode}
                    showCeiling={showCeiling}
                    showClinicalDetail={showClinicalDetail}
                    walkthrough={walkthrough}
                    showInspection={showInspection}
                    activeStation={activeStation}
                    onInspect={setInspectionTarget}
                  />
                </Suspense>
              </Canvas>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Agregue barreras o fuentes al plano para generar la escena medica.
              </div>
            )}

            <div className="absolute left-4 top-4 flex gap-2">
              <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
                {walkthrough ? 'WASD/flechas: recorrer' : 'Orbit: click + drag'}
              </Badge>
              <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
                {walkthrough ? 'Q/E: girar - Shift/Ctrl velocidad' : 'Zoom: scroll'}
              </Badge>
              {walkthrough && (
                <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
                  R/F: altura camara
                </Badge>
              )}
              {walkthrough && mouseLookEnabled && (
                <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
                  {mouseLookLocked ? 'Mouse capturado - Esc salir' : 'Click para mouse-look'}
                </Badge>
              )}
              <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
                {walkthrough ? 'Limites de sala activos' : 'Inspeccion por click'}
              </Badge>
              <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
                {renderStrategy.status === 'active' ? 'Render activo R3F' : `${renderStrategy.label}: adapter`}
              </Badge>
            </div>

            {inspectionTarget && (
              <div className="absolute right-4 top-4 w-72 rounded border bg-white/95 p-3 text-xs text-slate-700 shadow-lg">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="font-semibold">{inspectionTarget.title}</div>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setInspectionTarget(null)}>
                    Cerrar
                  </Button>
                </div>
                <div className="space-y-1">
                  {inspectionTarget.details.map((detail) => <div key={detail}>{detail}</div>)}
                </div>
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
