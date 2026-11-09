import { OrbitControls } from '@react-three/drei';
import type { Medical3DMode, MedicalScene } from '@/lib/medical3D/sceneBuilder';
import type { F147InspectionStation } from '@/lib/f147Medical3DInspection';
import { type Medical3DLightingPreset, type RealismAid, type InspectionTarget, lightingPresets } from '../constantes';
import { CameraRig, InspectionStationRig, WalkthroughRig } from './camaras';
import { ZoneOverlays, DoseOverlays, MaterialBands, EquipmentFootprints, BeamGuides, PhotorealDecals, RoomRulers, InspectionRoute, ClinicalFixtures } from './capas';
import { MedicalWall, Equipment } from './elementos';
import { SurfaceMaterial } from './materiales';

export function RoomScene({
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
      <PhotorealDecals scene={scene} visible={photorealWalkthrough && showInspection} />
      <RoomRulers scene={scene} visible={realismAids.roomRulers && showInspection} />
      <InspectionRoute stations={inspectionStations} activeStationId={activeStationId} visible={showInspection} />

      <gridHelper args={[Math.max(scene.bounds.width, scene.bounds.depth) + 2, 24, '#94a3b8', '#d1d5db']} position={[cx, 0.01, cz]} />
      {!walkthrough && <OrbitControls target={[cx, 1.2, cz]} maxPolarAngle={Math.PI / 2.05} minDistance={2.5} maxDistance={42} makeDefault />}
    </>
  );
}
