import { F92_REAL_WORKFLOW, type F92WorkflowStageId } from '@/lib/f92RealWorkflow';

export interface F109ReportsMenuMigration {
  phase: 'F109';
  status: 'controlled-migration';
  targetFlow: string[];
  migratedGroups: Array<{
    id: F92WorkflowStageId;
    label: string;
    physicalState: 'canonical-dropdown' | 'pending';
    legacyFallback: 'hidden' | 'labeled-rollback' | 'unchanged';
  }>;
  canonicalCommands: string[];
  labeledRollbackItems: string[];
  nextGroups: string[];
  physicalRemovalNow: boolean;
  decision: string;
}

export function buildF109ReportsMenuMigration(): F109ReportsMenuMigration {
  const canonicalIds: F92WorkflowStageId[] = ['design', 'equipment', 'shielding', 'verification', 'reports'];

  return {
    phase: 'F109',
    status: 'controlled-migration',
    targetFlow: F92_REAL_WORKFLOW.map((stage) => stage.label),
    migratedGroups: F92_REAL_WORKFLOW.map((stage) => ({
      id: stage.id,
      label: stage.label,
      physicalState: canonicalIds.includes(stage.id) ? 'canonical-dropdown' : 'pending',
      legacyFallback: stage.id === 'design' ? 'hidden' : canonicalIds.includes(stage.id) ? 'labeled-rollback' : 'unchanged',
    })),
    canonicalCommands: [
      'Memoria IA',
      'PDF analitico',
      'Reporte CNSNS',
      'Dashboard de reportes',
      'Costo / presupuesto',
      'Checklist CNSNS',
      'Reporte anual de dosis',
      'Evidence Pack bridge',
    ],
    labeledRollbackItems: [
      'Export PDF fallback F109',
      'Export CNSNS fallback F109',
      'Annual Dose Report fallback F109',
      'Reports dashboard fallback F109',
      'Cost dashboard fallback F109',
      'CNSNS checklist fallback F109',
      'Evidence Pack fallback F109',
    ],
    nextGroups: ['Evidencia', 'Integraciones'],
    physicalRemovalNow: false,
    decision: 'Reports becomes canonical in F109. Legacy export/report entries remain labeled fallback until report generation and evidence smoke pass.',
  };
}
