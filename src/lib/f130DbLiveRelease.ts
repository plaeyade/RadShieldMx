export type F130DbLiveStatus = 'ready' | 'blocked' | 'partial';

export interface F130DbLiveRelease {
  phase: 'F130';
  status: F130DbLiveStatus;
  mysqlTarget: string;
  expectedTables: string[];
  liveSeedPolicy: string;
  validationSteps: string[];
  blockers: string[];
  decision: string;
}

export function buildF130DbLiveRelease(status: F130DbLiveStatus = 'blocked'): F130DbLiveRelease {
  const ready = status === 'ready';
  return {
    phase: 'F130',
    status,
    mysqlTarget: 'radshield@127.0.0.1:3306/radshield_mx_test',
    expectedTables: [
      'projects',
      'calculations',
      'materials',
      'equipment',
      'documents',
      'document_chunks',
      'analytic_memory_snapshots',
      'controlled_zone_calculations',
      'project_report_exports',
    ],
    liveSeedPolicy:
      'Run migrations before seed. Document seed stays dry-run unless DATABASE_URL auth, schema validation and explicit seed command pass.',
    validationSteps: [
      'Create database/user/grants with an admin connection.',
      'Validate app DATABASE_URL authentication.',
      'Run drizzle migrations.',
      'Run app seed.',
      'Run live DB validation and document seed readiness checks.',
    ],
    blockers: ready ? [] : ['Live DB release is blocked until authentication, migrations and seed all pass.'],
    decision: ready
      ? 'F130 DB live path is ready for release-candidate validation.'
      : 'F130 prepares DB live release gates without pretending the database is ready.',
  };
}
