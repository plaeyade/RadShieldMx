import { F92_REAL_WORKFLOW, type F92WorkflowStageId } from '@/lib/f92RealWorkflow';
import { buildF105FinalMenuSmokeGate } from '@/lib/f105FinalMenuSmokeGate';

export type F106MigrationStatus = 'controlled-migration' | 'blocked';

export interface F106MigratedGroup {
  id: F92WorkflowStageId;
  label: string;
  physicalState: 'canonical-dropdown' | 'pending';
  legacyFallback: 'hidden' | 'labeled-rollback' | 'unchanged';
  removalAllowed: boolean;
  evidenceRequired: string[];
}

export interface F106PhysicalMenuMigration {
  phase: 'F106';
  status: F106MigrationStatus;
  targetFlow: string[];
  migratedGroups: F106MigratedGroup[];
  fallbackPolicy: string;
  hiddenLegacyGroups: string[];
  labeledRollbackItems: string[];
  physicalRemovalNow: boolean;
  nextGroups: string[];
  unresolvedRuntimeWarnings: string[];
  decision: string;
}

export function buildF106PhysicalMenuMigration(): F106PhysicalMenuMigration {
  const f105 = buildF105FinalMenuSmokeGate();
  const gateReady = f105.fail === 0 && f105.totalCommands > 0;

  const migratedGroups: F106MigratedGroup[] = F92_REAL_WORKFLOW.map((stage) => {
    const isDesign = stage.id === 'design';
    const isEquipment = stage.id === 'equipment';
    return {
      id: stage.id,
      label: stage.label,
      physicalState: isDesign || isEquipment ? 'canonical-dropdown' : 'pending',
      legacyFallback: isDesign ? 'hidden' : isEquipment ? 'labeled-rollback' : 'unchanged',
      removalAllowed: false,
      evidenceRequired: [
        'runtime submenu smoke',
        'dialog open evidence',
        'visual screenshot',
        'rollback path verified',
      ],
    };
  });

  return {
    phase: 'F106',
    status: gateReady ? 'controlled-migration' : 'blocked',
    targetFlow: F92_REAL_WORKFLOW.map((stage) => stage.label),
    migratedGroups,
    fallbackPolicy: 'Design is canonical in the workflow dropdown; Equipment is canonical with explicit rollback labels in legacy menus. No mass legacy deletion before visual/runtime evidence.',
    hiddenLegacyGroups: ['Diseno legacy dropdown'],
    labeledRollbackItems: [
      'Gamma Knife fallback',
      'Braquiterapia Co-60 fallback',
      'CBCT/IGRT fallback',
      'Medicina Nuclear fallback',
      'Equipment Library rollback F106',
      'Equipment Manager rollback F106',
    ],
    physicalRemovalNow: false,
    nextGroups: ['Blindaje', 'Verificacion', 'Reportes', 'Evidencia', 'Integraciones'],
    unresolvedRuntimeWarnings: [
      'backend CSP/fetch warnings in preview until API origin is configured',
      'duplicate React key Rb-82 in radionuclide lists',
    ],
    decision: gateReady
      ? 'Proceed with one-group-at-a-time physical migration. F106 marks Design and Equipment as canonical while preserving labeled rollback paths.'
      : 'Stop physical migration until F105 smoke gate is repaired.',
  };
}
