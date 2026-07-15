export type F153DbBackupRestoreStatus = 'ready' | 'backup-ready-restore-gated' | 'blocked';

export interface F153DbBackupRestore {
  phase: 'F153';
  status: F153DbBackupRestoreStatus;
  generatedAt: string;
  requiredFlags: string[];
  expectedArtifacts: string[];
  safetyPolicy: string[];
  nextPhase: string;
  finalStatement: string;
}

export function buildF153DbBackupRestore(status: F153DbBackupRestoreStatus = 'backup-ready-restore-gated'): F153DbBackupRestore {
  return {
    phase: 'F153',
    status,
    generatedAt: '2026-07-15',
    requiredFlags: [
      'RADSHIELD_ALLOW_DB_BACKUP=1',
      'RADSHIELD_ALLOW_DB_RESTORE_PROBE=1',
    ],
    expectedArtifacts: [
      'outputs/f153_db_backup_restore/f153_db_backup_restore.json',
      'outputs/f153_db_backup_restore/db_backup/*.sql',
      'outputs/fase_153_db_backup_restore.md',
    ],
    safetyPolicy: [
      'No imprimir DATABASE_URL ni password.',
      'Restaurar siempre en una base temporal con prefijo radshield_restore_probe_.',
      'Eliminar la base temporal al terminar, salvo RADSHIELD_KEEP_RESTORE_DB=1.',
      'No modificar ni truncar la base original.',
    ],
    nextPhase: 'F154 smoke URL final',
    finalStatement:
      status === 'ready'
        ? 'F153 confirma backup y restore probe real; la publicacion puede avanzar a smoke de URL final.'
        : 'F153 deja el flujo de backup/restore listo, pero no debe publicarse hasta tener dump y restore probe con evidencia.',
  };
}

export function formatF153DbBackupRestoreText(summary = buildF153DbBackupRestore()): string {
  return [
    'F153 BACKUP/RESTORE DB',
    `   Estado: ${summary.status}`,
    '   Flags:',
    ...summary.requiredFlags.map((flag) => `   - ${flag}`),
    '   Artefactos:',
    ...summary.expectedArtifacts.map((artifact) => `   - ${artifact}`),
    '   Politica:',
    ...summary.safetyPolicy.map((item) => `   - ${item}`),
    `   Cierre: ${summary.finalStatement}`,
  ].join('\n');
}
