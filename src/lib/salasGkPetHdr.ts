/**
 * Fase 13 — salas nuevas del proyecto: Leksell Gamma Knife Icon (Co-60 autoblindado), Siemens Biograph Trinion
 * (PET/CT, F-18 + TC) y Elekta Studio (braquiterapia HDR Ir-192 con Flexitron + ImagingRing de kV).
 *
 * Todas las barreras se resuelven con el mismo núcleo (`barreraSala`): suma de términos fuente con su propia curva de
 * transmisión de banda ancha, punto protegido a 0.3 m de la cara exterior (la distancia crece con el espesor) o punto
 * fijo (techo: 0.5 m sobre el piso superior), y B = P/(T·K) (NCRP 151 §1.2, NCRP 147 §1.3, AAPM TG-108):
 *
 *   T · Σᵢ Kᵢ(1 m) · Bᵢ(t) / d(t)² ≤ P,     d(t) = d_interior + t + 0.3 m   (o d fija)
 *
 * El espesor mínimo se obtiene por bisección (la suma es monótona en t) y se redondea al paso constructivo.
 *
 * Términos fuente y curvas:
 * - Gamma Knife Icon/Perfexion: la unidad es autoblindada (192 fuentes de Co-60 dentro de un cuerpo de tungsteno y
 *   puertas de blindaje). Fuera de ella no hay haz primario: sólo dispersión del paciente que sale por la abertura con
 *   la camilla dentro (puertas abiertas) y fuga con las fuentes en reposo. NCRP 151 e IAEA SRS-47 no traen un método
 *   propio para estas unidades; se usa el de McDermott (JACMP 8(3), 2007, Ec. 4–6): K semanal = Σ horas por modo ×
 *   tasa del fabricante, con TVL de Co-60 primario de NCRP 151 Tabla B.2 (concreto 21, acero 7.0, plomo 4.0 cm), que
 *   es conservador para la radiación dispersa de menor energía (McDermott et al., JACMP 2026, «Seeing radiation»).
 * - PET (511 keV): AAPM TG-108 Ec. 9–10 (sala de imagen) y Tabla V (ajuste de Archer en plomo, concreto y hierro).
 * - TC y kV de imagen: NCRP 147 §5.6.1 (K¹ = κ·DLP, κ cuerpo 3×10⁻⁴ cm⁻¹ con el 1.2 de la Ec. 5.7) y Figs. A.2/A.3.
 * - HDR Ir-192: Γδ = 0.111 μGy·m²/(MBq·h) (el del catálogo `hdr-192ir`) y TVL de haz ancho de IAEA SRS-47
 *   (concreto 15.2, acero 4.3, plomo 1.6 cm; los mismos del catálogo de materiales). NCRP 151 Tabla B.2 no tabula
 *   Ir-192; de NCRP 151 se toma el marco (P, T, punto a 0.3 m, laberinto con dispersión simple).
 *
 * Materiales sin datos propios para un término (concreto baritado en todos; acero en TC): equivalencia másica con el
 * concreto 2.35, t = t_concreto · 2.35/ρ. Para Co-60, Ir-192 y 511 keV domina Compton y la equivalencia es buena; en kV
 * el bario atenúa más que la masa equivalente de concreto, así que la equivalencia sobrestima el espesor (conservador).
 *
 * Unidades: K en μSv·m²/semana a 1 m (kerma en aire ≈ H*(10) para el diseño), P en mSv/semana, t en cm.
 */
import { tvlPrimaria, transmisionTVL } from './ncrp151';
import { AJUSTES_TC, transmisionArcher } from './ncrp147';
import { transmisionTG108 } from './transmisionTG108';
import { dosisSemanalTG108, type EntradaTG108 } from './tg108';
import { P_CONTROLADA_mSv_semana, P_NO_CONTROLADA_mSv_semana } from './limitesDosis';

// ─────────────────────────────────────────────────────────────────────────────
// Materiales
// ─────────────────────────────────────────────────────────────────────────────

export type MaterialSala = 'concrete' | 'barite' | 'lead' | 'steel';
export const MATERIALES_SALA: MaterialSala[] = ['concrete', 'barite', 'lead', 'steel'];
/** Densidades (g/cm³). Baritado: 3.5 nominal [supuesto: verificar con el certificado del proveedor]. */
export const DENSIDAD_SALA: Record<MaterialSala, number> = { concrete: 2.35, barite: 3.5, lead: 11.35, steel: 7.87 };
export const NOMBRE_MATERIAL_SALA: Record<MaterialSala, string> = {
  concrete: 'Concreto 2.35', barite: 'Concreto baritado 3.5', lead: 'Plomo', steel: 'Acero',
};
/** Paso de redondeo constructivo (cm): concretos 1 cm, acero 0.5 cm, plomo 1 mm. */
export const PASO_SALA_cm: Record<MaterialSala, number> = { concrete: 1, barite: 1, lead: 0.1, steel: 0.5 };

export function redondearSala(t_cm: number, m: MaterialSala): number {
  const p = PASO_SALA_cm[m];
  // Tolerancia de 1e-4 del paso: la bisección deja el espesor ≈ 1e-6 cm por encima de la raíz.
  return t_cm <= 0 ? 0 : Math.round(Math.ceil(t_cm / p - 1e-4) * p * 1000) / 1000;
}

/** Espesor de concreto 2.35 con la misma masa por área que t cm del material m. */
const comoConcreto = (m: MaterialSala, t_cm: number) => (t_cm * DENSIDAD_SALA[m]) / DENSIDAD_SALA.concrete;

// ─────────────────────────────────────────────────────────────────────────────
// Curvas de transmisión por tipo de radiación
// ─────────────────────────────────────────────────────────────────────────────

export type CurvaTransmision = (m: MaterialSala, t_cm: number) => number;

/** Co-60 primario, NCRP 151 Tabla B.2 (TVL₁ = TVLₑ: concreto 21, acero 7.0, plomo 4.0 cm). */
export const transmisionCo60: CurvaTransmision = (m, t) =>
  m === 'barite' ? transmisionTVL(comoConcreto(m, t), tvlPrimaria('Co60', 'concrete')) : transmisionTVL(t, tvlPrimaria('Co60', m));

/** TVL de haz ancho del Ir-192, IAEA SRS-47 (cm); iguales a los del catálogo `MATERIALS` (152, 43 y 16 mm). */
export const TVL_IR192_SRS47_cm = { concrete: 15.2, steel: 4.3, lead: 1.6 } as const;
export const transmisionIr192: CurvaTransmision = (m, t) => {
  if (!(t > 0)) return 1;
  const tvl = m === 'barite' ? TVL_IR192_SRS47_cm.concrete : TVL_IR192_SRS47_cm[m];
  return Math.pow(10, -(m === 'barite' ? comoConcreto(m, t) : t) / tvl);
};

/** 511 keV, TG-108 Tabla V (acero con el ajuste del hierro; baritado por equivalencia másica). */
export const transmision511: CurvaTransmision = (m, t) => {
  if (m === 'barite') return transmisionTG108('concrete', comoConcreto(m, t) * 10);
  return transmisionTG108(m === 'steel' ? 'iron' : m, t * 10);
};

/** Secundaria de TC, NCRP 147 Figs. A.2/A.3 a 120 o 140 kVp (acero y baritado por equivalencia másica: conservador). */
export function transmisionTCkVp(kvp: 120 | 140): CurvaTransmision {
  return (m, t) => {
    if (!(t > 0)) return 1;
    if (m === 'lead') return transmisionArcher(t * 10, AJUSTES_TC[kvp].lead);
    return transmisionArcher(comoConcreto(m, t) * 10, AJUSTES_TC[kvp].concrete);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Núcleo: barrera con varios términos fuente
// ─────────────────────────────────────────────────────────────────────────────

export interface TerminoFuente {
  nombre: string;
  /** Dosis semanal sin blindaje a 1 m (μSv·m²/semana). */
  K1m_uSv_m2_semana: number;
  curva: CurvaTransmision;
  /** Tasa a 1 m en el modo más intenso (μSv·m²/h), para la comprobación de la tasa instantánea. */
  tasa1m_uSv_m2_h?: number;
}

export interface EntradaBarreraSala {
  terminos: TerminoFuente[];
  material: MaterialSala;
  P_mSv_semana: number;
  T: number;
  /** Muro: distancia fuente → cara interior (m); el punto queda a d_interior + t + 0.3 m. */
  dInterior_m?: number;
  /** Techo/piso: distancia fija fuente → punto protegido (m), independiente del espesor. */
  dFija_m?: number;
}

export interface ResultadoBarreraSala {
  espesor_cm: number;
  espesorRedondeado_cm: number;
  /** Distancia al punto con el espesor redondeado (m). */
  d_m: number;
  K_sin_uSv_semana: number;
  K_con_uSv_semana: number;
  /** T·K detrás del espesor redondeado (μSv/semana). */
  dosisOcupacion_uSv_semana: number;
  /** Tasa instantánea detrás del espesor redondeado en el modo más intenso (μSv/h, sin T). */
  tasaMax_uSv_h: number;
  cumple: boolean;
}

/** Separación del punto protegido respecto a la cara exterior de la barrera (NCRP 147 §1.4 / NCRP 151 §1.4.1). */
export const SEPARACION_PUNTO_m = 0.3;

function distancia(e: EntradaBarreraSala, t_cm: number): number {
  if (e.dFija_m != null) return e.dFija_m;
  if (e.dInterior_m == null) throw new RangeError('Falta dInterior_m o dFija_m');
  return e.dInterior_m + t_cm / 100 + SEPARACION_PUNTO_m;
}

function kermaDetras(e: EntradaBarreraSala, t_cm: number): number {
  const d = distancia(e, t_cm);
  return e.terminos.reduce((a, x) => a + x.K1m_uSv_m2_semana * x.curva(e.material, t_cm), 0) / (d * d);
}

export function barreraSala(e: EntradaBarreraSala): ResultadoBarreraSala {
  if (!(e.T > 0 && e.T <= 1)) throw new RangeError('T debe estar en (0, 1]');
  if (!(e.P_mSv_semana > 0)) throw new RangeError('P debe ser positivo');
  const P = e.P_mSv_semana * 1000;
  const f = (t: number) => e.T * kermaDetras(e, t);
  let t = 0;
  if (f(0) > P) {
    let lo = 0;
    let hi = 10;
    while (f(hi) > P) { hi *= 2; if (hi > 1e4) throw new RangeError('Sin solución en 100 m'); }
    for (let i = 0; i < 200 && hi - lo > 1e-6; i++) { const m = (lo + hi) / 2; if (f(m) > P) lo = m; else hi = m; }
    t = hi;
  }
  const r = redondearSala(t, e.material);
  const d = distancia(e, r);
  const K_con = kermaDetras(e, r);
  const tasaMax = e.terminos.reduce((a, x) => a + (x.tasa1m_uSv_m2_h ?? 0) * x.curva(e.material, r), 0) / (d * d);
  const d0 = distancia(e, 0);
  return {
    espesor_cm: t,
    espesorRedondeado_cm: r,
    d_m: d,
    K_sin_uSv_semana: e.terminos.reduce((a, x) => a + x.K1m_uSv_m2_semana, 0) / (d0 * d0),
    K_con_uSv_semana: K_con,
    dosisOcupacion_uSv_semana: e.T * K_con,
    tasaMax_uSv_h: tasaMax,
    cumple: e.T * K_con <= P * (1 + 1e-9),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Gamma Knife Icon / Perfexion (autoblindado)
// ─────────────────────────────────────────────────────────────────────────────

export type SectorGK = 'frontal' | 'lateral' | 'trasero' | 'techo';

/**
 * Datos del Leksell Gamma Knife Icon (y Perfexion, misma unidad de radiación):
 * - 192 fuentes de Co-60; actividad autorizada ≤ 36 Ci por fuente y ≤ 6600 Ci en total (NRC, «Leksell Gamma Knife
 *   Perfexion, Icon and Elekta Esprit Licensing Guidance», ML23038A070, §4.1).
 * - Con puertas abiertas y camilla dentro, la radiación sale por la abertura a lo largo del eje de la camilla: el
 *   fabricante predice ≈ 240 μSv/h al final de la camilla, 2.9 m delante de las puertas, con fuentes nuevas; con 4122 Ci
 *   y maniquí se midieron 53 μSv/h. Con puertas cerradas: 0.30 μSv/h al final de la camilla y 0.45 μSv/h a 1.6 m del
 *   costado de la carcasa (McDermott et al., «Seeing radiation…», JACMP 2026, Tabla de mediciones).
 *
 * Tasas de diseño a 1 m del foco (μSv·m²/h) [supuestos, a sustituir por los mapas de tasa del «site planning» de Elekta]:
 * - frontal (cono de ±30° sobre el eje de la camilla): 240 μSv/h × (3.4 m)² × 1.1 ≈ 3100 (3.4 m: 2.9 m + 0.5 m del foco a
 *   las puertas; 1.1: de la carga «nueva» supuesta, ≈ 6000 Ci, al máximo autorizado de 6600 Ci).
 * - lateral y techo: 50 (≈ 100 veces lo medido junto a la puerta de la sala con puertas abiertas, 0.11 μSv/h a 2 m).
 * - trasero: 10. Reposo (puertas cerradas, isótropo): 5 (0.45 μSv/h a ≈ 2.6 m del foco × 6600/4122 ≈ 4.9).
 */
export const GAMMA_KNIFE_ICON = {
  fuentes: 192,
  actividadMaxima_Ci: 6600,
  alturaFoco_m: 0.967,
  tasaTratamiento_uSv_m2_h: { frontal: 3100, lateral: 50, trasero: 10, techo: 50 } as Record<SectorGK, number>,
  tasaReposo_uSv_m2_h: 5,
  referencia: 'NRC ML23038A070 §4.1; McDermott 2007 (JACMP 8(3)) Ec. 4–6; McDermott et al. 2026 (JACMP); NCRP 151 Tabla B.2 (Co-60)',
} as const;

export interface CargaGK {
  /** Horas por semana con fuentes en posición de tratamiento (puertas abiertas) a la actividad máxima. */
  horasTratamiento_semana: number;
  /** Horas por semana en reposo (puertas cerradas). */
  horasReposo_semana: number;
}

/** Términos fuente del Gamma Knife hacia un sector: Ec. 6 de McDermott 2007, K = Σ horas × tasa. */
export function terminosGammaKnife(sector: SectorGK, c: CargaGK, gk = GAMMA_KNIFE_ICON): TerminoFuente[] {
  const tr = gk.tasaTratamiento_uSv_m2_h[sector];
  return [
    { nombre: `Tratamiento (${sector})`, K1m_uSv_m2_semana: tr * c.horasTratamiento_semana, curva: transmisionCo60, tasa1m_uSv_m2_h: tr },
    { nombre: 'Reposo (fuga)', K1m_uSv_m2_semana: gk.tasaReposo_uSv_m2_h * c.horasReposo_semana, curva: transmisionCo60 },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// TC / kV de imagen (NCRP 147 §5.6.1)
// ─────────────────────────────────────────────────────────────────────────────

export interface CargaTC { estudiosSemana: number; DLP_mGy_cm: number; factor: number; kvp: 120 | 140; region: 'cuerpo' | 'cabeza' }
/** κ de NCRP 147 §5.6.1 (cm⁻¹): cuerpo 3×10⁻⁴ con el 1.2 de la Ec. 5.7; cabeza 9×10⁻⁵. */
export const KAPPA_TC_cm = { cuerpo: 1.2 * 3e-4, cabeza: 9e-5 } as const;

export function terminoTC(nombre: string, c: CargaTC): TerminoFuente {
  // K¹ (mGy a 1 m por estudio) = κ·DLP; × 1000 → μGy·m² (≈ μSv·m²).
  const K1 = KAPPA_TC_cm[c.region] * c.DLP_mGy_cm * c.factor * 1000;
  return { nombre, K1m_uSv_m2_semana: K1 * c.estudiosSemana, curva: transmisionTCkVp(c.kvp) };
}

// ─────────────────────────────────────────────────────────────────────────────
// PET (TG-108, sala de imagen o captación)
// ─────────────────────────────────────────────────────────────────────────────

export function terminoPET(e: Omit<EntradaTG108, 'd_m'>): TerminoFuente {
  return { nombre: `PET ${e.nuclido} (${e.sala})`, K1m_uSv_m2_semana: dosisSemanalTG108({ ...e, d_m: 1 }), curva: transmision511 };
}

// ─────────────────────────────────────────────────────────────────────────────
// HDR Ir-192 (Flexitron) y laberinto con dispersión simple
// ─────────────────────────────────────────────────────────────────────────────

/** Γδ de kerma en aire del Ir-192 (μGy·m²/(MBq·h)); el mismo de `MODALITIES` (`hdr-192ir`). */
export const GAMMA_AKR_IR192 = 0.111;

export interface CargaHDR { actividad_Ci: number; horasSemana: number }

export function terminoHDR(c: CargaHDR): TerminoFuente {
  const tasa = GAMMA_AKR_IR192 * c.actividad_Ci * 3.7e4; // μGy·m²/h
  return { nombre: `HDR Ir-192 ${c.actividad_Ci} Ci`, K1m_uSv_m2_semana: tasa * c.horasSemana, curva: transmisionIr192, tasa1m_uSv_m2_h: tasa };
}

export interface EntradaLaberinto {
  /** Dosis semanal a 1 m de la fuente (μSv·m²/semana) y tasa a 1 m (μSv·m²/h). */
  K1m_uSv_m2_semana: number;
  tasa1m_uSv_m2_h: number;
  /** Coeficiente de reflexión del muro iluminado por la boca (m⁻² por m² de área: adimensional por unidad de área). */
  alfa: number;
  /** Área del muro del laberinto vista por la fuente a través de la boca (m²). */
  A_m2: number;
  /** Fuente → centro del área dispersora (m) y área → puerta (m). */
  d_i_m: number;
  d_r_m: number;
}

/**
 * Dispersión simple en el laberinto (forma de NCRP 151 Ec. 2.10 para la dispersión del muro): K = K₁·α·A/(dᵢ²·d_r²).
 * Devuelve el término fuente «equivalente a 1 m» en la puerta (la puerta se resuelve con `dFija_m = 1`).
 */
export function terminoLaberinto(e: EntradaLaberinto, curva: CurvaTransmision): TerminoFuente {
  const g = (e.alfa * e.A_m2) / (e.d_i_m * e.d_i_m * e.d_r_m * e.d_r_m);
  return { nombre: 'Dispersión en el laberinto', K1m_uSv_m2_semana: e.K1m_uSv_m2_semana * g, curva, tasa1m_uSv_m2_h: e.tasa1m_uSv_m2_h * g };
}

/** Un término fuente atenuado por una barrera previa fija y llevado a «1 m» en el punto de la puerta. */
export function terminoAtenuado(x: TerminoFuente, material: MaterialSala, t_cm: number, d_m: number, curvaPuerta: CurvaTransmision): TerminoFuente {
  const g = x.curva(material, t_cm) / (d_m * d_m);
  return { nombre: `${x.nombre} a través de ${t_cm} cm de ${NOMBRE_MATERIAL_SALA[material]}`, K1m_uSv_m2_semana: x.K1m_uSv_m2_semana * g, curva: curvaPuerta, tasa1m_uSv_m2_h: (x.tasa1m_uSv_m2_h ?? 0) * g };
}

// ─────────────────────────────────────────────────────────────────────────────
// Diseño del proyecto (decisión del propietario 23-11-2026: perímetros a límite de público, sin sótanos,
// planta baja de 5.40 m, puntos a 0.5 m sobre el piso superior y a 1.7 m sobre el inferior)
// ─────────────────────────────────────────────────────────────────────────────

/** Nivel del piso superior (cara superior de la losa de N1) y del punto protegido encima (m sobre NPT). */
export const EDIFICIO = { alturaPB_m: 5.4, alturaPisoTipo_m: 5.0, puntoSobrePisoSuperior_m: 0.5, puntoSobrePisoInferior_m: 1.7, sotanos: 0 } as const;
export const dTecho = (alturaFuente_m: number) => EDIFICIO.alturaPB_m + EDIFICIO.puntoSobrePisoSuperior_m - alturaFuente_m;

/**
 * Clasificación del punto protegido: «publico» (objetivo de no controlada, el de todos los perímetros) o «controlada»
 * (objetivo de área controlada para POE). Sólo el pasillo del laberinto HDR es zona controlada (decisión del
 * propietario 24-11-2026).
 */
export type ZonaPunto = 'publico' | 'controlada';
/** P de diseño por zona (mSv/semana), de la fuente única `limitesDosis.ts` (NCRP 147 §1.3 / NCRP 151 §1.2). */
export const P_ZONA_mSv_semana: Record<ZonaPunto, number> = { publico: P_NO_CONTROLADA_mSv_semana, controlada: P_CONTROLADA_mSv_semana };

/** Requisitos de operación del pasillo del laberinto HDR como zona controlada (decisión del propietario 24-11-2026). */
export const REQUISITOS_PASILLO_LABERINTO_HDR = [
  'Zona controlada: señal de advertencia de radiación (trébol) y leyenda «Zona controlada: sólo personal autorizado» en la entrada del pasillo, por fuera de la puerta',
  'Acceso restringido: puerta con control de acceso (cerradura o tarjeta) y enclavamiento con la fuente; luz de «irradiando» en la entrada y en el pasillo',
  'El pasillo no puede ser paso de público ni de pacientes no acompañados: sólo POE y el paciente de la sesión acompañado por el POE',
  'Durante la exposición de la fuente nadie permanece en el pasillo (T = 1/8 [supuesto] es el de paso del POE)',
  'Dosimetría personal para el POE que lo cruza y vigilancia de área en el pasillo con la fuente expuesta',
] as const;

/** Muro interior del laberinto HDR que se construye (cm de concreto 2.35): el modelado en el MC de Cyclotron-SIM #38. */
export const MURO_INTERIOR_LABERINTO_HDR_cm = 34;

export interface BarreraProyecto {
  id: string;
  nombre: string;
  terminos: TerminoFuente[];
  dInterior_m?: number;
  dFija_m?: number;
  T: number;
  materiales: MaterialSala[];
  nota?: string;
  /** Zona del punto protegido; si falta, «publico». */
  zona?: ZonaPunto;
  /** Señalización y restricciones de acceso que exige la zona. */
  requisitos?: readonly string[];
}

export interface SalaProyecto {
  id: 'gk' | 'pet' | 'hdr';
  equipo: string;
  interior_m: [number, number];
  fuente_m: [number, number, number];
  barreras: BarreraProyecto[];
  supuestos: string[];
}

/** Cargas de trabajo [supuesto] (sin dato del propietario). */
export const CARGAS_PROYECTO = {
  gk: { horasTratamiento_semana: 30, horasReposo_semana: 138 } satisfies CargaGK,
  pet: { nuclido: 'F18', A0_MBq: 370, pacientesSemana: 60, tU_h: 1, tI_h: 0.5, sala: 'imagen' } satisfies Omit<EntradaTG108, 'd_m'>,
  petTC: { estudiosSemana: 60, DLP_mGy_cm: 600, factor: 1, kvp: 140, region: 'cuerpo' } satisfies CargaTC,
  hdr: { actividad_Ci: 12, horasSemana: 5 } satisfies CargaHDR,
  hdrKV: { estudiosSemana: 20, DLP_mGy_cm: 500, factor: 1, kvp: 120, region: 'cuerpo' } satisfies CargaTC,
};

export function salasProyecto(): SalaProyecto[] {
  const cg = CARGAS_PROYECTO;
  const hGK = GAMMA_KNIFE_ICON.alturaFoco_m;
  const gk = (s: SectorGK) => terminosGammaKnife(s, cg.gk);
  const pet = [terminoPET(cg.pet), terminoTC('TC (kV)', cg.petTC)];
  const hdr = [terminoHDR(cg.hdr), terminoTC('ImagingRing (kV)', cg.hdrKV)];
  const conc: MaterialSala[] = ['concrete', 'barite', 'lead'];

  // HDR: laberinto en L por el sur. Boca de 1.20 m en el extremo oeste del muro sur; pasillo de 1.20 m; puerta al este.
  // Muro interior del laberinto (m): se construye con 34 cm, el espesor con que se dimensionó a límite de público (T = 1/8)
  // y el que modela el MC de Cyclotron-SIM #38. Con el pasillo como zona controlada el analítico pide menos (fila
  // «laberinto»), pero no se adelgaza: el MC preliminar da 2.7 veces el analítico en el pasillo.
  const tLab = MURO_INTERIOR_LABERINTO_HDR_cm / 100;
  const ir = terminoHDR(cg.hdr);
  const dI = Math.hypot(3.0 - 0.6, 2.5 + tLab + 1.2); // fuente → centro del muro iluminado por la boca
  const dR = 5.7; // centro del área dispersora → puerta
  const lab = terminoLaberinto({ K1m_uSv_m2_semana: ir.K1m_uSv_m2_semana, tasa1m_uSv_m2_h: ir.tasa1m_uSv_m2_h!, alfa: 0.03, A_m2: 1.2 * 3.0, d_i_m: dI, d_r_m: dR }, transmisionIr192);
  // Directa hacia la puerta: atraviesa el muro del laberinto en oblicuo (recorrido t/cosθ, sin crédito extra).
  const dDir = Math.hypot(6.3 - 3.0, 2.5 + tLab + 0.6);
  const recorrido = (tLab * 100 * dDir) / (2.5 + tLab + 0.6);
  const dirPuerta = [terminoAtenuado(ir, 'concrete', recorrido, dDir, transmisionIr192), terminoAtenuado(terminoTC('ImagingRing (kV)', cg.hdrKV), 'concrete', recorrido, dDir, transmisionTCkVp(120))];

  return [
    {
      id: 'gk', equipo: 'Leksell Gamma Knife Icon (192 fuentes Co-60)', interior_m: [7.2, 5.6], fuente_m: [2.4, 2.8, hGK],
      supuestos: [
        '30 h/semana con fuentes en tratamiento a 6600 Ci (6 pacientes/día × 5 días × 60 min) y 138 h/semana en reposo [supuesto]',
        'Tasas a 1 m: frontal 3100, lateral y techo 50, trasero 10, reposo 5 μSv·m²/h [supuesto derivado de Elekta/McDermott 2026]',
        'TVL de Co-60 primario (NCRP 151 Tabla B.2) para la dispersa: conservador',
        'T = 1 en todos los perímetros [supuesto]; piso sobre terreno (sin sótano): sin barrera de piso',
      ],
      barreras: [
        { id: 'frontal', nombre: 'Muro frontal (eje de la camilla)', terminos: gk('frontal'), dInterior_m: 4.8, T: 1, materiales: ['concrete', 'barite', 'lead', 'steel'] },
        { id: 'lateral', nombre: 'Muros laterales', terminos: gk('lateral'), dInterior_m: 2.8, T: 1, materiales: ['concrete', 'barite', 'lead', 'steel'] },
        { id: 'trasero', nombre: 'Muro trasero', terminos: gk('trasero'), dInterior_m: 2.4, T: 1, materiales: ['concrete', 'barite', 'lead', 'steel'] },
        { id: 'techo', nombre: 'Losa de techo (punto a +5.90)', terminos: gk('techo'), dFija_m: dTecho(hGK), T: 1, materiales: ['concrete', 'barite', 'lead'] },
        { id: 'puerta', nombre: 'Puerta (muro lateral, detrás del foco)', terminos: gk('lateral'), dInterior_m: Math.hypot(2.4 - 1.1, 2.8), T: 1, materiales: ['lead', 'steel'], nota: 'Sin laberinto: puerta lateral y detrás del foco (McDermott 2007)' },
        { id: 'puertaT5', nombre: 'Puerta, variante con pasillo T = 1/5', terminos: gk('lateral'), dInterior_m: Math.hypot(2.4 - 1.1, 2.8), T: 1 / 5, materiales: ['lead'], nota: 'Sólo si el propietario acepta T = 1/5 frente a la puerta (NCRP 151 Tabla B.1: pasillos)' },
      ],
    },
    {
      id: 'pet', equipo: 'Siemens Biograph Trinion (PET/CT)', interior_m: [7.6, 5.0], fuente_m: [2.0, 2.5, 1.064],
      supuestos: [
        'F-18, 370 MBq/paciente, 60 pacientes/semana (12/día), captación 60 min fuera de la sala, 30 min en la sala de imagen [supuesto]',
        'TG-108: absorción del paciente 0.36, vaciado 0.85, decaimiento durante la captación y la imagen',
        'TC: 60 estudios/semana de cuerpo, DLP 600 mGy·cm, 140 kVp, sin factor de contraste [supuesto]',
        'T = 1 en todos los perímetros [supuesto]; piso sobre terreno: sin barrera de piso',
      ],
      barreras: [
        { id: 'trasero', nombre: 'Muro detrás del gantry', terminos: pet, dInterior_m: 2.0, T: 1, materiales: conc },
        { id: 'frontal', nombre: 'Muro a los pies de la mesa', terminos: pet, dInterior_m: 5.6, T: 1, materiales: conc },
        { id: 'lateral', nombre: 'Muros laterales (incl. control)', terminos: pet, dInterior_m: 2.5, T: 1, materiales: conc },
        { id: 'ventana', nombre: 'Ventana de control (vidrio plomado)', terminos: pet, dInterior_m: 2.5, T: 1, materiales: ['lead'], nota: 'Espesor en mm de Pb equivalente' },
        { id: 'techo', nombre: 'Losa de techo (punto a +5.90)', terminos: pet, dFija_m: dTecho(1.064), T: 1, materiales: conc },
        { id: 'puerta', nombre: 'Puerta (muro lateral, a los pies)', terminos: pet, dInterior_m: Math.hypot(5.8 - 2.0, 2.5), T: 1, materiales: ['lead'] },
      ],
    },
    {
      id: 'hdr', equipo: 'Elekta Studio: Flexitron HDR Ir-192 + ImagingRing', interior_m: [6.0, 5.0], fuente_m: [3.0, 2.5, 1.117],
      supuestos: [
        'Fuente Ir-192 de 12 Ci (444 GBq) y 5 h/semana de fuente expuesta (20 fracciones × 15 min) [supuesto]',
        'ImagingRing: 20 estudios/semana, DLP 500 mGy·cm, 120 kVp [supuesto]',
        'Laberinto en L: boca 1.20 m, pasillo 1.20 m, α = 0.03 en el muro iluminado (conservador para 0.25–0.5 MeV) [supuesto]',
        'T = 1 en todos los perímetros [supuesto]; piso sobre terreno: sin barrera de piso',
        'Pasillo del laberinto = zona controlada (decisión del propietario 24-11-2026): P de área controlada con T = 1/8; el resto de los puntos a límite de público',
        'Muro interior del laberinto: se construye con 34 cm (el del MC preliminar de Cyclotron-SIM #38); pendiente confirmar con la corrida completa',
      ],
      barreras: [
        { id: 'oe', nombre: 'Muros oeste y este', terminos: hdr, dInterior_m: 3.0, T: 1, materiales: conc },
        { id: 'norte', nombre: 'Muro norte', terminos: hdr, dInterior_m: 2.5, T: 1, materiales: conc },
        {
          id: 'laberinto', nombre: 'Muro interior del laberinto (sur; pasillo = zona controlada)', terminos: hdr, dInterior_m: 2.5, T: 1 / 8, materiales: conc,
          zona: 'controlada', requisitos: REQUISITOS_PASILLO_LABERINTO_HDR,
          nota: 'Pasillo del laberinto = zona controlada (decisión del propietario 24-11-2026), T = 1/8 [supuesto]; no puede ser paso de público ni de pacientes no acompañados. Se construyen 34 cm (MC preliminar de Cyclotron-SIM #38); el exterior lo protege el muro exterior',
        },
        { id: 'labext', nombre: 'Muro exterior del laberinto (frente a la boca)', terminos: hdr, dInterior_m: dI, T: 1, materiales: conc },
        { id: 'techo', nombre: 'Losa de techo (punto a +5.90)', terminos: hdr, dFija_m: dTecho(1.117), T: 1, materiales: conc },
        { id: 'puerta', nombre: 'Puerta del laberinto', terminos: [lab, ...dirPuerta], dFija_m: 1, T: 1, materiales: ['lead'], nota: `Dispersión simple + directa por ${(recorrido).toFixed(0)} cm oblicuos del muro del laberinto` },
      ],
    },
  ];
}

export interface FilaDiseno {
  sala: SalaProyecto['id'];
  barrera: string;
  nombre: string;
  material: MaterialSala;
  zona: ZonaPunto;
  P_mSv_semana: number;
  resultado: ResultadoBarreraSala;
  nota?: string;
  requisitos?: readonly string[];
}

/** Tabla de espesores del proyecto (P = objetivo de público, salvo los puntos declarados zona controlada). */
export function disenoProyecto(): FilaDiseno[] {
  return salasProyecto().flatMap((s) => s.barreras.flatMap((b) => b.materiales.map((m) => {
    const zona = b.zona ?? 'publico';
    const P = P_ZONA_mSv_semana[zona];
    return {
      sala: s.id, barrera: b.id, nombre: b.nombre, material: m, zona, P_mSv_semana: P, nota: b.nota, requisitos: b.requisitos,
      resultado: barreraSala({ terminos: b.terminos, material: m, P_mSv_semana: P, T: b.T, dInterior_m: b.dInterior_m, dFija_m: b.dFija_m }),
    };
  })));
}
