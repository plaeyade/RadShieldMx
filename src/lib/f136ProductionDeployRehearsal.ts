export type F136ProductionDeployRehearsalStatus = 'ready' | 'blocked' | 'partial';

export interface F136ProductionDeployRehearsal {
  phase: 'F136';
  status: F136ProductionDeployRehearsalStatus;
  rehearsalMode: string;
  packageSource: string;
  validatedSurfaces: string[];
  evidenceOutputs: string[];
  publicDeployDecision: string;
  remainingProductionActions: string[];
  nextPhase: string;
  decision: string;
}

export function buildF136ProductionDeployRehearsal(
  status: F136ProductionDeployRehearsalStatus = 'blocked',
): F136ProductionDeployRehearsal {
  const ready = status === 'ready';

  return {
    phase: 'F136',
    status,
    rehearsalMode: 'Local production-like static server from F135 packaged dist',
    packageSource: 'outputs/f135_release_candidate_package/dist',
    validatedSurfaces: [
      'F135 manifest integrity',
      'Static index and asset serving',
      'SPA fallback route',
      'Required public artifacts',
      'Chromium app shell smoke',
      'Release evidence screenshot',
    ],
    evidenceOutputs: [
      'outputs/f136_production_deploy_rehearsal.json',
      'outputs/fase_136_production_deploy_rehearsal.md',
      'outputs/f136_production_deploy_rehearsal.png',
    ],
    publicDeployDecision: ready
      ? 'Rehearsal passed locally. Public deploy is still gated by hosting, secrets, DB backup and target URL smoke.'
      : 'Public deploy is blocked until the packaged dist passes production-like rehearsal.',
    remainingProductionActions: [
      'Choose target hosting/runtime and public URL.',
      'Configure production secrets outside source control.',
      'Backup MySQL and verify restore before cutover.',
      'Run migrations intentionally on production DB.',
      'Run F134/F136 smoke against the final public URL.',
    ],
    nextPhase: ready ? 'F137 production cutover checklist or hardening backlog execution' : 'Resolve F136 rehearsal blockers',
    decision: ready
      ? 'F136 proves the F135 package can be served and smoke-tested as a production-like static release candidate.'
      : 'F136 remains blocked until the packaged release candidate serves correctly.',
  };
}
