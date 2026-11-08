import { describe, expect, it } from 'vitest';
import {
  dosisSemanalPorModalidad,
  dosisSemanalPorPaciente,
  dosisSemanalTG108,
  factorRt,
  protocolosParaModalidad,
  SEMIVIDAS_NO_PET_H,
} from '@/lib/tg108';
import { calculateNuclearKerma } from '@/lib/shieldingMath';
import { buildCalculationCacheKey, buildCalculationCachePayload, classifyCalculationCacheDiff } from '@/lib/calculationCacheKey';
import { MODALITIES, type FloorPlan, type RadiationSource } from '@/types/radshield';

const modalidad = (id: string) => {
  const m = MODALITIES.find((x) => x.id === id);
  if (!m) throw new Error(id);
  return m;
};

const fuente = (id: string, extra: Partial<RadiationSource> = {}): RadiationSource => ({
  id: 's1', x: 0, y: 0, name: 'NM', modality: modalidad(id), workloadValue: 555, workloadUnit: 'MBq',
  isocenterHeight_m: 0, useFactor: 1, workloadHoursPerWeek: 40, nuclearActivity_GBq: 0.555, ...extra,
});

const tg = { A0_MBq: 740, pacientesSemana: 30, tU_h: 1, tI_h: 0.5, sala: 'captacion' as const };

describe('extensión «estilo TG-108» para SPECT / I-131', () => {
  it('semividas físicas en horas', () => {
    expect(SEMIVIDAS_NO_PET_H.Tc99m).toBeCloseTo(6.0067, 4);
    expect(SEMIVIDAS_NO_PET_H.I131).toBeCloseTo(192.6048, 3);
    expect(SEMIVIDAS_NO_PET_H.I123).toBeCloseTo(13.2235, 4);
    expect(SEMIVIDAS_NO_PET_H.Tl201).toBeCloseTo(72.912, 3);
    expect(SEMIVIDAS_NO_PET_H.Lu177).toBeCloseTo(159.528, 3);
  });

  it('captación Tc-99m: Γ·N·A₀·t_U·R_tU/d², sin atenuación del paciente', () => {
    const D = dosisSemanalPorPaciente({ ...tg, nuclido: 'Tc99m', gamma: 0.03, d_m: 2 });
    const esperado = (0.03 * 30 * 740 * 1 * factorRt(1, 6.0067 * 60)) / 4;
    expect(D).toBeCloseTo(esperado, 6);
    // Rₜ de Tc-99m a 1 h ≈ 0.944
    expect(factorRt(1, 6.0067 * 60)).toBeCloseTo(0.944, 3);
  });

  it('imagen: F_U por decaimiento y SIN vaciado (0.85 sólo en TG-108 PET)', () => {
    const e = { ...tg, sala: 'imagen' as const, nuclido: 'Tc99m' as const, gamma: 0.03, d_m: 1 };
    const FU = Math.exp((-0.693 * 1) / 6.0067);
    const esperado = 0.03 * 30 * 740 * FU * 0.5 * factorRt(0.5, 6.0067 * 60);
    expect(dosisSemanalPorPaciente(e)).toBeCloseTo(esperado, 6);
  });

  it('I-131 de vida larga: Rₜ ≈ 1 en horas de estancia', () => {
    expect(factorRt(2, SEMIVIDAS_NO_PET_H.I131 * 60)).toBeGreaterThan(0.995);
  });

  it('rechaza entradas inválidas', () => {
    expect(() => dosisSemanalPorPaciente({ ...tg, nuclido: 'Tc99m', gamma: 0.03, d_m: 0 })).toThrow();
    expect(() => dosisSemanalPorPaciente({ ...tg, nuclido: 'Tc99m', gamma: -1, d_m: 1 })).toThrow();
  });

  it('dosisSemanalPorModalidad: PET usa TG-108, SPECT la extensión, otras null', () => {
    const pet = dosisSemanalPorModalidad('pet-f18', 0.143, tg, 1);
    expect(pet?.modelo).toBe('tg108');
    expect(pet?.D_uSv).toBeCloseTo(dosisSemanalTG108({ ...tg, nuclido: 'F18', d_m: 1 }), 9);
    expect(pet?.Rt).toBeCloseTo(0.83, 2);
    expect(dosisSemanalPorModalidad('spect-tc99m', 0.03, tg, 1)?.modelo).toBe('estilo-tg108');
    expect(dosisSemanalPorModalidad('rad-chest', 0.03, tg, 1)).toBeNull();
  });

  it('presets filtrados por nucleido de la modalidad', () => {
    expect(protocolosParaModalidad('pet-f18').every((p) => ['F-18', 'Ga-68'].includes(p.nuclido))).toBe(true);
    expect(protocolosParaModalidad('pet-f18').length).toBeGreaterThan(0);
    expect(protocolosParaModalidad('spect-tc99m').every((p) => p.nuclido === 'Tc-99m')).toBe(true);
    expect(protocolosParaModalidad('radioiodine-i131').every((p) => p.nuclido === 'I-131')).toBe(true);
    expect(protocolosParaModalidad('lu177')).toEqual([]);
  });
});

describe('calculateNuclearKerma con tg108', () => {
  it('SPECT Tc-99m usa la extensión (mSv/semana) a 1 m', () => {
    const s = fuente('spect-tc99m', { tg108: tg });
    const K = calculateNuclearKerma(s, 1, 0, 1);
    const esperado = dosisSemanalPorPaciente({ ...tg, nuclido: 'Tc99m', gamma: 0.03, d_m: 1 }) / 1000;
    expect(K).toBeCloseTo(esperado, 9);
  });

  it('I-131 usa la extensión con Γ de la modalidad', () => {
    const s = fuente('radioiodine-i131', { tg108: { ...tg, sala: 'imagen' } });
    const esperado = dosisSemanalPorPaciente({ ...tg, sala: 'imagen', nuclido: 'I131', gamma: 0.059, d_m: 2 }) / 1000;
    expect(calculateNuclearKerma(s, 2, 0, 1)).toBeCloseTo(esperado, 9);
  });

  it('sin tg108 se mantiene «actividad × horas»', () => {
    const s = fuente('spect-tc99m');
    expect(calculateNuclearKerma(s, 1, 0, 1)).toBeCloseTo(0.03 * 0.555 * 40, 9);
    expect(calculateNuclearKerma({ ...s, tg108: undefined }, 1, 0, 1)).toBeCloseTo(0.03 * 0.555 * 40, 9);
  });

  it('Lu-177 no está enganchado: tg108 se ignora', () => {
    const s = fuente('lu177', { tg108: tg });
    expect(calculateNuclearKerma(s, 1, 0, 1)).toBeCloseTo(0.005 * 0.555 * 40, 9);
  });
});

describe('clave de caché incluye tg108', () => {
  const plano = (s: RadiationSource): FloorPlan =>
    ({ scale_m_per_pixel: 0.01, barriers: [], sources: [s], occupiedRegions: [], criticalPoints: [] }) as unknown as FloorPlan;

  it('activar, editar o apagar tg108 cambia la clave', () => {
    const sin = buildCalculationCacheKey(plano(fuente('pet-f18')));
    const con = buildCalculationCacheKey(plano(fuente('pet-f18', { tg108: tg })));
    const otraSala = buildCalculationCacheKey(plano(fuente('pet-f18', { tg108: { ...tg, sala: 'imagen' } })));
    const apagado = buildCalculationCacheKey(plano(fuente('pet-f18', { tg108: undefined })));
    expect(con).not.toBe(sin);
    expect(otraSala).not.toBe(con);
    expect(apagado).toBe(sin);
  });

  it('el payload serializa tg108 y el diff lo clasifica como fuente', () => {
    const p = buildCalculationCachePayload(plano(fuente('pet-f18', { tg108: tg })));
    expect(p.sources[0].tg108).toEqual(tg);
    expect(classifyCalculationCacheDiff(['sources[0].tg108.A0_MBq'])).toContain('source');
  });
});
