export type F172ReleaseMode = 'public-deploy-ready' | 'controlled-offline-ready' | 'release-gated';

export interface F172ReleaseGate {
  id: string;
  label: string;
  ok: boolean;
  evidence: string;
  blockingPublicDeploy: boolean;
}

export interface F172ReleaseCandidateFinal {
  phase: 'F172';
  status: F172ReleaseMode;
  gates: F172ReleaseGate[];
  finalBeforeDeploy: string[];
  publicDeployBlockers: string[];
  decision: string;
}

export function buildF172ReleaseCandidateFinal(gates: F172ReleaseGate[]): F172ReleaseCandidateFinal {
  const publicDeployBlockers = gates
    .filter((gate) => !gate.ok && gate.blockingPublicDeploy)
    .map((gate) => `${gate.label}: ${gate.evidence}`);
  const localBlockers = gates.filter((gate) => !gate.ok && !gate.blockingPublicDeploy);
  const localReady = localBlockers.length === 0;
  const status: F172ReleaseMode = localReady
    ? publicDeployBlockers.length === 0
      ? 'public-deploy-ready'
      : 'controlled-offline-ready'
    : 'release-gated';

  return {
    phase: 'F172',
    status,
    gates,
    finalBeforeDeploy: [
      'Keep current feature scope frozen except fixes required by smoke tests.',
      'Repeat F154-F158 against the final HTTPS URL after deploy target is reachable.',
      'Archive DB backup/restore evidence and F170/F172A document manifests with the release package.',
      'Use F172A arXiv sources only as methodology/research evidence, not as canonical calculation constants.',
    ],
    publicDeployBlockers,
    decision:
      status === 'public-deploy-ready'
        ? 'GO for public deploy and post-deploy smoke.'
        : status === 'controlled-offline-ready'
          ? 'GO for controlled local/offline release candidate; public deploy waits for hosting target and F154-F158 rerun.'
          : 'NO-GO release candidate until local gates are fixed.',
  };
}
