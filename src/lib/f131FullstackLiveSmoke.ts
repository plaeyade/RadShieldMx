export type F131FullstackLiveStatus = 'ready' | 'blocked' | 'partial';

export interface F131FullstackLiveSmoke {
  phase: 'F131';
  status: F131FullstackLiveStatus;
  stackMode: string;
  databaseTarget: string;
  frontendBackendEnv: {
    VITE_ENABLE_BACKEND: 'true';
    VITE_BACKEND_URL: string;
  };
  healthEndpoints: string[];
  protectedContracts: string[];
  validationSteps: string[];
  blockers: string[];
  nextPhase: string;
  decision: string;
}

export function buildF131FullstackLiveSmoke(
  status: F131FullstackLiveStatus = 'blocked',
): F131FullstackLiveSmoke {
  const ready = status === 'ready';

  return {
    phase: 'F131',
    status,
    stackMode: 'Frontend Vite + Hono/tRPC API + MySQL 8 Windows live DB',
    databaseTarget: 'radshield@127.0.0.1:3306/radshield_mx_test',
    frontendBackendEnv: {
      VITE_ENABLE_BACKEND: 'true',
      VITE_BACKEND_URL: 'http://localhost:3000/api/trpc',
    },
    healthEndpoints: ['/health', '/api/health/db', '/api/trpc/ping'],
    protectedContracts: [
      'auth.me',
      'project.list',
      'simulation.list',
      'dosimetry.listWorkspaces',
      'controlledZone.listPlans',
    ],
    validationSteps: [
      'Validate live MySQL schema and seed data.',
      'Confirm backend bundle from api/boot.ts is present.',
      'Run backend health checks against the imported Hono app.',
      'Run protected/public tRPC contract checks.',
      'Build frontend with VITE_ENABLE_BACKEND=true and backend URL set.',
    ],
    blockers: ready ? [] : ['F131 is blocked until DB, backend health and backend-enabled frontend build all pass.'],
    nextPhase: ready ? 'F132 RC full-stack persistence smoke' : 'Fix DB/API/build blockers before RC smoke',
    decision: ready
      ? 'F131 confirms the app can move from offline-stabilized UI to full-stack release validation.'
      : 'F131 keeps the full-stack gate explicit until the real DB/API/frontend path is verified.',
  };
}
