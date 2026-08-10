import type { F621F625RendererBaseDeep, F622RenderPassGroup } from '@/lib/f621F625RendererBaseDeep';

export interface F626FrameBudget {
  targetFps: 30 | 45 | 60;
  maxFrameMs: number;
  maxCommandsPerFrame: number;
}

export interface F627RenderQueueItem {
  id: string;
  phase: 'F627';
  layer: string;
  priority: number;
  commandCount: number;
  visibleCommandCount: number;
  dirtyAreaPx: number;
  scheduledFrame: number;
  reason: 'dirty-region' | 'visible-priority' | 'warning-review' | 'idle';
}

export interface F628InvalidationSignature {
  phase: 'F628';
  viewportKey: string;
  commandKey: string;
  dirtyKey: string;
  cacheKey: string;
  invalidatesOn: string[];
}

export interface F629SchedulerGate {
  id: string;
  phase: 'F629' | 'F630';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F626F630RendererBaseScheduler {
  schema: 'radshield-mx.canvas.renderer-base-scheduler.f626-f630.v1';
  phaseRange: 'F626-F630';
  status: 'renderer-scheduler-ready' | 'renderer-scheduler-preview' | 'renderer-scheduler-blocked';
  budget: F626FrameBudget;
  queue: F627RenderQueueItem[];
  invalidation: F628InvalidationSignature;
  gates: F629SchedulerGate[];
  telemetry: {
    totalDirtyAreaPx: number;
    estimatedFrames: number;
    estimatedFrameMs: number;
    warningQueueItems: number;
    hiddenCommands: number;
  };
  rollback: string[];
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function dirtyArea(group: F622RenderPassGroup): number {
  if (!group.dirtyBounds) return 0;
  return Math.round(Math.max(0, group.dirtyBounds.width) * Math.max(0, group.dirtyBounds.height));
}

function priorityForGroup(group: F622RenderPassGroup, warningCommandIds: Set<string>): number {
  const hasWarning = group.commandIds.some((id) => warningCommandIds.has(id));
  const base = group.visibleCommandCount > 0 ? 20 : 0;
  const areaBoost = Math.min(18, Math.ceil(dirtyArea(group) / 50000));
  const warningBoost = hasWarning ? 30 : 0;
  return base + areaBoost + warningBoost;
}

function reasonForGroup(group: F622RenderPassGroup, warningCommandIds: Set<string>): F627RenderQueueItem['reason'] {
  if (group.commandIds.some((id) => warningCommandIds.has(id))) return 'warning-review';
  if (group.visibleCommandCount > 0 && dirtyArea(group) > 0) return 'dirty-region';
  if (group.visibleCommandCount > 0) return 'visible-priority';
  return 'idle';
}

function buildQueue(deep: F621F625RendererBaseDeep, budget: F626FrameBudget): F627RenderQueueItem[] {
  const warningCommandIds = new Set(deep.commands.filter((command) => command.warningCount > 0).map((command) => command.id));
  let frameCommandTally = 0;
  let scheduledFrame = 1;
  return deep.passGroups
    .map((group) => ({
      group,
      priority: priorityForGroup(group, warningCommandIds),
    }))
    .sort((a, b) => b.priority - a.priority || b.group.visibleCommandCount - a.group.visibleCommandCount || a.group.layer.localeCompare(b.group.layer))
    .map(({ group, priority }) => {
      if (frameCommandTally > 0 && frameCommandTally + group.commandIds.length > budget.maxCommandsPerFrame) {
        scheduledFrame += 1;
        frameCommandTally = 0;
      }
      frameCommandTally += group.commandIds.length;
      return {
        id: `f627-queue-${group.layer.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
        phase: 'F627' as const,
        layer: group.layer,
        priority,
        commandCount: group.commandIds.length,
        visibleCommandCount: group.visibleCommandCount,
        dirtyAreaPx: dirtyArea(group),
        scheduledFrame,
        reason: reasonForGroup(group, warningCommandIds),
      };
    });
}

export function buildF626F630RendererBaseScheduler(
  deep: F621F625RendererBaseDeep,
  options: { targetFps?: 30 | 45 | 60; maxCommandsPerFrame?: number; highRiskRendererEnabled?: boolean } = {},
): F626F630RendererBaseScheduler {
  const targetFps = options.targetFps ?? 60;
  const budget: F626FrameBudget = {
    targetFps,
    maxFrameMs: Math.round((1000 / targetFps) * 10) / 10,
    maxCommandsPerFrame: Math.max(1, options.maxCommandsPerFrame ?? 8),
  };
  const queue = buildQueue(deep, budget);
  const viewportKey = deep.metrics.viewport;
  const commandKey = stableHash(deep.commands.map((command) => `${command.id}:${command.layer}:${command.zIndex}:${command.visibleInViewport}`).join('|'));
  const dirtyKey = stableHash(deep.passGroups.map((group) => `${group.id}:${group.visibleCommandCount}:${group.dirtyBounds?.x ?? 0}:${group.dirtyBounds?.y ?? 0}:${group.dirtyBounds?.width ?? 0}:${group.dirtyBounds?.height ?? 0}`).join('|'));
  const invalidation: F628InvalidationSignature = {
    phase: 'F628',
    viewportKey,
    commandKey,
    dirtyKey,
    cacheKey: `f626-${stableHash(`${viewportKey}:${commandKey}:${dirtyKey}`)}`,
    invalidatesOn: ['scale', 'offset', 'canvas-size', 'barriers', 'sources', 'regions', 'visual-mode', 'material-overlay', 'selection-overlay'],
  };
  const totalDirtyAreaPx = queue.reduce((sum, item) => sum + item.dirtyAreaPx, 0);
  const estimatedFrames = Math.max(1, queue.reduce((max, item) => Math.max(max, item.scheduledFrame), 1));
  const estimatedFrameMs = Math.round(Math.min(budget.maxFrameMs, (deep.metrics.visibleCommands * 0.32 + queue.length * 0.18 + totalDirtyAreaPx / 900000)) * 10) / 10;
  const gates: F629SchedulerGate[] = [
    {
      id: 'f629-deep-ready',
      phase: 'F629',
      label: 'Renderer F621 disponible',
      pass: deep.status !== 'renderer-base-deep-blocked',
      evidence: deep.status,
    },
    {
      id: 'f629-budget-safe',
      phase: 'F629',
      label: 'Presupuesto frame seguro',
      pass: estimatedFrameMs <= budget.maxFrameMs,
      evidence: `${estimatedFrameMs} ms estimados de ${budget.maxFrameMs} ms disponibles.`,
    },
    {
      id: 'f630-cache-key',
      phase: 'F630',
      label: 'Cache key reproducible',
      pass: invalidation.cacheKey.startsWith('f626-') && invalidation.cacheKey.length >= 13,
      evidence: invalidation.cacheKey,
    },
    {
      id: 'f630-no-base-replacement',
      phase: 'F630',
      label: 'Sin reemplazo de renderer base',
      pass: options.highRiskRendererEnabled !== true,
      evidence: options.highRiskRendererEnabled ? 'High-risk renderer activo: requiere E2E completo.' : 'Modo preview/overlay; CanvasArea/useCanvas siguen canonicos.',
    },
  ];
  const blocked = gates.some((gate) => !gate.pass && gate.id !== 'f630-no-base-replacement');
  const status = blocked
    ? 'renderer-scheduler-blocked'
    : options.highRiskRendererEnabled
      ? 'renderer-scheduler-ready'
      : 'renderer-scheduler-preview';

  return {
    schema: 'radshield-mx.canvas.renderer-base-scheduler.f626-f630.v1',
    phaseRange: 'F626-F630',
    status,
    budget,
    queue,
    invalidation,
    gates,
    telemetry: {
      totalDirtyAreaPx,
      estimatedFrames,
      estimatedFrameMs,
      warningQueueItems: queue.filter((item) => item.reason === 'warning-review').length,
      hiddenCommands: deep.metrics.hiddenCommands,
    },
    rollback: [
      'Ignorar scheduler F626-F630 y dibujar F621-F625 en una sola pasada.',
      'Mantener overlay pointer-events:none y eventos useCanvas sin cambios.',
      'Borrar cacheKey F626 si cambia escala, viewport, geometria, material o modo visual.',
    ],
  };
}

export function drawF626F630RendererSchedulerHud(
  ctx: CanvasRenderingContext2D,
  scheduler: F626F630RendererBaseScheduler,
  options: { x?: number; y?: number } = {},
) {
  if (scheduler.status === 'renderer-scheduler-blocked') return;
  const x = options.x ?? 12;
  const y = options.y ?? 124;
  ctx.save();
  ctx.fillStyle = 'rgba(4,18,31,0.82)';
  ctx.strokeStyle = scheduler.status === 'renderer-scheduler-ready' ? '#34d399' : '#60a5fa';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, 218, 48, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e0f2fe';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('F626-F630 Scheduler', x + 9, y + 16);
  ctx.font = '9px sans-serif';
  ctx.fillText(`frames ${scheduler.telemetry.estimatedFrames} | ${scheduler.telemetry.estimatedFrameMs}/${scheduler.budget.maxFrameMs} ms`, x + 9, y + 31);
  ctx.fillText(`${scheduler.invalidation.cacheKey} | queue ${scheduler.queue.length}`, x + 9, y + 43);
  ctx.restore();
}
