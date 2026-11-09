// =============================================================================
// bimRAD.ts — BIM-based Radiation Modeling Method (BIMRAD)
// Based on: "Development of a BIM-based radiation modeling method and its
// applicability for nuclear facility decommissioning support"
// Nuclear Engineering and Technology, 2025. DOI: 10.1016/j.net.2025.103801
// =============================================================================

type Vec3 = [number, number, number];

import { transmisionPET } from './calculadorasNormativas';
export interface BIMElement {
  id: string;
  ifcType: string; // IfcWall, IfcSpace, IfcDoor, IfcWindow, etc.
  name: string;
  globalId: string;
  geometry: {
    vertices: Vec3[];
    indices: number[];
  };
  properties: Record<string, string | number>;
  material?: {
    name: string;
    density_kg_m3: number;
    composition: string;
    thickness_m: number;
  };
  // For shielding-specific
  isShieldingBarrier: boolean;
  shieldingValue_mm?: number;
  shieldingMaterial?: string;
}

export interface BIMSpace {
  id: string;
  name: string;
  globalId: string;
  longName: string;
  area_m2: number;
  volume_m3: number;
  height_m: number;
  boundaries: string[]; // GlobalIds of bounding elements
  vertices: Vec3[];
  level: string;
  roomType: string; // treatment, control, waiting, storage, etc.
}

export interface BIMModel {
  projectName: string;
  globalId: string;
  spaces: BIMSpace[];
  elements: BIMElement[];
  levels: string[];
  unit: string;
  generatedAt: string;
}

// ── IFC entity types relevant for radiation shielding ──
export const IFC_SHIELDING_ENTITIES = [
  { type: 'IfcWall', relevance: 'Barrier wall — primary shielding element' },
  { type: 'IfcWallStandardCase', relevance: 'Standard wall with material layers' },
  { type: 'IfcSlab', relevance: 'Floor/ceiling — roof/floor shielding' },
  { type: 'IfcRoof', relevance: 'Roof element — skyshine calculation' },
  { type: 'IfcDoor', relevance: 'Door — potential radiation leakage path' },
  { type: 'IfcWindow', relevance: 'Window — potential radiation leakage path' },
  { type: 'IfcSpace', relevance: 'Room/zone — occupancy and dose calculation' },
  { type: 'IfcColumn', relevance: 'Structural column' },
  { type: 'IfcBeam', relevance: 'Structural beam' },
  { type: 'IfcCovering', relevance: 'Wall covering — additional shielding layer' },
];

// ── Inverse Source Strength Calculation (BIMRAD method) ──
export interface SourceStrengthResult {
  sourceId: string;
  position: Vec3;
  estimatedActivity_GBq: number;
  estimatedDoseRate_uSv_h: number;
  measuredDoseRate_uSv_h: number;
  discrepancy_percent: number;
  convergenceIterations: number;
  uncertainty_percent: number;
}

/** Point kernel function for dose rate calculation */
function pointKernelDose(
  sourcePos: Vec3,
  detectorPos: Vec3,
  activity_GBq: number,
  gammaConstant: number,
  barriers: { position: Vec3; thickness_m: number; tvl_m: number }[],
): number {
  const dx = detectorPos[0] - sourcePos[0];
  const dy = detectorPos[1] - sourcePos[1];
  const dz = detectorPos[2] - sourcePos[2];
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (distance < 0.01) return Infinity;

  let B = 1.0; // Buildup factor
  for (const barrier of barriers) {
    // Check if ray intersects barrier (simplified)
    const bdx = barrier.position[0] - sourcePos[0];
    const bdy = barrier.position[1] - sourcePos[1];
    const bdz = barrier.position[2] - sourcePos[2];
    const bDist = Math.sqrt(bdx * bdx + bdy * bdy + bdz * bdz);
    if (bDist < distance) {
      const n = barrier.thickness_m / barrier.tvl_m;
      B *= Math.pow(10, -n);
    }
  }

  return (gammaConstant * activity_GBq * B) / (distance * distance);
}

/** Inverse calculation: estimate source strength from measured dose rates */
export function inverseSourceStrength(
  measurements: { position: Vec3; doseRate_uSv_h: number }[],
  sourcePosition: Vec3,
  gammaConstant: number = 0.143, // F-18 default
  barriers: { position: Vec3; thickness_m: number; tvl_m: number }[] = [],
): SourceStrengthResult {
  // Iterative least-squares estimation
  let activity = 1.0; // Initial guess
  const maxIterations = 50;
  const tolerance = 0.001;

  for (let iter = 0; iter < maxIterations; iter++) {
    let sumResidual = 0;
    let sumJacobian = 0;

    for (const m of measurements) {
      const calcDose = pointKernelDose(sourcePosition, m.position, activity, gammaConstant, barriers);
      const residual = m.doseRate_uSv_h - calcDose;
      const jacobian = calcDose / activity; // ∂dose/∂activity
      sumResidual += residual * jacobian;
      sumJacobian += jacobian * jacobian;
    }

    if (sumJacobian === 0) break;
    const delta = sumResidual / sumJacobian;
    activity += delta;

    if (Math.abs(delta) < tolerance) break;
    if (activity < 0) activity = 0.001;
  }

  // Calculate estimated dose rates at measurement points
  const estimatedDoses = measurements.map(m =>
    pointKernelDose(sourcePosition, m.position, activity, gammaConstant, barriers)
  );

  const avgMeasured = measurements.reduce((s, m) => s + m.doseRate_uSv_h, 0) / measurements.length;
  const avgEstimated = estimatedDoses.reduce((s, d) => s + d, 0) / estimatedDoses.length;
  const discrepancy = avgMeasured > 0 ? Math.abs(avgEstimated - avgMeasured) / avgMeasured * 100 : 0;

  // Uncertainty from measurement scatter
  const variance = measurements.reduce((s, m, i) => s + (m.doseRate_uSv_h - estimatedDoses[i]) ** 2, 0) / measurements.length;
  const uncertainty = avgEstimated > 0 ? Math.sqrt(variance) / avgEstimated * 100 : 0;

  return {
    sourceId: `INV_${Date.now()}`,
    position: sourcePosition,
    estimatedActivity_GBq: activity,
    estimatedDoseRate_uSv_h: avgEstimated,
    measuredDoseRate_uSv_h: avgMeasured,
    discrepancy_percent: discrepancy,
    convergenceIterations: maxIterations,
    uncertainty_percent: uncertainty,
  };
}

// ── BIM Element Extractor ──
export function extractBIMFromIFC(ifcContent: string): BIMModel {
  // Simplified IFC parser — in production would use IfcOpenShell/wasm
  const model: BIMModel = {
    projectName: 'Imported IFC',
    globalId: '',
    spaces: [],
    elements: [],
    levels: [],
    unit: 'm',
    generatedAt: new Date().toISOString(),
  };

  // Extract project name
  const projectMatch = ifcContent.match(/IFCPROJECT\s*\([^,]*,\s*[^,]*,\s*'([^']*)'/);
  if (projectMatch) model.projectName = projectMatch[1];

  // Extract spaces (IfcSpace)
  const spaceRegex = /IFCSPACE\s*\('([^']*)'[^)]*'([^']*)'[^)]*'([^']*)'[^)]*'([^']*)'/g;
  let match;
  while ((match = spaceRegex.exec(ifcContent)) !== null) {
    model.spaces.push({
      id: `SP_${model.spaces.length + 1}`,
      name: match[2] || `Space_${model.spaces.length + 1}`,
      globalId: match[1],
      longName: match[3] || '',
      area_m2: 0,
      volume_m3: 0,
      height_m: 3.0,
      boundaries: [],
      vertices: [],
      level: '',
      roomType: 'unknown',
    });
  }

  // Extract walls (IfcWall)
  const wallRegex = /IFCWALL(?:STANDARDCASE)?\s*\('([^']*)'[^)]*'([^']*)'[^)]*'([^']*)'/g;
  while ((match = wallRegex.exec(ifcContent)) !== null) {
    model.elements.push({
      id: `WL_${model.elements.length + 1}`,
      ifcType: 'IfcWall',
      name: match[2] || `Wall_${model.elements.length + 1}`,
      globalId: match[1],
      geometry: { vertices: [], indices: [] },
      properties: {},
      material: { name: 'Concrete', density_kg_m3: 2350, composition: 'SiO2+CaO+Al2O3', thickness_m: 0.2 },
      isShieldingBarrier: true,
      shieldingValue_mm: 200,
      shieldingMaterial: 'concrete',
    });
  }

  // Extract levels
  const levelRegex = /IFCBUILDINGSTOREY\s*\('([^']*)'[^)]*'([^']*)'/g;
  while ((match = levelRegex.exec(ifcContent)) !== null) {
    model.levels.push(match[2] || match[1]);
  }

  return model;
}

// ── Dose Rate Distribution from BIM Model ──
export interface DoseRateDistribution {
  position: Vec3;
  doseRate_uSv_h: number;
  zone: string;
  source: string;
}

/**
 * Fase 8c: la fuente de este cálculo es un emisor β+ (Γ por omisión de F-18), así que plomo y concreto atenúan con la
 * transmisión de banda ancha a 511 keV de AAPM TG-108 Tabla V (antes: TVL fijos de 5 mm de plomo y 370 mm de concreto,
 * los de 6 MV para el concreto y un valor sin fuente para el plomo). Se expresa como el TVL equivalente que da la misma
 * transmisión para el espesor de la barrera. Otros materiales: 0.1 m sin fuente (se avisa en el diálogo).
 */
export function tvlEquivalente511(material: string | undefined, t_m: number): number {
  if ((material === 'lead' || material === 'concrete') && t_m > 0) {
    const B = transmisionPET(material, t_m * 1000);
    return B < 1 ? t_m / -Math.log10(B) : Infinity;
  }
  return 0.1;
}

export function computeBIMDoseDistribution(
  model: BIMModel,
  sourcePosition: Vec3,
  activity_GBq: number,
  gammaConstant: number = 0.143,
  gridResolution_m: number = 0.5,
): DoseRateDistribution[] {
  const results: DoseRateDistribution[] = [];

  // Build barrier list from wall elements
  const barriers: { position: Vec3; thickness_m: number; tvl_m: number }[] = model.elements
    .filter(e => e.isShieldingBarrier && e.material)
    .map(e => ({
      position: e.geometry.vertices.length > 0 ? e.geometry.vertices[0] : [0, 0, 0],
      thickness_m: e.material!.thickness_m,
      tvl_m: tvlEquivalente511(e.shieldingMaterial, e.material!.thickness_m),
    }));

  // Compute for each space
  for (const space of model.spaces) {
    if (space.vertices.length === 0) {
      // Generate grid points for the space
      const nx = Math.max(2, Math.ceil(Math.sqrt(space.area_m2) / gridResolution_m));
      const ny = Math.max(2, Math.ceil(Math.sqrt(space.area_m2) / gridResolution_m));
      const step = Math.sqrt(space.area_m2) / nx;
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
          const pos: Vec3 = [i * step, 1.5, j * step];
          const dose = pointKernelDose(sourcePosition, pos, activity_GBq, gammaConstant, barriers);
          let zone = 'free';
          if (dose > 1000) zone = 'excluded';
          else if (dose > 7.5) zone = 'controlled';
          else if (dose > 2.5) zone = 'supervised';

          results.push({ position: pos, doseRate_uSv_h: dose, zone, source: space.name });
        }
      }
    }
  }

  return results;
}

// ── ALARA Decommissioning Analysis ──
export interface ALARAStep {
  stepNumber: number;
  description: string;
  sourcesRemoved: string[];
  shieldingModified: string[];
  estimatedDoseRate_uSv_h: number;
  cumulativeDose_uSv: number;
  timeRequired_hours: number;
}

export function analyzeALARASequence(
  model: BIMModel,
  decommissioningPlan: {
    steps: { description: string; removeSources?: string[]; modifyShielding?: string[]; duration_hours: number }[];
    initialSourceActivity_GBq: number;
  },
): ALARAStep[] {
  const results: ALARAStep[] = [];
  let currentActivity = decommissioningPlan.initialSourceActivity_GBq;
  let cumulativeDose = 0;

  for (let i = 0; i < decommissioningPlan.steps.length; i++) {
    const step = decommissioningPlan.steps[i];

    // Reduce activity for removed sources
    if (step.removeSources) {
      currentActivity *= (1 - step.removeSources.length * 0.15); // ~15% per source
    }

    // Estimate dose rate (simplified)
    const doseRate = (0.143 * currentActivity) / 16; // at 4m distance
    const stepDose = doseRate * step.duration_hours;
    cumulativeDose += stepDose;

    results.push({
      stepNumber: i + 1,
      description: step.description,
      sourcesRemoved: step.removeSources || [],
      shieldingModified: step.modifyShielding || [],
      estimatedDoseRate_uSv_h: doseRate,
      cumulativeDose_uSv: cumulativeDose,
      timeRequired_hours: step.duration_hours,
    });
  }

  return results;
}

// ── Material mapping from IFC to shielding ──
export const IFC_TO_SHIELDING_MATERIAL: Record<string, {
  shieldingMaterial: string;
  density_kg_m3: number;
  tvl_6MV_cm: number;
}> = {
  'Concrete, Cast-in-Place': { shieldingMaterial: 'concrete', density_kg_m3: 2350, tvl_6MV_cm: 37 },
  'Concrete, Heavy (Barite)': { shieldingMaterial: 'barite_concrete', density_kg_m3: 3500, tvl_6MV_cm: 28 },
  'Lead': { shieldingMaterial: 'lead', density_kg_m3: 11340, tvl_6MV_cm: 5.7 },
  'Steel': { shieldingMaterial: 'steel', density_kg_m3: 7850, tvl_6MV_cm: 10 },
  'Gypsum Board': { shieldingMaterial: 'gypsum', density_kg_m3: 800, tvl_6MV_cm: 120 },
  'Brick': { shieldingMaterial: 'brick', density_kg_m3: 1800, tvl_6MV_cm: 50 },
  'Polyethylene': { shieldingMaterial: 'polyethylene', density_kg_m3: 950, tvl_6MV_cm: 15 },
};

// ── Example: Full BIMRAD workflow ──
export interface BIMRADWorkflow {
  phase: string;
  description: string;
  inputs: string[];
  outputs: string[];
  status: 'ready' | 'running' | 'complete' | 'error';
}

export const BIMRAD_WORKFLOW_STEPS: BIMRADWorkflow[] = [
  { phase: '1. IFC Import', description: 'Import BIM model in IFC format from Revit/ArchiCAD', inputs: ['IFC file (.ifc)'], outputs: ['BIM geometry', 'Material properties', 'Space definitions'], status: 'ready' },
  { phase: '2. Element Classification', description: 'Classify IFC elements for shielding (walls, doors, spaces)', inputs: ['BIM geometry'], outputs: ['Shielding barriers', 'Leakage paths', 'Occupancy zones'], status: 'ready' },
  { phase: '3. Material Mapping', description: 'Map IFC materials to shielding properties (TVL, density)', inputs: ['IFC materials'], outputs: ['Shielding material database'], status: 'ready' },
  { phase: '4. Source Definition', description: 'Define radiation sources (position, nuclide, activity)', inputs: ['Source specification'], outputs: ['Source model'], status: 'ready' },
  { phase: '5. Forward Calculation', description: 'Calculate dose rate distribution using point kernel', inputs: ['Source model', 'Shielding barriers'], outputs: ['Dose rate map (3D)'], status: 'ready' },
  { phase: '6. Inverse Calculation (BIMRAD)', description: 'Estimate source strength from measured dose rates', inputs: ['Measured dose rates'], outputs: ['Estimated source activity', 'Uncertainty analysis'], status: 'ready' },
  { phase: '7. Zoning', description: 'Assign radiological zones based on calculated dose rates', inputs: ['Dose rate map'], outputs: ['Controlled/Supervised/Free zones'], status: 'ready' },
  { phase: '8. ALARA Analysis', description: 'Evaluate decommissioning strategies for dose minimization', inputs: ['Dose rate map', 'Decommissioning plan'], outputs: ['ALARA report', 'Optimized sequence'], status: 'ready' },
  { phase: '9. 3D Visualization', description: 'Visualize dose rate distribution overlaid on BIM model', inputs: ['Dose rate map', 'BIM geometry'], outputs: ['3D dose visualization'], status: 'ready' },
];
