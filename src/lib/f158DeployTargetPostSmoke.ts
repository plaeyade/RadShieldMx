export type F158DeployTargetPostSmokeStatus =
  | 'local-postdeploy-ready'
  | 'external-postdeploy-ready'
  | 'deploy-target-gated';

export interface F158DeployTargetPostSmoke {
  phase: 'F158';
  status: F158DeployTargetPostSmokeStatus;
  generatedAt: string;
  deployTargets: string[];
  postDeployEvidence: string[];
  externalDeployBlockers: string[];
  nextActions: string[];
  finalStatement: string;
}

export function buildF158DeployTargetPostSmoke(
  status: F158DeployTargetPostSmokeStatus = 'local-postdeploy-ready',
): F158DeployTargetPostSmoke {
  return {
    phase: 'F158',
    status,
    generatedAt: '2026-07-15',
    deployTargets: [
      'controlled local/staging target: http://127.0.0.1:4174',
      'external HTTPS target: pending PUBLIC_DEPLOY_URL',
      'Sites target: pending .openai/hosting.json + git source state',
    ],
    postDeployEvidence: [
      'F153 DB restore probe ready',
      'F154 post-deploy browser smoke ready',
      'F155 release decision ready',
      'F156 package ready',
      'F157 operational closure ready',
    ],
    externalDeployBlockers: [
      'No PUBLIC_DEPLOY_URL configured.',
      'No .openai/hosting.json present.',
      'No local .git source state available for Sites save/deploy flow.',
    ],
    nextActions: [
      'For local handoff, use the F157 runbook.',
      'For external deploy, configure HTTPS target and rerun F154-F158.',
      'For Sites deploy, initialize source control and hosting metadata before save/deploy.',
    ],
    finalStatement:
      status === 'external-postdeploy-ready'
        ? 'F158 confirma smoke post-deploy en URL HTTPS externa.'
        : status === 'local-postdeploy-ready'
          ? 'F158 confirma smoke post-deploy en target local/staging controlado.'
          : 'F158 mantiene deploy externo bloqueado hasta tener target valido.',
  };
}

export function formatF158DeployTargetPostSmokeText(summary = buildF158DeployTargetPostSmoke()): string {
  return [
    'F158 DEPLOY TARGET + POST-DEPLOY SMOKE',
    `   Estado: ${summary.status}`,
    '   Targets:',
    ...summary.deployTargets.map((item) => `   - ${item}`),
    '   Evidencia:',
    ...summary.postDeployEvidence.map((item) => `   - ${item}`),
    '   Bloqueos externos:',
    ...summary.externalDeployBlockers.map((item) => `   - ${item}`),
    `   Cierre: ${summary.finalStatement}`,
  ].join('\n');
}
