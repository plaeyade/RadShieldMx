/**
 * NCRP Report No. 147 (2004) — blindaje de instalaciones de rayos X diagnósticos.
 *
 * Datos transcritos del informe (indexado en GAMMA, SHA-256 b45e41b5…):
 * - Tabla 4.5 (p. 43): kerma primario sin blindaje por paciente a 1 m, K¹_P, y W_norm.
 * - Tabla 4.7 (pp. 46–47): kerma secundario sin blindaje por paciente a 1 m, K¹_sec
 *   (fuga + dispersión lateral a 90°, y fuga + dispersión hacia adelante/atrás a 135°), y sus
 *   columnas por separado (fuga, dispersión a 90° y a 135°) para los ejemplos con d_L ≠ d_S (§5.3.3, §5.4).
 * - Tabla 4.7 nota f y §5.5 (p. 92): mastografía, 3.6×10⁻² mGy/paciente a 1 m del ISOCENTRO.
 * - Figuras A.2 y A.3 (pp. 123–124): ajustes de Archer de la radiación secundaria de TC (120 y 140 kVp).
 * - Tabla B.1 (p. 133): ajustes de Archer para transmisión PRIMARIA (α, β en mm⁻¹).
 * - Tabla C.1 (p. 147): ajustes de Archer para transmisión SECUNDARIA (α, β en mm⁻¹).
 * - Ec. 4.3/4.8: K_P(0) = K¹_P·U·N/d_P²; B = P·d²/(T·U·N·K¹); x = ln[(B^−γ+β/α)/(1+β/α)]/(αγ).
 *
 * Las distribuciones de carga son las de AAPM TG9 (Simpkin, 1996a), Tabla 4.2.
 */

export type DistribucionNCRP147 =
  | 'rad_room_all'
  | 'rad_room_chest_bucky'
  | 'rad_room_floor_other'
  | 'fluoro_tube_rf'
  | 'rad_tube_rf'
  | 'chest_room'
  | 'mammography_room'
  | 'cardiac_angiography'
  | 'peripheral_angiography';

export type MaterialNCRP147 = 'lead' | 'concrete' | 'gypsum';
export interface Archer { alpha: number; beta: number; gamma: number }
type Ajustes = Record<MaterialNCRP147, Archer>;

const a = (alpha: number, beta: number, gamma: number): Archer => ({ alpha, beta, gamma });

export const ETIQUETAS_NCRP147: Record<DistribucionNCRP147, string> = {
  rad_room_all: 'Rad Room (all barriers)',
  rad_room_chest_bucky: 'Rad Room (chest bucky)',
  rad_room_floor_other: 'Rad Room (floor or other barriers)',
  fluoro_tube_rf: 'Fluoroscopy Tube (R&F room)',
  rad_tube_rf: 'Rad Tube (R&F room)',
  chest_room: 'Chest Room',
  mammography_room: 'Mammography Room',
  cardiac_angiography: 'Cardiac Angiography',
  peripheral_angiography: 'Peripheral Angiography (y neuroangiografía)',
};

/** Tabla 4.5: K¹_P (mGy/paciente a 1 m) y W_norm (mA·min/paciente). Sólo las 4 distribuciones tabuladas. */
export const TABLA_4_5: Partial<Record<DistribucionNCRP147, { K1P_mGy: number; Wnorm: number }>> = {
  rad_room_chest_bucky: { K1P_mGy: 2.3, Wnorm: 0.6 },
  rad_room_floor_other: { K1P_mGy: 5.2, Wnorm: 1.9 },
  rad_tube_rf: { K1P_mGy: 5.9, Wnorm: 1.5 },
  chest_room: { K1P_mGy: 1.2, Wnorm: 0.22 },
};

/**
 * Tabla 4.7: K¹_sec (mGy/paciente a 1 m del tubo y del paciente). `lateral` = fuga + 90°; `frontal` = fuga + 135°.
 * `fuga`, `dispersion90` y `dispersion135` son las columnas por separado (para d_L ≠ d_S).
 */
export const TABLA_4_7: Record<DistribucionNCRP147, {
  Wnorm: number; lateral: number; frontal: number; fuga: number; dispersion90: number; dispersion135: number;
}> = {
  rad_room_all: { Wnorm: 2.5, lateral: 3.4e-2, frontal: 4.9e-2, fuga: 5.3e-4, dispersion90: 3.4e-2, dispersion135: 4.8e-2 },
  rad_room_chest_bucky: { Wnorm: 0.6, lateral: 5.3e-3, frontal: 7.3e-3, fuga: 3.9e-4, dispersion90: 4.9e-3, dispersion135: 6.9e-3 },
  rad_room_floor_other: { Wnorm: 1.9, lateral: 2.3e-2, frontal: 3.3e-2, fuga: 1.4e-4, dispersion90: 2.3e-2, dispersion135: 3.3e-2 },
  fluoro_tube_rf: { Wnorm: 13, lateral: 3.2e-1, frontal: 4.6e-1, fuga: 1.2e-2, dispersion90: 3.1e-1, dispersion135: 4.4e-1 },
  rad_tube_rf: { Wnorm: 1.5, lateral: 2.9e-2, frontal: 4.0e-2, fuga: 9.4e-4, dispersion90: 2.8e-2, dispersion135: 3.9e-2 },
  chest_room: { Wnorm: 0.22, lateral: 2.7e-3, frontal: 3.6e-3, fuga: 3.8e-4, dispersion90: 2.3e-3, dispersion135: 3.2e-3 },
  mammography_room: { Wnorm: 6.7, lateral: 1.1e-2, frontal: 4.9e-2, fuga: 1.1e-5, dispersion90: 1.1e-2, dispersion135: 4.9e-2 },
  cardiac_angiography: { Wnorm: 160, lateral: 2.7, frontal: 3.8, fuga: 8.8e-2, dispersion90: 2.6, dispersion135: 3.7 },
  peripheral_angiography: { Wnorm: 64, lateral: 6.6e-1, frontal: 9.5e-1, fuga: 3.4e-3, dispersion90: 6.6e-1, dispersion135: 9.5e-1 },
};

/**
 * Tabla 4.7 nota f y §5.5 (p. 92): para mastografía, 3.6×10⁻² mGy/paciente es un máximo conservador de K¹_sec
 * para TODAS las barreras, medido a 1 m del ISOCENTRO del equipo (cuatro proyecciones). Las entradas de la
 * Tabla 4.7 se evaluaron a 1 m del tubo y del paciente; en el lienzo la fuente es el isocentro.
 */
export const K1_SEC_MASTOGRAFIA_ISOCENTRO_mGy = 3.6e-2;

/**
 * Figuras A.2 (plomo) y A.3 (concreto), pp. 123–124: ajustes de Archer (Ec. A.2) de la transmisión de la
 * radiación secundaria de TC (datos de Simpkin, 1991). No hay ajuste de TC para yeso u otros materiales.
 */
export const AJUSTES_TC: Record<120 | 140, Record<'lead' | 'concrete', Archer>> = {
  120: { lead: a(2.246, 5.73, 0.547), concrete: a(0.0383, 0.0142, 0.658) },
  140: { lead: a(2.009, 3.99, 0.342), concrete: a(0.0336, 0.0122, 0.519) },
};

/**
 * Transmisión de la secundaria de TC (Figs. A.2/A.3). Sin kVp definido se toma la mayor de las dos curvas
 * (Apéndice A, p. 117: suponer la del potencial más alto es conservador; aquí, la mayor transmisión).
 */
export function transmisionTC(x_mm: number, material: 'lead' | 'concrete', kvp?: 120 | 140): number {
  if (kvp) return transmisionArcher(x_mm, AJUSTES_TC[kvp][material]);
  return Math.max(transmisionArcher(x_mm, AJUSTES_TC[120][material]), transmisionArcher(x_mm, AJUSTES_TC[140][material]));
}

/** Tabla B.1: transmisión primaria. */
export const TABLA_B_1: Record<DistribucionNCRP147, Ajustes> = {
  rad_room_all: { lead: a(2.346, 15.90, 0.4982), concrete: a(0.03626, 0.1429, 0.4932), gypsum: a(0.01420, 0.05781, 0.7445) },
  rad_room_chest_bucky: { lead: a(2.264, 13.08, 0.5600), concrete: a(0.03552, 0.1177, 0.6007), gypsum: a(0.01278, 0.04848, 0.8609) },
  rad_room_floor_other: { lead: a(2.651, 16.56, 0.4585), concrete: a(0.03994, 0.1448, 0.4231), gypsum: a(0.01679, 0.06124, 0.7356) },
  fluoro_tube_rf: { lead: a(2.347, 12.67, 0.6149), concrete: a(0.03616, 0.09721, 0.5186), gypsum: a(0.01340, 0.04283, 0.8796) },
  rad_tube_rf: { lead: a(2.295, 13.00, 0.5573), concrete: a(0.03549, 0.1164, 0.5774), gypsum: a(0.01300, 0.04778, 0.8485) },
  chest_room: { lead: a(2.283, 10.74, 0.6370), concrete: a(0.03622, 0.07766, 0.5404), gypsum: a(0.01286, 0.03505, 0.9356) },
  mammography_room: { lead: a(30.60, 177.6, 0.3308), concrete: a(0.2577, 1.765, 0.3644), gypsum: a(0.09148, 0.7090, 0.3459) },
  cardiac_angiography: { lead: a(2.389, 14.26, 0.5948), concrete: a(0.03717, 0.1087, 0.4879), gypsum: a(0.01409, 0.04814, 0.8419) },
  peripheral_angiography: { lead: a(2.728, 18.52, 0.4614), concrete: a(0.04292, 0.1538, 0.4236), gypsum: a(0.01774, 0.06449, 0.7158) },
};

/** Tabla C.1: transmisión secundaria. */
export const TABLA_C_1: Record<DistribucionNCRP147, Ajustes> = {
  rad_room_all: { lead: a(2.298, 17.38, 0.6193), concrete: a(0.03610, 0.1433, 0.5600), gypsum: a(0.01380, 0.05700, 0.7937) },
  rad_room_chest_bucky: { lead: a(2.256, 13.80, 0.8837), concrete: a(0.03560, 0.1079, 0.7705), gypsum: a(0.01270, 0.04450, 1.049) },
  rad_room_floor_other: { lead: a(2.513, 17.34, 0.4994), concrete: a(0.03920, 0.1464, 0.4486), gypsum: a(0.01640, 0.06080, 0.7472) },
  fluoro_tube_rf: { lead: a(2.322, 12.91, 0.7575), concrete: a(0.03630, 0.09360, 0.5955), gypsum: a(0.01330, 0.04100, 0.9566) },
  rad_tube_rf: { lead: a(2.272, 13.60, 0.7184), concrete: a(0.03560, 0.1114, 0.6620), gypsum: a(0.01290, 0.04570, 0.9355) },
  chest_room: { lead: a(2.288, 9.848, 1.054), concrete: a(0.03640, 0.06590, 0.7543), gypsum: a(0.01300, 0.02970, 1.195) },
  mammography_room: { lead: a(29.91, 184.4, 0.3550), concrete: a(0.2539, 1.8411, 0.3924), gypsum: a(0.08830, 0.7526, 0.3786) },
  cardiac_angiography: { lead: a(2.354, 14.94, 0.7481), concrete: a(0.03710, 0.1067, 0.5733), gypsum: a(0.01390, 0.04640, 0.9185) },
  peripheral_angiography: { lead: a(2.661, 19.54, 0.5094), concrete: a(0.04219, 0.1559, 0.4472), gypsum: a(0.01747, 0.06422, 0.7299) },
};

/** Tabla 4.6: preblindaje equivalente x_pre (mm) del receptor de imagen. */
export const PREBLINDAJE_MM = {
  mesa_o_bucky_de_mesa: { lead: 0.85, concrete: 72, steel: 7 },
  bucky_de_pared: { lead: 0.85, concrete: 72, steel: 7 },
  sin_rejilla: { lead: 0.3, concrete: 30, steel: 2 },
} as const;

/**
 * Núcleo único de la ecuación de Archer (NCRP 147 Ec. A.2; TG-108 Tabla V usa la misma forma):
 * (1 + β/α)·e^(αγx/cosθ) − β/α. B(x) = núcleo^(−1/γ). Lo usan `transmisionArcher` (NCRP 147),
 * `transmisionTG108` (511 keV) y `archerTransmission` (catálogo, con oblicuidad); antes cada uno tenía su copia
 * (depuración, etapa 6). `x` en las unidades de α, β; con cosθ = 1 la división es exacta (mismo resultado bit a bit).
 */
export function interiorArcher(x: number, p: Archer, cosTheta = 1): number {
  const r = p.beta / p.alpha;
  return (1 + r) * Math.exp((p.alpha * p.gamma * x) / cosTheta) - r;
}

export function transmisionArcher(x_mm: number, p: Archer): number {
  if (x_mm <= 0) return 1;
  return Math.pow(interiorArcher(x_mm, p), -1 / p.gamma);
}

export function espesorArcher(B: number, p: Archer): number {
  if (B >= 1) return 0;
  if (!(B > 0)) return Infinity;
  const r = p.beta / p.alpha;
  return Math.log((Math.pow(B, -p.gamma) + r) / (1 + r)) / (p.alpha * p.gamma);
}

export interface BarreraPrimaria {
  distribucion: DistribucionNCRP147;
  material: MaterialNCRP147;
  /** Objetivo de diseño semanal (mGy/semana): 0.1 controlada, 0.02 no controlada. */
  P_mGy_semana: number;
  T: number;
  U: number;
  N_pacientes_semana: number;
  dP_m: number;
  /** Preblindaje del receptor de imagen (mm del mismo material); 0 si no se acredita. */
  xpre_mm?: number;
}

export interface ResultadoBarrera {
  K_sin_blindaje_mGy_semana: number;
  B_requerida: number;
  espesor_total_mm: number;
  espesor_barrera_mm: number;
  ajuste: Archer;
  referencia: string;
}

/** Barrera primaria (Ec. 4.3, 4.8; Tablas 4.5 y B.1). */
export function barreraPrimaria(b: BarreraPrimaria): ResultadoBarrera {
  const t45 = TABLA_4_5[b.distribucion];
  if (!t45) throw new RangeError(`NCRP 147 Tabla 4.5 no tabula K¹_P para ${ETIQUETAS_NCRP147[b.distribucion]}`);
  validar(b.T, b.U, b.P_mGy_semana, b.N_pacientes_semana, b.dP_m);
  const K = (t45.K1P_mGy * b.U * b.N_pacientes_semana) / (b.dP_m * b.dP_m);
  const B = Math.min(1, b.P_mGy_semana / (b.T * K));
  const ajuste = TABLA_B_1[b.distribucion][b.material];
  const total = espesorArcher(B, ajuste);
  return {
    K_sin_blindaje_mGy_semana: K,
    B_requerida: B,
    espesor_total_mm: total,
    espesor_barrera_mm: Math.max(0, total - (b.xpre_mm ?? 0)),
    ajuste,
    referencia: 'NCRP 147 Ec. 4.3/4.8, Tablas 4.5 y B.1',
  };
}

export interface BarreraSecundaria {
  distribucion: DistribucionNCRP147;
  material: MaterialNCRP147;
  P_mGy_semana: number;
  T: number;
  N_pacientes_semana: number;
  dsec_m: number;
  /** 'lateral' (fuga + 90°) o 'frontal' (fuga + 135°, más conservador). */
  geometria?: 'lateral' | 'frontal';
}

/** Barrera secundaria (Ec. 4.4; Tablas 4.7 y C.1), con d_S = d_L = d_sec. */
export function barreraSecundaria(b: BarreraSecundaria): ResultadoBarrera {
  validar(b.T, 1, b.P_mGy_semana, b.N_pacientes_semana, b.dsec_m);
  const k1 = TABLA_4_7[b.distribucion][b.geometria ?? 'lateral'];
  const K = (k1 * b.N_pacientes_semana) / (b.dsec_m * b.dsec_m);
  const B = Math.min(1, b.P_mGy_semana / (b.T * K));
  const ajuste = TABLA_C_1[b.distribucion][b.material];
  const total = espesorArcher(B, ajuste);
  return {
    K_sin_blindaje_mGy_semana: K,
    B_requerida: B,
    espesor_total_mm: total,
    espesor_barrera_mm: total,
    ajuste,
    referencia: 'NCRP 147 Ec. 4.4, Tablas 4.7 y C.1',
  };
}

function validar(T: number, U: number, P: number, N: number, d: number): void {
  if (!(T > 0 && T <= 1)) throw new RangeError('T debe estar en (0, 1]');
  if (!(U > 0 && U <= 1)) throw new RangeError('U debe estar en (0, 1]');
  if (!(P > 0) || !(N > 0) || !(d > 0)) throw new RangeError('P, N y d deben ser positivos');
}
