export type F152EnvironmentGateStatus = 'pass' | 'ready-to-run' | 'gated';

export interface F152EnvironmentGate {
  id: string;
  label: string;
  status: F152EnvironmentGateStatus;
  evidence: string;
  nextAction: string;
}

export interface F152ProductionEnvironmentPrep {
  phase: 'F152';
  status: 'production-environment-prep';
  generatedAt: string;
  gates: F152EnvironmentGate[];
  recommendedRuntime: string;
  goNoGo: 'ready-for-f153-db-backup' | 'blocked-until-runtime-values';
  requiredVariables: string[];
  requiredTools: string[];
  nextPhases: string[];
  finalStatement: string;
}

export function buildF152ProductionEnvironmentPrep(): F152ProductionEnvironmentPrep {
  const gates: F152EnvironmentGate[] = [
    {
      id: 'deploy-runtime',
      label: 'Hosting/runtime',
      status: 'ready-to-run',
      evidence: 'Puede usar paquete estatico, frontend+API separado o full-stack con API Node y MySQL administrado.',
      nextAction: 'Elegir target: static/offline, VPS/IIS/Nginx, Render/Railway/Azure/AWS o hosting interno.',
    },
    {
      id: 'public-url',
      label: 'URL final',
      status: 'gated',
      evidence: 'PUBLIC_DEPLOY_URL/PLAYWRIGHT_TEST_BASE_URL debe apuntar al host final.',
      nextAction: 'Definir URL final para F154 smoke publico.',
    },
    {
      id: 'mysql-tools',
      label: 'Herramientas MySQL',
      status: 'ready-to-run',
      evidence: 'F152 detecta mysql/mysqldump en PATH o rutas comunes de MySQL Windows.',
      nextAction: 'Agregar MySQL Server bin al PATH o configurar MYSQL_BIN_DIR.',
    },
    {
      id: 'production-secrets',
      label: 'Secretos productivos',
      status: 'ready-to-run',
      evidence: 'DATABASE_URL y APP_SECRET/JWT se validan sin imprimir valores sensibles.',
      nextAction: 'Confirmar secretos en host y rotarlos si fueron usados localmente.',
    },
    {
      id: 'artifact-freeze',
      label: 'Artefacto congelado',
      status: 'pass',
      evidence: 'F150/F151 definen release freeze; F152 no agrega features.',
      nextAction: 'Solo permitir fixes bloqueantes, configuracion y evidencia operacional.',
    },
  ];

  return {
    phase: 'F152',
    status: 'production-environment-prep',
    generatedAt: '2026-07-15',
    gates,
    recommendedRuntime: 'Separar frontend estatico y API Node con MySQL administrado o MySQL Windows validado; evitar Docker si sigue inestable.',
    goNoGo: gates.every((gate) => gate.status === 'pass') ? 'ready-for-f153-db-backup' : 'blocked-until-runtime-values',
    requiredVariables: [
      'PUBLIC_DEPLOY_URL',
      'PLAYWRIGHT_TEST_BASE_URL',
      'DATABASE_URL',
      'APP_SECRET or JWT_SECRET',
      'VITE_ENABLE_BACKEND',
      'VITE_BACKEND_URL',
    ],
    requiredTools: [
      'node',
      'mysql',
      'mysqldump',
      'playwright chromium',
    ],
    nextPhases: [
      'F153 backup/restore DB real',
      'F154 smoke URL final',
      'F155 publicacion controlada',
    ],
    finalStatement:
      'F152 prepara el ambiente real y deja bloqueado el release publico hasta definir URL final y herramientas MySQL ejecutables para backup/restore.',
  };
}

export function formatF152ProductionEnvironmentPrepText(summary = buildF152ProductionEnvironmentPrep()): string {
  return [
    'F152 PREPARACION AMBIENTE REAL',
    `   Go/No-Go: ${summary.goNoGo}`,
    `   Runtime recomendado: ${summary.recommendedRuntime}`,
    '   Gates:',
    ...summary.gates.map((gate) => `   - ${gate.label}: ${gate.status.toUpperCase()} | ${gate.nextAction}`),
    '   Variables:',
    ...summary.requiredVariables.map((item) => `   - ${item}`),
    '   Herramientas:',
    ...summary.requiredTools.map((item) => `   - ${item}`),
    `   Cierre: ${summary.finalStatement}`,
  ].join('\n');
}
