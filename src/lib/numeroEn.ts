/**
 * Número Eₙ (ISO 13528 / ISO/IEC 17043) para comparar una medición con un valor de referencia:
 *   Eₙ = (x − X) / √(U_x² + U_X²),   con U expandidas (k = 2);  |Eₙ| ≤ 1 → concordante.
 * Fase 8d: ExperimentalValidation dividía |Δ| entre la incertidumbre de la medición sola y aceptaba |Δ| ≤ 2u.
 */
export interface ResultadoEn {
  diferencia: number;
  /** null si ambas incertidumbres son 0 (no se puede evaluar). */
  en: number | null;
  concordante: boolean | null;
}

export function numeroEn(x: number, U_x: number, X: number, U_X: number): ResultadoEn {
  const diferencia = x - X;
  const U = Math.sqrt(Math.max(0, U_x) ** 2 + Math.max(0, U_X) ** 2);
  if (!Number.isFinite(diferencia) || !(U > 0)) return { diferencia, en: null, concordante: null };
  const en = diferencia / U;
  return { diferencia, en, concordante: Math.abs(en) <= 1 };
}
