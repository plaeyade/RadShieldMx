/**
 * Fase 8d — prioridad baja, factores y criterios normativos: autoatenuación del paciente (TG-108),
 * número Eₙ (ISO 13528) y límites del asistente de ejemplos (lib/limitesDosis).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ABSORCION_PACIENTE } from '@/lib/tg108';
import { FACTORES_AUTOATENUACION, cargaConAutoatenuacion } from '@/lib/autoatenuacionPaciente';
import { numeroEn } from '@/lib/numeroEn';
import { LIMITES_DOSIS } from '@/lib/limitesDosis';
import SelfShieldingDialog from '@/sections/dialogs/SelfShieldingDialog';
import ExperimentalValidationDialog from '@/sections/dialogs/ExperimentalValidationDialog';
import { readFileSync } from 'node:fs';

afterEach(cleanup);

describe('Autoatenuación del paciente (SelfShielding)', () => {
  it('PET usa 1 − 0.36 de TG-108; TC y SPECT no se reducen', () => {
    expect(FACTORES_AUTOATENUACION.PET_F18.factor).toBeCloseTo(1 - ABSORCION_PACIENTE, 12);
    expect(FACTORES_AUTOATENUACION.PET_GA68.factor).toBeCloseTo(0.64, 12);
    for (const k of ['CT', 'SPECT_TC99M', 'SPECT_I131']) expect(FACTORES_AUTOATENUACION[k].factor).toBe(1);
    // Γ_paciente de F-18 en TG-108: 0.143 × 0.64 = 0.0915 ≈ 0.092 μSv·m²/(MBq·h).
    expect(cargaConAutoatenuacion('PET_F18', 0.143).efectiva).toBeCloseTo(0.092, 3);
    expect(cargaConAutoatenuacion('CT', 350)).toEqual({ efectiva: 350, reduccion_pct: 0 });
  });

  it('el diálogo muestra 36 % para PET y «sin reducción» para TC', () => {
    render(<SelfShieldingDialog open onClose={() => {}} />);
    const res = screen.getByTestId('autoatenuacion-resultado');
    expect(res.textContent).toContain('224.0');
    expect(res.textContent).toContain('Reducción del 36 %');
    fireEvent.change(screen.getByLabelText('Modalidad'), { target: { value: 'CT' } });
    expect(res.textContent).toContain('350.0');
    expect(res.textContent).toContain('Sin reducción');
  });
});

describe('Número Eₙ (ExperimentalValidation)', () => {
  it('combina U de medición y referencia; |Eₙ| ≤ 1 es concordante', () => {
    // Antes: |Δ| ≤ 2u con u de la medición → 3 cm de diferencia con U = 2 cm «concordaba».
    expect(numeroEn(40, 2, 37, 0)).toMatchObject({ diferencia: 3, en: 1.5, concordante: false });
    const r = numeroEn(40, 2, 37, 2.5);
    expect(r.en!).toBeCloseTo(3 / Math.sqrt(4 + 6.25), 12);
    expect(r.concordante).toBe(true);
    expect(numeroEn(36.5, 0, 37, 0)).toMatchObject({ en: null, concordante: null });
  });

  it('el diálogo toma la referencia de NCRP 151 Tabla B.2 y muestra Eₙ', () => {
    render(<ExperimentalValidationDialog open onOpenChange={() => {}} />);
    const res = screen.getByTestId('validacion-en');
    expect(res.textContent).toContain('-0.25');
    expect(res.textContent).toContain('CONCORDANTE');
    fireEvent.change(screen.getByLabelText('TVL medida x (cm)'), { target: { value: '40' } });
    expect(res.textContent).toContain('1.50');
    expect(res.textContent).toContain('NO CONCORDANTE');
    // Fila «Plomo, Co-60, TVL₁» de la Tabla B.2: 4 cm.
    const fila = screen.getAllByRole('row').find((tr) => /Plomo.*Co-60.*TVL₁/.test(tr.textContent ?? ''))!;
    fireEvent.click(fila);
    expect((screen.getByLabelText('TVL de referencia X (cm)') as HTMLInputElement).value).toBe('4');
    expect(screen.queryByText(/La法国|ISRP Journal|TEPC Measurements/)).toBeNull();
  });
});

describe('Asistente de ejemplos: límites de una sola tabla', () => {
  it('no anuncia 5 mSv/año para el público ni espesores PET fijos', () => {
    const src = readFileSync('src/sections/dialogs/ExampleWizardDialog.tsx', 'utf8');
    expect(src).not.toMatch(/Publico: < 5 mSv/);
    expect(src).not.toMatch(/Sala inyeccion: 2\.0 mm Pb/);
    expect(src).toContain('LIMITES_DOSIS.icrp103.publico_mSv_anio');
    expect(LIMITES_DOSIS.icrp103.publico_mSv_anio).toBe(1);
  });
});
