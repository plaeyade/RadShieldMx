/**
 * Fase 13, paso 1: ángulo de dispersión del paciente (NCRP 151) desde la geometría del gantry.
 *
 * Antes toda barrera secundaria de teleterapia usaba θ = 30° salvo que declarara `scatterAngle_deg` (hallazgo
 * «θ = 30° por omisión» de la auditoría independiente 2026-11: +28 cm en la secundaria norte del caso de prueba).
 * Ahora, con `ejeGantry_deg` en la fuente, θ es el ángulo entre la recta isocentro → punto y el plano de giro del haz,
 * por punto, en el motor de barreras y en el mapa de dosis.
 */
import { describe, expect, it } from 'vitest';
import {
  ANGULO_DISPERSION_OMISION_DEG,
  SEMIANGULO_HAZ_MAX_DEG,
  anguloDispersion,
  anguloDispersionGeometrico,
  calcularBarreraNormativa,
} from '@/lib/normativeBarrierEngine';
import { dosisEnPunto, kermaComponente } from '@/lib/doseFieldEngine';
import { fraccionDispersion } from '@/lib/ncrp151';
import { generateSamplePoints } from '@/lib/shieldingMath';
import { MATERIALS, MODALITIES, type Barrier, type RadiationSource } from '@/types/radshield';

const W3 = { ...MODALITIES.find((m) => m.id === 'linac-6mv')!, doseRateConstant: 3 };
const linac = (extra: Partial<RadiationSource> = {}): RadiationSource => ({
  id: 's6', x: 0, y: 0, name: 'linac 6 MV', modality: W3, workloadValue: 75, workloadUnit: '',
  isocenterHeight_m: 0, useFactor: 0.25, imrtFraction: 0, ...extra,
});
/** Muro secundario paralelo al eje y, a x = 5 m, de y1 a y2 (escala 1 m/px). */
const secundaria = (y1: number, y2: number, extra: Partial<Barrier> = {}): Barrier => ({
  id: 'b', x1: 5, y1, x2: 5, y2, name: 'muro secundario', barrierType: 'secondary', useFactor: 0.25,
  occupancyFactor: 0.025, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235', ...extra,
});
const concreto = (b: Barrier, s: RadiationSource) =>
  calcularBarreraNormativa(b, [s], generateSamplePoints(b, 1, [s]), 1, MATERIALS)!;

describe('Fase 13, paso 1 — θ de dispersión desde el eje del gantry', () => {
  it('geometría: θ = 0° en el plano de giro, 90° sobre el eje y 45° en la bisectriz', () => {
    // Eje del gantry sobre +y: el haz gira en el plano x–z (en planta, la recta y = 0).
    const s = linac({ ejeGantry_deg: 90 });
    expect(anguloDispersionGeometrico(s, { x: 5, y: 0 }, 1)).toBeCloseTo(0, 9);
    expect(anguloDispersionGeometrico(s, { x: 0, y: 5 }, 1)).toBeCloseTo(90, 9);
    expect(anguloDispersionGeometrico(s, { x: -3, y: 3 }, 1)).toBeCloseTo(45, 9);
    expect(anguloDispersionGeometrico(s, { x: 0, y: 0 }, 1)).toBeNull();
    expect(anguloDispersionGeometrico(linac(), { x: 0, y: 5 }, 1)).toBeNull();
  });

  it('prioridad: θ declarado en la barrera > geométrico > 30° por omisión', () => {
    const s = linac({ ejeGantry_deg: 90 });
    expect(anguloDispersion({ scatterAngle_deg: 45 }, s, { x: 0, y: 5 }, 1)).toBe(45);
    expect(anguloDispersion({}, s, { x: 0, y: 5 }, 1)).toBeCloseTo(90, 9);
    expect(anguloDispersion(undefined, linac(), { x: 0, y: 5 }, 1)).toBe(ANGULO_DISPERSION_OMISION_DEG);
    expect(ANGULO_DISPERSION_OMISION_DEG).toBe(30);
  });

  it('sin eje del gantry nada cambia: mismo espesor que con θ = 30° declarado', () => {
    const b = secundaria(-2, 2);
    const omision = concreto(b, linac());
    const declarado = concreto({ ...b, scatterAngle_deg: 30 }, linac());
    expect(omision.espesores_mm.CONCRETE235).toBeCloseTo(declarado.espesores_mm.CONCRETE235, 9);
    expect(omision.notas[0]).toMatch(/30° \(por omisión/);
  });

  it('muro lateral al plano de giro (θ ≈ 90°): menos concreto que con 30°; la traza lo dice', () => {
    // Eje del gantry sobre x: el plano de giro es x = 0 y el muro x = 5 queda lateral (θ ≥ 68°).
    const b = secundaria(-2, 2);
    const geo = concreto(b, linac({ ejeGantry_deg: 0 }));
    const omision = concreto(b, linac());
    expect(geo.espesores_mm.CONCRETE235).toBeLessThan(omision.espesores_mm.CONCRETE235);
    expect(geo.notas[0]).toMatch(/θ de la geometría del gantry \(mínimo 6\d\.\d°/);
    // Con θ declarado de 60° (el tabulado inmediato inferior al mínimo geométrico) da lo mismo: cota conservadora.
    const con60 = concreto({ ...b, scatterAngle_deg: 60 }, linac());
    expect(geo.espesores_mm.CONCRETE235).toBeGreaterThanOrEqual(con60.espesores_mm.CONCRETE235 - 1e-9);
  });

  it('secundaria junto al plano de giro (θ < 30°): más concreto que el 30° por omisión y aviso de haz primario', () => {
    // Eje del gantry sobre +y: el muro x = 5 entre y = 1.5 y 3 m queda a θ ≈ 17–31° del plano de giro.
    const b = secundaria(1.5, 3);
    const s = linac({ ejeGantry_deg: 90 });
    const geo = concreto(b, s);
    const omision = concreto(b, linac());
    expect(geo.espesores_mm.CONCRETE235).toBeGreaterThan(omision.espesores_mm.CONCRETE235);
    expect(fraccionDispersion(6, 20)).toBeGreaterThan(fraccionDispersion(6, 30));
    expect(geo.notas.some((n) => /el haz primario puede alcanzarlos/.test(n))).toBe(false);
    // Más cerca del plano de giro que el semiángulo del campo máximo: se avisa.
    const cerca = concreto(secundaria(0.5, 3), s);
    expect(SEMIANGULO_HAZ_MAX_DEG).toBeCloseTo(15.79, 2);
    expect(cerca.notas.some((n) => /el haz primario puede alcanzarlos; revise si debe ser primaria/.test(n))).toBe(true);
  });

  it('mapa ↔ barrera: el mapa usa el mismo θ (la dispersión del campo cambia igual que la de la barrera)', () => {
    const b = { ...secundaria(-2, 2), thickness_mm: 300 };
    const p = { x: 5.6, y: 0 };
    const conEje = dosisEnPunto([linac({ ejeGantry_deg: 0 })], p.x, p.y, 1, { barriers: [b] });
    const a90 = dosisEnPunto([linac()], p.x, p.y, 1, { barriers: [{ ...b, scatterAngle_deg: 90 }] });
    const a30 = dosisEnPunto([linac()], p.x, p.y, 1, { barriers: [b] });
    expect(kermaComponente(conEje, 'dispersion')).toBeCloseTo(kermaComponente(a90, 'dispersion'), 12);
    expect(kermaComponente(conEje, 'dispersion')).toBeLessThan(kermaComponente(a30, 'dispersion'));
  });
});

describe('Fase 13, paso 1 — clave de caché', () => {
  it('el eje del gantry y θ cambian la clave; sin ellos la clave no cambia', async () => {
    const { buildCalculationCacheKey } = await import('@/lib/calculationCacheKey');
    const plano = (s: RadiationSource, b: Barrier) => ({
      id: 'p', name: 'p', imageUrl: null, scale_m_per_pixel: 1, barriers: [b], sources: [s], occupiedRegions: [],
    }) as unknown as Parameters<typeof buildCalculationCacheKey>[0];
    const base = buildCalculationCacheKey(plano(linac(), secundaria(-2, 2)));
    expect(buildCalculationCacheKey(plano(linac({ ejeGantry_deg: undefined }), secundaria(-2, 2)))).toBe(base);
    expect(buildCalculationCacheKey(plano(linac({ ejeGantry_deg: 0 }), secundaria(-2, 2)))).not.toBe(base);
    expect(buildCalculationCacheKey(plano(linac(), secundaria(-2, 2, { scatterAngle_deg: 45 })))).not.toBe(base);
  });
});
