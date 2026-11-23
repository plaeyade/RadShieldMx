/**
 * Perfiles de equipo de teleterapia con datos públicos y cita (Fase 13; decisión del propietario, 23-11-2026: el linac
 * del proyecto es un ELEKTA Versa HD).
 *
 * El perfil separa lo que el equipo PUEDE tener (catálogo, de fuentes públicas) de lo que tiene ESTA instalación
 * (configuración, confirmada por el propietario el 23-11-2026). Las energías de fotones se dan en MV y las de electrones en MeV: no
 * son intercambiables. Para el blindaje del búnker cuentan los fotones (NCRP 151); los electrones no generan fuentes.
 *
 * Fuentes (sólo datos públicos; no se incluyen documentos del fabricante):
 * - Narayanasamy G, Saenz D, Cruz W, Ha CS, Papanikolaou N, Stathakis S. Commissioning an Elekta Versa HD linear
 *   accelerator. J Appl Clin Med Phys 2016;17(1). doi:10.1120/jacmp.v17i1.5799 (PMC5690217).
 * - Radiology Oncology Systems. Elekta Linear Accelerator Comparison Chart (https://www.oncologysystems.com/?p=3695),
 *   consultada el 23-11-2026 (fuente secundaria de un revendedor).
 * - NCRP 151 §2.3 / IEC 60601-2-1: fuga del cabezal ≤ 0.1 % de la dosis del haz útil a 1 m (la que usa el motor).
 */
import { ENERGIA_NEUTRONES_MIN_MV } from '@/lib/shieldingMath';
import { MODALITIES, type RadiationSource } from '@/types/radshield';

export interface CitaPublica { id: string; cita: string; url: string; datos: string }

export interface EnergiaFotones {
  /** Energía nominal de fotones (MV). */
  mv: number;
  /** Sin filtro aplanador (FFF). NCRP 151 no tabula FFF: el motor usa los datos del haz con filtro de la misma energía. */
  fff: boolean;
}

export interface PerfilLinac {
  id: string;
  fabricante: string;
  modelo: string;
  /** Energías de fotones que ofrece el modelo según las fuentes (catálogo, no la configuración de una sala). */
  fotonesDisponibles: (EnergiaFotones & { fuentes: string[] })[];
  /** Energías de electrones que ofrece el modelo (MeV). */
  electronesDisponibles_MeV: { mev: number; fuentes: string[] }[];
  /** Tasa máxima (MU/min) por modo; null si no hay dato público. */
  tasaMaxima_MU_min: { conFiltro: number | null; fff: { mv: number; mu_min: number; fuente: string }[]; electrones: number | null };
  /** Fuga del cabezal (fracción de la dosis del haz útil a 1 m) y de dónde sale. */
  fugaCabezal: { fraccion: number; nota: string };
  fuentes: CitaPublica[];
}

const NARAYANASAMY_2016 = 'narayanasamy-2016';
const ROS_COMPARATIVA = 'ros-comparativa-elekta';
const NCRP151_FUGA = 'ncrp151-fuga';

export const PERFIL_ELEKTA_VERSA_HD: PerfilLinac = {
  id: 'elekta-versa-hd',
  fabricante: 'Elekta',
  modelo: 'Versa HD',
  fotonesDisponibles: [
    { mv: 6, fff: false, fuentes: [NARAYANASAMY_2016, ROS_COMPARATIVA] },
    { mv: 10, fff: false, fuentes: [NARAYANASAMY_2016, ROS_COMPARATIVA] },
    { mv: 15, fff: false, fuentes: [ROS_COMPARATIVA] },
    { mv: 18, fff: false, fuentes: [NARAYANASAMY_2016, ROS_COMPARATIVA] },
    { mv: 6, fff: true, fuentes: [NARAYANASAMY_2016] },
    { mv: 10, fff: true, fuentes: [NARAYANASAMY_2016] },
  ],
  electronesDisponibles_MeV: [
    { mev: 4, fuentes: [NARAYANASAMY_2016, ROS_COMPARATIVA] },
    { mev: 6, fuentes: [NARAYANASAMY_2016, ROS_COMPARATIVA] },
    { mev: 8, fuentes: [NARAYANASAMY_2016, ROS_COMPARATIVA] },
    { mev: 9, fuentes: [NARAYANASAMY_2016, ROS_COMPARATIVA] },
    { mev: 10, fuentes: [ROS_COMPARATIVA] },
    { mev: 12, fuentes: [NARAYANASAMY_2016, ROS_COMPARATIVA] },
    { mev: 15, fuentes: [NARAYANASAMY_2016, ROS_COMPARATIVA] },
    { mev: 18, fuentes: [ROS_COMPARATIVA] },
  ],
  tasaMaxima_MU_min: {
    conFiltro: 600,
    fff: [
      { mv: 6, mu_min: 1400, fuente: NARAYANASAMY_2016 },
      { mv: 10, mu_min: 2400, fuente: NARAYANASAMY_2016 },
    ],
    electrones: 1000,
  },
  fugaCabezal: {
    fraccion: 1e-3,
    nota: 'Sin dato público del fabricante: 0.1 % a 1 m, el límite de IEC 60601-2-1 que usa NCRP 151 §2.3 (el motor ya lo aplica).',
  },
  fuentes: [
    {
      id: NARAYANASAMY_2016,
      cita: 'Narayanasamy G, Saenz D, Cruz W, Ha CS, Papanikolaou N, Stathakis S. Commissioning an Elekta Versa HD linear accelerator. J Appl Clin Med Phys 2016;17(1). doi:10.1120/jacmp.v17i1.5799',
      url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5690217/',
      datos: 'Fotones 6, 10 y 18 MV con filtro y 6 y 10 MV FFF; FFF hasta 1400 MU/min (6 MV) y 2400 MU/min (10 MV); electrones 4, 6, 8, 9, 12 y 15 MeV.',
    },
    {
      id: ROS_COMPARATIVA,
      cita: 'Radiology Oncology Systems. Elekta Linear Accelerator Comparison Chart (consultada el 23-11-2026)',
      url: 'https://www.oncologysystems.com/?p=3695',
      datos: 'Fotones 6/10/15/18 MV; 600 MU/min con filtro y 2400 MU/min FFF; electrones 4/6/8/9/10/12/15/18 MeV hasta 1000 MU/min.',
    },
    {
      id: NCRP151_FUGA,
      cita: 'NCRP Report No. 151 (2005), §2.3; IEC 60601-2-1',
      url: 'https://ncrponline.org/',
      datos: 'Fuga del cabezal ≤ 0.1 % de la dosis del haz útil a 1 m.',
    },
  ],
};

/** Configuración de la sala: qué energías tiene ESTE equipo. */
export interface ConfiguracionLinac {
  perfil: PerfilLinac;
  fotones: EnergiaFotones[];
  electrones_MeV: number[];
  /** Energías de fotones que el catálogo cita como opción del modelo pero que esta sala no tiene configuradas. */
  opcionesCitadas?: EnergiaFotones[];
  /** false mientras el propietario no confirme las energías de fotones. */
  confirmado: boolean;
  nota?: string;
}

/**
 * Versa HD del proyecto, CONFIRMADO por el propietario el 23-11-2026: fotones 6, 10 y 18 MV con filtro, 6 y 10 MV FFF y
 * electrones de 4 a 15 MeV. 15 MV queda como opción citada del catálogo (Radiology Oncology Systems), no configurada.
 * La mención anterior de «6, 12 y 15 MeV» como fotones fue un error del propietario. Con 10 y 18 MV (≥ 10 MV) el
 * laberinto y la puerta calculan neutrones y captura.
 */
export const CONFIG_VERSA_HD_PROYECTO: ConfiguracionLinac = {
  perfil: PERFIL_ELEKTA_VERSA_HD,
  fotones: [
    { mv: 6, fff: false }, { mv: 10, fff: false }, { mv: 18, fff: false },
    { mv: 6, fff: true }, { mv: 10, fff: true },
  ],
  opcionesCitadas: [{ mv: 15, fff: false }],
  electrones_MeV: PERFIL_ELEKTA_VERSA_HD.electronesDisponibles_MeV.map((e) => e.mev).filter((mev) => mev >= 4 && mev <= 15),
  confirmado: true,
  nota: 'Confirmado por el propietario el 23-11-2026: fotones 6/10/18 MV, FFF 6/10 MV, electrones 4–15 MeV; 15 MV como opción citada.',
};

const etiqueta = (e: EnergiaFotones) => `${e.mv} MV${e.fff ? ' FFF' : ''}`;

/** ¿Alguna energía de fotones de la configuración pide neutrones en laberinto y puerta (≥ 10 MV)? */
export function requiereNeutronesLinac(cfg: Pick<ConfiguracionLinac, 'fotones'>): boolean {
  return cfg.fotones.some((e) => e.mv >= ENERGIA_NEUTRONES_MIN_MV);
}

/** Avisos de la configuración frente al catálogo del perfil. */
export function validarConfiguracionLinac(cfg: ConfiguracionLinac): string[] {
  const avisos: string[] = [];
  const { perfil } = cfg;
  if (!cfg.fotones.length) avisos.push(`${perfil.fabricante} ${perfil.modelo}: sin energías de fotones; no hay fuente para el blindaje.`);
  for (const e of cfg.fotones) {
    if (!perfil.fotonesDisponibles.some((d) => d.mv === e.mv && d.fff === e.fff)) {
      const comoElectron = perfil.electronesDisponibles_MeV.some((d) => d.mev === e.mv);
      avisos.push(`${etiqueta(e)} no está en el catálogo de fotones del ${perfil.modelo} (${perfil.fotonesDisponibles.map(etiqueta).join(', ')})${comoElectron ? `; ${e.mv} MeV sí existe como electrones` : ''}.`);
    }
    if (e.fff) avisos.push(`${etiqueta(e)}: NCRP 151 no tabula haces FFF; se usan los datos del haz de ${e.mv} MV con filtro.`);
  }
  for (const mev of cfg.electrones_MeV) {
    if (!perfil.electronesDisponibles_MeV.some((d) => d.mev === mev)) avisos.push(`Electrones de ${mev} MeV no están en el catálogo del ${perfil.modelo}.`);
  }
  if (!cfg.confirmado) avisos.push(`${perfil.fabricante} ${perfil.modelo}: energías de fotones sin confirmar por el propietario${cfg.nota ? ` (${cfg.nota})` : ''}.`);
  if (requiereNeutronesLinac(cfg)) avisos.push(`Fotones ≥ ${ENERGIA_NEUTRONES_MIN_MV} MV: el laberinto y la puerta calculan neutrones y captura (NCRP 151 §2.4).`);
  return avisos;
}

export interface OpcionesFuentes {
  idBase: string;
  x: number;
  y: number;
  /** Carga semanal de fotones en el isocentro (Gy/semana) por etiqueta («6 MV», «15 MV», «6 MV FFF»). */
  W_Gy_semana: Record<string, number>;
  isocenterHeight_m?: number;
  useFactor?: number;
  ejeGantry_deg?: number;
}

/**
 * Una fuente del plano por energía de fotones configurada (con su carga), para el motor de barreras y el de laberinto y
 * puerta. Las energías sin modalidad de linac en el catálogo de RadShield (p. ej. 4 u 8 MV) o sin carga se omiten con
 * aviso. Los electrones no generan fuente.
 */
export function fuentesDesdeConfiguracion(cfg: ConfiguracionLinac, o: OpcionesFuentes): { fuentes: RadiationSource[]; avisos: string[] } {
  const avisos: string[] = [];
  const fuentes: RadiationSource[] = [];
  for (const e of cfg.fotones) {
    const nombre = etiqueta(e);
    const modality = MODALITIES.find((m) => m.id === `linac-${e.mv}mv`);
    if (!modality) { avisos.push(`${nombre}: sin modalidad de linac de ${e.mv} MV en RadShield; no se crea fuente.`); continue; }
    const W = o.W_Gy_semana[nombre];
    if (!(typeof W === 'number' && Number.isFinite(W) && W > 0)) { avisos.push(`${nombre}: sin carga de trabajo (Gy/semana); no se crea fuente.`); continue; }
    const k = modality.doseRateConstant || 2;
    fuentes.push({
      id: `${o.idBase}-${e.mv}${e.fff ? 'fff' : ''}`,
      x: o.x, y: o.y,
      name: `${cfg.perfil.fabricante} ${cfg.perfil.modelo} ${nombre}`,
      modality,
      workloadValue: W / k,
      workloadUnit: modality.unit,
      isocenterHeight_m: o.isocenterHeight_m ?? modality.isocenterHeightDefault_m ?? 1.3,
      useFactor: o.useFactor ?? 0.25,
      manufacturerVariant: `${cfg.perfil.fabricante} ${cfg.perfil.modelo}`,
      ...(o.ejeGantry_deg !== undefined ? { ejeGantry_deg: o.ejeGantry_deg } : {}),
    });
  }
  return { fuentes, avisos };
}
