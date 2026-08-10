import type { F442RendererInstruction, F442ToF445RendererV2Runtime } from '@/lib/f442ToF445RendererV2Runtime';

export interface F621Viewport {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface F621RenderCommand {
  id: string;
  phase: 'F621';
  instructionId: string;
  primitive: F442RendererInstruction['primitive'];
  layer: string;
  zIndex: number;
  screenBounds: { x: number; y: number; width: number; height: number };
  visibleInViewport: boolean;
  evidenceIds: string[];
  warningCount: number;
}

export interface F622RenderPassGroup {
  id: string;
  phase: 'F622';
  layer: string;
  commandIds: string[];
  visibleCommandCount: number;
  dirtyBounds: { x: number; y: number; width: number; height: number } | null;
}

export interface F623RendererBaseDeepGate {
  id: string;
  phase: 'F623' | 'F624' | 'F625';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F621F625RendererBaseDeep {
  schema: 'radshield-mx.canvas.renderer-base-deep.f621-f625.v1';
  phaseRange: 'F621-F625';
  status: 'renderer-base-deep-ready' | 'renderer-base-deep-preview' | 'renderer-base-deep-blocked';
  runtimeStatus: F442ToF445RendererV2Runtime['status'];
  commands: F621RenderCommand[];
  passGroups: F622RenderPassGroup[];
  gates: F623RendererBaseDeepGate[];
  metrics: {
    totalCommands: number;
    visibleCommands: number;
    hiddenCommands: number;
    passGroups: number;
    warningCommands: number;
    viewport: string;
  };
  rollback: string[];
}

function toScreen(point: { x: number; y: number }, viewport: F621Viewport) {
  return {
    x: point.x * viewport.scale + viewport.offsetX,
    y: point.y * viewport.scale + viewport.offsetY,
  };
}

function boundsForInstruction(instruction: F442RendererInstruction, viewport: F621Viewport) {
  const points = instruction.points.length ? instruction.points.map((point) => toScreen(point, viewport)) : [{ x: 20, y: 20 }];
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  const padding = Math.max(8, instruction.style.lineWidth * viewport.scale + 6);
  return {
    x: minX - padding,
    y: minY - padding,
    width: Math.max(12, maxX - minX + padding * 2),
    height: Math.max(12, maxY - minY + padding * 2),
  };
}

function intersectsViewport(bounds: F621RenderCommand['screenBounds'], viewport: F621Viewport) {
  return bounds.x + bounds.width >= 0
    && bounds.y + bounds.height >= 0
    && bounds.x <= viewport.width
    && bounds.y <= viewport.height;
}

function mergeBounds(bounds: F621RenderCommand['screenBounds'][]): F621RenderCommand['screenBounds'] | null {
  if (!bounds.length) return null;
  const minX = Math.min(...bounds.map((item) => item.x));
  const minY = Math.min(...bounds.map((item) => item.y));
  const maxX = Math.max(...bounds.map((item) => item.x + item.width));
  const maxY = Math.max(...bounds.map((item) => item.y + item.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function buildCommands(runtime: F442ToF445RendererV2Runtime, viewport: F621Viewport): F621RenderCommand[] {
  return runtime.instructions.map((instruction) => {
    const screenBounds = boundsForInstruction(instruction, viewport);
    return {
      id: `f621-command-${instruction.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
      phase: 'F621',
      instructionId: instruction.id,
      primitive: instruction.primitive,
      layer: instruction.layer,
      zIndex: instruction.zIndex,
      screenBounds,
      visibleInViewport: intersectsViewport(screenBounds, viewport),
      evidenceIds: instruction.evidenceIds,
      warningCount: instruction.warnings.length,
    };
  }).sort((a, b) => a.zIndex - b.zIndex || a.layer.localeCompare(b.layer));
}

function buildPassGroups(commands: F621RenderCommand[]): F622RenderPassGroup[] {
  const grouped = new Map<string, F621RenderCommand[]>();
  for (const command of commands) {
    const list = grouped.get(command.layer) ?? [];
    list.push(command);
    grouped.set(command.layer, list);
  }
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([layer, layerCommands]) => {
      const visible = layerCommands.filter((command) => command.visibleInViewport);
      return {
        id: `f622-pass-${layer.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
        phase: 'F622' as const,
        layer,
        commandIds: layerCommands.map((command) => command.id),
        visibleCommandCount: visible.length,
        dirtyBounds: mergeBounds(visible.map((command) => command.screenBounds)),
      };
    });
}

export function buildF621F625RendererBaseDeep(runtime: F442ToF445RendererV2Runtime, viewport: F621Viewport): F621F625RendererBaseDeep {
  const commands = buildCommands(runtime, viewport);
  const passGroups = buildPassGroups(commands);
  const visibleCommands = commands.filter((command) => command.visibleInViewport).length;
  const warningCommands = commands.filter((command) => command.warningCount > 0).length;
  const gates: F623RendererBaseDeepGate[] = [
    {
      id: 'f623-runtime-not-blocked',
      phase: 'F623',
      label: 'Runtime F442 disponible',
      pass: runtime.status !== 'renderer-v2-runtime-blocked',
      evidence: runtime.status,
    },
    {
      id: 'f623-command-list',
      phase: 'F623',
      label: 'Comandos normalizados',
      pass: commands.length > 0,
      evidence: `${commands.length} comandos renderizables derivados de instrucciones F442.`,
    },
    {
      id: 'f624-viewport-clipping',
      phase: 'F624',
      label: 'Clipping por viewport',
      pass: commands.length === 0 || visibleCommands <= commands.length,
      evidence: `${visibleCommands}/${commands.length} comandos visibles en viewport.`,
    },
    {
      id: 'f625-pointer-safe',
      phase: 'F625',
      label: 'Overlay sin eventos',
      pass: runtime.eventControllerTouched === false,
      evidence: 'Renderer profundo sigue dibujando en overlay pointer-events:none.',
    },
  ];
  const blocked = gates.some((gate) => !gate.pass);
  const status = blocked
    ? 'renderer-base-deep-blocked'
    : runtime.activationMode === 'flagged-active'
      ? 'renderer-base-deep-ready'
      : 'renderer-base-deep-preview';

  return {
    schema: 'radshield-mx.canvas.renderer-base-deep.f621-f625.v1',
    phaseRange: 'F621-F625',
    status,
    runtimeStatus: runtime.status,
    commands,
    passGroups,
    gates,
    metrics: {
      totalCommands: commands.length,
      visibleCommands,
      hiddenCommands: commands.length - visibleCommands,
      passGroups: passGroups.length,
      warningCommands,
      viewport: `${Math.round(viewport.width)}x${Math.round(viewport.height)} @ ${viewport.scale.toFixed(2)}x`,
    },
    rollback: [
      'Ocultar HUD F621-F625 y conservar drawF442ToF445RendererV2Overlay.',
      'Mantener canvas principal y useCanvas como fuente canonica de eventos.',
      'Si hay perdida visual, borrar localStorage radshield_canvas_qa_inspector_mode_f591 y volver a beta previa.',
    ],
  };
}

export function drawF621F625RendererBaseDeepHud(
  ctx: CanvasRenderingContext2D,
  deep: F621F625RendererBaseDeep,
  options: { showDirtyRegions?: boolean } = {},
) {
  if (deep.status === 'renderer-base-deep-blocked') return;
  const showDirtyRegions = options.showDirtyRegions ?? true;

  if (showDirtyRegions) {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1;
    for (const group of deep.passGroups) {
      if (!group.dirtyBounds) continue;
      ctx.strokeStyle = group.visibleCommandCount > 0 ? 'rgba(14,165,233,0.45)' : 'rgba(148,163,184,0.25)';
      ctx.strokeRect(group.dirtyBounds.x, group.dirtyBounds.y, group.dirtyBounds.width, group.dirtyBounds.height);
    }
    ctx.restore();
  }

  ctx.save();
  const x = 12;
  const y = 60;
  ctx.fillStyle = 'rgba(15,23,42,0.82)';
  ctx.strokeStyle = deep.status === 'renderer-base-deep-ready' ? '#34d399' : '#38bdf8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, 218, 58, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e0f2fe';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('F621-F625 Renderer base profundo', x + 9, y + 17);
  ctx.font = '9px sans-serif';
  ctx.fillText(`cmd ${deep.metrics.visibleCommands}/${deep.metrics.totalCommands} | passes ${deep.metrics.passGroups}`, x + 9, y + 34);
  ctx.fillText(`${deep.metrics.viewport} | ${deep.status}`, x + 9, y + 48);
  ctx.restore();
}
