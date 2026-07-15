export type F156FinalPackageStatus =
  | 'public-package-ready'
  | 'offline-package-ready'
  | 'package-gated';

export interface F156FinalPackage {
  phase: 'F156';
  status: F156FinalPackageStatus;
  generatedAt: string;
  packageContents: string[];
  deliveryModes: string[];
  hardGates: string[];
  operatorCommands: string[];
  nextPhase: string;
  finalStatement: string;
}

export function buildF156FinalPackage(status: F156FinalPackageStatus = 'package-gated'): F156FinalPackage {
  return {
    phase: 'F156',
    status,
    generatedAt: '2026-07-15',
    packageContents: [
      'frontend dist build',
      'backend dist-backend boot artifact',
      'F150-F155 release evidence manifests',
      'F153 DB backup dump/hash when available',
      'operator checklist and release README',
    ],
    deliveryModes: [
      'public-package-ready: final URL smoke and DB restore are complete',
      'offline-package-ready: local/offline RC with explicit waiver and DB backup evidence',
      'package-gated: package metadata exists but publication is blocked',
    ],
    hardGates: [
      'F155 must be public-release-ready before public deploy.',
      'F155 offline-rc-ready can only produce an offline/local package.',
      'Blocked F155 can only produce a gated package manifest.',
      'DB passwords, secrets and DATABASE_URL must never be copied into release artifacts.',
    ],
    operatorCommands: [
      'npm run prepare:f156:final-package',
      'npm run test:f156:final-package',
      'npm run prepare:f155:release-decision',
    ],
    nextPhase: 'F157 cierre operativo o deploy cuando F153/F154 esten listos',
    finalStatement:
      status === 'public-package-ready'
        ? 'F156 deja el paquete listo para publicacion controlada.'
        : status === 'offline-package-ready'
          ? 'F156 deja paquete RC offline listo; publicacion publica sigue sujeta a F153/F154.'
          : 'F156 deja manifiesto de paquete, pero mantiene bloqueo de publicacion.',
  };
}

export function formatF156FinalPackageText(summary = buildF156FinalPackage()): string {
  return [
    'F156 PAQUETE FINAL CONDICIONADO',
    `   Estado: ${summary.status}`,
    '   Contenido:',
    ...summary.packageContents.map((item) => `   - ${item}`),
    '   Modos:',
    ...summary.deliveryModes.map((item) => `   - ${item}`),
    '   Gates:',
    ...summary.hardGates.map((item) => `   - ${item}`),
    `   Cierre: ${summary.finalStatement}`,
  ].join('\n');
}
