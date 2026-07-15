export type F155ControlledReleaseDecisionStatus =
  | 'public-release-ready'
  | 'offline-rc-ready'
  | 'blocked';

export interface F155ControlledReleaseDecision {
  phase: 'F155';
  status: F155ControlledReleaseDecisionStatus;
  generatedAt: string;
  decisionModes: string[];
  requiredEvidence: string[];
  blockingRules: string[];
  operatorCommands: string[];
  nextPhase: string;
  finalStatement: string;
}

export function buildF155ControlledReleaseDecision(
  status: F155ControlledReleaseDecisionStatus = 'blocked',
): F155ControlledReleaseDecision {
  return {
    phase: 'F155',
    status,
    generatedAt: '2026-07-15',
    decisionModes: [
      'public-release-ready: F153 restore probe OK + F154 public URL smoke OK',
      'offline-rc-ready: F150 RC OK + F153 backup OK + waiver offline explicito',
      'blocked: faltan evidencias, URL final, restore probe o smoke browser',
    ],
    requiredEvidence: [
      'F150 release candidate controlled manifest',
      'F151 prepublish hardening manifest',
      'F152 production environment prep manifest',
      'F153 DB backup/restore manifest with dump hash',
      'F154 public/staging URL smoke manifest',
    ],
    blockingRules: [
      'No public deploy without F153 restore probe ready.',
      'No public deploy without F154 smoke against final URL.',
      'No offline release without explicit RADSHIELD_ALLOW_OFFLINE_RELEASE_WAIVER=1.',
      'No release if build artifacts or evidence manifests are missing.',
    ],
    operatorCommands: [
      'npm run prepare:f153:db-backup-restore',
      'npm run prepare:f154:public-smoke',
      'npm run prepare:f155:release-decision',
      'npm run test:f155:release-decision',
    ],
    nextPhase: 'F156 publicacion/paquete final segun decision F155',
    finalStatement:
      status === 'public-release-ready'
        ? 'F155 autoriza publicacion controlada: backup/restore y smoke URL final estan listos.'
        : status === 'offline-rc-ready'
          ? 'F155 autoriza paquete RC offline controlado; publicacion publica sigue bloqueada.'
          : 'F155 bloquea publicacion hasta cerrar restore DB, URL final y smoke publico.',
  };
}

export function formatF155ControlledReleaseDecisionText(
  summary = buildF155ControlledReleaseDecision(),
): string {
  return [
    'F155 DECISION DE RELEASE CONTROLADO',
    `   Estado: ${summary.status}`,
    '   Modos:',
    ...summary.decisionModes.map((item) => `   - ${item}`),
    '   Evidencia:',
    ...summary.requiredEvidence.map((item) => `   - ${item}`),
    '   Reglas:',
    ...summary.blockingRules.map((item) => `   - ${item}`),
    `   Cierre: ${summary.finalStatement}`,
  ].join('\n');
}
