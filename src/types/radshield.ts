// RadShield-MX Unified Shielding Types
// Supports: NCRP 147 (Diagnostic X-ray), NCRP 151 (Therapy LINAC), Nuclear (PET, HDR, GK, Cyclotron)

// ============================
// MODALITIES
// ============================

export type ModalityCategory = 'diagnostic' | 'therapy' | 'nuclear' | 'cyclotron' | 'other';

export interface Modality {
  id: string;
  name: string;
  category?: ModalityCategory;
  description?: string;
  // Which calculation standard applies
  standard?: 'NCRP147' | 'NCRP151' | 'TG108' | 'AAPMTG56' | 'IAEA_SRS47';
  // For NCRP 147: K1 in mGy/patient at 1m
  // For NCRP 151: dose per fraction at isocenter in Gy
  // For Nuclear: dose rate constant in mSv·m²/GBq·h (Γ)
  doseRateConstant?: number;
  unit: string;
  energy_MeV?: number;
  energyLabel?: string;
  isocenterHeightDefault_m?: number;
  // For NCRP 147 workloads
  workloadDistribution?: string;
  // Legacy fields retained while older modules migrate to the canonical model.
  energies?: number[];
  typicalDose_mGy?: number;
  workloadDefault?: number;
  tvlData?: Record<string, number>;
}

export const MODALITIES: Modality[] = [
  // --- DIAGNOSTIC (NCRP 147) ---
  { id: 'rad-chest', name: 'Radiografía - Tórax PA', description: 'Radiografía - Tórax PA', category: 'diagnostic', standard: 'NCRP147', doseRateConstant: 0.17, unit: 'mGy/paciente', energyLabel: '125 kVp', isocenterHeightDefault_m: 1.2, workloadDistribution: 'Radiography - Chest PA' },
  { id: 'rad-abdomen', name: 'Radiografía - Abdomen', description: 'Radiografía - Abdomen', category: 'diagnostic', standard: 'NCRP147', doseRateConstant: 2.5, unit: 'mGy/paciente', energyLabel: '81 kVp', isocenterHeightDefault_m: 1.2, workloadDistribution: 'Radiography - Abdomen' },
  { id: 'rad-extremity', name: 'Radiografía - Extremidad', description: 'Radiografía - Extremidad', category: 'diagnostic', standard: 'NCRP147', doseRateConstant: 0.08, unit: 'mGy/paciente', energyLabel: '61 kVp', isocenterHeightDefault_m: 1.0, workloadDistribution: 'Radiography - Extremity' },
  { id: 'fluoro-routine', name: 'Fluoroscopia - Rutinaria', description: 'Fluoroscopia - Rutinaria', category: 'diagnostic', standard: 'NCRP147', doseRateConstant: 13.0, unit: 'mGy/paciente', energyLabel: '110 kVp', isocenterHeightDefault_m: 1.2, workloadDistribution: 'Fluoroscopy - Routine' },
  { id: 'fluoro-gi', name: 'Fluoroscopia - GI/Bario', description: 'Fluoroscopia - GI/Bario', category: 'diagnostic', standard: 'NCRP147', doseRateConstant: 46.0, unit: 'mGy/paciente', energyLabel: '110 kVp', isocenterHeightDefault_m: 1.2, workloadDistribution: 'Fluoroscopy - GI/Barium' },
  { id: 'mammo-cc', name: 'Mamografía - CC', description: 'Mamografía - CC', category: 'diagnostic', standard: 'NCRP147', doseRateConstant: 7.0, unit: 'mGy/paciente', energyLabel: '28 kVp Mo/Mo', isocenterHeightDefault_m: 1.0, workloadDistribution: 'Mammography - Craniocaudal' },
  { id: 'mammo-mlo', name: 'Mamografía - MLO', description: 'Mamografía - MLO', category: 'diagnostic', standard: 'NCRP147', doseRateConstant: 9.0, unit: 'mGy/paciente', energyLabel: '28 kVp Mo/Mo', isocenterHeightDefault_m: 1.0, workloadDistribution: 'Mammography - MLO' },
  { id: 'ct-head', name: 'CT - Cabeza', description: 'CT - Cabeza', category: 'diagnostic', standard: 'NCRP147', doseRateConstant: 50.0, unit: 'mGy/paciente (DLP)', energyLabel: '120-140 kVp', isocenterHeightDefault_m: 1.0, workloadDistribution: 'CT - Head' },
  { id: 'ct-body', name: 'CT - Cuerpo', description: 'CT - Cuerpo', category: 'diagnostic', standard: 'NCRP147', doseRateConstant: 350.0, unit: 'mGy/paciente (DLP)', energyLabel: '120-140 kVp', isocenterHeightDefault_m: 1.0, workloadDistribution: 'CT - Body' },

  // --- THERAPY (NCRP 151) ---
  { id: 'linac-6mv', name: 'LINAC - 6 MV', description: 'LINAC - 6 MV', category: 'therapy', standard: 'NCRP151', doseRateConstant: 2.0, unit: 'Gy/fracción isocentro', energyLabel: '6 MV X-rays', isocenterHeightDefault_m: 1.3 },
  { id: 'linac-10mv', name: 'LINAC - 10 MV', description: 'LINAC - 10 MV', category: 'therapy', standard: 'NCRP151', doseRateConstant: 2.0, unit: 'Gy/fracción isocentro', energyLabel: '10 MV X-rays', isocenterHeightDefault_m: 1.3 },
  { id: 'linac-15mv', name: 'LINAC - 15 MV', description: 'LINAC - 15 MV', category: 'therapy', standard: 'NCRP151', doseRateConstant: 2.0, unit: 'Gy/fracción isocentro', energyLabel: '15 MV X-rays', isocenterHeightDefault_m: 1.3 },
  { id: 'linac-18mv', name: 'LINAC - 18 MV', description: 'LINAC - 18 MV', category: 'therapy', standard: 'NCRP151', doseRateConstant: 2.0, unit: 'Gy/fracción isocentro', energyLabel: '18 MV X-rays', isocenterHeightDefault_m: 1.3 },
  { id: 'gamma-knife', name: 'Gamma Knife (Co-60)', description: 'Gamma Knife (Co-60)', category: 'therapy', standard: 'AAPMTG56', doseRateConstant: 1.5, unit: 'Gy/fracción isocentro', energyLabel: '1.25 MeV γ (Co-60)', isocenterHeightDefault_m: 1.5 },
  { id: 'hdr-192ir', name: 'Braquiterapia HDR - Ir-192', description: 'Braquiterapia HDR - Ir-192', category: 'therapy', standard: 'NCRP151', doseRateConstant: 0.111, unit: 'μGy·m²/MBq·h (Γδ kerma en aire)', energyLabel: '0.38 MeV γ (Ir-192)', isocenterHeightDefault_m: 1.0 },
  { id: 'ldr-cs137', name: 'Braquiterapia LDR - Cs-137', description: 'Braquiterapia LDR - Cs-137', category: 'therapy', standard: 'NCRP151', doseRateConstant: 0.0779, unit: 'μGy·m²/MBq·h (Γδ kerma en aire)', energyLabel: '0.66 MeV γ (Cs-137)', isocenterHeightDefault_m: 1.0 },

  // --- NUCLEAR MEDICINE (TG 108 / NCRP 147 adapted) ---
  { id: 'pet-f18', name: 'PET-CT - F-18 FDG', description: 'PET-CT - F-18 FDG', category: 'nuclear', standard: 'TG108', doseRateConstant: 0.143, unit: 'μSv·m²/MBq·h (Γ)', energyLabel: '511 keV γ (F-18)', isocenterHeightDefault_m: 1.0 },
  { id: 'pet-gallium', name: 'PET-CT - Ga-68', description: 'PET-CT - Ga-68', category: 'nuclear', standard: 'TG108', doseRateConstant: 0.134, unit: 'μSv·m²/MBq·h (Γ)', energyLabel: '511 keV γ (Ga-68)', isocenterHeightDefault_m: 1.0 },
  { id: 'spect-tc99m', name: 'Gamma Cámara - Tc-99m', description: 'Gamma Cámara - Tc-99m', category: 'nuclear', standard: 'TG108', doseRateConstant: 0.030, unit: 'μSv·m²/MBq·h (Γ)', energyLabel: '140 keV γ (Tc-99m)', isocenterHeightDefault_m: 1.0 },
  { id: 'radioiodine-i131', name: 'Radioiodoterapia - I-131', description: 'Radioiodoterapia - I-131', category: 'nuclear', standard: 'TG108', doseRateConstant: 0.059, unit: 'μSv·m²/MBq·h (Γ)', energyLabel: '364 keV γ (I-131)', isocenterHeightDefault_m: 1.0 },
  { id: 'lu177', name: 'Lutatera - Lu-177', description: 'Lutatera - Lu-177', category: 'nuclear', standard: 'TG108', doseRateConstant: 0.005, unit: 'μSv·m²/MBq·h (Γ)', energyLabel: '208 keV γ (Lu-177)', isocenterHeightDefault_m: 1.0 },
  { id: 'radioyttrium-y90', name: 'Radioembolización - Y-90', description: 'Radioembolización - Y-90', category: 'nuclear', standard: 'TG108', doseRateConstant: 0.001, unit: 'μSv·m²/MBq·h (Γ)', energyLabel: 'β- + bremsstrahlung (Y-90)', isocenterHeightDefault_m: 1.0 },

  // --- CYCLOTRON ---
  { id: 'cyclotron-16mev', name: 'Ciclotrón - 16 MeV protones', description: 'Ciclotrón - 16 MeV protones', category: 'cyclotron', standard: 'IAEA_SRS47', doseRateConstant: 1000.0, unit: 'μSv/h @ 1m (neutrones+γ)', energyLabel: '16 MeV p → F-18', isocenterHeightDefault_m: 2.0 },
  { id: 'cyclotron-11mev', name: 'Ciclotrón - 11 MeV protones', description: 'Ciclotrón - 11 MeV protones', category: 'cyclotron', standard: 'IAEA_SRS47', doseRateConstant: 300.0, unit: 'μSv/h @ 1m (neutrones+γ)', energyLabel: '11 MeV p → C-11/N-13', isocenterHeightDefault_m: 2.0 },
];

// ============================
// MATERIALS
// ============================

export interface ShieldingMaterial {
  name: string;
  code: string;
  density: number; // g/cm3
  density_kg_m3?: number; // legacy SI alias
  // Archer params for NCRP 147 (diagnostic X-ray): α y β en mm⁻¹, γ adimensional
  archerAlpha?: number;
  archerBeta?: number;
  archerGamma?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  // TVL values for NCRP 151 (therapy) in mm
  TVL_mm?: Record<string, number>; // by energy key: "6MV", "10MV", "15MV", "18MV", "Co60", "Ir192", "511keV", etc.
  tvl_mm?: number; // legacy scalar alias
  // HVL for nuclear gamma sources (mm)
  HVL_mm?: Record<string, number>;
  // Cost
  cost_per_m3: number; // USD/m³
  cost_per_kg: number;  // USD/kg
  color: string;
  category: string;
  manufacturer?: string;
  certifiedLab?: string; // e.g. "IMCYC EMA C-053-039/11"
}

export type Material = ShieldingMaterial;

export const MATERIALS: ShieldingMaterial[] = [
  // --- CONVENTIONAL ---
  {
    name: "Concreto normal (2.35 g/cm³)",
    code: "CONCRETE235",
    density: 2.35,
    archerAlpha: 0.0383, archerBeta: 0.0141, archerGamma: 1.099,
    // TVL₁ de NCRP 151 Tabla B.2 (p. 161) para MV y Co-60; 511 keV de TG-108 (TVL 17.6 cm); Ir-192 de IAEA SRS-47
    // (152 mm; antes 110 mm, por debajo del TVL de haz ancho: subestimaba el espesor de HDR ≈ 28 %). Resto: provisional.
    TVL_mm: { "6MV": 370, "10MV": 410, "15MV": 440, "18MV": 450, "Co60": 210, "Ir192": 152, "511keV": 176, "140keV": 45, "364keV": 140 },
    cost_per_m3: 180, cost_per_kg: 0.08,
    color: "#9CA3AF",
    category: "Convencional"
  },
  {
    name: "Concreto pesado barita (3.5 g/cm³)",
    code: "CONCRETEBARITE",
    density: 3.5,
    TVL_mm: { "6MV": 250, "10MV": 265, "15MV": 295, "18MV": 325, "Co60": 155, "Ir192": 78, "511keV": 120 },
    cost_per_m3: 450, cost_per_kg: 0.13,
    color: "#6B7280",
    category: "Convencional"
  },
  {
    name: "Concreto pesado hierro (4.5 g/cm³)",
    code: "CONCRETEIRON",
    density: 4.5,
    TVL_mm: { "6MV": 200, "10MV": 210, "15MV": 235, "18MV": 260, "Co60": 124, "Ir192": 62, "511keV": 96 },
    cost_per_m3: 650, cost_per_kg: 0.14,
    color: "#4B5563",
    category: "Convencional"
  },
  {
    name: "Plomo laminado (Pb)",
    code: "PB",
    density: 11.34,
    archerAlpha: 2.246, archerBeta: 6.31, archerGamma: 0.629,
    // NCRP 151 Tabla B.2: 5.7 cm para 4–30 MV y 4.0 cm para Co-60 (antes 11.3 mm: 3.5× bajo). 511 keV: NCRP/TG-108
    // 16.6 mm (antes 11.8). Ir-192, Tc-99m e I-131: valores de manual (Delacroix 2002), PROVISIONALES —
    // los anteriores (3.0, 0.3, 2.0 mm) eran HVL o menos; verificar con fuente en GAMMA.
    TVL_mm: { "6MV": 57, "10MV": 57, "15MV": 57, "18MV": 57, "Co60": 40, "Ir192": 16, "511keV": 16.6, "140keV": 1.0, "364keV": 11 },
    cost_per_m3: 8500, cost_per_kg: 0.75,
    color: "#374151",
    category: "Convencional"
  },
  {
    name: "Acero (placas estructurales)",
    code: "STEEL",
    density: 7.87,
    // NCRP 151 Tabla B.2 (acero 7.87 g/cm³): 10 cm a 6 MV, 11 cm ≥10 MV, 7.0 cm Co-60; 511 keV: TG-108 (6.5 cm);
    // Ir-192: IAEA SRS-47 (43 mm; antes 28 mm, menor que el TVL de haz estrecho).
    TVL_mm: { "6MV": 100, "10MV": 110, "15MV": 110, "18MV": 110, "Co60": 70, "Ir192": 43, "511keV": 65 },
    cost_per_m3: 3200, cost_per_kg: 0.41,
    color: "#1F2937",
    category: "Convencional"
  },
  {
    name: "Ladrillo refractario",
    code: "BRICK",
    density: 2.1,
    TVL_mm: { "6MV": 400, "10MV": 420, "15MV": 470, "18MV": 510 },
    cost_per_m3: 120, cost_per_kg: 0.06,
    color: "#B45309",
    category: "Convencional"
  },
  {
    name: "Vidrio plomado",
    code: "LEADGLASS",
    density: 4.8,
    archerAlpha: 2.0, archerBeta: 5.5, archerGamma: 0.65,
    TVL_mm: { "6MV": 65, "10MV": 75, "15MV": 90, "18MV": 100 },
    cost_per_m3: 15000, cost_per_kg: 3.1,
    color: "#0D9488",
    category: "Convencional"
  },
  {
    name: "Yeso / Tablaroca",
    code: "GYPSUM",
    density: 0.72,
    archerAlpha: 0.0085, archerBeta: 0.0035, archerGamma: 1.05,
    cost_per_m3: 80, cost_per_kg: 0.11,
    color: "#F59E0B",
    category: "Convencional"
  },
  {
    name: "Drywall / Sheetrock (1/2\" - 16 mm)",
    code: "DRYWALL",
    density: 0.72,
    archerAlpha: 0.0065, archerBeta: 0.0025, archerGamma: 1.08,
    TVL_mm: { "6MV": 850, "10MV": 900, "15MV": 1000, "18MV": 1100 },
    cost_per_m3: 25, cost_per_kg: 0.035,
    color: "#D4C4A8",
    category: "Convencional",
    manufacturer: "USG / Sheetrock"
  },

  // --- NELCO ---
  {
    name: "NELCO HD Block 2.32 (MegaShield)",
    code: "NELCO232",
    density: 2.32,
    TVL_mm: { "6MV": 355, "10MV": 375, "15MV": 415, "18MV": 455 },
    cost_per_m3: 2800, cost_per_kg: 1.21,
    color: "#7C3AED",
    category: "NELCO",
    manufacturer: "NELCO Worldwide"
  },
  {
    name: "NELCO HD Block 3.20 (UltraShield)",
    code: "NELCO320",
    density: 3.2,
    TVL_mm: { "6MV": 260, "10MV": 275, "15MV": 305, "18MV": 335 },
    cost_per_m3: 3800, cost_per_kg: 1.19,
    color: "#6D28D9",
    category: "NELCO",
    manufacturer: "NELCO Worldwide"
  },

  // --- VERITAS ---
  {
    name: "VERITAS VeriShield V150 (4.50 g/cm³)",
    code: "VERITAS450",
    density: 4.5,
    TVL_mm: { "6MV": 190, "10MV": 200, "15MV": 225, "18MV": 250, "Co60": 115, "Ir192": 58, "511keV": 90 },
    cost_per_m3: 4500, cost_per_kg: 1.0,
    color: "#BE185D",
    category: "VERITAS",
    manufacturer: "VERITAS Medical Solutions"
  },
  {
    name: "VERITAS VeriShield V300 (5.00 g/cm³)",
    code: "VERITAS500",
    density: 5.0,
    TVL_mm: { "6MV": 170, "10MV": 180, "15MV": 200, "18MV": 220, "Co60": 104, "Ir192": 52, "511keV": 82 },
    cost_per_m3: 5200, cost_per_kg: 1.04,
    color: "#9D174D",
    category: "VERITAS",
    manufacturer: "VERITAS Medical Solutions"
  },

  // --- TM-NIPOL (Certificados IMCYC) ---
  {
    name: "TM-NIPOL TD-350 (3.5 g/cm³)",
    code: "NIPOL350",
    density: 3.5,
    TVL_mm: { "6MV": 246, "10MV": 278, "15MV": 301, "18MV": 308, "Co60": 150, "Ir192": 75, "511keV": 117 },
    cost_per_m3: 1200, cost_per_kg: 0.34,
    color: "#0369A1",
    category: "TM-NIPOL",
    manufacturer: "Troquelados y Metales NIPOL",
    certifiedLab: "IMCYC EMA C-053-039/11"
  },
  {
    name: "TM-NIPOL TD-400 (4.0 g/cm³)",
    code: "NIPOL400",
    density: 4.0,
    TVL_mm: { "6MV": 218, "10MV": 244, "15MV": 263, "18MV": 269, "Co60": 133, "Ir192": 67, "511keV": 104 },
    cost_per_m3: 1500, cost_per_kg: 0.38,
    color: "#075985",
    category: "TM-NIPOL",
    manufacturer: "Troquelados y Metales NIPOL",
    certifiedLab: "IMCYC EMA C-053-039/11"
  },
  {
    name: "TM-NIPOL TD-500 (5.0 g/cm³)",
    code: "NIPOL500",
    density: 5.0,
    TVL_mm: { "6MV": 175, "10MV": 195, "15MV": 210, "18MV": 216 },
    cost_per_m3: 2200, cost_per_kg: 0.44,
    color: "#0C4A6E",
    category: "TM-NIPOL",
    manufacturer: "Troquelados y Metales NIPOL",
    certifiedLab: "IMCYC EMA C-053-039/11"
  },

  // --- SPECIAL NUCLEAR ---
  {
    name: "Borated Polyethylene (5% B)",
    code: "BPE",
    density: 0.95,
    TVL_mm: { "neutron": 45 },
    cost_per_m3: 1800, cost_per_kg: 1.89,
    color: "#10B981",
    category: "Nuclear especial"
  },
  {
    name: "Polietileno con plomo (Pb-PE)",
    code: "PBPE",
    density: 3.5,
    TVL_mm: { "neutron": 35, "511keV": 85 },
    cost_per_m3: 3500, cost_per_kg: 1.0,
    color: "#059669",
    category: "Nuclear especial"
  },
];

// ============================
// NCRP 147 (Diagnostic) - Workloads
// ============================

export interface WorkloadDistribution {
  name: string;
  description: string;
  kVpRanges: { min: number; max: number; pct: number }[];
  K1: number; // mGy/patient at 1m
}

export const WORKLOAD_DISTRIBUTIONS: WorkloadDistribution[] = [
  { name: "Radiography - Chest PA", description: "Radiografia de torax PA - 125 kVp", K1: 0.17, kVpRanges: [{ min: 100, max: 150, pct: 100 }] },
  { name: "Radiography - Abdomen", description: "Radiografia de abdomen - 81 kVp", K1: 2.5, kVpRanges: [{ min: 60, max: 100, pct: 100 }] },
  { name: "Radiography - Extremity", description: "Radiografia de extremidad - 61 kVp", K1: 0.08, kVpRanges: [{ min: 50, max: 70, pct: 100 }] },
  { name: "Fluoroscopy - Routine", description: "Fluoroscopia rutinaria - 110 kVp", K1: 13.0, kVpRanges: [{ min: 80, max: 125, pct: 100 }] },
  { name: "Fluoroscopy - GI/Barium", description: "Fluoroscopia GI/bario - 110 kVp", K1: 46.0, kVpRanges: [{ min: 80, max: 125, pct: 100 }] },
  { name: "Mammography - Craniocaudal", description: "Mamografia CC - 28 kVp", K1: 7.0, kVpRanges: [{ min: 20, max: 35, pct: 100 }] },
  { name: "Mammography - MLO", description: "Mamografia MLO - 28 kVp", K1: 9.0, kVpRanges: [{ min: 20, max: 35, pct: 100 }] },
  { name: "CT - Head", description: "CT cabeza - DLP", K1: 50.0, kVpRanges: [{ min: 120, max: 140, pct: 100 }] },
  { name: "CT - Body", description: "CT cuerpo - DLP", K1: 350.0, kVpRanges: [{ min: 120, max: 140, pct: 100 }] },
];

// ============================
// OCCUPANCY & DESIGN GOALS
// ============================

export const OCCUPANCY_FACTORS = [
  { name: "Control room - full time", value: 1.0, description: "Sala de control, laboratorio" },
  { name: "Office - full time", value: 1.0, description: "Oficinas, consultorios" },
  { name: "Patient waiting area", value: 1.0, description: "Sala de espera de pacientes" },
  { name: "Corridor - patient", value: 0.5, description: "Pasillo de pacientes" },
  { name: "Corridor - public", value: 0.2, description: "Pasillo público" },
  { name: "Public toilet", value: 0.2, description: "Baño público" },
  { name: "Storage room", value: 0.2, description: "Almacén" },
  { name: "Outdoor - public", value: 0.2, description: "Exterior público" },
  { name: "Parking", value: 0.025, description: "Estacionamiento" },
  { name: "Stairway", value: 0.05, description: "Escalera" },
  { name: "Elevator", value: 0.05, description: "Elevador" },
  { name: "Unattended waiting", value: 0.125, description: "Sala de espera desatendida" }
];

export const DESIGN_GOALS = [
  { name: "ALARA (0.001 mSv/sem = 0.05 mSv/año)", value: 0.001, description: "Límite ALARA — objetivo más allá de lo regulatorio" },
  { name: "Controlled area (0.1 mSv/sem)", value: 0.1, description: "Área controlada" },
  { name: "Public area (0.02 mSv/sem)", value: 0.02, description: "Área pública" },
  { name: "Very low (0.01 mSv/sem)", value: 0.01, description: "Área muy restringida" },
  { name: "Custom", value: 0.05, description: "Valor personalizado" }
];

// ============================
// CANVAS OBJECTS
// ============================

export interface RadiationSource {
  id: string;
  x: number; // canvas pixels
  y: number;
  name: string;
  modality: Modality;
  // For diagnostic: patients per week
  // For therapy: fractions per week
  // For nuclear: activity in MBq (average)
  workloadValue: number;
  workloadUnit: string;
  isocenterHeight_m: number;
  useFactor: number; // U factor for therapy primary barriers
  workloadHoursPerWeek?: number; // for HDR / nuclear
  // CAD-like canvas metadata
  rotationDeg?: number;
  footprint_m?: { width: number; depth: number };
  manufacturerVariant?: string;
  // CT-DLP specific (Fase 2)
  ctDLP_mGy_cm?: number;        // Dose Length Product per scan
  ctScansPerPatient?: number;   // number of scan series per patient
  // Nuclear specific (Fase 2)
  nuclearActivity_GBq?: number; // for PET/SPECT/radioiodine
  // AAPM TG-108 por paciente (PET): si existe, sustituye a «actividad × horas» (sin decaimiento ni paciente)
  tg108?: { A0_MBq: number; pacientesSemana: number; tU_h: number; tI_h: number; sala: 'captacion' | 'imagen' };
  // NCRP 151 Ec. 3.6: fracción de la carga con IMRT y factor C_I (por omisión 0.5 y 5)
  imrtFraction?: number;
  imrtFactor?: number;
  // Motor de campo (Fase 2): orientación en planta del eje de rotación del gantry (grados, 0 = +x del
  // lienzo). Si existe, la primaria sólo llega a la franja que barre el haz; si no, a las barreras primarias.
  ejeGantry_deg?: number;
}

export interface Barrier {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
  name: string;
  barrierType: 'primary' | 'secondary' | 'leakage' | 'scatter' | 'nuclear';
  useFactor: number; // U
  occupancyFactor: number; // T
  // NCRP 151: ángulo de dispersión del paciente para barreras secundarias (por omisión 30°, conservador)
  scatterAngle_deg?: number;
  designGoal_mSv_per_wk: number; // P
  materialCode: string; // selected material code
  points?: SamplePoint[];
  maxKerma?: number;
  requiredThickness_mm?: Record<string, number> | number; // can be per-material or single value
  thickness_mm?: number; // legacy input/template alias
  material?: string;
  width?: number;
  x?: number;
  y?: number;
  // v38: Mosaic Atomics extensions
  workloadFactor?: number;
  leadEquivalent_mm?: number;
  leadEquivalence_mm?: number;
  concreteEquivalent_mm?: number;
  // F58: controlled-zone feasibility/planning metadata used by reports.
  radshieldGenerated?: boolean;
  controlledZonePlanId?: string;
  controlledZoneElement?: 'north' | 'south' | 'east' | 'west' | 'ceiling' | 'floor';
  structuralElement?: 'wall' | 'ceiling' | 'floor';
  reportNote?: string;
  // F86: preset provenance for canvas QA and analytic-memory evidence.
  shieldingPresetId?: string;
  shieldingPresetName?: string;
  shieldingLayers?: { materialCode: string; thickness_mm: number }[];
  shieldingPresetNote?: string;
  // F192: optional calculation hardening evidence for reports and Memoria IA.
  calculationTrace?: CalculationTrace;
  calculationWarnings?: CalculationInputWarning[];
  calculationComparison?: CalculationComparison;
  calculationUnitSnapshot?: CalculationUnitSnapshot;
  calculationCacheKey?: string;
}

export interface CalculationInputWarning {
  field: string;
  severity: 'warning' | 'error';
  message: string;
}

export interface CalculationTrace {
  formulaId: string;
  standard: string;
  modalityCategory: ModalityCategory | 'unknown';
  energyKey: string;
  sourceCount: number;
  materialCount: number;
  samplePointCount: number;
  assumptions: string[];
  citationIds: string[];
  inputs: Record<string, number | string | boolean>;
  outputs: Record<string, number | string | boolean>;
}

export interface CalculationComparison {
  method: 'base-vs-conservative';
  baseThickness_mm: number;
  conservativeThickness_mm: number;
  delta_mm: number;
  deltaPercent: number;
  dominant: 'base' | 'conservative';
  note: string;
}

export interface CalculationUnitSnapshot {
  scale_m_per_pixel: number;
  barrierLength_m: number;
  sampleOffset_m: number;
  minSourceDistance_m: number;
  maxKerma_mSv_per_wk: number;
  maxKerma_uSv_per_h_40h: number;
  selectedThickness_mm: number;
  selectedThickness_cm: number;
  density_g_cm3: number;
  density_kg_m3: number;
  mass_kg_per_m2: number;
  cost_per_m2: number;
  structuralLoad_kPa: number;
}

export interface SamplePoint {
  x: number; y: number;
  kerma_mSv_per_wk: number;
  requiredThickness_mm: Record<string, number>;
  distanceFromBarrier_m: number;
}

export interface OccupiedRegion {
  id: string;
  points: { x: number; y: number }[];
  name: string;
  occupancyFactor: number;
  designGoal_mSv_per_wk: number;
}

export interface CriticalPoint {
  id: string;
  x: number;
  y: number;
  name: string;
  occupancyFactor: number;
  designGoal_mSv_per_wk: number;
  pointType: 'public' | 'controlled' | 'poe' | 'storage' | 'custom';
  enabled?: boolean;
  notes?: string;
}

export interface FloorPlan {
  id: string;
  name: string;
  imageUrl: string | null;
  scale_m_per_pixel: number;
  width_pixels: number;
  height_pixels: number;
  barriers: Barrier[];
  sources: RadiationSource[];
  occupiedRegions: OccupiedRegion[];
  regions?: OccupiedRegion[];
  criticalPoints?: CriticalPoint[];
  importMetadata?: {
    source?: 'dxf' | 'dwg' | 'ifc' | 'step' | 'manual' | 'unknown';
    fileName?: string;
    mode?: 'light' | 'full' | 'preview';
    status?: 'preliminary' | 'final';
    mappedBarriers?: number;
    importedAt?: string;
    confirmedAt?: string;
    calculationStatus?: 'not-started' | 'blocked-no-source' | 'running' | 'complete' | 'error';
    calculatedAt?: string;
    calculatedBarriers?: number;
    calculationMessage?: string;
    warnings?: string[];
  };
}
