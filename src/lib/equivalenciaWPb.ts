/**
 * Equivalencia tungsteno ↔ plomo DEPENDIENTE DE LA ENERGÍA y de la composición de la aleación (revisión del #58).
 *
 * Antes: un factor único de masa W→Pb (1.054–1.059, `materialDatabase.factorWPb`) calculado con W PURO a 1.17–1.33 MeV.
 * Las piezas de blindaje son aleaciones pesadas de W (ASTM B777, W-Ni-Fe o W-Ni-Cu con 90–97 % de W, 16.85–18.85 g/cm³);
 * el aglutinante (Ni, Fe, Cu) atenúa por gramo mucho menos que el W fuera de la zona Compton, así que el factor crece:
 *   · MV (pares): 1.069 a 6 MeV, 1.084 a 10, 1.098 a 18 MeV (W puro: 1.043–1.052) → con el factor único el TVL de W
 *     quedaba ≈ 4 % corto en 6–20 MV; y 1.082 a 1 MeV, que fija el factor de 6 MV (no hay clave de 4 MV) (ver «Energías de MV»);
 *   · medicina nuclear (fotoeléctrico): 1.21 a 511 keV, 1.39 a 140.5 keV (W puro 1.17 y 1.27);
 *   · entre los bordes K del W (69.525 keV) y del Pb (88.0045 keV) el W atenúa MÁS por gramo (factor 0.31–0.34): ahí la
 *     equivalencia por masa no es conservadora en sentido inverso (Pb por W), y se toma el máximo sobre el espectro.
 *
 * Método: f(E) = (µ/ρ)_Pb(E) / (µ/ρ)_aleación(E), (µ/ρ)_aleación = Σ wᵢ (µ/ρ)ᵢ (regla de mezcla de Bragg), con µ/ρ total
 * (con coherente) de NIST XCOM 3.1 por elemento (`scripts/fase11_xcom_malla.py`, que reproduce SRD 126 a ±0.05 % en
 * 0.01–20 MeV), interpolado log-log. Espesor de aleación equivalente a t_Pb: t_W = t_Pb · ρ_Pb · F / ρ_aleación, con
 * F = máximo de f(E) sobre las energías que rigen (`factorWPbEnergias`; p. ej. las líneas del espectro en medicina
 * nuclear, aunque el motor de medicina nuclear no la usa: el W sigue ahí la equivalencia másica con concreto); en MV y Co-60,
 * de 1.0 MeV a la energía nominal (o las dos líneas de Co-60). Tomar el máximo garantiza que, en cada energía del haz,
 * la masa de W que se pone atenúa al menos lo que la de Pb a la que sustituye (nunca menos espesor que el cálculo
 * físico a esa energía). El buildup del W y del Pb (Z 74 y 82) es del mismo orden; en el fotoeléctrico el del W es
 * algo mayor, pero el factor es ahí 1.2–1.4, muy por encima del efecto del buildup.
 *
 * Composiciones (fracción en masa) de ASTM B777-15 «Standard Specification for Tungsten Base, High-Density Metal»
 * (clase 1: 90 % W, 16.85–17.25 g/cm³; clase 2: 92.5 %, 17.15–17.85; clase 3: 95 %, 17.75–18.35; clase 4: 97 %,
 * 18.25–18.85); el reparto Ni:Fe 7:3 y Ni:Cu 6:4 es el habitual de las aleaciones comerciales (la norma fija sólo el W y
 * la densidad). Por omisión (`ALEACION_W_DEFECTO`) se toma el peor caso de la clase 1 (Ni-Fe o Ni-Cu en cada energía),
 * que es la del material «Tungsteno» de 17.0 g/cm³ del catálogo.
 */
/** NIST XCOM 3.1, µ/ρ total con coherente (cm²/g): [E (MeV), Pb, W, Ni, Fe, Cu]; bordes K de W y Pb duplicados. */
export const XCOM_MU_RHO_W_PB: readonly (readonly [number, number, number, number, number, number])[] = [
  [0.03, 30.317, 22.729, 10.344, 8.1764, 10.913], [0.04, 14.36, 10.669, 4.6001, 3.6292, 4.8617], [0.05, 8.0416, 5.9501, 2.4744, 1.9573, 2.6129],
  [0.06, 5.0197, 3.7126, 1.5111, 1.2049, 1.5926], [0.069525, 3.445, 2.5516, 1.0314, 0.83009, 1.0829], [0.069525, 3.445, 11.234, 1.0314, 0.83009, 1.0829],
  [0.08, 2.4194, 7.8089, 0.73056, 0.5952, 0.76297], [0.0880045, 1.9098, 6.1275, 0.5855, 0.48213, 0.60884], [0.0880045, 7.6838, 6.1275, 0.5855, 0.48213, 0.60884],
  [0.1, 5.5491, 4.4369, 0.44395, 0.37174, 0.4585], [0.10318, 5.1264, 4.098, 0.41645, 0.35026, 0.42928], [0.140511, 2.3686, 1.8643, 0.24241, 0.21359, 0.24456],
  [0.15, 2.0145, 1.5812, 0.22079, 0.19644, 0.2217], [0.16743, 1.5361, 1.2034, 0.19166, 0.17317, 0.19098], [0.17128, 1.4528, 1.1382, 0.18657, 0.16907, 0.18562],
  [0.2, 0.99862, 0.78447, 0.15821, 0.14605, 0.15593], [0.24535, 0.62222, 0.49276, 0.13274, 0.12482, 0.1296], [0.3, 0.40321, 0.32382, 0.11539, 0.10987, 0.11194],
  [0.3213159, 0.3507, 0.28344, 0.11058, 0.10563, 0.10708], [0.364489, 0.27489, 0.22521, 0.10276, 0.09864, 0.099221], [0.4, 0.23228, 0.19247, 0.097646, 0.094002, 0.094129],
  [0.5, 0.16135, 0.13781, 0.086982, 0.084146, 0.083625], [0.511, 0.15618, 0.1338, 0.086036, 0.08326, 0.082699], [0.6, 0.12475, 0.1093, 0.07944, 0.077037, 0.076252],
  [0.636989, 0.11551, 0.10202, 0.077126, 0.074842, 0.074002], [0.722911, 0.099237, 0.089097, 0.072451, 0.070389, 0.069475], [0.8, 0.088699, 0.080664, 0.068911, 0.066994, 0.066056],
  [0.887688, 0.07963, 0.073361, 0.065442, 0.063646, 0.062707], [1.0, 0.071019, 0.066177, 0.061596, 0.059947, 0.059007], [1.1732, 0.061745, 0.058288, 0.056737, 0.055252, 0.054337],
  [1.25, 0.058752, 0.055763, 0.054941, 0.053501, 0.052612], [1.3325, 0.056143, 0.053508, 0.053196, 0.051801, 0.050941], [1.5, 0.052223, 0.049998, 0.050153, 0.048831, 0.04803],
  [1.7445, 0.048474, 0.046578, 0.046671, 0.045406, 0.044693], [2.0, 0.046065, 0.044329, 0.043871, 0.042648, 0.042046], [3.0, 0.042341, 0.040749, 0.037452, 0.036213, 0.035988],
  [4.0, 0.041975, 0.040376, 0.034436, 0.033118, 0.03318], [5.0, 0.04272, 0.041034, 0.032886, 0.031461, 0.031767], [6.0, 0.04391, 0.042105, 0.0321, 0.03057, 0.031079],
  [8.0, 0.046747, 0.04472, 0.03164, 0.029914, 0.030741], [10.0, 0.04972, 0.047471, 0.031847, 0.029943, 0.031029], [15.0, 0.056577, 0.053844, 0.033197, 0.030923, 0.03247],
  [18.0, 0.06001, 0.05704, 0.034145, 0.031706, 0.033443], [20.0, 0.062056, 0.058928, 0.034765, 0.032236, 0.034078],
];

type Elemento = 'Pb' | 'W' | 'Ni' | 'Fe' | 'Cu';
const COL: Record<Elemento, 1 | 2 | 3 | 4 | 5> = { Pb: 1, W: 2, Ni: 3, Fe: 4, Cu: 5 };

export interface AleacionW {
  nombre: string;
  /** Fracciones en masa (suman 1). */
  composicion: Partial<Record<Exclude<Elemento, 'Pb'>, number>>;
  /** Densidad nominal (g/cm³). */
  densidad: number;
}

/** Aleaciones pesadas de W de ASTM B777 (y W puro como referencia). */
export const ALEACIONES_W: Record<string, AleacionW> = {
  'B777-1-NiFe': { nombre: 'ASTM B777 clase 1, 90W-7Ni-3Fe', composicion: { W: 0.9, Ni: 0.07, Fe: 0.03 }, densidad: 17.0 },
  'B777-1-NiCu': { nombre: 'ASTM B777 clase 1, 90W-6Ni-4Cu', composicion: { W: 0.9, Ni: 0.06, Cu: 0.04 }, densidad: 17.0 },
  'B777-2-NiFe': { nombre: 'ASTM B777 clase 2, 92.5W-5.25Ni-2.25Fe', composicion: { W: 0.925, Ni: 0.0525, Fe: 0.0225 }, densidad: 17.5 },
  'B777-3-NiFe': { nombre: 'ASTM B777 clase 3, 95W-3.5Ni-1.5Fe', composicion: { W: 0.95, Ni: 0.035, Fe: 0.015 }, densidad: 18.0 },
  'B777-4-NiFe': { nombre: 'ASTM B777 clase 4, 97W-2.1Ni-0.9Fe', composicion: { W: 0.97, Ni: 0.021, Fe: 0.009 }, densidad: 18.5 },
  puro: { nombre: 'W puro', composicion: { W: 1 }, densidad: 19.3 },
};
/** Por omisión: peor caso de la clase 1 (17.0 g/cm³, el «Tungsteno» del catálogo). */
export const ALEACION_W_DEFECTO: readonly AleacionW[] = [ALEACIONES_W['B777-1-NiFe'], ALEACIONES_W['B777-1-NiCu']];

export const RHO_PB_EQUIVALENCIA = 11.35;

/** µ/ρ (cm²/g) de un elemento a E (MeV), log-log entre nodos (en un borde exacto, el valor de debajo). */
export function muRhoElemento(el: Elemento, E: number): number {
  const t = XCOM_MU_RHO_W_PB;
  const k = COL[el];
  if (E <= t[0][0]) return t[0][k];
  for (let i = 0; i < t.length - 1; i++) {
    const a = t[i], b = t[i + 1];
    if (E <= b[0] && b[0] > a[0]) {
      return Math.exp(Math.log(a[k]) + (Math.log(E / a[0]) / Math.log(b[0] / a[0])) * Math.log(b[k] / a[k]));
    }
  }
  return t[t.length - 1][k];
}

/** µ/ρ (cm²/g) de la aleación (regla de mezcla). */
export function muRhoAleacion(a: AleacionW, E: number): number {
  return (Object.entries(a.composicion) as [Elemento, number][]).reduce((s, [el, w]) => s + w * muRhoElemento(el, E), 0);
}

/** f(E) = (µ/ρ)_Pb/(µ/ρ)_aleación: masa de aleación por masa de Pb a la misma atenuación, a la energía E (MeV). */
export function factorPbAleacion(E: number, aleaciones: readonly AleacionW[] = ALEACION_W_DEFECTO): number {
  return Math.max(...aleaciones.map((a) => muRhoElemento('Pb', E) / muRhoAleacion(a, E)));
}

/** F = máximo de f(E) sobre un conjunto de energías (MeV). */
export function factorWPbEnergias(E: readonly number[], aleaciones: readonly AleacionW[] = ALEACION_W_DEFECTO): number {
  return Math.max(...E.map((e) => factorPbAleacion(e, aleaciones)));
}

/**
 * Energías (MeV) que rigen el TVL de cada haz: Co-60 sus dos líneas; MV de 1.0 MeV a la nominal.
 *
 * Energías de MV (2.ª revisión del #58, B2): f(E) baja de 1.082 a 1 MeV a un mínimo de 1.042 hacia 2 MeV y vuelve a subir
 * con los pares (1.069 a 6 MeV, 1.100 a 20 MeV). Con la lista anterior (desde 1.25 MeV) F(6 MV) = 1.069 < f(1 MeV) =
 * 1.082, aunque el haz de 6 MV lleva fotones de 1 MeV, y F(MV) quedaba por debajo de un fotón de energía menor que la
 * de Co-60. Desde 1.0 MeV: F(MV) ≥ F(Co-60) = 1.064 y ≥ f(E) en todo 1 MeV–nominal, y es no decreciente con la energía
 * nominal (6 MV 1.082, 10 MV 1.084, 15 MV 1.094, 18 MV 1.098, 25 MV 1.100). Corte en 1.0 MeV: tras la primera TVL de Pb
 * del haz de 6 MV (5.7 cm, NCRP 151 Tabla B.2) un fotón de 1 MeV conserva e^(−(µ(1)−µ(4))·ρ·5.7) ≈ 15 % del peso
 * relativo que uno cerca del mínimo de µ del Pb (≈ 4 MeV), y debe contarse; uno de 0.8 MeV, ≈ 5 %, y uno de 0.6 MeV,
 * < 1 %: con f(0.8) = 1.118 sólo 3 % mayor que f(1.0), su efecto en el espesor de W es ≤ 0.2 %.
 */
export const ENERGIAS_HAZ_W: Record<'Co60' | '6' | '10' | '15' | '18' | '25', readonly number[]> = {
  Co60: [1.1732, 1.3325],
  '6': [1.0, 1.25, 1.5, 2, 3, 4, 5, 6],
  '10': [1.0, 1.25, 1.5, 2, 3, 4, 5, 6, 8, 10],
  '15': [1.0, 1.25, 1.5, 2, 3, 4, 5, 6, 8, 10, 15],
  '18': [1.0, 1.25, 1.5, 2, 3, 4, 5, 6, 8, 10, 15, 18],
  // 25 MV: la tabla llega a 20 MeV (el factor crece despacio: 1.0996 a 20 MeV).
  '25': [1.0, 1.25, 1.5, 2, 3, 4, 5, 6, 8, 10, 15, 20],
};

/** F de un haz MV o Co-60. */
export function factorWPbHaz(e: keyof typeof ENERGIAS_HAZ_W, aleaciones: readonly AleacionW[] = ALEACION_W_DEFECTO): number {
  return factorWPbEnergias(ENERGIAS_HAZ_W[e], aleaciones);
}

/** Espesor de aleación (mm) equivalente a t_Pb (mm) de plomo con el factor F. */
export function espesorWDesdePb(tPb_mm: number, F: number, rhoAleacion: number, rhoPb = RHO_PB_EQUIVALENCIA): number {
  return (tPb_mm * rhoPb * F) / rhoAleacion;
}
