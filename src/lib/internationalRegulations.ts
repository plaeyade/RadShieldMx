/**
 * International Radiological Protection Regulations Database
 * Eje 3.1: Base de datos de regulaciones internacionales
 * 
 * Covers: ICRP, IAEA, CNSNS (Mexico), NRC (USA), EURATOM, ARPANSA, CNSC (Canada),
 * ANVS (Brazil), FANR (UAE), NRPA (Norway), RPII (Ireland), ONR (UK)
 */

import { NOM_008_NUCL } from './normativaMx';
import { TEXTO_OBJETIVOS_DISENO_EN } from './limitesDosis';

export interface Regulation {
  id: string;
  code: string;
  title: string;
  authority: string;
  country: string;
  region: string;
  category: 'safety_standard' | 'guideline' | 'regulatory_guide' | 'legal_act' | 'code_of_practice' | 'technical_report';
  year: number;
  status: 'active' | 'superseded' | 'draft' | 'under_review';
  scope: string[];
  applicability: 'international' | 'regional' | 'national';
  url?: string;
  summary: string;
  keyRequirements: string[];
  doseLimits_mSv_yr?: {
    public: number;
    occupational: number;
    pregnant_worker: number;
    lens_of_eye: number;
    skin_hands: number;
  };
  shieldingRequirements?: string[];
  relatedRegulations: string[];
}

export const REGULATIONS: Regulation[] = [
  // === INTERNATIONAL ===
  {
    id: 'icrp-103', code: 'ICRP 103', title: 'The 2007 Recommendations of the International Commission on Radiological Protection',
    authority: 'ICRP', country: 'International', region: 'Global', category: 'safety_standard', year: 2007, status: 'active',
    scope: ['radiation_protection', 'dose_limits', 'justification', 'optimization', 'dose_constraints'],
    applicability: 'international',
    url: 'https://www.icrp.org/publication.asp?id=ICRP%20Publication%20103',
    summary: 'Fundamental recommendations for protection against ionizing radiation. Introduces the three principles: Justification, Optimization (ALARA), and Dose Limitation.',
    keyRequirements: ['Justification of practices', 'Optimization of protection (ALARA)', 'Application of dose limits', 'Dose constraints for public exposure'],
    doseLimits_mSv_yr: { public: 1, occupational: 20, pregnant_worker: 1, lens_of_eye: 20, skin_hands: 500 },
    shieldingRequirements: ['Shielding design must ensure dose limits are not exceeded', 'Occupancy factors must be considered', 'Workload factors must be realistic'],
    relatedRegulations: ['iaea-ssr6', 'euratom-2013', 'nrc-10cfr20'],
  },
  {
    id: 'icrp-118', code: 'ICRP 118', title: 'ICRP Statement on Tissue Reactions and Early and Late Effects of Radiation in Normal Tissues and Organs',
    authority: 'ICRP', country: 'International', region: 'Global', category: 'safety_standard', year: 2012, status: 'active',
    scope: ['tissue_reactions', 'tissue_reactions_threshold', 'lens_of_eye'],
    applicability: 'international',
    summary: 'Reduced dose limit for the lens of the eye from 150 mSv/y to 20 mSv/y (averaged over 5 years, not exceeding 50 mSv in a single year).',
    keyRequirements: ['Lens of eye limit: 20 mSv/y averaged over 5 years', 'Tissue reaction thresholds for deterministic effects'],
    doseLimits_mSv_yr: { public: 1, occupational: 20, pregnant_worker: 1, lens_of_eye: 20, skin_hands: 500 },
    relatedRegulations: ['icrp-103', 'iaea-gsg7'],
  },
  {
    id: 'iaea-ssr6', code: 'IAEA SSR-6', title: 'Regulations for the Safe Transport of Radioactive Material',
    authority: 'IAEA', country: 'International', region: 'Global', category: 'safety_standard', year: 2018, status: 'active',
    scope: ['transport', 'type_a_packages', 'type_b_packages', 'labeling'],
    applicability: 'international',
    url: 'https://www.iaea.org/publications/13871/regulations-for-the-safe-transport-of-radioactive-material',
    summary: 'International regulations for safe transport of radioactive material. Defines Type A and Type B packages, labeling requirements, and dose rate limits.',
    keyRequirements: ['Surface dose rate < 2 mSv/h for packages', 'Dose rate at 1m < 0.1 mSv/h for Type A', 'Transport index calculation', 'Labeling Category I, II, III'],
    relatedRegulations: ['icrp-103', 'adr-rid', 'imdg'],
  },
  {
    id: 'iaea-srs47', code: 'IAEA SRS 47', title: 'Radiation Protection in the Design of Radiotherapy Facilities',
    authority: 'IAEA', country: 'International', region: 'Global', category: 'safety_standard', year: 2006, status: 'active',
    scope: ['radiotherapy', 'shielding_design', 'bunker_design', 'maze_design'],
    applicability: 'international',
    url: 'https://www.iaea.org/publications/7367/radiation-protection-in-the-design-of-radiotherapy-facilities',
    summary: 'Comprehensive guidance on shielding design for radiotherapy facilities. Covers primary and secondary barriers, maze calculations, neutron shielding.',
    keyRequirements: ['Barrier transmission calculations', 'Workload, use factor, occupancy factor', 'Neutron considerations for >10 MV', 'TVL and HVL values'],
    shieldingRequirements: ['Primary barrier: B = P·d² / (W·U·T)', 'Secondary barrier: leakage + scatter', 'Maze: multiply scattered dose calculation'],
    relatedRegulations: ['ncrp-151', 'ncrp-144', 'icrp-103'],
  },
  {
    id: 'iaea-gsg7', code: 'IAEA GSG-7', title: 'Occupational Radiation Protection',
    authority: 'IAEA', country: 'International', region: 'Global', category: 'guideline', year: 2018, status: 'active',
    scope: ['occupational_exposure', 'dose_assessment', 'monitoring'],
    applicability: 'international',
    summary: 'Guidance on occupational radiation protection including monitoring, dose assessment, and compliance.',
    keyRequirements: ['Individual dosimetry for category A workers', 'Workplace monitoring', 'Investigation levels', 'Pregnant worker notification'],
    doseLimits_mSv_yr: { public: 1, occupational: 20, pregnant_worker: 1, lens_of_eye: 20, skin_hands: 500 },
    relatedRegulations: ['icrp-103', 'euratom-2013'],
  },
  {
    id: 'iaea-ssg46', code: 'IAEA SSG-46', title: 'Radiation Safety in Industrial Radiography',
    authority: 'IAEA', country: 'International', region: 'Global', category: 'guideline', year: 2018, status: 'active',
    scope: ['industrial_radiography', 'enclosed_facilities', 'shielding', 'safety_assessment'],
    applicability: 'international',
    summary: 'Specific guidance for industrial radiography facilities including shielding design, enclosure requirements, and operational safety.',
    keyRequirements: ['Enclosed facilities for Ir-192 and Co-60', 'Interlocks and warning signals', 'Radiation monitors', 'Control distance calculations'],
    shieldingRequirements: ['Shielding adequacy verification', 'Dose rate outside enclosure < 7.5 µSv/h', 'Controlled area demarcation'],
    relatedRegulations: ['ncrp-144', 'iso-3999'],
  },
  // === NORTH AMERICA ===
  {
    id: 'ncrp-151', code: 'NCRP 151', title: 'Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities',
    authority: 'NCRP', country: 'USA', region: 'North America', category: 'safety_standard', year: 2005, status: 'active',
    scope: ['radiotherapy', 'shielding_design', 'mv_xray', 'gamma_ray', 'bunker_design'],
    applicability: 'regional',
    url: 'https://ncrponline.org/shop/reports/structural-shielding-design-and-evaluation-for-megavoltage-x-and-gamma-ray-radiotherapy-facilities/',
    summary: 'Primary US reference for radiotherapy shielding design. Comprehensive TVL tables, workload data, and calculation methods for all barrier types.',
    keyRequirements: ['Primary barrier: B = P·d² / (W·U·T)', 'Scatter fractions for secondary barriers', 'Leakage radiation for >500 cGy/min', 'Neutron shielding for >10 MV'],
    shieldingRequirements: ['TVL values for concrete, steel, lead', 'Workload values for various techniques', 'Occupancy factors (T = 1 to 1/40)', 'Use factors for primary barriers'],
    relatedRegulations: ['ncrp-147', 'ncrp-144', 'iaea-srs47'],
  },
  {
    id: 'ncrp-147', code: 'NCRP 147', title: 'Structural Shielding Design for Medical X-Ray Imaging Facilities',
    authority: 'NCRP', country: 'USA', region: 'North America', category: 'safety_standard', year: 2004, status: 'active',
    scope: ['diagnostic_imaging', 'ct', 'radiography', 'fluoroscopy', 'shielding_design'],
    applicability: 'regional',
    summary: 'Shielding design for diagnostic X-ray facilities. Kerma per patient data, transmission curves, and barrier requirements.',
    keyRequirements: ['Kerma per patient for each procedure', 'Weekly workload calculations', 'Transmission curves for various materials', 'Leakage and scatter contributions'],
    shieldingRequirements: ['Barrier thickness based on kerma-distance product', 'CT: dose-length product methodology', 'MRI considerations for RF shielding'],
    relatedRegulations: ['ncrp-151', 'acr-ct-acr'],
  },
  {
    id: 'ncrp-144', code: 'NCRP 144', title: 'Radiation Protection for Particle Accelerator Facilities',
    authority: 'NCRP', country: 'USA', region: 'North America', category: 'safety_standard', year: 2003, status: 'active',
    scope: ['particle_accelerators', 'shielding_design', 'neutron_production', 'activation'],
    applicability: 'regional',
    summary: 'Radiation protection for particle accelerator facilities including shielding design, neutron considerations, and induced radioactivity.',
    keyRequirements: ['Neutron shielding for energies >10 MV', 'Skyshine calculations', 'Maze design for neutron capture gamma', 'Induced radioactivity assessment'],
    shieldingRequirements: ['Concrete density > 2.35 g/cm³', 'Borated polyethylene for neutron thermalization', 'Maze with multiple scattering'],
    relatedRegulations: ['ncrp-151', 'iaea-srs47'],
  },
  {
    id: 'nrc-10cfr20', code: '10 CFR 20', title: 'Standards for Protection Against Radiation',
    authority: 'NRC', country: 'USA', region: 'North America', category: 'legal_act', year: 2023, status: 'active',
    scope: ['occupational_exposure', 'public_exposure', 'dose_limits', 'record_keeping'],
    applicability: 'national',
    url: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part020/',
    summary: 'US Nuclear Regulatory Commission regulations for radiation protection. Defines dose limits, ALARA requirements, and record keeping.',
    keyRequirements: ['Total effective dose equivalent (TEDE) limits', 'ALARA program requirement', 'Bioassay requirements', 'Annual reports'],
    doseLimits_mSv_yr: { public: 1, occupational: 50, pregnant_worker: 5, lens_of_eye: 150, skin_hands: 500 },
    relatedRegulations: ['icrp-103', 'ncrp-151'],
  },
  {
    id: 'cnsns-la001', code: 'CNSNS-LA-001/2018', title: 'Guia para la elaboracion de la memoria de calculo de blindajes',
    authority: 'CNSNS', country: 'Mexico', region: 'North America', category: 'regulatory_guide', year: 2018, status: 'active',
    scope: ['shielding_calculations', 'memoria_analitica', 'radiotherapy', 'nuclear_medicine'],
    applicability: 'national',
    summary: 'Mexican regulatory guide for radiation shielding calculation reports. Required for all new installations and modifications.',
    keyRequirements: ['Memoria analitica with NCRP methodology', `Design goals P: ${TEXTO_OBJETIVOS_DISENO_EN}`, 'Annual review of calculations', 'Independent verification'],
    shieldingRequirements: ['NCRP 151/147 methodology mandatory', 'Mexican occupancy factors', 'Workload based on Mexican hospital data'],
    relatedRegulations: ['ncrp-151', 'ncrp-147', 'nom-008'],
  },
  {
    id: 'nom-008', code: NOM_008_NUCL.clave, title: NOM_008_NUCL.titulo,
    authority: 'SENER / CNSNS', country: 'Mexico', region: 'North America', category: 'legal_act', year: NOM_008_NUCL.anio, status: 'active',
    scope: ['radioactive_contamination', 'controlled_zones', 'radiation_zones'],
    applicability: 'national',
    url: NOM_008_NUCL.urlDof,
    summary: 'Mexican standard (DOF 2024-05-24, supersedes NOM-008-NUCL-2011) on derived limits of surface and airborne radioactive contamination and control criteria. It does not set dose limits or shielding design goals (Mexican dose limits: RGSR 1988).',
    keyRequirements: ['Radiation zone: > 0.05 mSv/h or > 1 mSv in 5 consecutive days (§3.11)', 'High-radiation zone: > 1 mSv/h (§3.12)', 'Contamination: > 0.4 Bq/cm² beta-gamma, > 0.04 Bq/cm² alpha (§5.0)', 'Monthly evaluation of contamination-control effectiveness (§4.17)'],
    relatedRegulations: ['icrp-103', 'cnsns-la001'],
  },
  // === EUROPE ===
  {
    id: 'euratom-2013', code: 'Euratom BSS 2013/59', title: 'Basic Safety Standards for Protection Against Dangers Arising from Exposure to Ionising Radiation',
    authority: 'EU', country: 'European Union', region: 'Europe', category: 'legal_act', year: 2013, status: 'active',
    scope: ['dose_limits', 'medical_exposure', 'emergency_exposure', 'radon'],
    applicability: 'regional',
    summary: 'European Union Basic Safety Standards Directive. Transposed into national law by all EU member states. Comprehensive framework for radiation protection.',
    keyRequirements: ['Dose limits aligned with ICRP 103', 'Diagnostic Reference Levels (DRLs)', 'Medical exposure justification', 'Radon action plan'],
    doseLimits_mSv_yr: { public: 1, occupational: 20, pregnant_worker: 1, lens_of_eye: 20, skin_hands: 500 },
    relatedRegulations: ['icrp-103', 'irmer-2017'],
  },
  {
    id: 'irmer-2017', code: 'IRMER 2017', title: 'Ionising Radiation (Medical Exposure) Regulations',
    authority: 'UK', country: 'United Kingdom', region: 'Europe', category: 'legal_act', year: 2017, status: 'active',
    scope: ['medical_exposure', 'justification', 'optimization', 'drls'],
    applicability: 'national',
    summary: 'UK regulations for medical exposure to ionizing radiation. Covers justification, optimization, and diagnostic reference levels.',
    keyRequirements: ['Practitioner justification of every exposure', 'Optimization including shielding design', 'DRL establishment and review', 'Equipment quality assurance'],
    relatedRegulations: ['euratom-2013', 'icrp-103'],
  },
  {
    id: 'bfs-2018', code: 'StrlSchV 2018', title: 'Strahlenschutzverordnung (Radiation Protection Ordinance)',
    authority: 'BfS', country: 'Germany', region: 'Europe', category: 'legal_act', year: 2018, status: 'active',
    scope: ['dose_limits', 'medical_exposure', 'shielding_design'],
    applicability: 'national',
    summary: 'German radiation protection ordinance implementing Euratom BSS. Detailed requirements for medical facility shielding.',
    keyRequirements: ['Dose constraint of 0.3 mSv/y for public', 'Neutron dose assessment for >10 MV', 'Quality assurance for shielding'],
    doseLimits_mSv_yr: { public: 1, occupational: 20, pregnant_worker: 1, lens_of_eye: 20, skin_hands: 500 },
    shieldingRequirements: ['DIN 6844 for radiotherapy shielding', 'Concrete density minimum 2.35 g/cm³', 'Maze design per DIN standards'],
    relatedRegulations: ['euratom-2013', 'din-6844'],
  },
  // === ASIA-PACIFIC ===
  {
    id: 'arpansa-rps1', code: 'RPS C-1', title: 'Code of Practice for Radiation Protection in the Medical Applications of Ionizing Radiation',
    authority: 'ARPANSA', country: 'Australia', region: 'Asia-Pacific', category: 'code_of_practice', year: 2020, status: 'active',
    scope: ['medical_exposure', 'shielding_design', 'quality_assurance'],
    applicability: 'national',
    summary: 'Australian code of practice for medical applications of ionizing radiation. Comprehensive shielding requirements.',
    keyRequirements: ['Shielding design assessment by qualified expert', 'Annual verification of shielding adequacy', 'Dose constraint of 0.1 mSv/y for public areas'],
    shieldingRequirements: ['Primary and secondary barrier calculations', 'Neutron shielding assessment', 'Annual review and documentation'],
    relatedRegulations: ['icrp-103', 'iaea-srs47'],
  },
  {
    id: 'cnsc-rdgs99', code: 'CNSC RD/GS-99', title: 'Radiation Shielding Design for Medical X-Ray Rooms',
    authority: 'CNSC', country: 'Canada', region: 'North America', category: 'regulatory_guide', year: 2020, status: 'active',
    scope: ['diagnostic_imaging', 'shielding_design', 'medical_xray'],
    applicability: 'national',
    summary: 'Canadian Nuclear Safety Commission guide for shielding design of medical X-ray rooms. Uses NCRP methodology with Canadian adaptations.',
    keyRequirements: ['Dose limit: 1 mSv/y for public', 'Shielding design by qualified person', 'Verification measurements after installation'],
    shieldingRequirements: ['NCRP 147 methodology with Canadian workload data', 'Primary and secondary barrier calculations'],
    relatedRegulations: ['ncrp-147', 'csa-z1610'],
  },
  // === SOUTH AMERICA ===
  {
    id: 'cnen-nn313', code: 'CNEN-NN-3.13', title: 'Diretrizes Basicas de Protecao Radiologica',
    authority: 'CNEN', country: 'Brazil', region: 'South America', category: 'legal_act', year: 2022, status: 'active',
    scope: ['dose_limits', 'occupational_exposure', 'medical_exposure'],
    applicability: 'national',
    summary: 'Brazilian regulatory standard for radiological protection. Aligns with ICRP 103 recommendations.',
    keyRequirements: ['Occupational dose limit: 20 mSv/y', 'Public dose limit: 1 mSv/y', 'Shielding design documentation'],
    doseLimits_mSv_yr: { public: 1, occupational: 20, pregnant_worker: 1, lens_of_eye: 20, skin_hands: 500 },
    relatedRegulations: ['icrp-103', 'iaea-srs47'],
  },
  // === MIDDLE EAST ===
  {
    id: 'fanr-reg24', code: 'FANR-REG-24', title: 'Regulation for Radiation Protection in Medical Use',
    authority: 'FANR', country: 'UAE', region: 'Middle East', category: 'legal_act', year: 2019, status: 'active',
    scope: ['medical_use', 'shielding_design', 'quality_assurance'],
    applicability: 'national',
    summary: 'UAE Federal Authority for Nuclear Regulation requirements for radiation protection in medical facilities.',
    keyRequirements: ['Shielding assessment for all installations', 'Quality assurance program', 'Dose limits per IAEA standards'],
    shieldingRequirements: ['Shielding calculations by qualified expert', 'Post-installation verification survey'],
    relatedRegulations: ['iaea-srs47', 'icrp-103'],
  },
];

export interface RegulatoryRegion {
  id: string;
  name: string;
  countries: string[];
  primaryAuthority: string;
  doseLimits_mSv_yr: {
    public: number;
    occupational: number;
    pregnant_worker: number;
  };
}

export const REGULATORY_REGIONS: RegulatoryRegion[] = [
  { id: 'global', name: 'International', countries: ['ICRP', 'IAEA'], primaryAuthority: 'ICRP/IAEA', doseLimits_mSv_yr: { public: 1, occupational: 20, pregnant_worker: 1 } },
  { id: 'na', name: 'North America', countries: ['USA', 'Mexico', 'Canada'], primaryAuthority: 'NRC/CNSNS/CNSC', doseLimits_mSv_yr: { public: 1, occupational: 20, pregnant_worker: 1 } },
  { id: 'eu', name: 'European Union', countries: ['EU-27'], primaryAuthority: 'Euratom', doseLimits_mSv_yr: { public: 1, occupational: 20, pregnant_worker: 1 } },
  { id: 'ap', name: 'Asia-Pacific', countries: ['Australia', 'Japan', 'South Korea', 'China'], primaryAuthority: 'ARPANSA/ various', doseLimits_mSv_yr: { public: 1, occupational: 20, pregnant_worker: 1 } },
  { id: 'sa', name: 'South America', countries: ['Brazil', 'Argentina', 'Chile'], primaryAuthority: 'CNEN/ various', doseLimits_mSv_yr: { public: 1, occupational: 20, pregnant_worker: 1 } },
  { id: 'me', name: 'Middle East', countries: ['UAE', 'Saudi Arabia', 'Israel'], primaryAuthority: 'FANR/ various', doseLimits_mSv_yr: { public: 1, occupational: 20, pregnant_worker: 1 } },
];

// Compliance checklist templates
export interface ComplianceChecklist {
  id: string;
  regulationId: string;
  title: string;
  items: {
    id: string;
    text: string;
    required: boolean;
    category: string;
    verificationMethod: string;
    frequency: 'once' | 'annual' | 'quarterly' | 'monthly' | 'continuous';
  }[];
}

export const COMPLIANCE_CHECKLISTS: ComplianceChecklist[] = [
  {
    id: 'chk-ncrp151', regulationId: 'ncrp-151',
    title: 'NCRP 151 Shielding Design Compliance',
    items: [
      { id: 'c1-1', text: 'Barrier transmission factors calculated for all barriers', required: true, category: 'Calculations', verificationMethod: 'Mathematical review', frequency: 'once' },
      { id: 'c1-2', text: 'Workload (W) values documented and justified', required: true, category: 'Input Data', verificationMethod: 'Clinical records review', frequency: 'annual' },
      { id: 'c1-3', text: 'Use factor (U) assignments documented', required: true, category: 'Input Data', verificationMethod: 'Treatment records', frequency: 'annual' },
      { id: 'c1-4', text: 'Occupancy factor (T) assignments justified', required: true, category: 'Input Data', verificationMethod: 'Survey of adjacent areas', frequency: 'annual' },
      { id: 'c1-5', text: 'Primary barrier thickness > required minimum', required: true, category: 'Primary Barriers', verificationMethod: 'Construction records + survey', frequency: 'once' },
      { id: 'c1-6', text: 'Secondary barrier thickness > required minimum', required: true, category: 'Secondary Barriers', verificationMethod: 'Construction records + survey', frequency: 'once' },
      { id: 'c1-7', text: 'Leakage radiation accounted for', required: true, category: 'Leakage', verificationMethod: 'Calculation verification', frequency: 'once' },
      { id: 'c1-8', text: 'Scatter radiation accounted for', required: true, category: 'Scatter', verificationMethod: 'Calculation verification', frequency: 'once' },
      { id: 'c1-9', text: 'Neutron shielding assessed for >10 MV', required: true, category: 'Neutrons', verificationMethod: 'MCNP/Geant4 calculation', frequency: 'once' },
      { id: 'c1-10', text: 'Maze design adequate for personnel protection', required: true, category: 'Maze', verificationMethod: 'Dose rate survey', frequency: 'once' },
      { id: 'c1-11', text: 'Skyshine assessment performed (if applicable)', required: false, category: 'Skyshine', verificationMethod: 'Analytical calculation', frequency: 'once' },
      { id: 'c1-12', text: 'Post-installation radiation survey completed', required: true, category: 'Verification', verificationMethod: 'TLD/OSL measurements', frequency: 'once' },
      { id: 'c1-13', text: 'Annual re-survey of occupied areas', required: true, category: 'Ongoing', verificationMethod: 'TLD survey', frequency: 'annual' },
      { id: 'c1-14', text: 'Independent review of shielding calculations', required: true, category: 'Quality', verificationMethod: 'Second qualified expert review', frequency: 'once' },
      { id: 'c1-15', text: 'Memoria analitica documentation complete', required: true, category: 'Documentation', verificationMethod: 'Document completeness check', frequency: 'once' },
    ],
  },
  {
    id: 'chk-cnsns', regulationId: 'cnsns-la001',
    title: 'CNSNS-LA-001/2018 Mexico Compliance',
    items: [
      { id: 'c2-1', text: 'Memoria analitica en espanol completa', required: true, category: 'Documentacion', verificationMethod: 'Revision documental', frequency: 'once' },
      { id: 'c2-2', text: 'Firma del fisico medico responsable', required: true, category: 'Documentacion', verificationMethod: 'Verificacion de firma', frequency: 'once' },
      { id: 'c2-3', text: 'Licencia CNSNS vigente', required: true, category: 'Permisos', verificationMethod: 'Consulta CNSNS', frequency: 'annual' },
      { id: 'c2-4', text: 'Revision anual de blindajes', required: true, category: 'Operacion', verificationMethod: 'Mediciones TLD', frequency: 'annual' },
      { id: 'c2-5', text: 'Dosimetria personal de todos los trabajadores', required: true, category: 'Personal', verificationMethod: 'Registros dosimetricos', frequency: 'monthly' },
      { id: 'c2-6', text: 'Reporte de incidentes a CNSNS', required: true, category: 'Incidentes', verificationMethod: 'Registro de incidentes', frequency: 'continuous' },
      { id: 'c2-7', text: 'Programa ALARA documentado', required: true, category: 'Programas', verificationMethod: 'Revision del programa', frequency: 'annual' },
    ],
  },
  {
    id: 'chk-euratom', regulationId: 'euratom-2013',
    title: 'Euratom BSS 2013/59 Compliance',
    items: [
      { id: 'c3-1', text: 'Dose constraints established for public and workers', required: true, category: 'Dose Limits', verificationMethod: 'Document review', frequency: 'once' },
      { id: 'c3-2', text: 'Diagnostic Reference Levels (DRLs) established', required: true, category: 'DRLs', verificationMethod: 'DRL survey', frequency: 'annual' },
      { id: 'c3-3', text: 'Justification of every medical exposure', required: true, category: 'Justification', verificationMethod: 'Clinical audit', frequency: 'continuous' },
      { id: 'c3-4', text: 'Optimization including shielding adequacy', required: true, category: 'Optimization', verificationMethod: 'Shielding survey', frequency: 'annual' },
      { id: 'c3-5', text: 'Pregnant worker procedures implemented', required: true, category: 'Pregnant Workers', verificationMethod: 'Procedure review', frequency: 'annual' },
      { id: 'c3-6', text: 'Equipment quality assurance program', required: true, category: 'QA', verificationMethod: 'QA records', frequency: 'quarterly' },
    ],
  },
];

export function searchRegulations(query: string, filters?: { region?: string; category?: string; status?: string }): Regulation[] {
  return REGULATIONS.filter(r => {
    const matchesQuery = !query ||
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.code.toLowerCase().includes(query.toLowerCase()) ||
      r.authority.toLowerCase().includes(query.toLowerCase()) ||
      r.summary.toLowerCase().includes(query.toLowerCase());
    const matchesRegion = !filters?.region || r.region === filters.region;
    const matchesCategory = !filters?.category || r.category === filters.category;
    const matchesStatus = !filters?.status || r.status === filters.status;
    return matchesQuery && matchesRegion && matchesCategory && matchesStatus;
  });
}

export function getRegulationById(id: string): Regulation | undefined {
  return REGULATIONS.find(r => r.id === id);
}

export function compareDoseLimits(regIds: string[]): Array<{
  regulation: Regulation;
  limits: Regulation['doseLimits_mSv_yr'];
}> {
  return regIds
    .map(id => {
      const reg = getRegulationById(id);
      if (!reg || !reg.doseLimits_mSv_yr) return null;
      return { regulation: reg, limits: reg.doseLimits_mSv_yr };
    })
    .filter(Boolean) as Array<{ regulation: Regulation; limits: Regulation['doseLimits_mSv_yr'] }>;
}
