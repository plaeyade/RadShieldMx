/**
 * ═══════════════════════════════════════════════════════════
 * Preloaded Documents — NCRP 144, NCRP 151, Concreto Baritado
 * Content extracted from PDFs for RAG ingestion
 * ═══════════════════════════════════════════════════════════
 */

export interface PreloadedDoc {
  docId: string;
  title: string;
  source: string;
  authors?: string;
  year: number;
  standard: string;
  docType: 'ncrp' | 'iaea' | 'icru' | 'generic';
  content: string;
}

// ─── NCRP 144 — Radiation Protection for Particle Accelerator Facilities ───
const NCRP_144_CONTENT = `
NCRP Report No. 144 — Radiation Protection for Particle Accelerator Facilities (2003)

Executive Summary:
This Report provides guidance on radiation protection for particle accelerator facilities. It replaces NCRP Report No. 51 (1977) and extends the energy range up to the gigaelectron volt region. Key topics include: shielding data, skyshine radiation, transmission through ducts and labyrinths, induced radioactivity, and environmental considerations.

Chapter 1 — Introduction:
Particle accelerators produce ionizing radiation through beam interactions with accelerator components, shielding, and surrounding structures. Radiation protection at accelerator facilities requires understanding of: prompt radiation fields, induced radioactivity, skyshine, and environmental impact.

Section 1.5 — Radiological Protection Standards:
The design dose limits for controlled areas are typically 0.02 mSv/week for whole body exposure. For unrestricted areas, the limit is 0.002 mSv/week (0.1 mSv/year). ALARA principles should be applied to all designs.

Chapter 2 — Particle Accelerators and Accelerator Facilities:
Section 2.13 — Siting and Layout:
Accelerator facilities should be sited considering: proximity to occupied areas, prevailing wind direction for airborne radioactivity, geological stability, and future expansion needs. The layout should minimize radiation exposure pathways and provide adequate shielding for all occupied areas.

Chapter 3 — Sources of Ionizing Radiation from Accelerators:
Section 3.2 — General Considerations:
The primary radiation sources at accelerators are: primary radiation (direct beam), secondary radiation (scattered and leakage), neutrons from high-energy interactions, induced radioactivity in components and shielding, and skyshine.

Section 3.3 — Radiation Production at Electron Accelerators:
Electron accelerators produce Bremsstrahlung (x-rays) when electrons interact with high-Z targets. The radiation field consists of: forward-directed Bremsstrahlung, side-scattered radiation, neutron production above ~10 MeV, and induced activity in targets and beam stops.

Section 3.3.3.1 — External Bremsstrahlung:
For electron energies below 100 MeV, the Bremsstrahlung yield can be calculated using the Schiff formula. The angular distribution is forward-peaked at higher energies. Shielding calculations must account for both the primary beam direction and scattered radiation.

Section 3.3.4 — Neutron Production:
Neutron production becomes significant at electron energies above approximately 10 MeV. The neutron yield increases rapidly with energy, roughly as E^3. Neutron shielding requires hydrogenous materials (concrete, polyethylene) with sufficient thickness to thermalize and absorb neutrons.

Section 3.4 — Radiation Protection at Proton Accelerators:
Proton accelerators produce complex radiation fields including: primary proton beams, secondary neutrons, charged particles, spallation products, and muons at high energies.

Section 3.4.3 — Neutron Yields:
For proton energies below 200 MeV, neutron production is dominated by nuclear reactions. The neutron dose equivalent per unit proton charge can be estimated using the formula: H = Q * Y(E) * f, where Q is the proton charge, Y(E) is the neutron yield, and f is the dose conversion factor.

Section 3.4.3.3 — Neutron Production at High Energies (E > 1 GeV):
At energies above 1 GeV, hadronic cascades dominate the radiation field. The neutron dose equivalent outside thick shields can be estimated using the Moyer model or Monte Carlo simulations. The attenuation follows an exponential law with energy-dependent attenuation lengths.

Section 3.4.6.2 — Spectra Outside Accelerator Shielding:
The neutron spectrum outside thick concrete shielding is dominated by thermal and epithermal neutrons. For shielding calculations, the dose equivalent can be estimated using: H = H0 * exp(-d/L) where H0 is the unshielded dose, d is the shield thickness, and L is the attenuation length (typically 30-40 g/cm² for concrete).

Chapter 4 — Radiation Protection Design:
Section 4.2 — Shielding Design Philosophy:
Shielding design should follow a graded approach: identify all radiation sources, calculate dose rates at points of interest, determine required shielding thickness based on dose limits, apply safety factors (typically 2x), and verify with measurements after construction.

Section 4.5 — Labyrinths and Mazes:
Labyrinths provide effective neutron shielding through multiple scattering. The neutron attenuation through a labyrinth follows an empirical relationship: the dose at each leg is approximately 1/5 to 1/10 of the previous leg. The cross-sectional area should be kept constant to avoid streaming.

Section 4.6 — Skyshine:
Skyshine radiation occurs when the primary beam or scattered radiation is directed upward and scatters in the atmosphere back to ground level. The skyshine dose at distance r from the source can be estimated using: D(r) = D0 * exp(-r/Ls) / r², where Ls is the skyshine length (typically 100-300 m).

Section 4.7 — Induced Radioactivity:
Induced radioactivity is produced when accelerator components and shielding materials are activated by high-energy particle interactions. Common radionuclides include: Be-7, Na-22, Mn-54, Co-60, and various activation products. Cooling times should be considered in maintenance planning.

Chapter 5 — Shielding Materials:
Section 5.1 — Concrete:
Ordinary concrete (density 2.35 g/cm³) is the most common shielding material. TVL values range from 30-45 cm depending on energy. Heavy concrete (with iron or barite aggregates, density up to 3.5 g/cm³) provides better attenuation per unit thickness.

Section 5.2 — Lead:
Lead (density 11.34 g/cm³) provides excellent shielding for x-rays and gamma rays but is ineffective against neutrons. Typical applications include: door shielding, viewport shielding, and portable shields. Cost is approximately $5-10/kg.

Section 5.3 — Steel:
Steel (density 7.87 g/cm³) is used for structural shielding and beam stops. It provides good attenuation for both photons and neutrons but is more expensive than concrete.

Section 5.4 — Composite Materials:
Layered shielding (e.g., lead + polyethylene) is effective for mixed radiation fields. The lead attenuates photons while the polyethylene thermalizes and absorbs neutrons.

Appendix — Shielding Calculation Methods:
For maze calculations, the dose at the maze entrance can be estimated by: H_entrance = H_wall * (A0/An) * product of reflection coefficients, where A0 is the cross-sectional area at the source end and An is the area at the entrance.
`;

// ─── NCRP 151 — Updated content (key sections) ───
const NCRP_151_CONTENT = `
NCRP Report No. 151 — Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities (2005)

Chapter 2 — Métodos de cálculo:
Section 2.1 — Conceptos básicos:
El diseño de blindaje estructural para instalaciones de radioterapia de megavoltaje se basa en el principio de que la dosis equivalente semanal en áreas ocupadas no debe exceder los límites de diseño. Para áreas controladas: 0.1 mSv/semana (0.02 mSv/semana para instalaciones nuevas siguiendo ALARA). Para áreas no controladas: 0.02 mSv/semana.

Section 2.2 — Barreras primarias:
El espesor de barrera primaria se calcula usando: B = P / (W * U * T) donde P es el límite de dosis, W es la carga de trabajo semanal en Gy, U es el factor de uso, y T es el factor de ocupación.

El número de valores de transmisión (TVL) requeridos se calcula como: n = -log10(B). El espesor físico es: t = n * TVL para n > 1, o t = HVL para n < 1.

Section 2.2.1 — Enfoque estándar:
Para aceleradores lineales, los valores típicos de TVL en concreto (2.35 g/cm³) son:
- 4 MV: TVL primaria = 28 cm, TVL secundaria = 25 cm
- 6 MV: TVL primaria = 34 cm, TVL secundaria = 29 cm
- 10 MV: TVL primaria = 39 cm, TVL secundaria = 34 cm
- 15 MV: TVL primaria = 43 cm, TVL secundaria = 37 cm
- 18 MV: TVL primaria = 46 cm, TVL secundaria = 40 cm

Section 2.2.2 — Anchos de barrera:
El ancho de la barrera primaria debe cubrir la máxima desviación angular del haz más un margen de seguridad de 30 cm a cada lado. Para rotaciones isocéntricas típicas de ±180°, el ancho mínimo es: w = 2 * d * tan(θ) + 0.6 m, donde d es la distancia fuente-pared y θ es el ángulo máximo.

Section 2.2.3 — Barreras laminadas:
Para barreras que contienen múltiples materiales (por ejemplo, concreto + plomo), el espesor equivalente se calcula convirtiendo cada material a su equivalente en concreto usando los factores de equivalencia de densidad.

Section 2.3 — Barreras secundarias:
La radiación secundaria incluye: dispersión del paciente, radiación de fuga de la cabeza, y radiación dispersada por paredes. La dosis equivalente de radiación dispersada se calcula como:

H_sec = (W * T) / (d_sec²) * (F * α / d_scatter²) * B

donde F es el campo de tratamiento (cm²), α es el coeficiente de dispersión, d_scatter es la distancia fuente-paciente, y d_sec es la distancia dispersor-punto de interés.

Section 2.4 — Puertas y laberintos:

Section 2.4.1 — Aceleradores de baja energía (< 10 MV):
Para energías menores a 10 MV, no se producen neutrones significativos. El laberinto atenúa la radiación dispersada siguiendo un modelo geométrico.

Section 2.4.2 — Aceleradores de alta energía (≥ 10 MV):
Para energías ≥ 10 MV, se producen neutrones por fotodisintegración. El laberinto debe diseñarse para atenuar tanto fotones como neutrones.

Section 2.4.2.1 — Cálculo de la dosis equivalente de fotones en la Puerta del Laberinto:
H_door_photon = H_wall * (A0 / A1) * (α1 / (d1² * d2²)) * (A1 / An) * B_door

donde H_wall es la dosis en la pared interior del laberinto, A0 es el área del primer tramo, A1 es el área del segundo tramo, α1 es el coeficiente de reflexión de la pared, d1 y d2 son las distancias del recorrido del laberinto.

Section 2.4.2.2 — Dosis de neutrones equivalente en el Laberinto:
Para neutrones, se usa el método de Kersey o el método modificado de Kersey. La atenuación de neutrones a través de un laberinto sigue una ley exponencial con longitud de atenuación característica de aproximadamente 5 m para concreto.

Método de Kersey modificado:
H_n_door = H_n_wall * 10^(-d_maze / 5m) * f_capture

donde d_maze es la longitud total del laberinto en metros y f_capture es el factor de captura de neutrones (típicamente 2-5 para puertas con polietileno borado).

Section 2.4.2.3 — Dosis Total Equivalente en la Puerta:
H_total = H_photon + H_n + H_capture_gamma

La radiación de captura gamma se produce cuando neutrones térmicos son capturados en el blindaje, emitiendo gammas de captura de aproximadamente 2.2 MeV (en hidrógeno).

Chapter 3 — Carga de trabajo y factores:

Section 3.1 — Procedimientos convencionales:
Las cargas de trabajo típicas (NCRP 151 Tabla 4.1) son:
- 3D-CRT convencional: W = 450 Gy/semana, 25 pacientes/semana
- IMRT: W = 450 Gy/semana, 25 pacientes/semana (factor C1 = 2.5)
- VMAT/RapidArc: W = 450 Gy/semana, 25 pacientes/semana (factor C1 = 4.0)
- SBRT/SABR: W = 100 Gy/semana, 5 pacientes/semana (factor C1 = 5.0)
- SRS monocesión: W = 50 Gy/semana, 10 pacientes/semana (factor C1 = 8.0)
- Cobalto-60: W = 20 Gy/semana, 15 pacientes/semana

Section 3.1.2 — Factores de uso:
Los factores de uso típicos son:
- Pared con haz primario: U = 0.25 (isocéntrico, rotación completa)
- Techo con haz primario: U = 0.083 (rotación parcial hacia arriba)
- Suelo con haz primario: U = 0.083 (rotación parcial hacia abajo)
- Barreras secundarias: U = 1.0 (siempre hay radiación secundaria)

Chapter 4 — Detalles estructurales:

Section 4.1.3 — Tamaño de la sala de tratamiento:
Las dimensiones mínimas recomendadas para una sala de tratamiento con laberinto son:
- Ancho mínimo: 6.0 m (para rotación isocéntrica completa)
- Largo mínimo: 7.5 m (incluyendo laberinto de 2.0-2.5 m)
- Altura mínima: 2.8 m
- Distancia fuente-isocentro: 1.0 m (Varian/Elekta)

Section 4.3 — Materiales de blindaje:

Section 4.3.1 — Hormigón ordinario:
Concreto ordinario con densidad de 2.35 g/cm³ es el material de blindaje más común. Ventajas: bajo costo, fácil construcción, buenas propiedades estructurales. TVL para 6 MV: 34 cm (primario), 29 cm (secundario).

Section 4.3.2 — Hormigón pesado:
Concreto pesado usa agregados de hierro, barita (sulfato de bario), o magnetita para aumentar la densidad.
- Concreto con barita: densidad 2.8-3.5 g/cm³, TVL 6MV primario = 22-28 cm
- Concreto con hierro: densidad 3.2-4.0 g/cm³, TVL 6MV primario = 18-24 cm
- Concreto con magnetita: densidad 3.2-3.8 g/cm³, TVL 6MV primario = 20-26 cm

Section 4.3.3 — Plomo:
Plomo laminado (densidad 11.34 g/cm³). Usado para blindaje de puertas, ventanas, y áreas con restricciones de espacio. HVL para Cobalto-60: 11 mm. TVL para Cobalto-60: 40 mm.

Section 4.3.4 — Acero:
Acero estructural (densidad 7.87 g/cm³). Usado en vigas, anclajes, y blindaje estructural. La TVL para 6 MV es aproximadamente 11 cm.

Section 4.3.5 — Polietileno y parafina:
Usado principalmente para blindaje de neutrones. El polietileno borado (con 5% de B4C) es especialmente efectivo para capturar neutrones térmicos sin producir radiación de captura gamma significativa.

Section 4.6 — Conductos:

Section 4.6.1.1 — Habitaciones con laberintos:
Los conductos de HVAC deben evitar el streaming de radiación. La trayectoria debe tener al menos dos cambios de dirección de 90°. El área de la sección transversal debe ser menor que 0.05 m² o el conducto debe tener blindaje equivalente.

Section 4.6.1.2 — Habitaciones sin laberintos:
Para salas sin laberinto, todos los conductos deben tener blindaje de plomo o concreto a lo largo de toda su trayectoria hasta salir del edificio.

Chapter 5 — Consideraciones especiales:

Section 5.1 — Radiaciones Skyshine:
El skyshine se produce cuando la radiación escapa hacia arriba y se dispersa en la atmósfera. La dosis a distancia r del búnker se estima con:

D_skyshine(r) = k * D0 * (area_apertura) / (r² * H_roof)

donde k es un factor empírico (0.0069 para fotones de megavoltaje), D0 es la dosis no blindada, area_apertura es el área de la abertura en el techo, y H_roof es la altura del techo sobre la fuente.

Section 5.2 — Radiación de fotones con dispersión lateral:
Para evaluar la radiación que se dispersa lateralmente alrededor del búnker, se usa el método de McGinley:

H_lat = (W * U * T * α_wall) / (d_wall² * d_lat²) * B_wall

donde α_wall es el coeficiente de reflexión de la pared (0.02-0.05 para concreto) y d_lat es la distancia lateral.

Section 5.3 — Radiación terrestre:
La radiación terrestre (groundshine) ocurre cuando el haz primario o dispersado penetra el suelo y se dispersa hacia áreas subterráneas o adyacentes. Se calcula de manera similar al skyshine pero considerando las propiedades de atenuación del suelo.

Section 5.4 — Activación:
Para energías superiores a 10 MV, se produce activación del aire, concreto, y componentes del acelerador. Los radionuclídeos principales son: N-13, O-15, C-11, Ar-41. Los tiempos de semidesintegración son cortos (minutos a horas).

Section 5.5 — Producción de ozono:
La producción de ozono en salas de tratamiento con energías > 10 MV debe considerarse en el diseño de ventilación. La tasa de producción depende de la energía, corriente de haz, y volumen de la sala. Se requieren típicamente 6-10 cambios de aire por hora.

Section 5.9 — Unidades de cobalto-60:
Para unidades de Cobalto-60, la actividad típica es de 5,000-10,000 Ci (185-370 TBq). Los valores de HVL/TVL son independientes de la actividad. HVL en plomo = 11 mm, TVL en plomo = 40 mm. TVL en concreto = 196 mm (primario), 166 mm (secundario).

Appendix B — Tablas de datos:
Tabla B.1 — Valores de TVL para concreto ordinario (2.35 g/cm³):
Energía (MV) | TVL primaria (cm) | TVL secundaria (cm) | HVL (cm)
4  | 28 | 25 | 9.0
6  | 34 | 29 | 11.0
10 | 39 | 34 | 12.6
15 | 43 | 37 | 13.9
18 | 46 | 40 | 14.9
25 | 49 | 42 | 15.9

Tabla B.2 — Factores de ocupación típicos:
Área | Factor T
Sala de control | 1.0
Pasillo | 0.2
Área de espera | 0.125
Área de tratamiento (paciente) | 0.05
Exterior (estacionamiento) | 0.025
Vestíbulo | 0.05
Baños | 0.05

Appendix C — Control de neutrones:

Section C.1 — Consideraciones sobre neutrones:
Para aceleradores con energías ≥ 10 MV, el blindaje de neutrones es obligatorio. Los neutrones se producen por fotodisintegración del núcleo en el blanco, colimadores, y blindaje.

Section C.2 — Métodos de cálculo:
El espesor de blindaje de neutrones se calcula basándose en: 1) la fluencia de neutrones fuente, 2) el coeficiente de atenuación del material (para concreto: Σ ≈ 0.1 cm⁻¹ para neutrones rápidos), y 3) el límite de dosis para neutrones (0.02 mSv/semana para áreas no controladas).
`;

// ─── Concreto Baritado SYAR-X TECNOC ───
const CONCRETO_BARITADO_CONTENT = `
CONCRETO BARITADO SYAR-X TECNOC — Ficha Técnica

Composición Química:
- BaSO4 (Sulfato de Bario): 91.15%
- SiO2 (Dióxido de Silicio): 5.03%
- Al2O3 (Óxido de Aluminio): 1.26%
- SO3 (Trióxido de Azufre): 3.26%
- Fe2O3 (Óxido de Hierro): 0.63%
- CaO (Óxido de Calcio): 0.26%
- K2O (Óxido de Potasio): 0.29%
- MgO (Óxido de Magnesio): 0.07%
- Na2O (Óxido de Sodio): 0.17%
- Mn2O3 (Óxido de Manganeso): 0.05%

Densidad: 3.2 g/cm³ (3200 kg/m³)
VOC (Compuestos Orgánicos Volátiles): Ninguno

Aplicación:
Se aplica como aplanado directamente sobre los muros en salas de diagnóstico por rayos X. El espesor normal es entre 2 y 3 cm para radiología general, y hasta 5-6 cm para áreas de alta radiación (medicina nuclear, tomografía).

Preparación:
Mezcla: Agregar agua y 15 kg de arena fina por cada saco de 30 kg hasta obtener una mezcla consistente.
Aplicación: Aplicar directamente sobre los muros en capas de no más de 15 mm cada vez hasta obtener el espesor requerido.
Acabados: Cubrir con loseta vinílica, cerámica, etc.

Equivalencia en Plomo:
| Espesor Barita | Saco 30kg/m² | Equivalente Plomo |
| 2 cm | 30 kg | 1.0 mm Pb |
| 3 cm | 45 kg | 1.5 mm Pb |
| 4 cm | 60 kg | 2.0 mm Pb |
| 5 cm | 75 kg | 2.5 mm Pb |
| 6 cm | 90 kg | 3.0 mm Pb |

Nota: Para salas de diagnóstico general con rayos X, el requerimiento de espesor es normalmente entre 2.0-4.0 cm.

Juntas y Grietas:
Bajo ninguna circunstancia deben dejarse grietas. La mezcla en el piso debe ser cubierta con loseta vinílica, cerámica, etc.

Rendimiento:
1 m² × 1 m × espesor requerido:
- 2 cm: requiere 30 kg de producto (1 saco)
- 3 cm: requiere 45 kg de producto (1.5 sacos)
- 4 cm: requiere 60 kg de producto (2 sacos)
- 5 cm: requiere 75 kg de producto (2.5 sacos)
- 6 cm: requiere 90 kg de producto (3 sacos)

Empaque: Saco de 30 Kg
Almacenaje: Almacenar en área seca, no dejar los sacos expuestos al sol
Tiempo de vida: Un año sin abrir
Garantía: Garantía ilimitada

Blindaje para diferentes modalidades:
- Radiología general (RX): 2-3 cm (equivalente 1.0-1.5 mm Pb)
- Tomografía (CT): 3-4 cm (equivalente 1.5-2.0 mm Pb)
- Mastografía: 2-3 cm (equivalente 1.0-1.5 mm Pb)
- Fluoroscopia: 3-5 cm (equivalente 1.5-2.5 mm Pb)
- Medicina Nuclear: 5-6 cm (equivalente 2.5-3.0 mm Pb)

Comparación con otros materiales de blindaje:
- Plomo (11.34 g/cm³): Mayor atenuación pero tóxico y costoso
- Concreto ordinario (2.35 g/cm³): Menor atenuación pero económico
- Concreto baritado (3.2 g/cm³): Balance óptimo entre atenuación y costo
- Concreto con magnetita (3.5 g/cm³): Similar al baritado, disponibilidad variable

Consideraciones de diseño:
El concreto baritado es ideal para salas de diagnóstico donde se requiere blindaje moderado (hasta 3 mm Pb equivalente). Para terapia de megavoltaje (LINAC, Cobalto-60), se requiere concreto ordinario o pesado en espesores mucho mayores (100-250 cm).
`;

// ─── Export all preloaded documents ───
export const PRELOADED_DOCUMENTS: PreloadedDoc[] = [
  {
    docId: 'ncrp-144',
    title: 'NCRP Report No. 144 — Radiation Protection for Particle Accelerator Facilities',
    source: 'National Council on Radiation Protection and Measurements',
    authors: 'Ralph H. Thomas et al.',
    year: 2003,
    standard: 'NCRP-144',
    docType: 'ncrp',
    content: NCRP_144_CONTENT,
  },
  {
    docId: 'ncrp-151-v2',
    title: 'NCRP Report No. 151 — Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities (Full Text)',
    source: 'National Council on Radiation Protection and Measurements',
    authors: 'James A. Deye et al.',
    year: 2005,
    standard: 'NCRP-151',
    docType: 'ncrp',
    content: NCRP_151_CONTENT,
  },
  {
    docId: 'concreto-baritado-syar-x',
    title: 'Concreto Baritado SYAR-X TECNOC — Ficha Técnica de Protección Radiológica',
    source: 'TERCNOC / xrays.mx',
    authors: 'TERCNOC',
    year: 2024,
    standard: 'SYAR-X-TECNOC',
    docType: 'generic',
    content: CONCRETO_BARITADO_CONTENT,
  },
];

// Helper to get document by ID
export function getPreloadedDocument(docId: string): PreloadedDoc | undefined {
  return PRELOADED_DOCUMENTS.find(d => d.docId === docId);
}

// Helper to get all standards
export function getPreloadedStandards(): string[] {
  return [...new Set(PRELOADED_DOCUMENTS.map(d => d.standard))];
}
