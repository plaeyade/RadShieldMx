import type { F525F529Modality } from '@/lib/f525F529ClinicalPlacementPack';

export interface F545F549GhostSourceCommitContract {
  schema: 'radshield-mx.f545-f549.ghost-source-commit.v1';
  phaseRange: 'F545-F549';
  status: 'source-commit-ready';
  gate: {
    canCreateRadiationSource: true;
    canWriteBarriers: false;
    canReplaceRenderer: false;
    requiresGhostPoint: true;
    clearsGhostAfterCommit: true;
  };
  sourceDefaults: Record<F525F529Modality, {
    modalityId: string;
    workloadValue: number;
    workloadHoursPerWeek?: number;
    useFactor: number;
    manufacturerVariant: string;
  }>;
  phases: Array<{
    phase: 'F545' | 'F546' | 'F547' | 'F548' | 'F549';
    label: string;
    effect: string;
    risk: 'low' | 'medium' | 'high';
  }>;
  qa: {
    requiredChecks: string[];
    rollback: string[];
  };
}

export function buildF545F549GhostSourceCommit(): F545F549GhostSourceCommitContract {
  return {
    schema: 'radshield-mx.f545-f549.ghost-source-commit.v1',
    phaseRange: 'F545-F549',
    status: 'source-commit-ready',
    gate: {
      canCreateRadiationSource: true,
      canWriteBarriers: false,
      canReplaceRenderer: false,
      requiresGhostPoint: true,
      clearsGhostAfterCommit: true,
    },
    sourceDefaults: {
      TX: { modalityId: 'linac-15mv', workloadValue: 500, workloadHoursPerWeek: 40, useFactor: 0.25, manufacturerVariant: 'Elekta Versa HD 15 MV / Gamma Knife Esprit' },
      NM: { modalityId: 'pet-f18', workloadValue: 3700, workloadHoursPerWeek: 40, useFactor: 1, manufacturerVariant: 'PET/CT 511 keV' },
      DX: { modalityId: 'ct-body', workloadValue: 100, workloadHoursPerWeek: 40, useFactor: 1, manufacturerVariant: 'CT diagnostico' },
      CY: { modalityId: 'cyclotron-16mev', workloadValue: 40, workloadHoursPerWeek: 40, useFactor: 1, manufacturerVariant: 'Cyclone KIUBE 18 MeV provisional' },
    },
    phases: [
      {
        phase: 'F545',
        label: 'Crear fuente desde ghost',
        effect: 'Promueve el punto candidato F530/F540 a RadiationSource real del floorplan.',
        risk: 'medium',
      },
      {
        phase: 'F546',
        label: 'Mapeo modalidad/equipo',
        effect: 'Asigna modalidad, workload, use factor, footprint y variante de fabricante.',
        risk: 'medium',
      },
      {
        phase: 'F547',
        label: 'Seleccion automatica',
        effect: 'Selecciona la fuente creada para que aparezca inspector, grips y rotacion.',
        risk: 'low',
      },
      {
        phase: 'F548',
        label: 'Ghost cleanup',
        effect: 'Oculta el ghost despues de crear la fuente para evitar doble lectura visual.',
        risk: 'low',
      },
      {
        phase: 'F549',
        label: 'QA visual y rollback',
        effect: 'Valida conteo de fuentes, seleccion y captura; rollback por undo existente.',
        risk: 'medium',
      },
    ],
    qa: {
      requiredChecks: [
        'test:f545-f549:ghost-source-commit',
        'test:f545-f549:ghost-source-commit:e2e',
        'test:f540-f544:ghost-drag',
        'vite build --configLoader runner',
      ],
      rollback: [
        'Usar undo para retirar la fuente creada.',
        'Volver al ghost F530-F544 sin persistir barreras.',
        'No activar escritura de barreras ni reemplazo del renderer base.',
      ],
    },
  };
}
