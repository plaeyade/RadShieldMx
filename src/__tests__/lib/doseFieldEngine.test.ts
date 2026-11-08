import { describe, expect, it } from 'vitest';
import {
  ANGULO_MAX_OBLICUIDAD_DEG,
  calcularMallaDosis,
  capasDeBarrera,
  cruceSegmentoBarrera,
  dosisEnPunto,
  kermaEnPunto,
} from '@/lib/doseFieldEngine';
import { calculateHeatmapGrid, calculateUnshieldedKerma, tvlTransmission } from '@/lib/shieldingMath';
import { TABLA_B_2, TABLA_B_7, espesorTVL, transmisionTVL } from '@/lib/ncrp151';
import { TABLA_C_1, transmisionArcher } from '@/lib/ncrp147';
import { MATERIALS, MODALITIES, type Barrier, type RadiationSource } from '@/types/radshield';

const fuente = (id: string, extra: Partial<RadiationSource> = {}): RadiationSource => ({
  id: `s-${id}`, x: 0, y: 0, name: id, modality: MODALITIES.find((m) => m.id === id)!,
  workloadValue: 100, workloadUnit: '', isocenterHeight_m: 0, useFactor: 1, ...extra,
});
const barrera = (extra: Partial<Barrier> = {}): Barrier => ({
  id: 'b', x1: 3, y1: -5, x2: 3, y2: 5, name: 'muro', barrierType: 'primary',
  useFactor: 1, occupancyFactor: 1, designGoal_mSv_per_wk: 0.1, materialCode: 'CONCRETE235', ...extra,
});
const material = (code: string) => MATERIALS.find((m) => m.code === code)!;

describe('doseFieldEngine — sin barreras', () => {
  it('coincide con calculateUnshieldedKerma (shieldingMath) en un punto', () => {
    const s = fuente('linac-6mv');
    expect(kermaEnPunto([s], 4, 1, 1)).toBe(calculateUnshieldedKerma(s, 4, 1, 1));
  });

  it('cumple el inverso del cuadrado', () => {
    const s = fuente('pet-f18', { nuclearActivity_GBq: 0.5 });
    const k1 = kermaEnPunto([s], 2, 0, 1);
    const k2 = kermaEnPunto([s], 4, 0, 1);
    expect(k1 / k2).toBeCloseTo(4, 10);
  });

  it('la malla es idéntica a calculateHeatmapGrid', () => {
    const fuentes = [fuente('linac-6mv', { x: 100, y: 120 }), fuente('rad-chest', { x: 300, y: 80 })];
    const motor = calcularMallaDosis(fuentes, 0.01, 40);
    const previa = calculateHeatmapGrid(fuentes, 0.01, 40);
    expect(motor.length).toBe(previa.length);
    motor.forEach((p, i) => {
      expect(p.x).toBe(previa[i].x);
      expect(p.y).toBe(previa[i].y);
      expect(p.kerma).toBe(previa[i].kerma);
      expect(p.kermaSinBlindaje).toBe(previa[i].kerma);
    });
  });
});

describe('doseFieldEngine — barreras', () => {
  it('una barrera primaria de concreto con t = espesorTVL(10⁻³) da B = 10⁻³ (NCRP 151 TVL₁/TVLₑ)', () => {
    const s = fuente('linac-18mv');
    const t_mm = espesorTVL(1e-3, TABLA_B_2.concrete['18']) * 10;
    const b = barrera({ thickness_mm: t_mm });
    const d = dosisEnPunto([s], 6, 0, 1, { barriers: [b] });
    expect(d.porFuente[0].transmision).toBeCloseTo(1e-3, 12);
    expect(d.kerma_mSv_semana).toBeCloseTo(d.kermaSinBlindaje_mSv_semana * 1e-3, 12);
    expect(d.porFuente[0].cruces[0].capas[0].metodo).toBe('NCRP151_TVL1_TVLe');
  });

  it('con n < 1 usa sólo TVL₁ (inversa de la Ec. 2.3)', () => {
    const tvl = TABLA_B_2.concrete['6'];
    expect(transmisionTVL(espesorTVL(0.5, tvl), tvl)).toBeCloseTo(0.5, 12);
    expect(transmisionTVL(espesorTVL(1e-4, tvl), tvl)).toBeCloseTo(1e-4, 14);
  });

  it('barrera secundaria de concreto con LINAC usa TVL de fuga (Tabla B.7)', () => {
    const s = fuente('linac-6mv');
    const t_mm = 600;
    const d = dosisEnPunto([s], 6, 0, 1, { barriers: [barrera({ barrierType: 'secondary', thickness_mm: t_mm })] });
    expect(d.porFuente[0].transmision).toBeCloseTo(transmisionTVL(t_mm / 10, TABLA_B_7['6']), 14);
  });

  it('el punto del lado de la fuente no se atenúa', () => {
    const s = fuente('linac-18mv');
    const d = dosisEnPunto([s], 2, 0, 1, { barriers: [barrera({ thickness_mm: 1000 })] });
    expect(d.porFuente[0].transmision).toBe(1);
    expect(d.porFuente[0].cruces).toHaveLength(0);
  });

  it('incidencia oblicua: recorrido t / cos θ', () => {
    const s = fuente('linac-6mv');
    const t_mm = 500;
    // Rayo a 45° respecto de la normal del muro x = 3.
    const d = dosisEnPunto([s], 6, 6, 1, { barriers: [barrera({ y1: -10, y2: 10, thickness_mm: t_mm })] });
    const cruce = d.porFuente[0].cruces[0];
    expect(cruce.cosTheta).toBeCloseTo(Math.SQRT1_2, 12);
    expect(cruce.capas[0].recorrido_mm).toBeCloseTo(t_mm * Math.SQRT2, 9);
    expect(d.porFuente[0].transmision).toBeCloseTo(transmisionTVL((t_mm * Math.SQRT2) / 10, TABLA_B_2.concrete['6']), 14);
  });

  it(`el crédito por oblicuidad se limita a θ = ${ANGULO_MAX_OBLICUIDAD_DEG}°`, () => {
    const s = fuente('linac-6mv');
    const d = dosisEnPunto([s], 6, 60, 1, { barriers: [barrera({ y1: -100, y2: 100, thickness_mm: 300 })] });
    const cruce = d.porFuente[0].cruces[0];
    expect(cruce.cosTheta).toBeLessThan(0.5);
    expect(cruce.factorOblicuidad).toBeCloseTo(1 / Math.cos((ANGULO_MAX_OBLICUIDAD_DEG * Math.PI) / 180), 12);
  });

  it('diagnóstico tabulado: Archer NCRP 147 Tabla C.1 en plomo', () => {
    const s = fuente('rad-chest');
    const d = dosisEnPunto([s], 6, 0, 1, { barriers: [barrera({ barrierType: 'secondary', materialCode: 'PB', thickness_mm: 1 })] });
    expect(d.porFuente[0].transmision).toBeCloseTo(transmisionArcher(1, TABLA_C_1.chest_room.lead), 14);
    expect(d.porFuente[0].cruces[0].capas[0].metodo).toBe('NCRP147_ARCHER');
  });

  it('medicina nuclear: TVL del material', () => {
    const s = fuente('pet-f18', { nuclearActivity_GBq: 0.5 });
    const d = dosisEnPunto([s], 6, 0, 1, { barriers: [barrera({ barrierType: 'nuclear', materialCode: 'PB', thickness_mm: 10 })] });
    expect(d.porFuente[0].transmision).toBeCloseTo(tvlTransmission(10, material('PB'), '511keV'), 14);
  });

  it('dos barreras cruzadas multiplican su transmisión; capas laminadas también', () => {
    const s = fuente('linac-6mv');
    const b1 = barrera({ id: 'b1', thickness_mm: 370 });
    const b2 = barrera({ id: 'b2', x1: 5, x2: 5, shieldingLayers: [{ materialCode: 'CONCRETE235', thickness_mm: 200 }, { materialCode: 'PB', thickness_mm: 57 }] });
    const d = dosisEnPunto([s], 8, 0, 1, { barriers: [b1, b2] });
    const B1 = transmisionTVL(37, TABLA_B_2.concrete['6']);
    const B2 = transmisionTVL(20, TABLA_B_2.concrete['6']) * transmisionTVL(5.7, TABLA_B_2.lead['6']);
    expect(d.porFuente[0].cruces).toHaveLength(2);
    expect(d.porFuente[0].transmision).toBeCloseTo(B1 * B2, 14);
  });

  it('la malla del heat map ahora atenúa detrás de la barrera', () => {
    const s = fuente('linac-6mv', { x: 100, y: 100 });
    const b = barrera({ x1: 200, y1: -500, x2: 200, y2: 500, thickness_mm: 1000 });
    const malla = calcularMallaDosis([s], 0.01, 40, { barriers: [b] });
    const detras = malla.filter((p) => p.x > 200);
    const delante = malla.filter((p) => p.x < 200);
    expect(detras.length).toBeGreaterThan(0);
    expect(detras.every((p) => p.kerma < p.kermaSinBlindaje)).toBe(true);
    expect(delante.every((p) => p.kerma === p.kermaSinBlindaje)).toBe(true);
  });
});

describe('doseFieldEngine — geometría y capas', () => {
  it('cruceSegmentoBarrera detecta cruces y descarta paralelos', () => {
    expect(cruceSegmentoBarrera(0, 0, 6, 0, { x1: 3, y1: -1, x2: 3, y2: 1 })?.cosTheta).toBeCloseTo(1, 12);
    expect(cruceSegmentoBarrera(0, 0, 6, 0, { x1: 0, y1: 1, x2: 6, y2: 1 })).toBeNull();
    expect(cruceSegmentoBarrera(0, 0, 6, 0, { x1: 3, y1: 1, x2: 3, y2: 2 })).toBeNull();
  });

  it('capasDeBarrera: shieldingLayers → thickness_mm → requiredThickness_mm', () => {
    expect(capasDeBarrera(barrera())).toEqual([]);
    expect(capasDeBarrera(barrera({ requiredThickness_mm: { CONCRETE235: 800, PB: 60 } }))).toEqual([{ materialCode: 'CONCRETE235', thickness_mm: 800 }]);
    expect(capasDeBarrera(barrera({ thickness_mm: 300, requiredThickness_mm: 800 }))).toEqual([{ materialCode: 'CONCRETE235', thickness_mm: 300 }]);
    expect(capasDeBarrera(barrera({ thickness_mm: 300, shieldingLayers: [{ materialCode: 'PB', thickness_mm: 2 }] }))).toEqual([{ materialCode: 'PB', thickness_mm: 2 }]);
  });
});
