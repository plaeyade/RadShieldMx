/**
 * TherapeuticRadionuclideShielding — MC-11: Blindaje para radiofarmacos terapeuticos
 * Calculador dedicado de blindaje para salas de preparacion y administracion
 * de Y-90, Lu-177, Ac-225, Pb-212, I-131.
 * Referencia: ICRP 128, 140, AAPM TG 377, MIRD Pamphlet 26
 *
 * Fase 11: el espesor mínimo de I-131 y Lu-177 sale de `terapiaEspectroGP` (espectro ENSDF completo, buildup GP de
 * ANSI/ANS-6.4.3, mayor entre haz estrecho a la línea más energética con Iγ ≥ 0.1 %, 722.9 / 321.3 keV, y haz ancho).
 * Las TVL de la tabla quedan como dato de biblioteca (I-131: 11 mm de Delacroix et al. 2002; la de haz estrecho a
 * 722.9 keV, que rige en plomo, es 20.3 mm; Lu-177 a 321.3 keV, 5.7 mm).
 */
import { espesorTerapiaGP, nuclidoTerapiaDeSimbolo } from '@/lib/terapiaEspectroGP';

export interface TherapyNuclide {
  name: string; symbol: string; halfLife_h: number;
  /** Constante gamma en μSv·m²/(MBq·h) (el nombre del campo conserva «GBq» por compatibilidad; el cálculo usa MBq). */
  gammaConstant_uSvm2perGBqh: number; tenthValueLead_mm: number;
  tenthValueConcrete_mm: number; maxBetaEnergy_MeV: number;
  meanBetaEnergy_MeV: number; maxRangePb_mm: number; // beta range in lead
  patientDoseRate_1m_uSvh_perGBq: number; // dose rate at 1m from patient post-admin
  roomClass: 'L' | 'M' | 'H'; // Low, Medium, High energy classification
}

/**
 * Revisión independiente de la Fase 8c: la TVL de plomo de I-131 (3 mm) y Lu-177 (0.7 mm) eran ≈ HVL.
 * I-131: 11 mm (Delacroix et al., 2002). Lu-177: 2.1 mm plomo y 79 mm concreto = TVL de haz estrecho de XCOM a 208 keV.
 *
 * Alfa-emisores con hijas en equilibrio (pendiente de la revisión 8c). Las TVL antes eran las de las gammas blandas del
 * padre (1.5 / 2.0 / 5.0 mm Pb). Ahora son la TVL de haz estrecho de XCOM (Berger et al., NIST; μ/ρ de Pb a 11.35 g/cm³
 * y de concreto ordinario a 2.35 g/cm³, interpolación log-log) a la línea más penetrante de la cadena con rendimiento
 * ≥ 1 %. Para un espectro de varias líneas B(t) = Σ wᵢ·e^(−μᵢt) ≤ e^(−μ_min·t), así que 10^(−t/TVL_dura) es una cota
 * superior de la transmisión de haz estrecho (sin acumulación) para cualquier espesor; las primeras TVL reales son
 * menores (curva biexponencial; Infantino et al., Phys. Med. 2022, doi:10.1016/j.ejmp.2022.10.007).
 * - Ac-225: Tl-209 1567 keV, 2.09 % (rama α de Bi-213, Huang y Wang, CIAE/IAEA 2011) × 99.66 % (ENSDF, Chen y Kondev,
 *   NDS 126, 2015) → Pb 39.6 → 40 mm, concreto 190 mm. Γ = 0.065 µSv·m²/(MBq·h) ≥ 0.0326 de Infantino et al. (2022,
 *   Ac-225 en equilibrio): se conserva.
 * - Pb-212: Tl-208 2614.5 keV, 35.94 % × 99.79 % (IAEA, X-ray and gamma-ray standards for detector calibration) →
 *   Pb 46.6 → 47 mm, concreto 247 mm. Γ: 0.028 sólo contaba la línea de 239 keV del Pb-212; con Bi-212 y Tl-208 en
 *   equilibrio, Σ yᵢEᵢ(μen/ρ)ᵢ con h*(10)/Ka de ICRP 74 (Tabla A.21) da 0.180 sin rayos X → 0.19.
 * - Ra-223: Pb-211 832 keV, 3.52 % (IAEA, ídem) → Pb 23.8 → 24 mm; concreto 138 mm, se conserva 250 (más conservador).
 *   Γ: 0.016 era menor que la suma de la cadena (Ra-223, Rn-219, Pb-211, Bi-211: 0.040 sin rayos X) → 0.045.
 * Comprobación del método: con el mismo cálculo, Ac-225 da 0.030 sin rayos X frente a 0.0326 de Infantino et al.
 */
export const THERAPY_NUCLIDES: TherapyNuclide[] = [
  { name: 'Lutetium-177', symbol: 'Lu-177', halfLife_h: 161.5, gammaConstant_uSvm2perGBqh: 0.0058, tenthValueLead_mm: 2.1, tenthValueConcrete_mm: 79, maxBetaEnergy_MeV: 0.497, meanBetaEnergy_MeV: 0.133, maxRangePb_mm: 0.4, patientDoseRate_1m_uSvh_perGBq: 0.46, roomClass: 'L' },
  { name: 'Yttrium-90', symbol: 'Y-90', halfLife_h: 64.1, gammaConstant_uSvm2perGBqh: 0.0085, tenthValueLead_mm: 6.0, tenthValueConcrete_mm: 280, maxBetaEnergy_MeV: 2.28, meanBetaEnergy_MeV: 0.934, maxRangePb_mm: 4.0, patientDoseRate_1m_uSvh_perGBq: 0.15, roomClass: 'M' },
  { name: 'Actinium-225', symbol: 'Ac-225', halfLife_h: 238.8, gammaConstant_uSvm2perGBqh: 0.065, tenthValueLead_mm: 40, tenthValueConcrete_mm: 190, maxBetaEnergy_MeV: 0.05, meanBetaEnergy_MeV: 0.02, maxRangePb_mm: 0.05, patientDoseRate_1m_uSvh_perGBq: 2.5, roomClass: 'H' },
  { name: 'Lead-212', symbol: 'Pb-212', halfLife_h: 10.6, gammaConstant_uSvm2perGBqh: 0.19, tenthValueLead_mm: 47, tenthValueConcrete_mm: 247, maxBetaEnergy_MeV: 0.34, meanBetaEnergy_MeV: 0.10, maxRangePb_mm: 0.5, patientDoseRate_1m_uSvh_perGBq: 1.8, roomClass: 'H' },
  { name: 'Iodine-131', symbol: 'I-131', halfLife_h: 193.6, gammaConstant_uSvm2perGBqh: 0.0595, tenthValueLead_mm: 11, tenthValueConcrete_mm: 170, maxBetaEnergy_MeV: 0.606, meanBetaEnergy_MeV: 0.192, maxRangePb_mm: 1.5, patientDoseRate_1m_uSvh_perGBq: 2.3, roomClass: 'M' },
  { name: 'Radium-223', symbol: 'Ra-223', halfLife_h: 274.2, gammaConstant_uSvm2perGBqh: 0.045, tenthValueLead_mm: 24, tenthValueConcrete_mm: 250, maxBetaEnergy_MeV: 0.05, meanBetaEnergy_MeV: 0.02, maxRangePb_mm: 0.05, patientDoseRate_1m_uSvh_perGBq: 0.6, roomClass: 'H' },
];

export interface TherapyRoomTask {
  name: string; nuclide: string; activity_MBq: number;
  frequency_perWeek: number; duration_min: number;
  distance_m: number; taskType: 'preparation' | 'administration' | 'patient_handling' | 'waste' | 'survey';
}

export const DEFAULT_THERAPY_TASKS: TherapyRoomTask[] = [
  { name: 'Preparacion Lutathera', nuclide: 'Lu-177', activity_MBq: 7400, frequency_perWeek: 5, duration_min: 30, distance_m: 0.5, taskType: 'preparation' },
  { name: 'Administration Lutathera', nuclide: 'Lu-177', activity_MBq: 7400, frequency_perWeek: 5, duration_min: 15, distance_m: 1.0, taskType: 'administration' },
  { name: 'Preparacion Pluvicto', nuclide: 'Lu-177', activity_MBq: 7400, frequency_perWeek: 10, duration_min: 30, distance_m: 0.5, taskType: 'preparation' },
  { name: 'Administration Pluvicto', nuclide: 'Lu-177', activity_MBq: 7400, frequency_perWeek: 10, duration_min: 15, distance_m: 1.0, taskType: 'administration' },
  { name: 'Preparacion Y-90 SIRT', nuclide: 'Y-90', activity_MBq: 2000, frequency_perWeek: 2, duration_min: 45, distance_m: 0.5, taskType: 'preparation' },
  { name: 'Paciente Lu-177 post-admin', nuclide: 'Lu-177', activity_MBq: 7400, frequency_perWeek: 15, duration_min: 60, distance_m: 2.0, taskType: 'patient_handling' },
  { name: 'Paciente I-131 terapia', nuclide: 'I-131', activity_MBq: 5550, frequency_perWeek: 2, duration_min: 30, distance_m: 2.0, taskType: 'patient_handling' },
  { name: 'Manejo desechos Ac-225', nuclide: 'Ac-225', activity_MBq: 100, frequency_perWeek: 3, duration_min: 15, distance_m: 1.0, taskType: 'waste' },
];

export interface TaskDoseResult {
  task: TherapyRoomTask; nuclide: TherapyNuclide;
  weeklyDose_uSv: number; annualDose_mSv: number;
  fractionOfLimit: number; // fraction of 20 mSv/year limit
  shieldingRequired: boolean;
  minLead_mm: number; minConcrete_mm: number;
}

/** Tasa a 1 m del paciente por GBq: la mayor entre la de la tabla y la de la fuente puntual (Γ·1000). */
export function patientRate1m_uSvh_perGBq(nuc: TherapyNuclide): number {
  return Math.max(nuc.patientDoseRate_1m_uSvh_perGBq, nuc.gammaConstant_uSvm2perGBqh * 1000);
}

export function calculateTaskDose(task: TherapyRoomTask, designLimit_uSv_week: number = 100): TaskDoseResult {
  const nuc = THERAPY_NUCLIDES.find(n => n.symbol === task.nuclide) || THERAPY_NUCLIDES[0];
  const admin_GBq = task.activity_MBq / 1000;
  const time_h = task.duration_min / 60;
  let weeklyDose_uSv = 0;

  if (task.taskType === 'patient_handling') {
    // Tasa a 1 m del paciente. Revisión 8c: la tabla (sin fuente) quedaba muy por debajo de la fuente puntual Γ·A
    // (p. ej. I-131 2.3 frente a 59.5 μSv/h por GBq; Pb-212 1.8 frente a 190; Ac-225 2.5 frente a 65), cuando la
    // autoabsorción del paciente sólo puede bajar la tasa respecto de la fuente puntual sin blindaje. Mientras no haya
    // tasas medidas citadas se usa la mayor de las dos: Γ·1000 (μSv·m²/(GBq·h)) es la cota conservadora.
    const tasa_1m = patientRate1m_uSvh_perGBq(nuc);
    weeklyDose_uSv = task.frequency_perWeek * tasa_1m * admin_GBq * time_h / (task.distance_m * task.distance_m);
  } else {
    // Preparation, admin, waste: use gamma constant
    weeklyDose_uSv = task.frequency_perWeek * admin_GBq * nuc.gammaConstant_uSvm2perGBqh * time_h * 1000 / (task.distance_m * task.distance_m);
  }

  const annualDose_mSv = weeklyDose_uSv * 50 / 1000; // 50 weeks/year
  const fractionOfLimit = annualDose_mSv / 20; // 20 mSv/year limit
  const shieldingRequired = weeklyDose_uSv > designLimit_uSv_week;
  const ratio = weeklyDose_uSv > 0 ? designLimit_uSv_week / weeklyDose_uSv : Infinity;
  // Número de TVL continuo (antes se redondeaba hacia arriba a un entero, lo que inflaba el espesor hasta 1 TVL).
  const tvlNeeded = ratio > 0 && ratio < 1 ? -Math.log10(ratio) : 0;

  // Fase 11: I-131 y Lu-177 por espectro completo con buildup GP (ANSI/ANS-6.4.3) y la regla max(haz estrecho a la línea
  // más energética, haz ancho) de `terapiaEspectroGP`; el resto, n·TVL (línea dura de la cadena, revisión 8c).
  const gp = nuclidoTerapiaDeSimbolo(nuc.symbol);
  if (gp && ratio < 1) {
    const pb = espesorTerapiaGP(gp, 1, ratio, { code: 'PB', density: 11.35 }).espesor_mm;
    const conc = espesorTerapiaGP(gp, 1, ratio, { code: 'CONCRETE235', density: 2.35 }).espesor_mm;
    return { task, nuclide: nuc, weeklyDose_uSv, annualDose_mSv, fractionOfLimit, shieldingRequired, minLead_mm: pb, minConcrete_mm: conc };
  }
  return { task, nuclide: nuc, weeklyDose_uSv, annualDose_mSv, fractionOfLimit, shieldingRequired, minLead_mm: tvlNeeded * nuc.tenthValueLead_mm, minConcrete_mm: tvlNeeded * nuc.tenthValueConcrete_mm };
}

export function getRoomSummary(tasks: TherapyRoomTask[], designLimit_uSv_week: number = 100) {
  const results = tasks.map(t => calculateTaskDose(t, designLimit_uSv_week));
  const totalWeekly_uSv = results.reduce((s, r) => s + r.weeklyDose_uSv, 0);
  const totalAnnual_mSv = results.reduce((s, r) => s + r.annualDose_mSv, 0);
  const maxFraction = Math.max(...results.map(r => r.fractionOfLimit), 0);
  const shieldingTasks = results.filter(r => r.shieldingRequired);
  // La sala cumple si la suma de todas las tareas no supera el objetivo semanal (antes: objetivo × número de tareas).
  return { results, totalWeekly_uSv, totalAnnual_mSv, maxFraction, totalFraction: totalAnnual_mSv / 20, withinLimits: totalWeekly_uSv <= designLimit_uSv_week, shieldingTasksCount: shieldingTasks.length };
}
