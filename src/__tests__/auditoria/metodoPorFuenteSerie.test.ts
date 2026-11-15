/**
 * Hallazgos 3 y 4 (auditoría independiente 2026-11): método por fuente (no `sources[0]`) y muros en serie (laberinto).
 * Geometría sintética: escala 0.01 m/px, fuente en (0, 0), muros perpendiculares al eje x.
 */
import { describe, expect, it } from 'vitest';
import {
  agruparFuentesPorMetodo, barrerasEntre, calcularProyecto, claveMetodoFuente, dosisRelativaCurva, resolverCombinado,
} from '@/lib/motorProyecto';
import { planoEjemploCompleto } from '@/lib/ejemploGuiado';
import { MODALITIES, type Barrier, type FloorPlan, type RadiationSource } from '@/types/radshield';

const modalidad = (id: string) => MODALITIES.find((m) => m.id === id)!;
const plano = (barriers: Barrier[], sources: RadiationSource[]): FloorPlan => ({
  id: 'p', name: 'p', imageUrl: null, width_pixels: 20000, height_pixels: 20000, scale_m_per_pixel: 0.01,
  barriers, sources, regions: [], criticalPoints: [],
} as unknown as FloorPlan);
const muro = (id: string, d_m: number, extra: Partial<Barrier> = {}): Barrier => ({
  id, name: id, x1: d_m * 100, y1: -150, x2: d_m * 100, y2: 150, barrierType: 'secondary', useFactor: 1,
  occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235', ...extra,
} as Barrier);
const linac = (x = 0, y = 0): RadiationSource => ({
  id: `l18-${x}-${y}`, x, y, name: '18 MV', modality: modalidad('linac-18mv'), workloadValue: 225, workloadUnit: 'fracciones/semana',
  isocenterHeight_m: 0, useFactor: 0.25, imrtFraction: 0, imrtFactor: 5,
} as RadiationSource);
const pet = (x: number, y: number): RadiationSource => ({
  id: `pet-${x}-${y}`, x, y, name: 'F-18', modality: modalidad('pet-f18'), workloadValue: 555, workloadUnit: 'MBq', isocenterHeight_m: 0, useFactor: 1,
  tg108: { A0_MBq: 555, pacientesSemana: 40, tU_h: 1, tI_h: 0.5, sala: 'captacion' },
} as RadiationSource);
const ciclotron = (x: number, y: number): RadiationSource => ({
  id: `cy-${x}`, x, y, name: 'Ciclotrón', modality: modalidad('cyclotron-16mev'), workloadValue: 1, workloadUnit: 'h', isocenterHeight_m: 0, useFactor: 1,
} as RadiationSource);
const req = (b: Barrier) => b.requiredThickness_mm as Record<string, number>;

describe('método por fuente', () => {
  it('claves de método y agrupación', () => {
    expect(claveMetodoFuente(linac())).toBe('teleterapia-mv');
    expect(claveMetodoFuente(pet(0, 0))).toBe('nuclear-511keV');
    expect(claveMetodoFuente(ciclotron(0, 0))).toBe('ciclotron');
    const g = agruparFuentesPorMetodo([pet(0, 0), linac(), pet(1, 1)]);
    expect(g.map((x) => x.clave)).toEqual(['nuclear-511keV', 'teleterapia-mv']);
    expect(g[0].fuentes).toHaveLength(2);
  });

  it('un paciente PET lejano como primera fuente ya no cambia la primaria del linac a TG-108', () => {
    const b = muro('prim', 6.9, { barrierType: 'primary', useFactor: 0.25, occupancyFactor: 0.025 });
    const solo = calcularProyecto(plano([b], [linac()])).barriers[0];
    const mixto = calcularProyecto(plano([b], [pet(-6000, 0), linac()])).barriers[0];
    expect(solo.calculationTrace?.standard).toBe('NCRP151');
    expect(mixto.calculationTrace?.formulaId).toBe('COMBINACION_POR_FUENTE');
    expect(mixto.calculationTrace?.standard).toMatch(/NCRP151/);
    // Paciente a 60 m: contribución despreciable → el mismo espesor del linac (±0.5 mm).
    expect(Math.abs(req(mixto).CONCRETE235 - req(solo).CONCRETE235)).toBeLessThan(0.5);
    expect(req(mixto).CONCRETE235).toBeGreaterThan(1400);
  });

  it('un ciclotrón primero no deja sin espesor a las demás fuentes (y avisa)', () => {
    const b = muro('m', 2);
    const r = calcularProyecto(plano([b], [ciclotron(-3000, 0), pet(0, 0)])).barriers[0];
    const soloPet = calcularProyecto(plano([b], [pet(0, 0)])).barriers[0];
    expect(req(r).PB).toBeCloseTo(req(soloPet).PB, 9);
    expect(r.calculationWarnings?.some((w) => /ciclotr/i.test(w.message))).toBe(true);
    // Sólo ciclotrón: sin espesor, como antes (por diseño).
    expect(Object.keys(req(calcularProyecto(plano([b], [ciclotron(0, 0)])).barriers[0]))).toHaveLength(0);
  });

  it('dos métodos comparables se combinan: más que cada uno, menos que el mayor más 1 TVL', () => {
    const b = muro('m', 3, { occupancyFactor: 1 });
    // PET a 3 m y linac (fuga/dispersión) a 3 m.
    const a = req(calcularProyecto(plano([b], [pet(0, 0)])).barriers[0]).PB;
    const l = req(calcularProyecto(plano([b], [linac()])).barriers[0]).PB;
    const c = req(calcularProyecto(plano([b], [pet(0, 0), linac()])).barriers[0]).PB;
    expect(c).toBeGreaterThanOrEqual(Math.max(a, l) - 1e-9);
    expect(c).toBeLessThan(Math.max(a, l) + 60);
  });

  it('curva de dosis relativa y resolución combinada', () => {
    const t = [100, 200, 300, 400]; // TVL de 100 mm
    expect(dosisRelativaCurva(t, 100)).toBeCloseTo(1, 12);
    expect(dosisRelativaCurva(t, 250)).toBeCloseTo(10 ** -1.5, 12);
    expect(dosisRelativaCurva(t, 500)).toBeCloseTo(1e-4, 12);
    expect(dosisRelativaCurva(t, 0)).toBeCloseTo(10, 12);
    // Dos contribuciones iguales: + log10(2)·TVL = 30.1 mm.
    expect(resolverCombinado([{ t, credito: 0 }, { t, credito: 0 }])).toBeCloseTo(100 + 100 * Math.log10(2), 6);
    // Con crédito de 40 mm en una sola contribución.
    expect(resolverCombinado([{ t, credito: 40 }])).toBeCloseTo(60, 6);
    // Kerma ya por debajo de P/100: dosis acotada por 10^-2 en 0.
    expect(dosisRelativaCurva([0, 0, 0, 80], 0)).toBeCloseTo(1e-2, 12);
    expect(resolverCombinado([{ t: [0, 0, 0, 0], credito: 0 }])).toBe(0);
  });
});

describe('muros en serie (laberinto)', () => {
  it('barrerasEntre detecta el muro interior entre la fuente y el punto del exterior', () => {
    const interior = muro('int', 2);
    const exterior = muro('ext', 3.5);
    expect(barrerasEntre(exterior, [interior, exterior], { x: 0, y: 0 }, { x: 380, y: 0 }).map((b) => b.id)).toEqual(['int']);
    expect(barrerasEntre(interior, [interior, exterior], { x: 0, y: 0 }, { x: 230, y: 0 })).toHaveLength(0);
  });

  it('el muro exterior pide el total menos el interior: la suma de los dos ya no es el doble', () => {
    const interior = muro('int', 2, { occupancyFactor: 1 / 8 });
    const exterior = muro('ext', 3.5);
    const sinSerie = calcularProyecto(plano([interior, exterior], [pet(0, 0)]), undefined, { murosEnSerie: false }).barriers;
    const conSerie = calcularProyecto(plano([interior, exterior], [pet(0, 0)])).barriers;
    const tIntSolo = req(sinSerie[0]).CONCRETE235;
    const tExtSolo = req(sinSerie[1]).CONCRETE235;
    expect(req(conSerie[0]).CONCRETE235).toBeCloseTo(tIntSolo, 9); // el interior no cambia
    expect(req(conSerie[1]).CONCRETE235).toBeCloseTo(Math.max(0, tExtSolo - tIntSolo), 6);
    expect(req(conSerie[0]).CONCRETE235 + req(conSerie[1]).CONCRETE235).toBeCloseTo(Math.max(tExtSolo, tIntSolo), 6);
    expect(conSerie[1].calculationTrace?.assumptions.join(' ')).toMatch(/Muros en serie/);
  });

  it('el espesor instalado del interior (otro material) se convierte por la razón de espesores del grupo', () => {
    const interior = muro('int', 2, { materialCode: 'PB', thickness_mm: 6 });
    const exterior = muro('ext', 3.5);
    const sinSerie = calcularProyecto(plano([interior, exterior], [pet(0, 0)]), undefined, { murosEnSerie: false }).barriers[1];
    const conSerie = calcularProyecto(plano([interior, exterior], [pet(0, 0)])).barriers[1];
    const t = req(sinSerie);
    expect(req(conSerie).CONCRETE235).toBeCloseTo(t.CONCRETE235 - 6 * (t.CONCRETE235 / t.PB), 6);
    expect(req(conSerie).PB).toBeCloseTo(t.PB - 6, 6);
  });

  it('un muro que tapa sólo parte de la barrera no da crédito', () => {
    const interior: Barrier = { ...muro('int', 2), y1: -20, y2: 20 };
    const exterior = muro('ext', 3.5);
    const a = calcularProyecto(plano([interior, exterior], [pet(0, 0)])).barriers[1];
    const b = calcularProyecto(plano([interior, exterior], [pet(0, 0)]), undefined, { murosEnSerie: false }).barriers[1];
    expect(req(a)).toEqual(req(b));
  });

  it('con dos fuentes del mismo método, sólo hay crédito si el muro tapa los rayos de las dos', () => {
    const interior = muro('int', 2);
    const exterior = muro('ext', 3.5);
    // Segunda fuente entre los dos muros: su rayo no cruza el interior.
    const r = calcularProyecto(plano([interior, exterior], [pet(0, 0), pet(280, 0)])).barriers[1];
    const s = calcularProyecto(plano([interior, exterior], [pet(0, 0), pet(280, 0)]), undefined, { murosEnSerie: false }).barriers[1];
    expect(req(r)).toEqual(req(s));
  });

  it('«Guíame»: método por fuente y muros en serie no cambian nada (control 17.96 mm Pb / 213.77 mm)', () => {
    const ej = planoEjemploCompleto();
    const a = calcularProyecto(ej).barriers;
    const b = calcularProyecto(ej, undefined, { murosEnSerie: false }).barriers;
    expect(a.map((x) => x.requiredThickness_mm)).toEqual(b.map((x) => x.requiredThickness_mm));
    const norte = req(a.find((x) => x.id === 'eg-captacion-norte')!);
    expect(norte.PB).toBeCloseTo(17.96, 2);
    expect(norte.CONCRETE235).toBeCloseTo(213.77, 2);
  });
});
