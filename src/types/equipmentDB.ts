// Base de datos de equipos comerciales — parametros pre-cargados
// v13.8: Agregadas URLs de imagen para visualización en validador de planos
export interface CommercialEquipment {
  id: string;
  manufacturer: string;
  model: string;
  category: 'LINAC' | 'CT' | 'PET-CT' | 'GammaKnife' | 'HDR' | 'Mammography' | 'Cyclotron' | 'SPECT';
  modality: string; // matches modality.id in radshield.ts
  energy_MeV_or_kVp: string;
  doseRate_Gy_min?: number;
  maxFieldSize_cm: string;
  tvlConcrete_cm_6MV?: number;
  tvlConcrete_cm_10MV?: number;
  leakagePercent?: number;
  workload_Gy_week?: number;
  imageUrl?: string;
  datasheetUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAPA DE IMÁGENES POR MODELO — v13.8
// ═══════════════════════════════════════════════════════════════════════════════
const EQUIPMENT_IMAGE_MAP: Record<string, string> = {
  'TrueBeam': '/equipment-images/3_TrueBeam_Linear_Accelerator_Radiotherapy.png',
  'TrueBeam STx': '/equipment-images/3_TrueBeam_Linear_Accelerator_Radiotherapy.png',
  'Halcyon': '/equipment-images/3_TrueBeam_Linear_Accelerator_Radiotherapy.png',
  'Edge': '/equipment-images/3_TrueBeam_Linear_Accelerator_Radiotherapy.png',
  'Versa HD': '/equipment-images/5_Refurbished_Elekta_Versa_HD_Linear.png',
  'Infinity': '/equipment-images/5_Refurbished_Elekta_Versa_HD_Linear.png',
  'Unity MR-Linac': '/equipment-images/5_Refurbished_Elekta_Versa_HD_Linear.png',
  'Leksell Gamma Knife Icon': '/equipment-images/7_Leksell_Gamma_Knife_Icon_.png',
  'Leksell Gamma Knife Esprit': '/equipment-images/7_Leksell_Gamma_Knife_Icon_.png',
  'Flexitron HDR': '/equipment-images/4_Elekta_Flexitron_Afterloader_For.png',
  'Bravos HDR': '/equipment-images/4_Elekta_Flexitron_Afterloader_For.png',
  'Biograph Vision Quadra': '/equipment-images/1_Biograph_Vision_PET_CT_Scanner.png',
  'Discovery MI': '/equipment-images/1_Biograph_Vision_PET_CT_Scanner.png',
  'Vereos PET/CT': '/equipment-images/1_Biograph_Vision_PET_CT_Scanner.png',
  'SOMATOM Force': '/equipment-images/6_CT_Scanners_National_Imaging_Solution.png',
  'SOMATOM X.ceed': '/equipment-images/6_CT_Scanners_National_Imaging_Solution.png',
  'SOMATOM Edge Plus': '/equipment-images/6_CT_Scanners_National_Imaging_Solution.png',
  'Revolution CT': '/equipment-images/6_CT_Scanners_National_Imaging_Solution.png',
  'IQon Spectral CT': '/equipment-images/6_CT_Scanners_National_Imaging_Solution.png',
  'Aquilion Exceed LB': '/equipment-images/6_CT_Scanners_National_Imaging_Solution.png',
  'Senographe Pristina': '/equipment-images/2_Selenia_Dimensions_Mammography_System.png',
  'Selenia Dimensions': '/equipment-images/2_Selenia_Dimensions_Mammography_System.png',
  'Symbia Evo Excel': '/equipment-images/3_NM_CT_860_SPECT_CT_Sytem_GE_HealthCare.png',
  'Symbia Intevo Bold': '/equipment-images/3_NM_CT_860_SPECT_CT_Sytem_GE_HealthCare.png',
  'NM/CT 870 CZT': '/equipment-images/3_NM_CT_860_SPECT_CT_Sytem_GE_HealthCare.png',
  'Cyclone Kiube': '/equipment-images/1_Cyclone_KIUBE_IBA_Radio_Pharma_Solution.png',
  'PETtrace 800': '/equipment-images/1_Cyclone_KIUBE_IBA_Radio_Pharma_Solution.png',
  'Oncor Impression Plus': '/equipment-images/5_Refurbished_Elekta_Versa_HD_Linear.png',
  'Primus': '/equipment-images/5_Refurbished_Elekta_Versa_HD_Linear.png',
  'PrimArt': '/equipment-images/5_Refurbished_Elekta_Versa_HD_Linear.png',
  'VitalBeam': '/equipment-images/6_Linear_Accelerator_Cancer_Treatment.png',
  'Artiste': '/equipment-images/5_Refurbished_Elekta_Versa_HD_Linear.png',
  'OASIS Open': '/equipment-images/6_CT_Scanners_National_Imaging_Solution.png',
  'Magnetom RT Pro edition (1.5T)': '/equipment-images/6_CT_Scanners_National_Imaging_Solution.png',
  'Molecular Imaging Biograph Horizon': '/equipment-images/1_Biograph_Vision_PET_CT_Scanner.png',
  'Philips Ingenia MR-RT (con Unity)': '/equipment-images/5_Refurbished_Elekta_Versa_HD_Linear.png',
};

function getEquipmentImageUrl(model: string): string | undefined {
  return EQUIPMENT_IMAGE_MAP[model];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE DE DATOS DE EQUIPOS
// ═══════════════════════════════════════════════════════════════════════════════
export const COMMERCIAL_EQUIPMENT: CommercialEquipment[] = [
  // --- VARIAN ---
  { id: 'varian-truebeam', manufacturer: 'Varian', model: 'TrueBeam', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '6 MV', doseRate_Gy_min: 24, maxFieldSize_cm: '40x40', tvlConcrete_cm_6MV: 37, tvlConcrete_cm_10MV: 41, leakagePercent: 0.1, workload_Gy_week: 400, imageUrl: getEquipmentImageUrl('TrueBeam') },
  { id: 'varian-truebeam-stx', manufacturer: 'Varian', model: 'TrueBeam STx', category: 'LINAC', modality: 'linac-10mv', energy_MeV_or_kVp: '6/10 MV FFF', doseRate_Gy_min: 24, maxFieldSize_cm: '40x40', tvlConcrete_cm_6MV: 37, tvlConcrete_cm_10MV: 41, leakagePercent: 0.1, workload_Gy_week: 500, imageUrl: getEquipmentImageUrl('TrueBeam STx') },
  { id: 'varian-halcyon', manufacturer: 'Varian', model: 'Halcyon', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '6 MV FFF', doseRate_Gy_min: 8, maxFieldSize_cm: '28x28', tvlConcrete_cm_6MV: 37, leakagePercent: 0.1, workload_Gy_week: 350, imageUrl: getEquipmentImageUrl('Halcyon') },
  { id: 'varian-edge', manufacturer: 'Varian', model: 'Edge', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '6 MV SRS', doseRate_Gy_min: 24, maxFieldSize_cm: '22x22', tvlConcrete_cm_6MV: 37, workload_Gy_week: 300, imageUrl: getEquipmentImageUrl('Edge') },

  // --- ELEKTA ---
  { id: 'elekta-versa', manufacturer: 'Elekta', model: 'Versa HD', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '6/10 MV', doseRate_Gy_min: 24, maxFieldSize_cm: '40x40', tvlConcrete_cm_6MV: 37, tvlConcrete_cm_10MV: 41, leakagePercent: 0.1, workload_Gy_week: 450, imageUrl: getEquipmentImageUrl('Versa HD') },
  { id: 'elekta-infinity', manufacturer: 'Elekta', model: 'Infinity', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '6 MV', doseRate_Gy_min: 17, maxFieldSize_cm: '40x40', tvlConcrete_cm_6MV: 37, workload_Gy_week: 400, imageUrl: getEquipmentImageUrl('Infinity') },
  { id: 'elekta-unity', manufacturer: 'Elekta', model: 'Unity MR-Linac', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '6 MV + 1.5T MR', doseRate_Gy_min: 8, maxFieldSize_cm: '22x22', tvlConcrete_cm_6MV: 37, leakagePercent: 0.1, workload_Gy_week: 300, imageUrl: getEquipmentImageUrl('Unity MR-Linac') },
  { id: 'elekta-mri-alone', manufacturer: 'Elekta', model: 'Philips Ingenia MR-RT (con Unity)', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '1.5T MRI + 6 MV', doseRate_Gy_min: 8, maxFieldSize_cm: '22x22', tvlConcrete_cm_6MV: 37, workload_Gy_week: 280, imageUrl: getEquipmentImageUrl('Philips Ingenia MR-RT (con Unity)') },

  // --- SIEMENS HEALTHINEERS ---
  { id: 'siemens-oncor', manufacturer: 'Siemens Healthineers', model: 'Oncor Impression Plus', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '6/18 MV', doseRate_Gy_min: 20, maxFieldSize_cm: '40x40', tvlConcrete_cm_6MV: 37, tvlConcrete_cm_10MV: 44, leakagePercent: 0.1, workload_Gy_week: 400, imageUrl: getEquipmentImageUrl('Oncor Impression Plus') },
  { id: 'siemens-primus', manufacturer: 'Siemens Healthineers', model: 'Primus', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '6/15 MV', doseRate_Gy_min: 16, maxFieldSize_cm: '40x40', tvlConcrete_cm_6MV: 37, tvlConcrete_cm_10MV: 44, leakagePercent: 0.1, workload_Gy_week: 380, imageUrl: getEquipmentImageUrl('Primus') },
  { id: 'siemens-primart', manufacturer: 'Siemens Healthineers', model: 'PrimArt', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '6 MV', doseRate_Gy_min: 10, maxFieldSize_cm: '40x40', tvlConcrete_cm_6MV: 37, workload_Gy_week: 350, imageUrl: getEquipmentImageUrl('PrimArt') },
  { id: 'siemens-magnetom-rt', manufacturer: 'Siemens Healthineers', model: 'Magnetom RT Pro edition (1.5T)', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '1.5T MRI', doseRate_Gy_min: 8, maxFieldSize_cm: '22x22', tvlConcrete_cm_6MV: 37, workload_Gy_week: 280, imageUrl: getEquipmentImageUrl('Magnetom RT Pro edition (1.5T)') },
  { id: 'siemens-somatom-x', manufacturer: 'Siemens Healthineers', model: 'SOMATOM X.ceed', category: 'CT', modality: 'ct-body', energy_MeV_or_kVp: '140 kV Dual Energy', maxFieldSize_cm: '50x50', workload_Gy_week: 220, imageUrl: getEquipmentImageUrl('SOMATOM X.ceed') },
  { id: 'siemens-somatom-edge', manufacturer: 'Siemens Healthineers', model: 'SOMATOM Edge Plus', category: 'CT', modality: 'ct-body', energy_MeV_or_kVp: '140 kV', maxFieldSize_cm: '50x50', workload_Gy_week: 200, imageUrl: getEquipmentImageUrl('SOMATOM Edge Plus') },
  { id: 'siemens-symbia-spect', manufacturer: 'Siemens Healthineers', model: 'Symbia Evo Excel', category: 'SPECT', modality: 'spect-tc99m', energy_MeV_or_kVp: 'Tc-99m 140 keV / I-131 364 keV', maxFieldSize_cm: '40x60', workload_Gy_week: 35, imageUrl: getEquipmentImageUrl('Symbia Evo Excel') },
  { id: 'siemens-mi-spect', manufacturer: 'Siemens Healthineers', model: 'Molecular Imaging Biograph Horizon', category: 'PET-CT', modality: 'pet-ct', energy_MeV_or_kVp: '511 keV + 140 kV CT', maxFieldSize_cm: 'N/A', workload_Gy_week: 45, imageUrl: getEquipmentImageUrl('Molecular Imaging Biograph Horizon') },

  // --- SIEMENS / CANON (legacy) ---
  { id: 'siemens-vitalbeam', manufacturer: 'Siemens (Varian)', model: 'VitalBeam', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '6/15 MV', doseRate_Gy_min: 24, maxFieldSize_cm: '40x40', tvlConcrete_cm_6MV: 37, tvlConcrete_cm_10MV: 44, leakagePercent: 0.1, workload_Gy_week: 400, imageUrl: getEquipmentImageUrl('VitalBeam') },
  { id: 'siemens-artiste', manufacturer: 'Siemens', model: 'Artiste', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '6/18 MV', doseRate_Gy_min: 20, maxFieldSize_cm: '40x40', tvlConcrete_cm_6MV: 37, tvlConcrete_cm_10MV: 44, workload_Gy_week: 400, imageUrl: getEquipmentImageUrl('Artiste') },
  { id: 'canon-exhl', manufacturer: 'Canon (Vantage)', model: 'OASIS Open', category: 'LINAC', modality: 'linac-6mv', energy_MeV_or_kVp: '6 MV', doseRate_Gy_min: 8, maxFieldSize_cm: '30x40', workload_Gy_week: 350, imageUrl: getEquipmentImageUrl('OASIS Open') },

  // --- GAMMA KNIFE ---
  { id: 'elekta-leskell', manufacturer: 'Elekta', model: 'Leksell Gamma Knife Icon', category: 'GammaKnife', modality: 'gamma-knife', energy_MeV_or_kVp: 'Co-60 1.25 MeV', maxFieldSize_cm: 'N/A (201 fuentes)', tvlConcrete_cm_6MV: 21, workload_Gy_week: 50, imageUrl: getEquipmentImageUrl('Leksell Gamma Knife Icon') },
  { id: 'elekta-leskell-esprit', manufacturer: 'Elekta', model: 'Leksell Gamma Knife Esprit', category: 'GammaKnife', modality: 'gamma-knife', energy_MeV_or_kVp: 'Co-60 1.25 MeV', maxFieldSize_cm: 'N/A (192 fuentes)', tvlConcrete_cm_6MV: 21, workload_Gy_week: 60, imageUrl: getEquipmentImageUrl('Leksell Gamma Knife Esprit') },

  // --- CT ---
  { id: 'siemens-somatom', manufacturer: 'Siemens', model: 'SOMATOM Force', category: 'CT', modality: 'ct-body', energy_MeV_or_kVp: '150 kV', maxFieldSize_cm: '50x50', workload_Gy_week: 200, imageUrl: getEquipmentImageUrl('SOMATOM Force') },
  { id: 'ge-revolution', manufacturer: 'GE HealthCare', model: 'Revolution CT', category: 'CT', modality: 'ct-body', energy_MeV_or_kVp: '140 kV', maxFieldSize_cm: '50x50', workload_Gy_week: 200, imageUrl: getEquipmentImageUrl('Revolution CT') },
  { id: 'philips-iqon', manufacturer: 'Philips', model: 'IQon Spectral CT', category: 'CT', modality: 'ct-body', energy_MeV_or_kVp: '140 kV', maxFieldSize_cm: '50x50', workload_Gy_week: 180, imageUrl: getEquipmentImageUrl('IQon Spectral CT') },
  { id: 'canon-aquilion', manufacturer: 'Canon', model: 'Aquilion Exceed LB', category: 'CT', modality: 'ct-body', energy_MeV_or_kVp: '135 kV', maxFieldSize_cm: '50x50', workload_Gy_week: 180, imageUrl: getEquipmentImageUrl('Aquilion Exceed LB') },

  // --- PET-CT ---
  { id: 'siemens-biograph', manufacturer: 'Siemens', model: 'Biograph Vision Quadra', category: 'PET-CT', modality: 'pet-ct', energy_MeV_or_kVp: '511 keV + 140 kV CT', maxFieldSize_cm: 'N/A', workload_Gy_week: 40, imageUrl: getEquipmentImageUrl('Biograph Vision Quadra') },
  { id: 'ge-discovery-mi', manufacturer: 'GE HealthCare', model: 'Discovery MI', category: 'PET-CT', modality: 'pet-ct', energy_MeV_or_kVp: '511 keV + 140 kV CT', maxFieldSize_cm: 'N/A', workload_Gy_week: 40, imageUrl: getEquipmentImageUrl('Discovery MI') },
  { id: 'philips-vereos', manufacturer: 'Philips', model: 'Vereos PET/CT', category: 'PET-CT', modality: 'pet-ct', energy_MeV_or_kVp: '511 keV + 140 kV CT', maxFieldSize_cm: 'N/A', workload_Gy_week: 35, imageUrl: getEquipmentImageUrl('Vereos PET/CT') },

  // --- HDR ---
  { id: 'varian-brachy', manufacturer: 'Varian', model: 'Bravos HDR', category: 'HDR', modality: 'hdr-192ir', energy_MeV_or_kVp: 'Ir-192 0.38 MeV', maxFieldSize_cm: 'N/A', tvlConcrete_cm_6MV: 16, workload_Gy_week: 15, imageUrl: getEquipmentImageUrl('Bravos HDR') },
  { id: 'elekta-flexitron', manufacturer: 'Elekta', model: 'Flexitron HDR', category: 'HDR', modality: 'hdr-192ir', energy_MeV_or_kVp: 'Ir-192 0.38 MeV', maxFieldSize_cm: 'N/A', tvlConcrete_cm_6MV: 16, workload_Gy_week: 15, imageUrl: getEquipmentImageUrl('Flexitron HDR') },

  // --- CYCLOTRON ---
  { id: 'iba-cyclone', manufacturer: 'IBA', model: 'Cyclone Kiube', category: 'Cyclotron', modality: 'cyclotron-16mev', energy_MeV_or_kVp: '16 MeV p', maxFieldSize_cm: 'N/A', workload_Gy_week: 80, imageUrl: getEquipmentImageUrl('Cyclone Kiube') },
  { id: 'ge-pettrace', manufacturer: 'GE HealthCare', model: 'PETtrace 800', category: 'Cyclotron', modality: 'cyclotron-16mev', energy_MeV_or_kVp: '16 MeV p', maxFieldSize_cm: 'N/A', workload_Gy_week: 80, imageUrl: getEquipmentImageUrl('PETtrace 800') },

  // --- MAMMOGRAPHY ---
  { id: 'ge-senographe', manufacturer: 'GE HealthCare', model: 'Senographe Pristina', category: 'Mammography', modality: 'mammo-cc', energy_MeV_or_kVp: '25-35 kV Mo/Rh', maxFieldSize_cm: '24x30', workload_Gy_week: 50, imageUrl: getEquipmentImageUrl('Senographe Pristina') },
  { id: 'hologic-selenia', manufacturer: 'Hologic', model: 'Selenia Dimensions', category: 'Mammography', modality: 'mammo-cc', energy_MeV_or_kVp: '25-35 kV W/Rh', maxFieldSize_cm: '24x30', workload_Gy_week: 60, imageUrl: getEquipmentImageUrl('Selenia Dimensions') },

  // --- SPECT ---
  { id: 'ge-nmct', manufacturer: 'GE HealthCare', model: 'NM/CT 870 CZT', category: 'SPECT', modality: 'spect-tc99m', energy_MeV_or_kVp: 'Tc-99m 140 keV', maxFieldSize_cm: '40x60', workload_Gy_week: 30, imageUrl: getEquipmentImageUrl('NM/CT 870 CZT') },
  { id: 'siemens-symbia', manufacturer: 'Siemens', model: 'Symbia Intevo Bold', category: 'SPECT', modality: 'spect-tc99m', energy_MeV_or_kVp: 'Tc-99m 140 keV', maxFieldSize_cm: '40x60', workload_Gy_week: 30, imageUrl: getEquipmentImageUrl('Symbia Intevo Bold') },
];

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE CONSULTA
// ═══════════════════════════════════════════════════════════════════════════════
export function getEquipmentsByManufacturer(manufacturer: string): CommercialEquipment[] {
  return COMMERCIAL_EQUIPMENT.filter(e => e.manufacturer.toLowerCase() === manufacturer.toLowerCase());
}

export function getEquipmentsByCategory(category: CommercialEquipment['category']): CommercialEquipment[] {
  return COMMERCIAL_EQUIPMENT.filter(e => e.category === category);
}

export function getEquipmentById(id: string): CommercialEquipment | undefined {
  return COMMERCIAL_EQUIPMENT.find(e => e.id === id);
}

export function getEquipmentModelsByCategory(category: CommercialEquipment['category']): { manufacturer: string; models: string[] }[] {
  const byMfr: Record<string, Set<string>> = {};
  COMMERCIAL_EQUIPMENT.filter(e => e.category === category).forEach(e => {
    if (!byMfr[e.manufacturer]) byMfr[e.manufacturer] = new Set();
    byMfr[e.manufacturer].add(e.model);
  });
  return Object.entries(byMfr).map(([manufacturer, models]) => ({
    manufacturer,
    models: Array.from(models),
  }));
}

export function getAllManufacturers(): string[] {
  return Array.from(new Set(COMMERCIAL_EQUIPMENT.map(e => e.manufacturer)));
}

export function getAllCategories(): { id: CommercialEquipment['category']; label: string; count: number }[] {
  const counts: Record<string, number> = {};
  COMMERCIAL_EQUIPMENT.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
  const labels: Record<string, string> = {
    LINAC: 'Aceleradores Lineales',
    CT: 'Tomografía Computarizada',
    'PET-CT': 'PET-CT',
    GammaKnife: 'Gamma Knife',
    HDR: 'Braquiterapia HDR',
    Mammography: 'Mastografía',
    Cyclotron: 'Ciclotrón',
    SPECT: 'Gamma Cámara / SPECT',
  };
  return Object.entries(counts).map(([id, count]) => ({
    id: id as CommercialEquipment['category'],
    label: labels[id] || id,
    count,
  }));
}
