import { F92_REAL_WORKFLOW, type F92WorkflowStageId } from '@/lib/f92RealWorkflow';

export type F108QuickAccessPhase = 'now-document-only' | 'f111-low-risk' | 'f112-feature-flag' | 'post-release';

export interface F108QuickAccessImplementationStep {
  phase: F108QuickAccessPhase;
  label: string;
  implementWhen: string;
  scope: string;
  risk: 'none' | 'low' | 'medium';
}

export interface F108VerificationMigration {
  phase: 'F108';
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
  quickAccessImplementationPlan: F108QuickAccessImplementationStep[];
  nextGroups: string[];
  physicalRemovalNow: boolean;
  decision: string;
}

export function buildF108VerificationQuickAccessPlan(): F108VerificationMigration {
  const canonicalIds: F92WorkflowStageId[] = ['design', 'equipment', 'shielding', 'verification'];

  return {
    phase: 'F108',
    status: 'controlled-migration',
    targetFlow: F92_REAL_WORKFLOW.map((stage) => stage.label),
    migratedGroups: F92_REAL_WORKFLOW.map((stage) => ({
      id: stage.id,
      label: stage.label,
      physicalState: canonicalIds.includes(stage.id) ? 'canonical-dropdown' : 'pending',
      legacyFallback: stage.id === 'design' ? 'hidden' : canonicalIds.includes(stage.id) ? 'labeled-rollback' : 'unchanged',
    })),
    canonicalCommands: [
      'NCRP validation suite',
      'NCRP 147 vs 151 cross-validation',
      'Shielding verification',
      'Sensitivity analysis',
      'Uncertainty / GUM',
      'Dose map / heatmap',
      'Performance dashboard',
      'Continuous tests',
    ],
    labeledRollbackItems: [
      'Uncertainty fallback F108',
      'GUM fallback F108',
      'Tornado sensitivity fallback F108',
      'NCRP validation fallback F108',
      'Performance dashboard fallback F108',
      'Continuous tests fallback F108',
    ],
    quickAccessImplementationPlan: [
      {
        phase: 'now-document-only',
        label: 'No tocar Acceso Rapido durante F108',
        implementWhen: 'Mientras los menus canonicos sigan migrando y los fallbacks sigan visibles.',
        scope: 'Documentar alternativas y dependencias sin cambiar la barra actual DX/TX/NM/CY.',
        risk: 'none',
      },
      {
        phase: 'f111-low-risk',
        label: 'Favoritos fijables',
        implementWhen: 'Despues de migrar Reportes/Evidencia y pasar smoke de submenus.',
        scope: 'Agregar favoritos como capa adicional; no reemplaza botones existentes ni handlers.',
        risk: 'none',
      },
      {
        phase: 'f111-low-risk',
        label: 'Chips de estado operativo',
        implementWhen: 'Cuando el flujo Layout -> Equipo -> Zona -> Calculo -> Heatmap -> Evidencia este estable.',
        scope: 'Mostrar estados y deep links hacia dialogos ya existentes.',
        risk: 'low',
      },
      {
        phase: 'f112-feature-flag',
        label: 'Paleta contextual por modo',
        implementWhen: 'Despues de smoke visual del canvas con equipos DX/TX/NM/CY.',
        scope: 'Feature flag opcional para cambiar acciones segun modalidad y etapa.',
        risk: 'low',
      },
      {
        phase: 'post-release',
        label: 'Ribbon compacto por flujo',
        implementWhen: 'Despues del release candidate o en rama experimental.',
        scope: 'Puede reemplazar estructura visual; requiere A/B, screenshots y rollback.',
        risk: 'medium',
      },
    ],
    nextGroups: ['Reportes', 'Evidencia', 'Integraciones'],
    physicalRemovalNow: false,
    decision: 'Verification becomes canonical in F108. Quick Access alternatives should start after menu migration smoke, with favorites and status chips first because they do not disrupt current operation.',
  };
}
