export type F133ApiAuthenticatedStatus = 'ready' | 'blocked' | 'partial';

export interface F133ApiAuthenticatedSmoke {
  phase: 'F133';
  status: F133ApiAuthenticatedStatus;
  authMode: string;
  userId: string;
  apiSurfaces: string[];
  dbReadback: string[];
  securityChecks: string[];
  nextPhase: string;
  decision: string;
}

export function buildF133ApiAuthenticatedSmoke(
  status: F133ApiAuthenticatedStatus = 'blocked',
): F133ApiAuthenticatedSmoke {
  const ready = status === 'ready';

  return {
    phase: 'F133',
    status,
    authMode: 'Signed kimi_sid session cookie against imported Hono/tRPC app',
    userId: 'f133-api-smoke',
    apiSurfaces: [
      'auth.me',
      'project.create/get/update/list',
      'calculation.create/getById/stats',
      'report.create/getById/update/list',
      'controlledZone.persistDraft/getPlan/listPlans',
    ],
    dbReadback: [
      'projects.userId ownership',
      'calculations.userId ownership',
      'reports.userId ownership',
      'controlled_zone_plans.user_id ownership',
      'analytic_memory_snapshots + project_report_exports evidence links',
    ],
    securityChecks: [
      'Unauthenticated protected request returns 401.',
      'Authenticated routers ignore spoofed userId input and use ctx.user.unionId.',
      'Controlled-zone getPlan returns only records owned by the signed session user.',
    ],
    nextPhase: ready ? 'F134 release-candidate E2E browser smoke' : 'Resolve API/auth blockers before browser RC smoke',
    decision: ready
      ? 'F133 confirms that the release-candidate persistence path works through authenticated tRPC API calls.'
      : 'F133 is blocked until authenticated tRPC persistence and ownership checks pass.',
  };
}
