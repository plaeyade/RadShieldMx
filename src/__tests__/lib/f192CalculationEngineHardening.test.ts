import { describe, expect, it } from 'vitest';
import {
  buildCalculationTrace,
  getCalculationAuditWarnings,
  getShieldingCitationIds,
  getShieldingEnergyKey,
  getShieldingFormulaId,
  getShieldingStandard,
} from '@/lib/shieldingMath';
import type { Barrier, RadiationSource } from '@/types/radshield';

const baseBarrier: Barrier = {
  id: 'b-f192',
  x1: 0,
  y1: 0,
  x2: 400,
  y2: 0,
  name: 'F192 QA Barrier',
  barrierType: 'primary',
  useFactor: 1,
  occupancyFactor: 0.25,
  designGoal_mSv_per_wk: 0.02,
  materialCode: 'CONCRETE235',
};

const linac18: RadiationSource = {
  id: 's-f192',
  x: 200,
  y: 200,
  name: 'LINAC 18 MV',
  modality: {
    id: 'linac-18mv',
    name: 'LINAC 18 MV',
    category: 'therapy',
    standard: 'NCRP151',
    unit: 'Gy/fraction',
    energy_MeV: 18,
    energyLabel: '18 MV X-rays',
  },
  workloadValue: 25,
  workloadUnit: 'fractions/week',
  isocenterHeight_m: 1.3,
  useFactor: 1,
};

const pet: RadiationSource = {
  ...linac18,
  id: 'pet-f192',
  name: 'PET F-18',
  modality: {
    id: 'pet-f18',
    name: 'PET F-18',
    category: 'nuclear',
    standard: 'TG108',
    unit: 'uSv m2/MBq h',
    energyLabel: '511 keV gamma',
  },
};

describe('F192 calculation engine hardening', () => {
  it('normalizes formula, standard, energy key and citations by modality', () => {
    expect(getShieldingFormulaId(linac18)).toBe('NCRP151_TVL');
    expect(getShieldingStandard(linac18)).toBe('NCRP151');
    expect(getShieldingEnergyKey(linac18)).toBe('18MV');
    expect(getShieldingCitationIds(linac18)).toContain('NCRP-151');
    expect(getShieldingCitationIds(linac18)).toContain('NCRP-151-neutrons');

    expect(getShieldingFormulaId(pet)).toBe('AAPM_TG108_POINT_KERNEL');
    expect(getShieldingEnergyKey(pet)).toBe('511keV');
    expect(getShieldingCitationIds(pet)).toContain('AAPM-TG-108');
  });

  it('emits clinical warnings for high-energy and invalid factors', () => {
    const warnings = getCalculationAuditWarnings({
      barrier: { ...baseBarrier, occupancyFactor: 0, useFactor: 1.5 },
      sources: [linac18],
      scale_m_per_pixel: 0.01,
      maxKerma_mSv_per_wk: 12,
      materialCount: 4,
      samplePointCount: 8,
    });

    expect(warnings.some((warning) => warning.field === 'occupancyFactor' && warning.severity === 'error')).toBe(true);
    expect(warnings.some((warning) => warning.field === 'useFactor')).toBe(true);
    expect(warnings.some((warning) => warning.field === 'energy_MeV')).toBe(true);
  });

  it('builds finite calculation trace for Memoria IA and reports', () => {
    const trace = buildCalculationTrace({
      barrier: baseBarrier,
      sources: [linac18],
      scale_m_per_pixel: 0.01,
      maxKerma_mSv_per_wk: 12,
      requiredThickness_mm: { CONCRETE235: 1020, PB: 155 },
      samplePointCount: 12,
    });

    expect(trace.formulaId).toBe('NCRP151_TVL');
    expect(trace.standard).toBe('NCRP151');
    expect(trace.inputs.designGoal_mSv_per_wk).toBe(0.02);
    expect(trace.outputs.maxKerma_mSv_per_wk).toBe(12);
    expect(trace.outputs.minRequiredThickness_mm).toBe(155);
    expect(trace.outputs.maxRequiredThickness_mm).toBe(1020);
    expect(trace.assumptions.join(' ')).toContain('qualified expert review');
  });

  it('keeps trace outputs finite when no material thickness was produced', () => {
    const trace = buildCalculationTrace({
      barrier: baseBarrier,
      sources: [],
      scale_m_per_pixel: 0.01,
      maxKerma_mSv_per_wk: 0,
      requiredThickness_mm: {},
      samplePointCount: 0,
    });

    expect(trace.outputs.minRequiredThickness_mm).toBe(0);
    expect(trace.outputs.maxRequiredThickness_mm).toBe(0);
  });
});
