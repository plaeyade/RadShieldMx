export type F137ProductionCutoverStatus = 'ready' | 'blocked' | 'partial';

export interface F137ProductionCutoverChecklist {
  phase: 'F137';
  status: F137ProductionCutoverStatus;
  releaseBasis: string[];
  cutoverGates: string[];
  productionBlockers: string[];
  goNoGoDecision: string;
  evidenceOutputs: string[];
  rollbackPlan: string[];
  nextPhase: string;
  decision: string;
}

export function buildF137ProductionCutoverChecklist(
  status: F137ProductionCutoverStatus = 'blocked',
): F137ProductionCutoverChecklist {
  const ready = status === 'ready';

  return {
    phase: 'F137',
    status,
    releaseBasis: [
      'F130 DB live release ready',
      'F131 full-stack live smoke ready',
      'F132 RC persistence smoke ready',
      'F133 API authenticated smoke ready',
      'F134 browser RC smoke ready',
      'F135 release candidate package ready',
      'F136 production deploy rehearsal ready',
    ],
    cutoverGates: [
      'Target hosting/runtime selected',
      'Production URL assigned',
      'Production secrets configured outside source control',
      'MySQL backup and restore path verified',
      'Production DB migration plan approved',
      'Final public URL smoke scheduled',
      'Rollback package and DB snapshot available',
    ],
    productionBlockers: ready
      ? [
          'Public URL smoke has not been executed in this local phase.',
          'Production secrets must be configured in the chosen host.',
          'Production DB backup must be captured immediately before cutover.',
        ]
      : [
          'One or more F130-F136 release gates are not ready.',
          'F135/F136 evidence must be regenerated before cutover.',
        ],
    goNoGoDecision: ready
      ? 'GO for controlled production cutover preparation. NO-GO for public launch until target URL smoke, secrets and DB backup are confirmed.'
      : 'NO-GO. Resolve release evidence blockers before production cutover.',
    evidenceOutputs: [
      'outputs/f137_production_cutover_checklist.json',
      'outputs/fase_137_production_cutover_checklist.md',
    ],
    rollbackPlan: [
      'Keep outputs/f135_release_candidate_package as immutable RC artifact.',
      'Preserve previous deploy artifact until public smoke passes.',
      'Take MySQL snapshot before production migration.',
      'Rollback by restoring previous artifact and DB snapshot if URL smoke fails.',
    ],
    nextPhase: ready
      ? 'F138 target deploy configuration or production hosting connector execution'
      : 'Resolve F137 cutover blockers',
    decision: ready
      ? 'F137 closes the local release train and converts the project into a controlled production cutover candidate.'
      : 'F137 remains blocked until all prior release gates are ready.',
  };
}
