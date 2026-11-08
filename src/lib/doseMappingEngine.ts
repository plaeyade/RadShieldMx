// =============================================================================
// doseMappingEngine.ts — 3D Dose Mapping Engine with Virtual Detector Mesh
// Legal zoning: controlled, supervised, free (ICRP 103, IAEA SSG-46)
//
// Fase 3 (docs/plan-motores-calculo.md): la tasa de dosis de cada vóxel sale de `dosisEnPunto`
// (doseFieldEngine); aquí no queda física propia. Errores corregidos al delegar:
//   · Γ ×1000: 0.143 se usaba como µSv·m²/(GBq·h); es µSv·m²/(MBq·h) (TG-108) = 143 µSv·m²/(GBq·h).
//     Ahora la modalidad `pet-f18` del catálogo y `calculateNuclearKerma`.
//   · TVL de 511 keV: 37 cm de concreto y 0.5 cm de plomo (erróneos) → catálogo `MATERIALS` (TG-108:
//     concreto 17.6 cm, plomo 1.66 cm, acero 6.5 cm; barita del catálogo).
//   · Mezcla cm/m: el blindaje se colocaba a `shieldThickness_cm` METROS de la fuente. Ahora es un muro
//     perpendicular a x a `shieldDistance_m` (m) de la fuente, de espesor `shieldThickness_cm` (cm → mm).
//   · Neutrones (Σ_R ~10× bajos, Γ «0.5» sin fuente) y electrones (alcance fijo de 0.5 m) quedan
//     FUERA DE ALCANCE: devuelven una malla vacía con `nota`. Neutrones de LINAC: `ncrp151Laberinto.ts`.
// Positrones: se mapean los fotones de aniquilación de 511 keV (F-18), igual que `photon`.
// Geometría: el motor es de planta (x, z); la altura entra como distancia vertical fuente–vóxel
// (`isocenterHeight_m`), y la oblicuidad vertical no se acredita (conservador).
// =============================================================================
import { MATERIALS, MODALITIES, type Barrier, type RadiationSource } from '@/types/radshield';
import { dosisEnPunto } from '@/lib/doseFieldEngine';

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
  /** No calculado (NaN): el motor da kerma, no fluencia. */
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
  /** Distancia fuente → cara interior del muro (m), a lo largo de +x. */
  shieldDistance_m: number;
  computedAt: string;
  /** Presente cuando la partícula está fuera del alcance del motor (malla vacía). */
  nota?: string;
}

/** Escala del plano sintético (1 px = 1 cm). Cualquier escala da el mismo resultado físico. */
export const ESCALA_MAPEO_M_POR_PX = 0.01;

/** Material del selector → código del catálogo `MATERIALS`. */
export const MATERIAL_MAPEO: Record<string, string> = {
  concrete: 'CONCRETE235', lead: 'PB', steel: 'STEEL', barite: 'CONCRETEBARITE',
};

export const NOTA_FUERA_DE_ALCANCE: Partial<Record<ParticleType, string>> = {
  electron: 'Electrones (β⁻): fuera del alcance del motor de campo; no se mapean.',
  neutron: 'Neutrones: fuera del alcance del motor de campo (fotoneutrones de LINAC en ncrp151Laberinto).',
};

const MODALIDAD_511 = MODALITIES.find((m) => m.id === 'pet-f18');

/** Fuente sintética (F-18, 511 keV) a la altura `dy_m` del plano del vóxel. Tasa: 1 h/semana ⇒ mSv/h. */
export function fuenteMapeo(sourcePos: { x: number; z: number }, activity_GBq: number, dy_m: number): RadiationSource {
  if (!MODALIDAD_511) throw new Error('Modalidad pet-f18 ausente del catálogo');
  return {
    id: 'mapeo-3d',
    name: 'Fuente puntual 511 keV',
    x: sourcePos.x / ESCALA_MAPEO_M_POR_PX,
    y: sourcePos.z / ESCALA_MAPEO_M_POR_PX,
    modality: MODALIDAD_511,
    workloadValue: activity_GBq * 1000,
    workloadUnit: 'MBq',
    nuclearActivity_GBq: activity_GBq,
    workloadHoursPerWeek: 1,
    isocenterHeight_m: Math.abs(dy_m),
    useFactor: 1,
  };
}

/** Muro del mapeo: perpendicular a x, a `distancia_m` de la fuente, largo de sobra en z. */
export function muroMapeo(
  sourcePos: { x: number; z: number }, distancia_m: number, espesor_cm: number, material: string,
): Barrier | null {
  const codigo = MATERIAL_MAPEO[material];
  if (!codigo || !(espesor_cm > 0)) return null;
  const x = (sourcePos.x + distancia_m) / ESCALA_MAPEO_M_POR_PX;
  return {
    id: 'muro-mapeo', name: 'Blindaje', x1: x, y1: -1e5, x2: x, y2: 1e5,
    barrierType: 'nuclear', useFactor: 1, occupancyFactor: 1, designGoal_mSv_per_wk: 0.02,
    materialCode: codigo, thickness_mm: espesor_cm * 10,
  };
}

/**
 * Tasa de dosis (µSv/h) en un punto (m) delegando en `dosisEnPunto`: la fuente se sintetiza con 1 h/semana,
 * así que el kerma semanal del motor (mSv) es la tasa en mSv/h.
 */
export function tasaDosisMapeo_uSv_h(
  punto: { x: number; y: number; z: number },
  sourcePos: { x: number; y: number; z: number },
  activity_GBq: number,
  barrera: Barrier | null,
): number {
  const fuente = fuenteMapeo(sourcePos, activity_GBq, punto.y - sourcePos.y);
  const d = dosisEnPunto([fuente], punto.x / ESCALA_MAPEO_M_POR_PX, punto.z / ESCALA_MAPEO_M_POR_PX, ESCALA_MAPEO_M_POR_PX, {
    barriers: barrera ? [barrera] : [],
    materials: MATERIALS,
  });
  return d.kerma_mSv_semana * 1000;
}

/** Generate virtual detector mesh for a given particle type and source (vía doseFieldEngine). */
export function generateDetectorMesh(
  particleType: ParticleType,
  sourcePos: { x: number; y: number; z: number },
  activity_GBq: number,
  roomDimensions: { x: number; y: number; z: number },
  resolution_cm: number = 25, // 25cm default
  shieldThickness_cm: number = 0,
  shieldMaterial: string = 'none',
  shieldDistance_m: number = 1,
): DetectorMesh {
  const base = {
    resolution_cm, dimensions: roomDimensions, particleType, sourcePosition: sourcePos,
    sourceActivity_GBq: activity_GBq, shieldThickness_cm, shieldMaterial, shieldDistance_m,
    computedAt: new Date().toISOString(),
  };
  const nota = NOTA_FUERA_DE_ALCANCE[particleType];
  if (nota) return { ...base, voxels: [], nota };

  const res_m = resolution_cm / 100;
  const nx = Math.ceil(roomDimensions.x / res_m);
  const ny = Math.ceil(roomDimensions.y / res_m);
  const nz = Math.ceil(roomDimensions.z / res_m);
  const voxels: DetectorVoxel[] = [];
  const barrera = muroMapeo(sourcePos, shieldDistance_m, shieldThickness_cm, shieldMaterial);

  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      for (let k = 0; k < nz; k++) {
        const x = i * res_m + res_m / 2;
        const y = j * res_m + res_m / 2;
        const z = k * res_m + res_m / 2;

        // Skip if inside source
        const d = Math.sqrt((x - sourcePos.x) ** 2 + (y - sourcePos.y) ** 2 + (z - sourcePos.z) ** 2);
        if (d < 0.3) continue;

        const doseRate_uSv_h = tasaDosisMapeo_uSv_h({ x, y, z }, sourcePos, activity_GBq, barrera);
        const zone = getZoneForDoseRate(doseRate_uSv_h);
        voxels.push({
          x, y, z,
          doseRate_uSv_h,
          particleType,
          zone: zone.id,
          cumulativeDose_uSv: doseRate_uSv_h * 40, // 40h/week
          flux_cm2_s: Number.NaN, // no se calcula (antes era una conversión sin fundamento)
        });
      }
    }
  }

  return { ...base, voxels };
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
  if (!doses.length) {
    return {
      voxelCount: 0, maxDose_uSv_h: 0, minDose_uSv_h: 0, avgDose_uSv_h: 0, medianDose_uSv_h: 0,
      zoneDistribution: {} as Record<string, number>,
      volume_m3: mesh.dimensions.x * mesh.dimensions.y * mesh.dimensions.z, resolution: mesh.resolution_cm,
    };
  }
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
