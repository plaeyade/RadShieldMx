import { useMemo } from 'react';
import { buildBabylonAdapterContract } from '@/lib/medical3D/babylonAdapter';
import { buildUnityExternalViewerLaunchPacket } from '@/lib/medical3D/unityExternalViewerBridge';
import { buildF367F370ReleaseIntegration } from '@/lib/f367F370ReleaseIntegration';
import { buildPhotorealAdvancedProfile } from '@/lib/medical3D/photorealAdvanced';
import { buildF408UnitySceneExport, validateF408UnitySceneExport } from '@/lib/f408UnitySceneExport';
import { buildBabylonRuntimeSmokeContract, buildBabylonSceneParityContract } from '@/lib/medical3D/babylonRuntimeSmoke';
import { buildBabylonDeepRuntimeContract } from '@/lib/medical3D/babylonDeepRuntime';
import { buildUnityWebglExportedBuildContract } from '@/lib/medical3D/unityWebglExportedBuild';
import { buildAdvancedPhotorealPackContract } from '@/lib/medical3D/advancedPhotorealPack';
import { buildF459F463VisualStack } from '@/lib/medical3D/f459F463VisualStack';
import { buildF464F468VisualBetaContract } from '@/lib/medical3D/f464F468VisualBeta';
import { buildF520F524DeepRendererBabylonContract } from '@/lib/f520F524DeepRendererBabylon';
import type { Medical3DEstado } from './useMedical3DEstado';

/**
 * Contratos visuales derivados de la escena (Unity, Babylon, fotorrealismo, F367-F370, F408,
 * F459-F468, F520-F524). Son documentales: no alteran la escena ni los cálculos.
 */
export function useContratosMedical3D(estado: Medical3DEstado) {
  const {
    scene, activeFloorPlan, preset, photorealWalkthrough, lightingPreset, walkthrough,
    pbrMaterialDb, babylonSmokeStatus, visualEvidenceCaptures,
  } = estado;
  const unityLaunchPacket = useMemo(() => buildUnityExternalViewerLaunchPacket(scene), [scene]);
  const babylonContract = useMemo(() => buildBabylonAdapterContract(scene), [scene]);
  const babylonSmokeContract = useMemo(() => buildBabylonRuntimeSmokeContract(scene), [scene]);
  const babylonParityContract = useMemo(() => buildBabylonSceneParityContract(scene), [scene]);
  const babylonDeepContract = useMemo(() => buildBabylonDeepRuntimeContract(scene), [scene]);
  const f520ToF524DeepRendererBabylon = useMemo(
    () => buildF520F524DeepRendererBabylonContract({ babylon: babylonDeepContract }),
    [babylonDeepContract],
  );
  const unityExportedBuildContract = useMemo(() => buildUnityWebglExportedBuildContract(scene), [scene]);
  const f408UnitySceneExport = useMemo(() => buildF408UnitySceneExport(activeFloorPlan, preset), [activeFloorPlan, preset]);
  const f408UnityValidationWarnings = useMemo(() => validateF408UnitySceneExport(f408UnitySceneExport), [f408UnitySceneExport]);
  const photorealAdvancedProfile = useMemo(() => buildPhotorealAdvancedProfile({
    scene,
    enabled: photorealWalkthrough,
    lightingPreset,
    walkthrough,
  }), [lightingPreset, photorealWalkthrough, scene, walkthrough]);
  const advancedPhotorealPack = useMemo(
    () => buildAdvancedPhotorealPackContract({ scene, pbrMaterialDb, photorealEnabled: photorealWalkthrough }),
    [pbrMaterialDb, photorealWalkthrough, scene],
  );
  const f459F463VisualStack = useMemo(() => buildF459F463VisualStack(scene, pbrMaterialDb), [pbrMaterialDb, scene]);
  const f464F468VisualBeta = useMemo(
    () => buildF464F468VisualBetaContract({
      scene,
      pbrMaterialDb,
      babylonReady: babylonSmokeStatus === 'ready',
      walkthrough,
      unityUrl: unityLaunchPacket.viewer.url,
      visualEvidenceCaptureCount: visualEvidenceCaptures.length,
    }),
    [babylonSmokeStatus, pbrMaterialDb, scene, unityLaunchPacket.viewer.url, visualEvidenceCaptures.length, walkthrough],
  );
  const productiveCapabilityRows = useMemo(() => ([
    {
      id: 'three-r3f',
      label: 'Three/R3F productivo',
      status: 'activo',
      detail: 'Motor visual principal con Canvas, recorrido, PBR ligero y evidencia visual exportable.',
    },
    {
      id: 'babylon',
      label: 'Babylon runtime',
      status: babylonSmokeStatus === 'ready' ? 'runtime smoke' : 'instalado',
      detail: babylonSmokeStatus === 'ready'
        ? 'Dependencias locales cargadas; preview PBR/cutaway validado sin sustituir Three/R3F.'
        : 'Dependencias locales presentes; ejecutar smoke visual F455 para habilitar paridad post-beta.',
    },
    {
      id: 'unity',
      label: 'Unity URL',
      status: unityLaunchPacket.viewer.url ? 'configurada' : 'pendiente',
      detail: unityLaunchPacket.viewer.url || 'Falta VITE_MEDICAL_3D_UNITY_WEBGL_URL para probar visor externo real.',
    },
  ]), [babylonSmokeStatus, unityLaunchPacket.viewer.url]);
  const f367F370ReleaseIntegration = useMemo(() => buildF367F370ReleaseIntegration(activeFloorPlan), [activeFloorPlan]);

  return {
    unityLaunchPacket,
    babylonContract,
    babylonSmokeContract,
    babylonParityContract,
    babylonDeepContract,
    f520ToF524DeepRendererBabylon,
    unityExportedBuildContract,
    f408UnitySceneExport,
    f408UnityValidationWarnings,
    photorealAdvancedProfile,
    advancedPhotorealPack,
    f459F463VisualStack,
    f464F468VisualBeta,
    productiveCapabilityRows,
    f367F370ReleaseIntegration,
  };
}

export type ContratosMedical3D = ReturnType<typeof useContratosMedical3D>;
