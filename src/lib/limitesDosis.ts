/**
 * Tabla única de límites y objetivos de dosis citados por los diálogos (Fase 8c). Antes cada diálogo traía los suyos
 * (público 1 o 5 mSv/año, «TG-108 < 20 mSv/año», «controlada NCRP 147 = 20 μSv/semana»).
 *
 * - Límites de dosis (ICRP 103, 2007): POE 20 mSv/año promediados en 5 años, sin superar 50 mSv en un año;
 *   público 1 mSv/año.
 * - Valores del Reglamento General de Seguridad Radiológica (1988): POE 50 mSv/año y público 5 mSv/año. Se citan como
 *   históricos: verifique la norma mexicana vigente (NOM-012-STPS y su actualización). La NOM-008-NUCL-2024 regula contaminación radiactiva, no límites de dosis.
 * - Objetivos de diseño de blindaje (NCRP 147 §1.3, NCRP 151 §1.2, AAPM TG-108): 0.1 mSv/semana en área controlada y
 *   0.02 mSv/semana en área no controlada.
 */
export const LIMITES_DOSIS = {
  icrp103: { poe_mSv_anio: 20, poeMaxUnAnio_mSv: 50, publico_mSv_anio: 1, referencia: 'ICRP 103 (2007), Tabla 6' },
  rgsr1988: { poe_mSv_anio: 50, publico_mSv_anio: 5, referencia: 'RGSR (1988), valores históricos: verificar norma vigente' },
  objetivosDiseno: { controlada_mSv_semana: 0.1, noControlada_mSv_semana: 0.02, referencia: 'NCRP 147 §1.3 / NCRP 151 §1.2 / AAPM TG-108' },
} as const;
