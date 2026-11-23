/**
 * Alturas de los niveles del edificio para techos, losas y puntos protegidos en pisos superiores e inferiores.
 *
 * Datos del propietario: planta baja mide **5.40 m** de piso a contrapiso (23-11-2026) y, arriba de planta baja,
 * TODOS los niveles miden **5 m** de piso a contrapiso (22-11-2026; altura de entrepiso, losa incluida). Las dos son
 * configurables, y se puede dar una altura distinta a un nivel concreto (`alturasPorNivel`).
 *
 * Sótanos: el edificio de este proyecto NO tiene sótanos (decisión del propietario, 23-11-2026; `EDIFICIO_SIN_SOTANOS`).
 * Con `sinSotanos: true` un nivel < 0 no existe (`NivelInexistente`): bajo planta baja está el terreno y el suelo de una
 * sala en PB no tiene área ocupada debajo. Sin `sinSotanos` (otro edificio) los sótanos existen pero no tienen altura
 * por omisión: sin `alturaSotano_m` ni `alturasPorNivel[n]` para el sótano `n`, cualquier cálculo que lo necesite
 * lanza `AlturaSotanoFaltante` (el diálogo «Suelo y techo» la pide).
 *
 * Convención de niveles: 0 = planta baja; 1, 2… = niveles superiores; −1, −2… = sótanos. La elevación de un nivel es
 * la de su piso terminado respecto del piso de planta baja.
 *
 * Punto protegido en otro nivel (convención de NCRP 147 para pisos y techos, la que usan también los ejemplos de NCRP
 * 151): 0.5 m sobre el piso del nivel de arriba y 1.7 m sobre el piso del nivel de abajo (la cabeza de una persona de
 * pie). Ambos son configurables.
 */

/** El edificio del proyecto no tiene sótanos (decisión del propietario, 23-11-2026). Valor inicial del diálogo. */
export const EDIFICIO_SIN_SOTANOS = true;
/** Altura de planta baja, de piso a contrapiso (m). Dato del propietario. */
export const ALTURA_PLANTA_BAJA_M = 5.4;
/** Altura de piso a contrapiso de cada nivel arriba de planta baja (m). Dato del propietario. */
export const ALTURA_ENTREPISO_M = 5;
/** Altura del punto protegido sobre el piso del nivel de arriba (m). */
export const ALTURA_PUNTO_NIVEL_ARRIBA_M = 0.5;
/** Altura del punto protegido sobre el piso del nivel de abajo (m). */
export const ALTURA_PUNTO_NIVEL_ABAJO_M = 1.7;

export interface NivelesEdificio {
  /** Planta baja, de piso a contrapiso (m). Por omisión 5.40 m (dato del propietario). */
  alturaPlantaBaja_m?: number;
  /** Niveles arriba de planta baja (m). Por omisión 5 m (dato del propietario). */
  alturaEntrepiso_m?: number;
  /** Sótanos, de piso a contrapiso (m). SIN valor por omisión: sin dato, el cálculo que lo use falla y lo pide. */
  alturaSotano_m?: number;
  /** Excepciones: altura de un nivel concreto (m), p. ej. `{ 3: 6, -1: 4.5 }`. */
  alturasPorNivel?: Record<number, number>;
  /** true: el edificio no tiene sótanos y un nivel < 0 no existe (`NivelInexistente`). Este proyecto: `EDIFICIO_SIN_SOTANOS`. */
  sinSotanos?: boolean;
}

/** El nivel pedido no existe: un sótano en un edificio sin sótanos. */
export class NivelInexistente extends RangeError {
  readonly nivel: number;
  constructor(nivel: number) {
    super(`El nivel ${nivel} no existe: el edificio no tiene sótanos (bajo planta baja está el terreno).`);
    this.name = 'NivelInexistente';
    this.nivel = nivel;
  }
}

/** Falta la altura de un sótano: no hay dato del propietario y no se asume ninguna. */
export class AlturaSotanoFaltante extends RangeError {
  readonly nivel: number;
  constructor(nivel: number) {
    super(`Falta la altura del sótano (nivel ${nivel}): no hay dato; captúrela (alturaSotano_m o alturasPorNivel).`);
    this.name = 'AlturaSotanoFaltante';
    this.nivel = nivel;
  }
}

const positivo = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

/**
 * Altura de piso a contrapiso del nivel `n` (m). En un sótano sin dato lanza `AlturaSotanoFaltante`; en un edificio sin
 * sótanos, `NivelInexistente`.
 */
export function alturaNivel_m(n: number, cfg: NivelesEdificio = {}): number {
  if (!Number.isInteger(n)) throw new RangeError(`Nivel no entero: ${n}`);
  if (n < 0 && cfg.sinSotanos) throw new NivelInexistente(n);
  const propio = cfg.alturasPorNivel?.[n];
  if (positivo(propio)) return propio;
  if (n === 0) return positivo(cfg.alturaPlantaBaja_m) ? cfg.alturaPlantaBaja_m : ALTURA_PLANTA_BAJA_M;
  if (n > 0) return positivo(cfg.alturaEntrepiso_m) ? cfg.alturaEntrepiso_m : ALTURA_ENTREPISO_M;
  if (positivo(cfg.alturaSotano_m)) return cfg.alturaSotano_m;
  throw new AlturaSotanoFaltante(n);
}

/** Elevación del piso del nivel `n` sobre el piso de planta baja (m; negativa en sótanos). */
export function elevacionNivel_m(n: number, cfg: NivelesEdificio = {}): number {
  if (!Number.isInteger(n)) throw new RangeError(`Nivel no entero: ${n}`);
  if (n < 0 && cfg.sinSotanos) throw new NivelInexistente(n);
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
