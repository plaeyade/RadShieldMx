/**
 * Depuración, etapa 6 — consolidación de funciones de cálculo duplicadas en el motor único.
 *
 * `fixtures/motor-referencia-etapa6.json` se generó en `main` ANTES de la consolidación con
 * `ESCRIBIR_REFERENCIA_ETAPA6=1 npx vitest run src/__tests__/auditoria/consolidacionMotor.test.ts`.
 * La prueba exige igualdad EXACTA (`toBe`, bit a bit; JSON guarda el número más corto que vuelve al mismo double)
 * en los casos de referencia: humo «Guíame» (7 barreras de `calcularProyecto`), F149 (8 casos), NCRP 151 §7.1.1
 * (149.6 cm) y §7.1.5 (66.4 cm), TG-108 (Ejemplos y Tabla V), Gamma Knife, HDR y mallas densas de las funciones de
 * transmisión que se consolidaron (Archer de NCRP 147 / TG-108 / catálogo y TVL único).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calcularProyecto } from '@/lib/motorProyecto';
import { espesorGammaKnifeZona, espesorHDRZona, espesorLinacZona, espesorPETZona } from '@/lib/zonaControladaMotor';
import { planoEjemploCompleto } from '@/lib/ejemploGuiado';
import { buildF149NormativeNumericQa } from '@/lib/f149NormativeNumericQa';
import { archerTransmission, inverseArcher, tvlTransmission, tvlThickness, exponentialThickness } from '@/lib/shieldingMath';
import { transmisionArcher, espesorArcher } from '@/lib/ncrp147';
import { transmisionTG108, espesorTG108, espesorPET511, TG108_TABLA_V, type MaterialTG108 } from '@/lib/transmisionTG108';
import { transmisionUnTVL } from '@/lib/ncrp151';
import { blindajePET, PET_INICIAL, espesorRequeridoHaz, CARGA_MV_INICIAL, CARGA_DIAG_INICIAL } from '@/lib/calculadorasNormativas';
import { MATERIALS, MODALITIES, type Barrier, type FloorPlan, type RadiationSource } from '@/types/radshield';

const AQUI = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(AQUI, 'fixtures', 'motor-referencia-etapa6.json');

/** NaN/±Infinity no existen en JSON: se guardan como texto. */
const n = (v: number): number | string => (Number.isFinite(v) ? v : String(v));

const modalidad = (id: string) => MODALITIES.find((m) => m.id === id)!;
const plano = (nombre: string, barriers: Barrier[], sources: RadiationSource[]): FloorPlan => ({
  id: nombre, name: nombre, imageUrl: null, width_pixels: 2000, height_pixels: 2000, scale_m_per_pixel: 0.01,
  barriers, sources, regions: [], criticalPoints: [],
} as unknown as FloorPlan);
const muro = (d_m: number, extra: Partial<Barrier> = {}): Barrier => ({
  id: 'b', name: 'b', x1: d_m * 100, y1: -150, x2: d_m * 100, y2: 150, barrierType: 'secondary', useFactor: 1,
  occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235', ...extra,
} as Barrier);
const fuente = (id: string, extra: Partial<RadiationSource>): RadiationSource => ({
  id: `s-${id}`, x: 0, y: 0, name: id, modality: modalidad(id), workloadValue: 1, workloadUnit: '', isocenterHeight_m: 0,
  useFactor: 1, ...extra,
} as RadiationSource);
const linac = (mv: 6 | 18) => fuente(`linac-${mv}mv`, { workloadValue: (mv === 18 ? 450 : 225) / 2, useFactor: 0.25, imrtFraction: 0, imrtFactor: 5 });

const barrerasDe = (p: FloorPlan) => calcularProyecto(p).barriers.map((b) => ({
  id: b.id,
  maxKerma: n(b.maxKerma ?? Number.NaN),
  requerido: Object.fromEntries(Object.entries((b.requiredThickness_mm ?? {}) as Record<string, number>).map(([k, v]) => [k, n(v)])),
}));

const ESPESORES_MM = [0, 0.1, 0.5, 1, 2, 3.7, 5, 10, 16.6, 25, 50, 100, 150, 213.77, 300, 500, 1000, 1496];
const ANGULOS_RAD = [0, 0.3, Math.PI / 6, 1.2];
const TRANSMISIONES = [1, 0.9, 0.5, 0.41, 0.189, 0.1, 0.053, 0.047, 1e-2, 1e-3, 1e-5, 1e-8, 0];

function calcularReferencia() {
  const ej = planoEjemploCompleto();
  const r711 = { tipo: 'primaria' as const, haces: [{ energia_MV: 18, W_Gy_semana: 450 }], fraccionIMRT: 0, P_mSv_semana: 0.02, T: 0.025, U: 0.25, d_m: 7.2, materialCodigo: 'concrete235' };
  const r715 = {
    tipo: 'secundaria' as const, haces: [{ energia_MV: 18, W_Gy_semana: 450 }, { energia_MV: 6, W_Gy_semana: 225 }], fraccionIMRT: 0,
    P_mSv_semana: 0.02, T: 0.025, U: 0.25, theta_deg: 30, d_m: 7.2, materialCodigo: 'CONCRETE235',
  };
  const materialesArcher = MATERIALS.filter((m) => m.archerAlpha && m.archerBeta && m.archerGamma);
  return {
    guiame: barrerasDe(ej),
    f149: buildF149NormativeNumericQa().cases.map((c) => ({ id: c.id, expected: c.expected, actual: c.actual, status: c.status })),
    ncrp151_711: {
      zona_mm: n(espesorLinacZona(r711).espesor_mm),
      motor: barrerasDe(plano('7.1.1', [muro(6.9, { barrierType: 'primary', occupancyFactor: 0.025, useFactor: 0.25 })], [linac(18)])),
    },
    ncrp151_715: {
      zona_mm: n(espesorLinacZona(r715).espesor_mm),
      motor: barrerasDe(plano('7.1.5', [muro(6.9, { occupancyFactor: 0.025, useFactor: 0.25, scatterAngle_deg: 30 })], [linac(18), linac(6)])),
    },
    gammaKnife: {
      zona_mm: n(espesorGammaKnifeZona({ fraccionesSemana: 20, dosisFraccion_Gy: 15, d_m: 4.3, P_mSv_semana: 0.02, T: 0.2, materialCodigo: 'CONCRETE235' }).espesor_mm),
      motor: barrerasDe(plano('gk', [muro(4, { occupancyFactor: 0.2 })], [fuente('gamma-knife', { workloadValue: 20 })])),
    },
    hdr: {
      zona_mm: n(espesorHDRZona({ actividad_Ci: 10, horasSemana: 4, d_m: 3.3, P_mSv_semana: 0.02, T: 1, materialCodigo: 'PB' }).espesor_mm),
      motor: barrerasDe(plano('hdr', [muro(3, { materialCode: 'PB' })], [fuente('hdr-192ir', { workloadValue: 10, workloadHoursPerWeek: 4 })])),
    },
    tg108: {
      petInicial: blindajePET(PET_INICIAL),
      zonaPET: ['PB', 'CONCRETE235', 'STEEL'].map((m) => n(espesorPETZona({ A0_MBq: 370, pacientesSemana: 30, tU_h: 1, d_m: 1.8, P_mSv_semana: 0.02, T: 1, materialCodigo: m }).espesor_mm)),
      transmision: (Object.keys(TG108_TABLA_V) as MaterialTG108[]).map((m) => ESPESORES_MM.map((x) => n(transmisionTG108(m, x)))),
      espesor: (Object.keys(TG108_TABLA_V) as MaterialTG108[]).map((m) => TRANSMISIONES.map((B) => n(espesorTG108(m, B)))),
      pet511: MATERIALS.map((m) => n(espesorPET511(10, 0.02, m))),
    },
    calculadoras: {
      mv: ['concrete', 'steel', 'lead'].map((m) => n(espesorRequeridoHaz(CARGA_MV_INICIAL, m, 0.02, 1))),
      diag: ['lead', 'concrete', 'gypsum'].map((m) => n(espesorRequeridoHaz(CARGA_DIAG_INICIAL, m, 0.02, 1))),
    },
    archer: {
      ncrp147: materialesArcher.map((m) => ESPESORES_MM.map((x) => n(transmisionArcher(x, { alpha: m.archerAlpha!, beta: m.archerBeta!, gamma: m.archerGamma! })))),
      ncrp147Inversa: materialesArcher.map((m) => TRANSMISIONES.map((B) => n(espesorArcher(B, { alpha: m.archerAlpha!, beta: m.archerBeta!, gamma: m.archerGamma! })))),
      catalogo: MATERIALS.map((m) => ANGULOS_RAD.map((t) => ESPESORES_MM.map((x) => n(archerTransmission(x, m, t))))),
      catalogoInversa: MATERIALS.map((m) => TRANSMISIONES.map((B) => n(inverseArcher(B, m)))),
    },
    tvl: {
      transmision: MATERIALS.map((m) => ['6MV', '18MV', 'Co60', '511keV', 'Ir192', 'inexistente'].map((k) => ESPESORES_MM.map((x) => n(tvlTransmission(x, m, k))))),
      unTVL: [16.6, 37, 176, 152].map((tvl) => ESPESORES_MM.map((x) => n(transmisionUnTVL(x, tvl)))),
      espesor: MATERIALS.map((m) => ['6MV', 'Co60', '511keV', 'inexistente'].map((k) => [n(tvlThickness(10, 0.02, m, k)), n(exponentialThickness(10, 0.02, m, k))])),
    },
  };
}

describe('Etapa 6 — consolidación del motor: resultados idénticos a la referencia previa', () => {
  const actual = calcularReferencia();

  if (process.env.ESCRIBIR_REFERENCIA_ETAPA6 === '1') {
    it('escribe la referencia', () => {
      mkdirSync(dirname(FIXTURE), { recursive: true });
      writeFileSync(FIXTURE, `${JSON.stringify(actual, null, 1)}\n`);
      expect(existsSync(FIXTURE)).toBe(true);
    });
    return;
  }

  const referencia = JSON.parse(readFileSync(FIXTURE, 'utf8')) as ReturnType<typeof calcularReferencia>;
  const exacto = (a: unknown) => JSON.parse(JSON.stringify(a));

  it('humo «Guíame»: las 7 barreras, kerma y espesores bit a bit (muro norte 17.96 mm Pb / 213.77 mm concreto)', () => {
    expect(actual.guiame).toHaveLength(7);
    expect(exacto(actual.guiame)).toEqual(referencia.guiame);
    const norte = actual.guiame.find((b) => b.id === 'eg-captacion-norte')!;
    expect(Number(norte.requerido.PB)).toBeCloseTo(17.96, 2);
    expect(Number(norte.requerido.CONCRETE235)).toBeCloseTo(213.77, 2);
  });

  it('F149: los 8 casos iguales y en «pass»', () => {
    expect(actual.f149).toEqual(referencia.f149);
    expect(actual.f149.every((c) => c.status === 'pass')).toBe(true);
  });

  it('NCRP 151 §7.1.1 (149.6 cm) y §7.1.5 (66.4 cm): zona controlada y motorProyecto bit a bit', () => {
    expect(exacto(actual.ncrp151_711)).toEqual(referencia.ncrp151_711);
    expect(exacto(actual.ncrp151_715)).toEqual(referencia.ncrp151_715);
    expect(Math.abs(Number(actual.ncrp151_711.zona_mm) / 10 - 149.6) / 149.6).toBeLessThanOrEqual(0.015);
    expect(Math.abs(Number(actual.ncrp151_715.zona_mm) / 10 - 66.4) / 66.4).toBeLessThanOrEqual(0.015);
  });

  it('Gamma Knife y HDR: zona controlada y motorProyecto bit a bit', () => {
    expect(exacto(actual.gammaKnife)).toEqual(referencia.gammaKnife);
    expect(exacto(actual.hdr)).toEqual(referencia.hdr);
  });

  it('TG-108: Ejemplo 1, zona PET, Tabla V (transmisión e inversa) y espesor 511 keV del catálogo bit a bit', () => {
    expect(exacto(actual.tg108)).toEqual(referencia.tg108);
    expect(exacto(actual.calculadoras)).toEqual(referencia.calculadoras);
  });

  it('transmisión de Archer (NCRP 147, catálogo con oblicuidad) y TVL único: mallas densas bit a bit', () => {
    expect(exacto(actual.archer)).toEqual(referencia.archer);
    expect(exacto(actual.tvl)).toEqual(referencia.tvl);
  });
});
