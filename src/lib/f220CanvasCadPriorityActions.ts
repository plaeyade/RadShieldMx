export type F220CadPriority = 'P0' | 'P1' | 'P2';
export type F220CadActionStatus = 'ready' | 'partial' | 'planned';
export type F220CadActionKey =
  | 'direct-edit'
  | 'advanced-snap'
  | 'editable-dimensions'
  | 'lasso-select'
  | 'isocontours'
  | 'equipment-footprints'
  | 'medical-3d';

export interface F220CanvasCadAction {
  id: F220CadActionKey;
  priority: F220CadPriority;
  label: string;
  shortLabel: string;
  status: F220CadActionStatus;
  evidence: string;
  actionLabel: string;
  guardrail: string;
}

export interface F220CanvasCadPriorityActionsInput {
  selectedCount: number;
  snapToGrid: boolean;
  dimensionRowCount: number;
  sampleLineCount: number;
  samplePointCount: number;
  sourceCount: number;
  barrierCount: number;
  hasResults: boolean;
  hasMedical3D: boolean;
}

export interface F220CanvasCadPriorityActions {
  schema: 'radshield-mx.canvas-cad-priority-actions.f220.v1';
  phase: 'F220';
  status: 'cad-priority-actions-ready' | 'cad-priority-actions-partial';
  readyCount: number;
  partialCount: number;
  plannedCount: number;
  actions: F220CanvasCadAction[];
  prioritySummary: Record<F220CadPriority, string>;
  decision: string;
}

function countPoints(samplePointCount: number, sampleLineCount: number): string {
  if (samplePointCount > 0) return `${samplePointCount} puntos`;
  if (sampleLineCount > 0) return `${sampleLineCount} lineas`;
  return 'sin puntos';
}

export function buildF220CanvasCadPriorityActions(input: F220CanvasCadPriorityActionsInput): F220CanvasCadPriorityActions {
  const actions: F220CanvasCadAction[] = [
    {
      id: 'direct-edit',
      priority: 'P0',
      label: 'Edicion CAD directa',
      shortLabel: 'Edit',
      status: input.selectedCount > 0 ? 'ready' : 'partial',
      evidence: input.selectedCount > 0 ? `${input.selectedCount} objeto(s) seleccionados` : 'requiere seleccion',
      actionLabel: input.selectedCount > 0 ? 'Abrir editor inline' : 'Seleccionar objeto',
      guardrail: 'Usa F191E; no mueve vertices ni recalcula sin confirmacion.',
    },
    {
      id: 'advanced-snap',
      priority: 'P0',
      label: 'Snapping avanzado visual',
      shortLabel: 'Snap',
      status: input.snapToGrid ? 'partial' : 'planned',
      evidence: input.snapToGrid ? 'snap simple activo' : 'snap desactivado',
      actionLabel: input.snapToGrid ? 'Alternar snap' : 'Activar snap',
      guardrail: 'F220 solo gobierna entrada segura; endpoint/midpoint/perpendicular quedan para F221.',
    },
    {
      id: 'editable-dimensions',
      priority: 'P0',
      label: 'Cotas editables/exportables',
      shortLabel: 'Cotas',
      status: input.dimensionRowCount > 0 ? 'partial' : 'planned',
      evidence: `${input.dimensionRowCount} cotas/filas F209`,
      actionLabel: input.dimensionRowCount > 0 ? 'Calibrar escala' : 'Crear barreras',
      guardrail: 'F220 no recalcula geometria desde cotas; prepara F222.',
    },
    {
      id: 'lasso-select',
      priority: 'P1',
      label: 'Seleccion multiple/lasso',
      shortLabel: 'Sel',
      status: input.selectedCount > 1 ? 'partial' : 'planned',
      evidence: input.selectedCount > 1 ? `${input.selectedCount} seleccionados` : 'seleccion simple actual',
      actionLabel: 'Modo seleccion',
      guardrail: 'No reemplaza seleccion actual; F223 debe ser aditivo y cancelable con Esc.',
    },
    {
      id: 'isocontours',
      priority: 'P1',
      label: 'Isocontornos reales',
      shortLabel: 'Iso',
      status: input.hasResults || input.sampleLineCount > 0 ? 'partial' : 'planned',
      evidence: `${input.hasResults ? 'resultados' : 'sin resultados'}, ${countPoints(input.samplePointCount, input.sampleLineCount)}`,
      actionLabel: 'Vista Iso',
      guardrail: 'F220 activa vista; interpolacion/etiquetas reales quedan para F224 con QA numerico.',
    },
    {
      id: 'equipment-footprints',
      priority: 'P1',
      label: 'Footprints de equipos',
      shortLabel: 'Eq',
      status: input.sourceCount > 0 ? 'partial' : 'planned',
      evidence: `${input.sourceCount} equipo(s)/fuente(s)`,
      actionLabel: input.sourceCount > 0 ? 'Agregar equipo' : 'Colocar equipo',
      guardrail: 'Mantiene simbolo generico si falta fabricante; variantes ricas quedan para F225.',
    },
    {
      id: 'medical-3d',
      priority: 'P2',
      label: 'Inspeccion medica 3D',
      shortLabel: '3D',
      status: input.hasMedical3D && input.barrierCount > 0 ? 'partial' : 'planned',
      evidence: input.hasMedical3D ? `${input.barrierCount} barreras para 3D` : 'visor 3D no conectado',
      actionLabel: 'Abrir 3D',
      guardrail: 'Modulo avanzado; no bloquea release estatico ni sustituye QA radiologico.',
    },
  ];

  const readyCount = actions.filter((action) => action.status === 'ready').length;
  const partialCount = actions.filter((action) => action.status === 'partial').length;
  const plannedCount = actions.filter((action) => action.status === 'planned').length;

  return {
    schema: 'radshield-mx.canvas-cad-priority-actions.f220.v1',
    phase: 'F220',
    status: plannedCount <= 2 ? 'cad-priority-actions-ready' : 'cad-priority-actions-partial',
    readyCount,
    partialCount,
    plannedCount,
    actions,
    prioritySummary: {
      P0: 'Primero: edicion segura, snap y cotas.',
      P1: 'Despues: seleccion multiple, isocontornos y footprints.',
      P2: 'Luego: recorrido 3D medico y snapshots avanzados.',
    },
    decision:
      'F220 convierte los pendientes P0-P2 en acciones visibles y seguras dentro del canvas. Usa funciones existentes y reserva cambios profundos de geometria para microfases F221-F226.',
  };
}
