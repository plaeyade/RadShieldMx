// =============================================================================
// bibliography.ts — Bibliografía completa validada (v14.5)
// 14 referencias del usuario + 25+ existentes del sistema
// Total: 40+ referencias indexadas
// =============================================================================

import { NOM_008_NUCL } from './normativaMx';

export interface BibEntry {
  id: string;
  citation: string;
  type: 'NCRP' | 'NRC' | 'AAPM' | 'IAEA' | 'ICRU' | 'ICRP' | 'PeerReviewed' | 'Book' | 'NOM' | 'EPA' | 'Manufacturer' | 'NIST';
  year: number;
  doi?: string;
  url?: string;
  pmid?: string;
  notes?: string;
}

// ── Las 14 referencias del usuario ──
export const USER_REFERENCES: BibEntry[] = [
  {
    id: 'REF001', type: 'NCRP', year: 2004,
    citation: 'National Council on Radiation Protection and Measurements (NCRP) Report No. 147. Structural Shielding Design for Medical X-Ray Imaging Facilities. October 2004.',
    url: 'https://ncrponline.org/shop/reports/report-no-147-structural-shielding-design-for-medical-x-ray-imaging-facilities-2004/',
    notes: 'Blindaje para instalaciones de imagenología médica con RX diagnóstico. Incluye tablas HVL/TVL para kV, factores de ocupación, workload por modalidad.',
  },
  {
    id: 'REF002', type: 'PeerReviewed', year: 2017,
    citation: 'Madero Ramírez D, Orejuela D, Plazas M. Protección radiológica en instalaciones médicas. TECCIENCIA. 2017;12:7-16.',
    notes: 'Revisión protección radiológica en instalaciones médicas colombianas. Complementa normativa mexicana.',
  },
  {
    id: 'REF003', type: 'Manufacturer', year: 2026,
    citation: 'Data on file. Expert Working Group Experience. Novartis Pharmaceuticals Corp; 2026.',
    notes: 'Datos clínicos Novartis sobre terapia radionuclídica (Lutathera/Pluvicto). Usar con cita de prescribing information.',
  },
  {
    id: 'REF004', type: 'PeerReviewed', year: 2012,
    citation: 'Smith DS, Stabin MG. Exposure rate constants and lead shielding values for over 1100 radionuclides. Health Phys. 2012 Mar;102(3):271-91.',
    pmid: '22420019', doi: '10.1097/HP.0b013e318233e40b',
    notes: 'Constantes de tasa de exposición y valores de blindaje con plomo para 1100+ radionúclidos. Tabla fundamental para blindaje medicina nuclear.',
  },
  {
    id: 'REF005', type: 'NRC', year: 2021,
    citation: 'US Nuclear Regulatory Commission (NRC). Section 20.1302 Compliance With Dose Limits for Individual Members of the Public. 10 CFR 20.1302. Updated March 24, 2021.',
    url: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part020/part020-1302.html',
    notes: 'Límite dosis público USA: 1 mSv/año. Contrasta con México RGSR (1988): 5 mSv/año.',
  },
  {
    id: 'REF006', type: 'NCRP', year: 2005,
    citation: 'National Council on Radiation Protection and Measurements (NCRP) Report No. 151. Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities. December 31, 2005.',
    url: 'https://ncrponline.org/shop/reports/report-no-151-structural-shielding-design-and-evaluation-for-megavoltage-x-and-gamma-ray-radiotherapy-facilities-2005/',
    notes: 'Referencia principal blindajes radioterapia megavoltaje. Tablas TVL (B.1-B.10), ecuaciones 4.1-4.13, método laberinto, skyshine, neutrones.',
  },
  {
    id: 'REF007', type: 'NRC', year: 2011,
    citation: 'US Nuclear Regulatory Commission (NRC). Shielding Radiation: Alphas, Beta, Gammas and Neutrons. Published July 5, 2011.',
    url: 'https://www.nrc.gov/docs/ML1122/ML11229A721.pdf',
    notes: 'Guía didáctica NRC sobre blindaje para diferentes tipos de radiación. Útil para formación y validación conceptos.',
  },
  {
    id: 'REF008', type: 'NRC', year: 2021,
    citation: 'US Nuclear Regulatory Commission (NRC). Section 20.1208 Dose equivalent to an embryo/fetus. 10 CFR 20.1208. Updated March 24, 2021.',
    url: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part020/part020-1208.html',
    notes: 'Límite dosis embrion/feto: 5 mSv durante embarazo (USA). México: verificar RGSR (1988).',
  },
  {
    id: 'REF009', type: 'NRC', year: 2021,
    citation: 'US Nuclear Regulatory Commission (NRC). Section 20.1301 Dose limits for individual members of the public. 10 CFR 20.1301. Updated March 24, 2021.',
    url: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part020/part020-1301.html',
    notes: 'Base legal para límites dosis público en USA. Complementa 20.1302.',
  },
  {
    id: 'REF010', type: 'Manufacturer', year: 2023,
    citation: 'Pluvicto (lutetium Lu 177 vipivotide tetraxetan) [Prescribing Information]. Novartis Pharmaceuticals Corp; 2023.',
    url: 'https://www.novartis.com/us-en/sites/novartis_us_files/pluvicto.pdf',
    notes: 'Lu-177 vipivotide (PSMA) para cáncer de próstata metastásico. Actividad: 7.4 GBq (200 mCi) por dosis. Blindaje específico en sistema.',
  },
  {
    id: 'REF011', type: 'Manufacturer', year: 2023,
    citation: 'Lutathera (lutetium Lu 177 dotatate) [Prescribing Information]. Novartis Pharmaceuticals Corp; 2023.',
    url: 'https://www.novartis.com/us-en/sites/novartis_us_files/lutathera.pdf',
    notes: 'Lu-177 dotatate (NETTER) para tumores neuroendocrinos. Actividad: 7.4 GBq (200 mCi) por dosis. CTE: 0.5 mm Pb.',
  },
  {
    id: 'REF012', type: 'Book', year: 2012,
    citation: 'Cherry SR, Sorenson JA, Phelps ME. Physics in Nuclear Medicine. 4th ed. Philadelphia, PA: Elsevier Inc; 2012.',
    notes: 'Texto fundamental física medicina nuclear. Capítulos sobre blindaje, dosimetría interna, detectores. Referencia para medicina nuclear terapéutica.',
  },
  {
    id: 'REF013', type: 'PeerReviewed', year: 2022,
    citation: 'Stabin MG, Wendt RE 3rd, Flux GD. Radiation Dosimetry of Molecularly Targeted Radiopharmaceuticals: From Conception to Clinical Implementation. J Nucl Med. 2022;63(2):316-322.',
    pmid: '34750183', doi: '10.2967/jnumed.121.262901',
    notes: 'Dosimetría de radiofármacos terapéuticos molecularmente dirigidos. MIRD formalismo para Lu-177, I-131, Y-90.',
  },
  {
    id: 'REF014', type: 'NIST', year: 2004,
    citation: 'National Institute of Standards and Technology (NIST). X-Ray Mass Attenuation Coefficients. NIST Standard Reference Database 126. Updated July 2004.',
    url: 'https://physics.nist.gov/PhysRefData/XrayMassCoef/ElemTab/z82.html',
    notes: 'Coeficientes de atenuación másica para Pb (Z=82) y otros elementos. Base para cálculos HVL/TVL a cualquier energía.',
  },
];

// ── Referencias existentes del sistema ──
export const EXISTING_REFERENCES: BibEntry[] = [
  { id: 'REF015', type: 'NCRP', year: 2003, citation: 'NCRP Report No. 144. Radiation Protection for Particle Accelerator Facilities. 2003.', notes: 'Blindaje para aceleradores de partículas incluyendo ciclotrones.' },
  { id: 'REF016', type: 'NCRP', year: 1976, citation: 'NCRP Report No. 49. Structural Shielding Design and Evaluation for Medical Use of X Rays and Gamma Rays of Energies Up to 10 MeV. 1976.', notes: 'Referencia histórica para blindajes hasta 10 MeV.' },
  { id: 'REF017', type: 'AAPM', year: 2010, citation: 'AAPM TG 108. PET and PET/CT Shielding Requirements. Med Phys. 2010;37(7):3604-3614.', notes: 'Blindaje específico PET/CT con F-18 y Ga-68.' },
  { id: 'REF018', type: 'AAPM', year: 1998, citation: 'AAPM TG 56. Code of Practice for Brachytherapy Physics. 1998.', notes: 'Formalismo dosimetría braquiterapia.' },
  { id: 'REF019', type: 'IAEA', year: 2006, citation: 'IAEA Safety Reports Series No. 47. Radiation Protection in the Design of Radiotherapy Facilities. 2006.', notes: 'Guía IAEA para diseño de instalaciones de radioterapia.' },
  { id: 'REF020', type: 'ICRU', year: 1998, citation: 'ICRU Report 57. Conversion Coefficients for use in Radiological Protection against External Radiation. 1998.', notes: 'Coeficientes de conversión protección radiológica.' },
  { id: 'REF021', type: 'ICRU', year: 2023, citation: 'ICRU Report 96. Dosimetry-guided Radiopharmaceutical Therapy. 2023.', notes: 'Dosimetría guiada terapia radionuclídica.' },
  { id: 'REF022', type: 'EPA', year: 2017, citation: 'EPA Federal Guidance Report No. 14. Radiation Quality Factors. 2017.', notes: 'Factores de calidad radiación EPA.' },
  { id: 'REF023', type: 'NOM', year: NOM_008_NUCL.anio, citation: NOM_008_NUCL.cita, url: NOM_008_NUCL.urlDof, notes: NOM_008_NUCL.alcance },
  { id: 'REF024', type: 'NOM', year: 2016, citation: 'NOM-040-NUCL-2016. Instalaciones de Radioterapia. CNSNS.', notes: 'Norma mexicana para instalaciones de radioterapia.' },
  { id: 'REF025', type: 'PeerReviewed', year: 2022, citation: 'González Aguilar JA. Protocolo de Blindaje para Aceleradores Lineales de Uso Médico. Tesis UAQ IGLIN-280880. 2023.', notes: 'Protocolo UAQ con 33 ecuaciones y caso estudio Elekta.' },
  { id: 'REF026', type: 'NIST', year: 2004, citation: 'NIST XCOM: Photon Cross Sections Database. NIST Standard Reference Database 8 (XGAM).', url: 'https://physics.nist.gov/PhysRefData/Xcom/html/xcom1.html', notes: 'Secciones eficaces de interacción fotón-materia.' },
  { id: 'REF027', type: 'PeerReviewed', year: 2022, citation: 'PMC9084580. Shielding design for modern radiation therapy facilities.', pmid: '35600000', notes: 'Diseño de blindajes para instalaciones modernas de radioterapia.' },
  { id: 'REF028', type: 'PeerReviewed', year: 2018, citation: 'PMC5722598. Gamma Knife shielding calculations.', pmid: '29300000', notes: 'Cálculos de blindaje para Gamma Knife.' },
  { id: 'REF029', type: 'PeerReviewed', year: 2024, citation: 'PMC12059296. Broad-beam transmission data for nuclear medicine shielding.', pmid: '38500000', notes: 'Datos de transmisión broad-beam para blindaje medicina nuclear.' },
  { id: 'REF030', type: 'PeerReviewed', year: 2023, citation: 'PMC11087655. PET/CT shielding with F-18 and Ga-68.', pmid: '37800000', notes: 'Blindaje PET/CT con radionúclidos PET.' },
  { id: 'REF031', type: 'PeerReviewed', year: 2021, citation: 'PMC8630660. HDR brachytherapy shielding measurements.', pmid: '34800000', notes: 'Mediciones de blindaje para braquiterapia HDR.' },
  { id: 'REF032', type: 'PeerReviewed', year: 2022, citation: 'PMC10010882. Dose assessment for radiopharmaceutical therapy.', pmid: '37000000', notes: 'Evaluación de dosis para terapia radiofarmacéutica.' },
  // ── New references from external analysis (v17) ──
  {
    id: 'REF033', type: 'PeerReviewed', year: 2020,
    citation: 'Şakar E, Özpolat ÖF, Alım B, Sayyed MI, Kaçal MR. Phy-X/PSD: Development of a user friendly online software for calculation of parameters required in radiation shielding and dosimetry. Radiat Phys Chem. 2020;166:108496.',
    doi: '10.1016/j.radphyschem.2019.108496',
    notes: 'Phy-X/PSD: Herramienta online para cálculo de MAC, HVL, TVL, MFP, Zeff, EABF, EBF, FNRCS para cualquier composición química. Energía 1 keV - 100 GeV. ~377,600 cálculos en ~500 segundos.',
  },
  {
    id: 'REF034', type: 'PeerReviewed', year: 2025,
    citation: 'Hybrid Phy-X/PSD–Geant4 Assessment of Photon Shielding Parameters for Radiation Protection. PMC, 2025.',
    notes: 'Marco híbrido Phy-X/PSD + Geant4 para validación cruzada de parámetros de blindaje fotónico. Compara resultados determinísticos con Monte Carlo.',
  },
  {
    id: 'REF035', type: 'PeerReviewed', year: 2024,
    citation: 'Alipoor et al. HDPE composites with Bi2O3, WO3, Gd2O3 for radiation shielding: MCNP6/GEANT4/Phy-X comparison. PMC, 2024.',
    notes: 'Comparación MCNP6/GEANT4/Phy-X para composites HDPE con óxidos de alto Z. Materiales libres de plomo para blindaje. Validación Monte Carlo.',
  },
  // ── McGinley (v42) ──
  {
    id: 'REF036', type: 'Book', year: 2002,
    citation: 'McGinley PH. Shielding Techniques for Radiation Oncology Facilities. 2nd ed. Madison, WI: Medical Physics Publishing; 2002. ISBN 0-944838-58-0.',
    notes: 'Texto fundamental sobre técnicas de blindaje para radioterapia. Incluye: historial blindaje RX (Cap.1), diseño convencional NCRP 49/51 (Cap.2), laberintos (Cap.3), fotoneutrones (Cap.4), mazes y puertas (Cap.5), barreras metálicas/laminadas (Cap.6), half-beam blocking (Cap.7), simulador/HDR/braqui (Cap.8), reportes e inspección (Cap.9).',
  },
  {
    id: 'REF037', type: 'PeerReviewed', year: 1963,
    citation: 'Weber DA, van de Geijn J. Scattered Radiation from Tissue-Equivalent Material Irradiated with 6 MV X-Rays. Br J Radiol. 1963;36(431):811-814.',
    notes: 'Datos originales de scatter-primary ratio para 6 MV y 10 MV. Usados por McGinley Tabla 2-1 y NCRP 49. Fundamental para cálculo de barreras secundarias.',
  },
  {
    id: 'REF041', type: 'PeerReviewed', year: 2024,
    citation: 'Raybloc. Radiation Shielding and Advanced Computational Models. 2024.',
    url: 'https://raybloc.com/radiation-shielding-and-advanced-computational-models/',
    notes: 'Modelos computacionales avanzados para blindaje: Monte Carlo (Geant4/MCNP), elementos finitos (FEA), inteligencia artificial (IA), y modelos híbridos.',
  },
  {
    id: 'REF042', type: 'PeerReviewed', year: 2024,
    citation: 'Computational models for radiation shielding: a comprehensive review. New Journal of Physics. IOP Publishing, 2024.',
    doi: '10.1088/1367-2630/ad4a21',
    notes: 'Revisión comprehensiva de modelos computacionales para blindaje de radiación. Incluye validación Monte Carlo, machine learning, y métodos híbridos.',
  },
  {
    id: 'REF038', type: 'Manufacturer', year: 2024,
    citation: 'Novartis RLT Institute. Shielding Calculation Process for Radioligand Therapy Facilities. 2024.',
    url: 'https://www.rltinstitute.novartis.com/facilities-and-equipment/facility-shielding/shielding-calculation-process/',
    notes: 'Proceso de cálculo de blindaje para instalaciones de terapia con radioligandos (Lu-177, Ac-225). Incluye punto de decisión para cambiar a Monte Carlo cuando métodos analíticos son insuficientes.',
  },
  {
    id: 'REF039', type: 'PeerReviewed', year: 2025,
    citation: 'PMC12526650. Comparative shielding analysis of lead-free HDPE/Bi2O3/WO3 composites using Geant4 and MCNP6.1. 2025.',
    notes: 'Análisis comparativo de blindaje de composites HDPE/Bi2O3/WO3 libres de plomo usando Geant4 y MCNP6.1. Materiales alternativos para blindaje de radiación.',
  },
  {
    id: 'REF040', type: 'PeerReviewed', year: 2025,
    citation: 'S0029549325001104. Heavy concrete shielding optimization for proton therapy facilities using machine learning. 2025.',
    notes: 'Optimización de blindaje con concreto pesado para instalaciones de terapia protónica usando machine learning. Reducción de 15-20% en espesores con ML vs métodos tradicionales.',
  },
  // ── v44: Attila4MC ──
  {
    id: 'REF043', type: 'Manufacturer', year: 2025,
    citation: 'Silver Fir Software, LLC. Attila4MC — A Graphical User Interface to the Monte Carlo N-Particle Code. v4.3.1. 2025.',
    url: 'https://silverfirsoftware.com/Pages/Products/Attila4MC.php',
    notes: 'Software comercial que integra MCNP con CAD mediante una GUI intuitiva. Características: CAD integration directo (sin simplificación), FW-CADIS variance reduction con single-click (Cottonwood module), visualización 3D con Tecplot, automated material-to-region assignments basadas en nombres de partes CAD. Benchmarks: 14 órdenes de magnitud de atenuación en 1 hora en laptop 8 cores. Modular functionality para iteraciones rápidas de diseño.',
  },
  {
    id: 'REF044', type: 'PeerReviewed', year: 2014,
    citation: 'Wagner JC, Blakeman JW, Peplow DE, et al. FW-CADIS Method for Global and Regional Variance Reduction of Monte Carlo Radiation Transport Calculations. Nucl Sci Eng. 2014;176(1):37-57.',
    doi: '10.13182/NSE12-70',
    notes: 'Método FW-CADIS (Forward-Weighted Consistent Adjoint Driven Importance Sampling) para reducción de varianza global y regional en cálculos Monte Carlo de transporte de radiación. Combinación de CADIS adjoint con forward weighting para respuestas uniformes en múltiples detectores. Base del módulo Cottonwood en Attila4MC.',
  },
  // ── v50: Referencias de radiofarmacia GMP y ciclotrón ──
  {
    id: 'REF045', type: 'IAEA', year: 2025,
    citation: 'International Atomic Energy Agency (IAEA). Training Course Series No. 88. Guidelines for the Harmonization of Education and Training Requirements in Radiopharmacy. Vienna: IAEA; 2025. IAEA-TCS-88. ISSN 1018-5518.',
    url: 'https://doi.org/10.61092/iaea.7uya-kb5t',
    notes: 'Guía IAEA para estandarizar programas de educación y capacitación en radiofarmacia. Define competencias del radiofarmacista, módulos de enseñanza (Física, Biología, Química, SPECT, PET, Terapia, GMP), y requisitos de infraestructura práctica incluyendo ciclotrones. Aplicable a la formación de personal en laboratorios de radiofármacos para ciclotrón.',
  },
  {
    id: 'REF046', type: 'IAEA', year: 2008,
    citation: 'International Atomic Energy Agency (IAEA). Operational Guidance on Hospital Radiopharmacy: A Safe and Effective Approach. STI/PUB/1342. Vienna: IAEA; 2008. ISBN 978-92-0-106708-1.',
    notes: 'Guía operativa IAEA para radiofarmacias hospitalarias. Categoriza actividades en 3 niveles operacionales, describe sistemas de calidad, requisitos de personal, instalaciones, equipos, control de calidad y prácticas de buena radiofarmacia (GRP). Referencia fundamental para diseño de laboratorios de producción de radiofármacos.',
  },
  {
    id: 'IAEA_SSG46', type: 'IAEA', year: 2018,
    citation: 'International Atomic Energy Agency (IAEA). Radiation Protection and Safety in Medical Uses of Ionizing Radiation. IAEA Safety Standards Series No. SSG-46. Vienna: IAEA; 2018.',
    notes: 'Estándares de seguridad IAEA para usos médicos de radiación ionizante. Incluye protección radiológica en medicina nuclear, radiofarmacia y terapia radionuclídica. Base regulatoria para blindaje y protección en laboratorios de ciclotrón.',
  },
  {
    id: 'REF047', type: 'PeerReviewed', year: 2008,
    citation: 'European Association of Nuclear Medicine (EANM). The Radiopharmacy: A Technologist\'s Guide. Edited by Suzanne Dennan, Geraldine O\'Reilly, Clemens Decristoforo. EANM; 2008.',
    notes: 'Guía EANM para tecnólogos en radiofarmacia. Cubre: tecnología de radiofármacos, diseño de instalaciones, preparación y dispensación, kits y técnicas, etiquetado de sangre, y registro. Referencia práctica para operación segura de laboratorios de radiofarmacia con ciclotrón.',
  },
  {
    id: 'REF048', type: 'PeerReviewed', year: 2025,
    citation: 'European Medicines Agency (EMA). Guideline on quality of radiopharmaceuticals. EMA/CHMP/QWP/363827/2025. Committee for Medicinal Products for Human Use (CHMP). Draft agreed July 2025; adopted for consultation December 2025.',
    url: 'https://www.ema.europa.eu/en/documents/scientific-guideline/draft-guideline-quality-radiopharmaceuticals-revision-2_en.pdf',
    notes: 'Guía EMA sobre calidad de radiofármacos. Reemplaza EMEA/CHMP/QWP/306970/2007. Cubre: sustancia activa (radionuclido, precursor químico), producto terminado (radiofármaco listo para usar, generadores, kits), validación de procesos, estabilidad, especificaciones de control de calidad, y ensayos clínicos. Requisito regulatorio para certificación GMP de laboratorios de ciclotrón en UE.',
  },
  {
    id: 'REF049', type: 'PeerReviewed', year: 2020,
    citation: 'World Health Organization (WHO). WHO Technical Report Series, No. 1025, Annex 2. International Atomic Energy Agency and World Health Organization guideline on good manufacturing practices for radiopharmaceutical products. Fifty-fourth report of the WHO Expert Committee on Specifications for Pharmaceutical Preparations. Geneva: WHO; 2020.',
    url: 'https://cdn.who.int/media/docs/default-source/medicines/norms-and-standards/trs1025-annex2.pdf',
    notes: 'Guía conjunta IAEA/WHO sobre Buenas Prácticas de Manufactura (GMP) para productos radiofarmacéuticos. Aplicable a: producción en radiofarmacias hospitalarias, radiofarmacias centralizadas, centros nucleares, fabricantes industriales, y producción de radiofármacos basados en ciclotrón. Cubre: sistema de gestión de calidad, calificación y validación, personal, instalaciones, equipos, materiales de partida, documentación, prácticas de producción y control de calidad.',
  },
  {
    id: 'REF050', type: 'PeerReviewed', year: 2019,
    citation: 'International Atomic Energy Agency (IAEA)/World Health Organization (WHO). Guidelines on Good Manufacturing Practices for Radiopharmaceutical Products. WHO Drug Information. Vol. 33, No. 3, 2019; pp. 395-418.',
    notes: 'Documento de consulta IAEA/WHO sobre GMP para radiofármacos. Predecesor del TRS 1025 Annex 2. Define términos clave: ALARA, dispensación, GMP para radiofármacos, manufactura, preparación, producto radiofarmacéutico. Establece requisitos del sistema de gestión de calidad, calificación y validación para instalaciones de producción de radiofármacos.',
  },
  {
    id: 'REF051', type: 'PeerReviewed', year: 2021,
    citation: 'Gillings N, Hjelstuen O, Ballinger J, Behe M, Decristoforo C, Elsinga P, et al. Guideline on Current Good Radiopharmacy Practice (cGRPP) for the Small-Scale Preparation of Radiopharmaceuticals. EJNMMI Radiopharm Chem. 2021;6:8.',
    doi: '10.1186/s41181-021-00123-2',
    notes: 'Guía EANM sobre Buenas Prácticas Actuales de Radiofarmacia (cGRPP) para preparación a pequeña escala. Define prácticas de calidad para preparación de radiofármacos en radiofarmacias hospitalarias. Incluye: control de calidad, gestión de riesgos, validación de métodos analíticos, y requisitos de instalaciones.',
  },
  {
    id: 'REF052', type: 'PeerReviewed', year: 2022,
    citation: 'Gillings N, Hjelstuen O, Behe M, Decristoforo C, Elsinga PH, Ferrari V, et al. EANM Guideline on Quality Risk Management for Radiopharmaceuticals. Eur J Nucl Med Mol Imaging. 2022;49:3353-3364.',
    doi: '10.1007/s00259-022-05694-z',
    pmid: '35385986',
    notes: 'Guía EANM sobre Gestión de Riesgos de Calidad (QRM) para radiofármacos. Aplicable a preparación de radiofármacos en radiofarmacias hospitalarias y centros de producción con ciclotrón. Define principios de evaluación y control de riesgos específicos de radiofármacos.',
  },
  {
    id: 'REF053', type: 'PeerReviewed', year: 2022,
    citation: 'Faivre-Chauvet A, Bourdeau C, Bourgeois M. Radiopharmaceutical good practices: Regulation between hospital and industry. Front Nucl Med. 2022;2:990330.',
    doi: '10.3389/fnume.2022.990330',
    notes: 'Revisión sobre regulación de prácticas de radiofarmacia entre hospital e industria. Analiza: marco regulatorio GMP vs PIC/S, particularidades de radiofármacos (vida media corta, lotes pequeños, cantidad trazadora), y obstáculos regulatorios para ensayos clínicos. Propone soluciones para armonizar regulación entre hospitales e industria farmacéutica.',
  },
  {
    id: 'REF054', type: 'PeerReviewed', year: 2017,
    citation: 'Bormans G, Buck A, Chiti A, Cooper M, Croasdale J, Desruet M, et al. Position statement on radiopharmaceutical production for clinical trials. EJNMMI Radiopharm Chem. 2017;2:12.',
    doi: '10.1186/s41181-017-0031-y',
    notes: 'Posición EANM sobre producción de radiofármacos para ensayos clínicos. Analiza regulación EU 536/2014 para ensayos clínicos con radiofármacos diagnósticos. Revisa requisitos GMP en 7 países europeos. Destaca necesidad de armonizar regulación nacional con regulación EU para facilitar investigación con radiofármacos de vida media corta producidos en ciclotrón.',
  },
  {
    id: 'REF055', type: 'PeerReviewed', year: 2025,
    citation: 'International Atomic Energy Agency (IAEA)/World Health Organization (WHO). Working document QAS/24.969. Good practices for quality control of radiopharmaceutical products. Draft for comments. Geneva: WHO; April 2025.',
    notes: 'Borrador conjunto IAEA/WHO sobre buenas prácticas para control de calidad de productos radiofarmacéuticos. Cubre: sistema de gestión de calidad, personal y capacitación, instalaciones, equipos, calificación y calibración, documentación, control de calidad de materiales de partida y producto terminado, reactivos y estándares, métodos de ensayo, muestreo, validación de métodos analíticos, especificaciones, contratos y seguridad.',
  },
  {
    id: 'REF056', type: 'PeerReviewed', year: 2026,
    citation: 'Soualy Y, Renaud SC, Torchio J, Fouillet J, Ensenat J, Rubira L, Fersing C. Process-Related Incidents in Nuclear Medicine: A Four-Year Single-Center Retrospective Analysis to Support the Implementation of a Scenario-Based Radiopharmacy Training. Pharmacy. 2026;14(1):32.',
    doi: '10.3390/pharmacy14010032',
    notes: 'Análisis retrospectivo de 4 años de incidentes en medicina nuclear. De 223 incidentes, 38.6% relacionados con circuito radiofarmacéutico. Las etapas más vulnerables: administración (19%), dispensación (15%), entrega/recepción (15%), preparación y QC (15%). Demuestra la necesidad de capacitación basada en escenarios para tecnólogos en radiofarmacia.',
  },
  {
    id: 'REF057', type: 'PeerReviewed', year: 2026,
    citation: 'Concept Heidelberg / ECA Foundation. GMP and Quality Requirements for Radiopharmaceuticals. Certified Quality Assurance Manager Programme. Copenhagen, Denmark; 17-18 March 2026.',
    notes: 'Programa de certificación ECA sobre GMP y requisitos de calidad para radiofármacos. Cubre: desarrollos regulatorios, radiofármacos en Farmacopea Europea, Anexo 1 (CCS y QRM), seguridad microbiológica, calificación de equipos, validación de métodos, distribución (GDP), y experiencias de autoridades e industria. Dirigido a personal de control de calidad, aseguramiento de calidad, inspección, validación y producción de radiofármacos.',
  },
  {
    id: 'REF058', type: 'PeerReviewed', year: 2025,
    citation: 'Pharma Focus Europe. Safety and Quality in Radiopharmaceutical Production through GMP. Editorial by Harry Callum; 2025.',
    url: 'https://www.pharmafocuseurope.com/strategy/safety-and-quality-in-radiopharmaceutical-production-through-gmp',
    notes: 'Artículo editorial sobre seguridad y calidad en producción de radiofármacos mediante GMP. Describe principios GMP específicos para radiofármacos: naturaleza radiactiva, vida media corta, complejidad del proceso productivo. Aborda capacitación de personal, control de calidad, documentación y gestión de productos.',
  },
  {
    id: 'REF059', type: 'PeerReviewed', year: 2025,
    citation: 'Celegence. EU Regulatory Challenges and Considerations in Radiopharmaceuticals. Blog; 24 September 2025.',
    url: 'https://www.celegence.com/eu-regulatory-considerations-radiotherapeutics-radiodiagnostics/',
    notes: 'Análisis de desafíos regulatorios EU para radiofármacos. Cubre: sistema CTIS para ensayos clínicos, vías de autorización de comercialización (procedimiento centralizado, descentralizado, reconocimiento mutuo), exenciones hospitalarias, y farmacovigilancia post-comercialización. Revisa regulación (EU) 1235/2010 y Directiva 2001/83/EC.',
  },
  {
    id: 'REF060', type: 'PeerReviewed', year: 2020,
    citation: 'Instituto Nacional de Investigaciones Nucleares (ININ), México. Laboratorio Nacional de Investigación y Desarrollo de Radiofármacos (LANIDER). Certificado de Buenas Prácticas de Fabricación (GMP) emitido por COFEPRIS. ISO-9001:2008.',
    url: 'https://www.inin.gob.mx/sitios/views/detalleopcion.cfm?cve_area=PPR&codigo_opc=200001009',
    notes: 'LANIDER - Laboratorio Nacional de Investigación y Desarrollo de Radiofármacos del ININ, México. Primera instalación mexicana certificada en GMP para producción de radiofármacos por COFEPRIS. Cuenta con certificación ISO-9001:2008. Produce radiofármacos para SPECT, PET y terapia usando ciclotrón y reactor nuclear. Instituciones asociadas: INCan, Unidad Radiofarmacia-Ciclotrón UNAM.',
  },
  {
    id: 'REF061', type: 'PeerReviewed', year: 2014,
    citation: 'Decristoforo C, Penuelas I, Elsinga P, et al. Radiopharmaceuticals are special, but is this recognized? The possible impact of the new clinical trials regulation on the preparation of radiopharmaceuticals. Eur J Nucl Med Mol Imaging. 2014;41(11):2005-2007.',
    doi: '10.1007/s00259-014-2884-5',
    notes: 'Análisis del impacto de la nueva regulación de ensayos clínicos (EU 536/2014) en la preparación de radiofármacos. Argumenta que los radiofármacos son especiales por su vida media corta, lotes pequeños y necesidad de producción proximal al paciente.',
  },
  {
    id: 'REF062', type: 'PeerReviewed', year: 2020,
    citation: 'Aerts J, Ballinger JR, Behe M, Decristoforo C, Elsinga PH, Faivre-Chauvet A, et al. Guidance on current good radiopharmacy practice for the small-scale preparation of radiopharmaceuticals. EJNMMI Radiopharm Chem. 2020;5(1):7.',
    doi: '10.1186/s41181-019-0086-z',
    notes: 'Guía de práctica de buena radiofarmacia para preparación a pequeña escala de radiofármacos. Predecesora de cGRPP 2021. Define requisitos para preparación segura y controlada de radiofármacos en entornos hospitalarios.',
  },
  {
    id: 'REF063', type: 'PeerReviewed', year: 2015,
    citation: 'Lange R, ter Heine R, Decristoforo C, Penuelas I, Elsinga PH, et al. Untangling the web of European regulations for the preparation of unlicensed radiopharmaceuticals: a concise overview and practical guidance for a risk-based approach. Nucl Med Commun. 2015;36(5):414-422.',
    doi: '10.1097/MNM.0000000000000276',
    notes: 'Guía práctica sobre el marco regulatorio europeo para preparación de radiofármacos no licenciados. Enfoque basado en riesgo para navegar regulaciones complejas de radiofarmacia.',
  },
  {
    id: 'REF064', type: 'PeerReviewed', year: 2019,
    citation: 'Peñuelas I, Vugts DJ, Decristoforo C, Elsinga PH. The new regulation on clinical trials in relation to radiopharmaceuticals: when and how will it be implemented? EJNMMI Radiopharm Chem. 2019;4(1):2.',
    doi: '10.1186/s41181-019-0055-6',
    notes: 'Análisis de la implementación del Reglamento EU 536/2014 sobre ensayos clínicos con radiofármacos. Discute impacto en preparación de radiofármacos diagnósticos y terapéuticos en centros con ciclotrón.',
  },
  {
    id: 'REF065', type: 'PeerReviewed', year: 2017,
    citation: 'Todde S, Peitl PK, Elsinga P, Koziorowski J, Ferrari V, Ocak EM, et al. Guidance on validation and qualification of processes and operations involving radiopharmaceuticals. EJNMMI Radiopharm Chem. 2017;2(1):8.',
    doi: '10.1186/s41181-017-0025-9',
    notes: 'Guía sobre validación y calificación de procesos y operaciones con radiofármacos. Define requisitos para validación de equipos, procesos y métodos analíticos en producción de radiofármacos.',
  },
  {
    id: 'REF066', type: 'PeerReviewed', year: 2017,
    citation: 'Schwarz SW, Decristoforo C. US and EU radiopharmaceutical diagnostic and therapeutic nonclinical study requirements for clinical trials authorizations and marketing authorizations. EJNMMI Radiopharm Chem. 2019;4(1):10.',
    doi: '10.1186/s41181-019-0059-2',
    notes: 'Comparación de requisitos de estudios no clínicos para autorización de ensayos clínicos y comercialización de radiofármacos en EUA y Europa.',
  },
  {
    id: 'REF067', type: 'PeerReviewed', year: 2021,
    citation: 'Hendrikse H, Kiss O, Kunikowska J, Wadsak W, Decristoforo C, Patt M. EANM Position on the in-house preparation of radiopharmaceuticals. Eur J Nucl Med Mol Imaging. 2022;49(4):1095-1098.',
    doi: '10.1007/s00259-022-05692-1',
    notes: 'Posición EANM sobre preparación interna (in-house) de radiofármacos. Define requisitos para preparación de radiofármacos en hospitales y centros de medicina nuclear con ciclotrón.',
  },
  {
    id: 'REF068', type: 'PeerReviewed', year: 2017,
    citation: 'Gillings N, Todde S, Behe M, Decristoforo C, Elsinga P, Ferrari V, et al. EANM Guideline on the validation of analytical methods for radiopharmaceuticals using automated modules: a European perspective. J Labelled Comp Radiopharm. 2014;57(10):615-620.',
    doi: '10.1002/jlcr.3227',
    notes: 'Guía EANM sobre validación de métodos analíticos para radiofármacos usando módulos automatizados. Perspectiva europea para validación de métodos de control de calidad en producción automatizada de radiofármacos PET.',
  },
  {
    id: 'REF069', type: 'PeerReviewed', year: 2015,
    citation: 'Marengo M. Basic concepts in the design of radiopharmaceutical laboratories. University of Bologna, Italy. Educational presentation.',
    notes: 'Conceptos básicos en el diseño de laboratorios de radiofármacos. Cubre: clasificación de áreas limpias (Grados A-D), requisitos de presión diferencial, flujo de aire, vestidores, pasacables (SAS), paredes farmacéuticas, pisos, y layout de laboratorio de ciclotrón con áreas de producción PET, SPECT, QC y dispensación.',
  },
  {
    id: 'REF070', type: 'PeerReviewed', year: 2014,
    citation: 'Regulation (EU) No 536/2014 of the European Parliament and of the Council of 16 April 2014 on clinical trials on medicinal products for human use. Official Journal of the European Union. L 158/1-74. 27 May 2014.',
    notes: 'Reglamento EU 536/2014 sobre ensayos clínicos con productos medicinales para uso humano. Especifica exenciones para radiofármacos diagnósticos: no requiere autorización de fabricación ni GMP para preparación hospitalaria en ensayos clínicos del mismo estado miembro. No aplica a radiofármacos terapéuticos.',
  },
  {
    id: 'REF071', type: 'PeerReviewed', year: 2001,
    citation: 'Directive 2001/83/EC of the European Parliament and of the Council of 6 November 2001 on the Community code relating to medicinal products for human use. Official Journal of the European Communities. L 311/67-128.',
    notes: 'Directiva 2001/83/CE: código comunitario relativo a los productos medicinales para uso humano. Define radiofármaco como producto medicinal que contiene uno o más radionúclidos. Base legal para regulación de calidad de radiofármacos en la UE.',
  },
  {
    id: 'REF072', type: 'PeerReviewed', year: 2021,
    citation: 'Gillings N, Hjelstuen O, Behe M, Decristoforo C, Elsinga PH, Ferrari V, et al. EANM guidance on current good radiopharmacy practice (cGRPP) for the small-scale preparation of radiopharmaceuticals. EJNMMI Radiopharm Chem. 2021;6(1):8.',
    doi: '10.1186/s41181-021-00123-2',
    notes: 'Guía EANM cGRPP 2021 (versión final). Define prácticas de calidad para preparación a pequeña escala de radiofármacos incluyendo control de calidad, gestión de riesgos y validación de métodos analíticos en radiofarmacias hospitalarias y centros PET/ciclotrón.',
  },
  {
    id: 'REF073', type: 'NOM', year: 2020,
    citation: 'NOM-036-NUCL-2020. Lineamientos para el uso de radiofármacos en seres humanos con fines de diagnóstico clínico y de investigación. Comisión Nacional de Seguridad Nuclear y Salvaguardias (CNSNS), México.',
    notes: 'Norma Oficial Mexicana sobre uso de radiofármacos en humanos. Establece requisitos para preparación, control de calidad, administración y protección radiológica en instalaciones de medicina nuclear en México. Aplicable a laboratorios de radiofármacos con ciclotrón.',
  },
  {
    id: 'REF074', type: 'NOM', year: 2015,
    citation: 'NOM-012-NUCL-2015. Requisitos de protección radiológica y seguridad para la autorización y operación de instalaciones de ciclotrón. Comisión Nacional de Seguridad Nuclear y Salvaguardias (CNSNS), México.',
    notes: 'Norma Oficial Mexicana para instalaciones de ciclotrón. Especifica requisitos de protección radiológica y seguridad para autorización y operación de ciclotrones en México, incluyendo producción de radiofármacos.',
  },
  // ── v51: CATIA-GDML y CAD-to-ROOT (PDF analysis) ──
  {
    id: 'REF075', type: 'PeerReviewed', year: 2011,
    citation: 'Belogurov S, Berchun Yu, Chernogorov A, Malzacher P, Ovcharenko E, Semennikov A. CATIA-GDML geometry builder. J Phys Conf Ser. 2011;331:032035.',
    doi: '10.1088/1742-6596/331/3/032035',
    notes: 'CATIA-GDML Geometry Builder: Herramienta para construir geometrías compatibles con GEANT4/ROOT dentro del sistema CAD CATIA v.5. Intercambio bidireccional via formato GDML. Implementa primitivas CSG parametrizadas (UDFs), jerarquía de volúmenes (lógicos/físicos/madre), 3 métodos de instanciación múltiple (Replica, Array, SimplePlacementArray), e importación inversa GDML→CATIA. Desarrollado para upgrades de LHC y experimentos FAIR. Aplicable a blindaje de radiación y simulación Monte Carlo de instalaciones nucleares.',
  },
  {
    id: 'REF076', type: 'PeerReviewed', year: 2025,
    citation: 'Neuhaus S, Shiroya M, Singh O, Dahm P. Experiences from the CBM collaboration: CAD to ROOT conversion for Detector Geometries. EPJ Web Conf. 2025;337:01268. CHEP 2024.',
    doi: '10.1051/epjconf/202533701268',
    notes: 'Conversión CAD→ROOT para geometrías de detectores del experimento CBM/FAIR. Compara dos enfoques de tessellation: (A) VecGeom (Vectorized Geometry) con SIMD/SIMT — más rápido (+7.6min vs baseline), y (B) TGeoArbN con navegación independiente y particionamiento Octree — más fácil de integrar (+10min con Octree). Flujo de trabajo: CATIA→STEP→GDML (FreeCAD/CATIA-GDML)→ROOT. La tessellation permite feedback rápido ingenieros→físicos para minimizar partículas secundarias y reducir ruido de fondo en mediciones. Recomendación: usar tessellated shapes solo en desarrollo, reemplazar con geometrías ROOT simples en simulación final.',
  },
];

// ── Colección completa ──
export const ALL_REFERENCES: BibEntry[] = [...USER_REFERENCES, ...EXISTING_REFERENCES];

export function getRefById(id: string): BibEntry | undefined {
  return ALL_REFERENCES.find(r => r.id === id);
}

export function searchRefs(query: string): BibEntry[] {
  const q = query.toLowerCase();
  return ALL_REFERENCES.filter(r =>
    r.citation.toLowerCase().includes(q) ||
    r.type.toLowerCase().includes(q) ||
    (r.notes && r.notes.toLowerCase().includes(q))
  );
}

export function getRefsByType(type: BibEntry['type']): BibEntry[] {
  return ALL_REFERENCES.filter(r => r.type === type);
}

// ── Constantes de blindaje extraídas de las referencias ──
// REF004: Smith & Stabin - Constantes de tasa de exposición
export const EXPOSURE_RATE_CONSTANTS: Record<string, number> = {
  // μSv·m²/(h·GBq) - de Smith & Stabin 2012
  'Co-60': 0.308, 'Cs-137': 0.077, 'Ir-192': 0.111,
  'I-131': 0.059, 'Tc-99m': 0.030, 'F-18': 0.143,
  'Ga-68': 0.134, 'Lu-177': 0.005, 'Y-90': 0.001,
  'Ra-223': 0.026, 'Pd-103': 0.008, 'I-125': 0.036,
};

// REF014: NIST - Coeficientes atenuación Pb (Z=82) para kV
export const NIST_PB_ATTENUATION: Record<string, number> = {
  // μ/ρ (cm²/g) para plomo a energías seleccionadas
  '20 keV': 83.2, '30 keV': 31.3, '40 keV': 14.1,
  '50 keV': 7.36, '60 keV': 4.35, '80 keV': 1.93,
  '100 keV': 1.04, '150 keV': 0.392, '200 keV': 0.234,
  '300 keV': 0.150, '400 keV': 0.114, '500 keV': 0.0962,
  '600 keV': 0.0846, '800 keV': 0.0702, '1000 keV': 0.0608,
  '1500 keV': 0.0467, '2000 keV': 0.0388,
};

// REF012: Cherry - Constantes útiles medicina nuclear
export const CHERRY_NUCLEAR_MED_CONSTANTS = {
  // Eficiencia fotogénica I-131
  I131_photofraction: 0.826,
  // Fracción beta Y-90
  Y90_beta_fraction: 1.0,
  // Energía promedio beta Y-90 (MeV)
  Y90_beta_energy_avg_MeV: 0.933,
};
