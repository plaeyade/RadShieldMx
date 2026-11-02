import { describe, expect, it } from 'vitest';
import { calculateCycloneConcreteThickness } from '@/lib/cycloneKIUBEData';

describe('calculateCycloneConcreteThickness (IBA SRG Tabla 8/9)', () => {
  it('reproduce los puntos de la tabla a 0°', () => {
    expect(calculateCycloneConcreteThickness('KIUBE 180', 0.79).thickness_cm).toBe(220);
    expect(calculateCycloneConcreteThickness('Cyclone KIUBE 180', 0.40).thickness_cm).toBe(230);
  });

  it('interpola log-linealmente dentro del rango', () => {
    const r = calculateCycloneConcreteThickness('KIUBE 180', 0.5);
    expect(r.thickness_cm).toBeGreaterThan(220);
    expect(r.thickness_cm).toBeLessThan(230);
    expect(r.extrapolated).toBe(false);
  });

  it('la dirección cambia el resultado y 0° es la más exigente', () => {
    const a0 = calculateCycloneConcreteThickness('KIUBE 180', 0.5, '0deg');
    const a90 = calculateCycloneConcreteThickness('KIUBE 180', 0.5, '90deg');
    const a180 = calculateCycloneConcreteThickness('KIUBE 180', 0.5, '180deg');
    expect(a90.directionFactor).toBeCloseTo(0.27 / 1.2, 6);
    expect(a90.thickness_cm).toBeLessThan(a0.thickness_cm);
    expect(a180.thickness_cm).toBeLessThan(a0.thickness_cm);
    expect(a180.thickness_cm).toBeGreaterThanOrEqual(a90.thickness_cm);
  });

  it('marca la extrapolación fuera de 200–230 cm', () => {
    const r = calculateCycloneConcreteThickness('KIUBE 300', 0.1);
    expect(r.extrapolated).toBe(true);
    expect(r.thickness_cm).toBeGreaterThan(230);
    expect(r.notes.join(' ')).toMatch(/Monte Carlo/);
  });

  it('modelo desconocido no inventa: devuelve el máximo y lo dice', () => {
    const r = calculateCycloneConcreteThickness('Otro', 1);
    expect(r.model).toBeNull();
    expect(r.thickness_cm).toBe(230);
  });
});
