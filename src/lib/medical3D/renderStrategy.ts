export type Medical3DRenderEngine = 'three-r3f' | 'babylon-pbr-webgpu-webxr' | 'unity-webgl-external';

export interface Medical3DRenderStrategy {
  id: Medical3DRenderEngine;
  label: string;
  status: 'active' | 'adapter-ready' | 'deferred';
  role: string;
  strengths: string[];
  limits: string[];
  activationGate: string;
  exportBridge: string;
}

export const MEDICAL_3D_RENDER_STRATEGIES: Medical3DRenderStrategy[] = [
  {
    id: 'three-r3f',
    label: 'Three.js / React Three Fiber',
    status: 'active',
    role: 'Visor principal integrado al frontend React para inspeccion 3D, snapshots y evidencia.',
    strengths: [
      'Ya esta en el bundle y usa floorplan/materiales/equipos reales.',
      'Permite orbit, walkthrough WASD, sombras, texturas procedurales y export PNG/OBJ/JSON.',
      'Es el camino menos riesgoso para release estatico.',
    ],
    limits: [
      'No debe sustituir calculos analiticos ni Monte Carlo.',
      'PBR y XR avanzados quedan limitados frente a motores dedicados.',
    ],
    activationGate: 'Activo por defecto; debe pasar F197/F207/F296-F300/F307-F309 antes de publicar.',
    exportBridge: 'medicalSceneToOBJ + review JSON + snapshots PNG.',
  },
  {
    id: 'babylon-pbr-webgpu-webxr',
    label: 'Babylon.js PBR/WebGPU/WebXR',
    status: 'adapter-ready',
    role: 'Motor web robusto para fase posterior de PBR, WebGPU y recorrido WebXR sin salir del navegador.',
    strengths: [
      'PBR, materiales fisicos, luces, inspeccion XR y WebGPU como ruta de mejora.',
      'Puede consumir el mismo paquete de escena del floorplan.',
      'Mejor candidato que Unity si se quiere seguir 100% web.',
    ],
    limits: [
      'No esta agregado al bundle principal para evitar peso y riesgo pre-release.',
      'WebGPU/WebXR dependen de navegador/dispositivo y requieren QA dedicado.',
    ],
    activationGate: 'Fase futura con feature flag, E2E visual y fallback automatico a Three/R3F.',
    exportBridge: 'scene package GLTF/JSON desde MedicalScene; importador Babylon aislado.',
  },
  {
    id: 'unity-webgl-external',
    label: 'Unity WebGL externo',
    status: 'deferred',
    role: 'Visor fotorealista pesado al final del roadmap, embebido o enlazado como build externo.',
    strengths: [
      'Pipeline visual maduro, assets realistas, animacion y recorridos tipo simulador.',
      'Puede servir para demos comerciales o entrenamiento visual.',
    ],
    limits: [
      'Build pesado, servidor con headers/compresion, bridge de datos y mantenimiento separado.',
      'No conviene para el release estatico actual ni para calculo clinico.',
    ],
    activationGate: 'Ultima opcion: solo despues de cerrar app funcional, DB/RAG y pruebas reales.',
    exportBridge: 'Unity recibe case pack JSON/GLTF; devuelve solo snapshot/recorrido, no resultado regulatorio.',
  },
];

export function getMedical3DRenderStrategy(id: Medical3DRenderEngine): Medical3DRenderStrategy {
  return MEDICAL_3D_RENDER_STRATEGIES.find((strategy) => strategy.id === id) || MEDICAL_3D_RENDER_STRATEGIES[0];
}

export function buildMedical3DEngineHandoff(engine: Medical3DRenderEngine) {
  const strategy = getMedical3DRenderStrategy(engine);
  return {
    schema: 'radshield-mx.medical-3d-render-handoff.v1',
    selectedEngine: strategy.id,
    label: strategy.label,
    status: strategy.status,
    role: strategy.role,
    activationGate: strategy.activationGate,
    exportBridge: strategy.exportBridge,
    strengths: strategy.strengths,
    limits: strategy.limits,
    clinicalWarning: 'Visualizacion de inspeccion. No certifica calculo ni reemplaza revision de fisico medico/RSO.',
  };
}
