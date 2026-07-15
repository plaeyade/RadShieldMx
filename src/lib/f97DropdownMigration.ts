import { buildF96DropdownMigrationSummary } from '@/lib/f96DropdownMigration';
import type { F92WorkflowStageId } from '@/lib/f92RealWorkflow';

export type F97MigrationStatus = 'equipment-migrated-with-legacy-fallback' | 'blocked';

export interface F97DropdownMigrationSummary {
  phase: 'F97';
  status: F97MigrationStatus;
  migratedStages: F92WorkflowStageId[];
  physicalMoveContinued: true;
  legacyFallbackKept: true;
  nextStages: F92WorkflowStageId[];
  pendingImprovements: string[];
}

export function buildF97DropdownMigrationSummary(): F97DropdownMigrationSummary {
  const f96 = buildF96DropdownMigrationSummary();
  const canContinue = f96.status === 'design-migrated-with-legacy-fallback';

  return {
    phase: 'F97',
    status: canContinue ? 'equipment-migrated-with-legacy-fallback' : 'blocked',
    migratedStages: ['design', 'equipment'],
    physicalMoveContinued: true,
    legacyFallbackKept: true,
    nextStages: ['shielding', 'verification', 'reports', 'evidence', 'integrations'],
    pendingImprovements: [
      'Consolidar duplicados entre Med. Nuclear, Herramientas y Equipos migrado.',
      'Agregar smoke visual con Playwright para dropdowns migrados.',
      'Definir iconografia unificada para LINAC, Gamma Knife, HDR, PET/CT, CT y ciclotron.',
      'Mantener fallback legacy hasta completar migracion de todos los grupos.',
    ],
  };
}

