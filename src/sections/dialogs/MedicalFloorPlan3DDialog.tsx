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
import { buildBabylonAdapterContract } from '@/lib/medical3D/babylonAdapter';
import { buildUnityExternalViewerLaunchPacket } from '@/lib/medical3D/unityExternalViewerBridge';
import { buildF367F370ReleaseIntegration } from '@/lib/f367F370ReleaseIntegration';

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
type Medical3DLightingPreset = 'clinical' | 'inspection' | 'warm';
type RealismAid = 'materialBands' | 'equipmentFootprints' | 'beamGuides' | 'roomRulers';
type VisualWorkflowPreset = 'overview' | 'barriers' | 'equipment' | 'dose' | 'walkthrough';
type VisualEvidenceCapture = {
  id: string;
  workflow: VisualWorkflowPreset;
  label: string;
  filename: string;
  sceneHash: string;
  createdAt: string;
  checklistReady: number;
  checklistTotal: number;
  stationId?: string | null;
  stationLabel?: string | null;
};
type InspectionTarget =
  | { type: 'wall'; id: string; title: string; details: string[] }
  | { type: 'equipment'; id: string; title: string; details: string[] }
  | { type: 'zone'; id: string; title: string; details: string[] };

const lightingPresets: Record<Medical3DLightingPreset, { ambient: number; key: number; cool: number; warm: number; label: string }> = {
  clinical: { ambient: 0.68, key: 0.95, cool: 0.46, warm: 0.28, label: 'Clinica balanceada' },
  inspection: { ambient: 0.52, key: 1.18, cool: 0.72, warm: 0.18, label: 'Inspeccion tecnica' },
  warm: { ambient: 0.74, key: 0.72, cool: 0.28, warm: 0.54, label: 'Recorrido calido' },
};

const defaultRealismAids: Record<RealismAid, boolean> = {
  materialBands: true,
  equipmentFootprints: true,
  beamGuides: true,
  roomRulers: true,
};

const visualWorkflowPresets: Array<{
  id: VisualWorkflowPreset;
  label: string;
  description: string;
  mode: Medical3DMode;
  walkthrough: boolean;
  photoreal: boolean;
  inspection: boolean;
  ceiling: boolean;
  lighting: Medical3DLightingPreset;
  aids: Record<RealismAid, boolean>;
}> = [
  {
    id: 'overview',
    label: 'Vista general',
    description: 'Sala completa, zonas y lectura rapida para explicar el caso.',
    mode: 'presentation',
    walkthrough: false,
    photoreal: false,
    inspection: true,
    ceiling: false,
    lighting: 'clinical',
    aids: defaultRealismAids,
  },
  {
    id: 'barriers',
    label: 'Barreras',
    description: 'Materiales, espesores y cotas para revisar blindaje.',
    mode: 'technical',
    walkthrough: false,
    photoreal: false,
    inspection: true,
    ceiling: false,
    lighting: 'inspection',
    aids: { materialBands: true, equipmentFootprints: false, beamGuides: true, roomRulers: true },
  },
  {
    id: 'equipment',
    label: 'Equipos',
    description: 'Footprints, isocentro/fuente y espacio libre.',
    mode: 'technical',
    walkthrough: false,
    photoreal: false,
    inspection: true,
    ceiling: false,
    lighting: 'clinical',
    aids: { materialBands: false, equipmentFootprints: true, beamGuides: true, roomRulers: true },
  },
  {
    id: 'dose',
    label: 'Dosis',
    description: 'Heatmap, guia de fuente y lectura de zonas controladas.',
    mode: 'dose',
    walkthrough: false,
    photoreal: false,
    inspection: true,
    ceiling: false,
    lighting: 'inspection',
    aids: { materialBands: true, equipmentFootprints: true, beamGuides: true, roomRulers: false },
  },
  {
    id: 'walkthrough',
    label: 'Recorrido',
    description: 'WASD con colisiones, PBR ligero y estaciones visuales.',
    mode: 'presentation',
    walkthrough: true,
    photoreal: true,
    inspection: true,
    ceiling: true,
    lighting: 'warm',
    aids: defaultRealismAids,
  },
];

const babylonInstallOptions = [
  {
    id: 'standard',
    label: 'Instalacion normal',
    command: 'npm install @babylonjs/core @babylonjs/loaders',
    useWhen: 'Cuando npm ya puede escribir cache y resolver registry.npmjs.org sin EACCES.',
  },
  {
    id: 'local-cache',
    label: 'Cache local del repo',
    command: 'npm install @babylonjs/core @babylonjs/loaders --cache .npm-cache-babylon --prefer-online',
    useWhen: 'Cuando el bloqueo viene de permisos/carpeta cache global de npm.',
  },
  {
    id: 'pnpm-or-yarn',
    label: 'Gestor alterno',
    command: 'corepack enable && pnpm add @babylonjs/core @babylonjs/loaders',
    useWhen: 'Cuando npm insiste en EACCES aunque Node y red funcionen.',
  },
  {
    id: 'vendor-tarballs',
    label: 'Tarballs locales',
    command: 'npm pack @babylonjs/core @babylonjs/loaders && npm install ./babylonjs-core-*.tgz ./babylonjs-loaders-*.tgz',
    useWhen: 'Cuando hay que descargar paquetes fuera del entorno de Codex y traerlos al repo.',
  },
];

function stableSceneHash(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `scene-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function buildVisualWorkflowChecklist(scene: MedicalScene, stations: F147InspectionStation[], realismAids: Record<RealismAid, boolean>) {
  return [
    {
      id: 'geometry',
      label: 'Geometria cargada',
      status: scene.walls.length > 0 || scene.equipment.length > 0 ? 'ready' : 'blocked',
      evidence: `${scene.walls.length} muros, ${scene.equipment.length} equipos`,
    },
    {
      id: 'materials',
      label: 'Materiales visibles',
      status: scene.walls.every((wall) => Boolean(wall.materialCode)) && realismAids.materialBands ? 'ready' : 'review',
      evidence: realismAids.materialBands ? 'Bandas material/espesor activas' : 'Activar bandas para captura final',
    },
    {
      id: 'equipment',
      label: 'Equipos sembrados',
      status: scene.equipment.length > 0 && realismAids.equipmentFootprints ? 'ready' : 'review',
      evidence: `${scene.equipment.length} footprint(s)`,
    },
    {
      id: 'dose-context',
      label: 'Contexto dosis/zonas',
      status: scene.dosePoints.length > 0 && scene.zones.length > 0 ? 'ready' : 'review',
      evidence: `${scene.dosePoints.length} puntos visuales, ${scene.zones.length} zonas`,
    },
    {
      id: 'stations',
      label: 'Estaciones de recorrido',
      status: stations.length >= 3 ? 'ready' : 'review',
      evidence: `${stations.length} bookmark(s) F147`,
    },
  ];
}

function buildVisualEvidenceGate(captures: VisualEvidenceCapture[], checklist: ReturnType<typeof buildVisualWorkflowChecklist>) {
  const readyChecklist = checklist.filter((item) => item.status === 'ready').length;
  const requiredWorkflows: VisualWorkflowPreset[] = ['overview', 'barriers', 'equipment', 'dose'];
  const capturedWorkflows = new Set(captures.map((capture) => capture.workflow));
  const missingWorkflows = requiredWorkflows.filter((workflow) => !capturedWorkflows.has(workflow));
  const walkthroughCaptured = capturedWorkflows.has('walkthrough');
  const checklistReady = readyChecklist === checklist.length;
  const minimumCapturesReady = missingWorkflows.length === 0;
  const status = checklistReady && minimumCapturesReady ? 'ready' : captures.length > 0 ? 'review' : 'pending';

  return {
    schema: 'radshield-mx.medical3d.visual-evidence-gate.f366.v1',
    status,
    checklistReady,
    minimumCapturesReady,
    walkthroughCaptured,
    readyChecklist,
    checklistTotal: checklist.length,
    captureCount: captures.length,
    requiredWorkflows,
    missingWorkflows,
    recommendation:
      status === 'ready'
        ? 'Evidencia visual lista para anexar como soporte no certificable.'
        : `Faltan capturas: ${missingWorkflows.length ? missingWorkflows.join(', ') : 'cerrar checklist visual'}.`,
  };
}

function medicalPbrProfile(materialCode: string) {
  const normalized = materialCode.toLowerCase();
  if (normalized.includes('plomo')) return { color: '#424853', roughness: 0.42, metalness: 0.18, opacity: 0.96, category: 'lead-shield' };
  if (normalized.includes('acero')) return { color: '#9aa5b1', roughness: 0.33, metalness: 0.42, opacity: 0.95, category: 'steel-structure' };
  if (normalized.includes('vidrio')) return { color: '#93c5c2', roughness: 0.18, metalness: 0.02, opacity: 0.48, category: 'leaded-glass' };
  if (normalized.includes('baritado') || normalized.includes('alta') || normalized.includes('hd')) {
    return { color: '#9b9488', roughness: 0.7, metalness: 0.04, opacity: 0.94, category: 'high-density-masonry' };
  }
  return { color: '#d2cec5', roughness: 0.66, metalness: 0.04, opacity: 0.93, category: 'concrete-shield' };
}

function pointHitsWall(x: number, z: number, wall: MedicalScene['walls'][number], radius = 0.28) {
  const dx = x - wall.center[0];
  const dz = z - wall.center[2];
  const cos = Math.cos(-wall.rotationY);
  const sin = Math.sin(-wall.rotationY);
  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;
  return Math.abs(localX) <= wall.size[0] / 2 + radius && Math.abs(localZ) <= wall.size[2] / 2 + radius;
}

function pointHitsEquipment(x: number, z: number, item: MedicalScene['equipment'][number], radius = 0.34) {
  const dx = x - item.position[0];
  const dz = z - item.position[2];
  return Math.abs(dx) <= item.footprint_m[0] / 2 + radius && Math.abs(dz) <= item.footprint_m[1] / 2 + radius;
}

function isWalkthroughBlocked(scene: MedicalScene, x: number, z: number) {
  return scene.walls.some((wall) => pointHitsWall(x, z, wall)) || scene.equipment.some((item) => pointHitsEquipment(x, z, item));
}

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
  photoreal,
  inspect,
  onInspect,
}: {
  wall: MedicalScene['walls'][number];
  mode: Medical3DMode;
  photoreal: boolean;
  inspect: boolean;
  onInspect?: (target: InspectionTarget) => void;
}) {
  const pbr = medicalPbrProfile(wall.materialCode);
  const color = photoreal ? pbr.color : wallColor(wall.materialCode, mode);
  const opacity = photoreal ? pbr.opacity : mode === 'presentation' ? 0.92 : 0.78;
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
          roughness={photoreal ? pbr.roughness : 0.62}
          metalness={photoreal ? pbr.metalness : wall.materialCode.includes('acero') ? 0.35 : 0.05}
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

function MaterialBands({ scene, visible }: { scene: MedicalScene; visible: boolean }) {
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

function EquipmentFootprints({ scene, visible }: { scene: MedicalScene; visible: boolean }) {
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

function BeamGuides({ scene, visible }: { scene: MedicalScene; visible: boolean }) {
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

function RoomRulers({ scene, visible }: { scene: MedicalScene; visible: boolean }) {
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

function RouteSegment({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
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

function InspectionRoute({
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

function WalkthroughRig({
  scene,
  enabled,
  collisionEnabled,
}: {
  scene: MedicalScene;
  enabled: boolean;
  collisionEnabled: boolean;
}) {
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
    const nextPosition = camera.position.clone();
    if (keys.current.has('w') || keys.current.has('arrowup')) nextPosition.addScaledVector(forward, moveSpeed);
    if (keys.current.has('s') || keys.current.has('arrowdown')) nextPosition.addScaledVector(forward, -moveSpeed);
    if (keys.current.has('a')) nextPosition.addScaledVector(right, -moveSpeed);
    if (keys.current.has('d')) nextPosition.addScaledVector(right, moveSpeed);
    nextPosition.x = THREE.MathUtils.clamp(nextPosition.x, minX, maxX);
    nextPosition.z = THREE.MathUtils.clamp(nextPosition.z, minZ, maxZ);
    if (!collisionEnabled || !isWalkthroughBlocked(scene, nextPosition.x, nextPosition.z)) {
      camera.position.x = nextPosition.x;
      camera.position.z = nextPosition.z;
    }
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
  collisionEnabled,
  photorealWalkthrough,
  lightingPreset,
  realismAids,
  showInspection,
  activeStation,
  activeStationId,
  inspectionStations,
  onInspect,
}: {
  scene: MedicalScene;
  mode: Medical3DMode;
  showCeiling: boolean;
  showClinicalDetail: boolean;
  walkthrough: boolean;
  collisionEnabled: boolean;
  photorealWalkthrough: boolean;
  lightingPreset: Medical3DLightingPreset;
  realismAids: Record<RealismAid, boolean>;
  showInspection: boolean;
  activeStation?: F147InspectionStation;
  activeStationId?: string | null;
  inspectionStations: F147InspectionStation[];
  onInspect?: (target: InspectionTarget) => void;
}) {
  const [cx, , cz] = scene.bounds.center;
  const visualMode = photorealWalkthrough ? 'presentation' : mode;
  const lighting = lightingPresets[lightingPreset];
  const floorColor = visualMode === 'presentation' ? '#dce3e6' : '#e5e7eb';

  return (
    <>
      <ambientLight intensity={lighting.ambient} />
      <directionalLight position={[6, 8, 4]} intensity={lighting.key} castShadow />
      <pointLight position={[cx - 2, 2.8, cz + 2]} intensity={lighting.cool} color="#e0f2fe" />
      <pointLight position={[cx + 2, 2.6, cz - 2]} intensity={lighting.warm} color="#fff7ed" />
      <CameraRig scene={scene} walkthrough={walkthrough} />
      <InspectionStationRig station={activeStation} />
      <WalkthroughRig scene={scene} enabled={walkthrough} collisionEnabled={collisionEnabled} />

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

      <ZoneOverlays scene={scene} visible={showInspection || visualMode === 'technical'} onInspect={onInspect} />
      {scene.walls.map((wall) => (
        <MedicalWall
          key={wall.id}
          wall={wall}
          mode={visualMode}
          photoreal={photorealWalkthrough}
          inspect={showInspection}
          onInspect={onInspect}
        />
      ))}
      {scene.equipment.map((item) => <Equipment key={item.id} item={item} onInspect={onInspect} />)}
      {showClinicalDetail && <ClinicalFixtures scene={scene} mode={visualMode} />}
      <DoseOverlays scene={scene} visible={mode === 'dose' && !photorealWalkthrough} />
      <MaterialBands scene={scene} visible={realismAids.materialBands && (showInspection || photorealWalkthrough)} />
      <EquipmentFootprints scene={scene} visible={realismAids.equipmentFootprints && (showInspection || visualMode !== 'presentation')} />
      <BeamGuides scene={scene} visible={realismAids.beamGuides && (showInspection || mode === 'dose')} />
      <RoomRulers scene={scene} visible={realismAids.roomRulers && showInspection} />
      <InspectionRoute stations={inspectionStations} activeStationId={activeStationId} visible={showInspection} />

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
  const [collisionEnabled, setCollisionEnabled] = useState(true);
  const [photorealWalkthrough, setPhotorealWalkthrough] = useState(false);
  const [lightingPreset, setLightingPreset] = useState<Medical3DLightingPreset>('clinical');
  const [realismAids, setRealismAids] = useState<Record<RealismAid, boolean>>(defaultRealismAids);
  const [visualWorkflow, setVisualWorkflow] = useState<VisualWorkflowPreset>('overview');
  const [mouseLookEnabled, setMouseLookEnabled] = useState(false);
  const [mouseLookLocked, setMouseLookLocked] = useState(false);
  const [renderEngine, setRenderEngine] = useState<Medical3DRenderEngine>('three-r3f');
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [inspectionTarget, setInspectionTarget] = useState<InspectionTarget | null>(null);
  const [visualEvidenceCaptures, setVisualEvidenceCaptures] = useState<VisualEvidenceCapture[]>([]);
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
  const babylonContract = useMemo(() => buildBabylonAdapterContract(scene), [scene]);
  const productiveCapabilityRows = useMemo(() => ([
    {
      id: 'three-r3f',
      label: 'Three/R3F productivo',
      status: 'activo',
      detail: 'Motor visual principal con Canvas, recorrido, PBR ligero y evidencia visual exportable.',
    },
    {
      id: 'babylon',
      label: 'Babylon no instalado',
      status: 'gateado',
      detail: 'Adapter preparado; activar solo con @babylonjs/core/loaders instalados, flag y smoke visual.',
    },
    {
      id: 'unity',
      label: 'Unity URL',
      status: unityLaunchPacket.viewer.url ? 'configurada' : 'pendiente',
      detail: unityLaunchPacket.viewer.url || 'Falta VITE_MEDICAL_3D_UNITY_WEBGL_URL para probar visor externo real.',
    },
  ]), [unityLaunchPacket.viewer.url]);
  const f367F370ReleaseIntegration = useMemo(() => buildF367F370ReleaseIntegration(activeFloorPlan), [activeFloorPlan]);
  const sceneHash = useMemo(
    () => stableSceneHash({
      scene,
      preset,
      mode,
      visualWorkflow,
      photorealWalkthrough,
      lightingPreset,
      realismAids,
      cadSummary: cadSummary ? { kind: cadSummary.kind, entities: cadSummary.sourceEntities, layers: cadSummary.detectedLayers } : null,
    }),
    [cadSummary, lightingPreset, mode, photorealWalkthrough, preset, realismAids, scene, visualWorkflow],
  );
  const activeStation = useMemo(
    () => f147Inspection.stations.find((station) => station.id === activeStationId),
    [activeStationId, f147Inspection.stations],
  );
  const visualWorkflowChecklist = useMemo(
    () => buildVisualWorkflowChecklist(scene, f147Inspection.stations, realismAids),
    [f147Inspection.stations, realismAids, scene],
  );
  const visualEvidenceGate = useMemo(
    () => buildVisualEvidenceGate(visualEvidenceCaptures, visualWorkflowChecklist),
    [visualEvidenceCaptures, visualWorkflowChecklist],
  );

  const safePlanName = activeFloorPlan.name.replace(/\W+/g, '_');

  const toggleRealismAid = (aid: RealismAid) => {
    setRealismAids((prev) => ({ ...prev, [aid]: !prev[aid] }));
  };

  const applyVisualWorkflowPreset = (workflowId: VisualWorkflowPreset) => {
    const workflow = visualWorkflowPresets.find((item) => item.id === workflowId);
    if (!workflow) return;
    setVisualWorkflow(workflow.id);
    setMode(workflow.mode);
    setWalkthrough(workflow.walkthrough);
    setPhotorealWalkthrough(workflow.photoreal);
    setShowInspection(workflow.inspection);
    setShowCeiling(workflow.ceiling);
    setLightingPreset(workflow.lighting);
    setRealismAids(workflow.aids);
    if (workflow.id === 'walkthrough' && f147Inspection.stations[0]) setActiveStationId(f147Inspection.stations[0].id);
    if (workflow.id !== 'walkthrough') setMouseLookEnabled(false);
  };

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
        sceneHash,
        visualEvidence: {
          schema: 'radshield-mx.medical3d.visualEvidence.v1',
          sceneHash,
          visualWorkflow,
          visualWorkflowChecklist,
          visualEvidenceGate,
          visualEvidenceCaptures,
          captureTargets: ['Memoria IA', 'PDF report', 'Evidence Pack', 'CNSNS/UAQ anexos'],
          cameraBookmarkPolicy: 'Use F147 stations plus user snapshot for final visual evidence.',
          visualOnlyDisclaimer: 'La escena 3D es evidencia visual de revision; los calculos firmables se toman del motor de blindaje y sus citas.',
          lightingPreset,
          photorealWalkthrough,
          stationBookmarks: f147Inspection.stations.map((station, index) => ({
            order: index + 1,
            id: station.id,
            label: station.label,
            purpose: station.purpose,
            position: station.position,
            lookAt: station.lookAt,
            evidence: station.evidence,
          })),
        },
        threeR3fInspection: {
          schema: 'radshield-mx.medical3d.three-r3f-inspection.v1',
          enabledAids: realismAids,
          materialBands: 'Banda superior por muro: tipo de barrera + espesor relativo.',
          equipmentFootprints: 'Huella real de cada equipo para revisar espacio libre y colisiones.',
          beamGuides: 'Guia visual no dosimetrica de haz/isocentro/fuente.',
          roomRulers: 'Cotas visuales de ancho/profundidad para inspeccion rapida.',
        },
        assetPipeline: {
          schema: 'radshield-mx.medical3d.assetPipeline.v1',
          acceptedStaticAssets: ['glb', 'gltf', 'png', 'svg'],
          nativeCadFlow: ['DXF/IFC import summary', 'ODA/Forge external conversion pending', 'GLB handoff for viewer engines'],
          equipmentAssets: scene.equipment.map((item) => ({
            id: item.id,
            name: item.name,
            preferredAsset: item.assetHint || `${item.kind}.glb`,
            footprint_m: item.footprint_m,
            ragTags: item.ragTags,
          })),
        },
        babylonReadiness: babylonContract,
        f367F370ReleaseIntegration,
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

  const handleExportVisualWorkflowPack = () => {
    downloadText(
      `medical_3d_visual_workflow_${safePlanName}.json`,
      JSON.stringify({
        schema: 'radshield-mx.medical3d.visual-workflow.f364.v1',
        generatedBy: 'RadShield-MX F364 Three/R3F Visual Workflow',
        roomName: scene.roomName,
        floorPlan: activeFloorPlan.name,
        sceneHash,
        activeWorkflow: visualWorkflow,
        workflows: visualWorkflowPresets.map((workflow) => ({
          id: workflow.id,
          label: workflow.label,
          description: workflow.description,
          mode: workflow.mode,
          walkthrough: workflow.walkthrough,
          photoreal: workflow.photoreal,
          inspection: workflow.inspection,
          lighting: workflow.lighting,
          aids: workflow.aids,
        })),
        checklist: visualWorkflowChecklist,
        stationBookmarks: f147Inspection.stations.map((station, index) => ({
          order: index + 1,
          id: station.id,
          label: station.label,
          purpose: station.purpose,
          position: station.position,
          lookAt: station.lookAt,
          evidence: station.evidence,
        })),
        captureSequence: [
          'Aplicar Vista general y capturar sala completa.',
          'Aplicar Barreras y capturar espesores/materiales.',
          'Aplicar Equipos y validar footprints/isocentro/fuente.',
          'Aplicar Dosis y capturar heatmap/zonas.',
          'Aplicar Recorrido y guardar estaciones relevantes.',
        ],
        disclaimer: 'Paquete visual no certificable; alimentar Memoria IA/Evidence Pack junto con calculo trazable y citas.',
      }, null, 2),
      'application/json',
    );
  };

  const handleExportVisualEvidencePack = () => {
    downloadText(
      `medical_3d_visual_evidence_pack_${safePlanName}.json`,
      JSON.stringify({
        schema: 'radshield-mx.medical3d.visual-evidence-pack.f365-f366.v1',
        generatedBy: 'RadShield-MX F365-F366 Three/R3F Visual Evidence',
        roomName: scene.roomName,
        floorPlan: activeFloorPlan.name,
        sceneHash,
        activeWorkflow: visualWorkflow,
        visualEvidenceGate,
        captures: visualEvidenceCaptures,
        checklist: visualWorkflowChecklist,
        stationBookmarks: f147Inspection.stations.map((station, index) => ({
          order: index + 1,
          id: station.id,
          label: station.label,
          purpose: station.purpose,
          position: station.position,
          lookAt: station.lookAt,
          evidence: station.evidence,
        })),
        annexTargets: ['Memoria IA', 'PDF Report', 'Evidence Pack', 'CNSNS/UAQ annex'],
        requiredCapturePolicy: 'Minimo vista general, barreras, equipos y dosis. Recorrido recomendado si hay inspeccion de sala.',
        disclaimer: 'Las capturas son evidencia visual no certificable; deben acompanar calculo trazable, citas y revision profesional.',
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

  const handleExportF367F370Pack = () => {
    downloadText(
      `medical_3d_f367_f370_release_integration_${safePlanName}.json`,
      JSON.stringify({
        schema: 'radshield-mx.medical3d.release-integration.f367-f370.v1',
        generatedBy: 'RadShield-MX Medical 3D',
        roomName: scene.roomName,
        floorPlan: activeFloorPlan.name,
        sceneHash,
        integration: f367F370ReleaseIntegration,
        unityLaunchPacket,
        babylonReadiness: babylonContract,
        visualEvidenceGate,
        visualEvidenceCaptures,
        photorealSettings: {
          activeEngine: 'three-r3f',
          lightingPreset,
          photorealWalkthrough,
          realismAids,
          pbrProfiles: f367F370ReleaseIntegration.photorealism.pbrMaterials,
        },
        externalRunnerBoundary:
          'Unity/GATE/Geant4/EGSnrc remain external runners/viewers. This pack is an auditable handoff, not an in-browser execution result.',
      }, null, 2),
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
    const workflow = visualWorkflowPresets.find((item) => item.id === visualWorkflow);
    const timestamp = new Date().toISOString();
    const readyCount = visualWorkflowChecklist.filter((item) => item.status === 'ready').length;
    const filename = `medical_3d_${safePlanName}_${visualWorkflow}_${timestamp.replace(/\W+/g, '').slice(0, 14)}.png`;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setVisualEvidenceCaptures((prev) => [
      {
        id: `${visualWorkflow}-${timestamp}`,
        workflow: visualWorkflow,
        label: workflow?.label || visualWorkflow,
        filename,
        sceneHash,
        createdAt: timestamp,
        checklistReady: readyCount,
        checklistTotal: visualWorkflowChecklist.length,
        stationId: activeStation?.id || null,
        stationLabel: activeStation?.label || null,
      },
      ...prev,
    ].slice(0, 12));
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

            <div className="space-y-2 rounded border border-emerald-100 bg-emerald-50 p-2" data-testid="f364-three-visual-workflow">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-900 uppercase">Flujo visual 3D</div>
                  <div className="text-[9px] text-emerald-800">Presets para capturas, memoria y evidencia.</div>
                </div>
                <Badge variant="outline" className="bg-white text-[9px]">{visualWorkflow}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {visualWorkflowPresets.map((workflow) => (
                  <button
                    key={workflow.id}
                    type="button"
                    className={`rounded border px-2 py-1.5 text-left text-[10px] transition ${visualWorkflow === workflow.id ? 'border-emerald-300 bg-white text-emerald-950 shadow-sm' : 'border-emerald-100 bg-white/70 text-slate-600 hover:bg-white'}`}
                    onClick={() => applyVisualWorkflowPreset(workflow.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{workflow.label}</span>
                      <span className="text-[9px]">{workflow.mode}</span>
                    </div>
                    <div className="mt-0.5 text-[9px] opacity-80">{workflow.description}</div>
                  </button>
                ))}
              </div>
              <div className="rounded border border-emerald-100 bg-white/85 p-2 text-[9px] text-slate-600">
                {visualWorkflowChecklist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 py-0.5">
                    <span>{item.label}</span>
                    <span className={item.status === 'ready' ? 'text-emerald-700' : item.status === 'blocked' ? 'text-red-700' : 'text-amber-700'}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="w-full h-8 justify-start text-xs bg-white" onClick={handleExportVisualWorkflowPack}>
                <Download className="w-3.5 h-3.5 mr-2" /> Exportar tour visual
              </Button>
            </div>

            <div className="space-y-2 rounded border border-sky-100 bg-sky-50 p-2" data-testid="f365-f366-visual-evidence-pack">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold text-sky-900 uppercase">Evidencia visual</div>
                  <div className="text-[9px] text-sky-800">Capturas PNG trazadas por preset + compuerta QA.</div>
                </div>
                <Badge variant="outline" className="bg-white text-[9px]">{visualEvidenceGate.status}</Badge>
              </div>
              <div className="rounded border border-sky-100 bg-white/85 p-2 text-[9px] text-slate-600">
                <div className="flex items-center justify-between gap-2">
                  <span>Capturas</span>
                  <span>{visualEvidenceGate.captureCount}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Checklist</span>
                  <span>{visualEvidenceGate.readyChecklist}/{visualEvidenceGate.checklistTotal}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Faltantes</span>
                  <span>{visualEvidenceGate.missingWorkflows.length ? visualEvidenceGate.missingWorkflows.join(', ') : 'ninguno'}</span>
                </div>
                <div className="mt-1 text-sky-800">{visualEvidenceGate.recommendation}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" className="h-8 justify-start text-xs bg-white" onClick={handleSnapshot}>
                  <Camera className="w-3.5 h-3.5 mr-2" /> Capturar
                </Button>
                <Button size="sm" variant="outline" className="h-8 justify-start text-xs bg-white" onClick={handleExportVisualEvidencePack}>
                  <Download className="w-3.5 h-3.5 mr-2" /> Pack
                </Button>
              </div>
              {visualEvidenceCaptures.length > 0 && (
                <div className="max-h-28 space-y-1 overflow-auto">
                  {visualEvidenceCaptures.slice(0, 5).map((capture) => (
                    <div key={capture.id} className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-[9px] text-slate-600">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sky-900">{capture.label}</span>
                        <span>{capture.checklistReady}/{capture.checklistTotal}</span>
                      </div>
                      <div className="truncate font-mono text-[8px]">{capture.filename}</div>
                      {capture.stationLabel && <div className="truncate text-[8px] text-slate-500">Estacion: {capture.stationLabel}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 rounded border border-purple-100 bg-purple-50 p-2" data-testid="f367-f370-medical-3d-release-integration">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold text-purple-900 uppercase">F367-F370 integracion</div>
                  <div className="text-[9px] text-purple-800">3D documental, Unity WebGL externo, motores y fotorrealismo.</div>
                </div>
                <Badge variant="outline" className="bg-white text-[9px]">{f367F370ReleaseIntegration.status}</Badge>
              </div>
              <div className="rounded border border-purple-100 bg-white/85 p-2 text-[9px] text-slate-600">
                <div>Unity: {f367F370ReleaseIntegration.unityWebgl.mode} / fallback {f367F370ReleaseIntegration.unityWebgl.fallback}</div>
                <div>MC: {f367F370ReleaseIntegration.externalEngines.engines.map((engine) => `${engine.id}:${engine.status}`).join(' | ')}</div>
                <div>Fotoreal: {f367F370ReleaseIntegration.photorealism.activeEngine}; Babylon pendiente</div>
                <div>Beta: {f367F370ReleaseIntegration.releaseGate.decision}</div>
              </div>
              <Button size="sm" variant="outline" className="w-full h-8 justify-start text-xs bg-white" onClick={handleExportF367F370Pack}>
                <Download className="w-3.5 h-3.5 mr-2" /> Export F367-F370
              </Button>
            </div>

            <div className="space-y-2 rounded border border-emerald-100 bg-emerald-50 p-2" data-testid="f385-f386-productive-capability-gate">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-900 uppercase">F385-F386 capacidades productivas</div>
                  <div className="text-[9px] text-emerald-800">Solo Three/R3F queda activo en el bundle actual; Unity/Babylon requieren gate live.</div>
                </div>
                <Badge variant="outline" className="bg-white text-[9px]">claim guard</Badge>
              </div>
              <div className="space-y-1">
                {productiveCapabilityRows.map((row) => (
                  <div key={row.id} className="rounded border border-emerald-100 bg-white/85 px-2 py-1.5 text-[9px] text-slate-600">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-emerald-950">{row.label}</span>
                      <span className={row.status === 'activo' || row.status === 'configurada' ? 'text-emerald-700' : 'text-amber-700'}>{row.status}</span>
                    </div>
                    <div className="mt-0.5 leading-relaxed">{row.detail}</div>
                  </div>
                ))}
              </div>
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

            <div className="space-y-2 rounded border border-slate-200 bg-white p-2" data-testid="f325-f330-photoreal-controls">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  Colisiones
                </span>
                <Switch checked={collisionEnabled} onCheckedChange={setCollisionEnabled} disabled={!walkthrough} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Recorrido fotoreal
                </span>
                <Switch checked={photorealWalkthrough} onCheckedChange={setPhotorealWalkthrough} disabled={!walkthrough} />
              </div>
              <Select value={lightingPreset} onValueChange={(value) => setLightingPreset(value as Medical3DLightingPreset)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinical">Luz clinica</SelectItem>
                  <SelectItem value="inspection">Luz inspeccion</SelectItem>
                  <SelectItem value="warm">Luz recorrido</SelectItem>
                </SelectContent>
              </Select>
              <div className="rounded bg-slate-50 px-2 py-1 text-[10px] leading-relaxed text-slate-600">
                {lightingPresets[lightingPreset].label}. Hash visual: <span className="font-mono">{sceneHash}</span>
              </div>
            </div>

            <div className="space-y-2 rounded border border-slate-200 bg-white p-2" data-testid="f363-three-r3f-realism-aids">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold text-slate-700 uppercase">Three/R3F ayudas visuales</div>
                  <div className="text-[9px] text-slate-500">Capas no dosimetricas para inspeccion, evidencia y recorrido.</div>
                </div>
                <Badge variant="outline" className="text-[9px]">{Object.values(realismAids).filter(Boolean).length}/4</Badge>
              </div>
              {([
                ['materialBands', 'Bandas material/espesor', 'Color por tipo de barrera y espesor relativo.'],
                ['equipmentFootprints', 'Huellas de equipo', 'Footprint real para espacio libre y colision.'],
                ['beamGuides', 'Guias de haz/fuente', 'Visual no certificable para orientar isocentro/fuente.'],
                ['roomRulers', 'Reglas de sala', 'Cotas visuales de ancho y profundidad.'],
              ] as Array<[RealismAid, string, string]>).map(([id, label, description]) => (
                <button
                  key={id}
                  type="button"
                  className={`w-full rounded border px-2 py-1.5 text-left text-[10px] transition ${realismAids[id] ? 'border-teal-200 bg-teal-50 text-teal-900' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
                  onClick={() => toggleRealismAid(id)}
                  aria-pressed={realismAids[id]}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{label}</span>
                    <span>{realismAids[id] ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className="mt-0.5 text-[9px] opacity-80">{description}</div>
                </button>
              ))}
            </div>

            <div className="space-y-2 rounded border border-violet-100 bg-violet-50 p-2" data-testid="f363-babylon-install-options">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-violet-900 uppercase">Babylon: reparacion/instalacion</span>
                <Badge variant="outline" className="bg-white text-[9px]">{babylonContract.readiness}</Badge>
              </div>
              <div className="text-[10px] leading-relaxed text-violet-900">
                Mantener Three/R3F como fallback. Activar Babylon solo con paquetes instalados, flags y smoke visual.
              </div>
              <div className="space-y-1">
                {babylonInstallOptions.map((option) => (
                  <div key={option.id} className="rounded border border-violet-100 bg-white/85 p-2 text-[9px] text-slate-700">
                    <div className="font-semibold text-violet-900">{option.label}</div>
                    <code className="mt-1 block break-words rounded bg-slate-50 px-1 py-0.5 font-mono text-[8px] text-slate-700">{option.command}</code>
                    <div className="mt-1 text-slate-500">{option.useWhen}</div>
                  </div>
                ))}
              </div>
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
                    collisionEnabled={collisionEnabled}
                    photorealWalkthrough={photorealWalkthrough && walkthrough}
                    lightingPreset={lightingPreset}
                    realismAids={realismAids}
                    showInspection={showInspection}
                    activeStation={activeStation}
                    activeStationId={activeStationId}
                    inspectionStations={f147Inspection.stations}
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
              <Badge className="bg-emerald-50/95 text-emerald-900 border-emerald-200 shadow-sm" variant="outline">
                F364: {visualWorkflowPresets.find((workflow) => workflow.id === visualWorkflow)?.label || visualWorkflow}
              </Badge>
              <Badge className="bg-emerald-50/95 text-emerald-900 border-emerald-200 shadow-sm" variant="outline">
                Checklist {visualWorkflowChecklist.filter((item) => item.status === 'ready').length}/{visualWorkflowChecklist.length}
              </Badge>
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
              {walkthrough && collisionEnabled && (
                <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
                  Colisiones activas
                </Badge>
              )}
              {photorealWalkthrough && walkthrough && (
                <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
                  PBR + {lightingPresets[lightingPreset].label}
                </Badge>
              )}
              <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
                {renderStrategy.status === 'active' ? 'Render activo R3F' : `${renderStrategy.label}: adapter`}
              </Badge>
              <Badge className="bg-white/90 text-slate-700 border shadow-sm font-mono" variant="outline">
                {sceneHash}
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
