/**
 * Fase 8d — prioridad baja, supuestos fijos: proyección de tasa y dosis acumulada con decaimiento
 * (ExposureRateProjection) con integración exacta y horas de permanencia editables.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { proyeccionDecaimiento, validarPermanencia } from '@/lib/proyeccionDecaimiento';
import ExposureRateProjectionDialog from '@/sections/dialogs/ExposureRateProjectionDialog';

afterEach(cleanup);

describe('Proyección con decaimiento', () => {
  it('integra Ḣ₀·e^(−λt): una semivida acumula h·Ḣ₀·T½/(2 ln 2)', () => {
    const p = proyeccionDecaimiento({ actividad0: 100, T12_anios: 30, tasa0_uSv_h: 250, anios: 30, horasPorAnio: 8760, paso_anios: 30 });
    expect(p[0]).toMatchObject({ anio: 0, actividad: 100, tasa_uSv_h: 250, dosisAcumulada_mSv: 0 });
    expect(p[1].actividad).toBeCloseTo(50, 9);
    expect(p[1].tasa_uSv_h).toBeCloseTo(125, 9);
    expect(p[1].dosisAcumulada_mSv).toBeCloseTo((8760 * 250 * 30) / (2 * Math.LN2) / 1000, 6);
    // Sin decaimiento apreciable equivale a tasa × horas × años.
    const q = proyeccionDecaimiento({ actividad0: 1, T12_anios: 1e9, tasa0_uSv_h: 1, anios: 5, horasPorAnio: 2000 });
    expect(q[1].dosisAcumulada_mSv).toBeCloseTo(10, 6);
    // Con λt ≪ 1 (1 − e^(−λt) se cancelaría a 0 en coma flotante) sigue dando tasa × horas × años.
    const r = proyeccionDecaimiento({ actividad0: 1, T12_anios: 1e18, tasa0_uSv_h: 1, anios: 5, horasPorAnio: 2000 });
    expect(r[1].dosisAcumulada_mSv).toBeCloseTo(10, 9);
  });

  it('las horas de permanencia escalan la dosis y el año 0 no acumula', () => {
    render(<ExposureRateProjectionDialog open onOpenChange={() => {}} />);
    const filas = () => screen.getAllByRole('row').slice(1).map((tr) => tr.lastElementChild!.textContent);
    expect(filas()[0]).toBe('0.0');
    const continua = Number(filas()[1]);
    fireEvent.change(screen.getByLabelText('Permanencia (h/año)'), { target: { value: '2190' } });
    expect(Number(filas()[1])).toBeCloseTo(continua / 4, 0);
  });

  it('la permanencia se limita a 0–8760 h/año con mensaje', () => {
    expect(validarPermanencia(2000)).toEqual({ horas: 2000, error: null });
    expect(validarPermanencia(10000).horas).toBe(8760);
    expect(validarPermanencia(10000).error).toMatch(/8760/);
    expect(validarPermanencia(-5)).toMatchObject({ horas: 0 });
    expect(validarPermanencia(Number.NaN).error).not.toBeNull();
    const base = { actividad0: 1, T12_anios: 1e9, tasa0_uSv_h: 1, anios: 5 };
    expect(proyeccionDecaimiento({ ...base, horasPorAnio: 20000 })[1].dosisAcumulada_mSv).toBeCloseTo(proyeccionDecaimiento({ ...base, horasPorAnio: 8760 })[1].dosisAcumulada_mSv, 9);

    render(<ExposureRateProjectionDialog open onOpenChange={() => {}} />);
    const filas = () => screen.getAllByRole('row').slice(1).map((tr) => tr.lastElementChild!.textContent);
    const continua = filas()[1];
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.change(screen.getByLabelText('Permanencia (h/año)'), { target: { value: '9000' } });
    expect(screen.getByRole('alert').textContent).toMatch(/no puede exceder 8760/);
    expect(filas()[1]).toBe(continua);
  });
});
