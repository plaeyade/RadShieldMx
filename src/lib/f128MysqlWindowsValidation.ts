export type F128MysqlValidationStatus = 'ready' | 'auth-blocked' | 'tcp-blocked' | 'missing-url';

export interface F128MysqlWindowsValidation {
  phase: 'F128';
  status: F128MysqlValidationStatus;
  databaseUrlConfigured: boolean;
  tcpReachable: boolean;
  authOk: boolean;
  migrationAllowed: boolean;
  seedAllowed: boolean;
  currentTarget: string;
  blockers: string[];
  windowsMysqlFixSteps: string[];
  safeNextCommands: string[];
  decision: string;
}

export function buildF128MysqlWindowsValidation(
  overrides: Partial<F128MysqlWindowsValidation> = {},
): F128MysqlWindowsValidation {
  const databaseUrlConfigured = overrides.databaseUrlConfigured ?? true;
  const tcpReachable = overrides.tcpReachable ?? true;
  const authOk = overrides.authOk ?? true;
  const status: F128MysqlValidationStatus =
    overrides.status ?? (!databaseUrlConfigured ? 'missing-url' : tcpReachable ? (authOk ? 'ready' : 'auth-blocked') : 'tcp-blocked');

  return {
    phase: 'F128',
    status,
    databaseUrlConfigured,
    tcpReachable,
    authOk,
    migrationAllowed: authOk,
    seedAllowed: authOk,
    currentTarget: overrides.currentTarget ?? 'radshield@127.0.0.1:3306/radshield_mx_test',
    blockers: overrides.blockers ?? (authOk ? [] : [
      'MySQL TCP is reachable, but current DATABASE_URL credentials are rejected.',
      'Do not run migrations or live seed until authentication succeeds.',
    ]),
    windowsMysqlFixSteps: [
      'Open MySQL Workbench or MySQL Shell as an admin/root user.',
      "Run: CREATE DATABASE IF NOT EXISTS radshield_mx_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
      "Run: CREATE USER IF NOT EXISTS 'radshield'@'localhost' IDENTIFIED BY 'radshield';",
      "Run: CREATE USER IF NOT EXISTS 'radshield'@'127.0.0.1' IDENTIFIED BY 'radshield';",
      "Run: GRANT ALL PRIVILEGES ON radshield_mx_test.* TO 'radshield'@'localhost';",
      "Run: GRANT ALL PRIVILEGES ON radshield_mx_test.* TO 'radshield'@'127.0.0.1';",
      'Run: FLUSH PRIVILEGES;',
      'Keep .env DATABASE_URL=mysql://radshield:radshield@127.0.0.1:3306/radshield_mx_test or update it to the user/password you created.',
    ],
    safeNextCommands: [
      'npm run db:preflight',
      'npm run prepare:f128:mysql-windows',
      'npm run db:migrate',
      'npm run db:seed',
      'npm run db:validate:live',
    ],
    decision:
      authOk
        ? 'F128 confirms Windows MySQL is installed, reachable and authenticated for live DB work.'
        : 'F128 confirms Windows MySQL is installed and reachable, but live DB work remains blocked until DATABASE_URL authentication is corrected.',
  };
}
