import { F92_REAL_WORKFLOW, type F92WorkflowStageId } from '@/lib/f92RealWorkflow';

export interface F107QuickAccessOption {
  id: string;
  label: string;
  benefit: string;
  operationRisk: 'none' | 'low' | 'medium';
  recommendation: string;
}

export interface F107MigratedGroup {
  id: F92WorkflowStageId;
  label: string;
  physicalState: 'canonical-dropdown' | 'pending';
  legacyFallback: 'hidden' | 'labeled-rollback' | 'unchanged';
}

export interface F107ShieldingMenuMigration {
  phase: 'F107';
  status: 'controlled-migration';
  targetFlow: string[];
  migratedGroups: F107MigratedGroup[];
  canonicalCommands: string[];
  labeledRollbackItems: string[];
  quickAccessAlternatives: F107QuickAccessOption[];
  nextGroups: string[];
  physicalRemovalNow: boolean;
  decision: string;
}

export function buildF107ShieldingMenuMigration(): F107ShieldingMenuMigration {
  const migratedGroups: F107MigratedGroup[] = F92_REAL_WORKFLOW.map((stage) => {
    const isCanonical = stage.id === 'design' || stage.id === 'equipment' || stage.id === 'shielding';
    return {
      id: stage.id,
      label: stage.label,
      physicalState: isCanonical ? 'canonical-dropdown' : 'pending',
      legacyFallback: stage.id === 'design' ? 'hidden' : isCanonical ? 'labeled-rollback' : 'unchanged',
    };
  });

  return {
    phase: 'F107',
    status: 'controlled-migration',
    targetFlow: F92_REAL_WORKFLOW.map((stage) => stage.label),
    migratedGroups,
    canonicalCommands: [
      'Calcular blindaje',
      'Calculadora UAQ/NCRP',
      'Quick Barrier',
      'Suelo/Techo',
      'Multi-layer/Laminated',
      'Neutrones',
      'Skyshine',
      'Optimizacion',
      'PET/SPECT/Terapia',
    ],
    labeledRollbackItems: [
      'Calcular fallback F107',
      'UAQ/NCRP fallback F107',
      'Quick Barrier fallback F107',
      'Suelo/Techo fallback F107',
      'Neutrones fallback F107',
      'AAPM TG 108 fallback F107',
      'IPEM 109 fallback F107',
      'Therapy Radionuclide fallback F107',
    ],
    quickAccessAlternatives: [
      {
        id: 'mode-aware-palette',
        label: 'Paleta contextual por modo',
        benefit: 'Mostrar acciones DX/TX/NM/CY segun equipo activo y etapa del flujo.',
        operationRisk: 'low',
        recommendation: 'Agregar como capa opcional sin remover los botones DX/TX/NM/CY actuales.',
      },
      {
        id: 'command-ribbon',
        label: 'Ribbon compacto por flujo',
        benefit: 'Convertir acceso rapido en mini-ribbon: Plano, Equipo, Blindaje, Evidencia.',
        operationRisk: 'medium',
        recommendation: 'Probar detras de feature flag antes de reemplazar la barra actual.',
      },
      {
        id: 'favorites-pin',
        label: 'Favoritos fijables',
        benefit: 'Permitir que el usuario fije comandos frecuentes sin tocar la logica existente.',
        operationRisk: 'none',
        recommendation: 'Implementar primero porque no afecta handlers ni menus.',
      },
      {
        id: 'workflow-status-chips',
        label: 'Chips de estado operativo',
        benefit: 'Mostrar Layout, Equipo, Zona, Calculo, Heatmap, Evidencia y DB con estado listo/pendiente.',
        operationRisk: 'none',
        recommendation: 'Integrar con el panel F90/F91 ya existente y mantener click-through a dialogos.',
      },
    ],
    nextGroups: ['Verificacion', 'Reportes', 'Evidencia', 'Integraciones'],
    physicalRemovalNow: false,
    decision: 'Blindaje becomes the third canonical workflow dropdown. Legacy commands stay labeled as F107 fallback until visual and submenu smoke evidence pass.',
  };
}
