import { describe, expect, it } from 'vitest';
import { calcularBarreraNormativa } from '@/lib/normativeBarrierEngine';
import { generateSamplePoints } from '@/lib/shieldingMath';
import { MATERIALS, MODALITIES, type Barrier, type RadiationSource } from '@/types/radshield';

const fuente = (id: string, extra: Partial<RadiationSource> = {}): RadiationSource => ({
  id: 's', x: 0, y: 0, name: id, modality: MODALITIES.find((m) => m.id === id)!,
  workloadValue: 300, workloadUnit: '', isocenterHeight_m: 0, useFactor: 1, ...extra,
});
const barrera = (extra: Partial<Barrier> = {}): Barrier => ({
  id: 'b', x1: 3, y1: -1, x2: 3, y2: 1, name: 'muro', barrierType: 'primary',
  useFactor: 1, occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'PB', ...extra,
});

describe('motor normativo en el lienzo', () => {
  it('NCRP 147 §5.2 en el lienzo: unidad de tórax, 300 pacientes, 3 m → 2.2 mm Pb', () => {
    const r = calcularBarreraNormativa(barrera(), [fuente('rad-chest')], [{ x: 3, y: 0 }], 1, MATERIALS)!;
    expect(r.metodo).toBe('NCRP147');
    expect(Number(r.espesores_mm.PB.toFixed(1))).toBe(2.2);
    expect(r.kermaMax_mSv_semana).toBeCloseTo(40, 6);
  });

  it('NCRP 151 §7.1.1 en el lienzo: primaria 18 MV a 7.2 m → ~150 cm de concreto', () => {
    const linac = fuente('linac-18mv', { workloadValue: 150, modality: { ...MODALITIES.find((m) => m.id === 'linac-18mv')!, doseRateConstant: 3 } });
    const r = calcularBarreraNormativa(
      barrera({ useFactor: 0.25, occupancyFactor: 0.025, materialCode: 'CONCRETE235' }),
      [linac], [{ x: 7.2, y: 0 }], 1, MATERIALS,
    )!;
    expect(r.metodo).toBe('NCRP151');
    expect(r.espesores_mm.CONCRETE235 / 10).toBeCloseTo(149.6, 0);
    expect(r.espesores_mm.PB).toBeGreaterThan(0);
  });

  it('modalidades no cubiertas siguen con el motor anterior', () => {
    expect(calcularBarreraNormativa(barrera(), [fuente('pet-f18')], [{ x: 3, y: 0 }], 1, MATERIALS)).toBeNull();
  });

  it('los puntos de muestreo quedan del lado opuesto a la fuente', () => {
    const pts = generateSamplePoints(barrera({ x1: 3, y1: -1, x2: 3, y2: 1 }), 1, [{ x: 0, y: 0 }]);
    expect(pts.every((p) => p.x > 3)).toBe(true);
    const otros = generateSamplePoints(barrera({ x1: 3, y1: 1, x2: 3, y2: -1 }), 1, [{ x: 0, y: 0 }]);
    expect(otros.every((p) => p.x > 3)).toBe(true);
  });
});
