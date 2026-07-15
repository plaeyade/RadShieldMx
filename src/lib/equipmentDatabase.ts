/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v31 — Commercial Equipment Database
 * ═══════════════════════════════════════════════════════════════════════════
 *  Pre-loaded equipment from major manufacturers with NCRP 151 reference data.
 *  Manufacturers: Varian, Elekta, IBA, Siemens, Accuray, ViewRay
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface CommercialEquipment {
  id: string;
  manufacturer: string;
  model: string;
  modality: 'External Beam' | 'Brachytherapy' | 'Radiosurgery' | 'Nuclear Medicine' | 'Proton Therapy' | 'MR-Linac';
  energies_MV: number[];
  energies_electron_MeV?: number[];
  max_dose_rate_MU_min: number;
  field_size_max_cm: number;
  ssd_cm: number;
  leakage_percent: number;
  workload_h_week_NCRP: number;
  patients_per_day_typical: number;
  dose_per_fraction_Gy_typical: number;
  tvl_primary_concrete_mm: number;
  tvl_secondary_concrete_mm: number;
  hvl_lead_mm: number;
  neutron_above_10MV: boolean;
  shielding_notes: string;
  regulatory_ref: string;
  year_introduced: number;
  image_url?: string;
}

export const COMMERCIAL_EQUIPMENT_DB: CommercialEquipment[] = [
  // ═══ VARIAN ═══
  {
    id: 'varian_truebeam_6x',
    manufacturer: 'Varian Medical Systems',
    model: 'TrueBeam (6X)',
    modality: 'External Beam',
    energies_MV: [6],
    energies_electron_MeV: [6, 9, 12, 15, 18, 20],
    max_dose_rate_MU_min: 1400,
    field_size_max_cm: 40,
    ssd_cm: 100,
    leakage_percent: 0.1,
    workload_h_week_NCRP: 40,
    patients_per_day_typical: 25,
    dose_per_fraction_Gy_typical: 2.0,
    tvl_primary_concrete_mm: 369,
    tvl_secondary_concrete_mm: 293,
    hvl_lead_mm: 16.6,
    neutron_above_10MV: false,
    shielding_notes: '6 MV photons only. No neutron shielding required. NCRP 151 Table B.2: W=40 h/week for dual-energy room. If used as single 6 MV, W=25 h/week.',
    regulatory_ref: 'NCRP 151 (2005), Table B.2, p. 112',
    year_introduced: 2010,
  },
  {
    id: 'varian_truebeam_6x_15x',
    manufacturer: 'Varian Medical Systems',
    model: 'TrueBeam (6X/15X)',
    modality: 'External Beam',
    energies_MV: [6, 15],
    energies_electron_MeV: [6, 9, 12, 15, 18, 20],
    max_dose_rate_MU_min: 1400,
    field_size_max_cm: 40,
    ssd_cm: 100,
    leakage_percent: 0.1,
    workload_h_week_NCRP: 40,
    patients_per_day_typical: 25,
    dose_per_fraction_Gy_typical: 2.0,
    tvl_primary_concrete_mm: 440,
    tvl_secondary_concrete_mm: 360,
    hvl_lead_mm: 22.0,
    neutron_above_10MV: true,
    shielding_notes: '15 MV requires neutron shielding. TVL_primary(15X)=440 mm concrete. Maze door must include borated polyethylene (5% B, 5-10 cm) backed by lead. Secondary TVL=360 mm.',
    regulatory_ref: 'NCRP 151 (2005), Table B.2, Sec. 5.4',
    year_introduced: 2010,
  },
  {
    id: 'varian_truebeam_6x_10x',
    manufacturer: 'Varian Medical Systems',
    model: 'TrueBeam (6X/10X)',
    modality: 'External Beam',
    energies_MV: [6, 10],
    energies_electron_MeV: [6, 9, 12, 15, 18, 20],
    max_dose_rate_MU_min: 2400,
    field_size_max_cm: 40,
    ssd_cm: 100,
    leakage_percent: 0.1,
    workload_h_week_NCRP: 40,
    patients_per_day_typical: 30,
    dose_per_fraction_Gy_typical: 2.0,
    tvl_primary_concrete_mm: 410,
    tvl_secondary_concrete_mm: 330,
    hvl_lead_mm: 19.5,
    neutron_above_10MV: false,
    shielding_notes: '10 MV: neutron contribution minimal. No dedicated neutron shielding required but recommended if 10 MV used extensively. Flattening Filter Free (FFF) mode at 2400 MU/min.',
    regulatory_ref: 'NCRP 151 (2005), Table B.2',
    year_introduced: 2012,
  },
  {
    id: 'varian_halcyon',
    manufacturer: 'Varian Medical Systems',
    model: 'Halcyon',
    modality: 'External Beam',
    energies_MV: [6],
    max_dose_rate_MU_min: 800,
    field_size_max_cm: 28,
    ssd_cm: 100,
    leakage_percent: 0.03,
    workload_h_week_NCRP: 40,
    patients_per_day_typical: 35,
    dose_per_fraction_Gy_typical: 2.0,
    tvl_primary_concrete_mm: 369,
    tvl_secondary_concrete_mm: 293,
    hvl_lead_mm: 16.6,
    neutron_above_10MV: false,
    shielding_notes: 'Single 6 MV energy only. Ring gantry design with 0.03% leakage (lower than conventional). Dual-layer MLC. Very high throughput design. No neutron concern.',
    regulatory_ref: 'NCRP 151 (2005), Table B.2',
    year_introduced: 2017,
  },
  {
    id: 'varian_edge',
    manufacturer: 'Varian Medical Systems',
    model: 'Edge',
    modality: 'External Beam',
    energies_MV: [6],
    energies_electron_MeV: [6, 9, 12, 15, 18, 20],
    max_dose_rate_MU_min: 2400,
    field_size_max_cm: 20,
    ssd_cm: 100,
    leakage_percent: 0.1,
    workload_h_week_NCRP: 40,
    patients_per_day_typical: 20,
    dose_per_fraction_Gy_typical: 7.0,
    tvl_primary_concrete_mm: 369,
    tvl_secondary_concrete_mm: 293,
    hvl_lead_mm: 16.6,
    neutron_above_10MV: false,
    shielding_notes: 'Dedicated radiosurgery platform. High fractional doses (5-20 Gy). High dose rate (2400 MU/min FFF). Small field sizes typical. Calypso tracking compatible.',
    regulatory_ref: 'NCRP 151 (2005), Sec. 4.2.6',
    year_introduced: 2013,
  },
  // ═══ ELEKTA ═══
  {
    id: 'elekta_versa_hd',
    manufacturer: 'Elekta',
    model: 'Versa HD',
    modality: 'External Beam',
    energies_MV: [6, 10],
    energies_electron_MeV: [4, 6, 8, 10, 12, 15, 18],
    max_dose_rate_MU_min: 1700,
    field_size_max_cm: 40,
    ssd_cm: 100,
    leakage_percent: 0.1,
    workload_h_week_NCRP: 40,
    patients_per_day_typical: 25,
    dose_per_fraction_Gy_typical: 2.0,
    tvl_primary_concrete_mm: 410,
    tvl_secondary_concrete_mm: 330,
    hvl_lead_mm: 19.5,
    neutron_above_10MV: false,
    shielding_notes: 'Agility 160-leaf MLC. 10 MV available. HDRS (High Dynamic Radiosurgery) mode. Agility head with reduced leaf width (5 mm at isocenter).',
    regulatory_ref: 'NCRP 151 (2005), Table B.2',
    year_introduced: 2013,
  },
  {
    id: 'elekta_unity',
    manufacturer: 'Elekta',
    model: 'Unity',
    modality: 'MR-Linac',
    energies_MV: [7],
    max_dose_rate_MU_min: 425,
    field_size_max_cm: 22,
    ssd_cm: 100,
    leakage_percent: 0.1,
    workload_h_week_NCRP: 40,
    patients_per_day_typical: 15,
    dose_per_fraction_Gy_typical: 2.0,
    tvl_primary_concrete_mm: 380,
    tvl_secondary_concrete_mm: 300,
    hvl_lead_mm: 17.5,
    neutron_above_10MV: false,
    shielding_notes: '1.5T MRI integrated with 7 MV linac. Magnetic field affects electron return effect. Special consideration for shielding around MR coil. RF shielding required.',
    regulatory_ref: 'NCRP 151 (2005), adapted for 7 MV; IAEA SSG-8',
    year_introduced: 2018,
  },
  // ═══ IBA ═══
  {
    id: 'iba_proteus_one',
    manufacturer: 'IBA',
    model: 'Proteus ONE',
    modality: 'Proton Therapy',
    energies_MV: [],
    max_dose_rate_MU_min: 0,
    field_size_max_cm: 25,
    ssd_cm: 100,
    leakage_percent: 0.01,
    workload_h_week_NCRP: 40,
    patients_per_day_typical: 15,
    dose_per_fraction_Gy_typical: 2.0,
    tvl_primary_concrete_mm: 2400,
    tvl_secondary_concrete_mm: 1800,
    hvl_lead_mm: 80.0,
    neutron_above_10MV: true,
    shielding_notes: 'Proton therapy with gantry. Primary shielding: 2-2.5 m concrete or earth berm. Secondary: 1.5-2 m. Neutron source from beam interactions. Maze design critical. Activation of air and components.',
    regulatory_ref: 'NCRP 144 (2003), IAEA SSG-8, PTCOG reports',
    year_introduced: 2014,
  },
  // ═══ ACCURAY ═══
  {
    id: 'accuray_cyberknife',
    manufacturer: 'Accuray',
    model: 'CyberKnife M6',
    modality: 'Radiosurgery',
    energies_MV: [6],
    max_dose_rate_MU_min: 1000,
    field_size_max_cm: 6,
    ssd_cm: 80,
    leakage_percent: 0.05,
    workload_h_week_NCRP: 20,
    patients_per_day_typical: 8,
    dose_per_fraction_Gy_typical: 7.0,
    tvl_primary_concrete_mm: 369,
    tvl_secondary_concrete_mm: 293,
    hvl_lead_mm: 16.6,
    neutron_above_10MV: false,
    shielding_notes: 'Robotic linac on manipulator arm. Non-isocentric treatments. Multiple beams from many angles. Lower workload than conventional. InCise MLC available.',
    regulatory_ref: 'NCRP 151 (2005), Sec. 4.2.6',
    year_introduced: 2015,
  },
  // ═══ SIEMENS (now Varian) ═══
  {
    id: 'siemens_artiste',
    manufacturer: 'Siemens / Varian',
    model: 'Oncor / Artiste',
    modality: 'External Beam',
    energies_MV: [6, 15],
    energies_electron_MeV: [6, 9, 12, 15, 18, 21],
    max_dose_rate_MU_min: 600,
    field_size_max_cm: 40,
    ssd_cm: 100,
    leakage_percent: 0.1,
    workload_h_week_NCRP: 40,
    patients_per_day_typical: 20,
    dose_per_fraction_Gy_typical: 2.0,
    tvl_primary_concrete_mm: 440,
    tvl_secondary_concrete_mm: 360,
    hvl_lead_mm: 22.0,
    neutron_above_10MV: true,
    shielding_notes: 'Legacy Siemens platform. 15 MV requires neutron shielding. 160-leaf MLC (Optifocus). Now supported by Varian after acquisition.',
    regulatory_ref: 'NCRP 151 (2005), Table B.2',
    year_introduced: 2007,
  },
  // ═══ GAMMA KNIFE ═══
  {
    id: 'elekta_gamma_knife_icon',
    manufacturer: 'Elekta',
    model: 'Gamma Knife Icon',
    modality: 'Radiosurgery',
    energies_MV: [1.17, 1.33], // Co-60 gamma
    max_dose_rate_MU_min: 0,
    field_size_max_cm: 3,
    ssd_cm: 40,
    leakage_percent: 0.0,
    workload_h_week_NCRP: 20,
    patients_per_day_typical: 4,
    dose_per_fraction_Gy_typical: 12.0,
    tvl_primary_concrete_mm: 218,
    tvl_secondary_concrete_mm: 183,
    hvl_lead_mm: 11.0,
    neutron_above_10MV: false,
    shielding_notes: 'Co-60 permanent sources. TVL concrete = 218 mm. TVL lead = 55 mm. Activity: 200-400 Ci at installation. Decays at 1.1% per month. CBCT cone beam imaging integrated. Mask-based fixation (no frame required).',
    regulatory_ref: 'NCRP 151 (2005), Sec. 4.3.1, Table 4.5',
    year_introduced: 2016,
  },
  // ═══ HDR ═══
  {
    id: 'varian_varisource_ir192',
    manufacturer: 'Varian',
    model: 'VariSource iX (Ir-192 HDR)',
    modality: 'Brachytherapy',
    energies_MV: [], // Ir-192
    max_dose_rate_MU_min: 0,
    field_size_max_cm: 0,
    ssd_cm: 0,
    leakage_percent: 0.0,
    workload_h_week_NCRP: 10,
    patients_per_day_typical: 3,
    dose_per_fraction_Gy_typical: 15.0,
    tvl_primary_concrete_mm: 61,
    tvl_secondary_concrete_mm: 50,
    hvl_lead_mm: 3.3,
    neutron_above_10MV: false,
    shielding_notes: 'HDR Ir-192 afterloader. Source returns to shielded safe when not in use. TVL lead = 7 mm. TVL concrete = 61 mm. Room is controlled area. Door interlocks mandatory. Emergency retraction system.',
    regulatory_ref: 'NCRP 151 (2005), Sec. 4.4.1, Table 4.8',
    year_introduced: 2005,
  },
  // ═══ PET/CT ═══
  {
    id: 'siemens_biograph',
    manufacturer: 'Siemens',
    model: 'Biograph Vision (PET/CT)',
    modality: 'Nuclear Medicine',
    energies_MV: [],
    max_dose_rate_MU_min: 0,
    field_size_max_cm: 0,
    ssd_cm: 0,
    leakage_percent: 0.0,
    workload_h_week_NCRP: 30,
    patients_per_day_typical: 12,
    dose_per_fraction_Gy_typical: 0,
    tvl_primary_concrete_mm: 260,
    tvl_secondary_concrete_mm: 220,
    hvl_lead_mm: 12.0,
    neutron_above_10MV: false,
    shielding_notes: '511 keV annihilation photons from F-18 FDG. TVL concrete = 260 mm. Uptake room, scan room, and hot lab require shielding. NCRP 147 methodology. Consider 2-hour uptake delay. Typical injection: 370-555 MBq.',
    regulatory_ref: 'NCRP 147 (2004), Sec. 4.2.1',
    year_introduced: 2018,
  },
];

export function getEquipmentById(id: string): CommercialEquipment | undefined {
  return COMMERCIAL_EQUIPMENT_DB.find(e => e.id === id);
}

export function getEquipmentByManufacturer(mfr: string): CommercialEquipment[] {
  return COMMERCIAL_EQUIPMENT_DB.filter(e => e.manufacturer.toLowerCase().includes(mfr.toLowerCase()));
}

export function getEquipmentByModality(modality: string): CommercialEquipment[] {
  return COMMERCIAL_EQUIPMENT_DB.filter(e => e.modality.toLowerCase().includes(modality.toLowerCase()));
}

export function searchEquipment(query: string): CommercialEquipment[] {
  const q = query.toLowerCase();
  return COMMERCIAL_EQUIPMENT_DB.filter(e =>
    e.model.toLowerCase().includes(q) ||
    e.manufacturer.toLowerCase().includes(q) ||
    e.modality.toLowerCase().includes(q)
  );
}
