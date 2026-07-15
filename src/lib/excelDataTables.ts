// =============================================================================
// excelDataTables.ts — Tablas de referencia migradas desde Excel (v14.2)
// CARGAS_TRABAJO, DECAIMIENTO_FUENTES, COMPARATIVO_NORMATIVO
// =============================================================================

// ── Cargas de trabajo típicas por modalidad (NCRP 151 Tabla 4.1+) ──
export interface WorkloadEntry {
  modality: string;
  equipment: string;
  W_Gy_per_week: number;
  patients_per_week: number;
  hours_per_week: number;
  source: string;
}

export const WORKLOAD_TABLE: WorkloadEntry[] = [
  { modality: 'LINAC', equipment: 'Convencional (3D-CRT)', W_Gy_per_week: 450, patients_per_week: 25, hours_per_week: 40, source: 'NCRP 151 §4.5' },
  { modality: 'LINAC', equipment: 'IMRT', W_Gy_per_week: 450, patients_per_week: 25, hours_per_week: 50, source: 'NCRP 151 §4.5 (C₁=2.5)' },
  { modality: 'LINAC', equipment: 'VMAT/RapidArc', W_Gy_per_week: 450, patients_per_week: 25, hours_per_week: 45, source: 'NCRP 151 §4.5 (C₁=4.0)' },
  { modality: 'LINAC', equipment: 'SBRT/SABR', W_Gy_per_week: 100, patients_per_week: 5, hours_per_week: 10, source: 'NCRP 151 §4.5 (C₁=5.0)' },
  { modality: 'LINAC', equipment: 'SRS (mono-sesión)', W_Gy_per_week: 50, patients_per_week: 10, hours_per_week: 8, source: 'NCRP 151 §4.5 (C₁=8.0)' },
  { modality: 'Gamma Knife', equipment: 'Co-60 (201 fuentes)', W_Gy_per_week: 20, patients_per_week: 15, hours_per_week: 20, source: 'NCRP 151 §4.8.6' },
  { modality: 'HDR', equipment: 'Ir-192 Flexitron', W_Gy_per_week: 40, patients_per_week: 8, hours_per_week: 15, source: 'IAEA TECDOC 1274' },
  { modality: 'PET-CT', equipment: 'F-18 FDG', W_Gy_per_week: 0, patients_per_week: 20, hours_per_week: 40, source: 'AAPM TG-108' },
  { modality: 'CT', equipment: 'Siemens SOMATOM', W_Gy_per_week: 0, patients_per_week: 80, hours_per_week: 50, source: 'NCRP 147 §5.6' },
  { modality: 'Mamografía', equipment: 'Digital', W_Gy_per_week: 0, patients_per_week: 60, hours_per_week: 35, source: 'NCRP 147 §5.2' },
  { modality: 'RX', equipment: 'General radiografía', W_Gy_per_week: 0, patients_per_week: 100, hours_per_week: 40, source: 'NCRP 147 §4.2' },
  { modality: 'Ciclotrón', equipment: 'IBA KIUBE 100', W_Gy_per_week: 0, patients_per_week: 0, hours_per_week: 168, source: 'IBA MID 55672 Rev G' },
];

// ── Tablas de decaimiento radionuclidos ──
export interface DecayEntry {
  radionuclide: string;
  half_life: string;
  half_life_hours: number;
  gamma_energy_keV: string;
  gamma_constant_uSv_m2_per_GBq_h: number;
  air_kerma_Gy_m2_per_GBq_h: number;
}

export const DECAY_TABLE: DecayEntry[] = [
  { radionuclide: 'Co-60', half_life: '5.27 años', half_life_hours: 46160, gamma_energy_keV: '1173 + 1333', gamma_constant_uSv_m2_per_GBq_h: 0.308, air_kerma_Gy_m2_per_GBq_h: 0.00078 },
  { radionuclide: 'Cs-137', half_life: '30.1 años', half_life_hours: 263500, gamma_energy_keV: '662', gamma_constant_uSv_m2_per_GBq_h: 0.077, air_kerma_Gy_m2_per_GBq_h: 0.00019 },
  { radionuclide: 'Ir-192', half_life: '73.8 días', half_life_hours: 1771, gamma_energy_keV: '316 (avg)', gamma_constant_uSv_m2_per_GBq_h: 0.111, air_kerma_Gy_m2_per_GBq_h: 0.00028 },
  { radionuclide: 'I-131', half_life: '8.02 días', half_life_hours: 192, gamma_energy_keV: '364', gamma_constant_uSv_m2_per_GBq_h: 0.059, air_kerma_Gy_m2_per_GBq_h: 0.00015 },
  { radionuclide: 'Tc-99m', half_life: '6.01 h', half_life_hours: 6.01, gamma_energy_keV: '140', gamma_constant_uSv_m2_per_GBq_h: 0.030, air_kerma_Gy_m2_per_GBq_h: 0.000076 },
  { radionuclide: 'F-18', half_life: '109.8 min', half_life_hours: 1.83, gamma_energy_keV: '511 (β⁺)', gamma_constant_uSv_m2_per_GBq_h: 0.143, air_kerma_Gy_m2_per_GBq_h: 0.00036 },
  { radionuclide: 'Ga-68', half_life: '68.0 min', half_life_hours: 1.13, gamma_energy_keV: '511 (β⁺)', gamma_constant_uSv_m2_per_GBq_h: 0.134, air_kerma_Gy_m2_per_GBq_h: 0.00034 },
  { radionuclide: 'Lu-177', half_life: '6.65 días', half_life_hours: 160, gamma_energy_keV: '208', gamma_constant_uSv_m2_per_GBq_h: 0.005, air_kerma_Gy_m2_per_GBq_h: 0.000013 },
  { radionuclide: 'Y-90', half_life: '64.0 h', half_life_hours: 64.0, gamma_energy_keV: 'Beta (β⁻)', gamma_constant_uSv_m2_per_GBq_h: 0.001, air_kerma_Gy_m2_per_GBq_h: 0.000003 },
  { radionuclide: 'Ra-223', half_life: '11.4 días', half_life_hours: 274, gamma_energy_keV: '154-440', gamma_constant_uSv_m2_per_GBq_h: 0.026, air_kerma_Gy_m2_per_GBq_h: 0.000066 },
];

// ── Comparativa normativa México vs USA vs Europa ──
export interface NormativaComparison {
  parameter: string;
  mexico: string;
  usa: string;
  europe: string;
  notes?: string;
}

export const NORMATIVA_COMPARISON: NormativaComparison[] = [
  { parameter: 'Límite POE (mSv/año)', mexico: '20 (NOM-008)', usa: '5 (10 CFR 20)', europe: '20 (EURATOM)', notes: 'México permite 4× más que USA' },
  { parameter: 'Límite Público (mSv/año)', mexico: '5 (NOM-008)', usa: '1 (NCRP 116)', europe: '1 (ICRP 103)', notes: 'México 5× más permisivo' },
  { parameter: 'Límite Embarazo (mSv)', mexico: '2 post-concepción', usa: '5 durante embarazo', europe: '1 (ICRP 84)', notes: 'México más estricto' },
  { parameter: 'Referencia blindaje terapia', mexico: 'NOM-040-NUCL', usa: 'NCRP 151', europe: 'IAEA SRS 47' },
  { parameter: 'Referencia blindaje diag', mexico: 'NOM-033-NUCL', usa: 'NCRP 147', europe: 'ICRP 33' },
  { parameter: 'Verificación MC permitida', mexico: 'Sí (±20%)', usa: 'Sí (±20%)', europe: 'Sí (±25%)', notes: 'CNSNS-LA-001/2018' },
  { parameter: 'Calibración obligatoria', mexico: 'TG-51 / TRS-398', usa: 'TG-51', europe: 'TRS-398' },
  { parameter: 'Blindaje neutrones >10 MV', mexico: 'Recomendado', usa: 'Obligatorio', europe: 'Obligatorio', notes: 'NCRP 151 §5.3' },
  { parameter: 'Laberinto obligatorio LINAC', mexico: 'Recomendado', usa: 'Obligatorio', europe: 'Recomendado', notes: 'Para >10 MV' },
  { parameter: 'Área mínima búnker LINAC', mexico: '30 m²', usa: '35 m² (Varian)', europe: '32 m²', notes: 'Dimensiones recomendadas' },
];
