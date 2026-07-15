export type F157OperationalClosureStatus =
  | 'controlled-local-ready'
  | 'external-public-ready'
  | 'closure-gated';

export interface F157OperationalClosure {
  phase: 'F157';
  status: F157OperationalClosureStatus;
  generatedAt: string;
  closureScope: string[];
  releaseEvidence: string[];
  operatingChecklist: string[];
  publicUrlReminder: string;
  nextPhase: string;
  finalStatement: string;
}

export function buildF157OperationalClosure(
  status: F157OperationalClosureStatus = 'controlled-local-ready',
): F157OperationalClosure {
  return {
    phase: 'F157',
    status,
    generatedAt: '2026-07-15',
    closureScope: [
      'local/staging release closure',
      'frontend build and backend boot artifact',
      'MySQL backup/restore evidence',
      'browser smoke evidence',
      'release package manifest',
    ],
    releaseEvidence: [
      'F153 DB backup/restore ready',
      'F154 browser smoke ready',
      'F155 release decision ready',
      'F156 final package ready',
    ],
    operatingChecklist: [
      'Start MySQL before backend.',
      'Use configured DATABASE_URL without printing secrets.',
      'Serve frontend dist or deploy static artifact.',
      'Start backend from dist-backend/server/boot.js when backend mode is enabled.',
      'Run F154 again after any public URL deployment.',
    ],
    publicUrlReminder:
      'A public external URL still requires rerunning F154/F155/F156 against PUBLIC_DEPLOY_URL=https://...',
    nextPhase: 'F158 post-release smoke/public deployment or documentation freeze',
    finalStatement:
      status === 'external-public-ready'
        ? 'F157 cierra release operativo con URL publica externa validada.'
        : status === 'controlled-local-ready'
          ? 'F157 cierra release operativo local/staging y deja pendiente solo la validacion con URL publica externa.'
          : 'F157 no puede cerrar operacion hasta que F156 este listo.',
  };
}

export function formatF157OperationalClosureText(summary = buildF157OperationalClosure()): string {
  return [
    'F157 CIERRE OPERATIVO',
    `   Estado: ${summary.status}`,
    '   Alcance:',
    ...summary.closureScope.map((item) => `   - ${item}`),
    '   Evidencia:',
    ...summary.releaseEvidence.map((item) => `   - ${item}`),
    '   Checklist:',
    ...summary.operatingChecklist.map((item) => `   - ${item}`),
    `   Cierre: ${summary.finalStatement}`,
  ].join('\n');
}
