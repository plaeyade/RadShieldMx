/**
 * Activación del aire en la bóveda de un ciclotrón o un linac de alta energía: Ar-41 por (n,γ)
 * sobre Ar-40, con ventilación.
 *
 * Modelo de mezcla completa (NCRP 144 §5; IAEA TRS 283):
 *   R = φ_th · σ · N_Ar        [reacciones / cm³ / s]
 *   dC/dt = R − (λ + q)·C,  q = renovaciones/h ÷ 3600
 *   C(t) = R/(λ+q) · (1 − e^{−(λ+q)t}),  C_sat = R/(λ+q)
 * Al apagar el haz, C decae con (λ + q). La emisión por la chimenea es C·Q.
 *
 * Referencias de comparación: 10 CFR 20, Apéndice B, para Ar-41 (submersión). DAC ocupacional:
 * 3E-6 µCi/mL (1,11E5 Bq/m³). Concentración en efluentes al público: 1E-8 µCi/mL (370 Bq/m³).
 * Verificar contra los límites de la autorización CNSNS.
 */

export const AR41 = {
  semivida_min: 109.61,
  sigmaTermica_b: 0.66, // Ar-40(n,γ), térmica 2200 m/s (ENDF/B-VIII.0)
  fraccionVolumenAr: 0.00934, // aire seco
  densidadAire_moleculas_cm3: 2.504e19, // 20 °C, 1 atm
  DAC_Bq_m3: 3e-6 * 3.7e10, // 10 CFR 20 Ap. B, tabla 1, col. 3
  efluente_Bq_m3: 1e-8 * 3.7e10, // 10 CFR 20 Ap. B, tabla 2, col. 1
} as const;

export interface EntradaVentilacion {
  volumenSala_m3: number;
  renovaciones_h: number;
  /** Flujo térmico medio en el aire de la sala, en n/cm²/s (de la malla MC de Cyclotron-SIM o medido). */
  flujoTermico_n_cm2_s: number;
  horasIrradiacion: number;
  /** Minutos de espera tras apagar el haz antes de entrar. */
  esperaAntesDeEntrar_min?: number;
}

export interface ResultadoVentilacion {
  produccion_Bq_cm3_s: number;
  concentracionSaturacion_Bq_m3: number;
  concentracionFinIrradiacion_Bq_m3: number;
  concentracionAlEntrar_Bq_m3: number;
  fraccionDAC_alEntrar: number;
  emisionChimenea_Bq_s: number;
  relacionEfluente_finIrradiacion: number;
  tiempoHastaBajoDAC_min: number;
  advertencias: string[];
}

export function calcularVentilacionAr41(e: EntradaVentilacion): ResultadoVentilacion {
  const advertencias: string[] = [];
  for (const [k, v] of Object.entries(e)) {
    if (typeof v === 'number' && (!Number.isFinite(v) || v < 0)) throw new Error(`${k} debe ser un número ≥ 0`);
  }
  if (e.volumenSala_m3 <= 0) throw new Error('volumenSala_m3 debe ser > 0');
  const lambda = Math.LN2 / (AR41.semivida_min * 60);
  const q = e.renovaciones_h / 3600;
  const nAr = AR41.fraccionVolumenAr * AR41.densidadAire_moleculas_cm3;
  const R = e.flujoTermico_n_cm2_s * AR41.sigmaTermica_b * 1e-24 * nAr; // Bq/cm³/s
  const k = lambda + q;
  const cSat = (R / k) * 1e6; // Bq/m³
  const t = e.horasIrradiacion * 3600;
  const cFin = cSat * (1 - Math.exp(-k * t));
  const espera = (e.esperaAntesDeEntrar_min ?? 0) * 60;
  const cEntrar = cFin * Math.exp(-k * espera);
  const caudal_m3_s = (e.renovaciones_h * e.volumenSala_m3) / 3600;
  const tBajoDAC = cFin > AR41.DAC_Bq_m3 ? Math.log(cFin / AR41.DAC_Bq_m3) / k / 60 : 0;
  if (e.renovaciones_h === 0) advertencias.push('Sin ventilación: el Ar-41 sólo decae (T½ 110 min).');
  if (e.renovaciones_h > 0 && e.renovaciones_h < 3) advertencias.push('Menos de 3 renovaciones/h: revisar contra el diseño HVAC de la bóveda.');
  if (cEntrar > AR41.DAC_Bq_m3) advertencias.push('Al entrar se supera el DAC de Ar-41: alargar la espera o aumentar la ventilación.');
  if (cFin > AR41.efluente_Bq_m3) {
    advertencias.push('La concentración en la descarga supera el límite de efluentes en el punto de emisión: se requiere dilución o retardo antes de la chimenea, y verificar la autorización.');
  }
  return {
    produccion_Bq_cm3_s: R,
    concentracionSaturacion_Bq_m3: cSat,
    concentracionFinIrradiacion_Bq_m3: cFin,
    concentracionAlEntrar_Bq_m3: cEntrar,
    fraccionDAC_alEntrar: cEntrar / AR41.DAC_Bq_m3,
    emisionChimenea_Bq_s: cFin * caudal_m3_s,
    relacionEfluente_finIrradiacion: cFin / AR41.efluente_Bq_m3,
    tiempoHastaBajoDAC_min: tBajoDAC,
    advertencias,
  };
}

/** Contrato `cyclotron-sim/flujo_aire@1`: flujo térmico medio del aire de la bóveda según el MC. */
export interface FlujoAireCyclotronSim {
  contrato: 'cyclotron-sim/flujo_aire@1';
  maquina: string;
  corriente_uA: number;
  lotes: number;
  phi_termico_aire_n_cm2_s: { media: number; mediana: number; p95: number; max: number };
  fuente?: string;
}

export function leerFlujoAire(datos: unknown): FlujoAireCyclotronSim {
  const d = datos as Partial<FlujoAireCyclotronSim> | null;
  if (!d || d.contrato !== 'cyclotron-sim/flujo_aire@1') throw new Error('No es un contrato cyclotron-sim/flujo_aire@1');
  const p = d.phi_termico_aire_n_cm2_s;
  if (!p || !(p.media > 0) || !(p.p95 >= p.media) || !(Number(d.corriente_uA) > 0)) throw new Error('Flujo del contrato inválido');
  return d as FlujoAireCyclotronSim;
}

/** El flujo escala linealmente con la corriente total del haz (mismo blanco y energía). */
export function flujoParaCorriente(f: FlujoAireCyclotronSim, corriente_uA: number, conservador = false): number {
  const base = conservador ? f.phi_termico_aire_n_cm2_s.p95 : f.phi_termico_aire_n_cm2_s.media;
  return (base * corriente_uA) / f.corriente_uA;
}
