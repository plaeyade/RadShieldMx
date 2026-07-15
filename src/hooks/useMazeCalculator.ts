// Calculo de laberintos McGinley 2001 - Shielding Techniques (2nd ed)
// Formula: H = H0 * (A0/A1) * (d0/d1)^2 * 10^(-t1/TVL)
// Para laberintos con N segmentos: H = H0 * product(A_i-1/A_i) * product(d_i-1/d_i)^2 * 10^(-sum(t_i/TVL_i))

export interface MazeSegment {
  id: number;
  width_m: number;      // Ancho del segmento (A_i)
  height_m: number;     // Altura del segmento
  length_m: number;     // Longitud del segmento (d_i)
  materialCode: string; // Material de las paredes
  wallThickness_m: number; // Espesor de paredes laterales
}

export interface MazeConfig {
  sourceType: 'LINAC' | 'Co60' | 'Ir192';
  energy_MeV: number;        // Energia del haz primario
  workload_Gy_week: number;  // Carga de trabajo semanal
  sourceDistance_m: number;  // Distancia fuente a entrada (d0)
  entryArea_m2: number;      // Area de entrada (A0)
  segments: MazeSegment[];
  useDoor: boolean;          // ¿Tiene puerta blindada al final?
  doorMaterial?: string;
  doorThickness_mm?: number;
}

// Coeficientes de scattering por angulo (McGinley Tabla 5.1)
const SCATTER_COEFF: Record<number, number> = {
  0: 1.0,    // Incidencia directa (idealizado)
  30: 0.35,
  45: 0.20,
  60: 0.10,
  90: 0.05,
  120: 0.03,
  135: 0.025,
  150: 0.02,
};

// TVL para concreto segun energia (McGinley/NCRP 151)
function getTVL_cm(energy_MeV: number): number {
  if (energy_MeV <= 0.1) return 15;    // kV range
  if (energy_MeV <= 1) return 20;
  if (energy_MeV <= 6) return 37;
  if (energy_MeV <= 10) return 41;
  if (energy_MeV <= 15) return 44;
  if (energy_MeV <= 20) return 45;
  if (energy_MeV <= 25) return 46;
  return 47;
}

export function calculateMazeDose(config: MazeConfig): {
  totalDose_mSv_week: number;
  doseAtDoor_mSv_week: number;
  doorRequired: boolean;
  recommendedDoorPb_mm: number;
  segmentDetails: { segment: number; scatteredDose: number; cumulativeDose: number; pathLength_m: number }[];
  alaraCompliant: boolean;
} {
  const { workload_Gy_week, sourceDistance_m, entryArea_m2, segments, energy_MeV } = config;
  
  const H0_uSv = workload_Gy_week * 1000; // Convertir a microSv (asumiendo RBE=1)
  const TVL_cm = getTVL_cm(energy_MeV);
  
  let cumulativeDose = H0_uSv;
  let pathLength = sourceDistance_m;
  const details: { segment: number; scatteredDose: number; cumulativeDose: number; pathLength_m: number }[] = [];
  
  // Dosis inicial en la entrada del laberinto (scatter primario)
  const areaRatio = entryArea_m2 / (segments[0]?.width_m * segments[0]?.height_m || entryArea_m2);
  const distRatio = sourceDistance_m / (sourceDistance_m + (segments[0]?.length_m || 1));
  
  cumulativeDose *= areaRatio * (distRatio ** 2);
  
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    pathLength += seg.length_m;
    
    // Coeficiente de scattering para el angulo de esta vuelta (90° por defecto)
    const scatterCoeff = SCATTER_COEFF[90] || 0.05;
    
    // Atenuación geométrica y por scattering
    const prevArea = i === 0 ? entryArea_m2 : segments[i-1].width_m * segments[i-1].height_m;
    const currArea = seg.width_m * seg.height_m;
    const geometricFactor = (prevArea / currArea) * ((pathLength - seg.length_m) / pathLength) ** 2;
    
    // Atenuación por paredes del laberinto
    const wallAttenuation = 10 ** (-seg.wallThickness_m * 100 / TVL_cm);
    
    cumulativeDose *= scatterCoeff * geometricFactor * wallAttenuation;
    
    details.push({
      segment: i + 1,
      scatteredDose: cumulativeDose,
      cumulativeDose: cumulativeDose,
      pathLength_m: pathLength,
    });
  }
  
  // Dosis en la puerta (si existe)
  const doseAtDoor_mSv_week = cumulativeDose / 1000;
  
  // ¿Se necesita puerta? (si > 0.02 mSv/sem para área pública)
  const doorRequired = doseAtDoor_mSv_week > 0.02;
  
  // Espesor de Pb recomendado para puerta
  const TVL_Pb_cm = energy_MeV > 6 ? 5.7 : 4.0; // TVL plomo depende de energía
  const requiredTVLs = doorRequired ? Math.log10(doseAtDoor_mSv_week / 0.02) : 0;
  const recommendedDoorPb_mm = Math.max(0, requiredTVLs * TVL_Pb_cm * 10);
  
  // Cumple ALARA?
  const alaraCompliant = doseAtDoor_mSv_week <= 0.001; // 0.001 mSv/sem = ALARA
  
  return {
    totalDose_mSv_week: doseAtDoor_mSv_week,
    doseAtDoor_mSv_week,
    doorRequired,
    recommendedDoorPb_mm,
    segmentDetails: details,
    alaraCompliant,
  };
}

// Configuraciones predefinidas de laberintos estándar
export const MAZE_PRESETS = [
  {
    name: 'Laberinto simple 1 vuelta (90°)',
    description: 'Configuración básica con una sola vuelta de 90°. Usado para LINAC de baja energía (6 MV).',
    config: {
      sourceType: 'LINAC' as const, energy_MeV: 6, workload_Gy_week: 400,
      sourceDistance_m: 4.5, entryArea_m2: 8.0,
      useDoor: true,
      segments: [{ id: 1, width_m: 1.8, height_m: 2.4, length_m: 4.0, materialCode: 'CONCRETE235', wallThickness_m: 1.2 }],
    },
  },
  {
    name: 'Laberinto doble vuelta (L-shape)',
    description: 'Dos vueltas en forma de L. Estándar para LINAC de alta energía (15-18 MV).',
    config: {
      sourceType: 'LINAC' as const, energy_MeV: 15, workload_Gy_week: 800,
      sourceDistance_m: 5.0, entryArea_m2: 9.0,
      useDoor: true,
      segments: [
        { id: 1, width_m: 2.0, height_m: 2.4, length_m: 5.0, materialCode: 'CONCRETE235', wallThickness_m: 1.8 },
        { id: 2, width_m: 1.5, height_m: 2.4, length_m: 3.5, materialCode: 'CONCRETE235', wallThickness_m: 1.4 },
      ],
    },
  },
  {
    name: 'Laberinto triple vuelta (Z-shape)',
    description: 'Tres vueltas en forma de Z. Máxima protección para neutrones (20+ MV).',
    config: {
      sourceType: 'LINAC' as const, energy_MeV: 18, workload_Gy_week: 900,
      sourceDistance_m: 5.5, entryArea_m2: 10.0,
      useDoor: true,
      segments: [
        { id: 1, width_m: 2.2, height_m: 2.4, length_m: 5.5, materialCode: 'CONCRETE235', wallThickness_m: 2.2 },
        { id: 2, width_m: 1.8, height_m: 2.4, length_m: 4.0, materialCode: 'CONCRETE235', wallThickness_m: 1.8 },
        { id: 3, width_m: 1.5, height_m: 2.4, length_m: 3.0, materialCode: 'CONCRETE235', wallThickness_m: 1.5 },
      ],
    },
  },
];
