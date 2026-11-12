/**
 * Fase 11, etapa 8 — cálculo preliminar de la zona controlada (diálogo «Layout de búnker») con las funciones del
 * motor validado, no con las fórmulas propias de `uaqProtocol`.
 *
 * Antes `controlledZoneCalculationAdapter` llamaba a `uaqProtocol`, que:
 * - LINAC: un solo TVL (sin TVL₁/TVLₑ) y la secundaria con su propio modelo de fuga/dispersión;
 * - PET/CT: K = Γ·A·N·t/d² sin decaimiento ni absorción del paciente y TVL de **6 MV** (37 cm de concreto) para 511 keV;
 * - Gamma Knife: B = P/K sin factor de ocupación T;
 * - HDR: Γ en R·m²/(Ci·h) con 4.69 (valor en R·cm²/(mCi·h)) y R → mSv con 0.00876 (≈ 100× menos kerma).
 *
 * Ahora cada familia usa lo mismo que `motorProyecto`:
 * - LINAC: `barreraMV` (NCRP 151 Ec. 2.1, 2.3, 2.7, 2.8; Tablas B.2, B.4, B.5a, B.7; regla de dos fuentes y suma
 *   directa, el mayor), las mismas funciones de `ncrp151.ts` que usa `normativeBarrierEngine` para teleterapia.
 * - PET/CT: kerma de `dosisSemanalTG108` (AAPM TG-108 Ec. 2–3, sala de captación) y espesor de `exponentialThickness`
 *   con el TVL de 511 keV del catálogo, como el motor para fuentes PET con datos TG-108.
 * - Gamma Knife y HDR Ir-192: el kerma de `calculateUnshieldedKerma` del motor (Gamma Knife: D·f·U/d²; HDR: Γδ de
 *   kerma en aire del catálogo, 0.111 μGy·m²/(MBq·h), por actividad y horas) y `tvlThickness` con el TVL de Co-60 o
 *   Ir-192 del catálogo, con B = P/(T·K), como `motorProyecto` para las modalidades `gamma-knife` y `hdr-192ir`.
 *
 * Todas las salidas son preliminares (un punto por barrera, distancia del plano de factibilidad): la memoria final se
 * calcula en el diseñador.
 */
import { MATERIALS, MODALITIES, type ShieldingMaterial } from '@/types/radshield';
import { barreraMV, energiaTabuladaMV, type HazMV } from '@/lib/calculadorasNormativas';
import type { MaterialNCRP151 } from '@/lib/ncrp151';
import { codigoCatalogo } from '@/lib/doseFieldEngine';
import { exponentialThickness, tvlThickness } from '@/lib/shieldingMath';
import { dosisSemanalTG108, type NuclidoPET } from '@/lib/tg108';

export interface ResultadoZona {
  /** Espesor requerido en el material pedido (mm). */
  espesor_mm: number;
  /** Kerma semanal sin blindaje en el punto (mSv/semana, sin T). */
  K_sin_blindaje_mSv_semana: number;
  /** Código del catálogo usado (p. ej. CONCRETE235). */
  material: string;
  referencia: string;
  notas: string[];
}

/** Material del catálogo a partir del código del plan («concrete235», «PB», «concreto»…); concreto si no se reconoce. */
export function materialCatalogo(codigo: string): ShieldingMaterial {
  const c = codigoCatalogo(codigo);
  return MATERIALS.find((m) => m.code === c)
    ?? MATERIALS.find((m) => m.code === String(codigo).toUpperCase())
    ?? MATERIALS.find((m) => m.code === 'CONCRETE235')!;
}

/** Igual que `material151` del motor normativo: plomo y acero directos; el resto, concreto equivalente por densidad. */
function material151(m: ShieldingMaterial): { mat: MaterialNCRP151; escala: number } {
  if (m.code === 'PB') return { mat: 'lead', escala: 1 };
  if (m.code === 'STEEL') return { mat: 'steel', escala: 1 };
  return { mat: 'concrete', escala: 2.35 / (m.density || 2.35) };
}

const tOcupacion = (T: number) => (Number.isFinite(T) && T > 0 && T <= 1 ? T : 1);

export interface EntradaLinacZona {
  tipo: 'primaria' | 'secundaria';
  /** Haces (energía nominal en MV y carga en el isocentro, Gy/semana); dos para equipos de doble energía. */
  haces: { energia_MV: number; W_Gy_semana: number }[];
  /** Fracción de la carga con IMRT y factor C_I (fuga, NCRP 151 Ec. 3.6). Por omisión 0.5 y 5, como el motor. */
  fraccionIMRT?: number;
  factorIMRT?: number;
  P_mSv_semana: number;
  T: number;
  /** Factor de uso (primaria) o del haz hacia el paciente (dispersión). Por omisión 0.25, como el motor. */
  U?: number;
  d_m: number;
  /** Ángulo de dispersión (°); por omisión 30°, como el motor. */
  theta_deg?: number;
  materialCodigo: string;
}

/** Barrera de teleterapia MV con `barreraMV` (NCRP 151), en el material pedido. */
export function espesorLinacZona(e: EntradaLinacZona): ResultadoZona {
  const m = materialCatalogo(e.materialCodigo);
  const { mat, escala } = material151(m);
  const haces: HazMV[] = e.haces.map((h) => ({
    energia: energiaTabuladaMV(h.energia_MV),
    W_Gy_semana: h.W_Gy_semana,
    fraccionIMRT: e.fraccionIMRT ?? 0.5,
    factorIMRT: e.factorIMRT ?? 5,
  }));
  const r = barreraMV({
    tipo: e.tipo, haces, material: mat, P_mSv_semana: e.P_mSv_semana, T: tOcupacion(e.T), U: e.U ?? 0.25,
    d_m: e.d_m, theta_deg: e.theta_deg ?? 30,
  });
  const notas = [`Energía tabulada: ${haces.map((h) => `${h.energia} MV`).join(' + ')}.`];
  if (e.tipo === 'secundaria' && e.fraccionIMRT === undefined) notas.push('Fuga con IMRT por omisión: 50 % de la carga con C_I = 5 (NCRP 151 §7.1.4).');
  if (escala !== 1) notas.push(`${m.code}: espesor por equivalencia másica con concreto (ρ = ${m.density} g/cm³).`);
  return {
    espesor_mm: r.espesor_cm * 10 * escala,
    K_sin_blindaje_mSv_semana: r.K_sin_blindaje_mSv_semana,
    material: m.code,
    referencia: r.referencia,
    notas,
  };
}

export interface EntradaPETZona {
  nuclido?: NuclidoPET;
  A0_MBq: number;
  pacientesSemana: number;
  /** Tiempo de captación por paciente (h); por omisión 1 h. */
  tU_h?: number;
  d_m: number;
  P_mSv_semana: number;
  T: number;
  materialCodigo: string;
}

/** Sala de captación PET: kerma TG-108 (Ec. 2–3) y espesor con el TVL de 511 keV del catálogo (como el motor). */
export function espesorPETZona(e: EntradaPETZona): ResultadoZona {
  const m = materialCatalogo(e.materialCodigo);
  const K = dosisSemanalTG108({
    nuclido: e.nuclido ?? 'F18', A0_MBq: e.A0_MBq, pacientesSemana: e.pacientesSemana,
    tU_h: e.tU_h ?? 1, tI_h: 0, sala: 'captacion', d_m: e.d_m,
  }) / 1000;
  return {
    espesor_mm: exponentialThickness(K, e.P_mSv_semana / tOcupacion(e.T), m, '511keV'),
    K_sin_blindaje_mSv_semana: K,
    material: m.code,
    referencia: 'AAPM TG-108 Ec. 2–3 (captación); TVL de 511 keV del catálogo de materiales',
    notas: [`${e.nuclido ?? 'F18'}: Γ, decaimiento y absorción del paciente de TG-108; tU = ${e.tU_h ?? 1} h.`],
  };
}

/** Gamma Knife (Co-60): K = D·f·U/d² (U = 1: todos los haces convergen en el isocentro) y TVL de Co-60 del catálogo. */
export function espesorGammaKnifeZona(e: {
  fraccionesSemana: number; dosisFraccion_Gy: number; d_m: number; P_mSv_semana: number; T: number; materialCodigo: string;
}): ResultadoZona {
  const m = materialCatalogo(e.materialCodigo);
  const K = (e.dosisFraccion_Gy * e.fraccionesSemana * 1000) / (e.d_m * e.d_m);
  return {
    espesor_mm: tvlThickness(K, e.P_mSv_semana / tOcupacion(e.T), m, 'Co60'),
    K_sin_blindaje_mSv_semana: K,
    material: m.code,
    referencia: 'NCRP 151: B = P/(T·K), n = log₁₀(1/B), TVL de Co-60 del catálogo (Tabla B.2)',
    notas: ['Kerma de la dosis prescrita en el isocentro sin el autoblindaje del equipo: cota superior muy conservadora.'],
  };
}

/** Γδ de kerma en aire del Ir-192 del catálogo (μGy·m²/(MBq·h)). */
export const GAMMA_IR192_uGy_m2_MBq_h = MODALITIES.find((x) => x.id === 'hdr-192ir')?.doseRateConstant ?? 0.111;

/** HDR Ir-192: K = Γδ·A·t/d² (como `calculateUnshieldedKerma` para `hdr-192ir`) y TVL de Ir-192 del catálogo. */
export function espesorHDRZona(e: {
  actividad_Ci: number; horasSemana: number; d_m: number; P_mSv_semana: number; T: number; materialCodigo: string;
}): ResultadoZona {
  const m = materialCatalogo(e.materialCodigo);
  const A_MBq = e.actividad_Ci * 3.7e4;
  const K = (GAMMA_IR192_uGy_m2_MBq_h * A_MBq * e.horasSemana) / (e.d_m * e.d_m) / 1000;
  return {
    espesor_mm: tvlThickness(K, e.P_mSv_semana / tOcupacion(e.T), m, 'Ir192'),
    K_sin_blindaje_mSv_semana: K,
    material: m.code,
    referencia: 'Γδ de Ir-192 (kerma en aire) y TVL de Ir-192 del catálogo; B = P/(T·K)',
    notas: [`Γδ = ${GAMMA_IR192_uGy_m2_MBq_h} μGy·m²/(MBq·h); 1 Ci = 37 000 MBq.`],
  };
}
