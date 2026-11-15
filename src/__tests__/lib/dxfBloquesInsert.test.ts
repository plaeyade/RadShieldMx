/**
 * Hallazgo 1 (auditoría independiente 2026-11): el parser no leía INSERT/BLOCKS/POLYLINE y los planos con XREF ligados se importaban
 * sin muros blindados. DXF sintéticos (generados aquí, sin datos de ningún cliente).
 */
import { describe, expect, it } from 'vitest';
import { parseDXF, type DXFLine } from '@/lib/dxfParser';
import { importDXFToFloorPlan } from '@/lib/medical3D/cadBimBridge';

const pares = (...p: Array<[number, string | number]>) => p.map(([c, v]) => `${c}\n${v}`).join('\n');
const linea = (layer: string, x1: number, y1: number, x2: number, y2: number, extra: Array<[number, string | number]> = []) =>
  pares([0, 'LINE'], [8, layer], ...extra, [10, x1], [20, y1], [11, x2], [21, y2]);

function dxf({ bloques = '', entidades = '', capas = ['0'] }: { bloques?: string; entidades?: string; capas?: string[] }) {
  return [
    pares([0, 'SECTION'], [2, 'HEADER'], [9, '$INSUNITS'], [70, 6], [0, 'ENDSEC']),
    pares([0, 'SECTION'], [2, 'TABLES'], [0, 'TABLE'], [2, 'LAYER']),
    ...capas.map((c) => pares([0, 'LAYER'], [2, c], [62, 7])),
    pares([0, 'ENDTAB'], [0, 'ENDSEC']),
    pares([0, 'SECTION'], [2, 'BLOCKS']),
    bloques,
    pares([0, 'ENDSEC'], [0, 'SECTION'], [2, 'ENTITIES']),
    entidades,
    pares([0, 'ENDSEC'], [0, 'EOF']),
  ].filter(Boolean).join('\n');
}

const bloque = (nombre: string, base: [number, number], cuerpo: string) =>
  [pares([0, 'BLOCK'], [8, '0'], [2, nombre], [70, 0], [10, base[0]], [20, base[1]], [3, nombre]), cuerpo, pares([0, 'ENDBLK'], [8, '0'])].join('\n');

const insert = (nombre: string, layer: string, x: number, y: number, extra: Array<[number, string | number]> = []) =>
  pares([0, 'INSERT'], [8, layer], [2, nombre], [10, x], [20, y], ...extra);

const cerca = (a: number, b: number) => expect(a).toBeCloseTo(b, 9);
const lineas = (p: ReturnType<typeof parseDXF>, capa: string) => p.entities.filter((e): e is DXFLine => e.type === 'LINE' && e.layer === capa);

describe('dxfParser: INSERT y bloques explotados con su transformación', () => {
  it('INSERT con punto base, escala, rotación 90° y capa «0» heredada', () => {
    const p = parseDXF(dxf({
      bloques: bloque('MURO', [1, 0], linea('0', 1, 0, 3, 0) + '\n' + linea('TABIQUES BLINDADOS', 1, 0, 1, 1)),
      entidades: insert('MURO', 'XREF PB$0$MUROS', 10, 20, [[41, 2], [42, 2], [50, 90]]),
    }));
    expect(p.stats?.inserts).toBe(1);
    expect(p.entities).toHaveLength(2);
    // (1,0)→(3,0) relativo a la base (1,0): (0,0)→(2,0); ×2 → (0,0)→(4,0); rot 90° → (0,0)→(0,4); + (10,20).
    const [heredada] = lineas(p, 'XREF PB$0$MUROS');
    cerca(heredada.start.x, 10); cerca(heredada.start.y, 20);
    cerca(heredada.end.x, 10); cerca(heredada.end.y, 24);
    // La entidad con capa propia la conserva: (1,0)→(1,1) → (0,0)→(0,2) → rot → (0,0)→(−2,0).
    const [propia] = lineas(p, 'TABIQUES BLINDADOS');
    cerca(propia.end.x, 8); cerca(propia.end.y, 20);
    expect(p.layers.get('XREF PB$0$MUROS')?.entities).toHaveLength(1);
  });

  it('bloques anidados: se componen las dos transformaciones', () => {
    const p = parseDXF(dxf({
      bloques: [
        bloque('HIJO', [0, 0], linea('M', 0, 0, 1, 0)),
        bloque('PADRE', [0, 0], insert('HIJO', '0', 5, 0, [[50, 90]])),
      ].join('\n'),
      entidades: insert('PADRE', 'X', 100, 0, [[41, 10], [42, 10]]),
    }));
    const [l] = lineas(p, 'M');
    // HIJO: (0,0)→(1,0) → rot 90 → (0,0)→(0,1) → +(5,0); PADRE ×10 → (50,0)→(50,10); +(100,0).
    cerca(l.start.x, 150); cerca(l.start.y, 0); cerca(l.end.x, 150); cerca(l.end.y, 10);
    expect(p.stats?.maxDepthReached).toBe(2);
  });

  it('espejo: escala X negativa y extrusión (0,0,−1) del INSERT', () => {
    const p = parseDXF(dxf({
      bloques: bloque('B', [0, 0], linea('M', 1, 0, 2, 0)),
      entidades: [insert('B', 'X', 0, 0, [[41, -1]]), insert('B', 'Y', 10, 0, [[230, -1]])].join('\n'),
    }));
    const [a, b] = lineas(p, 'M');
    cerca(a.start.x, -1); cerca(a.end.x, -2);
    // OCS (0,0,−1): X invertida también en el punto de inserción: (10,0) → (−10,0).
    cerca(b.start.x, -11); cerca(b.end.x, -12);
  });

  it('MINSERT: matriz de columnas y filas', () => {
    const p = parseDXF(dxf({
      bloques: bloque('C', [0, 0], linea('M', 0, 0, 1, 0)),
      entidades: insert('C', 'X', 0, 0, [[70, 3], [71, 2], [44, 5], [45, 7]]),
    }));
    const xs = lineas(p, 'M').map((l) => `${l.start.x},${l.start.y}`).sort();
    expect(xs).toEqual(['0,0', '0,7', '10,0', '10,7', '5,0', '5,7']);
  });

  it('ARC dentro de un bloque rotado y reflejado conserva centro, radio y sentido', () => {
    const arco = pares([0, 'ARC'], [8, 'M'], [10, 1], [20, 0], [40, 1], [50, 0], [51, 90]);
    const p = parseDXF(dxf({ bloques: bloque('A', [0, 0], arco), entidades: insert('A', 'X', 0, 0, [[41, -2], [42, 2]]) }));
    const a = p.entities.find((e) => e.type === 'ARC')!;
    if (a.type !== 'ARC') throw new Error('sin arco');
    cerca(a.center.x, -2); cerca(a.center.y, 0); cerca(a.radius, 2);
    // Reflejado en X: el cuarto de arco 0°→90° queda 90°→180°.
    cerca(a.startAngle, 90); cerca(a.endAngle, 180);
  });

  it('POLYLINE con VERTEX y SEQEND, espacio papel omitido, bloque faltante avisado', () => {
    const poli = [
      pares([0, 'POLYLINE'], [8, 'P'], [66, 1], [70, 1]),
      pares([0, 'VERTEX'], [8, 'P'], [10, 0], [20, 0]),
      pares([0, 'VERTEX'], [8, 'P'], [10, 4], [20, 0]),
      pares([0, 'VERTEX'], [8, 'P'], [10, 4], [20, 3]),
      pares([0, 'SEQEND'], [8, 'P']),
    ].join('\n');
    const p = parseDXF(dxf({ entidades: [poli, linea('PAPEL', 0, 0, 9, 9, [[67, 1]]), insert('NO_EXISTE', 'X', 0, 0), linea('L', 0, 0, 1, 1)].join('\n') }));
    const pl = p.entities.find((e) => e.type === 'LWPOLYLINE')!;
    expect(pl.type === 'LWPOLYLINE' && pl.points.length).toBe(3);
    expect(pl.type === 'LWPOLYLINE' && pl.closed).toBe(true);
    expect(p.entities.some((e) => e.layer === 'PAPEL')).toBe(false);
    expect(p.entities.some((e) => e.layer === 'L')).toBe(true);
    expect(p.warnings?.join(' ')).toMatch(/NO_EXISTE/);
    expect(p.stats?.skippedPaperSpace).toBe(1);
  });

  it('INSERT con ATTRIB: los atributos no rompen la lectura', () => {
    const ent = [
      insert('B', 'X', 1, 1, [[66, 1]]),
      pares([0, 'ATTRIB'], [8, 'X'], [10, 0], [20, 0], [1, 'texto'], [2, 'TAG']),
      pares([0, 'SEQEND'], [8, 'X']),
      linea('DESPUES', 0, 0, 1, 0),
    ].join('\n');
    const p = parseDXF(dxf({ bloques: bloque('B', [0, 0], linea('M', 0, 0, 1, 0)), entidades: ent }));
    expect(lineas(p, 'M')).toHaveLength(1);
    expect(lineas(p, 'DESPUES')).toHaveLength(1);
  });

  it('referencia circular y límite de entidades', () => {
    const p = parseDXF(dxf({ bloques: bloque('R', [0, 0], linea('M', 0, 0, 1, 0) + '\n' + insert('R', '0', 1, 0)), entidades: insert('R', 'X', 0, 0) }));
    expect(lineas(p, 'M')).toHaveLength(1);
    expect(p.warnings?.join(' ')).toMatch(/circular/);
    const q = parseDXF(dxf({ bloques: bloque('C', [0, 0], linea('M', 0, 0, 1, 0)), entidades: insert('C', 'X', 0, 0, [[70, 10], [71, 10], [44, 2], [45, 2]]) }), { maxEntities: 25 });
    expect(q.entities).toHaveLength(25);
    expect(q.stats?.truncated).toBe(true);
  });

  it('explodeInserts: false conserva el comportamiento anterior (sólo espacio modelo)', () => {
    const p = parseDXF(dxf({ bloques: bloque('B', [0, 0], linea('M', 0, 0, 1, 0)), entidades: insert('B', 'X', 0, 0) }), { explodeInserts: false });
    expect(p.entities).toHaveLength(0);
  });

  it('de punta a punta: un XREF ligado con «TABIQUES BLINDADOS» produce barreras de concreto (no de plomo)', () => {
    const muros = [linea('XREF PB HOSPITAL$0$TABIQUES BLINDADOS', 0, 0, 8, 0), linea('XREF PB HOSPITAL$0$TABIQUES BLINDADOS', 8, 0, 8, 6)].join('\n');
    const plomo = linea('XREF 2N HOSPITAL$0$MUROS CON PROTECCION PLOMO', 0, 6, 8, 6);
    const contenido = dxf({ bloques: bloque('XREF PB HOSPITAL', [0, 0], `${muros}\n${plomo}`), entidades: insert('XREF PB HOSPITAL', 'XREF PB HOSPITAL', 100, 50, [[50, 90]]) });
    const { floorPlan, summary } = importDXFToFloorPlan(contenido, 'bind.dxf');
    expect(summary.mappedBarriers).toBe(3);
    const porCapa = (s: string) => floorPlan.barriers.filter((b) => b.name.includes(s));
    expect(porCapa('TABIQUES BLINDADOS').every((b) => b.materialCode === 'concreto')).toBe(true);
    expect(porCapa('PROTECCION PLOMO').every((b) => b.materialCode === 'plomo')).toBe(true);
    // Geometría transformada (rotación 90° + inserción).
    const b0 = porCapa('TABIQUES BLINDADOS')[0];
    cerca(b0.x1, 100); cerca(b0.y1, 50); cerca(b0.x2, 100); cerca(b0.y2, 58);
  });
});
