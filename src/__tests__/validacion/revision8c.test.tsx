/**
 * Revisión independiente de la Fase 8c: estados «cumple» que no deben salir con espesor insuficiente o sin datos,
 * y TVL de radionúclidos que eran ≈ HVL.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SPECT_RADIONUCLIDES, salaSPECT, type SPECTProcedure } from '@/lib/spect/IPEMReport109';
import { THERAPY_NUCLIDES } from '@/lib/therapy/TherapeuticRadionuclideShielding';
import MCNPCyclotronDialog from '@/sections/dialogs/MCNPCyclotronDialog';

afterEach(cleanup);

describe('TVL de radionúclidos (Delacroix 2002 / XCOM de haz estrecho)', () => {
  const spect = (s: string) => SPECT_RADIONUCLIDES.find(r => r.symbol === s)!;
  it('SPECT: ninguna TVL de concreto por debajo de la de haz estrecho; plomo de I-131 = 11 mm', () => {
    expect(spect('Tc-99m').tenthValueConcrete_mm).toBeGreaterThanOrEqual(66);
    expect(spect('Tl-201').tenthValueConcrete_mm).toBeGreaterThanOrEqual(72);
    expect(spect('I-123').tenthValueLead_mm).toBeGreaterThanOrEqual(2);
    expect(spect('I-131').tenthValueLead_mm).toBe(11);
    expect(spect('In-111').tenthValueLead_mm).toBeGreaterThanOrEqual(3);
    expect(spect('Ga-67').tenthValueLead_mm).toBeGreaterThanOrEqual(6);
  });

  it('SPECT: 50 mm de concreto ya no «cumplen» una sala de Tc-99m que con la HVL como TVL parecía blindada', () => {
    const p: SPECTProcedure[] = [{ name: 'Óseo', radionuclide: 'Tc-99m', avgAdminActivity_MBQ: 740, avgImagingTime_min: 30, patientsPerWeek: 60, scatterFactor_1m_uGy: 0 }];
    const s = salaSPECT(p, 2, 50, 'concrete', 20); // K ≈ 329 μSv/semana: con TVL = 22 mm daba 1.7 μSv
    expect(s.concreto_mm).toBeGreaterThan(75);
    expect(s.cumple).toBe(false);
  });

  it('terapia: I-131 11 mm y Lu-177 2.1 mm de plomo', () => {
    expect(THERAPY_NUCLIDES.find(n => n.symbol === 'I-131')!.tenthValueLead_mm).toBe(11);
    expect(THERAPY_NUCLIDES.find(n => n.symbol === 'Lu-177')!.tenthValueLead_mm).toBeCloseTo(2.1, 5);
  });
});

describe('Ciclotrón (estimación de neutrones)', () => {
  it('sin coeficiente de conversión no hay «CUMPLE»; el techo usa el mismo estimado que el muro', () => {
    render(<MCNPCyclotronDialog open onOpenChange={() => {}} />);
    fireEvent.change(screen.getByTestId('mcnp-h'), { target: { value: '0' } });
    expect(screen.queryAllByText('CUMPLE')).toHaveLength(0);
    expect(screen.getAllByText('SIN DATOS').length).toBe(2);
  });
});
