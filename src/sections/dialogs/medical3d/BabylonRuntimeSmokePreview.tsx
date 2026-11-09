import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MedicalScene } from '@/lib/medical3D/sceneBuilder';
import type { BabylonDeepRuntimeContract } from '@/lib/medical3D/babylonDeepRuntime';
import { VISOR_3D_BABYLON } from '@/lib/featureFlags';
import type { BabylonSmokeStatus, BabylonPerformanceMetrics, BabylonDeepCameraMode, BabylonPickedEntity } from './constantes';

function clampBabylonDimension(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(Math.max(value, 3), 12);
}

function babylonRoleColor(barrierType: string) {
  if (barrierType === 'primary') return [0.82, 0.18, 0.18] as const;
  if (barrierType === 'secondary') return [0.9, 0.63, 0.16] as const;
  if (barrierType === 'maze') return [0.13, 0.55, 0.86] as const;
  if (barrierType === 'door') return [0.42, 0.31, 0.78] as const;
  return [0.44, 0.48, 0.54] as const;
}

function babylonMaterialTint(materialCode: string) {
  const key = materialCode.toLowerCase();
  if (key.includes('plomo') || key.includes('lead')) return [0.22, 0.23, 0.28] as const;
  if (key.includes('barit') || key.includes('alta') || key.includes('concreto')) return [0.48, 0.46, 0.4] as const;
  if (key.includes('acero') || key.includes('steel')) return [0.58, 0.62, 0.65] as const;
  return [0.56, 0.55, 0.5] as const;
}

function finiteBabylonFps(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

export function BabylonRuntimeSmokePreview({
  scene,
  enabled,
  onStatusChange,
  deepContract,
}: {
  scene: MedicalScene;
  enabled: boolean;
  onStatusChange?: (status: BabylonSmokeStatus) => void;
  deepContract: BabylonDeepRuntimeContract;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);
  const [status, setStatus] = useState<BabylonSmokeStatus>('idle');
  const [message, setMessage] = useState('Babylon listo para prueba visual aislada.');
  const [metrics, setMetrics] = useState<BabylonPerformanceMetrics>({ firstFrameMs: null, fps: null, meshes: 0 });
  const [cameraMode, setCameraMode] = useState<BabylonDeepCameraMode>('iso');
  const [pickedEntity, setPickedEntity] = useState<BabylonPickedEntity>(null);

  const applyCameraMode = (mode: BabylonDeepCameraMode) => {
    setCameraMode(mode);
    const camera = cameraRef.current;
    if (!camera) return;
    if (mode === 'iso') {
      camera.alpha = Math.PI * 0.72;
      camera.beta = Math.PI / 3.2;
    }
    if (mode === 'top') {
      camera.alpha = Math.PI / 2;
      camera.beta = 0.12;
    }
    if (mode === 'front') {
      camera.alpha = Math.PI;
      camera.beta = Math.PI / 2.6;
    }
  };

  const handleExportBabylonPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || status !== 'ready') return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `babylon_parity_${scene.roomName.replace(/\W+/g, '_')}.png`;
    link.click();
  };

  useEffect(() => {
    let disposed = false;
    let engine: any = null;
    let babylonScene: any = null;
    let resizeHandler: (() => void) | null = null;

    const setSmokeStatus = (nextStatus: BabylonSmokeStatus, nextMessage: string) => {
      if (disposed) return;
      setStatus(nextStatus);
      setMessage(nextMessage);
      onStatusChange?.(nextStatus);
    };

    if (!enabled || !canvasRef.current) {
      setSmokeStatus('idle', 'Abra una escena con geometria para activar Babylon.');
      return () => {
        disposed = true;
      };
    }

    setSmokeStatus('loading', 'Cargando @babylonjs/core/loaders/materials...');
    setMetrics({ firstFrameMs: null, fps: null, meshes: 0 });

    // Con VISOR_3D_BABYLON apagada el componente no se monta; la guarda además deja la rama
    // muerta para que el build no emita los chunks de @babylonjs/* (Fase 6: consolidar en r3f).
    if (!VISOR_3D_BABYLON) return () => { disposed = true; };

    void (async () => {
      try {
        const babylon = await import('@babylonjs/core');
        await import('@babylonjs/loaders');
        await import('@babylonjs/materials');

        if (disposed || !canvasRef.current) return;

        const loadStarted = performance.now();
        const canvas = canvasRef.current;
        const width = clampBabylonDimension(scene.bounds.width, 7.5);
        const depth = clampBabylonDimension(scene.bounds.depth, 6);
        const wallThickness = Math.min(Math.max(scene.review.maxRequiredThickness_mm / 1000, 0.35), 1.4);
        const wallHeight = 2.9;

        engine = new babylon.Engine(canvas, true, {
          antialias: true,
          preserveDrawingBuffer: true,
          stencil: true,
        });
        babylonScene = new babylon.Scene(engine);
        babylonScene.clearColor = new babylon.Color4(0.035, 0.052, 0.075, 1);

        const camera = new babylon.ArcRotateCamera(
          'f455Camera',
          Math.PI * 0.72,
          Math.PI / 3.2,
          Math.max(width, depth) * 1.25,
          new babylon.Vector3(0, 0.9, 0),
          babylonScene,
        );
        camera.lowerRadiusLimit = 4;
        camera.upperRadiusLimit = 16;
        camera.attachControl(canvas, true);
        cameraRef.current = camera;

        const hemi = new babylon.HemisphericLight('f455Hemi', new babylon.Vector3(0.2, 1, 0.15), babylonScene);
        hemi.intensity = 0.82;
        const key = new babylon.DirectionalLight('f455Key', new babylon.Vector3(-0.6, -1, -0.35), babylonScene);
        key.intensity = 1.2;

        const concrete = new babylon.PBRMaterial('f455ConcretePbr', babylonScene);
        concrete.albedoColor = new babylon.Color3(0.48, 0.47, 0.42);
        concrete.roughness = 0.86;
        concrete.metallic = 0;

        const interior = new babylon.PBRMaterial('f455InteriorPbr', babylonScene);
        interior.albedoColor = new babylon.Color3(0.82, 0.84, 0.82);
        interior.roughness = 0.58;
        interior.metallic = 0;

        const equipment = new babylon.PBRMaterial('f455EquipmentPbr', babylonScene);
        equipment.albedoColor = new babylon.Color3(0.83, 0.86, 0.87);
        equipment.roughness = 0.38;
        equipment.metallic = 0.18;

        const controlZone = new babylon.StandardMaterial('f455ControlledZone', babylonScene);
        controlZone.diffuseColor = new babylon.Color3(0.1, 0.56, 0.74);
        controlZone.alpha = 0.28;
        const selectionMaterial = new babylon.StandardMaterial('f471SelectionMat', babylonScene);
        selectionMaterial.diffuseColor = new babylon.Color3(0.2, 0.95, 0.9);
        selectionMaterial.emissiveColor = new babylon.Color3(0.06, 0.35, 0.32);
        const roleMaterials = new Map<string, typeof concrete>();

        const registerPick = (mesh: any, entity: NonNullable<BabylonPickedEntity>) => {
          mesh.metadata = { ...(mesh.metadata || {}), radshieldEntity: entity, radshieldOriginalMaterial: mesh.material };
          mesh.actionManager = new babylon.ActionManager(babylonScene);
          mesh.actionManager.registerAction(new babylon.ExecuteCodeAction(babylon.ActionManager.OnPickTrigger, () => {
            const originalMaterial = mesh.metadata?.radshieldOriginalMaterial;
            babylonScene.meshes.forEach((candidate: any) => {
              if (candidate.metadata?.radshieldOriginalMaterial) candidate.material = candidate.metadata.radshieldOriginalMaterial;
            });
            mesh.material = selectionMaterial;
            mesh.metadata.radshieldOriginalMaterial = originalMaterial || mesh.material;
            setPickedEntity(entity);
          }));
        };

        const materialForWall = (barrierType: string, materialCode: string) => {
          const key = `${barrierType}:${materialCode}`;
          const cached = roleMaterials.get(key);
          if (cached) return cached;
          const mat = new babylon.PBRMaterial(`f456Wall_${key.replace(/\W+/g, '_')}`, babylonScene);
          const [baseR, baseG, baseB] = babylonMaterialTint(materialCode);
          mat.albedoColor = new babylon.Color3(baseR, baseG, baseB);
          mat.roughness = 0.82;
          mat.metallic = materialCode.toLowerCase().includes('plomo') ? 0.18 : 0;
          roleMaterials.set(key, mat);
          return mat;
        };

        const floor = babylon.MeshBuilder.CreateBox('f455Floor', { width, depth, height: 0.12 }, babylonScene);
        floor.position.set(scene.bounds.center[0], -0.06, scene.bounds.center[2]);
        floor.material = interior;

        scene.walls.forEach((wall, index) => {
          const wallMesh = babylon.MeshBuilder.CreateBox(
            `f456Wall_${wall.id}`,
            { width: wall.size[0], height: wall.size[1], depth: Math.max(wall.size[2], 0.08) },
            babylonScene,
          );
          wallMesh.position.set(wall.center[0], wall.center[1], wall.center[2]);
          wallMesh.rotation.y = wall.rotationY;
          wallMesh.material = materialForWall(wall.barrierType, wall.materialCode);
          const wallEntity = {
            id: wall.id,
            type: 'wall' as const,
            label: wall.name,
            details: [
              `Rol ${wall.barrierType}`,
              `Material ${wall.materialCode}`,
              `Espesor ${Math.round(wall.requiredThickness_mm ?? wall.thickness_m * 1000)} mm`,
            ],
          };
          registerPick(wallMesh, wallEntity);

          const [r, g, b] = babylonRoleColor(wall.barrierType);
          const band = babylon.MeshBuilder.CreateBox(
            `f456RoleBand_${wall.id}`,
            { width: Math.max(wall.size[0] * 0.92, 0.25), height: 0.06, depth: Math.max(wall.size[2] * 1.24, 0.12) },
            babylonScene,
          );
          band.position.set(wall.center[0], wall.size[1] + 0.08 + index * 0.002, wall.center[2]);
          band.rotation.y = wall.rotationY;
          const bandMaterial = new babylon.StandardMaterial(`f456RoleBandMat_${wall.id}`, babylonScene);
          bandMaterial.diffuseColor = new babylon.Color3(r, g, b);
          bandMaterial.emissiveColor = new babylon.Color3(r * 0.25, g * 0.25, b * 0.25);
          band.material = bandMaterial;
          registerPick(band, wallEntity);
        });

        const primaryBand = babylon.MeshBuilder.CreateBox('f455PrimaryBarrierBand', { width: width * 0.74, depth: 0.06, height: 0.16 }, babylonScene);
        primaryBand.position.set(scene.bounds.center[0], wallHeight + 0.08, scene.bounds.center[2] - depth / 2 + wallThickness / 2);
        const primaryMaterial = new babylon.StandardMaterial('f455PrimaryBandMat', babylonScene);
        primaryMaterial.diffuseColor = new babylon.Color3(0.91, 0.23, 0.22);
        primaryBand.material = primaryMaterial;
        registerPick(primaryBand, {
          id: 'primary-role-band',
          type: 'wall',
          label: 'Banda primaria de referencia',
          details: ['Overlay visual', 'Rol primaria', 'No modifica calculos'],
        });

        if (scene.zones.length) {
          scene.zones.forEach((medicalZone) => {
            const xs = medicalZone.points.map((point) => point[0]);
            const zs = medicalZone.points.map((point) => point[2]);
            const zoneWidth = Math.max(Math.max(...xs) - Math.min(...xs), 0.8);
            const zoneDepth = Math.max(Math.max(...zs) - Math.min(...zs), 0.8);
            const zone = babylon.MeshBuilder.CreateGround(`f456Zone_${medicalZone.id}`, { width: zoneWidth, height: zoneDepth }, babylonScene);
            zone.position.set(medicalZone.center[0], 0.01, medicalZone.center[2]);
            zone.material = controlZone;
            registerPick(zone, {
              id: medicalZone.id,
              type: 'zone',
              label: medicalZone.name,
              details: [`Zona ${medicalZone.controlled ? 'controlada' : 'no controlada'}`, `Puntos ${medicalZone.points.length}`, 'Overlay de zona controlada'],
            });
          });
        } else {
          const zone = babylon.MeshBuilder.CreateGround('f455ControlledArea', { width: width * 0.55, height: depth * 0.38 }, babylonScene);
          zone.position.set(scene.bounds.center[0], 0.01, scene.bounds.center[2] + depth * 0.18);
          zone.material = controlZone;
          registerPick(zone, {
            id: 'default-controlled-area',
            type: 'zone',
            label: 'Zona controlada de ejemplo',
            details: ['Generada para inspeccion visual', 'Reemplazar por zona real del plano'],
          });
        }

        scene.equipment.forEach((medicalEquipment, index) => {
          const equipmentEntity = {
            id: medicalEquipment.id,
            type: 'equipment' as const,
            label: medicalEquipment.name,
            details: [
              `Modalidad ${medicalEquipment.kind}`,
              `Footprint ${medicalEquipment.footprint_m[0]} x ${medicalEquipment.footprint_m[1]} m`,
              `Rotacion ${(medicalEquipment.rotationY * 180 / Math.PI).toFixed(0)} deg`,
            ],
          };
          const couch = babylon.MeshBuilder.CreateBox(
            `f456EquipmentFootprint_${medicalEquipment.id}`,
            { width: medicalEquipment.footprint_m[0], depth: medicalEquipment.footprint_m[1], height: 0.22 },
            babylonScene,
          );
          couch.position.set(medicalEquipment.position[0], 0.72, medicalEquipment.position[2]);
          couch.rotation.y = medicalEquipment.rotationY;
          couch.material = equipment;
          registerPick(couch, equipmentEntity);

          const gantry = babylon.MeshBuilder.CreateTorus(
            `f456MedicalGantry_${medicalEquipment.id}`,
            { diameter: Math.min(Math.max(medicalEquipment.footprint_m[0] * 0.62, 0.8), 1.8), thickness: 0.18 },
            babylonScene,
          );
          gantry.position.set(medicalEquipment.position[0], 1.45, medicalEquipment.position[2] - medicalEquipment.footprint_m[1] * 0.32);
          gantry.rotation.x = Math.PI / 2;
          gantry.rotation.z = index * 0.08;
          gantry.material = equipment;
          registerPick(gantry, equipmentEntity);
        });

        const sourceCone = babylon.MeshBuilder.CreateCylinder('f455BeamGuide', {
          diameterTop: 0.08,
          diameterBottom: 0.92,
          height: 2.25,
          tessellation: 32,
        }, babylonScene);
        const firstEquipment = scene.equipment[0];
        sourceCone.position.set(firstEquipment?.position[0] ?? scene.bounds.center[0], 1.25, firstEquipment?.position[2] ?? scene.bounds.center[2]);
        sourceCone.rotation.x = Math.PI / 2;
        const beamMaterial = new babylon.StandardMaterial('f455BeamMaterial', babylonScene);
        beamMaterial.diffuseColor = new babylon.Color3(0.15, 0.45, 1);
        beamMaterial.alpha = 0.22;
        sourceCone.material = beamMaterial;
        registerPick(sourceCone, {
          id: 'beam-guide',
          type: 'beam',
          label: 'Guia de haz visual',
          details: ['Visual-only', 'Sirve para revisar orientacion', 'No sustituye QA dosimetrico'],
        });

        let frameCount = 0;
        engine.runRenderLoop(() => {
          frameCount += 1;
          if (frameCount === 1 && !disposed) {
            setMetrics({
              firstFrameMs: Math.round(performance.now() - loadStarted),
              fps: finiteBabylonFps(engine?.getFps?.()),
              meshes: babylonScene?.meshes?.length || 0,
            });
          }
          if (frameCount === 45 && !disposed) {
            setMetrics((prev) => ({ ...prev, fps: finiteBabylonFps(engine?.getFps?.()), meshes: babylonScene?.meshes?.length || prev.meshes }));
          }
          babylonScene?.render();
        });
        resizeHandler = () => engine?.resize();
        window.addEventListener('resize', resizeHandler);
        setSmokeStatus('ready', `Babylon parity activo: ${scene.walls.length} barreras, ${scene.equipment.length} equipos, ${scene.zones.length} zonas.`);
      } catch (error) {
        setSmokeStatus('failed', error instanceof Error ? error.message : 'No fue posible cargar Babylon runtime.');
      }
    })();

    return () => {
      disposed = true;
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      cameraRef.current = null;
      babylonScene?.dispose();
      engine?.dispose();
    };
  }, [enabled, onStatusChange, scene]);

  return (
    <div className="space-y-2 rounded border border-cyan-100 bg-cyan-50 p-2" data-testid="f455-babylon-runtime-smoke">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase text-cyan-950">F456-F458 Babylon parity</div>
          <div className="text-[9px] text-cyan-900">Escena real, FPS/fallback y export visual para Evidence.</div>
        </div>
        <Badge variant="outline" className="bg-white text-[9px]" data-testid="f455-babylon-runtime-status">
          {status}
        </Badge>
      </div>
      <div className="relative h-40 overflow-hidden rounded border border-cyan-100 bg-slate-950">
        <canvas ref={canvasRef} className="h-full w-full" data-testid="f455-babylon-runtime-canvas" />
        {status !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 px-3 text-center text-[10px] text-cyan-50">
            {message}
          </div>
        )}
      </div>
      <div className={`text-[9px] leading-relaxed ${status === 'failed' ? 'text-red-700' : 'text-cyan-900'}`}>
        {message}
      </div>
      <div className="grid gap-2 md:grid-cols-[1fr_1fr]" data-testid="f470-f474-babylon-deep-runtime">
        <div className="rounded border border-cyan-100 bg-white/85 p-2 text-[9px] leading-relaxed text-cyan-950" data-testid="f471-babylon-pick-hud">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-semibold">F471 HUD seleccion</span>
            <Badge variant="outline" className="text-[8px]">{pickedEntity?.type || 'standby'}</Badge>
          </div>
          <div className="font-medium">{pickedEntity?.label || 'Seleccione muro/equipo/zona en el canvas Babylon.'}</div>
          {(pickedEntity?.details || ['Picking no altera calculo ni floorplan.']).map((detail) => (
            <div key={detail} className="text-cyan-800">{detail}</div>
          ))}
        </div>
        <div className="rounded border border-cyan-100 bg-white/85 p-2 text-[9px] leading-relaxed text-cyan-950" data-testid="f473-babylon-overlays">
          <div className="mb-1 font-semibold">F473 overlays activos</div>
          <div className="grid grid-cols-2 gap-1">
            {deepContract.controls.overlays.map((overlay) => (
              <span key={overlay} className="rounded bg-cyan-50 px-1 py-0.5">{overlay}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1" data-testid="f472-babylon-camera-modes">
        {(['iso', 'top', 'front'] as BabylonDeepCameraMode[]).map((mode) => (
          <Button
            key={mode}
            size="sm"
            variant={cameraMode === mode ? 'default' : 'outline'}
            className="h-7 text-[10px]"
            onClick={() => applyCameraMode(mode)}
            data-testid={`f472-babylon-camera-${mode}`}
          >
            {mode === 'iso' ? 'Iso' : mode === 'top' ? 'Planta' : 'Frente'}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 text-[9px] text-cyan-950" data-testid="f457-babylon-performance-gate">
        <div className="rounded border border-cyan-100 bg-white/85 px-1.5 py-1">FPS {metrics.fps ?? 'warmup'}</div>
        <div className="rounded border border-cyan-100 bg-white/85 px-1.5 py-1">1er frame {metrics.firstFrameMs ?? '-'} ms</div>
        <div className="rounded border border-cyan-100 bg-white/85 px-1.5 py-1">Meshes {metrics.meshes}</div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-8 w-full justify-start bg-white text-xs"
        onClick={handleExportBabylonPng}
        disabled={status !== 'ready'}
        data-testid="f458-babylon-export-png"
      >
        <Download className="w-3.5 h-3.5 mr-2" /> Export PNG Babylon
      </Button>
    </div>
  );
}
