import type { F621F625RendererBaseDeep, F621RenderCommand } from '@/lib/f621F625RendererBaseDeep';
import type { F631F635RendererTileInvalidation, F631TileCell } from '@/lib/f631F635RendererTileInvalidation';

export interface F636HitTargetShadow {
  id: string;
  phase: 'F636';
  commandId: string;
  instructionId: string;
  layer: string;
  primitive: F621RenderCommand['primitive'];
  zIndex: number;
  bounds: F621RenderCommand['screenBounds'];
  center: { x: number; y: number };
  tileIds: string[];
  selectable: boolean;
  reason: string;
}

export interface F637TileHitBucket {
  id: string;
  phase: 'F637';
  tileId: string;
  targetIds: string[];
  topTargetId: string | null;
}

export interface F638PointerProbe {
  phase: 'F638';
  point: { x: number; y: number };
  tileId: string | null;
  candidateIds: string[];
  primaryCandidateId: string | null;
  reversibleAction: 'preview-only' | 'candidate-select-ready';
}

export interface F639HitTestGate {
  id: string;
  phase: 'F639' | 'F640';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F636F640RendererHitTestShadow {
  schema: 'radshield-mx.canvas.renderer-hit-test-shadow.f636-f640.v1';
  phaseRange: 'F636-F640';
  status: 'hit-test-shadow-ready' | 'hit-test-shadow-preview' | 'hit-test-shadow-blocked';
  targets: F636HitTargetShadow[];
  buckets: F637TileHitBucket[];
  probe: F638PointerProbe;
  gates: F639HitTestGate[];
  metrics: {
    selectableTargets: number;
    bucketCount: number;
    occupiedBuckets: number;
    maxTargetsPerBucket: number;
    cacheKey: string;
  };
  rollback: string[];
}

function intersects(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return a.x + a.width >= b.x && b.x + b.width >= a.x && a.y + a.height >= b.y && b.y + b.height >= a.y;
}

function contains(tile: F631TileCell, point: { x: number; y: number }) {
  return point.x >= tile.x && point.x <= tile.x + tile.width && point.y >= tile.y && point.y <= tile.y + tile.height;
}

function centerOf(bounds: F621RenderCommand['screenBounds']) {
  return {
    x: Math.round(bounds.x + bounds.width / 2),
    y: Math.round(bounds.y + bounds.height / 2),
  };
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function buildF636F640RendererHitTestShadow(
  deep: F621F625RendererBaseDeep,
  atlas: F631F635RendererTileInvalidation,
  options: { pointer?: { x: number; y: number }; highRiskRendererEnabled?: boolean } = {},
): F636F640RendererHitTestShadow {
  const visibleCommands = deep.commands.filter((command) => command.visibleInViewport);
  const targets = visibleCommands
    .map((command): F636HitTargetShadow => {
      const tileIds = atlas.tiles
        .filter((tile) => intersects(tile, command.screenBounds))
        .map((tile) => tile.id);
      const selectable = command.primitive !== 'label' && command.screenBounds.width >= 8 && command.screenBounds.height >= 8;
      return {
        id: `f636-target-${command.instructionId.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
        phase: 'F636',
        commandId: command.id,
        instructionId: command.instructionId,
        layer: command.layer,
        primitive: command.primitive,
        zIndex: command.zIndex,
        bounds: command.screenBounds,
        center: centerOf(command.screenBounds),
        tileIds,
        selectable,
        reason: selectable ? 'Comando visible con bounds suficientes.' : 'Preview no seleccionable por tipo o bounds.',
      };
    })
    .sort((a, b) => b.zIndex - a.zIndex || a.layer.localeCompare(b.layer));

  const buckets: F637TileHitBucket[] = atlas.tiles.map((tile) => {
    const bucketTargets = targets
      .filter((target) => target.tileIds.includes(tile.id) && target.selectable)
      .sort((a, b) => b.zIndex - a.zIndex);
    return {
      id: `f637-bucket-${tile.id}`,
      phase: 'F637',
      tileId: tile.id,
      targetIds: bucketTargets.map((target) => target.id),
      topTargetId: bucketTargets[0]?.id ?? null,
    };
  });

  const point = options.pointer ?? targets[0]?.center ?? { x: 0, y: 0 };
  const tile = atlas.tiles.find((candidateTile) => contains(candidateTile, point)) ?? null;
  const bucket = tile ? buckets.find((candidateBucket) => candidateBucket.tileId === tile.id) : null;
  const candidateIds = bucket?.targetIds.slice(0, 5) ?? [];
  const probe: F638PointerProbe = {
    phase: 'F638',
    point,
    tileId: tile?.id ?? null,
    candidateIds,
    primaryCandidateId: candidateIds[0] ?? null,
    reversibleAction: options.highRiskRendererEnabled ? 'candidate-select-ready' : 'preview-only',
  };

  const occupiedBuckets = buckets.filter((bucketItem) => bucketItem.targetIds.length > 0).length;
  const maxTargetsPerBucket = buckets.reduce((max, bucketItem) => Math.max(max, bucketItem.targetIds.length), 0);
  const gates: F639HitTestGate[] = [
    {
      id: 'f639-atlas-ready',
      phase: 'F639',
      label: 'Atlas F631 disponible',
      pass: atlas.status !== 'tile-invalidation-blocked',
      evidence: atlas.status,
    },
    {
      id: 'f639-targets-visible',
      phase: 'F639',
      label: 'Targets visibles',
      pass: targets.length > 0,
      evidence: `${targets.length} targets derivados de comandos F621.`,
    },
    {
      id: 'f640-preview-reversible',
      phase: 'F640',
      label: 'Eventos legacy preservados',
      pass: options.highRiskRendererEnabled !== true,
      evidence: options.highRiskRendererEnabled ? 'Flag alto riesgo activo; permitiria seleccionar candidatos.' : 'Preview shadow: no modifica seleccion, drag ni useCanvas.',
    },
  ];
  const blocked = gates.some((gate) => !gate.pass && gate.id !== 'f640-preview-reversible');
  const status = blocked
    ? 'hit-test-shadow-blocked'
    : options.highRiskRendererEnabled
      ? 'hit-test-shadow-ready'
      : 'hit-test-shadow-preview';

  return {
    schema: 'radshield-mx.canvas.renderer-hit-test-shadow.f636-f640.v1',
    phaseRange: 'F636-F640',
    status,
    targets,
    buckets,
    probe,
    gates,
    metrics: {
      selectableTargets: targets.filter((target) => target.selectable).length,
      bucketCount: buckets.length,
      occupiedBuckets,
      maxTargetsPerBucket,
      cacheKey: `f636-${stableHash(`${atlas.metrics.cacheKey}:${targets.length}:${occupiedBuckets}:${probe.primaryCandidateId ?? 'none'}`)}`,
    },
    rollback: [
      'Desactivar F636-F640 y conservar atlas F631-F635 como overlay visual.',
      'No enlazar probe F638 a seleccion real hasta E2E de renderer/eventos.',
      'Mantener useCanvas como unico controlador canonico de pointer events.',
    ],
  };
}

export function drawF636F640HitTestShadowOverlay(
  ctx: CanvasRenderingContext2D,
  shadow: F636F640RendererHitTestShadow,
  options: { showAllCandidates?: boolean } = {},
) {
  if (shadow.status === 'hit-test-shadow-blocked') return;
  const showAllCandidates = options.showAllCandidates ?? false;
  ctx.save();
  const visibleTargets = showAllCandidates
    ? shadow.targets.filter((target) => target.selectable).slice(0, 10)
    : shadow.targets.filter((target) => shadow.probe.candidateIds.includes(target.id));

  for (const target of visibleTargets) {
    const isPrimary = target.id === shadow.probe.primaryCandidateId;
    ctx.strokeStyle = isPrimary ? 'rgba(20,184,166,0.95)' : 'rgba(20,184,166,0.42)';
    ctx.fillStyle = isPrimary ? 'rgba(20,184,166,0.10)' : 'rgba(20,184,166,0.035)';
    ctx.lineWidth = isPrimary ? 2 : 1;
    ctx.setLineDash(isPrimary ? [] : [4, 4]);
    ctx.fillRect(target.bounds.x, target.bounds.y, target.bounds.width, target.bounds.height);
    ctx.strokeRect(target.bounds.x, target.bounds.y, target.bounds.width, target.bounds.height);
    ctx.beginPath();
    ctx.arc(target.center.x, target.center.y, isPrimary ? 4 : 3, 0, Math.PI * 2);
    ctx.fillStyle = isPrimary ? '#14b8a6' : '#99f6e4';
    ctx.fill();
  }

  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(15,23,42,0.86)';
  ctx.strokeStyle = '#14b8a6';
  ctx.lineWidth = 1;
  const x = Math.max(10, shadow.probe.point.x + 12);
  const y = Math.max(164, shadow.probe.point.y + 12);
  ctx.beginPath();
  ctx.roundRect(x, y, 212, 46, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ccfbf1';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('F636-F640 Hit-test shadow', x + 9, y + 16);
  ctx.font = '9px sans-serif';
  ctx.fillText(`tile ${shadow.probe.tileId ?? 'none'} | cand ${shadow.probe.candidateIds.length}`, x + 9, y + 31);
  ctx.fillText(`${shadow.probe.reversibleAction} | ${shadow.status}`, x + 9, y + 42);
  ctx.restore();
}
