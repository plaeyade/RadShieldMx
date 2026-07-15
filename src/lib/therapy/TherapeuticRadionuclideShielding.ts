/**
 * TherapeuticRadionuclideShielding — MC-11: Blindaje para radiofarmacos terapeuticos
 * Calculador dedicado de blindaje para salas de preparacion y administracion
 * de Y-90, Lu-177, Ac-225, Pb-212, I-131.
 * Referencia: ICRP 128, 140, AAPM TG 377, MIRD Pamphlet 26
 */

export interface TherapyNuclide {
  name: string; symbol: string; halfLife_h: number;
  gammaConstant_uSvm2perGBqh: number; tenthValueLead_mm: number;
  tenthValueConcrete_mm: number; maxBetaEnergy_MeV: number;
  meanBetaEnergy_MeV: number; maxRangePb_mm: number; // beta range in lead
  patientDoseRate_1m_uSvh_perGBq: number; // dose rate at 1m from patient post-admin
  roomClass: 'L' | 'M' | 'H'; // Low, Medium, High energy classification
}

export const THERAPY_NUCLIDES: TherapyNuclide[] = [
  { name: 'Lutetium-177', symbol: 'Lu-177', halfLife_h: 161.5, gammaConstant_uSvm2perGBqh: 0.0058, tenthValueLead_mm: 0.7, tenthValueConcrete_mm: 55, maxBetaEnergy_MeV: 0.497, meanBetaEnergy_MeV: 0.133, maxRangePb_mm: 0.4, patientDoseRate_1m_uSvh_perGBq: 0.46, roomClass: 'L' },
  { name: 'Yttrium-90', symbol: 'Y-90', halfLife_h: 64.1, gammaConstant_uSvm2perGBqh: 0.0085, tenthValueLead_mm: 6.0, tenthValueConcrete_mm: 280, maxBetaEnergy_MeV: 2.28, meanBetaEnergy_MeV: 0.934, maxRangePb_mm: 4.0, patientDoseRate_1m_uSvh_perGBq: 0.15, roomClass: 'M' },
  { name: 'Actinium-225', symbol: 'Ac-225', halfLife_h: 238.8, gammaConstant_uSvm2perGBqh: 0.065, tenthValueLead_mm: 1.5, tenthValueConcrete_mm: 120, maxBetaEnergy_MeV: 0.05, meanBetaEnergy_MeV: 0.02, maxRangePb_mm: 0.05, patientDoseRate_1m_uSvh_perGBq: 2.5, roomClass: 'H' },
  { name: 'Lead-212', symbol: 'Pb-212', halfLife_h: 10.6, gammaConstant_uSvm2perGBqh: 0.028, tenthValueLead_mm: 2.0, tenthValueConcrete_mm: 150, maxBetaEnergy_MeV: 0.34, meanBetaEnergy_MeV: 0.10, maxRangePb_mm: 0.5, patientDoseRate_1m_uSvh_perGBq: 1.8, roomClass: 'H' },
  { name: 'Iodine-131', symbol: 'I-131', halfLife_h: 193.6, gammaConstant_uSvm2perGBqh: 0.0595, tenthValueLead_mm: 3.0, tenthValueConcrete_mm: 170, maxBetaEnergy_MeV: 0.606, meanBetaEnergy_MeV: 0.192, maxRangePb_mm: 1.5, patientDoseRate_1m_uSvh_perGBq: 2.3, roomClass: 'M' },
  { name: 'Radium-223', symbol: 'Ra-223', halfLife_h: 274.2, gammaConstant_uSvm2perGBqh: 0.016, tenthValueLead_mm: 5.0, tenthValueConcrete_mm: 250, maxBetaEnergy_MeV: 0.05, meanBetaEnergy_MeV: 0.02, maxRangePb_mm: 0.05, patientDoseRate_1m_uSvh_perGBq: 0.6, roomClass: 'H' },
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

export function calculateTaskDose(task: TherapyRoomTask, designLimit_uSv_week: number = 100): TaskDoseResult {
  const nuc = THERAPY_NUCLIDES.find(n => n.symbol === task.nuclide) || THERAPY_NUCLIDES[0];
  const admin_GBq = task.activity_MBq / 1000;
  const time_h = task.duration_min / 60;
  let weeklyDose_uSv = 0;

  if (task.taskType === 'patient_handling') {
    // Use patient dose rate at 1m, scaled by distance
    weeklyDose_uSv = task.frequency_perWeek * nuc.patientDoseRate_1m_uSvh_perGBq * admin_GBq * time_h / (task.distance_m * task.distance_m);
  } else {
    // Preparation, admin, waste: use gamma constant
    weeklyDose_uSv = task.frequency_perWeek * admin_GBq * nuc.gammaConstant_uSvm2perGBqh * time_h * 1000 / (task.distance_m * task.distance_m);
  }

  const annualDose_mSv = weeklyDose_uSv * 50 / 1000; // 50 weeks/year
  const fractionOfLimit = annualDose_mSv / 20; // 20 mSv/year limit
  const shieldingRequired = weeklyDose_uSv > designLimit_uSv_week;
  const ratio = weeklyDose_uSv > 0 ? designLimit_uSv_week / weeklyDose_uSv : Infinity;
  const tvlNeeded = ratio > 0 && ratio < 1 ? Math.ceil(-Math.log10(ratio)) : 0;

  return { task, nuclide: nuc, weeklyDose_uSv, annualDose_mSv, fractionOfLimit, shieldingRequired, minLead_mm: tvlNeeded * nuc.tenthValueLead_mm, minConcrete_mm: tvlNeeded * nuc.tenthValueConcrete_mm };
}

export function getRoomSummary(tasks: TherapyRoomTask[], designLimit_uSv_week: number = 100) {
  const results = tasks.map(t => calculateTaskDose(t, designLimit_uSv_week));
  const totalWeekly_uSv = results.reduce((s, r) => s + r.weeklyDose_uSv, 0);
  const totalAnnual_mSv = results.reduce((s, r) => s + r.annualDose_mSv, 0);
  const maxFraction = Math.max(...results.map(r => r.fractionOfLimit), 0);
  const shieldingTasks = results.filter(r => r.shieldingRequired);
  return { results, totalWeekly_uSv, totalAnnual_mSv, maxFraction, withinLimits: totalWeekly_uSv <= designLimit_uSv_week * tasks.length, shieldingTasksCount: shieldingTasks.length };
}
