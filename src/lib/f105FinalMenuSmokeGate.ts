import { F92_REAL_WORKFLOW, type F92WorkflowStageId } from '@/lib/f92RealWorkflow';
import { buildF95DropdownSmokeSummary } from '@/lib/f95DropdownSmoke';

export type F105MenuGateStatus = 'pass' | 'staged' | 'blocked';

export interface F105MenuStageGate {
  id: F92WorkflowStageId;
  label: string;
  commands: number;
  pass: number;
  warn: number;
  fail: number;
  readyForPhysicalMove: boolean;
}

export interface F105FinalMenuSmokeGate {
  phase: 'F105';
  status: F105MenuGateStatus;
  targetFlow: string[];
  totalCommands: number;
  pass: number;
  warn: number;
  fail: number;
  physicalMoveNow: boolean;
  decision: string;
  stages: F105MenuStageGate[];
  requiredRuntimeSmoke: string[];
  nextActions: string[];
}

export function buildF105FinalMenuSmokeGate(): F105FinalMenuSmokeGate {
  const smoke = buildF95DropdownSmokeSummary();
  const stages: F105MenuStageGate[] = F92_REAL_WORKFLOW.map((stage) => {
    const stageSmoke = smoke.stages.find((item) => item.workflowStage === stage.id);
    return {
      id: stage.id,
      label: stage.label,
      commands: stageSmoke?.total ?? 0,
      pass: stageSmoke?.pass ?? 0,
      warn: stageSmoke?.warn ?? 0,
      fail: stageSmoke?.fail ?? 0,
      readyForPhysicalMove: Boolean(stageSmoke?.readyForMigration && (stageSmoke.total ?? 0) > 0),
    };
  });

  const emptyStages = stages.filter((stage) => stage.commands === 0);
  const failedStages = stages.filter((stage) => stage.fail > 0);
  const allStagesCovered = emptyStages.length === 0;
  const staticGatePass = allStagesCovered && failedStages.length === 0 && smoke.fail === 0;

  return {
    phase: 'F105',
    status: staticGatePass ? 'staged' : 'blocked',
    targetFlow: F92_REAL_WORKFLOW.map((stage) => stage.label),
    totalCommands: smoke.total,
    pass: smoke.pass,
    warn: smoke.warn,
    fail: smoke.fail,
    physicalMoveNow: false,
    decision: staticGatePass
      ? 'Static gate passes. Keep physical menu removal staged until runtime smoke test:submenus:smoke passes on preview.'
      : 'Do not physically move or remove menus; fix empty or failing workflow groups first.',
    stages,
    requiredRuntimeSmoke: [
      'test:f94:dropdown-parity',
      'test:f95:dropdown-smoke',
      'test:f101:access-dedup',
      'test:f104:document-closure',
      'test:submenus:smoke',
    ],
    nextActions: staticGatePass
      ? [
        'Run preview build and all-submenus smoke.',
        'If runtime smoke passes, migrate one workflow group at a time.',
        'Keep legacy fallback until each group has screenshot and dialog-open evidence.',
      ]
      : [
        ...emptyStages.map((stage) => `Add at least one mapped command for ${stage.label}.`),
        ...failedStages.map((stage) => `Fix failing commands in ${stage.label}.`),
      ],
  };
}
