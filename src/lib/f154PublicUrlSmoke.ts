export type F154PublicUrlSmokeStatus = 'ready' | 'ready-to-run' | 'gated';

export interface F154PublicUrlSmoke {
  phase: 'F154';
  status: F154PublicUrlSmokeStatus;
  generatedAt: string;
  requiredInputs: string[];
  smokeSurfaces: string[];
  blockingPrerequisites: string[];
  command: string;
  nextPhase: string;
  finalStatement: string;
}

export function buildF154PublicUrlSmoke(status: F154PublicUrlSmokeStatus = 'gated'): F154PublicUrlSmoke {
  return {
    phase: 'F154',
    status,
    generatedAt: '2026-07-15',
    requiredInputs: [
      'PUBLIC_DEPLOY_URL or PLAYWRIGHT_TEST_BASE_URL',
      'RADSHIELD_ALLOW_PUBLIC_SMOKE=1',
      'F153 restore probe ready',
      'dist/index.html from current build',
    ],
    smokeSurfaces: [
      'topbar canonical menus',
      'canvas/floorplan visible and sized',
      'CAD/readiness panels',
      'Update App F150-F154 evidence cards',
      'Memoria IA/PDF/Evidence entry points',
    ],
    blockingPrerequisites: [
      'F153 restore probe must pass or be waived explicitly for offline-only release.',
      'Final public/staging URL must be configured.',
      'Public smoke must be run against deployed artifact, not local preview.',
    ],
    command: 'RADSHIELD_ALLOW_PUBLIC_SMOKE=1 PUBLIC_DEPLOY_URL=https://<url-final> npm run prepare:f154:public-smoke',
    nextPhase: 'F155 publicacion controlada',
    finalStatement:
      status === 'ready'
        ? 'F154 confirma smoke en URL final y puede pasar a publicacion controlada.'
        : 'F154 queda preparado, pero bloquea publicacion hasta tener URL final y F153 restore probe listo.',
  };
}

export function formatF154PublicUrlSmokeText(summary = buildF154PublicUrlSmoke()): string {
  return [
    'F154 SMOKE URL FINAL',
    `   Estado: ${summary.status}`,
    '   Requisitos:',
    ...summary.requiredInputs.map((item) => `   - ${item}`),
    '   Superficies:',
    ...summary.smokeSurfaces.map((item) => `   - ${item}`),
    `   Comando: ${summary.command}`,
    `   Cierre: ${summary.finalStatement}`,
  ].join('\n');
}
