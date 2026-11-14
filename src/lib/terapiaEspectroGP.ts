/**
 * Fase 11 — blindaje de radionúclidos por ESPECTRO COMPLETO con buildup Geometric-Progression (GP): terapia con I-131 y
 * Lu-177 (motor y diálogos) y, desde el seguimiento de #57 (hallazgo N3), también los diagnósticos de las bibliotecas
 * de los diálogos (I-123, Tc-99m, Tl-201, In-111, Ga-67, Sm-153 y Zr-89) y la modalidad SPECT Tc-99m del motor. Antes
 * éstos usaban n·TVL de haz estrecho, sin buildup: en concreto quedaban ≈ 1.6–2× por debajo del GP (no conservador).
 *
 * Espectros: todas las líneas gamma con Iγ ≥ 0.1 % (`UMBRAL_LINEA_PCT`) de la evaluación ENSDF vigente (NNDC NuDat 3),
 * sin rayos X del hijo. Omitir los rayos X es conservador: se atenúan más que las gammas y la transmisión se normaliza
 * al kerma de las gammas, de modo que T_gammas ≥ T_total. Caso límite comprobado: Tl-201 (los rayos X K del Hg,
 * 69–82 keV, son ≈ 76 % del kerma): en concreto T_X/T_γ ≤ 1.005 hasta 1 cm y cae a 0.86 a 2 cm y 0.18 a 10 cm, así
 * que T_total ≤ T_γ salvo +0.4 % con menos de 1 cm de concreto; en Pb y Fe T_X < T_γ siempre.
 *
 * Regla regulatoria adoptada (por material, sobre la transmisión de kerma en aire T(t)):
 *
 *   T_regla(t) = max( T_a(t), T_b(t) )
 *   (a) haz estrecho a la «línea dura» (la más energética con Iγ ≥ 0.1 %), con peso 1 desde B = 1, para TODO nucleido
 *       del catálogo (terapia o diagnóstico) cuya línea dura aporte ≥ 2 % del kerma en aire sin blindaje
 *       (`PESO_MIN_LINEA_DURA`; revisión independiente del #58). `hazEstrecho` se deriva de ese criterio
 *       (`criterioHazEstrecho`), no se escribe a mano. Clasificación resultante:
 *         sí: I-131 722.9 keV (3.36 %, lo que pide la CNSNS), Lu-177 321.3 keV (2.58 %), Tc-99m 140.5 (100 %),
 *             Tl-201 167.4 (78.9 %), Sm-153 103.2 (85.9 %), In-111 245.4 keV (61.5 %);
 *         no: I-123 538.5 keV (1.33 %), Ga-67 887.7 keV (0.91 %), Zr-89 1744.5 keV (0.16 %).
 *       Cualquier umbral en (1.33 %, 2.58 %] da la misma clasificación; el margen es estrecho y una prueba falla si
 *       cambia. Con peso 1 desde B = 1, una línea de < 2 % del kerma multiplicaba el plomo sin base física (a B = 0.1:
 *       I-123 ×6.6, Ga-67 ×5.0, Zr-89 ×1.33); esa línea entra en (b) con su peso real y buildup.
 *       T_a = exp(−µ·t), µ = µ/ρ SIN dispersión coherente de la línea dura (`muRhoSinCoh`, el mismo de (b); coincide
 *       con XCOM a ≤ 0.02 %) × ρ. Es el µ de ORNL/RSIC-49 (Trubey 1988, Ap. II, borrador de ANSI/ANS-6.4.3), que no
 *       cuenta la dispersión coherente ni como atenuación ni como buildup: desvía el fotón pocos grados sin cambiarle la
 *       energía y, con fuente puntual y muro extenso, no lo saca del haz que llega al punto (por eso XCOM da la columna
 *       «Total attenuation without coherent scattering» para blindaje). Con el µ total (con coherente) (a) quedaba por
 *       debajo de la componente sin colisión de (b) y la cota inferior perdía un 5–8 % de µ que no retira fotones
 *       (2.ª revisión del #58, M1: In-111/Pb B = 0.1 3.26 → 3.50 mm; TVL I-131 20.44 → 21.68, Lu-177 5.78 → 6.25 mm).
 *       La malla `XCOM_MU_RHO_MALLA` (con coherente) queda para W↔Pb y los controles.
 *   (b) haz ancho del espectro completo con buildup GP de ANSI/ANS-6.4.3:
 *       T_GP = Σᵢ fᵢ·B_GP(Eᵢ, µᵢt)·exp(−µᵢt), fᵢ = Iᵢ·Eᵢ·(µ_en/ρ)_aire(Eᵢ) normalizada (peso por kerma en aire),
 *       µᵢ SIN dispersión coherente (ANS-6.4.3 §4.1, la que cuenta los mfp de los coeficientes).
 *       En concreto, cuando se dispone del ajuste de Oumano et al. 2025 (sólo I-131): T_b = max(T_Oumano, 1.2·GP).
 *
 * El espesor requerido es el que da T_regla(t) = P/(K·T); como cada término decrece con t, es el mayor de los
 * espesores de cada criterio, y la traza dice cuál rige.
 *
 * Buildup GP (fuente puntual isótropa, medio infinito, respuesta exposición/kerma en aire):
 *   B = 1 + (b−1)(K^x − 1)/(K − 1)  (K ≠ 1);  B = 1 + (b−1)x  (K = 1)
 *   K(x) = c·x^a + d·[tanh(x/X_k − 2) − tanh(−2)]/[1 − tanh(−2)]
 * Interpolación en energía: b, c, X_k log-log; a y d (cambian de signo) lineales en ln E (0.03–2 MeV; fuera de ese
 * intervalo se toma la fila extrema, y ninguna línea de los espectros cae fuera). Validez 0.5–40 mfp; más allá
 * de 40 mfp K se congela en K(40) (el buildup sigue creciendo como progresión geométrica de razón K(40), nunca se
 * recorta) y el término B·e^(−x) se evalúa en logaritmos para que no desborde. Con peso ≥ 1 % del kerma, una línea
 * por encima de 40 mfp se marca en la traza (`fueraRangoGP`); numéricamente su contribución es despreciable (p. ej.
 * Pb a 113 keV y 40 mfp: B·e^(−x) ≈ 2×10⁻¹⁰).
 * Fuente: Trubey DK, ORNL/RSIC-49 (1988), Ap. II (borrador ANSI/ANS-6.4.3, base de ANSI/ANS-6.4.3-1991), fórmula
 * sec. 2 y coeficientes de exposición de la Tabla 5.1 (Pb, Fe, concreto NBS ordinario). Transcripción verificada
 * Filas de 0.03–0.05 y de 1.5–2 MeV (seguimiento de #57: Tl-201 30.6/32.2 keV; Zr-89 1.66–1.74 MeV y Ga-67 0.89 MeV)
 * transcritas de la Tabla 5.1 de NUREG/CR-5740 (ORNL/RSIC-49/R1, Trubey 1991; los mismos datos de ANS-6.4.3-1991; Pb
 * p. impresa 92, Fe 85, concreto 96), contrastadas con la imagen de la página; las filas de 0.06–1 MeV coinciden
 * con las ya transcritas de ORNL/RSIC-49.
 * Transcripción verificada contra 37 valores B(E, mfp) de la Tabla 3 del mismo informe (desviación máxima 2.2 %) y, en Pb, contra las 48 filas de
 * 0.1, 0.15 y 0.2 MeV (PDF p. 63): ≤ 1.2 % a 0.15 y 0.2 MeV; a 0.1 MeV (justo encima del borde K, fluorescencia) el
 * ajuste GP publicado se aparta hasta −10.6/+10.1 % de su propia tabla (la transcripción es exacta: es la calidad del
 * ajuste). Ese punto sólo pesa en la línea de 113 keV de Lu-177: aporta el 11 % de T_GP con 0.5 mm de Pb, el 4 % con
 * 1 mm y < 0.2 % desde 2.5 mm, así que el efecto sobre T es ≤ 1.2 % y en plomo rige además el haz estrecho a 321 keV.
 *
 * Materiales del catálogo: plomo → Pb (ρ_ref 11.35), acero → Fe (7.874); los demás por equivalencia másica con el
 * concreto ordinario 2.35 (t = t_concreto·2.35/ρ). Para materiales de Z mayor que el concreto (barita, concreto con
 * hierro, bloques de alta densidad, vidrio plomado) la equivalencia sobrestima el espesor: conservador. No hay GP de
 * barita ni de concreto pesado en las fuentes disponibles (queda abierto: MC o Z_eq).
 *
 * Lectura de los resultados (casos de referencia, `src/__tests__/auditoria/terapiaEspectroGP.test.ts`): en plomo rige el
 * haz estrecho a 723 keV (1.26–4.2 veces el GP) y el GP coincide ±2 % con el Monte Carlo de losa; en concreto rige el
 * haz ancho (el GP de medio infinito queda 1.7–2.0 veces por encima del MC de losa: cota superior, conservadora).
 */
import type { RadiationSource, ShieldingMaterial } from '@/types/radshield';

export type MaterialGP = 'Pb' | 'Fe' | 'Concreto';
/** Nucleidos con espectro: terapia (I-131, Lu-177) y diagnóstico (el resto). */
export type NuclidoTerapia = 'I131' | 'Lu177' | 'I123' | 'Tc99m' | 'Tl201' | 'In111' | 'Ga67' | 'Sm153' | 'Zr89';

/** Umbral de rendimiento (fotones por 100 desintegraciones) de las líneas del espectro y de la línea del criterio (a). */
export const UMBRAL_LINEA_PCT = 0.1;
/** Límite superior de validez del ajuste GP (mfp). */
export const MFP_MAX_GP = 40;

/** Fila de coeficientes GP de exposición: [E (MeV), b, c, a, X_k, d]. */
export type FilaGP = readonly [number, number, number, number, number, number];

export const REFERENCIA_GP_ANS643 =
  'Trubey DK. New Gamma-Ray Buildup Factor Data for Point Kernel Calculations: ANS-6.4.3 Standard Reference Data. ORNL/RSIC-49, 1988, Ap. II y Tabla 5.1 (coeficientes GP de exposición); filas de 0.03–0.05 y 1.5–2 MeV de NUREG/CR-5740 (ORNL/RSIC-49/R1, 1991), Tabla 5.1';
export const REFERENCIA_OUMANO_2025 =
  'Oumano M et al. J Appl Clin Med Phys 2025;26(5):e70084 (ajuste de Archer de la transmisión de haz ancho del espectro completo de I-131)';

/**
 * ANSI/ANS-6.4.3 (ORNL/RSIC-49, Tabla 5.1): coeficientes GP de exposición, 0.06–1 MeV (Pb PDF p. 115 / impresa 92;
 * Fe p. 108; concreto NBS ordinario p. 119); 0.03–0.05 y 1.5–2 MeV de NUREG/CR-5740 (Tabla 5.1, impresas 92, 85 y 96).
 * En Pb la fila de 0.08 MeV está bajo el borde K (88.0 keV).
 */
export const GP_ANS643: Record<MaterialGP, readonly FilaGP[]> = {
  Pb: [
    [0.03, 1.003, 0.396, 0.248, 14.56, -0.1696],
    [0.04, 1.007, 0.438, 0.204, 14.26, -0.1093],
    [0.05, 1.012, 0.405, 0.244, 14.18, -0.1624],
    [0.06, 1.017, 0.487, 0.18, 13.37, -0.1037],
    [0.08, 1.033, 0.523, 0.153, 13.3, -0.0777],
    [0.1, 2.037, 1.432, 0.079, 18.37, -0.0935],
    [0.15, 1.408, 0.362, 0.281, 21.46, -0.0964],
    [0.2, 1.184, 0.19, 0.381, 13.27, -0.1868],
    [0.3, 1.122, 0.533, 0.137, 13.69, -0.0612],
    [0.4, 1.135, 0.67, 0.085, 19.56, -0.0325],
    [0.5, 1.179, 0.725, 0.072, 14.89, -0.0244],
    [0.6, 1.228, 0.744, 0.064, 14.47, -0.0184],
    [0.8, 1.283, 0.8, 0.05, 15.2, -0.0191],
    [1, 1.318, 0.86, 0.035, 16.49, -0.0154],
    [1.5, 1.375, 0.891, 0.029, 13.29, -0.0168],
    [2, 1.388, 0.939, 0.024, 13.33, -0.0266],
  ],
  Fe: [
    [0.03, 1.028, 0.374, 0.19, 29.34, -0.317],
    [0.04, 1.058, 0.336, 0.248, 11.65, -0.1188],
    [0.05, 1.099, 0.366, 0.232, 14.01, -0.1354],
    [0.06, 1.148, 0.405, 0.208, 14.17, -0.1142],
    [0.08, 1.267, 0.47, 0.18, 14.48, -0.0974],
    [0.1, 1.389, 0.557, 0.144, 14.11, -0.0791],
    [0.15, 1.66, 0.743, 0.079, 14.12, -0.0476],
    [0.2, 1.839, 0.911, 0.034, 13.23, -0.0334],
    [0.3, 1.973, 1.095, -0.009, 11.86, -0.0183],
    [0.4, 1.992, 1.187, -0.027, 10.72, -0.014],
    [0.5, 1.967, 1.24, -0.039, 8.34, -0.0074],
    [0.6, 1.947, 1.247, -0.04, 8.2, -0.0096],
    [0.8, 1.906, 1.233, -0.038, 7.93, -0.011],
    [1, 1.841, 1.25, -0.048, 19.49, 0.014],
    [1.5, 1.75, 1.197, -0.04, 15.9, 0.011],
    [2, 1.712, 1.123, -0.021, 7.97, -0.0057],
  ],
  Concreto: [
    [0.03, 1.212, 0.421, 0.201, 14.12, -0.1079],
    [0.04, 1.455, 0.493, 0.171, 14.53, -0.0925],
    [0.05, 1.737, 0.628, 0.115, 15.82, -0.06],
    [0.06, 2.125, 0.664, 0.118, 11.9, -0.0615],
    [0.08, 2.557, 0.895, 0.042, 14.37, -0.0413],
    [0.1, 2.766, 1.069, 0.001, 12.64, -0.0251],
    [0.15, 2.824, 1.315, -0.049, 8.66, -0.0048],
    [0.2, 2.716, 1.43, -0.07, 18.52, 0.0108],
    [0.3, 2.522, 1.492, -0.082, 16.59, 0.0161],
    [0.4, 2.372, 1.494, -0.085, 15.96, 0.0194],
    [0.5, 2.271, 1.466, -0.082, 16.25, 0.0195],
    [0.6, 2.192, 1.434, -0.078, 17.02, 0.0199],
    [0.8, 2.066, 1.386, -0.073, 15.07, 0.0202],
    [1, 1.982, 1.332, -0.065, 15.38, 0.0193],
    [1.5, 1.848, 1.227, -0.047, 16.41, 0.016],
    [2, 1.775, 1.154, -0.033, 14.35, 0.01],
  ],
};

/** Densidad de referencia de cada material GP (g/cm³): Pb y Fe NIST; concreto ordinario NIST/NBS 2.35. */
export const RHO_REF: Record<MaterialGP, number> = { Pb: 11.35, Fe: 7.874, Concreto: 2.35 };

/**
 * µ/ρ total CON dispersión coherente (cm²/g) de NIST XCOM 3.1 (Berger et al., NIST SRD 8; mismos datos que NIST SRD 126 /
 * XAAMDI de Hubbell y Seltzer, a los que reproduce a ±0.05 % en sus energías): W↔Pb y controles (desde la 2.ª revisión del #58, M1, el haz
 * estrecho (a) usa el µ SIN coherente de la línea dura, `muRhoSinCoh`).
 * Filas [E (MeV), Pb z82, W z74, Fe z26, concreto ordinario NIST]. Malla fina generada por
 * `scripts/fase11_xcom_malla.py` (→ `scripts/fase11_xcom_mu_rho.json`, que una prueba compara con esta tabla): malla de
 * SRD 126, 20 puntos por década, las líneas duras de los espectros y las energías pedidas en la revisión del #58 (171.28,
 * 245.35, 321.3159, 364.489, 528.97, 636.989, 722.911 keV…) y los bordes K y L1–L3 de Pb y W duplicados (debajo/encima),
 * como en NIST. Interpolación log-log lineal: ≤ 0.33 % de XCOM entre nodos (Pb ≤ 0.19 %), exacta en las líneas duras.
 */
export const XCOM_MU_RHO_MALLA: readonly (readonly [number, number, number, number, number])[] = [
  [0.01, 130.64, 96.9, 170.69, 20.448], [0.0102068, 124.08, 91.998, 161.61, 19.277], [0.0102068, 124.08, 233.37, 161.61, 19.277],
  [0.011220185, 97.74, 181.96, 125.43, 14.67], [0.011544, 90.975, 168.87, 116.21, 13.513], [0.011544, 90.975, 231.2, 116.21, 13.513],
  [0.0120998, 80.809, 206.52, 102.39, 11.798], [0.0120998, 80.809, 238.16, 102.39, 11.798], [0.012589254, 73.131, 215.76, 91.99, 10.521],
  [0.0130352, 67.003, 197.81, 83.716, 9.5158], [0.0130352, 162.1, 197.81, 83.716, 9.5158], [0.014125375, 130.76, 161.73, 67.287, 7.5489],
  [0.015, 111.57, 138.88, 57.085, 6.3508], [0.0152, 107.77, 134.27, 55.046, 6.1137], [0.0152, 148.52, 134.27, 55.046, 6.1137],
  [0.015848932, 134.6, 120.6, 49.061, 5.423], [0.0158608, 134.36, 120.37, 48.96, 5.4113], [0.0158608, 154.82, 120.37, 48.96, 5.4113],
  [0.017782794, 116.21, 89.418, 35.66, 3.9055], [0.019952623, 86.896, 66.13, 25.854, 2.8245], [0.02, 86.374, 65.72, 25.683, 2.8059],
  [0.022387211, 64.738, 48.915, 18.709, 2.0555], [0.025118864, 48.088, 36.192, 13.518, 1.5091], [0.028183829, 35.662, 26.773, 9.7589, 1.1211],
  [0.03, 30.317, 22.729, 8.1764, 0.96005], [0.031622777, 26.438, 19.792, 7.0429, 0.84559], [0.035481339, 19.605, 14.622, 5.0855, 0.64984],
  [0.039810717, 14.538, 10.803, 3.6778, 0.51056], [0.04, 14.36, 10.669, 3.6292, 0.50578], [0.044668359, 10.778, 7.9872, 2.6677, 0.41118],
  [0.05, 8.0416, 5.9501, 1.9573, 0.34119], [0.050118723, 7.9922, 5.9135, 1.9447, 0.33994], [0.056234133, 5.9322, 4.3871, 1.428, 0.28852],
  [0.06, 5.0197, 3.7126, 1.2049, 0.26601], [0.063095734, 4.4119, 3.2639, 1.0585, 0.25104], [0.069525, 3.445, 2.5516, 0.83009, 0.22718],
  [0.069525, 3.445, 11.234, 0.83009, 0.22718], [0.070794578, 3.2906, 10.716, 0.79417, 0.22335], [0.079432823, 2.4628, 7.9527, 0.60496, 0.20251],
  [0.08, 2.4194, 7.8089, 0.5952, 0.2014], [0.0880045, 1.9098, 6.1275, 0.48213, 0.18806], [0.0880045, 7.6838, 6.1275, 0.48213, 0.18806],
  [0.089125094, 7.4392, 5.9346, 0.46932, 0.18648], [0.1, 5.5491, 4.4369, 0.37174, 0.1738], [0.10318, 5.1264, 4.098, 0.35026, 0.1708],
  [0.112201845, 4.1509, 3.3095, 0.30119, 0.16346], [0.125892541, 3.1124, 2.4656, 0.24983, 0.15475], [0.140511, 2.3686, 1.8643, 0.21359, 0.1475],
  [0.141253754, 2.3378, 1.8396, 0.2121, 0.14718], [0.15, 2.0145, 1.5812, 0.19644, 0.14355], [0.158489319, 1.7583, 1.3782, 0.18401, 0.14039],
  [0.159, 1.7444, 1.3672, 0.18334, 0.14021], [0.16743, 1.5361, 1.2034, 0.17317, 0.13736], [0.17128, 1.4528, 1.1382, 0.16907, 0.13614],
  [0.177827941, 1.3256, 1.0388, 0.16276, 0.13416], [0.199526231, 1.0043, 0.78886, 0.14635, 0.12834], [0.2, 0.99862, 0.78447, 0.14605, 0.12823],
  [0.223872114, 0.76651, 0.60443, 0.13336, 0.12283], [0.24535, 0.62222, 0.49276, 0.12482, 0.11861], [0.251188643, 0.59039, 0.46815, 0.12283, 0.11755],
  [0.281838293, 0.45959, 0.36723, 0.11407, 0.11245], [0.3, 0.40321, 0.32382, 0.10987, 0.10975], [0.316227766, 0.36211, 0.29221, 0.10659, 0.1075],
  [0.3213159, 0.3507, 0.28344, 0.10563, 0.10683], [0.354813389, 0.28914, 0.23615, 0.10006, 0.1027], [0.364489, 0.27489, 0.22521, 0.09864, 0.10159],
  [0.398107171, 0.23423, 0.19397, 0.09423, 0.098023], [0.4, 0.23228, 0.19247, 0.094002, 0.097833], [0.446683592, 0.19261, 0.16195, 0.088934, 0.093483],
  [0.5, 0.16135, 0.13781, 0.084146, 0.08915], [0.501187234, 0.16077, 0.13736, 0.084049, 0.089059], [0.52897, 0.14846, 0.12781, 0.081876, 0.087023],
  [0.53854, 0.14469, 0.12487, 0.081168, 0.086351], [0.562341325, 0.13615, 0.11822, 0.079487, 0.084742], [0.6, 0.12475, 0.1093, 0.077037, 0.082362],
  [0.630957344, 0.11691, 0.10312, 0.075187, 0.080542], [0.636989, 0.11551, 0.10202, 0.074842, 0.080201], [0.707945784, 0.10166, 0.091033, 0.071109, 0.076467],
  [0.722911, 0.099237, 0.089097, 0.070389, 0.075739], [0.794328235, 0.089379, 0.08121, 0.067228, 0.072511], [0.8, 0.088699, 0.080664, 0.066994, 0.072271],
  [0.887688, 0.07963, 0.073361, 0.063646, 0.068803], [0.891250938, 0.079312, 0.073102, 0.06352, 0.068672], [1.0, 0.071019, 0.066177, 0.059947, 0.064946],
  [1.122018454, 0.064096, 0.060259, 0.056523, 0.061337], [1.25, 0.058752, 0.055763, 0.053501, 0.058072], [1.258925412, 0.058441, 0.055498, 0.053309, 0.057861],
  [1.412537545, 0.054081, 0.051677, 0.050307, 0.054539], [1.5, 0.052223, 0.049998, 0.048831, 0.052878], [1.584893192, 0.050715, 0.048626, 0.047535, 0.051404],
  [1.7445, 0.048474, 0.046578, 0.045406, 0.048929], [1.77827941, 0.048082, 0.046217, 0.045, 0.048447], [1.995262315, 0.046099, 0.044361, 0.042693, 0.045623],
  [2.0, 0.046065, 0.044329, 0.042648, 0.045566],
];

const columnaMalla = (k: 1 | 2 | 3 | 4): readonly (readonly [number, number])[] => XCOM_MU_RHO_MALLA.map((r) => [r[0], r[k]] as const);

/** µ/ρ total con coherente (cm²/g) por material GP: columnas de `XCOM_MU_RHO_MALLA`. */
export const NIST_MU_RHO: Record<MaterialGP, readonly (readonly [number, number])[]> = {
  Pb: columnaMalla(1),
  Fe: columnaMalla(3),
  Concreto: columnaMalla(4),
};
/** µ/ρ total con coherente del W (cm²/g), misma malla: referencia para los bordes del W (sin GP de W). */
export const NIST_MU_RHO_W: readonly (readonly [number, number])[] = columnaMalla(2);

/** µ_en/ρ del aire (cm²/g), NIST SRD 126 («Air, Dry»), 0.03–2 MeV: peso de cada línea en el kerma en aire. */
export const NIST_MUEN_AIRE: readonly (readonly [number, number])[] = [
  [0.03, 0.1537], [0.04, 0.06833], [0.05, 0.04098], [0.06, 0.03041], [0.08, 0.02407], [0.1, 0.02325], [0.15, 0.02496], [0.2, 0.02672], [0.3, 0.02872], [0.4, 0.02949],
  [0.5, 0.02966], [0.6, 0.02953], [0.8, 0.02882], [1, 0.02789], [1.25, 0.02666], [1.5, 0.02547], [2, 0.02345],
];

export interface LineaGamma {
  E_keV: number;
  /** Fotones por 100 desintegraciones. */
  I_pct: number;
  /**
   * µ/ρ sin dispersión coherente (fotoeléctrico + incoherente), cm²/g: Elam, Ravel y Sieber 2002 (= NIST ±1 %) hasta
   * 0.8 MeV; por encima (Elam no es fiable), NIST SRD 126 total − coherente de Elam a 0.8 MeV·(0.8/E)².
   */
  muRhoSinCoh: Record<MaterialGP, number>;
}

export interface EspectroTerapia {
  nuclido: NuclidoTerapia;
  etiqueta: string;
  fuente: string;
  lineas: LineaGamma[];
  /** Terapia (I-131, Lu-177) o diagnóstico: sólo informativo (texto «CNSNS» de la traza); no decide el criterio (a). */
  terapia: boolean;
  /**
   * Aplica el criterio (a): DERIVADO de `criterioHazEstrecho` (línea dura con peso ≥ `PESO_MIN_LINEA_DURA` del kerma),
   * igual para terapia y diagnóstico. No se escribe a mano en `ESPECTROS_TERAPIA`.
   */
  readonly hazEstrecho: boolean;
  /** Ajuste de Archer (x en mm) de haz ancho del espectro completo, si está publicado. */
  oumano?: Partial<Record<MaterialGP, { alpha: number; beta: number; gamma: number }>>;
}

const L = (E_keV: number, I_pct: number, Pb: number, Fe: number, Concreto: number): LineaGamma => ({ E_keV, I_pct, muRhoSinCoh: { Pb, Fe, Concreto } });

/**
 * Peso mínimo en kerma sin blindaje de la línea dura (la más energética con Iγ ≥ `UMBRAL_LINEA_PCT`) para aplicar el
 * criterio (a), a todo el catálogo. Pesos: I-131 3.36 %, Lu-177 2.58 % (sí); I-123 1.33 %, Ga-67 0.91 %, Zr-89 0.16 %
 * (no). Cualquier valor en (1.33 %, 2.58 %] da la misma clasificación.
 */
export const PESO_MIN_LINEA_DURA = 0.02;

/**
 * Espectros (ENSDF): líneas gamma con Iγ ≥ 0.1 %, sin rayos X del hijo (`hazEstrecho` se deriva en `ESPECTROS_TERAPIA`).
 * µ/ρ sin coherente de cada línea: Elam, Ravel y
 * Sieber 2002 (xraydb 4.6.1), fracciones en masa de NIST para el concreto ordinario. Los espectros diagnósticos y sus µ
 * salen de `scripts/fase11_diagnostico_gp.py` (intensidades de NNDC NuDat 3 / ENSDF, citadas en cada uno).
 */
const ESPECTROS_DATOS: Record<NuclidoTerapia, Omit<EspectroTerapia, 'hazEstrecho'>> = {
  I131: {
    nuclido: 'I131',
    etiqueta: 'I-131',
    fuente: 'ENSDF: Khazov Yu, Mitropolsky I, Rodionov A. Nucl Data Sheets 2006;107:2715',
    lineas: [
      L(80.185, 2.62, 2.09897, 0.53629, 0.18565),
      L(177.214, 0.269, 1.25899, 0.15032, 0.13093),
      L(284.305, 6.12, 0.41816, 0.10821, 0.11072),
      L(325.789, 0.273, 0.31552, 0.10079, 0.10521),
      L(364.489, 81.5, 0.25409, 0.09541, 0.10076),
      L(503.004, 0.359, 0.1486, 0.08219, 0.08849),
      L(636.989, 7.16, 0.10831, 0.07376, 0.07992),
      L(642.719, 0.217, 0.10714, 0.07345, 0.0796),
      L(722.911, 1.77, 0.09356, 0.06953, 0.0755),
    ],
    terapia: true,
    // Oumano et al. 2025 (GATE 9.2 + MCNP6, espectro ICRP-107): Pb y concreto de peso normal; aplicado al concreto
    // 2.35 sin reescalar (conservador si el concreto del artículo es ≤ 2.35 g/cm³). Los parámetros de Pb se guardan
    // como referencia y para las pruebas, pero la regla no los usa: en todos los espesores quedan por debajo del haz
    // estrecho a 723 keV, que es el que rige en plomo.
    oumano: {
      Pb: { alpha: 0.1082, beta: 0.2072, gamma: 0.5385 },
      Concreto: { alpha: 0.02062, beta: -0.0122, gamma: 0.4179 },
    },
  },
  Lu177: {
    nuclido: 'Lu177',
    etiqueta: 'Lu-177',
    fuente: 'ENSDF: Kondev FG. Nucl Data Sheets 2019;159:1 (A = 177), desintegración β⁻ de 177Lu (6.6443 d), NR = 0.1041',
    lineas: [
      L(71.6418, 0.164, 2.82316, 0.70372, 0.20199),
      L(112.9498, 6.23, 3.90923, 0.26757, 0.15481),
      L(208.3662, 10.41, 0.84816, 0.13156, 0.12375),
      L(249.6742, 0.1997, 0.55652, 0.11658, 0.11607),
      L(321.3159, 0.2186, 0.32437, 0.10149, 0.10577),
    ],
    terapia: true,
  },
  I123: {
    nuclido: 'I123',
    etiqueta: 'I-123',
    fuente: 'ENSDF: Chen J. Nucl Data Sheets 2021;174:1 (A = 123), desintegración ε de 123I (13.2230 h), NR = 0.8360',
    lineas: [
      L(159.0, 83.6, 1.64986, 0.16738, 0.136),
      L(346.36, 0.12, 0.27985, 0.09779, 0.10278),
      L(440.02, 0.388, 0.18284, 0.08737, 0.0935),
      L(505.33, 0.288, 0.1476, 0.08201, 0.08832),
      L(528.97, 1.27, 0.13821, 0.08033, 0.08663),
      L(538.54, 0.31, 0.13478, 0.07967, 0.08597),
    ],
    terapia: false,
  },
  Tc99m: {
    nuclido: 'Tc99m',
    etiqueta: 'Tc-99m',
    fuente: 'ENSDF: Browne E, Tuli JK. Nucl Data Sheets 2017;145:25 (A = 99), TI de 99mTc (6.0072 h); 142.63 keV (0.0222 %) < 0.1 %',
    lineas: [L(140.511, 89.0, 2.25074, 0.19345, 0.14216)],
    terapia: false,
  },
  Tl201: {
    nuclido: 'Tl201',
    etiqueta: 'Tl-201',
    fuente: 'ENSDF: Kondev FG. Nucl Data Sheets 2023;187:355 (A = 201), desintegración ε de 201Tl; sin los rayos X K del Hg',
    lineas: [
      L(30.6, 0.258, 27.45253, 7.45502, 0.83293),
      L(32.19, 0.263, 23.97889, 6.44273, 0.73526),
      L(135.34, 2.605, 2.47365, 0.20321, 0.14414),
      L(165.88, 0.147, 1.48397, 0.16018, 0.13399),
      L(167.43, 10.0, 1.44992, 0.15869, 0.13355),
    ],
    terapia: false,
  },
  In111: {
    nuclido: 'In111',
    etiqueta: 'In-111',
    fuente: 'ENSDF: Blachot J. Nucl Data Sheets 2009;110:1239 (A = 111), desintegración ε de 111In (2.8047 d); 150.81 keV (0.003 %) < 0.1 %',
    lineas: [
      L(171.28, 90.7, 1.37007, 0.15521, 0.13249),
      L(245.35, 94.1, 0.579, 0.11784, 0.1168),
    ],
    terapia: false,
  },
  Ga67: {
    nuclido: 'Ga67',
    etiqueta: 'Ga-67',
    fuente: 'ENSDF: Huo J, Huang X, Tuli JK. Nucl Data Sheets 2005;106:159 (A = 67), desintegración ε de 67Ga; 494.2, 703.1 y 794.4 keV < 0.1 %',
    lineas: [
      L(91.265, 3.11, 6.75336, 0.40211, 0.17152),
      L(93.31, 38.81, 6.37762, 0.38388, 0.16947),
      L(184.576, 21.41, 1.13862, 0.14497, 0.12909),
      L(208.95, 2.46, 0.8425, 0.13129, 0.12363),
      L(300.217, 16.64, 0.37274, 0.1051, 0.1085),
      L(393.527, 4.56, 0.22106, 0.09201, 0.09777),
      L(887.688, 0.148, 0.07622, 0.06306, 0.06862),
    ],
    terapia: false,
  },
  Sm153: {
    nuclido: 'Sm153',
    etiqueta: 'Sm-153',
    fuente: 'ENSDF: Nica N. Nucl Data Sheets 2020;170:1 (A = 153), desintegración β⁻ de 153Sm (46.284 h); 172.9 y 531.4 keV < 0.1 %',
    lineas: [
      L(69.673, 4.67, 3.03952, 0.7546, 0.2068),
      L(75.42213, 0.19, 2.46483, 0.62027, 0.19396),
      L(83.36717, 0.191, 1.89555, 0.49037, 0.18096),
      L(89.48595, 0.157, 7.10605, 0.41933, 0.17342),
      L(97.431, 0.763, 5.70525, 0.3516, 0.16572),
      L(103.18012, 29.14, 4.92435, 0.31465, 0.16117),
    ],
    terapia: false,
  },
  Zr89: {
    nuclido: 'Zr89',
    etiqueta: 'Zr-89',
    fuente: 'ENSDF: Singh B. Nucl Data Sheets 2013;114:1 (A = 89), desintegración de 89Zr (78.41 h), con la aniquilación de 511 keV (45.5 %); 1620.8 keV (0.073 %) < 0.1 %',
    lineas: [
      L(511.0, 45.5, 0.14522, 0.0816, 0.0879),
      L(909.15, 99.04, 0.07451, 0.06233, 0.06785),
      L(1657.3, 0.106, 0.04892, 0.04643, 0.05018),
      L(1713.0, 0.745, 0.04827, 0.04572, 0.04933),
      L(1744.5, 0.123, 0.04792, 0.04534, 0.04887),
    ],
    terapia: false,
  },
};

/** Fracción del kerma en aire sin blindaje de cada línea (Iᵢ·Eᵢ·(µ_en/ρ)_aire normalizado). */
function fraccionesKermaLineas(ls: readonly LineaGamma[]): number[] {
  const k = ls.map((l) => (l.I_pct / 100) * l.E_keV * interpLogLog(NIST_MUEN_AIRE, l.E_keV / 1000));
  const s = k.reduce((a, b) => a + b, 0);
  return k.map((v) => v / s);
}

export interface LineaDura {
  /** Energía (keV) de la línea más energética con Iγ ≥ `UMBRAL_LINEA_PCT`. */
  E_keV: number;
  /** Fracción del kerma en aire sin blindaje que aporta. */
  peso: number;
  /** peso ≥ `PESO_MIN_LINEA_DURA`: se aplica el criterio (a). */
  aplica: boolean;
}

function lineaDuraDe(ls: readonly LineaGamma[]): LineaDura {
  const f = fraccionesKermaLineas(ls);
  let i = -1;
  ls.forEach((l, k) => { if (l.I_pct >= UMBRAL_LINEA_PCT && (i < 0 || l.E_keV > ls[i].E_keV)) i = k; });
  return { E_keV: ls[i].E_keV, peso: f[i], aplica: f[i] >= PESO_MIN_LINEA_DURA };
}

/** Criterio único del haz estrecho (a): la línea dura y si su peso en kerma alcanza `PESO_MIN_LINEA_DURA`. */
export function criterioHazEstrecho(nuc: NuclidoTerapia): LineaDura {
  return lineaDuraDe(ESPECTROS_DATOS[nuc].lineas);
}

/** Espectros con `hazEstrecho` derivado del criterio único (no escrito a mano). */
export const ESPECTROS_TERAPIA: Record<NuclidoTerapia, EspectroTerapia> = Object.fromEntries(
  (Object.keys(ESPECTROS_DATOS) as NuclidoTerapia[]).map((n) => [n, { ...ESPECTROS_DATOS[n], hazEstrecho: lineaDuraDe(ESPECTROS_DATOS[n].lineas).aplica }]),
) as Record<NuclidoTerapia, EspectroTerapia>;

/** Línea del criterio (a): la línea dura si aplica el criterio único; null si no (I-123, Ga-67, Zr-89). */
export function lineaEstrecha(nuc: NuclidoTerapia): number | null {
  const e = ESPECTROS_TERAPIA[nuc];
  if (!e.hazEstrecho) return null;
  return criterioHazEstrecho(nuc).E_keV;
}

/**
 * Factor sobre T_GP en concreto cuando hay ajuste de Oumano (regla adoptada: max(Oumano, 1.2·GP)). Se aplica a la
 * TRANSMISIÓN, no al espesor: a B = 1e-2 da 361.5 mm frente a 350.9 mm del GP solo (≈ +11 mm a cualquier espesor);
 * sobre el espesor serían 421 mm (+20 %, creciente con t). El GP de medio infinito ya queda 1.7–2.0× por encima del MC
 * de losa y 1.5–1.7× por encima de Oumano, así que el margen sobre T basta. En el rango útil 1.2·GP/Oumano ≥ 1.78:
 * Oumano no rige y el max es inocuo (se conserva como salvaguarda).
 */
export const FACTOR_GP_CONCRETO = 1.2;

function interpLogLog(tab: readonly (readonly [number, number])[], E_MeV: number): number {
  if (E_MeV <= tab[0][0]) return tab[0][1];
  for (let i = 0; i < tab.length - 1; i++) {
    const [e0, v0] = tab[i];
    const [e1, v1] = tab[i + 1];
    if (E_MeV <= e1) {
      const w = Math.log(E_MeV / e0) / Math.log(e1 / e0);
      return Math.exp(Math.log(v0) + w * Math.log(v1 / v0));
    }
  }
  return tab[tab.length - 1][1];
}

export interface CoefGP { b: number; c: number; a: number; Xk: number; d: number }

/** Coeficientes GP interpolados a E (MeV): b, c, X_k log-log; a, d lineales en ln E. */
export function coeficientesGP(mat: MaterialGP, E_MeV: number): CoefGP {
  const filas = GP_ANS643[mat];
  const f = (r: FilaGP): CoefGP => ({ b: r[1], c: r[2], a: r[3], Xk: r[4], d: r[5] });
  if (E_MeV <= filas[0][0]) return f(filas[0]);
  if (E_MeV >= filas[filas.length - 1][0]) return f(filas[filas.length - 1]);
  let i = 0;
  while (i < filas.length - 2 && filas[i + 1][0] < E_MeV) i++;
  const r0 = filas[i], r1 = filas[i + 1];
  const w = Math.log(E_MeV / r0[0]) / Math.log(r1[0] / r0[0]);
  const lg = (k: number) => Math.exp(Math.log(r0[k]) + w * Math.log(r1[k] / r0[k]));
  const li = (k: number) => r0[k] + w * (r1[k] - r0[k]);
  return { b: lg(1), c: lg(2), a: li(3), Xk: lg(4), d: li(5) };
}

const TANH_M2 = Math.tanh(-2);

/** K(x) de la fórmula GP, congelado en K(40) por encima de `MFP_MAX_GP`. */
function kGP(p: CoefGP, x: number): number {
  const xk = Math.min(x, MFP_MAX_GP);
  return p.c * Math.pow(xk, p.a) + (p.d * (Math.tanh(xk / p.Xk - 2) - TANH_M2)) / (1 - TANH_M2);
}

/** Buildup GP de exposición a x mfp (ANS-6.4.3, Ap. II sec. 2); por encima de 40 mfp, K = K(40). */
export function buildupGP(p: CoefGP, x: number): number {
  if (!(x > 0)) return 1;
  const K = kGP(p, x);
  if (Math.abs(K - 1) < 1e-9) return 1 + (p.b - 1) * x;
  return 1 + ((p.b - 1) * (Math.pow(K, x) - 1)) / (K - 1);
}

/** B_GP(x)·e^(−x) sin desbordamiento: si K^x no es finito se evalúa en logaritmos. */
export function buildupPorAtenuacion(p: CoefGP, x: number): number {
  if (!(x > 0)) return 1;
  const v = buildupGP(p, x) * Math.exp(-x);
  if (Number.isFinite(v)) return v;
  const K = kGP(p, x);
  // K^x ≫ 1 ⇒ B ≈ (b−1)·K^x/(K−1).
  return Math.exp(Math.log(p.b - 1) + x * Math.log(K) - Math.log(K - 1) - x);
}

/** Fracción del kerma en aire sin blindaje de cada línea (Iᵢ·Eᵢ·(µ_en/ρ)_aire normalizado). */
export function fraccionesKerma(nuc: NuclidoTerapia): number[] {
  return fraccionesKermaLineas(ESPECTROS_TERAPIA[nuc].lineas);
}

/** Datos precalculados por nucleido y material (pesos, µ y coeficientes GP por línea; µ del haz estrecho). */
interface ModeloGP { f: number[]; mu: number[]; coef: CoefGP[]; muEstrecho: number | null }
const MODELOS = new Map<string, ModeloGP>();
function modelo(nuc: NuclidoTerapia, mat: MaterialGP): ModeloGP {
  const k = `${nuc}|${mat}`;
  let m = MODELOS.get(k);
  if (!m) {
    const ls = ESPECTROS_TERAPIA[nuc].lineas;
    const Ek = lineaEstrecha(nuc);
    m = {
      f: fraccionesKerma(nuc),
      mu: ls.map((l) => l.muRhoSinCoh[mat] * RHO_REF[mat]),
      coef: ls.map((l) => coeficientesGP(mat, l.E_keV / 1000)),
      muEstrecho: Ek === null ? null : ls.find((l) => l.E_keV === Ek)!.muRhoSinCoh[mat] * RHO_REF[mat],
    };
    MODELOS.set(k, m);
  }
  return m;
}

/** (a) Transmisión de haz estrecho a la línea dura (µ sin coherente, como ORNL/RSIC-49 y (b)); t en cm del material de referencia. 0 si no aplica (I-123, Ga-67, Zr-89). */
export function transmisionEstrecha(nuc: NuclidoTerapia, mat: MaterialGP, t_cm: number): number {
  const mu = modelo(nuc, mat).muEstrecho;
  if (mu === null) return 0;
  return Math.exp(-mu * Math.max(0, t_cm));
}

/** (b) Transmisión de haz ancho del espectro completo con buildup GP; t en cm del material de referencia. */
export function transmisionEspectroGP(nuc: NuclidoTerapia, mat: MaterialGP, t_cm: number): number {
  const m = modelo(nuc, mat);
  const t = Math.max(0, t_cm);
  let s = 0;
  for (let i = 0; i < m.f.length; i++) s += m.f[i] * buildupPorAtenuacion(m.coef[i], m.mu[i] * t);
  return s;
}

/** Ajuste de Oumano 2025 (Archer, x en mm); null si no está publicado para ese nucleido y material. */
export function transmisionOumano(nuc: NuclidoTerapia, mat: MaterialGP, t_cm: number): number | null {
  const p = ESPECTROS_TERAPIA[nuc].oumano?.[mat];
  if (!p) return null;
  const x = Math.max(0, t_cm) * 10;
  return Math.pow((1 + p.beta / p.alpha) * Math.exp(p.alpha * p.gamma * x) - p.beta / p.alpha, -1 / p.gamma);
}

export type CriterioTerapia = 'haz estrecho' | 'GP espectro' | 'GP espectro ×1.2' | 'Oumano 2025';

/** Término (b) de la regla: GP; en concreto con ajuste de Oumano, max(Oumano, 1.2·GP). */
export function transmisionHazAncho(nuc: NuclidoTerapia, mat: MaterialGP, t_cm: number): { T: number; criterio: CriterioTerapia } {
  const gp = transmisionEspectroGP(nuc, mat, t_cm);
  const ou = mat === 'Concreto' ? transmisionOumano(nuc, mat, t_cm) : null;
  if (ou === null) return { T: gp, criterio: 'GP espectro' };
  return FACTOR_GP_CONCRETO * gp >= ou ? { T: FACTOR_GP_CONCRETO * gp, criterio: 'GP espectro ×1.2' } : { T: ou, criterio: 'Oumano 2025' };
}

/** Regla adoptada: max(haz estrecho, haz ancho). */
export function transmisionRegla(nuc: NuclidoTerapia, mat: MaterialGP, t_cm: number): number {
  return Math.max(transmisionEstrecha(nuc, mat, t_cm), transmisionHazAncho(nuc, mat, t_cm).T);
}

/** Paso (cm) de la caché de la regla para el mapa de dosis: 0.1 µm (error relativo ≤ 1.3e-4 en Pb a 140 keV). */
const PASO_CACHE_CM = 1e-5;
const CACHE_REGLA = new Map<string, number>();
const MAX_CACHE_REGLA = 200_000;

/**
 * `transmisionRegla` con caché por nucleido, material y espesor (redondeado a 0.1 µm) para el mapa de dosis y los visores
 * (`doseFieldEngine.transmisionCapa`): la misma transmisión del motor de barreras, sin recalcular el GP en cada celda.
 */
export function transmisionReglaCache(nuc: NuclidoTerapia, mat: MaterialGP, t_cm: number): number {
  const q = Math.round(Math.max(0, t_cm) / PASO_CACHE_CM);
  const k = `${nuc}|${mat}|${q}`;
  const v = CACHE_REGLA.get(k);
  if (v !== undefined) return v;
  const T = transmisionRegla(nuc, mat, q * PASO_CACHE_CM);
  if (CACHE_REGLA.size >= MAX_CACHE_REGLA) CACHE_REGLA.clear();
  CACHE_REGLA.set(k, T);
  return T;
}

/** Inversión por bisección de una transmisión monótona decreciente (t en cm). */
function invertir(T: (t_cm: number) => number, B: number): number {
  if (B >= 1) return 0;
  if (!(B > 0)) return Infinity;
  let lo = 0, hi = 1;
  while (T(hi) > B) {
    hi *= 2;
    if (hi > 1e5) return Infinity;
  }
  for (let i = 0; i < 200 && hi - lo > 1e-10; i++) {
    const m = (lo + hi) / 2;
    if (T(m) > B) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

/** Material del catálogo → material GP y factor de espesor (equivalencia másica: ρ_ref/ρ). */
export function materialGPCatalogo(m: Pick<ShieldingMaterial, 'code' | 'density'>): { mat: MaterialGP; escala: number } {
  const rho = m.density > 0 ? m.density : undefined;
  if (m.code === 'PB') return { mat: 'Pb', escala: RHO_REF.Pb / (rho ?? RHO_REF.Pb) };
  if (m.code === 'STEEL') return { mat: 'Fe', escala: RHO_REF.Fe / (rho ?? RHO_REF.Fe) };
  return { mat: 'Concreto', escala: RHO_REF.Concreto / (rho ?? RHO_REF.Concreto) };
}

export interface EspesorTerapia {
  espesor_mm: number;
  rige: CriterioTerapia | null;
  /** Espesor de cada criterio en el material del catálogo (mm). */
  porCriterio: { estrecho_mm: number; hazAncho_mm: number };
  /** mfp de la línea de mayor peso en kerma al espesor resultante (validez GP 0.5–40 mfp). */
  mfpLineaPrincipal: number;
  /** Mayor número de mfp entre las líneas con peso ≥ 1 % del kerma, al espesor del haz ancho. */
  mfpMaxLineas: number;
  /** Alguna línea con peso ≥ 1 % del kerma pasa de 40 mfp al espesor del haz ancho (fuera del rango del GP). */
  fueraRangoGP: boolean;
}

/** Espesor (mm) en B = P_efectiva/K por la regla adoptada; mismas unidades en K y P. */
export function espesorTerapiaGP(nuc: NuclidoTerapia, K: number, P_efectiva: number, m: Pick<ShieldingMaterial, 'code' | 'density'>): EspesorTerapia {
  const { mat, escala } = materialGPCatalogo(m);
  if (!(K > P_efectiva)) {
    return { espesor_mm: 0, rige: null, porCriterio: { estrecho_mm: 0, hazAncho_mm: 0 }, mfpLineaPrincipal: 0, mfpMaxLineas: 0, fueraRangoGP: false };
  }
  const B = P_efectiva / K;
  const ta = lineaEstrecha(nuc) === null ? 0 : invertir((t) => transmisionEstrecha(nuc, mat, t), B);
  const tb = invertir((t) => transmisionHazAncho(nuc, mat, t).T, B);
  const t = Math.max(ta, tb);
  const rige: CriterioTerapia = ta > 0 && ta >= tb ? 'haz estrecho' : transmisionHazAncho(nuc, mat, tb).criterio;
  const f = fraccionesKerma(nuc);
  const ls = ESPECTROS_TERAPIA[nuc].lineas;
  const iMax = f.indexOf(Math.max(...f));
  const mfp = (i: number, t_cm: number) => ls[i].muRhoSinCoh[mat] * RHO_REF[mat] * t_cm;
  const mfpMaxLineas = Math.max(...ls.map((_, i) => (f[i] >= 0.01 ? mfp(i, tb) : 0)));
  return {
    espesor_mm: t * 10 * escala,
    rige,
    porCriterio: { estrecho_mm: ta * 10 * escala, hazAncho_mm: tb * 10 * escala },
    mfpLineaPrincipal: mfp(iMax, t),
    mfpMaxLineas,
    fueraRangoGP: mfpMaxLineas > MFP_MAX_GP,
  };
}

/** Modalidades del catálogo con modelo espectral. */
export const MODALIDAD_NUCLIDO_TERAPIA: Record<string, NuclidoTerapia> = { 'radioiodine-i131': 'I131', lu177: 'Lu177', 'spect-tc99m': 'Tc99m' };

/**
 * Nucleido espectral que dimensiona un conjunto de fuentes: sólo si TODAS tienen modelo espectral. Un solo nucleido →
 * ése; mezcla de I-131 y Lu-177 → I-131 (el más penetrante). Otras mezclas siguen el camino anterior.
 */
export function nuclidoTerapiaDe(fuentes: RadiationSource[]): NuclidoTerapia | null {
  if (!fuentes.length) return null;
  const n = fuentes.map((s) => MODALIDAD_NUCLIDO_TERAPIA[s.modality.id]);
  if (n.some((x) => !x)) return null;
  const distintos = [...new Set(n)];
  if (distintos.length === 1) return distintos[0];
  return distintos.every((x) => x === 'I131' || x === 'Lu177') ? 'I131' : null;
}

/** Símbolo de las bibliotecas de los diálogos (`nuclearMedicine`, `TherapeuticRadionuclideShielding`, `IPEMReport109`). */
const SIMBOLO_NUCLIDO: Record<string, NuclidoTerapia> = {
  'Lu-177': 'Lu177', 'I-123': 'I123', 'Tc-99m': 'Tc99m', 'Tl-201': 'Tl201', 'In-111': 'In111', 'Ga-67': 'Ga67',
  'Sm-153': 'Sm153', 'Zr-89': 'Zr89',
};

export function nuclidoTerapiaDeSimbolo(simbolo: string): NuclidoTerapia | null {
  if (/^I-131/.test(simbolo)) return 'I131';
  return SIMBOLO_NUCLIDO[simbolo] ?? null;
}

/** Texto del método para los diálogos (N2: sin «vs haz estrecho» cuando el nucleido no tiene criterio (a)). */
export function metodoEspectro(nuc: NuclidoTerapia, rige: CriterioTerapia | null): string {
  const Ea = lineaEstrecha(nuc);
  const n = `${ESPECTROS_TERAPIA[nuc].lineas.length} líneas ENSDF ≥ ${UMBRAL_LINEA_PCT} %`;
  const r = rige ? `; rige: ${rige}` : '';
  return Ea === null
    ? `ANSI/ANS-6.4.3 GP, espectro completo (${n}${r})`
    : `ANSI/ANS-6.4.3 GP, espectro completo (${n}) vs haz estrecho a ${Ea.toFixed(1)} keV (${r ? r.slice(2) : 'el mayor'})`;
}

/** Notas de traza para el motor. */
export function notasTerapia(nuc: NuclidoTerapia): string[] {
  const e = ESPECTROS_TERAPIA[nuc];
  const Ea = lineaEstrecha(nuc);
  const b = `haz ancho del espectro completo (${e.lineas.length} líneas con Iγ ≥ ${UMBRAL_LINEA_PCT} %, ${e.fuente}) con buildup GP de ANSI/ANS-6.4.3 (ORNL/RSIC-49, Tabla 5.1)`;
  return [
    Ea === null
      ? `${e.etiqueta}: espesor = ${b}.`
      : `${e.etiqueta}: espesor = el mayor entre (a) haz estrecho a ${Ea.toFixed(1)} keV, la línea más energética con Iγ ≥ ${UMBRAL_LINEA_PCT} % (µ sin dispersión coherente, como ANSI/ANS-6.4.3), y (b) ${b}.`,
    e.oumano
      ? 'Concreto y materiales por equivalencia másica: (b) = max(Oumano 2025, 1.2·GP).'
      : 'Sin ajuste publicado de haz ancho (Oumano 2025) para este nucleido: (b) = GP.',
    'Acero → Fe; materiales distintos de Pb/acero por equivalencia másica con concreto 2.35 (conservador para Z alto).',
  ];
}
