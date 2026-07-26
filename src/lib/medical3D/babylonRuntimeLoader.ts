import { isEnabled } from '@/lib/featureFlags';
import type { BabylonRuntimeStatus } from './babylonAdapter';

const BABYLON_CORE_MODULE = '@babylonjs/core';
const BABYLON_LOADERS_MODULE = '@babylonjs/loaders';

export async function loadBabylonRuntime(): Promise<BabylonRuntimeStatus> {
  if (!isEnabled('medical3DBabylonAdapter')) {
    return {
      schema: 'radshield-mx.medical-3d.babylon-runtime-status.v1',
      enabled: false,
      runtimeLoaded: false,
      mode: 'disabled',
      packages: [BABYLON_CORE_MODULE, BABYLON_LOADERS_MODULE],
      fallbackEngine: 'three-r3f',
      message: 'Babylon adapter desactivado; Three/R3F permanece como motor activo.',
    };
  }

  try {
    await import(/* @vite-ignore */ BABYLON_CORE_MODULE);
    await import(/* @vite-ignore */ BABYLON_LOADERS_MODULE);
    return {
      schema: 'radshield-mx.medical-3d.babylon-runtime-status.v1',
      enabled: true,
      runtimeLoaded: true,
      mode: 'dynamic-import-ready',
      packages: [BABYLON_CORE_MODULE, BABYLON_LOADERS_MODULE],
      fallbackEngine: 'three-r3f',
      message: 'Babylon runtime disponible para adapter PBR/WebGPU/WebXR.',
    };
  } catch (error) {
    return {
      schema: 'radshield-mx.medical-3d.babylon-runtime-status.v1',
      enabled: true,
      runtimeLoaded: false,
      mode: 'dynamic-import-failed',
      packages: [BABYLON_CORE_MODULE, BABYLON_LOADERS_MODULE],
      fallbackEngine: 'three-r3f',
      message: error instanceof Error ? error.message : 'No se pudo cargar Babylon runtime.',
    };
  }
}
