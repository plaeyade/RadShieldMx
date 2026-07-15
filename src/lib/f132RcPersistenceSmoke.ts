export type F132RcPersistenceStatus = 'ready' | 'blocked' | 'partial';

export interface F132RcPersistenceSmoke {
  phase: 'F132';
  status: F132RcPersistenceStatus;
  userId: string;
  surfaces: string[];
  persistenceChecks: string[];
  evidenceTables: string[];
  destructiveScope: string;
  nextPhase: string;
  decision: string;
}

export function buildF132RcPersistenceSmoke(
  status: F132RcPersistenceStatus = 'blocked',
): F132RcPersistenceSmoke {
  const ready = status === 'ready';

  return {
    phase: 'F132',
    status,
    userId: 'f132-rc-smoke',
    surfaces: [
      'projects',
      'calculations',
      'reports',
      'controlled_zone_plans',
      'controlled_zone_calculations',
      'analytic_memory_snapshots',
      'project_report_exports',
      'audit_trail',
    ],
    persistenceChecks: [
      'Insert full floorplan project snapshot.',
      'Insert shielding calculation with formula/evidence fields in JSON.',
      'Insert analytical-memory report and update it.',
      'Persist controlled-zone plan with barrier calculations.',
      'Persist analytic memory snapshot and export evidence hash.',
      'Read back all created records and verify counts/links.',
    ],
    evidenceTables: [
      'analytic_memory_snapshots',
      'project_report_exports',
      'audit_trail',
    ],
    destructiveScope:
      'Only rows owned by userId=f132-rc-smoke or plan/export IDs prefixed with f132-rc-smoke are cleaned before rerun.',
    nextPhase: ready ? 'F133 API-authenticated persistence smoke' : 'Resolve persistence blockers before RC API smoke',
    decision: ready
      ? 'F132 confirms release-candidate persistence across project, calculation, controlled-zone, report and evidence tables.'
      : 'F132 is blocked until the full persistence chain can be written and read back from MySQL.',
  };
}
