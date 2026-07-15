export type F159SitesHostingPrepStatus =
  | 'sites-local-package-ready'
  | 'sites-deploy-ready'
  | 'sites-deploy-gated';

export interface F159SitesHostingPrep {
  phase: 'F159';
  status: F159SitesHostingPrepStatus;
  generatedAt: string;
  preparedItems: string[];
  remoteBlockers: string[];
  requiredNextSteps: string[];
  finalStatement: string;
}

export function buildF159SitesHostingPrep(status: F159SitesHostingPrepStatus = 'sites-local-package-ready'): F159SitesHostingPrep {
  return {
    phase: 'F159',
    status,
    generatedAt: '2026-07-15',
    preparedItems: [
      '.openai/hosting.json with Sites project_id',
      'dist/server/index.js static Worker adapter',
      'Sites package archive candidate',
      'F154 post-deploy smoke evidence on local target',
    ],
    remoteBlockers: [
      'Git executable/source push is unavailable in this recovered tree.',
      'Sites save/deploy requires a committed and pushed source state.',
      'External HTTPS PUBLIC_DEPLOY_URL must be smoked after production deploy.',
    ],
    requiredNextSteps: [
      'Install/enable Git or move this recovered source into a Git worktree.',
      'Commit and push exact source state to the Sites source repository.',
      'Save a Sites version from that commit and deploy it.',
      'Rerun F154-F158 against the Sites HTTPS URL.',
    ],
    finalStatement:
      status === 'sites-deploy-ready'
        ? 'F159 deja el proyecto listo para guardar version y desplegar en Sites.'
        : status === 'sites-local-package-ready'
          ? 'F159 deja hosting metadata y paquete local preparado; deploy remoto queda bloqueado por Git/source state.'
          : 'F159 no puede preparar paquete hasta reconstruir metadata/build.',
  };
}
