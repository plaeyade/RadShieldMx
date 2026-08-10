import type { F621F625RendererBaseDeep } from '@/lib/f621F625RendererBaseDeep';
import type { F626F630RendererBaseScheduler } from '@/lib/f626F630RendererBaseScheduler';

export interface F631TileCell {
  id: string;
  phase: 'F631';
  col: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dirty: boolean;
  layers: string[];
}

export interface F632LayerTileCoverage {
  phase: 'F632';
  layer: string;
  tileIds: string[];
  dirtyTileCount: number;
  commandCount: number;
}

export interface F633TileInvalidationGate {
  id: string;
  phase: 'F633' | 'F634' | 'F635';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F631F635RendererTileInvalidation {
  schema: 'radshield-mx.canvas.renderer-tile-invalidation.f631-f635.v1';
  phaseRange: 'F631-F635';
  status: 'tile-invalidation-ready' | 'tile-invalidation-preview' | 'tile-invalidation-blocked';
  tileSize: number;
  tiles: F631TileCell[];
  coverage: F632LayerTileCoverage[];
  gates: F633TileInvalidationGate[];
  metrics: {
    cols: number;
    rows: number;
    totalTiles: number;
    dirtyTiles: number;
    dirtyRatio: number;
    maxLayerTiles: number;
    cacheKey: string;
  };
  rollback: string[];
}

function intersects(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return a.x + a.width >= b.x && b.x + b.width >= a.x && a.y + a.height >= b.y && b.y + b.height >= a.y;
}

function clampTileSize(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 160;
  return Math.max(96, Math.min(320, Math.round(value)));
}

export function buildF631F635RendererTileInvalidation(
  deep: F621F625RendererBaseDeep,
  scheduler: F626F630RendererBaseScheduler,
  options: { width: number; height: number; tileSize?: number; highRiskRendererEnabled?: boolean },
): F631F635RendererTileInvalidation {
  const tileSize = clampTileSize(options.tileSize);
  const width = Math.max(1, Math.round(options.width));
  const height = Math.max(1, Math.round(options.height));
  const cols = Math.max(1, Math.ceil(width / tileSize));
  const rows = Math.max(1, Math.ceil(height / tileSize));
  const dirtyGroups = deep.passGroups.filter((group) => group.dirtyBounds);
  const tiles: F631TileCell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cellBounds = {
        x: col * tileSize,
        y: row * tileSize,
        width: Math.min(tileSize, width - col * tileSize),
        height: Math.min(tileSize, height - row * tileSize),
      };
      const layers = dirtyGroups
        .filter((group) => group.dirtyBounds && intersects(cellBounds, group.dirtyBounds))
        .map((group) => group.layer);
      tiles.push({
        id: `f631-tile-${col}-${row}`,
        phase: 'F631',
        col,
        row,
        ...cellBounds,
        dirty: layers.length > 0,
        layers: Array.from(new Set(layers)).sort(),
      });
    }
  }

  const coverage: F632LayerTileCoverage[] = deep.passGroups.map((group) => {
    const layerTiles = tiles.filter((tile) => tile.layers.includes(group.layer));
    return {
      phase: 'F632',
      layer: group.layer,
      tileIds: layerTiles.map((tile) => tile.id),
      dirtyTileCount: layerTiles.length,
      commandCount: group.commandIds.length,
    };
  }).sort((a, b) => b.dirtyTileCount - a.dirtyTileCount || a.layer.localeCompare(b.layer));

  const dirtyTiles = tiles.filter((tile) => tile.dirty).length;
  const dirtyRatio = Math.round((dirtyTiles / tiles.length) * 1000) / 10;
  const maxLayerTiles = coverage.reduce((max, item) => Math.max(max, item.dirtyTileCount), 0);
  const gates: F633TileInvalidationGate[] = [
    {
      id: 'f633-scheduler-ready',
      phase: 'F633',
      label: 'Scheduler disponible',
      pass: scheduler.status !== 'renderer-scheduler-blocked',
      evidence: scheduler.status,
    },
    {
      id: 'f633-dirty-tiles-bounded',
      phase: 'F633',
      label: 'Dirty tiles acotados',
      pass: dirtyRatio <= 85,
      evidence: `${dirtyTiles}/${tiles.length} tiles dirty (${dirtyRatio}%).`,
    },
    {
      id: 'f634-cache-linked',
      phase: 'F634',
      label: 'Cache scheduler enlazado',
      pass: scheduler.invalidation.cacheKey.startsWith('f626-'),
      evidence: scheduler.invalidation.cacheKey,
    },
    {
      id: 'f635-preview-only',
      phase: 'F635',
      label: 'Atlas sin sustituir canvas',
      pass: options.highRiskRendererEnabled !== true,
      evidence: options.highRiskRendererEnabled ? 'Flag alto riesgo activo; requiere E2E extendido.' : 'Preview visual: tiles no capturan eventos ni reemplazan renderer.',
    },
  ];
  const blocked = gates.some((gate) => !gate.pass && gate.id !== 'f635-preview-only');
  const status = blocked
    ? 'tile-invalidation-blocked'
    : options.highRiskRendererEnabled
      ? 'tile-invalidation-ready'
      : 'tile-invalidation-preview';

  return {
    schema: 'radshield-mx.canvas.renderer-tile-invalidation.f631-f635.v1',
    phaseRange: 'F631-F635',
    status,
    tileSize,
    tiles,
    coverage,
    gates,
    metrics: {
      cols,
      rows,
      totalTiles: tiles.length,
      dirtyTiles,
      dirtyRatio,
      maxLayerTiles,
      cacheKey: `f631-${scheduler.invalidation.cacheKey.replace('f626-', '')}-${dirtyTiles}`,
    },
    rollback: [
      'Desactivar atlas F631-F635 y usar scheduler F626-F630 sin tiles.',
      'Conservar dirty regions F621-F625 como diagnostico visual.',
      'No usar tiles para eventos, hit testing ni calculo hasta E2E extendido.',
    ],
  };
}

export function drawF631F635TileInvalidationOverlay(
  ctx: CanvasRenderingContext2D,
  atlas: F631F635RendererTileInvalidation,
  options: { showCleanTiles?: boolean } = {},
) {
  if (atlas.status === 'tile-invalidation-blocked') return;
  const showCleanTiles = options.showCleanTiles ?? false;
  ctx.save();
  ctx.lineWidth = 1;
  for (const tile of atlas.tiles) {
    if (!tile.dirty && !showCleanTiles) continue;
    ctx.strokeStyle = tile.dirty ? 'rgba(124,58,237,0.42)' : 'rgba(148,163,184,0.12)';
    ctx.fillStyle = tile.dirty ? 'rgba(124,58,237,0.045)' : 'rgba(148,163,184,0.015)';
    ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
    ctx.strokeRect(tile.x, tile.y, tile.width, tile.height);
  }
  ctx.restore();
}
