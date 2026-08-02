export type F454EngineId = 'three-r3f' | 'babylon-pbr-webgpu-webxr' | 'unity-webgl-external' | 'heavy-photorealism';
export type F454EngineStatus = 'stable-active' | 'post-beta-ready' | 'requires-local-dependency' | 'requires-external-url' | 'deferred-heavy';

export interface F454EngineGate {
  id: F454EngineId;
  label: string;
  status: F454EngineStatus;
  clinicalRole: string;
  requiredInputs: string[];
  activationSteps: string[];
  fallback: 'three-r3f' | 'static-canvas';
  releaseBoundary: string;
}

export interface F454DependencyProbe {
  babylonCoreLocal: boolean;
  babylonLoadersLocal: boolean;
  unityPackageLocal: boolean;
  unityUrlConfigured: boolean;
}

export interface F454PostBetaHeavyEngines {
  schema: 'radshield-mx.f454.post-beta-heavy-engines.v1';
  phase: 'F454';
  status: 'post-beta-heavy-engines-closed' | 'post-beta-heavy-engines-staged';
  gates: F454EngineGate[];
  dependencyProbe: F454DependencyProbe;
  nextPhases: string[];
  releaseDecision: string;
}

const DEFAULT_PROBE: F454DependencyProbe = {
  babylonCoreLocal: false,
  babylonLoadersLocal: false,
  unityPackageLocal: false,
  unityUrlConfigured: false,
};

export function buildF454PostBetaHeavyEngines(probe: Partial<F454DependencyProbe> = {}): F454PostBetaHeavyEngines {
  const dependencyProbe = { ...DEFAULT_PROBE, ...probe };
  const babylonReady = dependencyProbe.babylonCoreLocal && dependencyProbe.babylonLoadersLocal;
  const unityReady = dependencyProbe.unityPackageLocal || dependencyProbe.unityUrlConfigured;

  const gates: F454EngineGate[] = [
    {
      id: 'three-r3f',
      label: 'Three/R3F estable',
      status: 'stable-active',
      clinicalRole: 'Visor productivo actual para inspeccion 3D, capturas, evidencia y recorrido dentro del frontend.',
      requiredInputs: ['MedicalScene', 'floorPlan', 'materials', 'equipment', 'zones', 'review pack'],
      activationSteps: ['Mantener como fallback obligatorio.', 'Repetir smoke visual antes de publicar.', 'No mezclar con reescritura de eventos del canvas.'],
      fallback: 'static-canvas',
      releaseBoundary: 'Puede usarse en beta; no certifica calculo ni reemplaza Memoria IA/PDF/Evidence.',
    },
    {
      id: 'babylon-pbr-webgpu-webxr',
      label: 'Babylon real PBR/WebGPU/WebXR',
      status: babylonReady ? 'post-beta-ready' : 'requires-local-dependency',
      clinicalRole: 'Motor web avanzado para PBR fisico, WebGPU, WebXR y recorrido mas robusto sin salir del navegador.',
      requiredInputs: ['@babylonjs/core', '@babylonjs/loaders', 'MedicalScene JSON/GLTF', 'feature flag', 'smoke visual'],
      activationSteps: [
        'Agregar dependencias locales al package.json del repo.',
        'Probar import dinamico y fallback automatico a Three/R3F.',
        'Validar desktop/mobile, canvas no blanco, camara, equipos, muros, zonas y snapshots.',
      ],
      fallback: 'three-r3f',
      releaseBoundary: 'Post-beta: no declarar Babylon productivo hasta que el runtime sea resoluble localmente y pase QA visual.',
    },
    {
      id: 'unity-webgl-external',
      label: 'Unity WebGL avanzado',
      status: unityReady ? 'post-beta-ready' : 'requires-external-url',
      clinicalRole: 'Visor externo pesado para recorrido fotorrealista, entrenamiento y demo visual.',
      requiredInputs: ['Unity WebGL build publicado', 'VITE_MEDICAL_3D_UNITY_WEBGL_URL', 'case pack JSON/GLTF', 'headers de hosting'],
      activationSteps: [
        'Publicar build Unity fuera del bundle React.',
        'Configurar URL de viewer y probar Abrir Unity.',
        'Validar que Unity solo devuelva capturas/recorrido, no resultados clinicos firmables.',
      ],
      fallback: 'three-r3f',
      releaseBoundary: 'Post-beta: Unity es visual-only y no debe bloquear el frontend estable.',
    },
    {
      id: 'heavy-photorealism',
      label: 'Fotorrealismo pesado',
      status: 'deferred-heavy',
      clinicalRole: 'Mejora visual de materiales, acabados, iluminacion, assets y recorrido para inspeccion o presentacion.',
      requiredInputs: ['asset budget', 'PBR material library', 'GLB/texture pipeline', 'visual regression', 'bundle budget'],
      activationSteps: [
        'Mantener una ruta liviana para operacion diaria.',
        'Cargar assets pesados por demanda.',
        'Generar capturas reportables sin alterar calculo, hash ni evidencia normativa.',
      ],
      fallback: 'three-r3f',
      releaseBoundary: 'Post-beta: no subir peso del bundle principal sin lazy loading, presupuesto y rollback.',
    },
  ];

  return {
    schema: 'radshield-mx.f454.post-beta-heavy-engines.v1',
    phase: 'F454',
    status: 'post-beta-heavy-engines-closed',
    gates,
    dependencyProbe,
    nextPhases: [
      'F455 Babylon local dependency probe + dynamic import smoke.',
      'F456 Babylon scene adapter real with PBR materials and fallback.',
      'F457 Unity WebGL external URL smoke and handoff validation.',
      'F458 Heavy photoreal asset budget, lazy loading and regression pack.',
    ],
    releaseDecision: babylonReady && unityReady
      ? 'F454 cerrado: Babylon y Unity pueden avanzar post-beta con smoke dedicado, manteniendo Three/R3F como fallback.'
      : 'F454 cerrado: mantener Three/R3F estable; Babylon/Unity avanzan post-beta cuando dependencias locales o URL externa sean verificables en este repo.',
  };
}
