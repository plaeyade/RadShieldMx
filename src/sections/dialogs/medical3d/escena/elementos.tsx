import { Box, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Medical3DMode, MedicalRoomPreset, MedicalScene } from '@/lib/medical3D/sceneBuilder';
import type { TextureKind, InspectionTarget } from '../constantes';
import { SurfaceMaterial } from './materiales';
import { medicalPbrProfile, wallColor } from '../utilidades';

export function MedicalWall({
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

export function LinacModel() {
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

export function CTModel({ pet = false }: { pet?: boolean }) {
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

export function GenericMedicalModel({ kind }: { kind: MedicalRoomPreset }) {
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

export function Equipment({ item, onInspect }: { item: MedicalScene['equipment'][number]; onInspect?: (target: InspectionTarget) => void }) {
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
