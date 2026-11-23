/**
 * Alturas de los niveles del edificio para techos, losas y puntos protegidos en pisos superiores e inferiores.
 *
 * Dato del proyecto (22-11-2026): después de planta baja, TODOS los niveles miden 5 m de piso a contrapiso (altura de
 * entrepiso, losa incluida). Planta baja tiene su propia altura. Las dos son configurables, y se puede dar una altura
 * distinta a un nivel concreto (`alturasPorNivel`).
 *
 * Convención de niveles: 0 = planta baja; 1, 2… = niveles superiores; −1, −2… = sótanos. La elevación de un nivel es
 * la de su piso terminado respecto del piso de planta baja.
 *
 * Punto protegido en otro nivel (convención de NCRP 147 para pisos y techos, la que usan también los ejemplos de NCRP
 * 151): 0.5 m sobre el piso del nivel de arriba y 1.7 m sobre el piso del nivel de abajo (la cabeza de una persona de
 * pie). Ambos son configurables.
 */

/** Altura de piso a contrapiso de cada nivel arriba de planta baja (m). */
export const ALTURA_ENTREPISO_M = 5;
/** Altura del punto protegido sobre el piso del nivel de arriba (m). */
export const ALTURA_PUNTO_NIVEL_ARRIBA_M = 0.5;
/** Altura del punto protegido sobre el piso del nivel de abajo (m). */
export const ALTURA_PUNTO_NIVEL_ABAJO_M = 1.7;

export interface NivelesEdificio {
  /** Planta baja, de piso a contrapiso (m). Sin dato, la de entrepiso: confírmela en el proyecto. */
  alturaPlantaBaja_m?: number;
  /** Niveles arriba de planta baja y sótanos (m). Por omisión 5 m. */
  alturaEntrepiso_m?: number;
  /** Excepciones: altura de un nivel concreto (m), p. ej. `{ 3: 6 }`. */
  alturasPorNivel?: Record<number, number>;
}

const positivo = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

/** Altura de piso a contrapiso del nivel `n` (m). */
export function alturaNivel_m(n: number, cfg: NivelesEdificio = {}): number {
  if (!Number.isInteger(n)) throw new RangeError(`Nivel no entero: ${n}`);
  const propio = cfg.alturasPorNivel?.[n];
  if (positivo(propio)) return propio;
  const entrepiso = positivo(cfg.alturaEntrepiso_m) ? cfg.alturaEntrepiso_m : ALTURA_ENTREPISO_M;
  if (n === 0) return positivo(cfg.alturaPlantaBaja_m) ? cfg.alturaPlantaBaja_m : entrepiso;
  return entrepiso;
}

/** Elevación del piso del nivel `n` sobre el piso de planta baja (m; negativa en sótanos). */
export function elevacionNivel_m(n: number, cfg: NivelesEdificio = {}): number {
  if (!Number.isInteger(n)) throw new RangeError(`Nivel no entero: ${n}`);
  let z = 0;
  if (n > 0) for (let k = 0; k < n; k++) z += alturaNivel_m(k, cfg);
  else for (let k = n; k < 0; k++) z -= alturaNivel_m(k, cfg);
  return z;
}

export interface PuntoEnNivel {
  /** Nivel de la sala y altura de la fuente (isocentro) sobre su piso (m). */
  nivelFuente: number;
  alturaFuente_m: number;
  /** Nivel del área protegida. */
  nivelDestino: number;
  /** Altura del punto sobre el piso del nivel destino; por omisión 0.5 m arriba y 1.7 m abajo. */
  alturaPunto_m?: number;
}

/** Distancia vertical (m) de la fuente al punto protegido de otro nivel (o del mismo, a la altura indicada). */
export function distanciaVerticalNivel_m(p: PuntoEnNivel, cfg: NivelesEdificio = {}): number {
  const zFuente = elevacionNivel_m(p.nivelFuente, cfg) + p.alturaFuente_m;
  const hPunto = p.alturaPunto_m ?? (p.nivelDestino >= p.nivelFuente ? ALTURA_PUNTO_NIVEL_ARRIBA_M : ALTURA_PUNTO_NIVEL_ABAJO_M);
  const zPunto = elevacionNivel_m(p.nivelDestino, cfg) + hPunto;
  return Math.abs(zPunto - zFuente);
}

/** Distancias fuente → punto en el nivel inmediato de arriba y de abajo (m), para techo y piso de la sala. */
export function distanciasTechoPiso_m(
  nivelSala: number, alturaFuente_m: number, cfg: NivelesEdificio = {},
  opciones: { nivelArriba?: number; nivelAbajo?: number; alturaPuntoArriba_m?: number; alturaPuntoAbajo_m?: number } = {},
): { arriba_m: number; abajo_m: number } {
  return {
    arriba_m: distanciaVerticalNivel_m({ nivelFuente: nivelSala, alturaFuente_m, nivelDestino: opciones.nivelArriba ?? nivelSala + 1, alturaPunto_m: opciones.alturaPuntoArriba_m ?? ALTURA_PUNTO_NIVEL_ARRIBA_M }, cfg),
    abajo_m: distanciaVerticalNivel_m({ nivelFuente: nivelSala, alturaFuente_m, nivelDestino: opciones.nivelAbajo ?? nivelSala - 1, alturaPunto_m: opciones.alturaPuntoAbajo_m ?? ALTURA_PUNTO_NIVEL_ABAJO_M }, cfg),
  };
}
