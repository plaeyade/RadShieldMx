// =============================================================================
// DXF Parser — Parser de archivos DXF (Drawing eXchange Format)
// Entidades: LINE, CIRCLE, ARC, LWPOLYLINE, POLYLINE (VERTEX…SEQEND), TEXT, MTEXT.
// Bloques: sección BLOCKS + INSERT (también XREF ligados, que el DXF guarda como INSERT), explotados con su
// transformación (punto base, escala X/Y, rotación, matriz de columnas/filas, extrusión (0,0,-1)) y anidados hasta
// `maxInsertDepth`. Las entidades de un bloque en la capa «0» heredan la capa del INSERT (regla de AutoCAD).
// Capas (LAYER) extraídas para visualización selectiva. Lectura por pares sin `split` del archivo completo, para
// que un DXF de ~100 MB (plano BIND con XREF ligados) no duplique la memoria.
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

/** Estadística de la explosión de bloques (para el resumen del importador). */
export interface DXFParseStats {
  blocks: number;
  inserts: number;
  explodedEntities: number;
  maxDepthReached: number;
  skippedPaperSpace: number;
  truncated: boolean;
}

export interface DXFParsed {
  layers: Map<string, DXFLayer>;
  entities: DXFEntity[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  unit: string;
  stats?: DXFParseStats;
  warnings?: string[];
}

export interface DXFParseOptions {
  /** Explota INSERT/bloques (por omisión true). Con false sólo se leen las entidades sueltas del espacio modelo. */
  explodeInserts?: boolean;
  /** Profundidad máxima de bloques anidados (por omisión 12). */
  maxInsertDepth?: number;
  /** Límite de entidades resultantes, para no agotar la memoria del navegador (por omisión 3 000 000). */
  maxEntities?: number;
}

// ─── Lector de pares código/valor (sin `split` del archivo completo) ───
class DXFPairReader {
  private c = -1;
  private v = '';
  private pos = 0;
  private pendiente = false;
  private readonly s: string;
  constructor(s: string) { this.s = s; }
  /** Código del par actual (método, no propiedad, para que TS no estreche el tipo entre lecturas). */
  code(): number { return this.c; }
  value(): string { return this.v; }

  private linea(): string | null {
    const s = this.s;
    if (this.pos >= s.length) return null;
    let fin = s.indexOf('\n', this.pos);
    if (fin < 0) fin = s.length;
    const out = s.slice(this.pos, fin);
    this.pos = fin + 1;
    return out.trim();
  }

  /** Avanza al siguiente par; false al final del archivo. */
  next(): boolean {
    if (this.pendiente) { this.pendiente = false; return true; }
    const c = this.linea();
    if (c === null) return false;
    const v = this.linea();
    const code = parseInt(c, 10);
    this.c = Number.isFinite(code) ? code : -1;
    this.v = v ?? '';
    return true;
  }

  /** Devuelve el par actual para que lo lea el siguiente `next()`. */
  pushBack() { this.pendiente = true; }
}

/** Matriz afín 2D: x' = a·x + c·y + e; y' = b·x + d·y + f. */
interface Afin { a: number; b: number; c: number; d: number; e: number; f: number }
const IDENTIDAD: Afin = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

/** m1 ∘ m2 (aplica m2 y luego m1). */
function componer(m1: Afin, m2: Afin): Afin {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  };
}

function aplicar(m: Afin, p: DXFPoint): DXFPoint {
  return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
}

/** Extrusión (0,0,-1): el OCS tiene el eje X invertido (algoritmo del eje arbitrario). */
const ESPEJO_OCS: Afin = { a: -1, b: 0, c: 0, d: 1, e: 0, f: 0 };

interface InsertRef {
  type: 'INSERT';
  layer: string;
  name: string;
  insert: DXFPoint;
  sx: number;
  sy: number;
  rotation: number;
  cols: number;
  rows: number;
  colSpacing: number;
  rowSpacing: number;
  ocsMirror: boolean;
}

type RawEntity = (DXFEntity & { ocsMirror?: boolean }) | InsertRef;

interface DXFBlock {
  name: string;
  base: DXFPoint;
  entities: RawEntity[];
}

const num = (v: string | undefined, fallback = 0) => {
  if (v === undefined) return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Lee las entidades hasta ENDSEC (sección ENTITIES) o ENDBLK (bloque). POLYLINE se cierra con sus VERTEX y SEQEND;
 * ATTRIB/ATTDEF/SEQEND sueltos se descartan.
 */
function leerEntidades(r: DXFPairReader, finales: Set<string>, out: RawEntity[], stats: { skippedPaperSpace: number }) {
  // Se espera estar sobre un par (0, TIPO).
  while (r.code() === 0 && !finales.has(r.value())) {
    const tipo = r.value();
    const props: Record<number, string> = {};
    const pares: Array<{ code: number; value: string }> = [];
    let texto3 = '';
    while (r.next()) {
      if (r.code() === 0) break;
      pares.push({ code: r.code(), value: r.value() });
      if (r.code() === 3 && (tipo === 'MTEXT')) texto3 += r.value();
      props[r.code()] = r.value();
    }
    // r está sobre el (0, SIGUIENTE) o al final del archivo.
    const enPapel = props[67] === '1';
    if (tipo === 'POLYLINE') {
      const layer = props[8] || '0';
      const flags = parseInt(props[70] || '0', 10) || 0;
      const points: DXFPoint[] = [];
      const espejo = num(props[230], 1) < 0;
      while (r.code() === 0 && r.value() === 'VERTEX') {
        const vp: Record<number, string> = {};
        while (r.next()) { if (r.code() === 0) break; vp[r.code()] = r.value(); }
        const vflags = parseInt(vp[70] || '0', 10) || 0;
        // 16 = vértice de control de spline, 128 = cara de malla: no son vértices del contorno.
        if (!(vflags & 16) && !(vflags & 128)) points.push({ x: num(vp[10]), y: num(vp[20]) });
      }
      if (r.code() === 0 && r.value() === 'SEQEND') { while (r.next()) { if (r.code() === 0) break; } }
      // 16/64: malla poligonal o de caras: no es una polilínea de contorno.
      if (enPapel) { stats.skippedPaperSpace += 1; continue; }
      if (!(flags & 16) && !(flags & 64) && points.length >= 2) {
        out.push({ type: 'LWPOLYLINE', layer, points, closed: (flags & 1) === 1, ...(espejo && !(flags & 8) ? { ocsMirror: true } : {}) });
      }
      continue;
    }
    if (enPapel) { stats.skippedPaperSpace += 1; continue; }
    const e = construirEntidad(tipo, props, pares, texto3);
    if (e) out.push(e);
  }
}

function construirEntidad(tipo: string, props: Record<number, string>, pares: Array<{ code: number; value: string }>, texto3: string): RawEntity | null {
  const layer = props[8] || '0';
  const espejo = num(props[230], 1) < 0;
  const conEspejo = espejo ? { ocsMirror: true } : {};
  switch (tipo) {
    case 'LINE':
      return { type: 'LINE', layer, start: { x: num(props[10]), y: num(props[20]) }, end: { x: num(props[11]), y: num(props[21]) } };
    case 'CIRCLE':
      return { type: 'CIRCLE', layer, center: { x: num(props[10]), y: num(props[20]) }, radius: num(props[40]), ...conEspejo };
    case 'ARC':
      return {
        type: 'ARC', layer, center: { x: num(props[10]), y: num(props[20]) }, radius: num(props[40]),
        startAngle: num(props[50]), endAngle: num(props[51]), ...conEspejo,
      };
    case 'LWPOLYLINE':
      return { type: 'LWPOLYLINE', layer, points: parsePolylinePoints(pares), closed: (parseInt(props[70] || '0', 10) & 1) === 1, ...conEspejo };
    case 'TEXT':
    case 'MTEXT':
      return {
        type: tipo, layer,
        position: { x: num(props[10]), y: num(props[20]) },
        text: (tipo === 'MTEXT' ? texto3 + (props[1] || '') : (props[1] || props[3] || '')).replace(/\\P/g, '\n'),
        height: num(props[40], 2.5),
        rotation: num(props[50]),
        ...conEspejo,
      };
    case 'INSERT':
      if (!props[2]) return null;
      return {
        type: 'INSERT', layer, name: props[2],
        insert: { x: num(props[10]), y: num(props[20]) },
        sx: num(props[41], 1) || 1, sy: num(props[42], 1) || 1,
        rotation: num(props[50]),
        cols: Math.max(1, parseInt(props[70] || '1', 10) || 1),
        rows: Math.max(1, parseInt(props[71] || '1', 10) || 1),
        colSpacing: num(props[44]), rowSpacing: num(props[45]),
        ocsMirror: espejo,
      };
    default:
      return null;
  }
}

function leerBloques(r: DXFPairReader, blocks: Map<string, DXFBlock>, stats: { skippedPaperSpace: number }) {
  // r está tras (2, BLOCKS).
  while (r.next()) {
    if (r.code() === 0 && r.value() === 'ENDSEC') return;
    if (r.code() === 0 && r.value() === 'BLOCK') {
      const props: Record<number, string> = {};
      while (r.next()) { if (r.code() === 0) break; props[r.code()] = r.value(); }
      const name = props[2] || props[3] || '';
      const block: DXFBlock = { name, base: { x: num(props[10]), y: num(props[20]) }, entities: [] };
      leerEntidades(r, new Set(['ENDBLK', 'ENDSEC']), block.entities, stats);
      if (name) blocks.set(name, block);
      if (r.code() === 0 && r.value() === 'ENDSEC') return;
      if (r.code() === 0 && r.value() === 'ENDBLK') { while (r.next()) { if (r.code() === 0) break; } r.pushBack(); }
    }
  }
}

function transformarEntidad(e: DXFEntity & { ocsMirror?: boolean }, m0: Afin, layer: string): DXFEntity {
  const m = e.ocsMirror ? componer(m0, ESPEJO_OCS) : m0;
  const det = m.a * m.d - m.b * m.c;
  const escala = Math.sqrt(Math.abs(det)) || 1;
  const rot = (Math.atan2(m.b, m.a) * 180) / Math.PI;
  switch (e.type) {
    case 'LINE':
      return { type: 'LINE', layer, start: aplicar(m, e.start), end: aplicar(m, e.end) };
    case 'CIRCLE':
      return { type: 'CIRCLE', layer, center: aplicar(m, e.center), radius: e.radius * escala };
    case 'ARC': {
      const c = aplicar(m, e.center);
      const a1 = (e.startAngle * Math.PI) / 180;
      const a2 = (e.endAngle * Math.PI) / 180;
      const p1 = aplicar(m, { x: e.center.x + e.radius * Math.cos(a1), y: e.center.y + e.radius * Math.sin(a1) });
      const p2 = aplicar(m, { x: e.center.x + e.radius * Math.cos(a2), y: e.center.y + e.radius * Math.sin(a2) });
      let s = (Math.atan2(p1.y - c.y, p1.x - c.x) * 180) / Math.PI;
      let t = (Math.atan2(p2.y - c.y, p2.x - c.x) * 180) / Math.PI;
      if (det < 0) [s, t] = [t, s]; // una reflexión invierte el sentido antihorario del arco
      return { type: 'ARC', layer, center: c, radius: e.radius * escala, startAngle: (s + 360) % 360, endAngle: (t + 360) % 360 };
    }
    case 'LWPOLYLINE':
      return { type: 'LWPOLYLINE', layer, points: e.points.map((p) => aplicar(m, p)), closed: e.closed };
    case 'TEXT':
    case 'MTEXT':
      return { type: e.type, layer, position: aplicar(m, e.position), text: e.text, height: e.height * escala, rotation: e.rotation + rot };
  }
}

/** Matriz de un INSERT: T(inserción + desfase de matriz) · R(rot) · S(sx, sy) · T(−base), con el espejo OCS. */
function matrizInsert(ins: InsertRef, base: DXFPoint, col: number, row: number): Afin {
  const th = (ins.rotation * Math.PI) / 180;
  const cos = Math.cos(th);
  const sin = Math.sin(th);
  const ox = col * ins.colSpacing;
  const oy = row * ins.rowSpacing;
  const tx = ins.insert.x + cos * ox - sin * oy;
  const ty = ins.insert.y + sin * ox + cos * oy;
  const local: Afin = {
    a: cos * ins.sx, b: sin * ins.sx,
    c: -sin * ins.sy, d: cos * ins.sy,
    e: tx - (cos * ins.sx * base.x - sin * ins.sy * base.y),
    f: ty - (sin * ins.sx * base.x + cos * ins.sy * base.y),
  };
  return ins.ocsMirror ? componer(ESPEJO_OCS, local) : local;
}

// ─── Parse a DXF file from text content ───
export function parseDXF(content: string, options: DXFParseOptions = {}): DXFParsed {
  const explode = options.explodeInserts !== false;
  const maxDepth = Math.max(1, options.maxInsertDepth ?? 12);
  const maxEntities = Math.max(1, options.maxEntities ?? 3_000_000);
  const layerDefs = new Map<string, { color: number }>();
  const blocks = new Map<string, DXFBlock>();
  const modelo: RawEntity[] = [];
  const stats = { skippedPaperSpace: 0 };
  const warnings: string[] = [];
  let unit = 'mm';

  const r = new DXFPairReader(content);
  while (r.next()) {
    if (r.code() !== 0 || r.value() !== 'SECTION') continue;
    if (!r.next()) break;
    if (r.code() !== 2) continue;
    const seccion = r.value();
    if (seccion === 'HEADER') {
      while (r.next()) {
        if (r.code() === 0 && r.value() === 'ENDSEC') break;
        if (r.code() === 9 && r.value() === '$INSUNITS') {
          if (r.next() && r.code() === 70) {
            const unitMap: Record<number, string> = { 1: 'in', 2: 'ft', 4: 'mm', 5: 'cm', 6: 'm' };
            unit = unitMap[parseInt(r.value(), 10)] || 'mm';
          }
        }
      }
    } else if (seccion === 'TABLES') {
      let enCapas = false;
      while (r.next()) {
        if (r.code() === 0 && r.value() === 'ENDSEC') break;
        if (r.code() === 0 && r.value() === 'TABLE') {
          if (r.next() && r.code() === 2) enCapas = r.value() === 'LAYER';
          continue;
        }
        if (r.code() === 0 && r.value() === 'ENDTAB') { enCapas = false; continue; }
        if (enCapas && r.code() === 0 && r.value() === 'LAYER') {
          let name = '';
          let color = 7;
          while (r.next()) {
            if (r.code() === 0) break;
            if (r.code() === 2) name = r.value();
            if (r.code() === 62) color = parseInt(r.value(), 10);
          }
          if (name) layerDefs.set(name, { color });
          r.pushBack();
        }
      }
    } else if (seccion === 'BLOCKS') {
      leerBloques(r, blocks, stats);
    } else if (seccion === 'ENTITIES') {
      if (!r.next()) break;
      leerEntidades(r, new Set(['ENDSEC']), modelo, stats);
    }
  }

  // Explosión de INSERT.
  const entities: DXFEntity[] = [];
  let inserts = 0;
  let explodedEntities = 0;
  let maxDepthReached = 0;
  let truncated = false;
  const faltantes = new Set<string>();
  let profundidadExcedida = 0;

  const expandir = (lista: RawEntity[], m: Afin, capaPadre: string | null, depth: number, pila: string[]) => {
    for (const e of lista) {
      if (entities.length >= maxEntities) { truncated = true; return; }
      const capa = capaPadre !== null && e.layer === '0' ? capaPadre : e.layer;
      if (e.type !== 'INSERT') {
        entities.push(depth === 0 && !e.ocsMirror ? (e as DXFEntity) : transformarEntidad(e, m, capa));
        if (depth > 0) explodedEntities += 1;
        continue;
      }
      inserts += 1;
      if (!explode) continue;
      const blk = blocks.get(e.name);
      if (!blk) { faltantes.add(e.name); continue; }
      if (depth + 1 > maxDepth || pila.includes(e.name)) { profundidadExcedida += 1; continue; }
      maxDepthReached = Math.max(maxDepthReached, depth + 1);
      for (let row = 0; row < e.rows; row++) {
        for (let col = 0; col < e.cols; col++) {
          expandir(blk.entities, componer(m, matrizInsert(e, blk.base, col, row)), capa, depth + 1, [...pila, e.name]);
          if (truncated) return;
        }
      }
    }
  };
  expandir(modelo, IDENTIDAD, null, 0, []);

  if (faltantes.size) warnings.push(`${faltantes.size} bloque(s) referenciados por INSERT no existen en BLOCKS (XREF no ligados): ${[...faltantes].slice(0, 5).join(', ')}${faltantes.size > 5 ? '…' : ''}.`);
  if (profundidadExcedida) warnings.push(`${profundidadExcedida} INSERT omitidos por anidamiento mayor que ${maxDepth} o referencia circular.`);
  if (truncated) warnings.push(`Explosión truncada en ${maxEntities} entidades (límite de memoria): filtre capas o recorte el plano en el CAD.`);
  if (stats.skippedPaperSpace) warnings.push(`${stats.skippedPaperSpace} entidades del espacio papel omitidas.`);

  // Group entities by layer
  const layers = new Map<string, DXFLayer>();
  for (const [name, def] of layerDefs) {
    layers.set(name, { name, color: def.color, visible: true, entities: [] });
  }
  // Ensure layer '0' exists
  if (!layers.has('0')) layers.set('0', { name: '0', color: 7, visible: true, entities: [] });

  for (const entity of entities) {
    let layer = layers.get(entity.layer);
    if (!layer) {
      // Capa usada por una entidad pero no declarada en TABLES (habitual en XREF ligados): se crea.
      layer = { name: entity.layer, color: 7, visible: true, entities: [] };
      layers.set(entity.layer, layer);
    }
    layer.entities.push(entity);
  }

  // Calculate bounds
  const bounds = calculateBounds(entities);

  return {
    layers, entities, bounds, unit,
    stats: { blocks: blocks.size, inserts, explodedEntities, maxDepthReached, skippedPaperSpace: stats.skippedPaperSpace, truncated },
    warnings,
  };
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
  const expand = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  };
  for (const e of entities) {
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
        for (const p of e.points) expand(p.x, p.y); break;
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
    /**
     * Fase 12, paso 4: vista sobre el encuadre a extensión (zoom 1, desplazamiento 0 = extensión). Pantalla =
     * encuadre(p) · zoom + (dx, dy).
     */
    vista?: { zoom: number; dx: number; dy: number };
    /** Capa resaltada (las demás se atenúan), p. ej. la fila bajo el cursor en el asistente de capas. */
    resaltarCapa?: string | null;
    /** Dibuja también capas ocultas (miniaturas del asistente). */
    incluirOcultas?: boolean;
    /** Rejilla, marco y pie informativo (por omisión true; false en miniaturas). */
    decoracion?: boolean;
  }
): void {
  const { width, height, padding = 40, showLayers, lineWidth = 1, showLabels = true, vista, resaltarCapa = null, incluirOcultas = false, decoracion = true } = options;
  const { bounds, layers } = parsed;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  const contentW = width - padding * 2;
  const contentH = height - padding * 2;
  const dxW = bounds.maxX - bounds.minX;
  const dxH = bounds.maxY - bounds.minY;
  const z = vista && Number.isFinite(vista.zoom) && vista.zoom > 0 ? vista.zoom : 1;
  const vdx = vista?.dx ?? 0;
  const vdy = vista?.dy ?? 0;
  const fit = Math.min(contentW / (dxW || 1), contentH / (dxH || 1));
  const scale = fit * z;
  const offsetX = padding + (contentW - dxW * fit) / 2 - bounds.minX * fit;
  const offsetY = padding + (contentH - dxH * fit) / 2 - bounds.minY * fit;

  const transform = (p: DXFPoint) => ({
    x: (offsetX + p.x * fit) * z + vdx,
    y: (height - (offsetY + p.y * fit)) * z + vdy, // Flip Y
  });

  // Grid
  if (decoracion) {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let gx = padding; gx < width - padding; gx += 50) { ctx.beginPath(); ctx.moveTo(gx, padding); ctx.lineTo(gx, height - padding); ctx.stroke(); }
    for (let gy = padding; gy < height - padding; gy += 50) { ctx.beginPath(); ctx.moveTo(padding, gy); ctx.lineTo(width - padding, gy); ctx.stroke(); }
  }

  // Draw entities by layer
  const colorMap: Record<number, string> = {
    1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#06b6d4',
    6: '#3b82f6', 7: '#f8fafc', 8: '#a855f7', 9: '#ec4899', 10: '#14b8a6',
  };

  for (const [layerName, layer] of layers) {
    if (!layer.visible && !incluirOcultas) continue;
    if (showLayers && !showLayers.includes(layerName)) continue;
    const color = colorMap[layer.color] || '#94a3b8';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = resaltarCapa && resaltarCapa !== layerName ? 0.18 : 1;
    ctx.lineWidth = resaltarCapa === layerName ? lineWidth * 2.5 : lineWidth;

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

  ctx.globalAlpha = 1;
  if (!decoracion) return;

  // Border
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

  // Info
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px sans-serif';
  ctx.fillText(`DXF: ${parsed.entities.length} entidades | ${parsed.layers.size} capas | ${dxW.toFixed(1)} x ${dxH.toFixed(1)} ${parsed.unit}${z !== 1 ? ` | zoom ×${z.toFixed(2)}` : ''}`, padding, height - 10);
}

// ─── DWG note ───
export function isDWGFile(content: ArrayBuffer): boolean {
  const view = new Uint8Array(content.slice(0, 6));
  // DWG magic bytes: "AC" followed by version number
  return view[0] === 0x41 && view[1] === 0x43;
}

export function convertDWGNote(): string {
  return 'El formato DWG es binario propietario de Autodesk. RadShield-MX lo convierte a DXF en el navegador con LibreDWG (WebAssembly, carga diferida, sin enviar el plano a ningún servidor). Si la conversión falla, exporte el archivo como DXF desde AutoCAD o cualquier CAD compatible.';
}
