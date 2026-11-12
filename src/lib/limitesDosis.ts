/**
 * Tabla única de límites y objetivos de dosis citados por los diálogos (Fase 8c). Antes cada diálogo traía los suyos
 * (público 1 o 5 mSv/año, «TG-108 < 20 mSv/año»; antes decía «controlada NCRP 147 = 20 μSv/semana»).
 *
 * - Límites de dosis (ICRP 103, 2007): POE 20 mSv/año promediados en 5 años, sin superar 50 mSv en un año;
 *   público 1 mSv/año.
 * - Valores del Reglamento General de Seguridad Radiológica (1988): POE 50 mSv/año y público 5 mSv/año. Se citan como
 *   históricos: verifique la norma mexicana vigente (NOM-012-STPS y su actualización). La NOM-008-NUCL-2024 regula contaminación radiactiva, no límites de dosis.
 * - Objetivos de diseño de blindaje (NCRP 147 §1.3, NCRP 151 §1.2, AAPM TG-108): 0.1 mSv/semana en área controlada y
 *   0.02 mSv/semana en área no controlada. Es la ÚNICA fuente de estos objetivos en RadShield (código, textos, prompts,
 *   manuales y datos de ingesta): «objetivosDiseno.test.ts» falla si reaparece otro valor (p. ej. 0.4 mSv/semana).
 */
export const LIMITES_DOSIS = {
  icrp103: { poe_mSv_anio: 20, poeMaxUnAnio_mSv: 50, publico_mSv_anio: 1, referencia: 'ICRP 103 (2007), Tabla 6' },
  rgsr1988: { poe_mSv_anio: 50, publico_mSv_anio: 5, referencia: 'RGSR (1988), valores históricos: verificar norma vigente' },
  objetivosDiseno: { controlada_mSv_semana: 0.1, noControlada_mSv_semana: 0.02, referencia: 'NCRP 147 §1.3 / NCRP 151 §1.2 / AAPM TG-108' },
} as const;

/** Objetivo de diseño P en área controlada (mSv/semana), NCRP 147 §1.3 / NCRP 151 §1.2. */
export const P_CONTROLADA_mSv_semana = LIMITES_DOSIS.objetivosDiseno.controlada_mSv_semana;
/** Objetivo de diseño P en área no controlada / público (mSv/semana), NCRP 147 §1.3 / NCRP 151 §1.2. */
export const P_NO_CONTROLADA_mSv_semana = LIMITES_DOSIS.objetivosDiseno.noControlada_mSv_semana;
/** Los mismos objetivos en μSv/semana (para diálogos que trabajan en μSv). */
export const P_CONTROLADA_uSv_semana = Math.round(P_CONTROLADA_mSv_semana * 1000);
export const P_NO_CONTROLADA_uSv_semana = Math.round(P_NO_CONTROLADA_mSv_semana * 1000);
/** Texto corto para rótulos y prompts: «controlada 0.1 mSv/semana; no controlada 0.02 mSv/semana (NCRP 147 / 151)». */
export const TEXTO_OBJETIVOS_DISENO = `controlada ${P_CONTROLADA_mSv_semana} mSv/semana; no controlada ${P_NO_CONTROLADA_mSv_semana} mSv/semana (NCRP 147 §1.3 / NCRP 151 §1.2)`;
export const TEXTO_OBJETIVOS_DISENO_EN = `controlled ${P_CONTROLADA_mSv_semana} mSv/week; uncontrolled ${P_NO_CONTROLADA_mSv_semana} mSv/week (NCRP 147 §1.3 / NCRP 151 §1.2)`;
