// =============================================================================
// controlledZoneCalculationAdapter.ts - F55 packet to shielding/memoria preflight
// =============================================================================

// Fase 11, etapa 8: las cuatro familias usan las funciones del motor validado (ver zonaControladaMotor.ts),
// no las fórmulas propias de uaqProtocol.
import { espesorGammaKnifeZona, espesorHDRZona, espesorLinacZona, espesorPETZona } from './zonaControladaMotor';
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
  /** Ya no se usa en el cálculo (Γδ de Ir-192 del catálogo); se conserva por compatibilidad del JSON exportado. */
  hdrGammaConstant_R_m2_Ci_h: number;
  workDaysPerWeek: number;
  /**
   * Carga de trabajo HDR: días de tratamiento por semana. Horas/semana = (tratamientos/día × h por tratamiento) ×
   * días/semana, o tratamientos/semana × h por tratamiento si se da `hdrTreatmentsPerWeek`. Por omisión 5 días
   * (semana laboral completa: la cota alta de un servicio de HDR, que suele tratar 2–5 días). Los planes guardados
   * sin este campo se migran con este valor (`migrarPlanZonaControlada`).
   */
  hdrDaysPerWeek: number;
  /** Tiempo de irradiación por tratamiento HDR (h). Por omisión 0.5 h (conservador: 10 Ci suelen irradiar 5–15 min). */
  hdrHoursPerTreatment_h: number;
  /** Tratamientos HDR por semana; si se da, sustituye a pacientes/día × días/semana. */
  hdrTreatmentsPerWeek?: number;
  /** Fracción IMRT y factor C_I de la fuga (NCRP 151 Ec. 3.6). Por omisión: 0.5 y 5 con IMRT/VMAT/SBRT; 0 sin IMRT. */
  linacImrtFraction?: number;
  linacImrtFactor?: number;
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
  hdrDaysPerWeek: 5,
  hdrHoursPerTreatment_h: 0.5,
};

/** Valores por omisión de la carga HDR (también los de la migración de planes guardados sin el campo). */
export const HDR_DIAS_SEMANA_POR_OMISION = DEFAULT_ASSUMPTIONS.hdrDaysPerWeek;
export const HDR_HORAS_TRATAMIENTO_POR_OMISION = DEFAULT_ASSUMPTIONS.hdrHoursPerTreatment_h;

const positivo = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

/**
 * Horas de irradiación HDR por semana: tratamientos/semana × h por tratamiento, con tratamientos/semana =
 * `hdrTreatmentsPerWeek` o pacientes/día × días/semana. Antes eran pacientes/día × 0.5 h, sin días por semana (la carga
 * de un solo día). Mínimo 1 h/semana, como antes.
 */
export function horasSemanaHDR(
  profile: Pick<ControlledZoneProfile, 'targetThroughputPerDay'>,
  assumptions: Pick<ControlledZoneCalculationAssumptions, 'hdrDaysPerWeek' | 'hdrHoursPerTreatment_h' | 'hdrTreatmentsPerWeek'>,
): number {
  const h = positivo(assumptions.hdrHoursPerTreatment_h) ? assumptions.hdrHoursPerTreatment_h : HDR_HORAS_TRATAMIENTO_POR_OMISION;
  const dias = positivo(assumptions.hdrDaysPerWeek) ? Math.min(7, assumptions.hdrDaysPerWeek) : HDR_DIAS_SEMANA_POR_OMISION;
  const tratamientos = positivo(assumptions.hdrTreatmentsPerWeek)
    ? assumptions.hdrTreatmentsPerWeek
    : Math.max(0, profile.targetThroughputPerDay || 0) * dias;
  return Math.max(1, tratamientos * h);
}

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

  return migrarPlanZonaControlada(parsed);
}

export const NOTA_MIGRACION_HDR = 'Plan guardado sin «dias por semana» HDR: se tomo el valor por omision conservador y se recalculo la barrera.';

/**
 * Migración de planes guardados (JSON exportado o snapshot local) anteriores al campo «días por semana» de HDR: rellena
 * `hdrDaysPerWeek` y `hdrHoursPerTreatment_h` con los valores por omisión y recalcula las barreras HDR con la carga
 * semanal nueva (la guardada era la de un solo día). Planes que ya traen el campo se devuelven sin cambios.
 */
export function migrarPlanZonaControlada(plan: ControlledZoneShieldingPlan): ControlledZoneShieldingPlan {
  const a = (plan.assumptions ?? {}) as Partial<ControlledZoneCalculationAssumptions>;
  if (positivo(a.hdrDaysPerWeek) && positivo(a.hdrHoursPerTreatment_h)) return plan;
  const assumptions: ControlledZoneCalculationAssumptions = {
    ...DEFAULT_ASSUMPTIONS,
    ...a,
    hdrDaysPerWeek: positivo(a.hdrDaysPerWeek) ? a.hdrDaysPerWeek : HDR_DIAS_SEMANA_POR_OMISION,
    hdrHoursPerTreatment_h: positivo(a.hdrHoursPerTreatment_h) ? a.hdrHoursPerTreatment_h : HDR_HORAS_TRATAMIENTO_POR_OMISION,
  };
  const calculations = plan.calculations.map((calc) => {
    if (calc.calculationFamily !== 'HDR') return calc;
    const seed: ShieldingSeedPoint = {
      id: calc.seedId,
      barrier: calc.barrier,
      adjacentZone: calc.adjacentZone,
      distance_m: calc.distance_m,
      occupancyFactor: calc.occupancyFactor,
      designGoal_mSvWeek: calc.designGoal_mSvWeek,
      calculationFamily: 'HDR',
    };
    const nuevo = calculateSeed(seed, { name: plan.optionName, modality: plan.modality }, plan.profile, { ...assumptions, materialCode: calc.materialCode || assumptions.materialCode });
    return { ...nuevo, notes: [...nuevo.notes, NOTA_MIGRACION_HDR] };
  });
  const huboHDR = calculations.some((c) => c.calculationFamily === 'HDR');
  return {
    ...plan,
    assumptions,
    calculations,
    summary: huboHDR
      ? {
        ...plan.summary,
        maxThickness_mm: round(Math.max(...calculations.map((c) => c.requiredThickness_mm), 0), 1),
        maxUnshielded_mSvWeek: round(Math.max(...calculations.map((c) => c.unshielded_mSvWeek), 0), 3),
        reviewCount: calculations.filter((c) => c.status === 'review').length,
      }
      : plan.summary,
    analyticMemoryDraft: huboHDR
      ? buildAnalyticMemoryDraft({ name: plan.optionName, modality: plan.modality }, plan.profile, assumptions, calculations, plan.missingInputs)
      : plan.analyticMemoryDraft,
  };
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
  option: Pick<ControlledZoneFeasibilityOption, 'name' | 'modality'>,
  profile: ControlledZoneProfile,
  assumptions: ControlledZoneCalculationAssumptions,
): ControlledZoneBarrierCalculation {
  const P = seed.designGoal_mSvWeek;
  const d = Math.max(seed.distance_m, 0.5);
  const T = Math.max(seed.occupancyFactor, 0.01);
  const materialCode = assumptions.materialCode;

  if (seed.calculationFamily === 'NCRP151') {
    // Plano de giro del gantry Norte–Sur: el haz primario incide en Norte, Sur y Techo (NCRP 151 §1.4, Fig. 1.1); el techo
    // de un búnker isocéntrico es barrera primaria. Antes el techo se trataba como secundaria (≈ 1 m menos de concreto).
    const isPrimary = seed.barrier === 'Norte' || seed.barrier === 'Sur' || seed.barrier === 'Techo';
    const conImrt = /IMRT|VMAT|SBRT/i.test(assumptions.linacTechnique);
    const result = espesorLinacZona({
      tipo: isPrimary ? 'primaria' : 'secundaria',
      haces: [{ energia_MV: assumptions.linacEnergy_MeV, W_Gy_semana: assumptions.linacWorkload_Gy_per_wk }],
      fraccionIMRT: assumptions.linacImrtFraction ?? (conImrt ? 0.5 : 0),
      factorIMRT: assumptions.linacImrtFactor ?? 5,
      P_mSv_semana: P,
      T,
      U: 0.25,
      d_m: d,
      materialCodigo: materialCode,
    });
    return buildCalculation(seed, isPrimary ? 'NCRP151-primary' : 'NCRP151-secondary', result.espesor_mm, result.K_sin_blindaje_mSv_semana, materialCode, isPrimary
      ? [
        'Supuesto preliminar: barrera Norte/Sur/Techo tratada como primaria (U = 0.25).',
        `Carga LINAC usada: ${assumptions.linacWorkload_Gy_per_wk} Gy/semana, ${assumptions.linacTechnique}. ${result.referencia}.`,
      ]
      : [
        'Supuesto preliminar: barrera secundaria por fuga y dispersion del paciente a 30 grados (U = 0.25).',
        `Requiere confirmar direccion de haz, uso U y geometria de paciente. ${result.referencia}.`,
      ]);
  }

  if (seed.calculationFamily === 'TG108') {
    const result = espesorPETZona({
      nuclido: 'F18',
      A0_MBq: assumptions.petActivity_MBQ_per_injection,
      pacientesSemana: Math.max(1, profile.targetThroughputPerDay * assumptions.workDaysPerWeek),
      tU_h: 1,
      d_m: d,
      P_mSv_semana: P,
      T,
      materialCodigo: materialCode,
    });
    return buildCalculation(seed, 'TG108-PETCT', result.espesor_mm, result.K_sin_blindaje_mSv_semana, materialCode, [
      'Supuesto preliminar TG-108: sala de captacion, F-18, una hora de captacion por paciente.',
      `Requiere separar uptake, inyeccion, espera y escaneo en memoria final. ${result.referencia}.`,
    ]);
  }

  if (seed.calculationFamily === 'GammaKnife') {
    const result = espesorGammaKnifeZona({
      fraccionesSemana: Math.max(1, profile.targetThroughputPerDay * assumptions.workDaysPerWeek),
      dosisFraccion_Gy: assumptions.gammaKnifeDose_Gy_per_fraction,
      d_m: d,
      P_mSv_semana: P,
      T,
      materialCodigo: materialCode,
    });
    return buildCalculation(seed, 'GammaKnife', result.espesor_mm, result.K_sin_blindaje_mSv_semana, materialCode, [
      'Supuesto preliminar: fracciones semanales estimadas desde pacientes/dia; sin autoblindaje del equipo.',
      `Requiere separar condiciones beam-on/beam-off y puerta/laberinto. ${result.referencia}.`,
    ]);
  }

  if (seed.calculationFamily === 'HDR') {
    const horasSemana = horasSemanaHDR(profile, assumptions);
    const result = espesorHDRZona({
      actividad_Ci: assumptions.hdrActivity_Ci,
      horasSemana,
      d_m: d,
      P_mSv_semana: P,
      T,
      materialCodigo: materialCode,
    });
    const carga = positivo(assumptions.hdrTreatmentsPerWeek)
      ? `${assumptions.hdrTreatmentsPerWeek} tratamientos/semana`
      : `${profile.targetThroughputPerDay} tratamientos/dia x ${assumptions.hdrDaysPerWeek} dias/semana`;
    return buildCalculation(seed, 'HDR', result.espesor_mm, result.K_sin_blindaje_mSv_semana, materialCode, [
      `Supuesto preliminar HDR: ${carga} x ${assumptions.hdrHoursPerTreatment_h} h = ${round(horasSemana, 2)} h/semana de irradiacion.`,
      `Requiere dwell times, actividad actual y posicion extrema de fuente. ${result.referencia}.`,
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
  option: Pick<ControlledZoneFeasibilityOption, 'name' | 'modality'>,
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
    ...(option.modality === 'HDR'
      ? [`Carga HDR: ${round(horasSemanaHDR(profile, assumptions), 2)} h/semana de irradiacion (${assumptions.hdrTreatmentsPerWeek ? `${assumptions.hdrTreatmentsPerWeek} tratamientos/semana` : `${assumptions.hdrDaysPerWeek} dias/semana`}, ${assumptions.hdrHoursPerTreatment_h} h por tratamiento).`]
      : []),
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

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
