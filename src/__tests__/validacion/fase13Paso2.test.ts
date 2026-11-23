/**
 * Fase 13, paso 2: U de la barrera primaria por franja del haz y una sola convención del punto protegido.
 *
 * Hallazgos de la auditoría independiente 2026-11 que se resuelven aquí:
 * - U = 1 en las primarias importadas del DXF (la primaria quedaba ×4). Ahora 1/4 por dirección del gantry y, con
 *   `ejeGantry_deg` en la fuente, U = 0 fuera de la franja que barre el haz (el punto se calcula como secundaria).
 * - Distancia: el motor sumaba la altura del isocentro entera como desnivel (punto protegido en el piso) y tomaba la
 *   cara exterior sólo con `thickness_mm`, mientras el mapa usaba también las capas del preset. Ahora el punto
 *   protegido está a 0.3 m de la cara exterior (espesor instalado: capas o espesor capturado) y a la altura ocupada
 *   más cercana a la fuente (0–1.7 m), igual en el motor de barreras, el mapa de dosis y la memoria.
 */
import { describe, expect, it } from 'vitest';
import {
  U_PRIMARIA_OMISION,
  calcularBarreraNormativa,
  distancia,
  enHazPrimario,
  factorUsoPrimaria,
} from '@/lib/normativeBarrierEngine';
import { capasDeBarrera, dosisEnPunto, enHazPrimario as enHazMapa, kermaComponente } from '@/lib/doseFieldEngine';
import {
  ALTURA_OCUPACION_MAX_M,
  SAMPLING_DISTANCE_M,
  desnivelPuntoProtegido_m,
  espesorInstalado_mm,
  generateSamplePoints,
} from '@/lib/shieldingMath';
import { importDXFToFloorPlan } from '@/lib/medical3D/cadBimBridge';
import { calcularProyecto } from '@/lib/motorProyecto';
import { construirMemoria } from '@/lib/memoriaAnalitica';
import { planoEjemploCompleto } from '@/lib/ejemploGuiado';
import { MATERIALS, MODALITIES, type Barrier, type RadiationSource } from '@/types/radshield';

const W3 = { ...MODALITIES.find((m) => m.id === 'linac-6mv')!, doseRateConstant: 3 };
const linac = (extra: Partial<RadiationSource> = {}): RadiationSource => ({
  id: 's6', x: 0, y: 0, name: 'linac 6 MV', modality: W3, workloadValue: 75, workloadUnit: '',
  isocenterHeight_m: 0, useFactor: 0.25, imrtFraction: 0, ...extra,
});
/** Muro paralelo al eje y, a x = 5 m, de y1 a y2 (escala 1 m/px). */
const muro = (y1: number, y2: number, extra: Partial<Barrier> = {}): Barrier => ({
  id: 'b', x1: 5, y1, x2: 5, y2, name: 'muro', barrierType: 'primary', useFactor: 0.25,
  occupancyFactor: 0.025, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235', ...extra,
});
const calcular = (b: Barrier, s: RadiationSource) =>
  calcularBarreraNormativa(b, [s], generateSamplePoints(b, 1, [s]), 1, MATERIALS)!;

describe('Fase 13, paso 2 — punto protegido: 0.3 m de la cara exterior, a la altura ocupada', () => {
  it('desnivel: 0 con la fuente entre el piso y 1.7 m; lo que sobra por encima; |h − z| con altura fija', () => {
    expect(ALTURA_OCUPACION_MAX_M).toBe(1.7);
    expect(desnivelPuntoProtegido_m({ isocenterHeight_m: 0 })).toBe(0);
    expect(desnivelPuntoProtegido_m({ isocenterHeight_m: 1.2 })).toBe(0);
    expect(desnivelPuntoProtegido_m({ isocenterHeight_m: 1.7 })).toBe(0);
    expect(desnivelPuntoProtegido_m({ isocenterHeight_m: 2.5 })).toBeCloseTo(0.8, 12);
    expect(desnivelPuntoProtegido_m({ isocenterHeight_m: -0.5 })).toBeCloseTo(0.5, 12);
    expect(desnivelPuntoProtegido_m({ isocenterHeight_m: 1.3, alturaPuntoProtegido_m: 0 })).toBeCloseTo(1.3, 12);
    expect(desnivelPuntoProtegido_m({ isocenterHeight_m: 1.3, alturaPuntoProtegido_m: 2.75 })).toBeCloseTo(1.45, 12);
  });

  it('NCRP 151 §7.1: con el isocentro a 1.3 m la distancia es la de planta (antes √(d² + 1.3²))', () => {
    const s = linac({ isocenterHeight_m: 1.3 });
    expect(distancia(s, { x: 7.2, y: 0 }, 1)).toBeCloseTo(7.2, 12);
    // El cálculo por barrera da lo mismo con el isocentro a 0 o a 1.3 m (antes, menos espesor con 1.3 m).
    const b = muro(-2, 2);
    expect(calcular(b, s).espesores_mm.CONCRETE235).toBeCloseTo(calcular(b, linac()).espesores_mm.CONCRETE235, 9);
  });

  it('cara exterior con el espesor instalado: capas del preset o espesor capturado, como la banda del mapa', () => {
    const conCapas = muro(-2, 2, { shieldingLayers: [{ materialCode: 'CONCRETE235', thickness_mm: 1000 }, { materialCode: 'PB', thickness_mm: 20 }] });
    expect(espesorInstalado_mm(conCapas)).toBe(1020);
    expect(capasDeBarrera(conCapas).reduce((a, c) => a + c.thickness_mm, 0)).toBe(1020);
    const s = linac();
    const [p] = generateSamplePoints(conCapas, 1, [s]);
    // Línea dibujada en x = 5 (cara interior); fuente en x = 0: el punto queda en x = 5 + 1.02 + 0.3.
    expect(p.x).toBeCloseTo(5 + 1.02 + SAMPLING_DISTANCE_M, 9);
    const [q] = generateSamplePoints(muro(-2, 2, { thickness_mm: 500 }), 1, [s]);
    expect(q.x).toBeCloseTo(5 + 0.5 + SAMPLING_DISTANCE_M, 9);
    const [r] = generateSamplePoints(muro(-2, 2), 1, [s]);
    expect(r.x).toBeCloseTo(5 + SAMPLING_DISTANCE_M, 9);
  });

  it('mapa ↔ barrera: el kerma primario sin blindaje del mapa en los puntos protegidos es el de la barrera', () => {
    const s = linac({ isocenterHeight_m: 1.25 });
    const b = muro(-2, 2);
    const puntos = generateSamplePoints(b, 1, [s]);
    const motor = calcular(b, s).kermaMax_mSv_semana;
    const mapa = Math.max(...puntos.map((p) => kermaComponente(dosisEnPunto([s], p.x, p.y, 1, { barriers: [b] }), 'primaria')));
    expect(mapa).toBeCloseTo(motor, 12);
  });

  it('memoria: el criterio del punto y el de U describen la misma convención', () => {
    const m = construirMemoria(planoEjemploCompleto(), {}, { fecha: new Date('2026-11-22T00:00:00Z') });
    const punto = m.criterios.find((c) => c.id === 'punto')!.texto;
    expect(punto).toMatch(/0\.3 m de la cara exterior/);
    expect(punto).toMatch(/altura ocupada más cercana a la fuente, entre el piso y 1\.7 m/);
    expect(m.criterios.find((c) => c.id === 'U')!.texto).toMatch(/por omisión 0\.25.*franja/);
  });
});

describe('Fase 13, paso 2 — U de la primaria según la franja del haz', () => {
  it('factorUsoPrimaria: 0 fuera de la franja; dentro, el de la barrera, el de la fuente o 1/4', () => {
    const s = linac({ ejeGantry_deg: 90, useFactor: 0.4 }); // haz que gira en el plano x–z: franja a lo largo de y = 0
    expect(enHazPrimario(s, 5, 0, 1)).toBe(true);
    expect(enHazPrimario(s, 1, 5, 1)).toBe(false);
    expect(enHazMapa).toBe(enHazPrimario);
    expect(factorUsoPrimaria({ useFactor: 0.5 }, s, { x: 1, y: 5 }, 1)).toBe(0);
    expect(factorUsoPrimaria({ useFactor: 0.5 }, s, { x: 5, y: 0 }, 1)).toBe(0.5);
    expect(factorUsoPrimaria({ useFactor: 1.5 }, s, { x: 5, y: 0 }, 1)).toBe(U_PRIMARIA_OMISION);
    expect(factorUsoPrimaria(undefined, s, { x: 5, y: 0 }, 1)).toBe(0.4);
    expect(factorUsoPrimaria(undefined, linac({ useFactor: 0 }), { x: 5, y: 0 }, 1)).toBe(U_PRIMARIA_OMISION);
    expect(U_PRIMARIA_OMISION).toBe(0.25);
  });

  it('primaria dentro de la franja: el mismo espesor con o sin eje del gantry', () => {
    const b = muro(-1, 1);
    const conEje = calcular(b, linac({ ejeGantry_deg: 90 }));
    expect(conEje.espesores_mm.CONCRETE235).toBeCloseTo(calcular(b, linac()).espesores_mm.CONCRETE235, 9);
    expect(conEje.notas.some((n) => /U = 0\.25 en la franja del haz/.test(n))).toBe(true);
  });

  it('primaria fuera de la franja: se calcula como secundaria (mucho menos concreto) y la traza lo dice', () => {
    // Eje del gantry sobre x: el haz gira en el plano y–z; el muro x = 5 queda fuera de la franja.
    const b = muro(-1, 1);
    const s = linac({ ejeGantry_deg: 0 });
    const fuera = calcular(b, s);
    const sinEje = calcular(b, linac());
    const comoSecundaria = calcular({ ...b, barrierType: 'secondary' }, s);
    expect(fuera.espesores_mm.CONCRETE235).toBeLessThan(sinEje.espesores_mm.CONCRETE235 * 0.8);
    expect(fuera.espesores_mm.CONCRETE235).toBeCloseTo(comoSecundaria.espesores_mm.CONCRETE235, 9);
    expect(fuera.notas.some((n) => /queda fuera de la franja del haz: se calcula como secundaria/.test(n))).toBe(true);
  });

  it('primaria que sale de la franja: los puntos de fuera no piden más que los de dentro', () => {
    const s = linac({ ejeGantry_deg: 90 });
    const corta = calcular(muro(-1, 1), s).espesores_mm.CONCRETE235;
    const larga = calcular(muro(-1, 6), s).espesores_mm.CONCRETE235;
    expect(larga).toBeCloseTo(corta, 9);
  });

  it('mapa: fuera de la franja no hay primaria; dentro, K₀ con el U de la barrera primaria', () => {
    const s = linac({ ejeGantry_deg: 90 });
    const b = muro(-1, 6, { useFactor: 0.5 });
    expect(kermaComponente(dosisEnPunto([s], 5.3, 5, 1, { barriers: [b] }), 'primaria')).toBe(0);
    const dentro = kermaComponente(dosisEnPunto([s], 5.3, 0, 1, { barriers: [b] }), 'primaria');
    const conU25 = kermaComponente(dosisEnPunto([s], 5.3, 0, 1, { barriers: [{ ...b, useFactor: 0.25 }] }), 'primaria');
    expect(dentro / conU25).toBeCloseTo(2, 12);
  });

  it('U = 1 en una primaria de teleterapia: aviso en la traza (posible valor de importación)', () => {
    const r = calcular(muro(-1, 1, { useFactor: 1 }), linac());
    expect(r.notas.some((n) => /U = 1 en una primaria de teleterapia/.test(n))).toBe(true);
    expect(calcular(muro(-1, 1), linac()).notas.some((n) => /U = 1 en una primaria/.test(n))).toBe(false);
  });

  it('importación DXF: las primarias llegan con U = 1/4 (antes U = 1)', () => {
    const dxf = ['0', 'SECTION', '2', 'ENTITIES',
      '0', 'LINE', '8', 'MURO_PRIMARIA', '10', '0', '20', '0', '11', '500', '21', '0',
      '0', 'LINE', '8', 'MURO_SECUNDARIA', '10', '0', '20', '0', '11', '0', '21', '400',
      '0', 'ENDSEC', '0', 'EOF'].join('\n');
    const { floorPlan } = importDXFToFloorPlan(dxf, 'sintetico.dxf');
    const primarias = floorPlan.barriers.filter((b) => b.barrierType === 'primary');
    expect(primarias.length).toBeGreaterThan(0);
    expect(primarias.every((b) => b.useFactor === U_PRIMARIA_OMISION)).toBe(true);
    expect(floorPlan.barriers.every((b) => b.useFactor !== 1)).toBe(true);
  });
});

describe('Fase 13, paso 2 — «Guíame» sin cambio', () => {
  it('muro norte de captación: 17.96 mm Pb / 213.77 mm de concreto', () => {
    const r = calcularProyecto(planoEjemploCompleto());
    const norte = r.barriers.find((b) => b.id === 'eg-captacion-norte')!;
    const req = norte.requiredThickness_mm as Record<string, number>;
    expect(req.PB).toBeCloseTo(17.96, 2);
    expect(req.CONCRETE235).toBeCloseTo(213.77, 2);
  });
});
