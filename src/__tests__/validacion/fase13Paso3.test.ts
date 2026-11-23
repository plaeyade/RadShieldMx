/**
 * Fase 13, paso 3: laberinto y puerta ≥ 10 MV en el motor del proyecto (NCRP 151 §2.4, ejemplos §7.1.10–7.1.13).
 *
 * Referencia publicada: sala dual 18/6 MV del capítulo 7 (W = 450 y 225 Gy/semana; Varian 1800, Q_n = 1.22×10¹²,
 * H₀ = 1.6 mSv/Gy), P = 100 µSv/semana en la puerta. §7.1.10: fotones H_Tot = 100 µSv (113 con IMRT); §7.1.11:
 * captura 65.3 (170) µSv; §7.1.12: Kersey 765 (1 989) µSv; §7.1.13: 54 mm BPE + 7 mm Pb (72 + 32 con IMRT).
 */
import { describe, expect, it } from 'vitest';
import {
  MOTOR_LABERINTO, dosisTrasPuerta, evaluarLaberintoPuerta, evaluarLaberintosDelPlano,
} from '@/lib/laberintoPuerta';
import { calcularProyecto } from '@/lib/motorProyecto';
import { construirMemoria } from '@/lib/memoriaAnalitica';
import { planoEjemploCompleto } from '@/lib/ejemploGuiado';
import type { FuenteTeleterapia } from '@/lib/ncrp151';
import { MODALITIES, type FloorPlan, type LaberintoPuertaPlano, type RadiationSource } from '@/types/radshield';

const dentro = (v: number, ref: number, tol: number) => expect(Math.abs(v - ref) / ref).toBeLessThanOrEqual(tol);

// §7.1.10 (Fig. 7.1) y §7.1.11–7.1.12 (sala 7.8 × 7.8 × 3.65 m).
const LAB: LaberintoPuertaPlano = {
  id: 'lab-1', nombre: 'Puerta del laberinto',
  geometria: { dh_m: 4.2, dr_m: 5.9, dz_m: 6.8, A0_m2: 2.82, Az_m2: 8.4, dsec_m: 7.3, dsecFuga_m: 7.9, dzz_m: 9.9, A1_m2: 11.8, dL_m: 7.1, muroZ_cm: 125 },
  sala: { d1_m: 6.4, d2_m: 8.5, Sr_m2: 2 * (7.8 * 3.65 + 7.8 * 3.65 + 7.8 * 7.8), S0_m2: 9.2, S1_m2: 8.4 },
  neutronesPorEnergia: [{ mv: 18, Qn: 1.22e12, H0_mSv_Gy: 1.6, referencia: 'NCRP 151 Tabla B.9 (Varian 1800, 18 MV)' }],
  fPaciente: 0.34, anguloReflexion_deg: 75, metodoNeutrones: 'kersey',
  dimensiones: { ancho_m: 2.4, alto_m: 3.5 },
  P_mSv_semana: 0.1, T: 1,
};
const dual = (imrt: boolean): { nombre: string; f: FuenteTeleterapia }[] => [
  { nombre: '18 MV', f: { energia: 18, W_Gy_semana: 450, fraccionIMRT: imrt ? 0.4 : 0, factorIMRT: 5 } },
  { nombre: '6 MV', f: { energia: 6, W_Gy_semana: 225, fraccionIMRT: imrt ? 0.8 : 0, factorIMRT: 5 } },
];

describe('Fase 13, paso 3 — puerta del laberinto contra NCRP 151 §7.1.10–7.1.13', () => {
  it('componentes en la puerta: fotones 100, captura 65.3, neutrones (Kersey) 765 µSv/semana → 930', () => {
    const r = evaluarLaberintoPuerta(LAB, dual(false));
    expect(r.motor).toBe(MOTOR_LABERINTO);
    dentro(r.H_fotones_Sv * 1e6, 100, 0.03);
    dentro(r.H_captura_Sv * 1e6, 65.3, 0.01);
    dentro(r.H_neutrones_Sv * 1e6, 765, 0.01);
    dentro(r.H_total_Sv * 1e6, 930, 0.02);
    // Sólo la de 18 MV produce neutrones y captura.
    const e6 = r.porEnergia.find((c) => c.energia === 6)!;
    expect(e6.neutrones_Sv).toBe(0);
    expect(e6.captura_Sv).toBe(0);
  });

  it('§7.1.13: 54 mm de BPE y 7 mm de Pb (regla de P/2 por componente); con IMRT 72 y 32 mm', () => {
    const sin = evaluarLaberintoPuerta(LAB, dual(false));
    dentro(sin.requeridoNCRP.bpe_mm, 53.6, 0.03);
    dentro(sin.requeridoNCRP.plomo_mm, 7.3, 0.05);
    const con = evaluarLaberintoPuerta(LAB, dual(true));
    dentro(con.H_total_Sv * 1e6, 2272, 0.02);
    dentro(con.requeridoNCRP.bpe_mm, 72, 0.02);
    dentro(con.requeridoNCRP.plomo_mm, 32, 0.03);
  });

  it('la puerta adoptada hace que la SUMA de neutrones, captura y fotones no rebase P/T', () => {
    for (const imrt of [false, true]) {
      const r = evaluarLaberintoPuerta(LAB, dual(imrt));
      const H = { neutrones: r.H_neutrones_Sv, captura: r.H_captura_Sv, fotones: r.H_fotones_Sv };
      expect(dosisTrasPuerta(H, r.requerido.bpe_mm, r.requerido.plomo_mm)).toBeLessThanOrEqual(r.objetivo_Sv * 1.0001);
      expect(r.requerido.bpe_mm).toBeCloseTo(r.requeridoNCRP.bpe_mm, 9);
      expect(r.requerido.plomo_mm).toBeGreaterThanOrEqual(r.requeridoNCRP.plomo_mm);
    }
    // Sin IMRT, la regla de §7.1.13 deja ≈ 106 µSv detrás de la puerta (los fotones de la Ec. 2.14 no se cuentan):
    // el motor añade plomo y lo dice.
    const r = evaluarLaberintoPuerta(LAB, dual(false));
    expect(r.requerido.plomo_mm).toBeGreaterThan(r.requeridoNCRP.plomo_mm);
    expect(r.notas.some((n) => /se adopta .* mm de plomo/.test(n))).toBe(true);
  });

  it('método de neutrones: Wu–McGinley ≈ 46 % de Kersey; «mayor» toma Kersey en esta sala', () => {
    const k = evaluarLaberintoPuerta(LAB, dual(false));
    const w = evaluarLaberintoPuerta({ ...LAB, metodoNeutrones: 'wu-mcginley' }, dual(false));
    const m = evaluarLaberintoPuerta({ ...LAB, metodoNeutrones: undefined }, dual(false));
    dentro(w.H_neutrones_Sv / k.H_neutrones_Sv, 0.46, 0.1);
    expect(m.metodoNeutrones).toBe('mayor');
    expect(m.H_neutrones_Sv).toBeCloseTo(k.H_neutrones_Sv, 15);
    expect(w.requerido.bpe_mm).toBeLessThan(k.requerido.bpe_mm);
  });

  it('estado con la puerta instalada: CUMPLE, NO_CUMPLE o SIN_ESPESOR; tasa media en 40 h de haz', () => {
    const sin = evaluarLaberintoPuerta(LAB, dual(false));
    expect(sin.estado).toBe('SIN_ESPESOR');
    expect(sin.residual_Sv).toBeNull();
    const ok = evaluarLaberintoPuerta({ ...LAB, puertaInstalada: { bpe_mm: 60, plomo_mm: 12 } }, dual(false));
    expect(ok.estado).toBe('CUMPLE');
    expect(ok.residual_Sv!).toBeLessThanOrEqual(1e-4);
    expect(ok.residual_uSv_h!).toBeCloseTo((ok.residual_Sv! * 1e6) / 40, 12);
    const mal = evaluarLaberintoPuerta({ ...LAB, puertaInstalada: { bpe_mm: 40, plomo_mm: 12 } }, dual(false));
    expect(mal.estado).toBe('NO_CUMPLE');
    // Con T = 1/8 el objetivo es P/T = 800 µSv/semana: la misma puerta pide menos.
    const t8 = evaluarLaberintoPuerta({ ...LAB, T: 1 / 8 }, dual(false));
    expect(t8.objetivo_Sv).toBeCloseTo(8e-4, 12);
    expect(t8.requerido.bpe_mm).toBeLessThan(sin.requerido.bpe_mm);
  });

  it('sin datos de la sala con ≥ 10 MV: SIN_DATOS y aviso; ≤ 6 MV sólo fotones con plomo (TVL 6 mm) a P/T', () => {
    const { sala: _sala, ...sinSala } = LAB;
    const r = evaluarLaberintoPuerta(sinSala, dual(false));
    expect(r.estado).toBe('SIN_DATOS');
    expect(r.avisos.some((a) => /≥ 10 MV sin datos de la sala/.test(a))).toBe(true);
    const solo6 = evaluarLaberintoPuerta({ ...sinSala, puertaInstalada: { plomo_mm: 6 } }, [dual(false)[1]]);
    expect(solo6.H_neutrones_Sv).toBe(0);
    expect(solo6.requerido.bpe_mm).toBe(0);
    const n = Math.log10(solo6.H_fotones_Sv / 1e-4);
    expect(solo6.requerido.plomo_mm).toBeCloseTo(Math.max(0, n) * 6, 9);
  });

  it('10 MV cuenta neutrones y captura (máximo de la Tabla B.9 sin dato del fabricante)', () => {
    const r = evaluarLaberintoPuerta({ ...LAB, neutronesPorEnergia: undefined }, [{ nombre: '10 MV', f: { energia: 10, W_Gy_semana: 450 } }]);
    expect(r.H_neutrones_Sv).toBeGreaterThan(0);
    expect(r.H_captura_Sv).toBeGreaterThan(0);
    expect(r.porEnergia[0].fuenteNeutrones).toMatch(/Tabla B\.9/);
  });

  it('avisa si el laberinto sale del intervalo de validez de la Ec. 2.14', () => {
    const r = evaluarLaberintoPuerta({ ...LAB, dimensiones: { ancho_m: 1, alto_m: 3 } }, dual(false));
    expect(r.avisos.some((a) => /fuera del intervalo de la Ec\. 2\.14/.test(a))).toBe(true);
    expect(evaluarLaberintoPuerta(LAB, dual(false)).avisos.some((a) => /Ec\. 2\.14/.test(a))).toBe(false);
  });
});

describe('Fase 13, paso 3 — integración con el proyecto y la memoria', () => {
  const m18 = { ...MODALITIES.find((m) => m.id === 'linac-18mv')!, doseRateConstant: 3 };
  const m6 = { ...MODALITIES.find((m) => m.id === 'linac-6mv')!, doseRateConstant: 3 };
  const fuente = (id: string, modality: typeof m18, W: number): RadiationSource => ({
    id, x: 0, y: 0, name: id, modality, workloadValue: W / 3, workloadUnit: '', isocenterHeight_m: 1.3, useFactor: 0.25, imrtFraction: 0,
  });
  const plano: FloorPlan = {
    id: 'p', name: 'sala dual', imageUrl: null, scale_m_per_pixel: 1, width_pixels: 20, height_pixels: 20,
    barriers: [], occupiedRegions: [],
    sources: [fuente('l18', m18, 450), fuente('l6', m6, 225)],
    laberintos: [LAB],
  };

  it('las fuentes del plano (fracciones × Gy/fracción) dan lo mismo que §7.1', () => {
    const [r] = evaluarLaberintosDelPlano(plano);
    expect(r.fuentes).toEqual(['l18', 'l6']);
    dentro(r.H_total_Sv * 1e6, 930, 0.02);
    // fuenteIds restringe la sala.
    const [solo] = evaluarLaberintosDelPlano({ ...plano, laberintos: [{ ...LAB, fuenteIds: ['l6'] }] });
    expect(solo.fuentes).toEqual(['l6']);
  });

  it('calcularProyecto devuelve las puertas sólo si el plano declara laberintos', () => {
    expect(calcularProyecto(plano).laberintos?.[0].id).toBe('lab-1');
    expect(calcularProyecto({ ...plano, laberintos: undefined }).laberintos).toBeUndefined();
  });

  it('la memoria lleva la puerta, su criterio y sus fórmulas; sin laberintos no cambia', () => {
    const m = construirMemoria(plano, {}, { fecha: new Date('2026-11-22T00:00:00Z') });
    expect(m.puertas?.[0]).toMatchObject({ id: 'lab-1', estado: 'SIN_ESPESOR' });
    expect(m.criterios.some((c) => c.id === 'puerta')).toBe(true);
    expect(m.metodo.formulas.some((f) => f.id === 'NCRP151-2.14')).toBe(true);
    const sin = construirMemoria(planoEjemploCompleto(), {}, { fecha: new Date('2026-11-22T00:00:00Z') });
    expect(sin.puertas).toBeUndefined();
    expect(sin.criterios.some((c) => c.id === 'puerta')).toBe(false);
  });
});
