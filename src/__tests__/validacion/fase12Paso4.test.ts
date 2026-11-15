/**
 * Fase 12, paso 4: asistente de capas DWG/DXF (material y espesor por capa, ignorar, mapeo reutilizable en el almacén
 * del proyecto) y vista del lienzo (zoom a extensión, zoom centrado en el cursor, límites). Sólo DXF sintéticos.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { parseDXF } from '@/lib/dxfParser';
import { importParsedDXFToFloorPlan } from '@/lib/medical3D/cadBimBridge';
import {
  editarFila, leerEspesor, mapeoDesdeFilas, opcionesImportacion, proponerCapas, restablecerFila, resumenCapas,
} from '@/lib/asistenteCapas';
import { encuadrar, extensionPlano, factorRueda, limitesZoom, zoomEnPunto } from '@/lib/vistaLienzo';
import { useProyectoStore, PLANO_PREDETERMINADO } from '@/stores/proyecto';
import { dxfCapasSinteticas } from '@/test/dxfCapasSinteticas';

const plano = () => parseDXF(dxfCapasSinteticas());
const fila = (filas: ReturnType<typeof proponerCapas>, nombre: string) => filas.find((f) => f.nombre === nombre)!;

describe('asistente de capas: propuesta por reglas', () => {
  it('lista las capas con su conteo de entidades (bloques INSERT explotados incluidos)', () => {
    const filas = proponerCapas(plano());
    const nombres = filas.map((f) => f.nombre);
    for (const c of ['MURO_CONCRETO_200MM', 'MURO_PLOMO_2MM', 'PUERTA_PB1.5MM', 'VENTANA_VIDRIO_PLOMADO', 'XREF PB HOSPITAL$0$TABIQUE', 'COTAS', 'TEXTOS', 'MOBILIARIO']) {
      expect(nombres).toContain(c);
    }
    expect(fila(filas, 'MURO_PLOMO_2MM')).toMatchObject({ entidades: 2, lineales: 2 });
    expect(fila(filas, 'TEXTOS')).toMatchObject({ entidades: 2, lineales: 0, porTipo: { TEXT: 2 } });
    // 1 CIRCLE + 2 sillas de 4 LINE cada una.
    expect(fila(filas, 'MOBILIARIO').porTipo).toEqual({ CIRCLE: 1, LINE: 8 });
  });

  it('propone rol, material y espesor con las reglas de #61', () => {
    const filas = proponerCapas(plano());
    expect(fila(filas, 'MURO_CONCRETO_200MM')).toMatchObject({ rol: 'barrier', material: 'concreto', espesor_mm: 200, origen: 'regla', regla: 'concreto' });
    expect(fila(filas, 'MURO_PLOMO_2MM')).toMatchObject({ rol: 'barrier', material: 'plomo', espesor_mm: 2, regla: 'plomo' });
    expect(fila(filas, 'PUERTA_PB1.5MM')).toMatchObject({ rol: 'barrier', material: 'plomo', espesor_mm: 1.5, regla: 'pb-espesor' });
    // Sin palabra de muro en el nombre, pero con material de blindaje declarado: se propone como muro.
    expect(fila(filas, 'VENTANA_VIDRIO_PLOMADO')).toMatchObject({ rol: 'barrier', material: 'vidrio_plomo', regla: 'vidrio-plomado', espesor_mm: null });
    // «XREF PB …» es planta baja, no plomo: el material sale del nombre local («TABIQUE» → concreto).
    expect(fila(filas, 'XREF PB HOSPITAL$0$TABIQUE')).toMatchObject({ rol: 'barrier', material: 'concreto', regla: 'concreto' });
    expect(fila(filas, 'COTAS').rol).toBe('dimension');
    expect(fila(filas, 'TEXTOS').rol).toBe('text');
    expect(fila(filas, 'MOBILIARIO')).toMatchObject({ rol: 'unmapped', origen: 'omision' });
  });
});

describe('asistente de capas: edición y opciones del importador', () => {
  it('material, espesor e «ignorar capa» llegan a las barreras importadas', () => {
    const p = plano();
    let filas = proponerCapas(p);
    filas = editarFila(filas, 'MURO_CONCRETO_200MM', { material: 'concreto_baritado', espesor_mm: 250 });
    filas = editarFila(filas, 'XREF PB HOSPITAL$0$TABIQUE', { ignorada: true });
    filas = editarFila(filas, 'VENTANA_VIDRIO_PLOMADO', { espesor_mm: 12 });
    expect(fila(filas, 'MURO_CONCRETO_200MM').origen).toBe('usuario');
    const r = importParsedDXFToFloorPlan(p, 'sintetico.dxf', opcionesImportacion(filas));
    const deCapa = (c: string) => r.floorPlan.barriers.filter((b) => b.name.includes(`(${c})`));
    expect(deCapa('MURO_CONCRETO_200MM')).toHaveLength(4);
    for (const b of deCapa('MURO_CONCRETO_200MM')) expect(b).toMatchObject({ materialCode: 'concreto_baritado', thickness_mm: 250, requiredThickness_mm: 250 });
    expect(deCapa('XREF PB HOSPITAL$0$TABIQUE')).toHaveLength(0);
    expect(deCapa('VENTANA_VIDRIO_PLOMADO')[0]).toMatchObject({ materialCode: 'vidrio_plomo', thickness_mm: 12 });
    expect(deCapa('MURO_PLOMO_2MM')[0]).toMatchObject({ materialCode: 'plomo', thickness_mm: 2 });
    // 4 (concreto) + 2 (plomo) + 1 (puerta) + 1 (ventana); el tabique ignorado no entra.
    expect(r.floorPlan.barriers).toHaveLength(8);
  });

  it('espesor vacío quita el declarado por la capa (la barrera queda por calcular)', () => {
    const p = plano();
    const filas = editarFila(proponerCapas(p), 'MURO_PLOMO_2MM', { espesor_mm: null });
    const r = importParsedDXFToFloorPlan(p, 's.dxf', opcionesImportacion(filas));
    const b = r.floorPlan.barriers.find((x) => x.name.includes('(MURO_PLOMO_2MM)'))!;
    expect(b.thickness_mm).toBeUndefined();
    expect(b.requiredThickness_mm).toBe(3);
  });

  it('cambiar el rol de una capa sin rol a Muro la importa; restablecer vuelve a la regla', () => {
    const p = plano();
    let filas = editarFila(proponerCapas(p), 'MOBILIARIO', { rol: 'barrier', material: 'acero' });
    expect(opcionesImportacion(filas).layerRoleOverrides.MOBILIARIO).toBe('barrier');
    expect(resumenCapas(filas).muros).toBe(6);
    filas = restablecerFila(filas, 'MOBILIARIO');
    expect(fila(filas, 'MOBILIARIO')).toMatchObject({ rol: 'unmapped', material: 'concreto', origen: 'omision' });
  });

  it('el mapeo guardado se reutiliza por nombre de capa en otro plano', () => {
    const p = plano();
    const filas = editarFila(proponerCapas(p), 'MURO_PLOMO_2MM', { espesor_mm: 3, material: 'plomo' });
    const m = mapeoDesdeFilas('a.dxf', editarFila(filas, 'COTAS', { ignorada: true }), new Date('2026-11-15T00:00:00Z'));
    const otra = proponerCapas(p, [m]);
    expect(fila(otra, 'MURO_PLOMO_2MM')).toMatchObject({ espesor_mm: 3, origen: 'guardado' });
    expect(fila(otra, 'COTAS')).toMatchObject({ ignorada: true, origen: 'guardado' });
  });

  it('leerEspesor acepta coma decimal y descarta vacío/cero', () => {
    expect(leerEspesor('1,5')).toBe(1.5);
    expect(leerEspesor('')).toBeNull();
    expect(leerEspesor('0')).toBeNull();
    expect(leerEspesor('abc')).toBeNull();
  });
});

describe('almacén único: mapeos de capas', () => {
  beforeEach(() => useProyectoStore.setState({ mapeosCapas: [] }));

  it('guarda por archivo (el más reciente primero, sin duplicados) y propone también el del plano abierto', () => {
    const p = plano();
    const s = useProyectoStore.getState();
    s.guardarMapeoCapas(mapeoDesdeFilas('a.dxf', proponerCapas(p)));
    s.guardarMapeoCapas(mapeoDesdeFilas('b.dxf', proponerCapas(p)));
    s.guardarMapeoCapas(mapeoDesdeFilas('a.dxf', proponerCapas(p)));
    expect(useProyectoStore.getState().mapeosCapas.map((m) => m.archivo)).toEqual(['a.dxf', 'b.dxf']);
    const delPlano = mapeoDesdeFilas('abierto.dxf', proponerCapas(p));
    useProyectoStore.getState().reset({ ...PLANO_PREDETERMINADO, importMetadata: { source: 'dxf', mapeoCapas: delPlano } });
    expect(useProyectoStore.getState().mapeosParaProponer().map((m) => m.archivo)).toEqual(['a.dxf', 'b.dxf', 'abierto.dxf']);
    useProyectoStore.getState().borrarMapeoCapas('mapeo-b.dxf');
    expect(useProyectoStore.getState().mapeosCapas).toHaveLength(1);
    useProyectoStore.getState().reset();
  });
});

describe('vista del lienzo: extensión, zoom en el cursor y límites', () => {
  const p = plano();
  const plan = importParsedDXFToFloorPlan(p, 's.dxf').floorPlan;

  it('el zoom a extensión encuadra un DXF en mm lejos del origen (antes la escala se acotaba a 0.1 y no cabía)', () => {
    const caja = extensionPlano(plan)!;
    expect(caja.minX).toBeGreaterThan(200000);
    const v = encuadrar(caja, 800, 600, 40);
    expect(v.scale).toBeLessThan(0.1);
    // Las cuatro esquinas quedan dentro del lienzo con el margen.
    for (const [x, y] of [[caja.minX, caja.minY], [caja.maxX, caja.maxY]]) {
      const sx = x * v.scale + v.offsetX, sy = y * v.scale + v.offsetY;
      expect(sx).toBeGreaterThanOrEqual(39.9); expect(sx).toBeLessThanOrEqual(760.1);
      expect(sy).toBeGreaterThanOrEqual(39.9); expect(sy).toBeLessThanOrEqual(560.1);
    }
    const l = limitesZoom(plan.scale_m_per_pixel, v.scale);
    expect(l.min).toBeLessThanOrEqual(v.scale);
    expect(l.max).toBeGreaterThan(v.scale);
  });

  it('límites por defecto (1 cm/px): los históricos 0.1 … 10', () => {
    const l = limitesZoom(0.01);
    expect(l.min).toBeCloseTo(0.1, 12);
    expect(l.max).toBeCloseTo(10, 12);
  });

  it('el punto bajo el cursor no se mueve al hacer zoom; en el límite la vista no cambia', () => {
    const v0 = { scale: 1, offsetX: 30, offsetY: -20 };
    const l = { min: 0.1, max: 10 };
    const mundo = { x: (400 - v0.offsetX) / v0.scale, y: (250 - v0.offsetY) / v0.scale };
    const v1 = zoomEnPunto(v0, 400, 250, 1.7, l);
    expect(mundo.x * v1.scale + v1.offsetX).toBeCloseTo(400, 9);
    expect(mundo.y * v1.scale + v1.offsetY).toBeCloseTo(250, 9);
    const tope = zoomEnPunto({ ...v0, scale: 10 }, 400, 250, 2, l);
    expect(tope).toEqual({ ...v0, scale: 10 });
    expect(zoomEnPunto(v0, 0, 0, 1000, l).scale).toBe(10);
  });

  it('factor de rueda: proporcional, simétrico y acotado', () => {
    expect(factorRueda(-100)).toBeGreaterThan(1);
    expect(factorRueda(100) * factorRueda(-100)).toBeCloseTo(1, 12);
    expect(factorRueda(-100000)).toBe(2);
    expect(factorRueda(3, 1)).toBeCloseTo(factorRueda(48), 12);
    expect(factorRueda(0)).toBe(1);
  });
});
