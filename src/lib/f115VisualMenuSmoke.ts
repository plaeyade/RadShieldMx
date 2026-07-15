export interface F115VisualMenuSmoke {
  phase: 'F115';
  status: 'planned-runtime-smoke';
  requiredCanonicalTriggers: string[];
  requiredProfileTriggers: string[];
  requiredLegacyTriggers: string[];
  forbiddenLegacyTriggers: string[];
  smokeOutput: string;
  nextPhase: string;
  decision: string;
}

export function buildF115VisualMenuSmoke(): F115VisualMenuSmoke {
  return {
    phase: 'F115',
    status: 'planned-runtime-smoke',
    requiredCanonicalTriggers: [
      'f96-migrated-design-dropdown',
      'f97-migrated-equipment-dropdown',
      'f107-migrated-shielding-dropdown',
      'f108-migrated-verification-dropdown',
      'f109-migrated-reports-dropdown',
      'f110-migrated-evidence-dropdown',
      'f116-migrated-integrations-dropdown',
    ],
    requiredProfileTriggers: ['f113-profile-dx', 'f113-profile-tx', 'f113-profile-nm', 'f113-profile-cy'],
    requiredLegacyTriggers: ['Archivo'],
    forbiddenLegacyTriggers: ['Calcular', 'Fisica', 'Med. Nuclear', 'Normativa', 'Herramientas', 'Eficiencia'],
    smokeOutput: 'outputs/f115_visual_menu_smoke_result.json',
    nextPhase: 'F117 should connect active modality profiles with Memoria IA defaults, report templates and Evidence Pack routing.',
    decision: 'F115/F116 validates the visible menu surface after utility consolidation: canonical workflow triggers, modality profiles, Integraciones and only Archivo as retained utility.',
  };
}
