export type F151PrepublishGateStatus = 'pass' | 'ready-to-run' | 'gated';

export interface F151PrepublishGate {
  id: string;
  label: string;
  status: F151PrepublishGateStatus;
  evidence: string;
  publishRequirement: string;
}

export interface F151PrepublishHardening {
  phase: 'F151';
  status: 'prepublish-hardening-ready';
  generatedAt: string;
  title: string;
  gates: F151PrepublishGate[];
  goNoGo: 'public-no-go-until-runtime-gates-pass' | 'public-go';
  packageScripts: string[];
  operatorChecklist: string[];
  finalStatement: string;
}

export function buildF151PrepublishHardening(): F151PrepublishHardening {
  const gates: F151PrepublishGate[] = [
    {
      id: 'deploy-target',
      label: 'Target de deploy',
      status: 'ready-to-run',
      evidence: 'PUBLIC_DEPLOY_URL o PLAYWRIGHT_TEST_BASE_URL deben apuntar al host final antes del smoke publico.',
      publishRequirement: 'Definir URL final y runtime/hosting.',
    },
    {
      id: 'production-secrets',
      label: 'Secretos productivos',
      status: 'ready-to-run',
      evidence: 'DATABASE_URL, APP_SECRET/JWT y claves externas se validan por presencia y no se escriben en outputs.',
      publishRequirement: 'Inyectar secretos desde el host, nunca commitearlos.',
    },
    {
      id: 'db-backup-restore',
      label: 'Backup/restore DB',
      status: 'gated',
      evidence: 'Requiere mysqldump/mysql en PATH o ruta explicita antes del cutover.',
      publishRequirement: 'Crear dump, probar restore y conservar hash del artefacto.',
    },
    {
      id: 'public-url-smoke',
      label: 'Smoke URL final',
      status: 'ready-to-run',
      evidence: 'Playwright debe ejecutarse contra la URL publica final, no solo preview local.',
      publishRequirement: 'PLAYWRIGHT_TEST_BASE_URL debe apuntar al deploy final.',
    },
    {
      id: 'release-freeze',
      label: 'Freeze de cambios grandes',
      status: 'pass',
      evidence: 'Politica F151: despues del smoke final solo fixes bloqueantes, secretos/config y documentacion operacional.',
      publishRequirement: 'No agregar features grandes hasta completar public smoke.',
    },
  ];

  return {
    phase: 'F151',
    status: 'prepublish-hardening-ready',
    generatedAt: '2026-07-15',
    title: 'Cinco cambios antes de publicar',
    gates,
    goNoGo: gates.every((gate) => gate.status === 'pass') ? 'public-go' : 'public-no-go-until-runtime-gates-pass',
    packageScripts: [
      'prepare:f151:prepublish',
      'test:f151:prepublish',
      'prepublish:backup-db',
      'prepublish:smoke-url',
    ],
    operatorChecklist: [
      'Definir PUBLIC_DEPLOY_URL o PLAYWRIGHT_TEST_BASE_URL con la URL final.',
      'Verificar que DATABASE_URL y APP_SECRET/JWT provengan del host o .env local privado.',
      'Ejecutar backup DB y restore test antes de migraciones productivas.',
      'Correr smoke Playwright contra la URL final.',
      'Congelar features grandes hasta pasar smoke y conservar el paquete F150/F151.',
    ],
    finalStatement:
      'F151 deja los cinco cambios prepublicacion como gates ejecutables. La publicacion sigue en NO-GO hasta que los gates dependientes del ambiente real pasen con evidencia.',
  };
}

export function formatF151PrepublishHardeningText(summary = buildF151PrepublishHardening()): string {
  return [
    'F151 PREPUBLICACION',
    `   Estado: ${summary.status}`,
    `   Go/No-Go: ${summary.goNoGo}`,
    '   Gates:',
    ...summary.gates.map((gate) => `   - ${gate.label}: ${gate.status.toUpperCase()} | ${gate.publishRequirement}`),
    '   Checklist:',
    ...summary.operatorChecklist.map((item) => `   - ${item}`),
    `   Cierre: ${summary.finalStatement}`,
  ].join('\n');
}
