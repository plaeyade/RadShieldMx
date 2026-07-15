import {
  F94_CRITICAL_DROPDOWN_COMMANDS,
  buildF94DropdownParitySummary,
  getF94CommandStatus,
  type F94CriticalCommand,
} from '@/lib/f94DropdownParity';
import { F92_REAL_WORKFLOW, type F92WorkflowStageId } from '@/lib/f92RealWorkflow';

export type F95SmokeStatus = 'pass' | 'warn' | 'fail';
export type F95NextAction = 'allow-staged-migration' | 'fix-parity-first';

export interface F95SmokeItem {
  id: string;
  label: string;
  workflowStage: F92WorkflowStageId;
  legacyMenu: string;
  handler: string;
  dialogName?: string;
  status: F95SmokeStatus;
  checks: {
    handlerMapped: boolean;
    dialogRegistered: boolean;
    workflowMapped: boolean;
  };
}

export interface F95StageSmoke {
  workflowStage: F92WorkflowStageId;
  label: string;
  total: number;
  pass: number;
  warn: number;
  fail: number;
  readyForMigration: boolean;
}

export interface F95DropdownSmokeSummary {
  phase: 'F95';
  total: number;
  pass: number;
  warn: number;
  fail: number;
  nextAction: F95NextAction;
  physicalMoveNow: false;
  items: F95SmokeItem[];
  stages: F95StageSmoke[];
  migrationOrder: F92WorkflowStageId[];
}

function buildSmokeItem(command: F94CriticalCommand): F95SmokeItem {
  const parityStatus = getF94CommandStatus(command);
  const handlerMapped = Boolean(command.handler);
  const dialogRegistered = parityStatus !== 'missing-dialog';
  const workflowMapped = F92_REAL_WORKFLOW.some((stage) => stage.id === command.workflowStage);
  const status: F95SmokeStatus = !handlerMapped || !dialogRegistered || !workflowMapped
    ? 'fail'
    : parityStatus === 'needs-handler-review'
      ? 'warn'
      : 'pass';

  return {
    id: command.id,
    label: command.label,
    workflowStage: command.workflowStage,
    legacyMenu: command.legacyMenu,
    handler: command.handler,
    dialogName: command.dialogName,
    status,
    checks: {
      handlerMapped,
      dialogRegistered,
      workflowMapped,
    },
  };
}

export function buildF95DropdownSmokeSummary(): F95DropdownSmokeSummary {
  const parity = buildF94DropdownParitySummary();
  const items = F94_CRITICAL_DROPDOWN_COMMANDS.map(buildSmokeItem);
  const pass = items.filter((item) => item.status === 'pass').length;
  const warn = items.filter((item) => item.status === 'warn').length;
  const fail = items.filter((item) => item.status === 'fail').length;
  const stages = F92_REAL_WORKFLOW.map((stage) => {
    const stageItems = items.filter((item) => item.workflowStage === stage.id);
    const stageFail = stageItems.filter((item) => item.status === 'fail').length;
    const stageWarn = stageItems.filter((item) => item.status === 'warn').length;
    const stagePass = stageItems.filter((item) => item.status === 'pass').length;
    return {
      workflowStage: stage.id,
      label: stage.label,
      total: stageItems.length,
      pass: stagePass,
      warn: stageWarn,
      fail: stageFail,
      readyForMigration: stageItems.length > 0 && stageFail === 0,
    };
  });

  return {
    phase: 'F95',
    total: items.length,
    pass,
    warn,
    fail,
    nextAction: parity.migrationGate === 'ready-for-staged-smoke-not-moved' && fail === 0
      ? 'allow-staged-migration'
      : 'fix-parity-first',
    physicalMoveNow: false,
    items,
    stages,
    migrationOrder: F92_REAL_WORKFLOW.map((stage) => stage.id),
  };
}

