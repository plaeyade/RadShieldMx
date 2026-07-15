// =============================================================================
// doseMappingEngine.ts — 3D Dose Mapping Engine with Virtual Detector Mesh
// Supports: photons, electrons, positrons, neutrons
// Legal zoning: controlled, supervised, free
// Based on: NCRP 151, ICRP 103, IAEA SSG-46
// =============================================================================

export type ParticleType = 'photon' | 'electron' | 'positron' | 'neutron';

export interface ParticleConfig {
  type: ParticleType;
  name: string;
  symbol: string;
  mass_MeV: number;
  charge: number;
  penetrationFactor: number; // relative to photon (1.0)
  color: string; // for visualization
}

export const PARTICLE_TYPES: ParticleConfig[] = [
  { type: 'photon', name: 'Photons (gamma/X)', symbol: 'γ', mass_MeV: 0, charge: 0, penetrationFactor: 1.0, color: '#3b82f6' },
  { type: 'electron', name: 'Electrons (beta⁻)', symbol: 'β⁻', mass_MeV: 0.511, charge: -1, penetrationFactor: 0.001, color: '#ef4444' },
  { type: 'positron', name: 'Positrons (beta⁺)', symbol: 'β⁺', mass_MeV: 0.511, charge: +1, penetrationFactor: 0.001, color: '#f59e0b' },
  { type: 'neutron', name: 'Neutrons', symbol: 'n', mass_MeV: 939.6, charge: 0, penetrationFactor: 0.5, color: '#10b981' },
];

// ── Legal Radiological Zoning (ICRP 103 / IAEA SSG-46) ──
export interface RadiologicalZone {
  id: string;
  name: string;
  nameEs: string;
  doseRateLimit_uSv_h: number;
  annualLimit_mSv: number;
  color: string;
  description: string;
}

export const RADIOLOGICAL_ZONES: RadiologicalZone[] = [
  {
    id: 'controlled',
    name: 'Controlled Zone',
    nameEs: 'Zona Controlada',
    doseRateLimit_uSv_h: 7.5,     // > 7.5 uSv/h average over working day
    annualLimit_mSv: 20,           // POE annual limit
    color: '#dc2626',              // Red
    description: 'Area where workers may receive > 6 mSv/year. Restricted access. Personal dosimetry required.',
  },
  {
    id: 'supervised',
    name: 'Supervised Zone',
    nameEs: 'Zona Vigilada',
    doseRateLimit_uSv_h: 2.5,     // 2.5 - 7.5 uSv/h
    annualLimit_mSv: 6,            // 1-6 mSv/year
    color: '#ea580c',              // Orange
    description: 'Area where workers may receive 1-6 mSv/year. Occupational exposure monitoring.',
  },
  {
    id: 'free',
    name: 'Free Zone',
    nameEs: 'Zona Libre',
    doseRateLimit_uSv_h: 0.5,     // < 2.5 uSv/h
    annualLimit_mSv: 1,            // Public limit
    color: '#16a34a',              // Green
    description: 'Area below public dose limit. No restrictions.',
  },
  {
    id: 'excluded',
    name: 'Excluded Zone',
    nameEs: 'Zona Excluida',
    doseRateLimit_uSv_h: Infinity, // No limit (inside treatment room)
    annualLimit_mSv: Infinity,
    color: '#7f1d1d',              // Dark red
    description: 'Inside radiation source enclosure. No occupancy during operation.',
  },
];

/** Get zone for a given dose rate (uSv/h) */
export function getZoneForDoseRate(doseRate_uSv_h: number): RadiologicalZone {
  if (doseRate_uSv_h > 1000) return RADIOLOGICAL_ZONES.find(z => z.id === 'excluded')!;
  if (doseRate_uSv_h > 7.5) return RADIOLOGICAL_ZONES.find(z => z.id === 'controlled')!;
  if (doseRate_uSv_h > 2.5) return RADIOLOGICAL_ZONES.find(z => z.id === 'supervised')!;
  return RADIOLOGICAL_ZONES.find(z => z.id === 'free')!;
}

// ── Virtual Detector Mesh ──
export interface DetectorVoxel {
  x: number; // meters
  y: number;
  z: number;
  doseRate_uSv_h: number;
  particleType: ParticleType;
  zone: string;
  cumulativeDose_uSv: number;
  flux_cm2_s: number;
}

export interface DetectorMesh {
  resolution_cm: number;
  dimensions: { x: number; y: number; z: number }; // meters
  voxels: DetectorVoxel[];
  particleType: ParticleType;
  sourcePosition: { x: number; y: number; z: number };
  sourceActivity_GBq: number;
  shieldThickness_cm: number;
  shieldMaterial: string;
  computedAt: string;
}

/** Generate virtual detector mesh for a given particle type and source */
export function generateDetectorMesh(
  particleType: ParticleType,
  sourcePos: { x: number; y: number; z: number },
  activity_GBq: number,
  roomDimensions: { x: number; y: number; z: number },
  resolution_cm: number = 25, // 25cm default
  shieldThickness_cm: number = 0,
  shieldMaterial: string = 'none',
): DetectorMesh {
  const res_m = resolution_cm / 100;
  const nx = Math.ceil(roomDimensions.x / res_m);
  const ny = Math.ceil(roomDimensions.y / res_m);
  const nz = Math.ceil(roomDimensions.z / res_m);
  const voxels: DetectorVoxel[] = [];

  const particle = PARTICLE_TYPES.find(p => p.type === particleType)!;
  const gammaConst = getGammaConstant(particleType);

  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      for (let k = 0; k < nz; k++) {
        const x = i * res_m + res_m / 2;
        const y = j * res_m + res_m / 2;
        const z = k * res_m + res_m / 2;

        // Skip if inside source
        const d = Math.sqrt((x - sourcePos.x) ** 2 + (y - sourcePos.y) ** 2 + (z - sourcePos.z) ** 2);
        if (d < 0.3) continue;

        // Dose rate calculation
        let doseRate_uSv_h = 0;
        if (particleType === 'photon') {
          doseRate_uSv_h = (gammaConst * activity_GBq) / (d * d);
          // Apply shielding attenuation (broad-beam)
          if (shieldThickness_cm > 0 && isBehindShield(x, y, z, sourcePos, shieldThickness_cm)) {
            const tvl = getTVLForMaterial(shieldMaterial, particleType);
            if (tvl > 0) {
              const nTVL = shieldThickness_cm / tvl;
              const B = Math.pow(10, -nTVL);
              doseRate_uSv_h *= B;
            }
          }
        } else if (particleType === 'electron') {
          // CSDA range-limited (electrons don't travel far)
          const maxRange_m = 0.5; // ~50cm max range for MeV electrons in air
          doseRate_uSv_h = d < maxRange_m ? (gammaConst * activity_GBq * 0.01) / (d * d) : 0;
        } else if (particleType === 'positron') {
          // 511 keV annihilation photons after positron range
          const maxRange_m = 0.004; // ~4mm range
          doseRate_uSv_h = d > maxRange_m ? (gammaConst * activity_GBq) / (d * d) : 0;
        } else if (particleType === 'neutron') {
          // Neutron dose with removal cross section
          const sigmaR = getNeutronRemovalCoeff(shieldMaterial);
          doseRate_uSv_h = (gammaConst * activity_GBq * 100) / (d * d); // higher for neutrons
          if (shieldThickness_cm > 0 && sigmaR > 0) {
            doseRate_uSv_h *= Math.exp(-sigmaR * shieldThickness_cm);
          }
        }

        const zone = getZoneForDoseRate(doseRate_uSv_h);
        voxels.push({
          x, y, z,
          doseRate_uSv_h,
          particleType,
          zone: zone.id,
          cumulativeDose_uSv: doseRate_uSv_h * 40, // 40h/week
          flux_cm2_s: doseRate_uSv_h / 3600 * 1000, // approximate
        });
      }
    }
  }

  return {
    resolution_cm,
    dimensions: roomDimensions,
    voxels,
    particleType,
    sourcePosition: sourcePos,
    sourceActivity_GBq: activity_GBq,
    shieldThickness_cm,
    shieldMaterial,
    computedAt: new Date().toISOString(),
  };
}

function getGammaConstant(particle: ParticleType): number {
  switch (particle) {
    case 'photon': return 0.143;    // F-18 reference (mSv.m2/GBq.h)
    case 'electron': return 0.001;   // Beta
    case 'positron': return 0.143;   // 511 keV annihilation
    case 'neutron': return 0.50;     // Approximate for fast neutrons
  }
}

function getTVLForMaterial(material: string, particle: ParticleType): number {
  if (particle !== 'photon') return 0;
  const tvlMap: Record<string, number> = {
    concrete: 37.0, lead: 0.5, steel: 10.0, barite: 28.0,
  };
  return tvlMap[material] || 0;
}

function getNeutronRemovalCoeff(material: string): number {
  const coeffs: Record<string, number> = {
    concrete: 0.00947, polyethylene: 0.0608, steel: 0.00405, lead: 0.00352,
  };
  return coeffs[material] || 0;
}

function isBehindShield(
  x: number, y: number, z: number,
  sourcePos: { x: number; y: number; z: number },
  wallDistance: number,
): boolean {
  // Simple check: if detector is farther from source than wall
  const wallX = sourcePos.x + wallDistance;
  return x > wallX;
}

// ── Merge multiple mappings ──
export interface MergedMapping {
  voxels: DetectorVoxel[];
  dimensions: { x: number; y: number; z: number };
  sources: { particle: ParticleType; activity: number; position: { x: number; y: number; z: number } }[];
  totalDose_uSv_h: number;
  maxDose_uSv_h: number;
  avgDose_uSv_h: number;
  zoneDistribution: Record<string, number>;
}

export function mergeMappings(mappings: DetectorMesh[]): MergedMapping {
  if (mappings.length === 0) {
    return { voxels: [], dimensions: { x: 0, y: 0, z: 0 }, sources: [], totalDose_uSv_h: 0, maxDose_uSv_h: 0, avgDose_uSv_h: 0, zoneDistribution: {} };
  }

  // Use first mapping's grid structure
  const baseVoxels = mappings[0].voxels.map(v => ({ ...v, doseRate_uSv_h: 0 }));

  for (const mesh of mappings) {
    for (let i = 0; i < Math.min(baseVoxels.length, mesh.voxels.length); i++) {
      baseVoxels[i].doseRate_uSv_h += mesh.voxels[i].doseRate_uSv_h;
      baseVoxels[i].cumulativeDose_uSv += mesh.voxels[i].cumulativeDose_uSv;
      // Re-assign zone based on merged dose
      const zone = getZoneForDoseRate(baseVoxels[i].doseRate_uSv_h);
      baseVoxels[i].zone = zone.id;
    }
  }

  const doses = baseVoxels.map(v => v.doseRate_uSv_h);
  const maxDose = Math.max(...doses);
  const avgDose = doses.reduce((a, b) => a + b, 0) / doses.length;

  // Zone distribution
  const zoneDist: Record<string, number> = {};
  for (const v of baseVoxels) {
    zoneDist[v.zone] = (zoneDist[v.zone] || 0) + 1;
  }

  return {
    voxels: baseVoxels,
    dimensions: mappings[0].dimensions,
    sources: mappings.map(m => ({ particle: m.particleType, activity: m.sourceActivity_GBq, position: m.sourcePosition })),
    totalDose_uSv_h: doses.reduce((a, b) => a + b, 0),
    maxDose_uSv_h: maxDose,
    avgDose_uSv_h: avgDose,
    zoneDistribution: zoneDist,
  };
}

// ── Statistics ──
export function computeMeshStats(mesh: DetectorMesh) {
  const doses = mesh.voxels.map(v => v.doseRate_uSv_h);
  const zones: Record<string, number> = {};
  for (const v of mesh.voxels) {
    zones[v.zone] = (zones[v.zone] || 0) + 1;
  }
  return {
    voxelCount: mesh.voxels.length,
    maxDose_uSv_h: Math.max(...doses),
    minDose_uSv_h: Math.min(...doses.filter(d => d > 0)),
    avgDose_uSv_h: doses.reduce((a, b) => a + b, 0) / doses.length,
    medianDose_uSv_h: doses.sort((a, b) => a - b)[Math.floor(doses.length / 2)],
    zoneDistribution: zones,
    volume_m3: mesh.dimensions.x * mesh.dimensions.y * mesh.dimensions.z,
    resolution: mesh.resolution_cm,
  };
}
