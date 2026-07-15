// =============================================================================
// controlledZoneCalculationAdapter.ts - F55 packet to shielding/memoria preflight
// =============================================================================

import {
  calculateGammaKnifeBarrier,
  calculateHDRBrachyBarrier,
  calculateLINACPrimaryBarrier,
  calculateLINACSecondaryBarrier,
  calculatePETCTBarrier,
} from './uaqProtocol';
import type {
  ControlledZoneFeasibilityOption,
  ControlledZoneProfile,
  ShieldingSeedPoint,
} from './controlledZoneFeasibility';
import { CONTROLLED_ZONE_CONTRACTS } from './controlledZoneContracts';

export type PreliminaryCalculationMethod = 'NCRP151-primary' | 'NCRP151-secondary' | 'TG108-PETCT' | 'GammaKnife' | 'HDR';

export interface ControlledZoneCalculationAssumptions {
  materialCode: string;
  linacEnergy_MeV: number;
  linacWorkload_Gy_per_wk: number;
  linacTechnique: string;
  petActivity_MBQ_per_injection: number;
  petGammaConstant_uSv_m2_GBq_h: number;
  gammaKnifeDose_Gy_per_fraction: number;
  hdrActivity_Ci: number;
  hdrGammaConstant_R_m2_Ci_h: number;
  workDaysPerWeek: number;
}

export interface ControlledZoneBarrierCalculation {
  seedId: string;
  barrier: string;
  adjacentZone: ShieldingSeedPoint['adjacentZone'];
  calculationFamily: ShieldingSeedPoint['calculationFamily'];
  method: PreliminaryCalculationMethod;
  distance_m: number;
  occupancyFactor: number;
  designGoal_mSvWeek: number;
  unshielded_mSvWeek: number;
  requiredThickness_mm: number;
  requiredThickness_cm: number;
  materialCode: string;
  status: 'ready' | 'review';
  notes: string[];
}

export interface ControlledZoneShieldingPlan {
  schemaVersion: 'radshield-controlled-zone-shielding-plan-v1';
  generatedAt: string;
  optionId: string;
  optionName: string;
  modality: ControlledZoneFeasibilityOption['modality'];
  profile: ControlledZoneProfile;
  assumptions: ControlledZoneCalculationAssumptions;
  calculations: ControlledZoneBarrierCalculation[];
  summary: {
    barrierCount: number;
    maxThickness_mm: number;
    maxUnshielded_mSvWeek: number;
    reviewCount: number;
    canStartAnalyticMemory: boolean;
  };
  analyticMemoryDraft: string;
  missingInputs: string[];
}

export interface ControlledZoneDbPersistenceDraft {
  schemaVersion: 'radshield-controlled-zone-db-draft-v1';
  generatedAt: string;
  planKey: string;
  plan: {
    optionId: string;
    optionName: string;
    modality: ControlledZoneShieldingPlan['modality'];
    generatedAt: string;
    profile: ControlledZoneProfile;
    assumptions: ControlledZoneCalculationAssumptions;
    summary: ControlledZoneShieldingPlan['summary'];
    analyticMemoryDraft: string;
    missingInputs: string[];
  };
  calculations: Array<ControlledZoneBarrierCalculation & {
    planKey: string;
    sortOrder: number;
  }>;
}

const DEFAULT_ASSUMPTIONS: ControlledZoneCalculationAssumptions = {
  materialCode: 'concrete235',
  linacEnergy_MeV: 15,
  linacWorkload_Gy_per_wk: 500,
  linacTechnique: 'VMAT',
  petActivity_MBQ_per_injection: 370,
  petGammaConstant_uSv_m2_GBq_h: 143,
  gammaKnifeDose_Gy_per_fraction: 15,
  hdrActivity_Ci: 10,
  hdrGammaConstant_R_m2_Ci_h: 4.69,
  workDaysPerWeek: 5,
};

export function buildDefaultControlledZoneCalculationAssumptions(
  overrides: Partial<ControlledZoneCalculationAssumptions> = {},
): ControlledZoneCalculationAssumptions {
  return { ...DEFAULT_ASSUMPTIONS, ...overrides };
}

export function calculateControlledZoneShieldingPlan(
  option: ControlledZoneFeasibilityOption,
  profile: ControlledZoneProfile,
  assumptions = buildDefaultControlledZoneCalculationAssumptions(),
): ControlledZoneShieldingPlan {
  const calculations = option.shieldingSeeds.map((seed) => calculateSeed(seed, option, profile, assumptions));
  const maxThickness = Math.max(...calculations.map((calc) => calc.requiredThickness_mm), 0);
  const maxUnshielded = Math.max(...calculations.map((calc) => calc.unshielded_mSvWeek), 0);
  const reviewCount = calculations.filter((calc) => calc.status === 'review').length;
  const missingInputs = buildMissingInputs(option);
  const summary = {
    barrierCount: calculations.length,
    maxThickness_mm: round(maxThickness, 1),
    maxUnshielded_mSvWeek: round(maxUnshielded, 3),
    reviewCount,
    canStartAnalyticMemory: calculations.length >= 4 && missingInputs.length <= 8,
  };

  return {
    schemaVersion: CONTROLLED_ZONE_CONTRACTS.shieldingPlan,
    generatedAt: new Date().toISOString(),
    optionId: option.id,
    optionName: option.name,
    modality: option.modality,
    profile,
    assumptions,
    calculations,
    summary,
    analyticMemoryDraft: buildAnalyticMemoryDraft(option, profile, assumptions, calculations, missingInputs),
    missingInputs,
  };
}

export function exportControlledZoneShieldingPlan(plan: ControlledZoneShieldingPlan) {
  return {
    fileName: `${plan.optionId}-shielding-plan.json`,
    mimeType: 'application/json',
    body: JSON.stringify(plan, null, 2),
  };
}

export function parseControlledZoneShieldingPlanJson(raw: string): ControlledZoneShieldingPlan {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('El archivo no contiene JSON valido.');
  }

  if (!isControlledZoneShieldingPlanLike(parsed)) {
    throw new Error('El JSON no corresponde a un ControlledZoneShieldingPlan v1.');
  }

  return parsed;
}

export function buildControlledZoneDbPersistenceDraft(plan: ControlledZoneShieldingPlan): ControlledZoneDbPersistenceDraft {
  const planKey = `cz-plan:${plan.optionId}:${plan.generatedAt}`;
  return {
    schemaVersion: CONTROLLED_ZONE_CONTRACTS.dbDraft,
    generatedAt: new Date().toISOString(),
    planKey,
    plan: {
      optionId: plan.optionId,
      optionName: plan.optionName,
      modality: plan.modality,
      generatedAt: plan.generatedAt,
      profile: plan.profile,
      assumptions: plan.assumptions,
      summary: plan.summary,
      analyticMemoryDraft: plan.analyticMemoryDraft,
      missingInputs: plan.missingInputs,
    },
    calculations: plan.calculations.map((calculation, index) => ({
      ...calculation,
      planKey,
      sortOrder: index + 1,
    })),
  };
}

export function exportControlledZoneDbPersistenceDraft(plan: ControlledZoneShieldingPlan) {
  return {
    fileName: `${plan.optionId}-db-draft.json`,
    mimeType: 'application/json',
    body: JSON.stringify(buildControlledZoneDbPersistenceDraft(plan), null, 2),
  };
}

function isControlledZoneShieldingPlanLike(value: unknown): value is ControlledZoneShieldingPlan {
  const plan = value as ControlledZoneShieldingPlan;
  return Boolean(
    plan &&
    plan.schemaVersion === CONTROLLED_ZONE_CONTRACTS.shieldingPlan &&
    typeof plan.optionId === 'string' &&
    typeof plan.optionName === 'string' &&
    plan.profile &&
    plan.assumptions &&
    plan.summary &&
    Array.isArray(plan.calculations) &&
    typeof plan.analyticMemoryDraft === 'string' &&
    Array.isArray(plan.missingInputs),
  );
}

function calculateSeed(
  seed: ShieldingSeedPoint,
  option: ControlledZoneFeasibilityOption,
  profile: ControlledZoneProfile,
  assumptions: ControlledZoneCalculationAssumptions,
): ControlledZoneBarrierCalculation {
  const P = seed.designGoal_mSvWeek;
  const d = Math.max(seed.distance_m, 0.5);
  const T = Math.max(seed.occupancyFactor, 0.01);
  const materialCode = assumptions.materialCode;

  if (seed.calculationFamily === 'NCRP151') {
    const isPrimary = seed.barrier === 'Norte' || seed.barrier === 'Sur';
    if (isPrimary) {
      const result = calculateLINACPrimaryBarrier({
        energy_MeV: assumptions.linacEnergy_MeV,
        W_Gy_per_wk: assumptions.linacWorkload_Gy_per_wk,
        technique: assumptions.linacTechnique,
        P_mSv_per_wk: P,
        d_pri_m: d,
        U: 0.25,
        T,
        F_conv_fraction: 0.25,
        F_IMRT_fraction: 0.75,
        materialCode,
      });
      return buildCalculation(seed, 'NCRP151-primary', result.thickness_mm, estimateUnshieldedFromTransmission(P, result.B), materialCode, [
        'Supuesto preliminar: barrera Norte/Sur tratada como primaria.',
        `Carga LINAC usada: ${assumptions.linacWorkload_Gy_per_wk} Gy/semana, ${assumptions.linacTechnique}.`,
      ]);
    }

    const result = calculateLINACSecondaryBarrier({
      energy_MeV: assumptions.linacEnergy_MeV,
      W_Gy_per_wk: assumptions.linacWorkload_Gy_per_wk,
      technique: assumptions.linacTechnique,
      P_mSv_per_wk: P,
      barrierType: 'twosource',
      d_sca_m: 1,
      d_sec_m: d,
      d_L_m: d,
      materialCode,
      T,
    });
    return buildCalculation(seed, 'NCRP151-secondary', result.t_required_cm * 10, result.H_unshielded_mSv, materialCode, [
      'Supuesto preliminar: barrera tratada como secundaria por dispersion/fuga.',
      'Requiere confirmar direccion de haz, uso U y geometria de paciente.',
    ]);
  }

  if (seed.calculationFamily === 'TG108') {
    const result = calculatePETCTBarrier(
      assumptions.petActivity_MBQ_per_injection,
      Math.max(1, profile.targetThroughputPerDay * assumptions.workDaysPerWeek),
      assumptions.petGammaConstant_uSv_m2_GBq_h,
      1,
      d,
      P,
      materialCode,
    );
    return buildCalculation(seed, 'TG108-PETCT', result.thickness_mm, result.K_unshielded_mSv, materialCode, [
      'Supuesto preliminar TG-108: una hora efectiva por paciente para punto de barrera.',
      'Requiere separar uptake, inyeccion, espera y escaneo en memoria final.',
    ]);
  }

  if (seed.calculationFamily === 'GammaKnife') {
    const result = calculateGammaKnifeBarrier(
      Math.max(1, profile.targetThroughputPerDay * assumptions.workDaysPerWeek),
      assumptions.gammaKnifeDose_Gy_per_fraction,
      d,
      P,
      materialCode,
    );
    return buildCalculation(seed, 'GammaKnife', result.thickness_mm, result.K_unshielded_mSv, materialCode, [
      'Supuesto preliminar: fracciones semanales estimadas desde pacientes/dia.',
      'Requiere separar condiciones beam-on/beam-off y puerta/laberinto.',
    ]);
  }

  if (seed.calculationFamily === 'HDR') {
    const result = calculateHDRBrachyBarrier(
      assumptions.hdrActivity_Ci,
      assumptions.hdrGammaConstant_R_m2_Ci_h,
      Math.max(1, profile.targetThroughputPerDay * 0.5),
      d,
      P,
      materialCode,
    );
    return buildCalculation(seed, 'HDR', result.thickness_mm, result.K_unshielded_mSv, materialCode, [
      'Supuesto preliminar HDR: tiempo semanal proporcional a pacientes/dia.',
      'Requiere dwell times, actividad actual y posicion extrema de fuente.',
    ]);
  }

  return buildCalculation(seed, 'TG108-PETCT', 0, 0, materialCode, [
    `Familia ${seed.calculationFamily} pendiente de mapeo especifico.`,
    `Modalidad seleccionada: ${option.modality}.`,
  ]);
}

function buildCalculation(
  seed: ShieldingSeedPoint,
  method: PreliminaryCalculationMethod,
  thickness_mm: number,
  unshielded_mSvWeek: number,
  materialCode: string,
  notes: string[],
): ControlledZoneBarrierCalculation {
  const requiredThickness_mm = round(Math.max(0, thickness_mm), 1);
  return {
    seedId: seed.id,
    barrier: seed.barrier,
    adjacentZone: seed.adjacentZone,
    calculationFamily: seed.calculationFamily,
    method,
    distance_m: round(seed.distance_m, 2),
    occupancyFactor: seed.occupancyFactor,
    designGoal_mSvWeek: seed.designGoal_mSvWeek,
    unshielded_mSvWeek: round(Math.max(0, unshielded_mSvWeek), 3),
    requiredThickness_mm,
    requiredThickness_cm: round(requiredThickness_mm / 10, 2),
    materialCode,
    status: notes.length > 1 || seed.adjacentZone === 'publica' ? 'review' : 'ready',
    notes,
  };
}

function buildAnalyticMemoryDraft(
  option: ControlledZoneFeasibilityOption,
  profile: ControlledZoneProfile,
  assumptions: ControlledZoneCalculationAssumptions,
  calculations: ControlledZoneBarrierCalculation[],
  missingInputs: string[],
): string {
  const rows = calculations
    .map((calc) => `| ${calc.barrier} | ${calc.adjacentZone} | ${calc.method} | ${calc.distance_m} | ${calc.designGoal_mSvWeek} | ${calc.unshielded_mSvWeek} | ${calc.requiredThickness_mm} |`)
    .join('\n');

  return [
    `# Memoria analitica preliminar - ${option.name}`,
    '',
    '## Alcance',
    `Se genero una preevaluacion de blindaje desde un layout de factibilidad con modalidad ${option.modality}.`,
    `Sitio: ${profile.siteWidth_m} x ${profile.siteLength_m} m. Zona controlada: ${profile.controlledZoneWidth_m} x ${profile.controlledZoneLength_m} m.`,
    '',
    '## Supuestos base',
    `Material preliminar: ${assumptions.materialCode}.`,
    `Pacientes por dia: ${profile.targetThroughputPerDay}. Presupuesto objetivo: ${profile.maxBudget_mxn} MXN.`,
    `Acceso publico: ${profile.publicAccessSide}. Acceso controlado: ${profile.controlledAccessSide}.`,
    '',
    '## Resultados preliminares',
    '| Barrera | Zona colindante | Metodo | Distancia m | P mSv/sem | K0 mSv/sem | Espesor mm |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: |',
    rows,
    '',
    '## Datos faltantes para memoria final',
    ...missingInputs.map((item) => `- ${item}`),
  ].join('\n');
}

function buildMissingInputs(option: ControlledZoneFeasibilityOption): string[] {
  const base = [
    'Plano arquitectonico definitivo con escala verificada.',
    'Colindancias reales por cada barrera y nivel superior/inferior.',
    'Factores de ocupacion validados por uso real de areas.',
    'Material constructivo final y densidad certificada.',
    'Carga de trabajo semanal aprobada por servicio clinico.',
    'Criterio CNSNS/regulatorio aplicable al tramite.',
  ];

  if (option.modality === 'LINAC') {
    return [...base, 'Distribucion de uso por angulo de gantry.', 'Fraccion IMRT/VMAT/SBRT y energia nominal autorizada.'];
  }
  if (option.modality === 'PET-CT') {
    return [...base, 'Actividad por administracion, tiempos uptake/escaneo y numero de uptake rooms.', 'Inventario de radionuclidos PET y rutas de residuos.'];
  }
  if (option.modality === 'Gamma Knife') {
    return [...base, 'Actividad total Co-60, modelo exacto y tasas beam-on/beam-off.', 'Geometria detallada del laberinto y puerta.'];
  }
  if (option.modality === 'HDR') {
    return [...base, 'Actividad actual de fuente, dwell times y posiciones extremas.', 'Escenario de emergencia fuente no retraida.'];
  }
  return base;
}

function estimateUnshieldedFromTransmission(P_mSvWeek: number, B: number): number {
  if (!Number.isFinite(B) || B <= 0) return 0;
  return P_mSvWeek / B;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
