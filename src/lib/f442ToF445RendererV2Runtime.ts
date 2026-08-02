import type {
  F439NormalizedGeometryEntity,
  F439ToF441RendererGeometryCore,
  F440OverlayRenderPlan,
} from '@/lib/f439ToF441RendererGeometryCore';

export type F442RenderPrimitive = 'polyline' | 'polygon' | 'footprint' | 'label' | 'badge';
export type F444RendererActivationMode = 'flagged-active' | 'preview-only' | 'blocked';

export interface F442RendererInstruction {
  id: string;
  phase: 'F442';
  primitive: F442RenderPrimitive;
  entityId: string;
  layer: string;
  zIndex: number;
  points: { x: number; y: number }[];
  style: {
    stroke: string;
    fill: string;
    opacity: number;
    lineWidth: number;
    lineDash?: number[];
  };
  label: string;
  evidenceIds: string[];
  warnings: string[];
}

export interface F443RendererPass {
  id: string;
  phase: 'F443';
  label: string;
  instructionIds: string[];
  helper: 'drawF442ToF445RendererV2Overlay';
  acceptance: string;
}

export interface F444RuntimeGate {
  id: string;
  phase: 'F444';
  label: string;
  mode: F444RendererActivationMode;
  pass: boolean;
  evidence: string;
}

export interface F445RendererRollbackPlan {
  id: string;
  phase: 'F445';
  label: string;
  trigger: string;
  action: string;
}

export interface F442ToF445RendererV2Runtime {
  schema: 'radshield-mx.f442-f445.renderer-v2-runtime.v1';
  phaseRange: 'F442-F445';
  status: 'renderer-v2-runtime-ready' | 'renderer-v2-runtime-preview' | 'renderer-v2-runtime-blocked';
  activationMode: F444RendererActivationMode;
  instructions: F442RendererInstruction[];
  passes: F443RendererPass[];
  gates: F444RuntimeGate[];
  rollbackPlan: F445RendererRollbackPlan[];
  drawHelper: 'drawF442ToF445RendererV2Overlay';
  eventControllerTouched: false;
  releaseDecision: string;
}

export interface F442CanvasProjection {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const ENTITY_STYLE: Record<string, F442RendererInstruction['style']> = {
  barrier: { stroke: '#22c55e', fill: '#22c55e', opacity: 0.72, lineWidth: 5 },
  source: { stroke: '#ef4444', fill: '#ef4444', opacity: 0.7, lineWidth: 2 },
  region: { stroke: '#38bdf8', fill: '#0ea5e9', opacity: 0.22, lineWidth: 2, lineDash: [8, 5] },
  penetration: { stroke: '#06b6d4', fill: '#06b6d4', opacity: 0.85, lineWidth: 3, lineDash: [3, 3] },
  overlay: { stroke: '#a78bfa', fill: '#a78bfa', opacity: 0.45, lineWidth: 1 },
};

function styleForEntity(entity: F439NormalizedGeometryEntity, plan?: F440OverlayRenderPlan): F442RendererInstruction['style'] {
  const fallback = ENTITY_STYLE[entity.type] ?? ENTITY_STYLE.overlay;
  if (!plan) return fallback;
  return {
    stroke: plan.style.stroke,
    fill: plan.style.fill,
    opacity: plan.style.opacity,
    lineWidth: fallback.lineWidth,
    lineDash: plan.style.lineDash ?? fallback.lineDash,
  };
}

function primitiveForEntity(entity: F439NormalizedGeometryEntity): F442RenderPrimitive {
  if (entity.type === 'barrier' || entity.type === 'penetration') return 'polyline';
  if (entity.type === 'source') return 'footprint';
  if (entity.type === 'region') return 'polygon';
  return 'badge';
}

function layerPlanForEntity(entity: F439NormalizedGeometryEntity, plans: F440OverlayRenderPlan[]): F440OverlayRenderPlan | undefined {
  return plans.find((plan) => plan.entityIds.includes(entity.id));
}

function instructionForEntity(entity: F439NormalizedGeometryEntity, plans: F440OverlayRenderPlan[]): F442RendererInstruction {
  const plan = layerPlanForEntity(entity, plans);
  const primitive = primitiveForEntity(entity);
  return {
    id: `f442:${entity.id}`,
    phase: 'F442',
    primitive,
    entityId: entity.id,
    layer: plan?.layer ?? entity.layer,
    zIndex: plan?.zIndex ?? 10,
    points: entity.points,
    style: styleForEntity(entity, plan),
    label: entity.label,
    evidenceIds: entity.evidenceIds,
    warnings: entity.warnings,
  };
}

function buildPasses(instructions: F442RendererInstruction[]): F443RendererPass[] {
  const byLayer = new Map<string, F442RendererInstruction[]>();
  for (const instruction of instructions) {
    const list = byLayer.get(instruction.layer) ?? [];
    list.push(instruction);
    byLayer.set(instruction.layer, list);
  }
  return Array.from(byLayer.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([layer, layerInstructions]) => ({
      id: `f443-pass-${layer}`,
      phase: 'F443' as const,
      label: layer,
      instructionIds: layerInstructions.map((instruction) => instruction.id),
      helper: 'drawF442ToF445RendererV2Overlay' as const,
      acceptance: `Dibujar ${layerInstructions.length} primitivas de ${layer} sin tomar eventos del canvas base.`,
    }));
}

function activationModeFor(core: F439ToF441RendererGeometryCore, instructions: F442RendererInstruction[]): F444RendererActivationMode {
  if (!instructions.length || core.status !== 'geometry-core-ready') return 'blocked';
  return core.enabledByFeatureFlag ? 'flagged-active' : 'preview-only';
}

export function buildF442ToF445RendererV2Runtime(core: F439ToF441RendererGeometryCore): F442ToF445RendererV2Runtime {
  const instructions = core.normalizedEntities
    .map((entity) => instructionForEntity(entity, core.overlayPlans))
    .sort((a, b) => a.zIndex - b.zIndex);
  const passes = buildPasses(instructions);
  const activationMode = activationModeFor(core, instructions);
  const gates: F444RuntimeGate[] = [
    {
      id: 'f444-geometry-core-ready',
      phase: 'F444',
      label: 'Geometry core listo',
      mode: activationMode,
      pass: core.status === 'geometry-core-ready',
      evidence: `${core.normalizedEntities.length} entidades F439-F441 disponibles.`,
    },
    {
      id: 'f444-render-instructions',
      phase: 'F444',
      label: 'Instrucciones de dibujo',
      mode: activationMode,
      pass: instructions.length > 0,
      evidence: `${instructions.length} instrucciones F442 generadas.`,
    },
    {
      id: 'f444-pure-helper',
      phase: 'F444',
      label: 'Helper puro',
      mode: activationMode,
      pass: true,
      evidence: 'drawF442ToF445RendererV2Overlay solo dibuja; no muta floorPlan ni eventos.',
    },
    {
      id: 'f444-event-controller-untouched',
      phase: 'F444',
      label: 'Eventos intactos',
      mode: activationMode,
      pass: !core.eventControllerTouched,
      evidence: 'Seleccion, grips, snapping y boton derecho siguen en CanvasArea/useCanvas.',
    },
  ];
  const blockingGate = gates.some((gate) => !gate.pass);
  const status = blockingGate
    ? 'renderer-v2-runtime-blocked'
    : activationMode === 'flagged-active'
      ? 'renderer-v2-runtime-ready'
      : 'renderer-v2-runtime-preview';

  return {
    schema: 'radshield-mx.f442-f445.renderer-v2-runtime.v1',
    phaseRange: 'F442-F445',
    status,
    activationMode,
    instructions,
    passes,
    gates,
    rollbackPlan: [
      {
        id: 'f445-disable-runtime-overlay',
        phase: 'F445',
        label: 'Apagar overlay runtime',
        trigger: 'Cualquier ocultamiento de canvas, perdida de sidebar o degradacion de interaccion.',
        action: 'Ocultar f442 renderer overlay canvas y conservar CanvasArea/useCanvas.',
      },
      {
        id: 'f445-disable-high-risk-flag',
        phase: 'F445',
        label: 'Apagar flag alto riesgo',
        trigger: 'Diferencia visual o funcional contra F229/F439 E2E.',
        action: 'Set VITE_CANVAS_HIGH_RISK_CAD=false y limpiar localStorage.radshield_feature_flags.',
      },
      {
        id: 'f445-keep-event-controller-off',
        phase: 'F445',
        label: 'Mantener event controller v2 apagado',
        trigger: 'Necesidad de tocar seleccion, grips, snapping o boton derecho.',
        action: 'No activar VITE_CANVAS_EVENT_CONTROLLER_V2 hasta fase dedicada de eventos.',
      },
    ],
    drawHelper: 'drawF442ToF445RendererV2Overlay',
    eventControllerTouched: false,
    releaseDecision: activationMode === 'flagged-active'
      ? 'Runtime v2 activo bajo flag; listo para smoke visual y rollback F445.'
      : activationMode === 'preview-only'
        ? 'Runtime v2 visible como preview; no sustituye renderer base hasta activar flag en staging.'
        : 'Runtime v2 bloqueado hasta tener geometry core e instrucciones de dibujo.',
  };
}

function screenPoint(point: { x: number; y: number }, projection: F442CanvasProjection) {
  return {
    x: point.x * projection.scale + projection.offsetX,
    y: point.y * projection.scale + projection.offsetY,
  };
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  const label = text.length > 24 ? `${text.slice(0, 21)}...` : text;
  ctx.save();
  ctx.font = 'bold 10px sans-serif';
  const width = Math.max(38, ctx.measureText(label).width + 10);
  ctx.fillStyle = 'rgba(15,23,42,0.82)';
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y - 16, width, 16, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 5, y - 5);
  ctx.restore();
}

export function drawF442ToF445RendererV2Overlay(
  ctx: CanvasRenderingContext2D,
  runtime: F442ToF445RendererV2Runtime,
  projection: F442CanvasProjection,
  options: { showLabels?: boolean; previewOpacity?: number } = {},
) {
  if (runtime.status === 'renderer-v2-runtime-blocked') return;
  const showLabels = options.showLabels ?? true;
  const previewOpacity = options.previewOpacity ?? (runtime.activationMode === 'flagged-active' ? 1 : 0.72);

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  for (const instruction of runtime.instructions) {
    if (!instruction.points.length && instruction.primitive !== 'badge') continue;
    const points = instruction.points.map((point) => screenPoint(point, projection));
    const first = points[0] ?? { x: 14, y: 94 };
    ctx.save();
    ctx.globalAlpha = Math.min(1, instruction.style.opacity * previewOpacity);
    ctx.strokeStyle = instruction.style.stroke;
    ctx.fillStyle = instruction.style.fill;
    ctx.lineWidth = Math.max(1, instruction.style.lineWidth * Math.max(0.65, projection.scale));
    ctx.setLineDash(instruction.style.lineDash ?? []);

    if (instruction.primitive === 'polyline' && points.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else if ((instruction.primitive === 'polygon' || instruction.primitive === 'footprint') && points.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (instruction.primitive === 'badge') {
      ctx.beginPath();
      ctx.arc(first.x, first.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    if (showLabels && instruction.primitive !== 'badge') {
      drawLabel(ctx, instruction.label, first.x + 4, first.y - 6, instruction.warnings.length ? '#fbbf24' : '#bae6fd');
    }
  }

  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(8,47,73,0.86)';
  ctx.strokeStyle = runtime.activationMode === 'flagged-active' ? '#34d399' : '#38bdf8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(12, 12, 190, 42, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e0f2fe';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('F442-F445 Renderer v2 overlay', 20, 28);
  ctx.font = '9px sans-serif';
  ctx.fillText(`${runtime.instructions.length} primitives | ${runtime.activationMode}`, 20, 43);
  ctx.restore();
  ctx.restore();
}
