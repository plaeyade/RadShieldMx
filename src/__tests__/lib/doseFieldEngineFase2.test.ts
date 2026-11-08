/**
 * Fase 2 del motor de campo (docs/plan-motores-calculo.md): componentes primaria/fuga/dispersión de
 * NCRP 151 frente a los ejemplos resueltos del §7.1 (mismos datos que ncrp151.test.ts y
 * normativeBarrierEngine.test.ts), consistencia campo ↔ motor normativo en los puntos de muestreo,
 * oblicuidad (§2.2, p. 24), espesor geométrico, presencia de la primaria y preblindaje NCRP 147.
 */
import { describe, expect, it } from 'vitest';
import {
  cuerdaEnBarrera,
  dosisEnPunto,
  enHazPrimario,
  kermaComponente,
  normalProtegida,
  type ComponenteCampo,
  type DosisEnPunto,
} from '@/lib/doseFieldEngine';
import { calcularBarreraNormativa } from '@/lib/normativeBarrierEngine';
import { generateSamplePoints } from '@/lib/shieldingMath';
import {
  OBLICUIDAD_MAX_DATOS_DEG,
  TABLA_B_2,
  TABLA_B_7,
  cargaFuga,
  transmisionTVL,
  transmisionUnTVL,
  tvlDispersionConcreto,
} from '@/lib/ncrp151';
import { TABLA_B_1, transmisionArcher } from '@/lib/ncrp147';
import { MATERIALS, MODALITIES, type Barrier, type Modality, type RadiationSource } from '@/types/radshield';

const modalidad = (id: string): Modality => MODALITIES.find((m) => m.id === id)!;
const fuente = (id: string, extra: Partial<RadiationSource> = {}): RadiationSource => ({
  id: `s-${id}`, x: 0, y: 0, name: id, modality: modalidad(id),
  workloadValue: 100, workloadUnit: '', isocenterHeight_m: 0, useFactor: 1, ...extra,
});
const barrera = (extra: Partial<Barrier> = {}): Barrier => ({
  id: 'b', x1: 3, y1: -50, x2: 3, y2: 50, name: 'muro', barrierType: 'primary',
  useFactor: 1, occupancyFactor: 1, designGoal_mSv_per_wk: 0.1, materialCode: 'CONCRETE235', ...extra,
});
const comp = (d: DosisEnPunto, c: ComponenteCampo, i = 0) => d.porFuente[i].componentes.find((x) => x.componente === c);

// NCRP 151 §7.1: acelerador dual 6/18 MV, W(18) = 450 y W(6) = 225 Gy/semana; P = 20 µSv/semana, T = 1/40.
// W = fracciones × Gy/fracción: 150 × 3 y 75 × 3. Sin IMRT en §7.1.1/§7.1.5 (el §7.1.4 lo trata aparte).
const W3 = (id: string) => ({ ...modalidad(id), doseRateConstant: 3 });
const linac18 = (extra: Partial<RadiationSource> = {}) =>
  fuente('linac-18mv', { id: 's18', workloadValue: 150, modality: W3('linac-18mv'), imrtFraction: 0, ...extra });
const linac6 = (extra: Partial<RadiationSource> = {}) =>
  fuente('linac-6mv', { id: 's6', workloadValue: 75, modality: W3('linac-6mv'), imrtFraction: 0, ...extra });
const PT = 0.02 / 0.025; // P/T = 0.8 mSv/semana

/** Muro cuya cara exterior queda a 0.3 m del punto protegido situado a d del blanco (escala 1 m/px). */
const muroAntesDe = (d_m: number, t_mm: number, extra: Partial<Barrier> = {}) => {
  const x = d_m - 0.3 - t_mm / 1000;
  return barrera({ x1: x, x2: x, thickness_mm: t_mm, useFactor: 0.25, occupancyFactor: 0.025, designGoal_mSv_per_wk: 0.02, ...extra });
};

describe('Fase 2 — componentes NCRP 151 frente a los ejemplos del §7.1', () => {
  it('§7.1.1 primaria 18 MV: tras 149.6 cm de concreto el kerma primario a 7.2 m es P/T', () => {
    const d = dosisEnPunto([linac18()], 7.2, 0, 1, { barriers: [muroAntesDe(7.2, 1496)] });
    const p = comp(d, 'primaria')!;
    expect(p.kermaSinBlindaje_mSv_semana).toBeCloseTo((450 * 0.25 * 1000) / 7.2 ** 2, 9);
    expect(p.transmision).toBeCloseTo(3.69e-4, 5); // B publicado
    expect(p.kerma_mSv_semana / PT).toBeCloseTo(1, 2);
    // Fuga y dispersión detrás de la primaria: < 1 % (NCRP 151 las desprecia en barreras primarias).
    expect((d.kerma_mSv_semana - p.kerma_mSv_semana) / p.kerma_mSv_semana).toBeLessThan(0.01);
  });

  it('§7.1.5 dispersión del paciente a 30° en A: 46.1 cm (18 MV) y 30.7 cm (6 MV) dejan P/T', () => {
    const s18 = dosisEnPunto([linac18()], 7.2, 0, 1, { barriers: [muroAntesDe(7.2, 461, { barrierType: 'secondary', scatterAngle_deg: 30 })] });
    const s6 = dosisEnPunto([linac6()], 7.2, 0, 1, { barriers: [muroAntesDe(7.2, 307, { barrierType: 'secondary', scatterAngle_deg: 30 })] });
    // Los espesores publicados están redondeados a 0.1 cm (TVL ≈ 26–32 cm): ±1 %.
    expect(Math.abs(comp(s18, 'dispersion')!.kerma_mSv_semana / PT - 1)).toBeLessThan(0.01);
    expect(Math.abs(comp(s6, 'dispersion')!.kerma_mSv_semana / PT - 1)).toBeLessThan(0.01);
    expect(comp(s18, 'dispersion')!.transmision).toBeCloseTo(transmisionUnTVL(46.1, tvlDispersionConcreto(18, 30)), 12);
    expect(comp(s18, 'primaria')).toBeUndefined();
  });

  it('§7.1.5 fuga en A: 37.3 cm (18 MV) y 25 cm (6 MV) dejan P/T (Tabla B.7, TVL₁/TVLₑ)', () => {
    const l18 = dosisEnPunto([linac18()], 7.2, 0, 1, { barriers: [muroAntesDe(7.2, 373, { barrierType: 'secondary' })] });
    const l6 = dosisEnPunto([linac6()], 7.2, 0, 1, { barriers: [muroAntesDe(7.2, 250, { barrierType: 'secondary' })] });
    expect(comp(l18, 'fuga')!.kerma_mSv_semana / PT).toBeCloseTo(1, 1);
    expect(comp(l6, 'fuga')!.kerma_mSv_semana / PT).toBeCloseTo(1, 1);
    expect(comp(l18, 'fuga')!.transmision).toBeCloseTo(transmisionTVL(37.3, TABLA_B_7['18']), 12);
  });

  it('§7.1.5 total en A (66.4 cm, regla de dos fuentes): fuga + dispersión de 6 y 18 MV ≤ P/T', () => {
    const d = dosisEnPunto([linac18(), linac6()], 7.2, 0, 1, {
      barriers: [muroAntesDe(7.2, 664, { barrierType: 'secondary', scatterAngle_deg: 30 })],
    });
    expect(d.kerma_mSv_semana).toBeLessThanOrEqual(PT);
    // La regla de dos fuentes es conservadora pero no exagerada: el campo queda dentro de un TVL de P/T.
    expect(d.kerma_mSv_semana).toBeGreaterThan(PT / 10);
  });

  it('§7.1.4 IMRT: la fuga sin blindaje usa W_L = cargaFuga (945 Gy/semana con 80 % y C_I = 5)', () => {
    const s = linac6({ imrtFraction: 0.8, imrtFactor: 5 });
    const d = dosisEnPunto([s], 7.2, 0, 1);
    expect(cargaFuga({ energia: 6, W_Gy_semana: 225, fraccionIMRT: 0.8, factorIMRT: 5 })).toBeCloseTo(945, 9);
    expect(comp(d, 'fuga')!.kermaSinBlindaje_mSv_semana).toBeCloseTo((1e-3 * 945 * 1000) / 7.2 ** 2, 9);
  });
});

describe('Fase 2 — consistencia campo ↔ normativeBarrierEngine en los puntos de muestreo', () => {
  /** Calcula la barrera con el motor normativo, instala el espesor y evalúa el campo en sus puntos. */
  function caso(b: Barrier, fuentes: RadiationSource[], materialCode: string) {
    const puntos0 = generateSamplePoints(b, 1, fuentes);
    const r = calcularBarreraNormativa(b, fuentes, puntos0, 1, MATERIALS)!;
    const instalada = { ...b, materialCode, thickness_mm: r.espesores_mm[materialCode] };
    const puntos = generateSamplePoints(instalada, 1, fuentes);
    // El motor normativo dimensiona con los puntos a 0.3 m de la cara exterior de la barrera instalada.
    const r2 = calcularBarreraNormativa(instalada, fuentes, puntos, 1, MATERIALS)!;
    instalada.thickness_mm = r2.espesores_mm[materialCode];
    const campo = puntos.map((p) => dosisEnPunto(fuentes, p.x, p.y, 1, { barriers: [instalada] }));
    return { r: r2, campo, puntos, instalada, PT: b.designGoal_mSv_per_wk / b.occupancyFactor };
  }

  it('teleterapia primaria (§7.1.1 en el lienzo): primaria del campo = P/T en el peor punto; total ≤ P/T + 1 %', () => {
    const b = barrera({ x1: 6.9 - 1.5, x2: 6.9 - 1.5, y1: -2, y2: 2, useFactor: 0.25, occupancyFactor: 0.025, designGoal_mSv_per_wk: 0.02 });
    const { campo, PT: pt } = caso(b, [linac18()], 'CONCRETE235');
    const prim = Math.max(...campo.map((d) => kermaComponente(d, 'primaria')));
    expect(prim / pt).toBeCloseTo(1, 6);
    expect(Math.max(...campo.map((d) => d.kerma_mSv_semana)) / pt).toBeLessThan(1.01);
  });

  it('teleterapia secundaria con IMRT por omisión, 6 + 18 MV: campo ≤ P/T en todos los puntos (concreto, plomo, acero)', () => {
    for (const mat of ['CONCRETE235', 'PB', 'STEEL']) {
      const b = barrera({ barrierType: 'secondary', x1: 5, x2: 5, y1: -3, y2: 3, useFactor: 0.25, occupancyFactor: 0.05, designGoal_mSv_per_wk: 0.02, scatterAngle_deg: 45 });
      const { campo, PT: pt } = caso(b, [linac18({ imrtFraction: undefined }), linac6({ imrtFraction: undefined })], mat);
      const max = Math.max(...campo.map((d) => d.kerma_mSv_semana));
      expect(max).toBeLessThanOrEqual(pt * (1 + 1e-9));
      expect(max).toBeGreaterThan(pt / 10);
    }
  });

  it('NCRP 147 §5.2 (tórax, 300 pacientes, 3 m, 2.2 mm Pb): el campo a 0.3 m = P/T (primaria + 0.3 % secundaria)', () => {
    const b = barrera({ x1: 2.7, x2: 2.7, y1: -1, y2: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'PB' });
    const s = fuente('rad-chest', { workloadValue: 300 });
    const { r, campo, PT: pt } = caso(b, [s], 'PB');
    const prim = Math.max(...campo.map((d) => kermaComponente(d, 'primaria147')));
    expect(prim / pt).toBeCloseTo(1, 6);
    expect(Math.max(...campo.map((d) => d.kerma_mSv_semana)) / pt).toBeLessThan(1.01);
    // kerma sin blindaje: el mismo término de la Tabla 4.5 en los dos motores.
    const k0 = Math.max(...campo.map((d) => d.porFuente[0].componentes.find((c) => c.componente === 'primaria147')!.kermaSinBlindaje_mSv_semana));
    expect(k0).toBeCloseTo(r.kermaMax_mSv_semana, 9);
  });

  it('NCRP 147 fluoroscopía (sólo secundaria, Tabla 4.7/C.1) con dos fuentes: campo ≤ P/T (el normativo ignora la oblicuidad)', () => {
    const b = barrera({ barrierType: 'secondary', x1: 3, x2: 3, y1: -2, y2: 2, designGoal_mSv_per_wk: 0.02, materialCode: 'PB' });
    const fuentes = [fuente('fluoro-routine', { id: 'f1', workloadValue: 50 }), fuente('fluoro-gi', { id: 'f2', y: 1, workloadValue: 30 })];
    const { campo, puntos, instalada, PT: pt } = caso(b, fuentes, 'PB');
    const max = Math.max(...campo.map((d) => d.kerma_mSv_semana));
    expect(max).toBeLessThanOrEqual(pt * (1 + 1e-9));
    expect(max / pt).toBeGreaterThan(0.9);
    // Sin crédito por oblicuidad (tope 0°) el campo reproduce la suma Σ Kᵢ·Bᵢ = P/T del motor normativo.
    const normal = puntos.map((p) => dosisEnPunto(fuentes, p.x, p.y, 1, { barriers: [instalada], anguloMaxOblicuidad_deg: 0 }));
    expect(Math.max(...normal.map((d) => d.kerma_mSv_semana)) / pt).toBeCloseTo(1, 6);
    expect(campo.every((d) => d.porFuente.every((f) => f.componentes.every((c) => c.componente === 'secundaria147')))).toBe(true);
  });
});

describe('Fase 2 — oblicuidad (NCRP 151 §2.2, p. 24)', () => {
  const muro = (t_mm: number) => barrera({ x1: 3, x2: 3, y1: -500, y2: 500, thickness_mm: t_mm });
  const y60 = 6 * Math.tan((60 * Math.PI) / 180); // punto (6, y60): rayo a 60° de la normal del muro x = 3

  it('θ = 60° y B < 10⁻³: espesor oblicuo t/cos θ con +1 HVL (MV)', () => {
    const t = 1500;
    const d = dosisEnPunto([linac18()], 6, y60, 1, { barriers: [muro(t)] });
    const c = comp(d, 'primaria')!.cruces[0];
    expect(c.cosTheta).toBeCloseTo(0.5, 9);
    const Bobl = transmisionTVL((t / 0.5) / 10, TABLA_B_2.concrete['18']);
    expect(Bobl).toBeLessThan(1e-3);
    expect(c.hvlDescontados).toBe(1);
    expect(c.transmision).toBeCloseTo(Bobl * 2, 14);
  });

  it('Co-60 (teleterapia, «tele-co60»): +2 HVL; la corrección nunca supera la transmisión normal', () => {
    const co = fuente('linac-6mv', {
      modality: { ...modalidad('linac-6mv'), id: 'tele-co60', name: 'Co-60', energyLabel: '1.25 MeV γ (Co-60)' },
    });
    const t = 600;
    const d = dosisEnPunto([co], 6, y60, 1, { barriers: [muro(t)] });
    const c = comp(d, 'primaria')!.cruces[0];
    const Bobl = transmisionTVL((t / 0.5) / 10, TABLA_B_2.concrete.Co60);
    const Bnor = transmisionTVL(t / 10, TABLA_B_2.concrete.Co60);
    expect(c.hvlDescontados).toBe(2);
    expect(c.transmision).toBeCloseTo(Math.min(Bnor, Bobl * 4), 14);
  });

  it(`sin crédito adicional más allá de ${OBLICUIDAD_MAX_DATOS_DEG}° (tope del motor)`, () => {
    const t = 500;
    const ang = (80 * Math.PI) / 180;
    const d = dosisEnPunto([linac18()], 6, 3 * Math.tan(ang) * 2, 1, { barriers: [muro(t)] });
    const c = comp(d, 'primaria')!.cruces[0];
    expect(c.factorOblicuidad).toBeCloseTo(1 / Math.cos((OBLICUIDAD_MAX_DATOS_DEG * Math.PI) / 180), 9);
  });

  it('θ ≤ 45°: espesor oblicuo sin corrección; la dispersión del paciente no recibe crédito por oblicuidad', () => {
    const t = 1200;
    const d = dosisEnPunto([linac18()], 6, 6, 1, { barriers: [muro(t)] });
    const p = comp(d, 'primaria')!.cruces[0];
    expect(p.hvlDescontados).toBe(0);
    expect(p.transmision).toBeCloseTo(transmisionTVL((t * Math.SQRT2) / 10, TABLA_B_2.concrete['18']), 14);
    const s = comp(d, 'dispersion')!.cruces[0];
    expect(s.capas[0].recorrido_mm).toBeCloseTo(t, 9);
    expect(s.transmision).toBeCloseTo(transmisionUnTVL(t / 10, tvlDispersionConcreto(18, 30)), 14);
  });
});

describe('Fase 2 — espesor geométrico de la barrera', () => {
  it('la banda va de la línea (cara interior) hacia el lado opuesto a las fuentes', () => {
    const b = { x1: 3, y1: -1, x2: 3, y2: 1 };
    expect(normalProtegida(b, { x: 0, y: 0 }).nx).toBeCloseTo(1, 12);
    expect(normalProtegida({ x1: 3, y1: 1, x2: 3, y2: -1 }, { x: 0, y: 0 }).nx).toBeCloseTo(1, 12);
    expect(normalProtegida(b, { x: 6, y: 0 }).nx).toBeCloseTo(-1, 12);
  });

  it('cuerda: t/cos θ al cruzar entera, parcial con el punto dentro del muro, recortada en la esquina', () => {
    const b = { x1: 3, y1: -1, x2: 3, y2: 1 };
    const n = { nx: 1, ny: 0 };
    expect(cuerdaEnBarrera(0, 0, 6, 0, b, 0.5, n)!.cuerda).toBeCloseTo(0.5, 12);
    expect(cuerdaEnBarrera(0, 0, 6, 6, { x1: 3, y1: -10, x2: 3, y2: 10 }, 0.5, n)!.cuerda).toBeCloseTo(0.5 * Math.SQRT2, 12);
    expect(cuerdaEnBarrera(0, 0, 3.2, 0, b, 0.5, n)!.cuerda).toBeCloseTo(0.2, 12);
    // Rayo que entra por la cara interior junto al extremo y sale por el canto del muro (y = 1.1).
    const esquina = cuerdaEnBarrera(0, 0, 6, 2, { x1: 3, y1: -1, x2: 3, y2: 1.1 }, 0.5, n)!;
    expect(esquina.cuerda).toBeCloseTo(0.3 / Math.cos(Math.atan(2 / 6)), 9);
    expect(cuerdaEnBarrera(0, 0, 2.9, 0, b, 0.5, n)).toBeNull();
  });

  it('un punto dentro del muro recibe la atenuación del espesor recorrido, no del total', () => {
    const s = linac18();
    const b = barrera({ thickness_mm: 1000 });
    const d = dosisEnPunto([s], 3.4, 0, 1, { barriers: [b] });
    expect(comp(d, 'primaria')!.cruces[0].capas[0].recorrido_mm).toBeCloseTo(400, 6);
    expect(comp(d, 'primaria')!.transmision).toBeCloseTo(transmisionTVL(40, TABLA_B_2.concrete['18']), 12);
  });
});

describe('Fase 2 — dónde llega la primaria', () => {
  it('sin orientación del gantry: tras barrera primaria sí, tras barrera sólo secundaria no, en la sala sí', () => {
    const s = linac18();
    const prim = dosisEnPunto([s], 6, 0, 1, { barriers: [barrera({ barrierType: 'primary', thickness_mm: 1000 })] });
    const sec = dosisEnPunto([s], 6, 0, 1, { barriers: [barrera({ barrierType: 'secondary', thickness_mm: 1000 })] });
    const sala = dosisEnPunto([s], 2, 0, 1, { barriers: [barrera({ barrierType: 'secondary', thickness_mm: 1000 })] });
    expect(comp(prim, 'primaria')).toBeDefined();
    expect(comp(sec, 'primaria')).toBeUndefined();
    expect(comp(sala, 'primaria')).toBeDefined();
  });

  it('con ejeGantry_deg: la primaria sólo en la franja que barre el haz (semidiagonal 0.283 · (d + SAD))', () => {
    const s = linac18({ ejeGantry_deg: 90 }); // eje a lo largo de y: el haz barre el eje x
    expect(enHazPrimario(s, 6, 0, 1)).toBe(true);
    expect(enHazPrimario(s, 6, 0.283 * 7 - 0.01, 1)).toBe(true);
    expect(enHazPrimario(s, 6, 0.283 * 7 + 0.05, 1)).toBe(false);
    expect(enHazPrimario(linac18(), 6, 0, 1)).toBeNull();
    const fuera = dosisEnPunto([s], 0, 6, 1, { barriers: [barrera({ x1: -50, y1: 3, x2: 50, y2: 3, barrierType: 'primary', thickness_mm: 500 })] });
    expect(comp(fuera, 'primaria')).toBeUndefined();
    expect(comp(fuera, 'fuga')).toBeDefined();
  });
});

describe('Fase 2 — diagnóstico NCRP 147', () => {
  it('primaria (Tabla 4.5) y secundaria (Tabla 4.7, 135°) separadas; sin barreras ambas en la sala', () => {
    const s = fuente('rad-chest', { workloadValue: 300 });
    const d = dosisEnPunto([s], 3, 0, 1);
    expect(comp(d, 'primaria147')!.kermaSinBlindaje_mSv_semana).toBeCloseTo((1.2 * 300) / 9, 9);
    expect(comp(d, 'secundaria147')!.kermaSinBlindaje_mSv_semana).toBeCloseTo((3.6e-3 * 300) / 9, 9);
  });

  it('preblindaje de la Tabla 4.6 (opcional): se suma al primer espesor de plomo de la primaria', () => {
    const s = fuente('rad-chest', { workloadValue: 300 });
    const b = barrera({ materialCode: 'PB', thickness_mm: 1 });
    const sin = dosisEnPunto([s], 6, 0, 1, { barriers: [b] });
    const con = dosisEnPunto([s], 6, 0, 1, { barriers: [b], preblindaje: 'mesa_o_bucky_de_mesa' });
    expect(comp(sin, 'primaria147')!.transmision).toBeCloseTo(transmisionArcher(1, TABLA_B_1.chest_room.lead), 12);
    expect(comp(con, 'primaria147')!.transmision).toBeCloseTo(transmisionArcher(1.85, TABLA_B_1.chest_room.lead), 12);
    // Sin barrera de plomo/concreto el preblindaje se acredita como plomo.
    const sala = dosisEnPunto([s], 2, 0, 1, { barriers: [b], preblindaje: 'sin_rejilla' });
    expect(comp(sala, 'primaria147')!.transmision).toBeCloseTo(transmisionArcher(0.3, TABLA_B_1.chest_room.lead), 12);
  });
});
