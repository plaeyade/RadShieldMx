import type { F442ToF445RendererV2Runtime } from '@/lib/f442ToF445RendererV2Runtime';
import type { BabylonDeepRuntimeContract } from '@/lib/medical3D/babylonDeepRuntime';

export interface F520F524DeepRendererBabylonContract {
  schema: 'radshield-mx.f520-f524.deep-renderer-babylon.v1';
  phaseRange: 'F520-F524';
  status: 'deep-lane-ready' | 'deep-lane-preview' | 'deep-lane-blocked';
  lanes: Array<{
    phase: 'F520' | 'F521' | 'F522' | 'F523' | 'F524';
    label: string;
    objective: string;
    evidence: string;
    risk: 'low' | 'medium' | 'high';
    status: 'ready' | 'preview' | 'blocked';
  }>;
  babylon: {
    status: BabylonDeepRuntimeContract['status'] | 'not-evaluated';
    pickableEntities: number;
    cameraModes: string[];
    overlays: string[];
    rule: string;
  };
  rendererV2: {
    status: F442ToF445RendererV2Runtime['status'] | 'not-evaluated';
    activationMode: F442ToF445RendererV2Runtime['activationMode'] | 'not-evaluated';
    instructions: number;
    passes: number;
    rule: string;
  };
  activationPolicy: {
    canReplaceCanvasBase: false;
    canRunAsOverlay: boolean;
    requiredBeforeCanvasReplacement: string[];
    rollback: string[];
  };
}

export function buildF520F524DeepRendererBabylonContract(options: {
  babylon?: BabylonDeepRuntimeContract;
  renderer?: F442ToF445RendererV2Runtime;
} = {}): F520F524DeepRendererBabylonContract {
  const babylon = options.babylon;
  const renderer = options.renderer;
  const babylonReady = babylon?.status === 'deep-runtime-ready';
  const rendererUsable = renderer?.status === 'renderer-v2-runtime-ready' || renderer?.status === 'renderer-v2-runtime-preview';
  const canRunAsOverlay = Boolean(rendererUsable);

  const lanes: F520F524DeepRendererBabylonContract['lanes'] = [
    {
      phase: 'F520',
      label: 'Catalogo visual -> herramientas',
      objective: 'Convertir Catalogo clinico, Variantes A-E, Materiales y Export en backlog operativo trazable.',
      evidence: 'F517-F519 panel y contrato visual reference activos.',
      risk: 'low',
      status: 'ready',
    },
    {
      phase: 'F521',
      label: 'Babylon profundo',
      objective: 'Mantener Babylon como escena real interactiva con picking, HUD, camaras, overlays y export visual.',
      evidence: babylon ? `${babylon.scene.pickableEntities} entidades seleccionables; ${babylon.controls.cameraModes.length} camaras; ${babylon.controls.overlays.length} overlays.` : 'Babylon no evaluado en esta superficie.',
      risk: 'medium',
      status: babylonReady ? 'ready' : babylon ? 'preview' : 'blocked',
    },
    {
      phase: 'F522',
      label: 'Renderer profundo observable',
      objective: 'Usar renderer v2 como overlay no bloqueante con instrucciones/passes y sin tocar eventos base.',
      evidence: renderer ? `${renderer.instructions.length} instrucciones; ${renderer.passes.length} passes; modo ${renderer.activationMode}.` : 'Renderer v2 no evaluado en esta superficie.',
      risk: 'medium',
      status: rendererUsable ? 'ready' : renderer ? 'preview' : 'blocked',
    },
    {
      phase: 'F523',
      label: 'Gate de activacion',
      objective: 'Permitir preview/overlay, pero bloquear reemplazo de CanvasArea/useCanvas hasta repetir smoke F197/F207/F229/F446.',
      evidence: 'canReplaceCanvasBase=false por politica; overlay visual si renderer v2 tiene instrucciones.',
      risk: 'high',
      status: 'ready',
    },
    {
      phase: 'F524',
      label: 'QA visual y rollback',
      objective: 'Cerrar capturas, Evidence/Memoria handoff y rollback antes de activar renderer/event controller v2.',
      evidence: 'Rollback conserva Three/R3F, CanvasArea/useCanvas y VITE_CANVAS_HIGH_RISK_CAD=false en produccion.',
      risk: 'high',
      status: 'ready',
    },
  ];

  const blocked = lanes.some((lane) => lane.status === 'blocked');
  const preview = lanes.some((lane) => lane.status === 'preview');

  return {
    schema: 'radshield-mx.f520-f524.deep-renderer-babylon.v1',
    phaseRange: 'F520-F524',
    status: blocked ? 'deep-lane-blocked' : preview ? 'deep-lane-preview' : 'deep-lane-ready',
    lanes,
    babylon: {
      status: babylon?.status ?? 'not-evaluated',
      pickableEntities: babylon?.scene.pickableEntities ?? 0,
      cameraModes: babylon?.controls.cameraModes ?? [],
      overlays: babylon?.controls.overlays ?? [],
      rule: 'Babylon profundo es visual/interactivo; no genera calculo clinico ni reemplaza Three/R3F hasta smoke repetido.',
    },
    rendererV2: {
      status: renderer?.status ?? 'not-evaluated',
      activationMode: renderer?.activationMode ?? 'not-evaluated',
      instructions: renderer?.instructions.length ?? 0,
      passes: renderer?.passes.length ?? 0,
      rule: 'Renderer v2 puede correr como overlay pointer-events:none; no reemplaza CanvasArea/useCanvas sin fase de eventos base.',
    },
    activationPolicy: {
      canReplaceCanvasBase: false,
      canRunAsOverlay,
      requiredBeforeCanvasReplacement: [
        'F197 menu/canvas smoke',
        'F207 import/export canvas smoke',
        'F229 Canvas CAD E2E Harness',
        'F446-F448 Canvas strong QA',
        'F520-F524 visual QA con screenshots',
        'rollback probado con VITE_CANVAS_HIGH_RISK_CAD=false',
      ],
      rollback: [
        'Mantener Three/R3F como renderer productivo.',
        'Desactivar VITE_CANVAS_HIGH_RISK_CAD.',
        'Desactivar VITE_CANVAS_EVENT_CONTROLLER_V2.',
        'Ocultar overlay renderer v2 si tapa o bloquea el canvas.',
        'No publicar Babylon como motor principal sin E2E visual repetido.',
      ],
    },
  };
}
