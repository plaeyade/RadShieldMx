/**
 * NCRPValidationSuite — suite de validación del motor (diálogo «NCRP Validation Suite»).
 *
 * Fase 8b: antes cada caso era `calc: () => expected` (devolvía el valor esperado sin calcular) y la suite informaba
 * siempre «24/24, motor validado»; además los «TVL» de NCRP 147 eran HVL. Ahora cada caso llama al motor real
 * (`normativeBarrierEngine`, `ncrp147`, `ncrp151`, `calculadorasNormativas`, `tg108`) y lo compara con un valor
 * PUBLICADO de un ejemplo resuelto: NCRP 147 §5 (pp. 72–83), NCRP 151 §7.1 (pp. 105–115) y AAPM TG-108 (Ejemplos 1–2,
 * Tablas IV–V). Si el motor deja de reproducir el valor dentro de la tolerancia, el caso falla.
 */
import { calcularBarreraNormativa } from '../normativeBarrierEngine';
import { barreraPrimaria } from '../ncrp147';
import { cargaFuga, combinarDosFuentes, dispersion, fuga, primaria } from '../ncrp151';
import { blindajePET, transmisionPET } from '../calculadorasNormativas';
import { dosisSemanalTG108 } from '../tg108';
import { MATERIALS, MODALITIES, type Barrier, type Modality, type RadiationSource } from '@/types/radshield';

// ─── Tipos granulares (ISP) ───
export interface ValCase {
  readonly id: string;
  readonly name: string;
  readonly source: string;
  readonly expected: number;
  readonly tolerance: number;
  readonly category: string;
  readonly calc: () => number;
}

export interface ValResult {
  readonly caseId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly diffPercent: number;
  readonly details: string;
}

export interface SuiteSummary {
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly maxDiff: number;
  readonly avgDiff: number;
  readonly allPassed: boolean;
}

// ─── Funcion pura: evaluar un caso (SRP) ───
const evalCase = (c: ValCase): ValResult => {
  try {
    const actual = c.calc();
    const dp = Math.abs((actual - c.expected) / c.expected) * 100;
    return {
      caseId: c.id,
      name: c.name,
      passed: dp <= c.tolerance,
      diffPercent: dp,
      details: `${c.name} | exp=${c.expected.toExponential(3)} act=${actual.toExponential(3)} diff=${dp.toFixed(1)}%`,
    };
  } catch {
    return { caseId: c.id, name: c.name, passed: false, diffPercent: Infinity, details: `${c.id}: ERROR` };
  }
};

// ─── Funcion pura: resumir resultados (SRP) ───
const summarize = (results: readonly ValResult[]): SuiteSummary => {
  const diffs = results.map(r => r.diffPercent).filter(d => d !== Infinity);
  const passed = results.filter(r => r.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    maxDiff: diffs.length ? Math.max(...diffs) : 0,
    avgDiff: diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0,
    allPassed: passed === results.length,
  };
};

// ─── Funcion pura: CSV (SRP) ───
const toCSV = (results: readonly ValResult[]): string =>
  ['CaseID,Nombre,Diff%,Estado', ...results.map(r => `${r.caseId},"${r.name}",${r.diffPercent.toFixed(2)},${r.passed ? 'PASS' : 'FAIL'}`)].join('\n');

// ─── Funcion pura: compliance text (SRP) ───
const complianceText = (s: SuiteSummary): string =>
  [`NCRP Validation: ${s.passed}/${s.total} OK`, `maxDiff=${s.maxDiff.toFixed(2)}% avgDiff=${s.avgDiff.toFixed(2)}%`, s.allPassed ? '✓ El motor reproduce los ejemplos publicados (validado)' : `⚠ ${s.failed} casos fallaron`].join('\n');

// ─── Casos: valor publicado frente al motor ───
const modalidad = (id: string): Modality =>
  MODALITIES.find((m) => m.id === id) ?? { id, name: id, description: id, category: 'diagnostic', standard: 'NCRP147', unit: 'mGy/paciente' };
const fuente = (id: string, N: number): RadiationSource => ({
  id: `s-${id}`, x: 0, y: 0, name: id, modality: modalidad(id), workloadValue: N, workloadUnit: 'pacientes/semana', isocenterHeight_m: 0, useFactor: 1,
});
const barrera = (d: number, extra: Partial<Barrier> = {}): Barrier => ({
  id: 'b', x1: d / 2, y1: -2, x2: d / 2, y2: 2, name: 'barrera', barrierType: 'secondary', useFactor: 1,
  occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'PB', ...extra,
});
/** Motor normativo del diseñador: fuente en (0, 0), punto en (d, 0), escala 1 m/px. */
const motor = (mod: string, N: number, d: number, extra: Partial<Barrier> = {}) => {
  const r = calcularBarreraNormativa(barrera(d, extra), [fuente(mod, N)], [{ x: d, y: 0 }], 1, MATERIALS);
  if (!r) throw new Error('el motor no devolvió resultado');
  return r;
};
const caso = (id: string, name: string, source: string, expected: number, tolerance: number, category: string, calc: () => number): ValCase =>
  ({ id, name, source, expected, tolerance, category, calc });
const f18 = { energia: 18 as const, W_Gy_semana: 450 };
const f6 = { energia: 6 as const, W_Gy_semana: 225 };
const nc = { P_Sv_semana: 20e-6, T: 0.025 };
const tg = { nuclido: 'F18' as const, A0_MBq: 555, pacientesSemana: 40, tU_h: 1, tI_h: 0.5 };

const CASES: readonly ValCase[] = [
  // NCRP 147 §5 (tolerancias del informe: kerma ±4 %, espesor ±5 % por lectura de figuras/redondeo)
  caso('147-5.1-K', 'Angiografía cardiaca: K_sec = 5.9 mGy/sem', 'NCRP 147 §5.1 p. 72', 5.9, 4, 'NCRP147', () => motor('angio-cardiac', 25, 4).kermaMax_mSv_semana),
  caso('147-5.1-Pb', 'Angiografía cardiaca: 1.3 mm Pb', 'NCRP 147 §5.1 p. 72', 1.3, 5, 'NCRP147', () => motor('angio-cardiac', 25, 4).espesores_mm.PB),
  caso('147-5.2-K', 'Tórax dedicado, primaria: K_P = 40 mGy/sem', 'NCRP 147 §5.2 p. 73', 40, 4, 'NCRP147', () => motor('rad-chest', 300, 3, { barrierType: 'primary' }).kermaMax_mSv_semana),
  caso('147-5.2-Pb', 'Tórax dedicado, primaria: 2.2 mm Pb', 'NCRP 147 §5.2 p. 73', 2.2, 5, 'NCRP147', () => motor('rad-chest', 300, 3, { barrierType: 'primary' }).espesores_mm.PB),
  caso('147-5.3.1.1-K', 'Piso bajo la mesa: K = 39 mGy/sem', 'NCRP 147 §5.3.1.1 p. 76', 39, 4, 'NCRP147', () => motor('rad-abdomen', 125, 4.1, { barrierType: 'primary', materialCode: 'CONCRETE235' }).kermaMax_mSv_semana),
  caso('147-5.3.1.1-C', 'Piso bajo la mesa: 107 mm de concreto', 'NCRP 147 §5.3.1.1 p. 76', 107, 5, 'NCRP147', () => motor('rad-abdomen', 125, 4.1, { barrierType: 'primary', materialCode: 'CONCRETE235' }).espesores_mm.CONCRETE235),
  caso('147-5.3.3.1', 'Muro del receptor de tórax: 1.3 mm Pb', 'NCRP 147 §5.3.3.1 p. 79', 1.3, 5, 'NCRP147', () => barreraPrimaria({
    distribucion: 'rad_room_chest_bucky', material: 'lead', P_mGy_semana: 0.02, T: 0.2, U: 1, N_pacientes_semana: 125, dP_m: 2.5,
  }).espesor_total_mm),
  // NCRP 151 §7.1 (doble energía 18/6 MV; espesor ±1.5 %)
  caso('151-7.1.1', 'Primaria en C (18 MV): 149.6 cm', 'NCRP 151 §7.1.1 p. 107', 149.6, 1.5, 'NCRP151', () => primaria(f18, { ...nc, U: 0.25, d_m: 7.2 }).espesor_cm),
  caso('151-7.1.5-S18', 'Dispersión a 30° (18 MV): 46.1 cm', 'NCRP 151 §7.1.5 p. 114', 46.1, 1.5, 'NCRP151', () => dispersion(f18, { ...nc, U: 0.25, dsec_m: 7.2, theta_deg: 30 }).espesor_cm),
  caso('151-7.1.5-L18', 'Fuga (18 MV): 37.3 cm', 'NCRP 151 §7.1.5 p. 114', 37.3, 1.5, 'NCRP151', () => fuga(f18, { ...nc, dL_m: 7.2 }).espesor_cm),
  caso('151-7.1.5-T', 'Secundaria en A, total: 66.4 cm', 'NCRP 151 §7.1.5 p. 115', 66.4, 1.5, 'NCRP151', () => combinarDosFuentes([
    { espesor_cm: combinarDosFuentes([dispersion(f18, { ...nc, U: 0.25, dsec_m: 7.2, theta_deg: 30 }), dispersion(f6, { ...nc, U: 0.25, dsec_m: 7.2, theta_deg: 30 })]), tvl_cm: 32, nombre: 'dispersión' },
    { espesor_cm: combinarDosFuentes([fuga(f18, { ...nc, dL_m: 7.2 }), fuga(f6, { ...nc, dL_m: 7.2 })]), tvl_cm: 36, nombre: 'fuga' },
  ])),
  caso('151-7.1.4', 'IMRT: W_L(6 MV) = 945 Gy/sem', 'NCRP 151 §7.1.4 p. 112', 945, 0.1, 'NCRP151', () => cargaFuga({ ...f6, fraccionIMRT: 0.8, factorIMRT: 5 })),
  // AAPM TG-108
  caso('TG108-E1-B', 'Ejemplo 1 (captación, 4 m): B = 0.189', 'AAPM TG-108 Ejemplo 1', 0.189, 2, 'TG108', () => blindajePET({ ...tg, sala: 'captacion', d_m: 4, P_mSv_semana: 0.02, T: 1 }).B_requerida),
  caso('TG108-E2-D', 'Ejemplo 2 (imagen, 3 m): 59.7 μSv/sem', 'AAPM TG-108 Ejemplo 2', 59.7, 2, 'TG108', () => dosisSemanalTG108({ ...tg, sala: 'imagen', d_m: 3 })),
  caso('TG108-IV-Pb', 'Tabla V vs Tabla IV: 10 mm Pb, B = 0.2485', 'AAPM TG-108 Tablas IV–V', 0.2485, 5, 'TG108', () => transmisionPET('lead', 10)),
  caso('TG108-IV-C', 'Tabla V vs Tabla IV: 10 cm concreto, B = 0.3987', 'AAPM TG-108 Tablas IV–V', 0.3987, 5, 'TG108', () => transmisionPET('concrete', 100)),
  caso('TG108-IV-Fe', 'Tabla V vs Tabla IV: 5 cm hierro, B = 0.1479', 'AAPM TG-108 Tablas IV–V', 0.1479, 5, 'TG108', () => transmisionPET('iron', 50)),
];

// ─── API publica: pipeline funcional ───
export const runValidation = (cases: readonly ValCase[] = CASES): readonly ValResult[] => cases.map(evalCase);
export { summarize, toCSV, complianceText, CASES };
