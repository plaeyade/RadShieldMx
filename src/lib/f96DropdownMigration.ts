import { buildF95DropdownSmokeSummary } from '@/lib/f95DropdownSmoke';
import type { F92WorkflowStageId } from '@/lib/f92RealWorkflow';

export type F96MigrationStatus = 'design-migrated-with-legacy-fallback' | 'blocked';

export interface F96DropdownMigrationSummary {
  phase: 'F96';
  status: F96MigrationStatus;
  migratedStage: F92WorkflowStageId;
  physicalMoveStarted: true;
  legacyFallbackKept: true;
  nextStages: F92WorkflowStageId[];
  guardrails: string[];
}

export function buildF96DropdownMigrationSummary(): F96DropdownMigrationSummary {
  const smoke = buildF95DropdownSmokeSummary();
  const canStart = smoke.nextAction === 'allow-staged-migration' && smoke.fail === 0;

  return {
    phase: 'F96',
    status: canStart ? 'design-migrated-with-legacy-fallback' : 'blocked',
    migratedStage: 'design',
    physicalMoveStarted: true,
    legacyFallbackKept: true,
    nextStages: ['equipment', 'shielding', 'verification', 'reports', 'evidence', 'integrations'],
    guardrails: [
      'Mover un solo grupo por fase.',
      'Conservar menu legacy hasta completar smoke visual y funcional.',
      'No cambiar handlers durante la migracion fisica.',
      'Validar TypeScript, build y contratos F92-F96 en cada paso.',
    ],
  };
}

