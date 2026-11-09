import { useEffect, useMemo, useRef, useState } from 'react';
import type { FloorPlan } from '@/types/radshield';
import { buildMedicalScene, type Medical3DMode, type MedicalRoomPreset } from '@/lib/medical3D/sceneBuilder';
import { buildF923DInspectionSummary } from '@/lib/f92RealWorkflow';
import { buildF147Medical3DInspection } from '@/lib/f147Medical3DInspection';
import { getMedical3DRenderStrategy, type Medical3DRenderEngine } from '@/lib/medical3D/renderStrategy';
import type { PbrMaterialDatabase } from '@/lib/medical3D/pbrMaterialDatabase';
import { componentesPresentes, type ComponenteCampo } from '@/lib/doseFieldEngine';
import {
  PBR_MATERIAL_DB_STORAGE_KEY,
  defaultRealismAids,
  visualWorkflowPresets,
  type BabylonSmokeStatus,
  type InspectionTarget,
  type Medical3DLightingPreset,
  type RealismAid,
  type VisualEvidenceCapture,
  type VisualWorkflowPreset,
} from './constantes';
import { buildVisualEvidenceGate, buildVisualWorkflowChecklist, loadStoredPbrMaterialDatabase, stableSceneHash } from './utilidades';
import { useImportacionCadBim } from './useImportacionCadBim';

/**
 * Estado del diálogo Medical 3D: controles de la vista, escena construida a partir del plano
 * (o del CAD/BIM importado), inspección F92/F147, flujo visual F364 y evidencia F365-F366.
 */
export function useMedical3DEstado(floorPlan: FloorPlan) {
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
  const [babylonSmokeStatus, setBabylonSmokeStatus] = useState<BabylonSmokeStatus>('idle');
  const [pbrMaterialDb, setPbrMaterialDb] = useState<PbrMaterialDatabase>(() => loadStoredPbrMaterialDatabase());
  const cad = useImportacionCadBim();
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const activeFloorPlan = cad.importedFloorPlan || floorPlan;
  const [componentesDosis, setComponentesDosis] = useState<ComponenteCampo[] | undefined>(undefined);
  const componentesDisponibles = useMemo(
    () => componentesPresentes(activeFloorPlan.sources || [], activeFloorPlan.scale_m_per_pixel || 0.01),
    [activeFloorPlan],
  );
  const scene = useMemo(
    () => buildMedicalScene(activeFloorPlan, preset, { dosis: { componentes: componentesDosis } }),
    [activeFloorPlan, preset, componentesDosis],
  );
  const f92Inspection = useMemo(() => buildF923DInspectionSummary(scene, activeFloorPlan), [activeFloorPlan, scene]);
  const f147Inspection = useMemo(() => buildF147Medical3DInspection(scene, activeFloorPlan), [activeFloorPlan, scene]);
  const renderStrategy = useMemo(() => getMedical3DRenderStrategy(renderEngine), [renderEngine]);
  const { cadSummary } = cad;
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

  // Al salir del recorrido se apaga el mouse-look (ajuste durante el render) y se libera el puntero.
  const [walkthroughPrevio, setWalkthroughPrevio] = useState(walkthrough);
  if (walkthroughPrevio !== walkthrough) {
    setWalkthroughPrevio(walkthrough);
    if (!walkthrough) setMouseLookEnabled(false);
  }
  useEffect(() => {
    if (walkthrough) return;
    if (document.pointerLockElement === canvasWrapperRef.current) document.exitPointerLock();
  }, [walkthrough]);

  useEffect(() => {
    window.localStorage.setItem(PBR_MATERIAL_DB_STORAGE_KEY, JSON.stringify(pbrMaterialDb));
  }, [pbrMaterialDb]);

  const handleCanvasPointerLock = () => {
    if (!walkthrough || !mouseLookEnabled || document.pointerLockElement) return;
    canvasWrapperRef.current?.requestPointerLock();
  };

  const hasGeometry = scene.walls.length > 0 || scene.equipment.length > 0;

  return {
    preset, setPreset,
    mode, setMode,
    showCeiling, setShowCeiling,
    showClinicalDetail, setShowClinicalDetail,
    showInspection, setShowInspection,
    walkthrough, setWalkthrough,
    collisionEnabled, setCollisionEnabled,
    photorealWalkthrough, setPhotorealWalkthrough,
    lightingPreset, setLightingPreset,
    realismAids, toggleRealismAid,
    visualWorkflow, applyVisualWorkflowPreset,
    mouseLookEnabled, setMouseLookEnabled,
    mouseLookLocked,
    renderEngine, setRenderEngine,
    activeStationId, setActiveStationId,
    inspectionTarget, setInspectionTarget,
    visualEvidenceCaptures, setVisualEvidenceCaptures,
    babylonSmokeStatus, setBabylonSmokeStatus,
    pbrMaterialDb, setPbrMaterialDb,
    cad,
    canvasWrapperRef,
    activeFloorPlan,
    componentesDosis, setComponentesDosis,
    componentesDisponibles,
    scene,
    f92Inspection,
    f147Inspection,
    renderStrategy,
    sceneHash,
    activeStation,
    visualWorkflowChecklist,
    visualEvidenceGate,
    safePlanName,
    handleCanvasPointerLock,
    hasGeometry,
  };
}

export type Medical3DEstado = ReturnType<typeof useMedical3DEstado>;
