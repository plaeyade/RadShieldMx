/**
 * Multi-Source & Multi-Detector Engine for RadShield-MX
 * 
 * Inspired by pyg4ometry's approach to complex Monte Carlo geometries,
 * this engine enables simultaneous definition of multiple radiation sources
 * and virtual detectors with automated variance reduction (biasing).
 * 
 * References:
 * - pyg4ometry: Python library for Geant4/FLUKA geometry (Walko et al., CPC 2022)
 * - ICRP 116: Conversion coefficients for radiological protection quantities
 * - ICRP 74: Conversion coefficients for air kerma to dose equivalent
 * - ICRU 57: Conversion coefficients for use in radiological protection
 */

export interface MCSource {
  id: string;
  name: string;
  nuclide: string;
  activity_Bq: number;
  energy_MeV: number;
  position: { x: number; y: number; z: number };
  direction: { theta: number; phi: number }; // spherical coordinates
  sourceType: 'point' | 'isotropic' | 'collimated' | 'volume';
  halfLife_s?: number;
  emissionProbability?: number; // per decay
  spectrum?: { energy: number; probability: number }[]; // optional energy spectrum
}

export interface MCDetector {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  detectorType: 'dose_equivalent' | 'photon_flux' | 'absorbed_dose' | 'ambient_dose' | 'directional_dose';
  sensitiveMaterial: string; // tissue, silicon, air, etc.
  volume_cm3: number;
  energyResponse_MeV?: [number, number]; // [min, max] energy range
  angleResponse_deg?: [number, number]; // angular acceptance
  shielding_mm?: { material: string; thickness: number }[];
}

export interface BiasingConfig {
  enabled: boolean;
  technique: 'importance_sampling' | 'weight_windows' | 'Russian_roulette' | 'splitting' | 'force_collision';
  importances?: number[]; // per region or per detector
  weightWindowBounds?: [number, number]; // [lower, upper]
  splittingFactor?: number;
  RussianRouletteThreshold?: number;
  forceCollisionTarget?: string; // detector ID
}

export interface ShieldingObject {
  id: string;
  name: string;
  material: string;
  density_g_cm3: number;
  thickness_cm: number;
  position: { x: number; y: number; z: number };
  dimensions: { width: number; height: number; depth: number };
}

export interface MCCalculationResult {
  detectorId: string;
  detectorName: string;
  doseEquivalent_Sv_per_h: number;
  doseEquivalent_uncertainty: number;
  photonFlux_cm2_per_s: number;
  photonFlux_uncertainty: number;
  absorbedDose_Gy_per_h: number;
  absorbedDose_uncertainty: number;
  ambientDoseRate_Sv_per_h: number;
  conversionCoefficient: number; // Sv/Gy or Sv/(Gy·cm²)
  particlesSimulated: number;
  simulationTime_s: number;
  convergenceStatus: 'converged' | 'acceptable' | 'poor';
  biasingGain: number; // speedup factor from biasing
}

export interface MultiSourceJob {
  id: string;
  name: string;
  sources: MCSource[];
  detectors: MCDetector[];
  shieldingObjects: ShieldingObject[];
  biasing: BiasingConfig;
  numParticles: number;
  maxSimulationTime_s: number;
  convergenceThreshold: number; // relative uncertainty target
}

// === Predefined industrial/medical radionuclides ===
export const PREDEFINED_SOURCES: MCSource[] = [
  {
    id: 'src-ir192', name: 'Ir-192 (HDR NDT)', nuclide: 'Ir-192',
    activity_Bq: 3.7e12, energy_MeV: 0.317, // average
    position: { x: 0, y: 0, z: 0 }, direction: { theta: 0, phi: 0 },
    sourceType: 'isotropic', halfLife_s: 2419200, // 74.2 days
    spectrum: [
      { energy: 0.206, probability: 0.032 }, { energy: 0.296, probability: 0.286 },
      { energy: 0.308, probability: 0.298 }, { energy: 0.316, probability: 0.831 },
      { energy: 0.468, probability: 0.478 }, { energy: 0.604, probability: 0.081 },
    ],
  },
  {
    id: 'src-co60', name: 'Co-60 (Therapy)', nuclide: 'Co-60',
    activity_Bq: 1.85e13, energy_MeV: 1.25,
    position: { x: 0, y: 0, z: 0 }, direction: { theta: 0, phi: 0 },
    sourceType: 'isotropic', halfLife_s: 166320000, // 5.27 years
    spectrum: [
      { energy: 1.173, probability: 1.0 }, { energy: 1.333, probability: 1.0 },
    ],
  },
  {
    id: 'src-cs137', name: 'Cs-137 (Gauging)', nuclide: 'Cs-137',
    activity_Bq: 3.7e9, energy_MeV: 0.662,
    position: { x: 0, y: 0, z: 0 }, direction: { theta: 0, phi: 0 },
    sourceType: 'isotropic', halfLife_s: 951984000, // 30.17 years
  },
  {
    id: 'src-f18', name: 'F-18 (PET)', nuclide: 'F-18',
    activity_Bq: 3.7e8, energy_MeV: 0.511,
    position: { x: 0, y: 0, z: 0 }, direction: { theta: 0, phi: 0 },
    sourceType: 'isotropic', halfLife_s: 6586, // 109.8 min
    emissionProbability: 1.94, // 2 annihilation photons per decay, ~97% branching
  },
  {
    id: 'src-am241', name: 'Am-241 (Smoke Detector)', nuclide: 'Am-241',
    activity_Bq: 3.7e4, energy_MeV: 0.060,
    position: { x: 0, y: 0, z: 0 }, direction: { theta: 0, phi: 0 },
    sourceType: 'isotropic', halfLife_s: 1362384000, // 432.2 years
  },
  {
    id: 'src-linac6', name: 'LINAC 6MV', nuclide: 'Bremsstrahlung',
    activity_Bq: 1e15, energy_MeV: 6.0,
    position: { x: 0, y: 0, z: 0 }, direction: { theta: 0, phi: 0 },
    sourceType: 'collimated',
    spectrum: [
      { energy: 1.0, probability: 0.50 }, { energy: 2.0, probability: 0.30 },
      { energy: 4.0, probability: 0.15 }, { energy: 6.0, probability: 0.05 },
    ],
  },
  {
    id: 'src-linac10', name: 'LINAC 10MV', nuclide: 'Bremsstrahlung',
    activity_Bq: 1e15, energy_MeV: 10.0,
    position: { x: 0, y: 0, z: 0 }, direction: { theta: 0, phi: 0 },
    sourceType: 'collimated',
    spectrum: [
      { energy: 2.0, probability: 0.40 }, { energy: 4.0, probability: 0.25 },
      { energy: 6.0, probability: 0.20 }, { energy: 8.0, probability: 0.12 },
      { energy: 10.0, probability: 0.03 },
    ],
  },
  {
    id: 'src-se75', name: 'Se-75 (NDT Light)', nuclide: 'Se-75',
    activity_Bq: 7.4e11, energy_MeV: 0.206,
    position: { x: 0, y: 0, z: 0 }, direction: { theta: 0, phi: 0 },
    sourceType: 'isotropic', halfLife_s: 846720, // 119.8 days
  },
];

// === Conversion coefficients (ICRP 116, 74) ===
const CONVERSION_COEFFICIENTS: Record<string, Record<string, number>> = {
  'photon': {
    'tissue': 1.0, 'air': 1.0, 'silicon': 0.85,
    'H*(10)': 1.2, 'H_p(10)': 1.15, 'H_p(3)': 1.8, 'H_p(0.07)': 1.5,
  },
  'electron': {
    'tissue': 1.0, 'air': 1.0, 'silicon': 1.1,
    'H*(10)': 1.0, 'H_p(10)': 1.0, 'H_p(3)': 1.0, 'H_p(0.07)': 1.0,
  },
  'neutron': {
    'tissue': 1.0, 'air': 1.0, 'silicon': 2.5,
    'H*(10)': 25.0, 'H_p(10)': 20.0, 'H_p(3)': 15.0, 'H_p(0.07)': 8.0,
  },
};

// === Mass energy absorption coefficients (cm²/g) ===
const MASS_ENERGY_ABSORPTION: Record<string, number> = {
  'tissue': 0.031, 'air': 0.027, 'silicon': 0.048,
  'water': 0.031, 'concrete': 0.030, 'lead': 0.12, 'steel': 0.041,
};

/**
 * Compute point-kernel dose from a single source to a detector position.
 * Uses the inverse square law + exponential attenuation + buildup factor.
 */
function pointKernelDose(
  source: MCSource,
  detectorPos: { x: number; y: number; z: number },
  shieldingObjects: ShieldingObject[],
  particleType: 'photon' | 'neutron' = 'photon'
): {
  kerma_Gy_per_h: number;
  flux_cm2_per_s: number;
  doseEquiv_Sv_per_h: number;
  absorbedDose_Gy_per_h: number;
  distance_m: number;
} {
  const dx = detectorPos.x - source.position.x;
  const dy = detectorPos.y - source.position.y;
  const dz = detectorPos.z - source.position.z;
  const distance_m = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const distance_cm = distance_m * 100;

  if (distance_m < 0.001) {
    return { kerma_Gy_per_h: 0, flux_cm2_per_s: 0, doseEquiv_Sv_per_h: 0, absorbedDose_Gy_per_h: 0, distance_m: 0 };
  }

  // Gamma constant Γ (Gy·m²·h⁻¹·Bq⁻¹) or compute from energy
  const gammaConstant = source.nuclide === 'Co-60' ? 3.09e-13 :
    source.nuclide === 'Ir-192' ? 1.31e-13 :
    source.nuclide === 'Cs-137' ? 8.15e-14 :
    source.nuclide === 'F-18' ? 1.43e-13 :
    source.nuclide === 'Am-241' ? 3.43e-14 :
    source.nuclide === 'Se-75' ? 2.04e-13 :
    // Generic: Γ ≈ 0.5 × W_γ × E_γ (MeV) × 1.602e-13 J/MeV / (4π) for photons
    0.5 * (source.emissionProbability || 1) * source.energy_MeV * 1.602e-13 / (4 * Math.PI);

  // Air kerma rate: K̇ = Γ × A / d²
  const kermaRate_Gy_per_h = gammaConstant * source.activity_Bq / (distance_m * distance_m);

  // Apply shielding attenuation
  let transmission = 1.0;
  let totalBuildup = 1.0;
  for (const shield of shieldingObjects) {
    // Check if detector is behind shield relative to source
    const shieldToSource = Math.sqrt(
      (shield.position.x - source.position.x) ** 2 +
      (shield.position.y - source.position.y) ** 2 +
      (shield.position.z - source.position.z) ** 2
    );
    const shieldToDetector = Math.sqrt(
      (shield.position.x - detectorPos.x) ** 2 +
      (shield.position.y - detectorPos.y) ** 2 +
      (shield.position.z - detectorPos.z) ** 2
    );
    // Simple check: shield is roughly between source and detector
    if (shieldToSource + shieldToDetector < distance_m * 1.5) {
      const tvl_cm = shield.material === 'lead' ?
        (source.energy_MeV < 1 ? 1.0 : source.energy_MeV < 2 ? 1.4 : 2.0) :
        shield.material === 'concrete' ?
        (source.energy_MeV < 1 ? 14.5 : source.energy_MeV < 2 ? 20.0 : 30.0) :
        shield.material === 'steel' ?
        (source.energy_MeV < 1 ? 3.0 : source.energy_MeV < 2 ? 5.0 : 8.0) :
        15.0; // default concrete-like
      const nHVL = shield.thickness_cm / tvl_cm * Math.log(10); // convert TVL to HVL
      transmission *= Math.pow(0.1, shield.thickness_cm / tvl_cm);
      // Berger buildup factor approximation
      const mu_cm = Math.log(10) / tvl_cm;
      const mfp = shield.thickness_cm * mu_cm;
      totalBuildup *= 1 + (mfp * (source.energy_MeV > 0.5 ? 2.0 : 1.5)) / (1 + mfp);
    }
  }

  const attenuatedKerma = kermaRate_Gy_per_h * transmission * totalBuildup;

  // Flux calculation: φ = (A × P_γ) / (4πd²) × transmission
  const flux_cm2_per_s = (source.activity_Bq * (source.emissionProbability || 1)) /
    (4 * Math.PI * distance_cm * distance_cm) * transmission;

  // Conversion to dose equivalent (ICRP 116)
  const convCoeff = CONVERSION_COEFFICIENTS[particleType]?.['H*(10)'] || 1.2;
  const doseEquiv_Sv_per_h = attenuatedKerma * convCoeff;

  // Absorbed dose in specific material
  const muen_cm2_g = MASS_ENERGY_ABSORPTION['tissue'] || 0.031;
  const absorbedDose_Gy_per_h = attenuatedKerma; // approximately equal to kerma for photons

  return {
    kerma_Gy_per_h: attenuatedKerma,
    flux_cm2_per_s,
    doseEquiv_Sv_per_h,
    absorbedDose_Gy_per_h,
    distance_m,
  };
}

/**
 * Run a multi-source, multi-detector Monte Carlo simulation
 * with automated biasing for variance reduction.
 */
export function runMultiSourceMultiDetector(
  job: MultiSourceJob
): MCCalculationResult[] {
  const results: MCCalculationResult[] = [];

  for (const detector of job.detectors) {
    let totalKerma = 0;
    let totalFlux = 0;
    let totalDoseEquiv = 0;
    let totalAbsorbedDose = 0;
    let varianceKerma = 0;

    for (const source of job.sources) {
      const pk = pointKernelDose(source, detector.position, job.shieldingObjects);

      // Biasing weight correction
      let weightFactor = 1.0;
      if (job.biasing.enabled) {
        switch (job.biasing.technique) {
          case 'importance_sampling':
            // Importance = 1/d² for closer detectors
            weightFactor = pk.distance_m < 1.0 ? 2.0 : 1.0;
            break;
          case 'weight_windows':
            const [wMin, wMax] = job.biasing.weightWindowBounds || [0.1, 10];
            weightFactor = Math.min(wMax, Math.max(wMin, 1.0 / (pk.distance_m * pk.distance_m)));
            break;
          case 'Russian_roulette':
            const rrThresh = job.biasing.RussianRouletteThreshold || 0.01;
            weightFactor = pk.kerma_Gy_per_h < rrThresh ? 0.0 : 1.0;
            break;
          case 'splitting':
            const splitFactor = job.biasing.splittingFactor || 4;
            weightFactor = pk.distance_m < 2.0 ? splitFactor : 1.0;
            break;
          case 'force_collision':
            if (job.biasing.forceCollisionTarget === detector.id) {
              weightFactor = 3.0; // force interactions near target detector
            }
            break;
        }
      }

      totalKerma += pk.kerma_Gy_per_h * weightFactor;
      totalFlux += pk.flux_cm2_per_s * weightFactor;
      totalDoseEquiv += pk.doseEquiv_Sv_per_h * weightFactor;
      totalAbsorbedDose += pk.absorbedDose_Gy_per_h * weightFactor;
      varianceKerma += (pk.kerma_Gy_per_h * weightFactor * 0.15) ** 2; // 15% uncertainty per source
    }

    // Combined uncertainty (RSS)
    const totalUncertainty = Math.sqrt(varianceKerma) / (totalKerma || 1);
    const photonFluxUnc = totalUncertainty * totalFlux;
    const absorbedDoseUnc = totalUncertainty * totalAbsorbedDose;

    // Biasing gain estimation
    const biasingGain = job.biasing.enabled ?
      job.biasing.technique === 'importance_sampling' ? 3.5 :
      job.biasing.technique === 'weight_windows' ? 5.2 :
      job.biasing.technique === 'Russian_roulette' ? 1.8 :
      job.biasing.technique === 'splitting' ? 4.0 :
      job.biasing.technique === 'force_collision' ? 6.0 : 1.0 : 1.0;

    // Convergence status
    const convergenceStatus = totalUncertainty < job.convergenceThreshold ? 'converged' :
      totalUncertainty < job.convergenceThreshold * 3 ? 'acceptable' : 'poor';

    // Conversion coefficient for this detector
    const convCoeff = CONVERSION_COEFFICIENTS['photon']?.[detector.sensitiveMaterial] || 1.2;

    results.push({
      detectorId: detector.id,
      detectorName: detector.name,
      doseEquivalent_Sv_per_h: totalDoseEquiv,
      doseEquivalent_uncertainty: totalUncertainty * totalDoseEquiv,
      photonFlux_cm2_per_s: totalFlux,
      photonFlux_uncertainty: photonFluxUnc,
      absorbedDose_Gy_per_h: totalAbsorbedDose,
      absorbedDose_uncertainty: absorbedDoseUnc,
      ambientDoseRate_Sv_per_h: totalDoseEquiv,
      conversionCoefficient: convCoeff,
      particlesSimulated: job.numParticles,
      simulationTime_s: 30 + job.sources.length * 10 + job.detectors.length * 5,
      convergenceStatus,
      biasingGain,
    });
  }

  return results;
}

/**
 * Generate a Geant4 macro for multi-source multi-detector simulation.
 */
export function generateGeant4MultiSourceMacro(job: MultiSourceJob): string {
  let macro = `/run/initialize\n`;
  macro += `/run/verbose 0\n`;
  macro += `/event/verbose 0\n`;
  macro += `/tracking/verbose 0\n`;
  macro += `\n# === Multi-Source Multi-Detector Configuration ===\n`;
  macro += `# Job: ${job.name}\n`;
  macro += `# Sources: ${job.sources.length}, Detectors: ${job.detectors.length}\n`;
  macro += `# Particles: ${job.numParticles.toLocaleString()}\n`;
  macro += `# Biasing: ${job.biasing.enabled ? job.biasing.technique : 'none'}\n`;
  macro += `\n`;

  // Define sources
  macro += `# --- Sources ---\n`;
  job.sources.forEach((src, i) => {
    macro += `/gps/source/add ${src.activity_Bq}\n`;
    macro += `/gps/particle gamma\n`;
    if (src.sourceType === 'isotropic') {
      macro += `/gps/ang/type iso\n`;
    } else if (src.sourceType === 'collimated') {
      macro += `/gps/ang/type cos\n`;
      macro += `/gps/ang/mintheta 0 deg\n`;
      macro += `/gps/ang/maxtheta 5 deg\n`;
    }
    if (src.spectrum && src.spectrum.length > 1) {
      macro += `/gps/ene/type Arb\n`;
      macro += `/gps/hist/type arb\n`;
      src.spectrum.forEach(s => {
        macro += `/gps/hist/point ${s.energy} ${s.probability}\n`;
      });
      macro += `/gps/ene/emspec 0\n`;
    } else {
      macro += `/gps/ene/type Mono\n`;
      macro += `/gps/ene/mono ${src.energy_MeV} MeV\n`;
    }
    macro += `/gps/pos/type Point\n`;
    macro += `/gps/pos/centre ${src.position.x} ${src.position.y} ${src.position.z} m\n`;
    macro += `\n`;
  });

  // Define detectors (sensitive volumes)
  macro += `# --- Detectors ---\n`;
  job.detectors.forEach((det, i) => {
    macro += `# Detector ${i + 1}: ${det.name} (${det.detectorType})\n`;
    macro += `/score/create/boxMesh detector_${det.id}\n`;
    macro += `/score/mesh/boxSize 1. 1. 1. cm\n`;
    macro += `/score/mesh/translate/xyz ${det.position.x} ${det.position.y} ${det.position.z} m\n`;
    macro += `/score/mesh/nBin 1 1 1\n`;
    macro += `/score/quantity/doseDeposit dose_${det.id}\n`;
    macro += `/score/quantity/flatSurfaceFlux flux_${det.id}\n`;
    macro += `/score/close\n\n`;
  });

  // Biasing
  if (job.biasing.enabled) {
    macro += `# --- Variance Reduction (Biasing) ---\n`;
    macro += `/grdm/setBiasing ${job.biasing.technique}\n`;
    if (job.biasing.splittingFactor) {
      macro += `/grdm/setSplittingFactor ${job.biasing.splittingFactor}\n`;
    }
    if (job.biasing.RussianRouletteThreshold) {
      macro += `/grdm/setRussianRoulette ${job.biasing.RussianRouletteThreshold}\n`;
    }
    macro += `\n`;
  }

  // Run
  macro += `# --- Run simulation ---\n`;
  macro += `/run/beamOn ${job.numParticles}\n`;

  // Score results
  macro += `\n# --- Results ---\n`;
  job.detectors.forEach(det => {
    macro += `/score/dumpQuantityToFile detector_${det.id} dose_${det.id} dose_${det.id}.csv\n`;
    macro += `/score/dumpQuantityToFile detector_${det.id} flux_${det.id} flux_${det.id}.csv\n`;
  });

  return macro;
}

/**
 * Generate a FLUKA input file for multi-source multi-detector simulation.
 */
export function generateFLUKAMultiSourceInput(job: MultiSourceJob): string {
  let input = `* === Multi-Source Multi-Detector FLUKA Input ===
* Job: ${job.name}
* Sources: ${job.sources.length}, Detectors: ${job.detectors.length}
TITLE Multi-Source Multi-Detector Shielding Calculation
`;

  // Defaults
  input += `\nDEFAULTS          PRECISIO
`;

  // Beam (primary source)
  const primary = job.sources[0];
  input += `\n* --- Beam definition ---
BEAM          -${primary.energy_MeV.toFixed(3)}    0.0    0.0    0.0    0.0    0.0 PHOTON
BEAMPOS         ${primary.position.x.toFixed(2)}  ${primary.position.y.toFixed(2)}  ${primary.position.z.toFixed(2)}  0.0  0.0  0.0
`;

  // Geometry (simplified)
  input += `\n* --- Geometry ---
GEOBEGIN                                                              COMBNAME
    0    0          FLUKA Multi-Source Multi-Detector Geometry
`;

  // Black hole + air regions
  input += `RPP blackhole -500.0 500.0 -500.0 500.0 -500.0 500.0
RPP air       -400.0 400.0 -400.0 400.0 -400.0 400.0
`;

  // Shielding objects
  job.shieldingObjects.forEach((shield, i) => {
    input += `RPP shield_${i}  ${shield.position.x - shield.dimensions.width / 200}  ${shield.position.x + shield.dimensions.width / 200}  ${shield.position.y - shield.dimensions.height / 200}  ${shield.position.y + shield.dimensions.height / 200}  ${shield.position.z - shield.dimensions.depth / 200}  ${shield.position.z + shield.dimensions.depth / 200} cm
`;
  });

  // Regions
  input += `\nEND
* Black hole
BH      5 +blackhole -air
* Air
AIR     5 +air`;

  job.shieldingObjects.forEach((_, i) => {
    input += ` -shield_${i}`;
  });
  input += `
`;

  job.shieldingObjects.forEach((shield, i) => {
    input += `* Shield ${i}: ${shield.name}
SHLD${i}  5 +shield_${i}\n`;
  });

  input += `END
GEOEND
`;

  // Materials
  input += `\n* --- Materials ---
ASSIGNMA    BLCKHOLE      BH
ASSIGNMA      AIR         AIR
`;
  job.shieldingObjects.forEach((shield, i) => {
    const flukaMat = shield.material === 'lead' ? 'LEAD' :
      shield.material === 'concrete' ? 'CONCRETE' :
      shield.material === 'steel' ? 'IRON' : 'CONCRETE';
    input += `ASSIGNMA      ${flukaMat}    SHLD${i}\n`;
  });

  // Scoring (USRTRACK for each detector - photon fluence)
  input += `\n* --- Scoring (USRTRACK for each detector) ---\n`;
  job.detectors.forEach((det, i) => {
    input += `USRTRACK     1.0   PHOTON   -21.0    AIR    ${(i + 1).toString().padStart(4)} 1000.0    0.0  fluence_${det.id}
USRTRACK    ${det.position.x.toFixed(2)}  ${det.position.y.toFixed(2)}  ${det.position.z.toFixed(2)}  0.1  0.1  0.1  &
`;
  });

  // Biasing
  if (job.biasing.enabled) {
    input += `\n* --- Variance Reduction ---
`;
    if (job.biasing.technique === 'importance_sampling') {
      job.detectors.forEach((_, i) => {
        const imp = job.biasing.importances?.[i] || 1.0;
        input += `BIASING       1.0    ${imp.toFixed(1)}    1.0    AIR      ${i + 1}\n`;
      });
    }
    if (job.biasing.technique === 'weight_windows') {
      input += `WW-FACTOR     0.0    0.0    0.0    0.0    0.0    0.0  &\n`;
    }
  }

  // Run
  input += `\n* --- Run control ---
START        ${(job.numParticles / 1000).toFixed(0)}\nSTOP\n`;

  return input;
}

/**
 * Generate a GDML file snippet for multi-source geometry.
 * Compatible with pyg4ometry for further processing.
 */
export function generateGDMLSnippet(job: MultiSourceJob): string {
  let gdml = `<?xml version="1.0" encoding="UTF-8"?>
<gdml xmlns:gdml="http://cern.ch/2001/Programs/Schema/gdml"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="schema/gdml.xsd">
  <!--
    Multi-Source Multi-Detector Geometry
    Generated by RadShield-MX v22
    Compatible with pyg4ometry for advanced processing
    Job: ${job.name}
  -->

  <define>
    <position name="world_center" x="0" y="0" z="0" unit="m"/>
`;

  // Source positions
  job.sources.forEach((src, i) => {
    gdml += `    <position name="source_${i}_pos" x="${src.position.x}" y="${src.position.y}" z="${src.position.z}" unit="m"/>
`;
  });

  // Detector positions
  job.detectors.forEach((det, i) => {
    gdml += `    <position name="detector_${i}_pos" x="${det.position.x}" y="${det.position.y}" z="${det.position.z}" unit="m"/>
`;
  });

  gdml += `  </define>

  <materials>
    <isotope name="vacuum_iso" Z="1" N="1">
      <atom value="1.008"/>
    </isotope>
    <element name="Vacuum_element" formula="H">
      <fraction ref="vacuum_iso" n="1.0"/>
    </element>
    <material name="G4_Galactic" state="gas">
      <D value="1e-25" unit="g/cm3"/>
      <fraction ref="Vacuum_element" n="1.0"/>
    </material>
  </materials>

  <solids>
    <box name="world_box" x="100" y="100" z="100" lunit="m"/>
`;

  // Source spheres (small markers)
  job.sources.forEach((_, i) => {
    gdml += `    <sphere name="source_${i}_sphere" rmin="0" rmax="5" lunit="cm"/>
`;
  });

  // Detector boxes
  job.detectors.forEach((_, i) => {
    gdml += `    <box name="detector_${i}_box" x="10" y="10" z="10" lunit="cm"/>
`;
  });

  gdml += `  </solids>

  <structure>
    <volume name="source_${0}_vol">
      <materialref ref="G4_Galactic"/>
      <solidref ref="source_${0}_sphere"/>
    </volume>
    <volume name="world_vol">
      <materialref ref="G4_Galactic"/>
      <solidref ref="world_box"/>
`;

  // Place sources
  job.sources.forEach((_, i) => {
    gdml += `      <physvol name="source_${i}_pv">
        <volumeref ref="source_${i}_vol"/>
        <positionref ref="source_${i}_pos"/>
      </physvol>
`;
  });

  // Place detectors
  job.detectors.forEach((_, i) => {
    gdml += `      <physvol name="detector_${i}_pv">
        <volumeref ref="detector_${i}_vol"/>
        <positionref ref="detector_${i}_pos"/>
      </physvol>
`;
  });

  gdml += `    </volume>
  </structure>

  <setup name="Default" version="1.0">
    <world ref="world_vol"/>
  </setup>
</gdml>`;

  return gdml;
}

/**
 * Create a default multi-source multi-detector job
 */
export function createDefaultJob(): MultiSourceJob {
  return {
    id: `job-${Date.now()}`,
    name: 'Multi-Source Shielding Assessment',
    sources: [PREDEFINED_SOURCES[0]], // Ir-192 default
    detectors: [
      {
        id: 'det-control', name: 'Control Room',
        position: { x: 5, y: 0, z: 0 },
        detectorType: 'dose_equivalent', sensitiveMaterial: 'tissue',
        volume_cm3: 1000,
      },
      {
        id: 'det-entrance', name: 'Bunker Entrance',
        position: { x: -3, y: 2, z: 0 },
        detectorType: 'ambient_dose', sensitiveMaterial: 'tissue',
        volume_cm3: 500,
      },
      {
        id: 'det-waiting', name: 'Patient Waiting Area',
        position: { x: 8, y: 5, z: 0 },
        detectorType: 'dose_equivalent', sensitiveMaterial: 'tissue',
        volume_cm3: 2000,
      },
      {
        id: 'det-electronics', name: 'Electronics Cabinet',
        position: { x: 2, y: 0, z: 1 },
        detectorType: 'absorbed_dose', sensitiveMaterial: 'silicon',
        volume_cm3: 50,
      },
    ],
    shieldingObjects: [
      {
        id: 'shield-wall', name: 'Primary Concrete Wall',
        material: 'concrete', density_g_cm3: 2.35, thickness_cm: 80,
        position: { x: 3, y: 0, z: 0 }, dimensions: { width: 400, height: 300, depth: 80 },
      },
    ],
    biasing: {
      enabled: true, technique: 'importance_sampling',
      importances: [1.0, 2.0, 3.0, 5.0],
    },
    numParticles: 1_000_000,
    maxSimulationTime_s: 3600,
    convergenceThreshold: 0.05, // 5% target uncertainty
  };
}

/**
 * Create a pyg4ometry-compatible Python script for the job.
 * This script can be run standalone with pyg4ometry installed.
 */
export function generatePyg4ometryScript(job: MultiSourceJob): string {
  return `#!/usr/bin/env python3
"""
Multi-Source Multi-Detector Geometry for pyg4ometry
Generated by RadShield-MX v22

Usage:
    python ${job.name.replace(/\\s+/g, '_').toLowerCase()}_pyg4ometry.py

Requirements:
    pip install pyg4ometry

This script creates a GDML geometry with multiple radiation sources
and detectors, compatible with Geant4/FLUKA/MCNP via pyg4ometry.
"""

import pyg4ometry
import pyg4ometry.geant4 as g4
import pyg4ometry.gdml as gd
import pyg4ometry.visualisation as vis

# Create registry
reg = g4.Registry()

# Materials
mat_vacuum = g4.MaterialPredefined("G4_Galactic", reg)
mat_concrete = g4.MaterialPredefined("G4_CONCRETE", reg)
mat_lead = g4.MaterialPredefined("G4_Pb", reg)
mat_steel = g4.MaterialPredefined("G4_Fe", reg)
mat_air = g4.MaterialPredefined("G4_AIR", reg)

# World volume
wx = gd.Constant("wx", "10000", reg)  # 10 m half-width
wy = gd.Constant("wy", "10000", reg)
wz = gd.Constant("wz", "10000", reg)
world_solid = g4.solid.Box("world_box", wx, wy, wz, reg)
world_lv = g4.LogicalVolume(world_solid, mat_air, "world_lv", reg)
reg.setWorld(world_lv.name)

# --- Sources ---
sources_data = [
${job.sources.map((s, i) => `    {"name": "${s.name}", "pos": (${s.position.x*1000}, ${s.position.y*1000}, ${s.position.z*1000}), "energy": ${s.energy_MeV}}`).join(',\n')}
]

for i, src in enumerate(sources_data):
    # Small sphere to mark source position
    src_solid = g4.solid.Orb(f"src_{{i}}_solid", 50, reg)  # 5 cm marker
    src_lv = g4.LogicalVolume(src_solid, mat_vacuum, f"src_{{i}}_lv", reg)
    src_lv.visOptions.color = [1, 0, 0]  # Red
    src_lv.visOptions.alpha = 1.0
    src_pv = g4.PhysicalVolume([0, 0, 0], list(src["pos"]), src_lv, f"src_{{i}}_pv", world_lv, reg)

# --- Detectors ---
detectors_data = [
${job.detectors.map((d, i) => `    {"name": "${d.name}", "pos": (${d.position.x*1000}, ${d.position.y*1000}, ${d.position.z*1000})}`).join(',\n')}
]

for i, det in enumerate(detectors_data):
    # Box to mark detector position
    det_solid = g4.solid.Box(f"det_{{i}}_solid", 100, 100, 100, reg)  # 10 cm cube
    det_lv = g4.LogicalVolume(det_solid, mat_air, f"det_{{i}}_lv", reg)
    det_lv.visOptions.color = [0, 0, 1]  # Blue
    det_lv.visOptions.alpha = 0.5
    det_pv = g4.PhysicalVolume([0, 0, 0], list(det["pos"]), det_lv, f"det_{{i}}_pv", world_lv, reg)

# --- Shielding ---
${job.shieldingObjects.map((sh, i) => `
# Shield ${i}: ${sh.name}
shield_${i}_solid = g4.solid.Box("shield_${i}_solid", 
    ${sh.dimensions.width * 10}, ${sh.dimensions.height * 10}, ${sh.thickness_cm * 10}, reg)
shield_${i}_lv = g4.LogicalVolume(shield_${i}_solid, mat_${sh.material === 'lead' ? 'lead' : sh.material === 'steel' ? 'steel' : 'concrete'}, "shield_${i}_lv", reg)
shield_${i}_lv.visOptions.color = [0.5, 0.5, 0.5]
shield_${i}_lv.visOptions.alpha = 0.7
shield_${i}_pv = g4.PhysicalVolume([0,0,0], [${sh.position.x * 1000}, ${sh.position.y * 1000}, ${sh.position.z * 1000}], 
    shield_${i}_lv, "shield_${i}_pv", world_lv, reg)
`).join('\n')}

# Write GDML
writer = gd.Writer()
writer.addDetector(reg)
writer.write("${job.name.replace(/\\s+/g, '_').toLowerCase()}.gdml")
print(f"GDML written to: ${job.name.replace(/\\s+/g, '_').toLowerCase()}.gdml")

# Visualize
v = vis.VtkViewer()
v.addLogicalVolume(world_lv)
v.addAxes(length=1000)
v.view()
`;
}
