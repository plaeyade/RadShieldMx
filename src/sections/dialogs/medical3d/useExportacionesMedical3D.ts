import { buildCadxRenderBrief } from '@/lib/cadxStudioIntegration';
import { buildCadCodeVerificationPack } from '@/lib/cadCodeVerify';
import { buildMedical3DEngineHandoff } from '@/lib/medical3D/renderStrategy';
import { medicalSceneToOBJ } from '@/lib/medical3D/sceneBuilder';
import { buildPbrMaterialDbUpdate } from '@/lib/medical3D/pbrMaterialDatabase';
import { visualWorkflowPresets } from './constantes';
import { downloadText } from './utilidades';
import type { ContratosMedical3D } from './useContratosMedical3D';
import type { Medical3DEstado } from './useMedical3DEstado';

/** Exportaciones JSON/OBJ/PNG del diálogo Medical 3D y apertura del visor Unity externo. */
export function useExportacionesMedical3D(estado: Medical3DEstado, contratos: ContratosMedical3D) {
  const {
    scene, activeFloorPlan, preset, mode, renderEngine, safePlanName, sceneHash, visualWorkflow,
    visualWorkflowChecklist, visualEvidenceGate, visualEvidenceCaptures, setVisualEvidenceCaptures,
    lightingPreset, photorealWalkthrough, realismAids, f147Inspection, pbrMaterialDb, setPbrMaterialDb,
    activeStation, canvasWrapperRef,
  } = estado;
  const cadSummary = estado.cad.cadSummary;
  const {
    babylonContract, babylonParityContract, f367F370ReleaseIntegration, unityLaunchPacket, unityExportedBuildContract,
    f408UnitySceneExport, f408UnityValidationWarnings, f459F463VisualStack, advancedPhotorealPack, f464F468VisualBeta,
  } = contratos;

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
      JSON.stringify({
        ...unityLaunchPacket,
        f459F460: {
          schema: 'radshield-mx.medical3d.unity-bridge.f459-f460.v1',
          status: unityExportedBuildContract.viewerUrl ? 'exported-build-or-url-configured' : 'handoff-ready-build-url-pending',
          f475F478: unityExportedBuildContract,
          pbrMaterialDb,
          visualOnlyBoundary: 'Unity consumes geometry/material metadata for visual walkthrough only. It does not write signed shielding calculations.',
        },
      }, null, 2),
      'application/json',
    );
  };

  const handleUpdatePbrMaterialDb = () => {
    setPbrMaterialDb((current) => buildPbrMaterialDbUpdate(current));
  };

  const handleExportPbrMaterialDb = () => {
    downloadText(
      `medical_3d_pbr_material_db_${safePlanName}.json`,
      JSON.stringify(pbrMaterialDb, null, 2),
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
        unityExportedBuildContract,
        f408UnitySceneExport,
        f408UnityValidationWarnings,
        f459F463VisualStack,
        babylonReadiness: babylonContract,
        visualEvidenceGate,
        visualEvidenceCaptures,
        photorealSettings: {
          activeEngine: 'three-r3f',
          lightingPreset,
          photorealWalkthrough,
          advancedPhotorealPack,
          realismAids,
          pbrProfiles: f367F370ReleaseIntegration.photorealism.pbrMaterials,
          pbrMaterialDb,
        },
        externalRunnerBoundary:
          'Unity/GATE/Geant4/EGSnrc remain external runners/viewers. This pack is an auditable handoff, not an in-browser execution result.',
      }, null, 2),
      'application/json',
    );
  };

  const handleExportF464F468BetaPack = () => {
    downloadText(
      `medical_3d_f464_f468_visual_beta_${safePlanName}.json`,
      JSON.stringify({
        ...f464F468VisualBeta,
        generatedBy: 'RadShield-MX Medical 3D F464-F468 Visual Beta',
        roomName: scene.roomName,
        floorPlan: activeFloorPlan.name,
        sceneHash,
        activeWorkflow: visualWorkflow,
        visualEvidenceGate,
        visualEvidenceCaptures,
        pbrMaterialDb,
        babylonParityContract,
        unityLaunchPacket,
        unityExportedBuildContract,
        reportTargets: ['Memoria IA', 'PDF Report', 'Evidence Pack', 'Update Center', 'manual usuario'],
      }, null, 2),
      'application/json',
    );
  };

  const handleExportAdvancedPhotorealPack = () => {
    downloadText(
      `medical_3d_f479_f483_advanced_photoreal_${safePlanName}.json`,
      JSON.stringify({
        ...advancedPhotorealPack,
        generatedBy: 'RadShield-MX Medical 3D F479-F483 Advanced Photoreal Pack',
        roomName: scene.roomName,
        floorPlan: activeFloorPlan.name,
        sceneHash,
        photorealWalkthrough,
        lightingPreset,
        pbrMaterialDb,
        reportTargets: ['Medical 3D visual evidence', 'Memoria IA visual appendix', 'Evidence Pack', 'marketing/demo snapshots'],
      }, null, 2),
      'application/json',
    );
  };

  const handleOpenUnityExternalViewer = () => {
    const url = unityExportedBuildContract.viewerUrl || unityLaunchPacket.viewer.url;
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
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

  return {
    handleExportOBJ,
    handleExportReviewJSON,
    handleExportCadxBrief,
    handleExportVerifyPack,
    handleExportF147Pack,
    handleExportVisualWorkflowPack,
    handleExportVisualEvidencePack,
    handleExportEngineHandoff,
    handleExportUnityHandoff,
    handleUpdatePbrMaterialDb,
    handleExportPbrMaterialDb,
    handleExportF367F370Pack,
    handleExportF464F468BetaPack,
    handleExportAdvancedPhotorealPack,
    handleOpenUnityExternalViewer,
    handleSnapshot,
  };
}

export type ExportacionesMedical3D = ReturnType<typeof useExportacionesMedical3D>;
