/**
 * Proyección de tasa y dosis acumulada de una fuente que decae (ExposureRateProjection). Fase 8d:
 *   Ḣ(t) = Ḣ₀·e^(−λt),   H(0→t) = h·Ḣ₀·(1 − e^(−λt))/λ,   λ = ln 2 / T½,
 * con h las horas de permanencia por año (editable; 8760 h = ocupación continua). Antes cada tramo de 5 años
 * tomaba la tasa del inicio del tramo durante 8760 h fijas, de modo que el año 0 ya mostraba 5 años de dosis.
 */
export interface PuntoProyeccion {
  anio: number;
  actividad: number;
  tasa_uSv_h: number;
  dosisAcumulada_mSv: number;
}

export function proyeccionDecaimiento(o: {
  actividad0: number;
  T12_anios: number;
  tasa0_uSv_h: number;
  anios: number;
  horasPorAnio: number;
  paso_anios?: number;
}): PuntoProyeccion[] {
  const paso = o.paso_anios ?? 5;
  if (!(o.T12_anios > 0) || !(paso > 0) || !(o.anios >= 0)) return [];
  const lambda = Math.LN2 / o.T12_anios;
  const h = Math.max(0, o.horasPorAnio);
  const puntos: PuntoProyeccion[] = [];
  for (let y = 0; y <= o.anios + 1e-9; y += paso) {
    const f = Math.exp(-lambda * y);
    puntos.push({
      anio: y,
      actividad: o.actividad0 * f,
      tasa_uSv_h: o.tasa0_uSv_h * f,
      // −expm1(−λt) = 1 − e^(−λt) sin cancelación cuando λt ≪ 1 (semividas largas).
      dosisAcumulada_mSv: (h * o.tasa0_uSv_h * -Math.expm1(-lambda * y)) / lambda / 1000,
    });
  }
  return puntos;
}
