/**
 * MultiEnergySpectraDialog contra ejemplos publicados de NCRP 147:
 * §5.3.3.1 (muro del receptor de tórax: K ≈ 46 mGy/semana, 1.3 mm Pb con T = 0.2) y
 * §5.6.1 (TC por DLP: K = 5.2 mGy/semana a 3 m, B = 3.9×10⁻³, 1.5 mm Pb a 120 kVp).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TC_INICIAL, blindajeTC } from '@/lib/calculadorasNormativas';
import MultiEnergySpectraDialog from '@/sections/dialogs/MultiEnergySpectraDialog';

const dentro = (calc: number, pub: number, tol: number) => expect(Math.abs(calc - pub) / pub).toBeLessThanOrEqual(tol);
const valor = (id: string) => Number(/[-+]?\d+(\.\d+)?(e[-+]?\d+)?/i.exec(screen.getByTestId(id).textContent ?? '')![0]);

afterEach(cleanup);

describe('blindajeTC (NCRP 147 §5.6.1, método DLP)', () => {
  it('K¹ cuerpo 0.28 y cabeza 0.15 mGy, K = 5.2 mGy/semana, B = 3.9×10⁻³, 1.5 mm Pb', () => {
    const r = blindajeTC(TC_INICIAL);
    dentro(r.K1_cuerpo_mGy, 0.28, 0.04);
    dentro(r.K1_cabeza_mGy, 0.15, 0.04);
    dentro(r.K_mGy_semana, 5.2, 0.04);
    dentro(r.B_requerida, 3.9e-3, 0.04);
    dentro(r.espesores_mm.lead, 1.5, 0.05);
    expect(r.espesores_mm.concrete).toBeGreaterThan(r.espesores_mm.lead * 50);
  });

  it('sin carga no hace falta blindaje; distancia o T inválidas lanzan', () => {
    expect(blindajeTC({ ...TC_INICIAL, N_cuerpo: 0, N_cabeza: 0 }).espesores_mm.lead).toBe(0);
    expect(() => blindajeTC({ ...TC_INICIAL, d_m: 0 })).toThrow();
    expect(() => blindajeTC({ ...TC_INICIAL, T: 0 })).toThrow();
  });
});

describe('MultiEnergySpectraDialog', () => {
  it('valores iniciales = NCRP 147 §5.3.3.1: K ≈ 46 mGy/semana y 1.3 mm de plomo (T = 0.2)', () => {
    render(<MultiEnergySpectraDialog open onClose={() => {}} />);
    dentro(valor('mes-k'), 46, 0.04);
    dentro(valor('mes-espesor-lead'), 1.3, 0.05);
    expect(screen.getByTestId('mes-espesor-concrete')).toBeTruthy();
    expect(screen.getByTestId('mes-espesor-gypsum')).toBeTruthy();
  });

  it('§5.3.1.1 desde la interfaz: piso (Rad Room floor), d = 4.1 m, T = 1 → K = 39 y 107 mm de concreto', () => {
    render(<MultiEnergySpectraDialog open onClose={() => {}} />);
    fireEvent.change(screen.getByTestId('mes-distribucion'), { target: { value: 'rad_room_floor_other' } });
    fireEvent.change(screen.getByTestId('mes-d'), { target: { value: '4.1' } });
    fireEvent.change(screen.getByTestId('mes-t'), { target: { value: '1' } });
    dentro(valor('mes-k'), 39, 0.04);
    dentro(valor('mes-espesor-concrete'), 107, 0.05);
  });

  it('modo TC con T = 1 reproduce §5.6.1: 5.2 mGy/semana y 1.5 mm Pb', () => {
    render(<MultiEnergySpectraDialog open onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('modo-tc'));
    fireEvent.change(screen.getByTestId('mes-t'), { target: { value: '1' } });
    dentro(valor('mes-k'), 5.2, 0.04);
    dentro(valor('mes-b'), 3.9e-3, 0.04);
    dentro(valor('mes-espesor-lead'), 1.5, 0.05);
  });

  it('ya no usa el TVL "TASMIP" de 0.30 mm Pb: 120 kVp con B ≈ 4×10⁻³ daría 0.7 mm, el motor da ≥ 1.4 mm', () => {
    render(<MultiEnergySpectraDialog open onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('modo-tc'));
    fireEvent.change(screen.getByTestId('mes-t'), { target: { value: '1' } });
    expect(valor('mes-espesor-lead')).toBeGreaterThan(1.4);
  });
});
