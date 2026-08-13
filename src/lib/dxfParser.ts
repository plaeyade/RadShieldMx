// =============================================================================
// DXF Parser — Parser de archivos DXF (Drawing eXchange Format)
// Soporta: LINE, CIRCLE, ARC, LWPOLYLINE, POLYLINE, TEXT, MTEXT
// Capas (LAYER) extraídas para visualización selectiva
// =============================================================================

export interface DXFPoint {
  x: number;
  y: number;
  z?: number;
}

export interface DXFLine {
  type: 'LINE';
  layer: string;
  start: DXFPoint;
  end: DXFPoint;
}

export interface DXFCircle {
  type: 'CIRCLE';
  layer: string;
  center: DXFPoint;
  radius: number;
}

export interface DXFArc {
  type: 'ARC';
  layer: string;
  center: DXFPoint;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface DXFPolyline {
  type: 'LWPOLYLINE';
  layer: string;
  points: DXFPoint[];
  closed: boolean;
}

export interface DXFText {
  type: 'TEXT' | 'MTEXT';
  layer: string;
  position: DXFPoint;
  text: string;
  height: number;
  rotation: number;
}

export type DXFEntity = DXFLine | DXFCircle | DXFArc | DXFPolyline | DXFText;

export interface DXFLayer {
  name: string;
  color: number;
  visible: boolean;
  entities: DXFEntity[];
}

export interface DXFParsed {
  layers: Map<string, DXFLayer>;
  entities: DXFEntity[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  unit: string;
}

// ─── Parse a DXF file from text content ───
export function parseDXF(content: string): DXFParsed {
  const lines = content.split(/\r?\n/).map(l => l.trim());
  const entities: DXFEntity[] = [];
  const layerDefs = new Map<string, { color: number }>();
  let unit = 'mm';

  // Parse sections
  let i = 0;
  while (i < lines.length) {
    const groupCode = parseInt(lines[i]);
    const value = lines[i + 1] || '';

    // HEADER section — units
    if (groupCode === 0 && value === 'SECTION') {
      const nextCode = parseInt(lines[i + 2] || '0');
      const nextVal = lines[i + 3] || '';
      if (nextCode === 2 && nextVal === 'HEADER') {
        i = parseHeaderSection(lines, i, { unit: (u: string) => { unit = u; } });
        continue;
      }
      if (nextCode === 2 && nextVal === 'TABLES') {
        i = parseTablesSection(lines, i, layerDefs);
        continue;
      }
      if (nextCode === 2 && nextVal === 'ENTITIES') {
        i = parseEntitiesSection(lines, i, entities);
        continue;
      }
    }
    i += 2;
  }

  // Group entities by layer
  const layers = new Map<string, DXFLayer>();
  for (const [name, def] of layerDefs) {
    layers.set(name, { name, color: def.color, visible: true, entities: [] });
  }
  // Ensure layer '0' exists
  if (!layers.has('0')) layers.set('0', { name: '0', color: 7, visible: true, entities: [] });

  for (const entity of entities) {
    const layer = layers.get(entity.layer) || layers.get('0')!;
    layer.entities.push(entity);
  }

  // Calculate bounds
  const bounds = calculateBounds(entities);

  return { layers, entities, bounds, unit };
}

function parseHeaderSection(lines: string[], startIdx: number, callbacks: { unit: (u: string) => void }): number {
  let i = startIdx + 4; // Skip SECTION, 2, HEADER
  while (i < lines.length - 1) {
    const code = parseInt(lines[i]);
    const val = lines[i + 1];
    if (code === 0 && val === 'ENDSEC') return i + 2;
    // $INSUNITS
    if (code === 9 && val === '$INSUNITS') {
      i += 2;
      const uCode = parseInt(lines[i]);
      if (uCode === 70) {
        const unitVal = parseInt(lines[i + 1]);
        const unitMap: Record<number, string> = { 1: 'in', 2: 'ft', 4: 'mm', 5: 'cm', 6: 'm' };
        callbacks.unit(unitMap[unitVal] || 'mm');
      }
    }
    i += 2;
  }
  return i;
}

function parseTablesSection(lines: string[], startIdx: number, layerDefs: Map<string, { color: number }>): number {
  let i = startIdx + 4;
  while (i < lines.length - 1) {
    const code = parseInt(lines[i]);
    const val = lines[i + 1];
    if (code === 0 && val === 'ENDSEC') return i + 2;
    if (code === 0 && val === 'TABLE') {
      i += 2;
      if (parseInt(lines[i]) === 2 && lines[i + 1] === 'LAYER') {
        i = parseLayerTable(lines, i + 2, layerDefs);
        continue;
      }
    }
    i += 2;
  }
  return i;
}

function parseLayerTable(lines: string[], startIdx: number, layerDefs: Map<string, { color: number }>): number {
  let i = startIdx;
  while (i < lines.length - 1) {
    const code = parseInt(lines[i]);
    const val = lines[i + 1];
    if (code === 0 && val === 'ENDTAB') return i + 2;
    if (code === 0 && val === 'LAYER') {
      let name = '';
      let color = 7;
      i += 2;
      while (i < lines.length - 1) {
        const c = parseInt(lines[i]);
        const v = lines[i + 1];
        if (c === 0) break;
        if (c === 2) name = v;
        if (c === 62) color = parseInt(v);
        i += 2;
      }
      if (name) layerDefs.set(name, { color });
    } else {
      i += 2;
    }
  }
  return i;
}

function parseEntitiesSection(lines: string[], startIdx: number, entities: DXFEntity[]): number {
  let i = startIdx + 4; // Skip SECTION, 2, ENTITIES
  while (i < lines.length - 1) {
    const code = parseInt(lines[i]);
    const val = lines[i + 1];
    if (code === 0 && val === 'ENDSEC') return i + 2;
    if (code === 0) {
      const entityType = val;
      i += 2;
      const result = parseEntity(lines, i, entityType);
      if (result.entity) entities.push(result.entity as DXFEntity);
      i = result.nextIndex;
    } else {
      i += 2;
    }
  }
  return i;
}

function parseEntity(lines: string[], startIdx: number, type: string): { entity: Partial<DXFEntity> | null; nextIndex: number } {
  const props: Record<number, any> = {};
  const pairs: Array<{ code: number; value: string }> = [];
  let i = startIdx;
  while (i < lines.length - 1) {
    const code = parseInt(lines[i]);
    const val = lines[i + 1];
    if (code === 0) break;
    pairs.push({ code, value: val });
    props[code] = val;
    i += 2;
  }

  const layer = (props[8] as string) || '0';

  switch (type) {
    case 'LINE':
      return {
        entity: {
          type: 'LINE', layer,
          start: { x: parseFloat(props[10] || 0), y: parseFloat(props[20] || 0) },
          end: { x: parseFloat(props[11] || 0), y: parseFloat(props[21] || 0) },
        }, nextIndex: i,
      };
    case 'CIRCLE':
      return {
        entity: {
          type: 'CIRCLE', layer,
          center: { x: parseFloat(props[10] || 0), y: parseFloat(props[20] || 0) },
          radius: parseFloat(props[40] || 0),
        }, nextIndex: i,
      };
    case 'ARC':
      return {
        entity: {
          type: 'ARC', layer,
          center: { x: parseFloat(props[10] || 0), y: parseFloat(props[20] || 0) },
          radius: parseFloat(props[40] || 0),
          startAngle: parseFloat(props[50] || 0),
          endAngle: parseFloat(props[51] || 0),
        }, nextIndex: i,
      };
    case 'LWPOLYLINE':
      return {
        entity: {
          type: 'LWPOLYLINE', layer,
          points: parsePolylinePoints(pairs),
          closed: (parseInt(props[70] || 0) & 1) === 1,
        }, nextIndex: i,
      };
    case 'TEXT':
    case 'MTEXT':
      return {
        entity: {
          type: type as 'TEXT' | 'MTEXT', layer,
          position: { x: parseFloat(props[10] || 0), y: parseFloat(props[20] || 0) },
          text: (props[1] || props[3] || '').replace(/\\P/g, '\n'),
          height: parseFloat(props[40] || 2.5),
          rotation: parseFloat(props[50] || 0),
        }, nextIndex: i,
      };
    default:
      return { entity: null, nextIndex: i };
  }
}

function parsePolylinePoints(pairs: Array<{ code: number; value: string }>): DXFPoint[] {
  const points: DXFPoint[] = [];
  let x: number | null = null;
  let y: number | null = null;
  for (const pair of pairs) {
    if (pair.code === 10) {
      if (x !== null && y !== null) points.push({ x, y });
      x = parseFloat(pair.value);
      y = null;
    }
    if (pair.code === 20) {
      y = parseFloat(pair.value);
      if (x !== null && Number.isFinite(x) && Number.isFinite(y)) {
        points.push({ x, y });
        x = null;
        y = null;
      }
    }
  }
  if (x !== null && y !== null && Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
  return points;
}

function calculateBounds(entities: DXFEntity[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const e of entities) {
    const expand = (x: number, y: number) => {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    };
    switch (e.type) {
      case 'LINE':
        expand(e.start.x, e.start.y); expand(e.end.x, e.end.y); break;
      case 'CIRCLE':
        expand(e.center.x - e.radius, e.center.y - e.radius);
        expand(e.center.x + e.radius, e.center.y + e.radius); break;
      case 'ARC':
        expand(e.center.x - e.radius, e.center.y - e.radius);
        expand(e.center.x + e.radius, e.center.y + e.radius); break;
      case 'LWPOLYLINE':
        e.points.forEach(p => expand(p.x, p.y)); break;
      case 'TEXT': case 'MTEXT':
        expand(e.position.x, e.position.y); break;
    }
  }
  if (minX === Infinity) { minX = 0; minY = 0; maxX = 100; maxY = 100; }
  return { minX, minY, maxX, maxY };
}

// ─── Render DXF to Canvas ───
export function renderDXFToCanvas(
  ctx: CanvasRenderingContext2D,
  parsed: DXFParsed,
  options: {
    width: number;
    height: number;
    padding?: number;
    showLayers?: string[];
    lineWidth?: number;
    showLabels?: boolean;
  }
): void {
  const { width, height, padding = 40, showLayers, lineWidth = 1, showLabels = true } = options;
  const { bounds, layers } = parsed;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  const contentW = width - padding * 2;
  const contentH = height - padding * 2;
  const dxW = bounds.maxX - bounds.minX;
  const dxH = bounds.maxY - bounds.minY;
  const scale = Math.min(contentW / (dxW || 1), contentH / (dxH || 1));
  const offsetX = padding + (contentW - dxW * scale) / 2 - bounds.minX * scale;
  const offsetY = padding + (contentH - dxH * scale) / 2 - bounds.minY * scale;

  const transform = (p: DXFPoint) => ({
    x: offsetX + p.x * scale,
    y: height - (offsetY + p.y * scale), // Flip Y
  });

  // Grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 0.5;
  for (let gx = padding; gx < width - padding; gx += 50) { ctx.beginPath(); ctx.moveTo(gx, padding); ctx.lineTo(gx, height - padding); ctx.stroke(); }
  for (let gy = padding; gy < height - padding; gy += 50) { ctx.beginPath(); ctx.moveTo(padding, gy); ctx.lineTo(width - padding, gy); ctx.stroke(); }

  // Draw entities by layer
  const colorMap: Record<number, string> = {
    1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#06b6d4',
    6: '#3b82f6', 7: '#f8fafc', 8: '#a855f7', 9: '#ec4899', 10: '#14b8a6',
  };

  for (const [layerName, layer] of layers) {
    if (!layer.visible) continue;
    if (showLayers && !showLayers.includes(layerName)) continue;
    const color = colorMap[layer.color] || '#94a3b8';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;

    for (const entity of layer.entities) {
      switch (entity.type) {
        case 'LINE': {
          const s = transform(entity.start);
          const e = transform(entity.end);
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke(); break;
        }
        case 'CIRCLE': {
          const c = transform(entity.center);
          const r = entity.radius * scale;
          ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke(); break;
        }
        case 'ARC': {
          const c = transform(entity.center);
          const r = entity.radius * scale;
          const startRad = (entity.startAngle * Math.PI) / 180;
          const endRad = (entity.endAngle * Math.PI) / 180;
          ctx.beginPath(); ctx.arc(c.x, c.y, r, -endRad, -startRad); ctx.stroke(); break;
        }
        case 'LWPOLYLINE': {
          if (entity.points.length < 2) break;
          ctx.beginPath();
          const first = transform(entity.points[0]);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < entity.points.length; i++) {
            const p = transform(entity.points[i]);
            ctx.lineTo(p.x, p.y);
          }
          if (entity.closed) ctx.closePath();
          ctx.stroke(); break;
        }
        case 'TEXT': case 'MTEXT': {
          if (!showLabels) break;
          const p = transform(entity.position);
          ctx.font = `${entity.height * scale * 2}px sans-serif`;
          ctx.fillText(entity.text, p.x, p.y); break;
        }
      }
    }
  }

  // Border
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

  // Info
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px sans-serif';
  ctx.fillText(`DXF: ${parsed.entities.length} entidades | ${parsed.layers.size} capas | ${dxW.toFixed(1)} x ${dxH.toFixed(1)} ${parsed.unit}`, padding, height - 10);
}

// ─── DWG note ───
export function isDWGFile(content: ArrayBuffer): boolean {
  const view = new Uint8Array(content.slice(0, 6));
  // DWG magic bytes: "AC" followed by version number
  return view[0] === 0x41 && view[1] === 0x43;
}

export function convertDWGNote(): string {
  return 'El formato DWG es binario propietario de Autodesk. Para importar, exporte el archivo como DXF (Drawing eXchange Format) desde AutoCAD o cualquier CAD compatible. RadShield-MX soporta DXF completo con capas.';
}
