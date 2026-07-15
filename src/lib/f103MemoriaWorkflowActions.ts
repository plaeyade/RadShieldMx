export type F103MemoriaWorkflowTarget =
  | 'canvas'
  | 'dialog'
  | 'wizard-step'
  | 'tool-and-dialog';

export interface F103MemoriaWorkflowAction {
  stepId: string;
  target: F103MemoriaWorkflowTarget;
  label: string;
  detail: string;
  tool?: 'select' | 'barrier' | 'source' | 'region' | 'measure';
  dialogName?: string;
  wizardStep?: number;
}

export const F103_MEMORIA_WORKFLOW_ACTIONS: F103MemoriaWorkflowAction[] = [
  {
    stepId: 'layout',
    target: 'dialog',
    label: 'Abrir layout',
    detail: 'Revisar/importar plano, escala y recinto base.',
    dialogName: 'layoutBunker',
  },
  {
    stepId: 'equipment',
    target: 'tool-and-dialog',
    label: 'Elegir equipo',
    detail: 'Abrir biblioteca de fuentes/equipos y preparar sembrado en canvas.',
    tool: 'source',
    dialogName: 'sourceLibrary',
    wizardStep: 1,
  },
  {
    stepId: 'zones',
    target: 'tool-and-dialog',
    label: 'Definir zonas',
    detail: 'Activar herramienta region y abrir puntos de control.',
    tool: 'region',
    dialogName: 'controlPoints',
  },
  {
    stepId: 'barriers',
    target: 'tool-and-dialog',
    label: 'Editar barreras',
    detail: 'Activar dibujo/edicion de barreras y abrir editor CAD-like.',
    tool: 'barrier',
    dialogName: 'barrierEditor',
  },
  {
    stepId: 'workload',
    target: 'wizard-step',
    label: 'Capturar workload',
    detail: 'Ir al paso de carga de trabajo de la memoria.',
    wizardStep: 2,
  },
  {
    stepId: 'calculation',
    target: 'dialog',
    label: 'Calcular blindaje',
    detail: 'Abrir calculadora de barrera para ejecutar y validar resultados.',
    dialogName: 'barrierCalculator',
    wizardStep: 4,
  },
  {
    stepId: 'evidence',
    target: 'dialog',
    label: 'Armar evidencia',
    detail: 'Abrir Evidence Pack para citas, capturas y anexos.',
    dialogName: 'evidencePack',
    wizardStep: 6,
  },
];

export function getF103MemoriaWorkflowAction(stepId: string) {
  return F103_MEMORIA_WORKFLOW_ACTIONS.find((action) => action.stepId === stepId);
}
