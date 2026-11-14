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
  // Fase 11 (#57 N3): las TVL de IPEM 109 son ahora el primer espesor (B = 0.1) de la regla espectral GP; en concreto
  // quedan por encima de las de haz estrecho de XCOM (Tc-99m 66, Tl-201 72, I-123 70, Ga-67 92, In-111 85 mm).
  it('SPECT: ninguna TVL de concreto por debajo de la de haz estrecho; I-131 en plomo por el haz estrecho a 722.9 keV', () => {
    expect(spect('Tc-99m').tenthValueConcrete_mm).toBeGreaterThanOrEqual(66);
    expect(spect('Tl-201').tenthValueConcrete_mm).toBeGreaterThanOrEqual(72);
    expect(spect('I-123').tenthValueConcrete_mm).toBeGreaterThanOrEqual(70);
    expect(spect('Ga-67').tenthValueConcrete_mm).toBeGreaterThanOrEqual(92);
    expect(spect('In-111').tenthValueConcrete_mm).toBeGreaterThanOrEqual(85);
    expect(spect('I-123').tenthValueLead_mm).toBeGreaterThanOrEqual(2);
    expect(spect('I-131').tenthValueLead_mm).toBeCloseTo(20.44, 2); // 1 TVL de haz estrecho a 722.9 keV, µ XCOM (antes 11 mm; 20.3 con la malla de SRD 126)
    expect(spect('In-111').tenthValueLead_mm).toBeGreaterThanOrEqual(3);
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
