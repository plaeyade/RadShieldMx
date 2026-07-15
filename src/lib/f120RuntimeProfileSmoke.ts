export interface F120RuntimeProfileSmokeSummary {
  phase: 'F120';
  status: 'implemented-runtime-smoke';
  runtimeScript: string;
  profiles: string[];
  surfaces: string[];
  screenshots: string[];
  nextPhase: string;
  decision: string;
}

export function buildF120RuntimeProfileSmokeSummary(): F120RuntimeProfileSmokeSummary {
  return {
    phase: 'F120',
    status: 'implemented-runtime-smoke',
    runtimeScript: 'scripts/check-f120-runtime-profile-smoke.mjs',
    profiles: ['DX', 'TX', 'NM', 'CY'],
    surfaces: ['Memoria IA', 'PDF Report', 'Evidence Pack'],
    screenshots: [
      'outputs/f120_runtime_profile_smoke_dx.png',
      'outputs/f120_runtime_profile_smoke_tx.png',
      'outputs/f120_runtime_profile_smoke_nm.png',
      'outputs/f120_runtime_profile_smoke_cy.png',
    ],
    nextPhase: 'F121 should use the runtime smoke evidence to tighten dialog UX labels, screenshots and release checklist wording.',
    decision: 'F120 validates profile selection and profile-aware documentation dialogs in a browser build while preserving explicit apply controls.',
  };
}
