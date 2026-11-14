/**
 * Revisión del #58, H1: el mapa de dosis (y los visores, que leen el mismo `doseFieldEngine`) atenúa con la MISMA
 * transmisión que dimensiona la barrera en `motorProyecto`: regla espectral GP de `terapiaEspectroGP` para Tc-99m,
 * I-131 y Lu-177, y curva de TG-108 (Tabla V) para PET de 511 keV (F-18). Antes usaba la TVL de catálogo (Tc-99m:
 * 45 mm de concreto frente a 148 mm del primer décimo GP), y detrás de la barrera de diseño daba ≈ 200× menos dosis
 * que la meta que la barrera supone.
 *
 * Prueba: con la barrera dimensionada por el motor (espesor requerido instalado), el kerma del mapa en el punto de
 * máximo kerma de la barrera debe ser la meta efectiva P/T (diferencia < 5 %).
 */
import { describe, expect, it } from 'vitest';
import { calcularProyecto } from '@/lib/motorProyecto';
import { dosisEnPunto, transmisionCapa } from '@/lib/doseFieldEngine';
import { transmisionRegla, transmisionReglaCache } from '@/lib/terapiaEspectroGP';
import { transmisionTG108 } from '@/lib/transmisionTG108';
import { tvlTransmission } from '@/lib/shieldingMath';
import { MATERIALS, MODALITIES, type Barrier, type FloorPlan, type RadiationSource } from '@/types/radshield';

const muro = (id: string, d_m: number, materialCode: string): Barrier => ({
  id, name: id, x1: d_m * 100, y1: -150, x2: d_m * 100, y2: 150, barrierType: 'secondary', useFactor: 1,
  occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode,
} as Barrier);
const fuente = (id: string): RadiationSource => ({
  id: `n-${id}`, x: 0, y: 0, name: id, modality: MODALITIES.find((m) => m.id === id)!, workloadValue: 2,
  workloadUnit: 'pacientes/semana', isocenterHeight_m: 1, useFactor: 1,
  tg108: { A0_MBq: 740, pacientesSemana: 30, tU_h: 1, tI_h: 0.5, sala: 'captacion' },
} as RadiationSource);
const mat = (code: string) => MATERIALS.find((m) => m.code === code)!;

describe('H1: mapa de dosis ↔ barrera en el mismo punto', () => {
  it.each([
    ['spect-tc99m', 'CONCRETE235'], ['spect-tc99m', 'PB'],
    ['radioiodine-i131', 'CONCRETE235'], ['radioiodine-i131', 'PB'],
    ['pet-f18', 'CONCRETE235'], ['pet-f18', 'PB'],
  ] as const)('%s, %s: kerma del mapa tras el espesor requerido = P/T (±5 %)', (mod, code) => {
    const plano = {
      id: 'p', name: 'p', imageUrl: null, width_pixels: 2000, height_pixels: 2000, scale_m_per_pixel: 0.01,
      barriers: [muro('m', 2, code)], sources: [fuente(mod)], regions: [], criticalPoints: [],
    } as unknown as FloorPlan;
    const r = calcularProyecto(plano);
    const b = r.barriers[0];
    const t = (b.requiredThickness_mm as Record<string, number>)[code];
    expect(t).toBeGreaterThan(0);
    const p = r.sampleLines[0].maxKermaPoint!;
    const d = dosisEnPunto(plano.sources, p.x, p.y, plano.scale_m_per_pixel, { barriers: [b], materials: MATERIALS });
    const meta = b.designGoal_mSv_per_wk / b.occupancyFactor;
    expect(d.kermaSinBlindaje_mSv_semana).toBeCloseTo(b.maxKerma!, 9);
    expect(Math.abs(d.kerma_mSv_semana / meta - 1), `${mod} ${code}: mapa ${d.kerma_mSv_semana} vs meta ${meta}`).toBeLessThan(0.05);
  });

  it('transmisionCapa usa el modelo del motor (GP / TG-108) y ya no la TVL de catálogo', () => {
    const co = mat('CONCRETE235');
    const tc = transmisionCapa(fuente('spect-tc99m'), 'secondary', co, 152);
    expect(tc.metodo).toBe('ANS643_GP_REGLA');
    expect(tc.transmision / transmisionRegla('Tc99m', 'Concreto', 15.2) - 1).toBeLessThan(1e-3);
    // Antes: 10^(−152/45) ≈ 4×10⁻⁴, unas 200 veces menos que la regla (≈ 0.09).
    expect(tc.transmision / tvlTransmission(152, co, '140keV')).toBeGreaterThan(100);
    const i131 = transmisionCapa(fuente('radioiodine-i131'), 'secondary', mat('PB'), 20);
    expect(i131.metodo).toBe('ANS643_GP_REGLA');
    // Plomo del catálogo 11.34 g/cm³ → Pb de referencia 11.35 por equivalencia másica, igual que el motor.
    expect(Math.abs(i131.transmision / transmisionRegla('I131', 'Pb', (2 * mat('PB').density) / 11.35) - 1)).toBeLessThan(1e-4);
    const pet = transmisionCapa(fuente('pet-f18'), 'secondary', co, 213.77);
    expect(pet.metodo).toBe('TG108_TABLA_V');
    expect(pet.transmision).toBeCloseTo(transmisionTG108('concrete', 213.77), 12);
    // Equivalencia másica igual que el motor: barita 3.5 g/cm³.
    const ba = transmisionCapa(fuente('spect-tc99m'), 'secondary', mat('CONCRETEBARITE'), 100);
    expect(Math.abs(ba.transmision / transmisionRegla('Tc99m', 'Concreto', (10 * 3.5) / 2.35) - 1)).toBeLessThan(1e-3);
  });

  it('caché: misma transmisión que sin caché (redondeo a 0.1 µm) y mucho más rápida en una malla', () => {
    for (const t of [0.0123, 0.5, 3.3333, 15.2, 40]) {
      expect(Math.abs(transmisionReglaCache('I131', 'Concreto', t) / transmisionRegla('I131', 'Concreto', t) - 1)).toBeLessThan(1e-5);
      expect(Math.abs(transmisionReglaCache('Tc99m', 'Pb', t / 20) / transmisionRegla('Tc99m', 'Pb', t / 20) - 1)).toBeLessThan(1.5e-4);
    }
    // 200×200 celdas con recorridos oblicuos repetidos: < 1 s.
    const t0 = performance.now();
    for (let i = 0; i < 40_000; i++) transmisionReglaCache('I131', 'Concreto', 20 / Math.cos(((i % 400) / 400) * 1.2));
    expect(performance.now() - t0).toBeLessThan(1000);
  });
});
