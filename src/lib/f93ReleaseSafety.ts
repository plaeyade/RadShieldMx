import { F92_REAL_WORKFLOW } from '@/lib/f92RealWorkflow';

export type F93DropdownMigrationStatus = 'defer-physical-move';

export interface F93DropdownMigrationDecision {
  phase: 'F93';
  status: F93DropdownMigrationStatus;
  decision: string;
  reason: string;
  prerequisites: string[];
  stagedGroups: Array<{
    stage: string;
    dialogs: string[];
  }>;
}

export const F93_DROPDOWN_MIGRATION_DECISION: F93DropdownMigrationDecision = {
  phase: 'F93',
  status: 'defer-physical-move',
  decision: 'Mantener los dropdowns fisicos en su ubicacion actual durante F93 y usar el flujo real F92 como guia visible.',
  reason: 'Los handlers legacy de menus, submenus y dialogos ya estan validados. Moverlos ahora aumentaria el riesgo de romper accesos mientras se estabiliza RAG, evidencia y release QA.',
  prerequisites: [
    'Smoke de paridad por grupo: Diseno, Equipos, Blindaje, Verificacion, Reportes, Evidencia e Integraciones.',
    'Mapa de handlers sin duplicados ni botones huerfanos.',
    'Captura de regresion visual de toolbar y menus antes/despues.',
    'Fallback visible para comandos criticos de calculo, exportacion y Evidence Pack.',
  ],
  stagedGroups: F92_REAL_WORKFLOW.map((stage) => ({
    stage: stage.label,
    dialogs: stage.primaryDialogs,
  })),
};

