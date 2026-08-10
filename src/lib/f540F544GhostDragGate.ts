export interface F540F544GhostDragGate {
  schema: 'radshield-mx.f540-f544.ghost-drag-gate.v1';
  phaseRange: 'F540-F544';
  status: 'drag-preview-ready';
  interaction: {
    canDragPreview: true;
    canPersistGeometry: false;
    requiresExplicitConfirm: true;
    pointerEventsPolicy: 'overlay-pass-through-handle-active';
  };
  phases: Array<{
    phase: 'F540' | 'F541' | 'F542' | 'F543' | 'F544';
    label: string;
    effect: string;
    risk: 'low' | 'medium' | 'high';
  }>;
  qa: {
    requiredChecks: string[];
    rollback: string[];
  };
}

export function buildF540F544GhostDragGate(): F540F544GhostDragGate {
  return {
    schema: 'radshield-mx.f540-f544.ghost-drag-gate.v1',
    phaseRange: 'F540-F544',
    status: 'drag-preview-ready',
    interaction: {
      canDragPreview: true,
      canPersistGeometry: false,
      requiresExplicitConfirm: true,
      pointerEventsPolicy: 'overlay-pass-through-handle-active',
    },
    phases: [
      {
        phase: 'F540',
        label: 'Drag handle seguro',
        effect: 'Agrega un handle interno al ghost para iniciar arrastre sin capturar eventos del canvas completo.',
        risk: 'low',
      },
      {
        phase: 'F541',
        label: 'Movimiento en coordenadas CAD',
        effect: 'Convierte delta de puntero a coordenadas del canvas usando escala y offset actuales.',
        risk: 'low',
      },
      {
        phase: 'F542',
        label: 'Liberacion no persistente',
        effect: 'Actualiza el punto candidato y deja evidencia visual sin escribir floorPlan.sources.',
        risk: 'low',
      },
      {
        phase: 'F543',
        label: 'Confirmacion para handoff',
        effect: 'El boton Confirmar envia el punto candidato a 3D/Memoria/Evidence como contexto preliminar.',
        risk: 'medium',
      },
      {
        phase: 'F544',
        label: 'Gate CAD permanente',
        effect: 'Mantiene bloqueada la persistencia hasta undo/redo, seleccion, colisiones y E2E dedicados.',
        risk: 'high',
      },
    ],
    qa: {
      requiredChecks: [
        'test:f540-f544:ghost-drag',
        'test:f535-f539:equipment-ghost-visual',
        'test:f530-f534:equipment-placement-preview',
        'vite build --configLoader runner',
      ],
      rollback: [
        'Ocultar handle F540 y conservar overlay pointer-events-none.',
        'Volver a preview por centro/menu contextual F530.',
        'Mantener canPersistGeometry=false hasta renderer/eventos profundos.',
      ],
    },
  };
}
