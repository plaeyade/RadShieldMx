// =============================================================================
// controlledZoneFeasibility.ts - TestFit-inspired feasibility for medical layouts
// =============================================================================

import { CONTROLLED_ZONE_CONTRACTS } from './controlledZoneContracts';
import { P_CONTROLADA_mSv_semana, P_NO_CONTROLADA_mSv_semana } from './limitesDosis';
import { NOM_040_NUCL } from './normativaMx';

export type MedicalLayoutModality = 'LINAC' | 'PET-CT' | 'Gamma Knife' | 'HDR' | 'Radiofarmacia';

export interface ControlledZoneProfile {
  siteWidth_m: number;
  siteLength_m: number;
  controlledZoneWidth_m: number;
  controlledZoneLength_m: number;
  publicAccessSide: 'north' | 'south' | 'east' | 'west';
  controlledAccessSide: 'north' | 'south' | 'east' | 'west';
  maxBudget_mxn: number;
  preferMaze: boolean;
  targetThroughputPerDay: number;
}

export interface ControlledZoneRoom {
  id: string;
  name: string;
  zone: 'controlada' | 'supervisada' | 'publica';
  x_m: number;
  y_m: number;
  width_m: number;
  length_m: number;
  shieldingPriority: 'primary' | 'secondary' | 'low';
  /** Objetivo de diseño P del recinto (limitesDosis.ts): 0.1 mSv/semana si es zona controlada; 0.02 si no. */
  designGoal_mSvWeek: number;
  /** Numeral de la NOM-040-NUCL-2016 que exige el recinto (sólo plantillas de medicina nuclear). */
  numeralNorma?: string;
}

/** Objetivo de diseño de un recinto según su zona (NCRP 147 §1.3 / NCRP 151 §1.2; limitesDosis.ts). */
export function objetivoDisenoRecinto(zone: ControlledZoneRoom['zone']): number {
  return zone === 'controlada' ? P_CONTROLADA_mSv_semana : P_NO_CONTROLADA_mSv_semana;
}

export interface ShieldingSeedPoint {
  id: string;
  barrier: string;
  adjacentZone: 'controlada' | 'supervisada' | 'publica';
  distance_m: number;
  occupancyFactor: number;
  designGoal_mSvWeek: number;
  calculationFamily: 'NCRP147' | 'NCRP151' | 'TG108' | 'HDR' | 'GammaKnife';
}

export interface ControlledZoneFeasibilityOption {
  id: string;
  name: string;
  modality: MedicalLayoutModality;
  footprint_m2: number;
  controlledZone_m2: number;
  estimatedCost_mxn: number;
  fitScore: number;
  shieldingReadinessScore: number;
  workflowScore: number;
  totalScore: number;
  rooms: ControlledZoneRoom[];
  shieldingSeeds: ShieldingSeedPoint[];
  warnings: string[];
  nextActions: string[];
  exportTargets: Array<'JSON' | 'DXF' | 'PDF' | 'Memoria analitica' | 'Revit/IFC handoff'>;
}

interface Template {
  id: string;
  name: string;
  modality: MedicalLayoutModality;
  width_m: number;
  length_m: number;
  minControlled_m2: number;
  baseCost_mxn: number;
  requiresMaze: boolean;
  calculationFamily: ShieldingSeedPoint['calculationFamily'];
  rooms: Omit<ControlledZoneRoom, 'x_m' | 'y_m' | 'designGoal_mSvWeek'>[];
  /** Acciones adicionales propias de la plantilla (p. ej. requisitos condicionales de la NOM-040). */
  extraActions?: string[];
}

const recintoNom040 = (id: (typeof NOM_040_NUCL.recintos)[number]['id']) => {
  const r = NOM_040_NUCL.recintos.find((x) => x.id === id);
  if (!r) throw new Error(`Recinto NOM-040 desconocido: ${id}`);
  return r;
};

export const TESTFIT_ADAPTED_CAPABILITIES = [
  'Generar alternativas desde limites de sitio y restricciones',
  'Comparar opciones por area, costo, flujo y riesgo tecnico',
  'Separar zona controlada, supervisada y publica desde el layout',
  'Preparar puntos semilla para calculo de barreras',
  'Exportar una opcion aprobada hacia memoria analitica, PDF y handoff BIM/CAD',
] as const;

const TEMPLATES: Template[] = [
  {
    id: 'linac-15mv-controlled-zone',
    name: 'LINAC 15 MV con laberinto compacto',
    modality: 'LINAC',
    width_m: 13.5,
    length_m: 18,
    minControlled_m2: 120,
    baseCost_mxn: 28500000,
    requiresMaze: true,
    calculationFamily: 'NCRP151',
    rooms: [
      { id: 'vault', name: 'Sala tratamiento', zone: 'controlada', width_m: 7.5, length_m: 8, shieldingPriority: 'primary' },
      { id: 'maze', name: 'Laberinto', zone: 'controlada', width_m: 2.2, length_m: 7.5, shieldingPriority: 'secondary' },
      { id: 'control', name: 'Consola', zone: 'supervisada', width_m: 4.5, length_m: 3.2, shieldingPriority: 'low' },
      { id: 'equipment', name: 'Cuarto equipo', zone: 'supervisada', width_m: 3.5, length_m: 3.5, shieldingPriority: 'secondary' },
    ],
  },
  {
    id: 'pet-ct-radiofarmacia',
    name: 'PET-CT con uptake y radiofarmacia',
    modality: 'PET-CT',
    width_m: 16,
    length_m: 20,
    minControlled_m2: 150,
    baseCost_mxn: 22000000,
    requiresMaze: false,
    calculationFamily: 'TG108',
    rooms: [
      { id: 'scanner', name: 'Sala PET-CT', zone: 'controlada', width_m: 5.5, length_m: 6, shieldingPriority: 'secondary' },
      { id: 'uptake-a', name: 'Uptake 1', zone: 'controlada', width_m: 3, length_m: 3.5, shieldingPriority: 'secondary' },
      { id: 'uptake-b', name: 'Uptake 2', zone: 'controlada', width_m: 3, length_m: 3.5, shieldingPriority: 'secondary' },
      { id: 'hotlab', name: 'HOT lab', zone: 'controlada', width_m: 4.5, length_m: 4, shieldingPriority: 'primary', numeralNorma: 'NOM-040-NUCL-2016 §5.1.1' },
      // NOM-040-NUCL-2016 §5.1.7.3: el área de control es parte de la sala de estudios, dentro de la zona controlada.
      { id: 'control', name: 'Consola', zone: 'controlada', width_m: 4, length_m: 3, shieldingPriority: 'low', numeralNorma: 'NOM-040-NUCL-2016 §5.1.7.3' },
      { id: 'waste', name: recintoNom040('almacen-desechos').nombre, zone: 'controlada', width_m: 2.5, length_m: 2, shieldingPriority: 'secondary', numeralNorma: `NOM-040-NUCL-2016 ${recintoNom040('almacen-desechos').numeral}` },
      { id: 'decon', name: recintoNom040('descontaminacion').nombre, zone: 'controlada', width_m: 2, length_m: 2, shieldingPriority: 'low', numeralNorma: `NOM-040-NUCL-2016 ${recintoNom040('descontaminacion').numeral}` },
      { id: 'wc-inyectados', name: recintoNom040('sanitario-inyectados').nombre, zone: 'controlada', width_m: 2, length_m: 2.5, shieldingPriority: 'low', numeralNorma: `NOM-040-NUCL-2016 ${recintoNom040('sanitario-inyectados').numeral}` },
    ],
    extraActions: [
      `Si habrá pacientes que no cumplan el egreso (p. ej. I-131): ${recintoNom040('hospitalizacion-i131').nombre} (NOM-040-NUCL-2016 ${recintoNom040('hospitalizacion-i131').numeral}).`,
      `${recintoNom040('detector-alarma').nombre} (NOM-040-NUCL-2016 ${recintoNom040('detector-alarma').numeral}).`,
    ],
  },
  {
    id: 'gamma-knife-controlled-zone',
    name: 'Gamma Knife con puerta protegida',
    modality: 'Gamma Knife',
    width_m: 12,
    length_m: 16,
    minControlled_m2: 95,
    baseCost_mxn: 24500000,
    requiresMaze: true,
    calculationFamily: 'GammaKnife',
    rooms: [
      { id: 'vault', name: 'Sala Gamma Knife', zone: 'controlada', width_m: 7, length_m: 7, shieldingPriority: 'primary' },
      { id: 'maze', name: 'Acceso protegido', zone: 'controlada', width_m: 2, length_m: 5, shieldingPriority: 'secondary' },
      { id: 'control', name: 'Consola', zone: 'supervisada', width_m: 4, length_m: 3.2, shieldingPriority: 'low' },
      { id: 'prep', name: 'Preparacion paciente', zone: 'supervisada', width_m: 4, length_m: 3.5, shieldingPriority: 'low' },
    ],
  },
  {
    id: 'hdr-suite-controlled-zone',
    name: 'Braquiterapia HDR con sala de preparacion',
    modality: 'HDR',
    width_m: 10,
    length_m: 13,
    minControlled_m2: 65,
    baseCost_mxn: 9800000,
    requiresMaze: true,
    calculationFamily: 'HDR',
    rooms: [
      { id: 'treatment', name: 'Sala HDR', zone: 'controlada', width_m: 5, length_m: 4.5, shieldingPriority: 'primary' },
      { id: 'maze', name: 'Acceso controlado', zone: 'controlada', width_m: 1.5, length_m: 4, shieldingPriority: 'secondary' },
      { id: 'control', name: 'Consola', zone: 'supervisada', width_m: 3.5, length_m: 3, shieldingPriority: 'low' },
      { id: 'prep', name: 'Preparacion', zone: 'supervisada', width_m: 3.5, length_m: 3.5, shieldingPriority: 'low' },
    ],
  },
];

const DEFAULT_EXPORT_TARGETS: ControlledZoneFeasibilityOption['exportTargets'] = [
  'JSON',
  'DXF',
  'PDF',
  'Memoria analitica',
  'Revit/IFC handoff',
];

export function buildDefaultControlledZoneProfile(overrides: Partial<ControlledZoneProfile> = {}): ControlledZoneProfile {
  return {
    siteWidth_m: 22,
    siteLength_m: 28,
    controlledZoneWidth_m: 14,
    controlledZoneLength_m: 18,
    publicAccessSide: 'south',
    controlledAccessSide: 'north',
    maxBudget_mxn: 30000000,
    preferMaze: true,
    targetThroughputPerDay: 24,
    ...overrides,
  };
}

export function generateControlledZoneFeasibility(profile: ControlledZoneProfile): ControlledZoneFeasibilityOption[] {
  return TEMPLATES.map((template) => {
    const footprint_m2 = template.width_m * template.length_m;
    const controlledZone_m2 = Math.max(template.minControlled_m2, footprint_m2 * 0.62);
    const rooms = placeRooms(template, profile);
    const warnings = buildWarnings(template, profile, footprint_m2, controlledZone_m2);
    const shieldingSeeds = buildShieldingSeeds(template, profile);
    const fitScore = scoreFit(template, profile);
    const shieldingReadinessScore = scoreShielding(template, profile, warnings);
    const workflowScore = scoreWorkflow(template, profile);
    const totalScore = Math.round(fitScore * 0.36 + shieldingReadinessScore * 0.4 + workflowScore * 0.24);

    return {
      id: template.id,
      name: template.name,
      modality: template.modality,
      footprint_m2,
      controlledZone_m2,
      estimatedCost_mxn: estimateCost(template, profile),
      fitScore,
      shieldingReadinessScore,
      workflowScore,
      totalScore,
      rooms,
      shieldingSeeds,
      warnings,
      nextActions: [
        'Confirmar colindancias reales y ocupacion por barrera',
        'Enviar puntos semilla al calculador NCRP/TG correspondiente',
        'Generar memoria analitica preliminar con supuestos trazables',
        ...(template.extraActions ?? []),
      ],
      exportTargets: DEFAULT_EXPORT_TARGETS,
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
}

export function summarizeControlledZoneFeasibility(options: ControlledZoneFeasibilityOption[]) {
  const best = options[0];
  return {
    optionCount: options.length,
    bestOptionId: best?.id ?? null,
    bestScore: best?.totalScore ?? 0,
    averageScore: options.length
      ? Math.round(options.reduce((sum, option) => sum + option.totalScore, 0) / options.length)
      : 0,
    shieldingSeedCount: options.reduce((sum, option) => sum + option.shieldingSeeds.length, 0),
    warningCount: options.reduce((sum, option) => sum + option.warnings.length, 0),
  };
}

export function buildControlledZoneCalculationPacket(
  option: ControlledZoneFeasibilityOption,
  profile: ControlledZoneProfile,
) {
  return {
    schemaVersion: CONTROLLED_ZONE_CONTRACTS.feasibilityPacket,
    generatedAt: new Date().toISOString(),
    profile,
    selectedOption: option,
    calculationReadiness: {
      canStartShieldingCalculations: option.shieldingSeeds.length >= 4 && option.warnings.length < 3,
      requiredInputs: [
        'Carga de trabajo semanal',
        'Uso por direccion/barrera',
        'Ocupacion real de colindancias',
        'Material constructivo seleccionado',
        'Restricciones regulatorias CNSNS/NCRP aplicables',
      ],
    },
  };
}

function placeRooms(template: Template, profile: ControlledZoneProfile): ControlledZoneRoom[] {
  const offsetX = Math.max(0.5, (profile.controlledZoneWidth_m - template.width_m) / 2);
  const offsetY = Math.max(0.5, (profile.controlledZoneLength_m - template.length_m) / 2);
  // Hasta 6 recintos en 2 columnas (como antes); con más (PET-CT con los recintos de la NOM-040) en 3 columnas.
  const cols = template.rooms.length > 6 ? 3 : 2;
  const colStep = cols === 2 ? 0.48 : 0.32;
  return template.rooms.map((room, index) => ({
    ...room,
    designGoal_mSvWeek: objetivoDisenoRecinto(room.zone),
    x_m: Number((offsetX + (index % cols) * (template.width_m * colStep)).toFixed(1)),
    y_m: Number((offsetY + Math.floor(index / cols) * (template.length_m * 0.38)).toFixed(1)),
  }));
}

function buildShieldingSeeds(template: Template, profile: ControlledZoneProfile): ShieldingSeedPoint[] {
  const publicGoal = P_NO_CONTROLADA_mSv_semana;
  const controlledGoal = P_CONTROLADA_mSv_semana;
  return [
    {
      id: `${template.id}-north`,
      barrier: 'Norte',
      adjacentZone: profile.controlledAccessSide === 'north' ? 'controlada' : 'publica',
      distance_m: Math.max(2, template.length_m / 2),
      occupancyFactor: profile.controlledAccessSide === 'north' ? 0.5 : 1,
      designGoal_mSvWeek: profile.controlledAccessSide === 'north' ? controlledGoal : publicGoal,
      calculationFamily: template.calculationFamily,
    },
    {
      id: `${template.id}-south`,
      barrier: 'Sur',
      adjacentZone: profile.publicAccessSide === 'south' ? 'publica' : 'supervisada',
      distance_m: Math.max(2, template.length_m / 2.4),
      occupancyFactor: profile.publicAccessSide === 'south' ? 1 : 0.25,
      designGoal_mSvWeek: profile.publicAccessSide === 'south' ? publicGoal : controlledGoal,
      calculationFamily: template.calculationFamily,
    },
    {
      id: `${template.id}-east`,
      barrier: 'Este',
      adjacentZone: profile.publicAccessSide === 'east' ? 'publica' : 'supervisada',
      distance_m: Math.max(2, template.width_m / 2),
      occupancyFactor: profile.publicAccessSide === 'east' ? 1 : 0.25,
      designGoal_mSvWeek: profile.publicAccessSide === 'east' ? publicGoal : controlledGoal,
      calculationFamily: template.calculationFamily,
    },
    {
      id: `${template.id}-west`,
      barrier: 'Oeste',
      adjacentZone: profile.publicAccessSide === 'west' ? 'publica' : 'supervisada',
      distance_m: Math.max(2, template.width_m / 2),
      occupancyFactor: profile.publicAccessSide === 'west' ? 1 : 0.25,
      designGoal_mSvWeek: profile.publicAccessSide === 'west' ? publicGoal : controlledGoal,
      calculationFamily: template.calculationFamily,
    },
    {
      id: `${template.id}-ceiling`,
      barrier: 'Techo',
      adjacentZone: 'publica',
      distance_m: 3,
      occupancyFactor: 1,
      designGoal_mSvWeek: publicGoal,
      calculationFamily: template.calculationFamily,
    },
  ];
}

function buildWarnings(
  template: Template,
  profile: ControlledZoneProfile,
  footprint_m2: number,
  controlledZone_m2: number,
): string[] {
  const warnings: string[] = [];
  const siteArea = profile.siteWidth_m * profile.siteLength_m;
  const controlledArea = profile.controlledZoneWidth_m * profile.controlledZoneLength_m;
  if (template.width_m > profile.siteWidth_m || template.length_m > profile.siteLength_m) {
    warnings.push('La huella propuesta rebasa el sitio disponible.');
  }
  if (controlledZone_m2 > controlledArea) {
    warnings.push('La zona controlada declarada es menor que la demanda del layout.');
  }
  if (footprint_m2 > siteArea * 0.65) {
    warnings.push('Ocupacion del sitio alta; revisar circulaciones, evacuacion y mantenimiento.');
  }
  if (template.requiresMaze && !profile.preferMaze) {
    warnings.push('La modalidad requiere acceso protegido aunque el perfil no prioriza laberinto.');
  }
  if (estimateCost(template, profile) > profile.maxBudget_mxn) {
    warnings.push('Costo estimado por encima del presupuesto objetivo.');
  }
  return warnings;
}

function scoreFit(template: Template, profile: ControlledZoneProfile): number {
  const widthFit = clampScore((profile.siteWidth_m / template.width_m) * 78);
  const lengthFit = clampScore((profile.siteLength_m / template.length_m) * 78);
  const controlledAreaFit = clampScore(((profile.controlledZoneWidth_m * profile.controlledZoneLength_m) / template.minControlled_m2) * 70);
  return Math.round((widthFit + lengthFit + controlledAreaFit) / 3);
}

function scoreShielding(template: Template, profile: ControlledZoneProfile, warnings: string[]): number {
  let score = 86;
  if (template.requiresMaze && profile.preferMaze) score += 8;
  if (!template.requiresMaze && profile.preferMaze) score -= 2;
  score -= warnings.length * 9;
  return clampScore(score);
}

function scoreWorkflow(template: Template, profile: ControlledZoneProfile): number {
  const throughputTarget = template.modality === 'PET-CT' ? 22 : template.modality === 'LINAC' ? 30 : 16;
  const throughputScore = clampScore(100 - Math.abs(profile.targetThroughputPerDay - throughputTarget) * 2);
  const accessScore = profile.publicAccessSide === profile.controlledAccessSide ? 64 : 88;
  return Math.round((throughputScore + accessScore) / 2);
}

function estimateCost(template: Template, profile: ControlledZoneProfile): number {
  const areaFactor = (template.width_m * template.length_m) / 180;
  const mazeFactor = template.requiresMaze && profile.preferMaze ? 1.04 : 1;
  return Math.round(template.baseCost_mxn * (0.88 + areaFactor * 0.12) * mazeFactor);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
