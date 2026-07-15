export type F135ReleaseCandidateStatus = 'ready' | 'blocked' | 'partial';

export interface F135ReleaseCandidatePackage {
  phase: 'F135';
  status: F135ReleaseCandidateStatus;
  packageDirectory: string;
  requiredEvidence: string[];
  deployDecision: string;
  releaseGates: string[];
  productionBlockers: string[];
  nextPhase: string;
  decision: string;
}

export function buildF135ReleaseCandidatePackage(status: F135ReleaseCandidateStatus = 'blocked'): F135ReleaseCandidatePackage {
  const ready = status === 'ready';

  return {
    phase: 'F135',
    status,
    packageDirectory: 'outputs/f135_release_candidate_package',
    requiredEvidence: [
      'F130 DB live release',
      'F131 full-stack live smoke',
      'F132 RC persistence smoke',
      'F133 API authenticated smoke',
      'F134 browser RC smoke',
      'Deploy config contract',
      'Production build inventory',
    ],
    deployDecision: ready
      ? 'Ready for local/full-stack RC package. Public production deploy remains a separate explicit decision.'
      : 'Blocked until release evidence, build inventory and deploy config pass.',
    releaseGates: [
      'TypeScript app/server clean',
      'Vite production build present',
      'MySQL live path validated',
      'Authenticated tRPC persistence validated',
      'Browser UI smoke evidence captured',
      'Deploy config contract checked',
    ],
    productionBlockers: [
      'Confirm target hosting and domain.',
      'Confirm production DATABASE_URL, JWT_SECRET, KIMI_* and backup policy outside the repo.',
      'Run DB backup/export immediately before public cutover.',
      'Run full Playwright suite on target environment after deploy.',
    ],
    nextPhase: ready ? 'F136 production deploy rehearsal or release hardening backlog' : 'Resolve F135 package blockers before deploy rehearsal',
    decision: ready
      ? 'F135 freezes an auditable release-candidate package with DB/API/browser evidence and a clear deploy decision.'
      : 'F135 is blocked until the package manifest can prove the RC evidence chain.',
  };
}
