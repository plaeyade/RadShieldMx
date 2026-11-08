/**
 * AAPM TG-108 (PET): dosis semanal por paciente en salas de captación y de imagen, con decaimiento (Rₜ) y
 * absorción del cuerpo del paciente (0.36 → Γ_paciente = 0.092 μSv·m²/(MBq·h) para F-18).
 *
 *   Captación (Ec. 2–3):  D = Γp · N · A₀ · t_U · R_tU / d²
 *   Imagen (Ec. 9–10):    D = Γp · N · A₀ · 0.85 · F_U · t_I · R_tI / d²   (0.85: vaciado vesical)
 *   Rₜ = 1.443 · (T½/t) · [1 − exp(−0.693 t/T½)],   F_U = exp(−0.693 t_U/T½)
 *
 * Además, actividades administradas de referencia por estudio, con su guía (corpus GAMMA, 11-2026).
 */

export type NuclidoPET = 'F18' | 'Ga68' | 'C11' | 'N13' | 'O15' | 'Cu64';

/** TG-108 Tabla 1: Γ (μSv·m²/(MBq·h)) y semivida (min). */
export const NUCLIDOS_PET: Record<NuclidoPET, { gamma: number; T12_min: number }> = {
  F18: { gamma: 0.143, T12_min: 109.77 },
  Ga68: { gamma: 0.134, T12_min: 67.71 },
  C11: { gamma: 0.148, T12_min: 20.36 },
  N13: { gamma: 0.148, T12_min: 9.97 },
  O15: { gamma: 0.148, T12_min: 2.04 },
  Cu64: { gamma: 0.029, T12_min: 762.0 },
};

/** Fracción absorbida por el cuerpo del paciente a 511 keV (TG-108). */
export const ABSORCION_PACIENTE = 0.36;
/** Reducción por vaciado vesical antes de la imagen (TG-108). */
export const FACTOR_VACIADO = 0.85;

export function factorRt(t_h: number, T12_min: number): number {
  const T = T12_min / 60;
  if (!(t_h > 0)) return 1;
  return 1.443 * (T / t_h) * (1 - Math.exp((-0.693 * t_h) / T));
}

export interface EntradaTG108 {
  nuclido: NuclidoPET;
  A0_MBq: number;
  pacientesSemana: number;
  tU_h: number;
  tI_h: number;
  sala: 'captacion' | 'imagen';
  d_m: number;
}

/** Dosis semanal sin blindaje (μSv/semana) en el punto a d metros del paciente. */
export function dosisSemanalTG108(e: EntradaTG108): number {
  const n = NUCLIDOS_PET[e.nuclido];
  if (!n) throw new Error(`Nucleido sin datos TG-108: ${e.nuclido}`);
  if (!(e.d_m > 0) || !(e.A0_MBq >= 0) || !(e.pacientesSemana >= 0)) throw new Error('Entrada TG-108 inválida');
  const gp = n.gamma * (1 - ABSORCION_PACIENTE);
  const base = (gp * e.pacientesSemana * e.A0_MBq) / (e.d_m * e.d_m);
  if (e.sala === 'captacion') return base * e.tU_h * factorRt(e.tU_h, n.T12_min);
  const FU = Math.exp((-0.693 * e.tU_h * 60) / n.T12_min);
  return base * FACTOR_VACIADO * FU * e.tI_h * factorRt(e.tI_h, n.T12_min);
}

/** Transmisión requerida B = P·T⁻¹ / D (P y D en μSv/semana). */
export function transmisionRequerida(P_uSv_semana: number, T: number, D_uSv_semana: number): number {
  if (!(D_uSv_semana > 0)) return 1;
  return Math.min(1, P_uSv_semana / (T * D_uSv_semana));
}

export interface ProtocoloMN {
  id: string;
  estudio: string;
  nuclido: string;
  A_MBq: [number, number];
  fuente: string;
  nota?: string;
}

/** Actividades administradas de referencia en adultos (rango de la guía). */
export const PROTOCOLOS_MN: ProtocoloMN[] = [
  { id: 'fdg-onco-tg108', estudio: 'PET/CT [18F]FDG oncológico (ejemplo de diseño)', nuclido: 'F-18', A_MBq: [555, 555], fuente: 'AAPM TG-108 (A₀ 555 MBq, captación 60 min)', nota: 'EANM 2025 v3.0 prescribe por peso y tiempo por cama (Supl. 2): usar la actividad real del servicio.' },
  { id: 'mpi-tc99m-1dia', estudio: 'SPECT perfusión miocárdica Tc-99m, protocolo de un día', nuclido: 'Tc-99m', A_MBq: [296, 1332], fuente: 'ASNC 2016, estrés, protocolos y trazadores', nota: '1.ª inyección 8–12 mCi (296–444 MBq); 2.ª en razón 3:1, 24–36 mCi (888–1332 MBq).' },
  { id: 'mpi-tl201', estudio: 'SPECT perfusión miocárdica Tl-201', nuclido: 'Tl-201', A_MBq: [92.5, 129.5], fuente: 'ASNC 2016, estrés, protocolos y trazadores', nota: '2.5–3.5 mCi.' },
  { id: 'tiroides-tco4', estudio: 'Centelleo tiroideo con 99mTcO₄⁻', nuclido: 'Tc-99m', A_MBq: [74, 111], fuente: 'EANM/SNMMI 2019, RAIU y centelleo tiroideo' },
  { id: 'tiroides-i123', estudio: 'Captación y centelleo con I-123', nuclido: 'I-123', A_MBq: [7.4, 14.8], fuente: 'EANM/SNMMI 2019, RAIU y centelleo tiroideo' },
  { id: 'raiu-i131', estudio: 'Captación tiroidea (RAIU) con I-131', nuclido: 'I-131', A_MBq: [0.15, 0.37], fuente: 'EANM/SNMMI 2019, RAIU y centelleo tiroideo' },
  { id: 'tiroides-mibi', estudio: 'Nódulo tiroideo con 99mTc-sestamibi', nuclido: 'Tc-99m', A_MBq: [185, 370], fuente: 'EANM/SNMMI 2019, RAIU y centelleo tiroideo' },
  { id: 'dtc-i131-dx', estudio: 'Rastreo diagnóstico de cáncer diferenciado de tiroides con I-131', nuclido: 'I-131', A_MBq: [37, 148], fuente: 'SNMMI, estándar de centelleo en CDT', nota: '37–74 MBq en hipotiroidismo; 111–148 MBq con rhTSH.' },
  { id: 'tfg-dtpa', estudio: 'Renograma con TFG (Gates modificado) Tc-99m DTPA', nuclido: 'Tc-99m', A_MBq: [370, 740], fuente: 'Beytas et al., Gates modificado', nota: 'Método modificado: 10–20 mCi; Gates original ≤ 3 mCi.' },
];

// ───────────────────────────────────────────────────────────────
// Extensión «estilo TG-108» para nucleidos no PET (SPECT, I-131, Lu-177…).
//
// NO es AAPM TG-108: ese informe sólo trata PET (511 keV). Aquí se reutiliza su estructura
// (paciente como fuente puntual, decaimiento con Rₜ durante la estancia en la sala, F_U entre la
// inyección y la imagen) con estas simplificaciones, todas conservadoras:
//   · Γ es la constante de la modalidad (`modality.doseRateConstant`, μSv·m²/(MBq·h)) SIN
//     atenuación del paciente: el 0.36 de TG-108 es para 511 keV y no se traslada a 140–364 keV.
//   · En la sala de imagen NO se aplica vaciado vesical (el 0.85 de TG-108 es para [18F]FDG y no
//     hay fuente equivalente por radiofármaco), sólo F_U = exp(−0.693·t_U/T½).
//   · Sin eliminación biológica: sólo decaimiento físico.
//
//   Captación: D = Γ · N · A₀ · t_U · R_tU / d²
//   Imagen:    D = Γ · N · A₀ · F_U · t_I · R_tI / d²
//
// Semividas físicas (NNDC/ENSDF).
// ───────────────────────────────────────────────────────────────

export type NuclidoNoPET = 'Tc99m' | 'I131' | 'I123' | 'Tl201' | 'Lu177';

/** Semivida física en horas. */
export const SEMIVIDAS_NO_PET_H: Record<NuclidoNoPET, number> = {
  Tc99m: 6.0067,
  I131: 8.0252 * 24,
  I123: 13.2235,
  Tl201: 72.912,
  Lu177: 6.647 * 24,
};

export interface EntradaPorPaciente {
  nuclido: NuclidoNoPET;
  /** Γ de la modalidad en μSv·m²/(MBq·h), sin atenuación del paciente. */
  gamma: number;
  A0_MBq: number;
  pacientesSemana: number;
  tU_h: number;
  tI_h: number;
  sala: 'captacion' | 'imagen';
  d_m: number;
}

/** Dosis semanal sin blindaje (μSv/semana) a d metros del paciente; extensión «estilo TG-108». */
export function dosisSemanalPorPaciente(e: EntradaPorPaciente): number {
  const T12_h = SEMIVIDAS_NO_PET_H[e.nuclido];
  if (!T12_h) throw new Error(`Nucleido sin semivida: ${e.nuclido}`);
  if (!(e.d_m > 0) || !(e.A0_MBq >= 0) || !(e.pacientesSemana >= 0) || !(e.gamma >= 0)) {
    throw new Error('Entrada por paciente inválida');
  }
  const T12_min = T12_h * 60;
  const base = (e.gamma * e.pacientesSemana * e.A0_MBq) / (e.d_m * e.d_m);
  if (e.sala === 'captacion') return base * e.tU_h * factorRt(e.tU_h, T12_min);
  const FU = Math.exp((-0.693 * e.tU_h) / T12_h);
  return base * FU * e.tI_h * factorRt(e.tI_h, T12_min);
}

/** Nucleido del modelo por paciente según la modalidad de la fuente. */
export const NUCLIDO_PET_POR_MODALIDAD: Record<string, NuclidoPET> = { 'pet-f18': 'F18', 'pet-gallium': 'Ga68' };
export const NUCLIDO_NO_PET_POR_MODALIDAD: Record<string, NuclidoNoPET> = { 'spect-tc99m': 'Tc99m', 'radioiodine-i131': 'I131' };

/** Etiquetas de nucleido de PROTOCOLOS_MN que se ofrecen como preset en cada modalidad. */
const ETIQUETAS_PROTOCOLO_POR_MODALIDAD: Record<string, string[]> = {
  'pet-f18': ['F-18', 'Ga-68'],
  'pet-gallium': ['F-18', 'Ga-68'],
  'spect-tc99m': ['Tc-99m'],
  'radioiodine-i131': ['I-131'],
};

export function protocolosParaModalidad(modalityId: string): ProtocoloMN[] {
  const etiquetas = ETIQUETAS_PROTOCOLO_POR_MODALIDAD[modalityId];
  if (!etiquetas) return [];
  return PROTOCOLOS_MN.filter((p) => etiquetas.includes(p.nuclido));
}

export function tieneModeloPorPaciente(modalityId: string): boolean {
  return modalityId in NUCLIDO_PET_POR_MODALIDAD || modalityId in NUCLIDO_NO_PET_POR_MODALIDAD;
}

export type ParametrosPorPaciente = Omit<EntradaTG108, 'nuclido' | 'd_m'>;

/**
 * Dosis semanal (μSv/semana) a d metros para una modalidad: TG-108 en PET, extensión «estilo TG-108»
 * en SPECT/I-131. Devuelve null si la modalidad no tiene modelo por paciente.
 */
export function dosisSemanalPorModalidad(
  modalityId: string,
  gammaModalidad: number,
  p: ParametrosPorPaciente,
  d_m: number,
): { D_uSv: number; Rt: number; modelo: 'tg108' | 'estilo-tg108' } | null {
  const t = p.sala === 'captacion' ? p.tU_h : p.tI_h;
  const pet = NUCLIDO_PET_POR_MODALIDAD[modalityId];
  if (pet) {
    return { D_uSv: dosisSemanalTG108({ ...p, nuclido: pet, d_m }), Rt: factorRt(t, NUCLIDOS_PET[pet].T12_min), modelo: 'tg108' };
  }
  const otro = NUCLIDO_NO_PET_POR_MODALIDAD[modalityId];
  if (otro) {
    return {
      D_uSv: dosisSemanalPorPaciente({ ...p, nuclido: otro, gamma: gammaModalidad, d_m }),
      Rt: factorRt(t, SEMIVIDAS_NO_PET_H[otro] * 60),
      modelo: 'estilo-tg108',
    };
  }
  return null;
}
