#!/usr/bin/env tsx
/**
 * ═══════════════════════════════════════════════════════════
 * Knowledge Ingestion v2 — Enriched from Real PDF Sources
 * Data extracted from: NCRP 151, TG 108, Shielding Examples
 * ═══════════════════════════════════════════════════════════
 */

import { insertChunk, countChunks, deleteAllChunks } from "../api/lib/vectorStore";
// Objetivos de diseño P: fuente única src/lib/limitesDosis.ts (NCRP 147 §1.3 / NCRP 151 §1.2).
import { P_CONTROLADA_mSv_semana, P_NO_CONTROLADA_mSv_semana } from "../src/lib/limitesDosis";

// ─── NCRP 151 Table B.1 — Complete TVL Data ───
const NCRP151_TVL = [
  // Co-60
  { energy: "Co-60", mat: "Concrete", tvl1: 21, tvle: 21, modality: "Co-60" },
  { energy: "Co-60", mat: "Steel", tvl1: 7.0, tvle: 7.0, modality: "Co-60" },
  { energy: "Co-60", mat: "Lead", tvl1: 4.0, tvle: 4.0, modality: "Co-60" },
  // 4 MV
  { energy: "4 MV", mat: "Concrete", tvl1: 29, tvle: 26, modality: "LINAC" },
  { energy: "4 MV", mat: "Steel", tvl1: 7.0, tvle: 7.0, modality: "LINAC" },
  { energy: "4 MV", mat: "Lead", tvl1: 4.0, tvle: 4.0, modality: "LINAC" },
  // 6 MV
  { energy: "6 MV", mat: "Concrete", tvl1: 37, tvle: 33, modality: "LINAC" },
  { energy: "6 MV", mat: "Steel", tvl1: 10, tvle: 10, modality: "LINAC" },
  { energy: "6 MV", mat: "Lead", tvl1: 5.7, tvle: 5.7, modality: "LINAC" },
  // 10 MV
  { energy: "10 MV", mat: "Concrete", tvl1: 37, tvle: 37, modality: "LINAC" },
  { energy: "10 MV", mat: "Steel", tvl1: 11, tvle: 11, modality: "LINAC" },
  { energy: "10 MV", mat: "Lead", tvl1: 5.7, tvle: 5.7, modality: "LINAC" },
  // 15 MV
  { energy: "15 MV", mat: "Concrete", tvl1: 44, tvle: 41, modality: "LINAC" },
  { energy: "15 MV", mat: "Steel", tvl1: 11, tvle: 11, modality: "LINAC" },
  { energy: "15 MV", mat: "Lead", tvl1: 5.7, tvle: 5.7, modality: "LINAC" },
  // 18 MV
  { energy: "18 MV", mat: "Concrete", tvl1: 45, tvle: 43, modality: "LINAC" },
  { energy: "18 MV", mat: "Steel", tvl1: 11, tvle: 11, modality: "LINAC" },
  { energy: "18 MV", mat: "Lead", tvl1: 5.7, tvle: 5.7, modality: "LINAC" },
  // 20 MV
  { energy: "20 MV", mat: "Concrete", tvl1: 46, tvle: 44, modality: "LINAC" },
  { energy: "20 MV", mat: "Steel", tvl1: 11, tvle: 11, modality: "LINAC" },
  { energy: "20 MV", mat: "Lead", tvl1: 5.7, tvle: 5.7, modality: "LINAC" },
  // 24 MV
  { energy: "24 MV", mat: "Concrete", tvl1: 48, tvle: 46, modality: "LINAC" },
  { energy: "24 MV", mat: "Steel", tvl1: 11, tvle: 11, modality: "LINAC" },
  { energy: "24 MV", mat: "Lead", tvl1: 5.7, tvle: 5.7, modality: "LINAC" },
];

// ─── NCRP 151 Table B.2 — Occupancy Factors ───
const NCRP151_OCCUPANCY = [
  { area: "Full occupancy (control room, office, nurse station, reception)", T: 1.0 },
  { area: "Patient examination and treatment room", T: 0.5 },
  { area: "Corridor, patient waiting room, staff rest room", T: 0.2 },
  { area: "Public toilet, vending area, storage room", T: 0.125 },
  { area: "Outdoor area with seating (benches, patios)", T: 0.05 },
  { area: "Outdoor area with only transient pedestrian or vehicular traffic", T: 0.025 },
  { area: "Unused attic or basement, stairway, elevator, parking lot", T: 0.0125 },
];

// ─── NCRP 151 Complete Sections with Rich Content ───
const NCRP151_SECTIONS = [
  {
    section: "Section 2.1.1 — Primary Barrier Calculation",
    content: `Primary Barrier Design for Megavoltage X- and Gamma-Ray Radiotherapy Facilities (NCRP 151).

The primary barrier is any wall, ceiling, or floor that the useful (primary) beam can intercept. The barrier transmission factor B_pri is calculated as:

B_pri = (P * d_pri^2) / (W * U * T)

Where:
- P = shielding design goal (Sv/week or mSv/week). Typical: ${P_NO_CONTROLADA_mSv_semana} mSv/wk for uncontrolled, ${P_CONTROLADA_mSv_semana} mSv/wk for controlled (NCRP 151 §1.2).
- d_pri = distance from x-ray target to measurement point (meters)
- W = workload (Gy/week at 1m)
- U = use factor (fraction of time beam is directed at the barrier). U=1 for floor (isocentric), U=0.25 for walls (gantry rotates over 4 walls).
- T = occupancy factor (fraction of time people are present)

The required number of TVLs is: n = -log10(B_pri)

The barrier thickness is: t_barrier = TVL1 + (n-1) * TVLe

Where TVL1 is the first tenth-value layer and TVLe is the equilibrium TVL (used after the first TVL to account for spectral changes). This approach reduces the amount of concrete needed compared to using n * TVL1.

Primary Barrier Width: Consider the maximum field size diagonal and add at least 30 cm to each side. For a 40x40 cm field, the diagonal is ~57 cm, so the primary barrier width should be at least 57 + 60 = 117 cm (about 1.2 m).`,
    tags: ["primary barrier", "TVL", "TVLe", "transmission", "formula", "NCRP 151"],
    energyMin: 4, energyMax: 24,
  },
  {
    section: "Section 2.1.2 — Secondary Barriers (Scatter and Leakage)",
    content: `Secondary Barrier Design — Scatter and Leakage (NCRP 151).

Scatter Radiation: The dose from scatter is:
K_sec = a * (W_T * T) / (d_scatter^2 * d_sec^2)

Where:
- a = scatter fraction (from Table B.4a), depends on scatter angle theta and energy
- W_T = workload at scatter angle theta
- T = occupancy factor
- d_scatter = distance from target to scatterer (m)
- d_sec = distance from scatterer to measurement point (m)

Scatter fractions (a) for 90-degree scatter: ~0.0005 for 4 MV, ~0.001 for 6 MV, ~0.0015 for 10 MV, ~0.002 for 18 MV.

Leakage Radiation: Head leakage must not exceed 0.1% of useful beam at 1m per IEC 60601-2-1. For secondary barriers:
K_leak = (0.001 * W * T) / d_leak^2

The leakage workload is W_L = 0.001 * W (assuming max leakage).
For IMRT: leakage workload increases by 2-3x due to extended beam-on time.

The required secondary barrier thickness is the larger of the scatter and leakage requirements.

For energies >10 MV: neutron leakage must also be considered (see Section 5.4).`,
    tags: ["secondary barrier", "scatter", "leakage", "IMRT", "neutron", "NCRP 151"],
    energyMin: 4, energyMax: 24,
  },
  {
    section: "Section 2.1.4 — Skyshine and Groundshine",
    content: `Skyshine (Roof Scatter) and Groundshine (NCRP 151).

Skyshine occurs when radiation exiting through the roof is scattered by air back to ground level. The Chilton-Huddleston formula estimates skyshine dose:

D_sky = D_0 * B_roof * (Omega^1.3) / (d_sky^2)

Where:
- D_0 = dose rate at roof level
- B_roof = roof transmission factor
- Omega = solid angle subtended by the roof opening (steradians)
- d_sky = distance from building edge to point of interest (m)

For unshielded roofs, skyshine can be the dominant exposure pathway. Solutions:
1. Add roof shielding (typically 50-100 cm concrete)
2. Extend the roof barrier beyond the bunker walls (overhang)
3. Accept higher dose at perimeter with restricted access

Groundshine: Radiation scattered from the ground near the facility. Typically minor except for facilities with large openings at ground level.`,
    tags: ["skyshine", "roof", "groundshine", "scatter", "NCRP 151"],
    energyMin: 4, energyMax: 24,
  },
  {
    section: "Section 3 — Workload, Use Factor, and Absorbed-Dose Rate",
    content: `Workload, Use Factor, and Dose Rate Considerations (NCRP 151).

Workload (W): Typical values for a busy radiotherapy facility:
- Standard 3D CRT: 300-500 Gy/week
- IMRT facility: 500-1000 Gy/week (higher due to longer beam-on)
- Single linac: 250-400 Gy/week
- Dual linac: 400-600 Gy/week each

Use Factors (U):
- Floor (isocentric): U = 1.0
- Individual wall: U = 0.25 (gantry rotates over 4 walls)
- Ceiling: U = 0.25
- IMRT: U may differ; typically U=0.25 for walls but primary barrier design may need to account for dynamic delivery

IMRT Considerations:
- Primary workload may decrease (beam modulation)
- Leakage workload increases significantly (can be >50% of total workload)
- Scatter increases due to longer beam-on times
- Some facilities use a beam stopper to reduce ceiling and wall scatter

Special Techniques:
- TBI: source of scatter is not at isocenter; primary + leakage workload > prescribed dose
- Stereotactic: different use factors, high dose per fraction but longer setup times
- IORT: mobile units, different shielding paradigm`,
    tags: ["workload", "use factor", "IMRT", "TBI", "stereotactic", "NCRP 151"],
    energyMin: 4, energyMax: 24,
  },
  {
    section: "Section 4 — Structural Details and Laminated Barriers",
    content: `Structural Details and Laminated Barriers (NCRP 151).

Concrete: Standard density 2.35 g/cm3. Barite concrete: 3.2-3.5 g/cm3 (higher density = less thickness needed). Steel: 7.8 g/cm3. Lead: 11.3 g/cm3.

Laminated Barriers: Composite barriers using layers of different materials. Common configurations:
- Concrete + lead: concrete for bulk, lead sheet for final fine-tuning
- Concrete + steel: steel plates embedded in concrete
- Barite concrete: homogeneous high-density concrete

Bunker Design Best Practices:
- Place bunkers together to share common walls
- Locate in basement when possible
- Size generously for future equipment upgrades
- Plan for 20-year lifespan with workload growth
- Consider composite/laminated barriers for space-constrained facilities
- Minimum barrier width = max field diagonal + 60 cm margin

Door Design:
- Maze entrance is preferred over direct-shielded door
- If door needed: motor-driven lead/BPE sandwich, interlocked
- Door overlap: minimum 15 cm overlap with wall shielding on all sides`,
    tags: ["concrete", "barite", "laminated barrier", "bunker", "door", "NCRP 151"],
  },
  {
    section: "Section 5.4 — Neutron Shielding for >10 MV",
    content: `Neutron Shielding for Energies >10 MV (NCRP 151).

For photon energies >10 MV, neutrons are produced in the linac head, patient, and walls. Neutron TVL in concrete: approximately 21 cm (vs 37-48 cm for photons). Therefore neutrons often govern the shielding design for high-energy facilities.

Neutron Source Strength (Q): Number of neutrons per Gy of x-ray dose at isocenter. Typical values:
- 15 MV: Q ~ 10^11 n/Gy
- 18 MV: Q ~ 3×10^11 n/Gy
- 20 MV: Q ~ 5×10^11 n/Gy

Maze Design for Neutrons: The McGinley method (Appendix A) calculates neutron dose at the maze door. A single-leg maze provides ~10x attenuation. A two-leg maze provides ~100x attenuation.

Neutron Door Requirements:
- Borated polyethylene (BPE): 5% boron, 2.5-5 cm thickness
- Lead backing: 0.5-1.5 mm Pb for capture gamma rays
- Total door: BPE + Pb + structural steel frame

Capture Gamma Rays: When thermal neutrons are captured by materials (especially hydrogen and boron), capture gamma rays are emitted. These require additional shielding (hence the lead backing on BPE doors).

Neutron Monitoring: Appendix C discusses the need for neutron monitoring at the maze entrance, especially for 18+ MV facilities. Neutron rem meters (BF3 or He-3 based) should be used.`,
    tags: ["neutron", "shielding", "borated polyethylene", "maze", "capture gamma", "NCRP 151"],
    energyMin: 10, energyMax: 24,
  },
  {
    section: "Section 7 — Example Calculations",
    content: `Example Shielding Calculation: 15 MV LinAC in Concrete Bunker (NCRP 151).

Example: A 15 MV linac with 500 Gy/week workload, isocentric, in basement.
Barrier A (floor, uncontrolled): P=0.02 mSv/wk, d=4.2m, U=1, T=1.
B = 0.02 * 4.2^2 / (500 * 1 * 1) = 7.06×10^-4.
n = -log10(7.06×10^-4) = 3.15 TVLs.
TVL1=44 cm, TVLe=41 cm (concrete).
t = 44 + (3.15-1)*41 = 44 + 88.2 = 132.2 cm concrete.
Actual floor: 150 cm concrete. PASS.

Barrier B (wall, controlled): P=${P_CONTROLADA_mSv_semana} mSv/wk, d=5.5m, U=0.25, T=1.
B = 0.1 * 5.5^2 / (500 * 0.25 * 1) = 0.0242.
n = -log10(0.0242) = 1.62 TVLs.
t = 44 + (1.62-1)*41 = 44 + 25.3 = 69.3 cm concrete.
Actual wall: 120 cm concrete. PASS.

Neutron check at maze door: For 15 MV, single-leg maze, door distance 8m from isocenter.
Neutron dose calculated without door shielding: 0.15 mSv/wk, above P = ${P_CONTROLADA_mSv_semana} mSv/wk (controlled). Add BPE + Pb to the door (e.g., 3 cm BPE + 2 mm Pb) and recalculate until H <= P.`,
    tags: ["example calculation", "15 MV", "concrete", "maze", "neutron", "NCRP 151"],
    energyMin: 15, energyMax: 15,
  },
];

// ─── AAPM TG 108 — PET/CT Shielding ───
const TG108_SECTIONS = [
  {
    section: "TG 108 — F-18 FDG Shielding Methodology",
    content: `AAPM TG 108: PET and PET/CT Shielding Requirements (Medical Physics, Vol.33, No.1, January 2006).

The shielding of PET facilities presents special challenges because the 0.511 MeV annihilation photons are much higher energy than other diagnostic radiations. Barrier shielding may be required in floors and ceilings as well as adjacent walls.

Key Parameters:
- Gamma constant for F-18: 0.092 microSv·m2/MBq·h (at 1m)
- HVL in lead: 4.1 mm
- TVL in lead: 13.6 mm
- HVL in concrete: 4.4 cm
- TVL in concrete: 14.5 cm

The weekly dose equivalent at distance d is:
H = Gamma × A × t × f_decay × f_atten / d2

Where:
- Gamma = 0.092 microSv·m2/MBq·h
- A = administered activity (MBq per patient)
- t = time patient spends in facility (h)
- f_decay = physical decay factor = 0.5^(t/T_half), T_half = 109.8 min
- f_atten = self-attenuation factor (~0.85 for average adult)
- d = distance from patient to point of interest (m)

For a busy PET center (555 MBq/patient, 40 patients/week, 60 min uptake + 30 min scan):
The required unshielded distance to maintain 20 microSv/week = 9.3 m.
Since rooms are rarely this large, additional shielding is needed.`,
    tags: ["PET/CT", "F-18", "FDG", "gamma constant", "TG 108"],
  },
  {
    section: "TG 108 — PET/CT Room Shielding Examples",
    content: `PET/CT Shielding Calculation Examples (AAPM TG 108).

Example 1: Uptake room wall, uncontrolled area.
- 40 patients/week, 555 MBq F-18 each
- Uptake time: 60 min
- Distance to adjacent room: 3 m
- Occupancy factor: 1.0
- Weekly dose = 0.092 × 40 × 555 × 0.85 × 0.68 × 1.0 / 3^2 = 131.4 microSv
- Transmission factor B = 20 / 131.4 = 0.152
- From TG 108 Table IV: 1.0 cm lead or 14 cm concrete required

Example 2: Room above PET uptake.
- Floor-to-floor distance: 4.3 m
- Source 1 m above floor, target 0.5 m above floor below
- Effective distance d = (4.3 - 1) + 0.5 = 3.8 m
- Weekly dose = 0.092 × 40 × 555 × 0.83 × 1.0 / 3.8^2 = 117 microSv
- Existing floor: 10 cm concrete (B = 0.49)
- Remaining dose: 117 × 0.49 = 57.3 microSv
- Additional B needed: 20/57.3 = 0.35
- Additional shielding: 0.65 cm lead or 7 cm concrete

CT Component: The lead required for CT (typically 1.6 mm) provides only B=0.81 for 511 keV photons. A room shielded for PET at 1 mSv/year is unlikely to need additional shielding for CT.`,
    tags: ["PET/CT", "shielding example", "uptake room", "floor", "TG 108"],
  },
  {
    section: "TG 108 — Radionuclide Data Table",
    content: `Physical Properties of PET Radionuclides (AAPM TG 108 Table I).

F-18: T_half = 109.8 min, E_max beta+ = 633 keV, Gamma constant = 0.092 microSv·m2/MBq·h, HVL_Pb = 4.1 mm, TVL_Pb = 13.6 mm, HVL_concrete = 44 mm, TVL_concrete = 145 mm

C-11: T_half = 20.4 min, E_max beta+ = 960 keV, Gamma constant = 0.148 microSv·m2/MBq·h, HVL_Pb = 4.1 mm, TVL_Pb = 13.5 mm

N-13: T_half = 10.0 min, E_max beta+ = 1190 keV, Gamma constant = 0.142 microSv·m2/MBq·h

O-15: T_half = 2.0 min, E_max beta+ = 1730 keV, Gamma constant = 0.138 microSv·m2/MBq·h

Ga-68: T_half = 68.0 min, E_max beta+ = 1900 keV, Gamma constant = 0.134 microSv·m2/MBq·h

Rb-82: T_half = 1.3 min, E_max beta+ = 3370 keV, Gamma constant = 0.144 microSv·m2/MBq·h

The gamma constant for F-18 is typically measured at 1 m from a point source in air. Self-attenuation reduces the effective dose rate by ~15-20% for average adult patients.`,
    tags: ["PET/CT", "radionuclides", "F-18", "C-11", "half-life", "gamma constant", "TG 108"],
  },
];

// ─── México: CNSNS / RGSR / NOM-008-NUCL-2024 (antes rotulado «NOM-008-ENER») ───
const NOM008_SECTIONS = [
  {
    section: "Mexico (CNSNS) — Dose Limits and Design Goals",
    content: `Mexico (CNSNS): dose limits and shielding design goals. Dose limits follow ICRP 103 (RGSR 1988 historic values: 50 mSv/y POE, 5 mSv/y public); NOM-008-NUCL-2024 regulates radioactive contamination and does not set dose limits.

Dose Limits (Límites de dosis):
- Occupational (trabajadores expuestos): 20 mSv/year promedio en 5 años, no excediendo 50 mSv en ningún año.
- Public (población general): 1 mSv/year.

Shielding Design Goals (Metas de diseño de blindaje):
- Controlled areas (áreas controladas): P = ${P_CONTROLADA_mSv_semana} mSv/week (= 5 mSv/year / 50 weeks; NCRP 147 §1.3 / NCRP 151 §1.2)
- Uncontrolled areas (áreas no controladas): P = ${P_NO_CONTROLADA_mSv_semana} mSv/week (= 1 mSv/year / 50 weeks)
- These values are consistent with NCRP 151 recommendations and ICRP 103.

The CNSNS (Comisión Nacional de Seguridad Nuclear y Salvaguardias) requires:
1. Shielding calculations for ALL barriers (primary, secondary, maze, door)
2. Worst-case scenario analysis
3. Conservative occupancy factors
4. Documentation of all source parameters (energy, workload, use factor)
5. Independent verification by a qualified expert (Experto en Seguridad Radiológica)

Format CNSNS LA-007/01 requires:
- Descriptive memory (Memoria descriptiva)
- Calculation methodology (Metodología de cálculo)
- Results table (Tabla de resultados)
- Barrier diagrams (Planos de blindaje)
- Regulatory compliance statement`,
    tags: ["Mexico", "RGSR", "dose limits", "CNSNS", "LA-007/01"],
  },
  {
    section: "Mexico (CNSNS) — Exemptions and Special Cases",
    content: `Mexico (CNSNS): Exemptions and Special Considerations.

Certain practices and sources may be exempted from regulatory controls if the radioactive material quantity or radiation level is such that risks do not represent a danger to the population or environment.

Equipment excluded from this norm:
- Diagnostic medical X-ray equipment (covered by separate regulations)
- Naturally occurring radioactive material (NORM)
- Radioactive material transport (covered by IAEA SSR-6)

Training Requirements (Requisitos de entrenamiento):
- Initial training for Radiation Safety Officers (Clases A, B, C)
- Periodic refresher training (annual for POE, quinquennial for supervisors)
- Advanced courses for RSO and assistants
- Medical physicists must be registered with the CNSNS

ALARA Principle: All shielding designs must demonstrate that doses are kept As Low As Reasonably Achievable, taking into account social and economic factors. This means design goals should typically be set below the regulatory limits.`,
    tags: ["Mexico", "CNSNS", "exemptions", "training", "ALARA"],
  },
  {
    section: "NOM-008-NUCL-2024 — Radioactive contamination limits and zone criteria",
    content: `NOM-008-NUCL-2024, "Límites de contaminación radiactiva y criterios para su control" (SENER/CNSNS, DOF 2024-05-24; in force 60 calendar days after publication). It supersedes NOM-008-NUCL-2011 "Control de la contaminación radiactiva" (DOF 2011-10-26). Scope: radioactive and nuclear facilities where radioactive contamination exists or may exist. It does NOT set dose limits or shielding design goals (those come from the RGSR 1988 and NCRP 147/151).

Zone criteria (unchanged from 2011): radiation zone = whole-body dose equivalent could exceed 0.05 mSv in one hour or 1 mSv in any 5 consecutive days (§3.11); high-radiation zone = could exceed 1 mSv in one hour (§3.12); zones are delimited and signposted inside the controlled zone (§4.1).

Contamination: presence above 0.4 Bq/cm² (beta-gamma) or 0.04 Bq/cm² (alpha) (§5.0); Appendix A beta-gamma limit 0.4 Bq/cm² removable and total (2011: 0.167 removable / 0.83 total). Airborne contamination is referred to NOM-041-NUCL-2013 (2011: NOM-005-NUCL-1994). Contamination-control effectiveness must be evaluated and documented at least monthly (§4.17; 2011: "periodically").`,
    tags: ["Mexico", "NOM-008-NUCL-2024", "contamination", "radiation zone", "CNSNS"],
  },
];

// ─── Shielding Calculation Examples from Real Projects ───
const CALCULATION_EXAMPLES = [
  {
    section: "Varian iX 6 MV — Methodist Hospital Shielding Report",
    content: `Real Shielding Calculation Report: Varian Clinac iX 6 MV (Methodist Hospital, Richardson).

LINAC: Varian Clinac iX, 6 MV
Workload: 300 Gy/week (3D CRT + IMRT mix)
Bunker: Basement, concrete walls 116-151 cm thick
Design goals: Uncontrolled = ${P_NO_CONTROLADA_mSv_semana} mSv/wk; Controlled = the report's own criterion, which is not the NCRP 147/151 goal (RadShield uses P = ${P_CONTROLADA_mSv_semana} mSv/wk for controlled areas; recheck Point B with it)

Results:
- Point A (uncontrolled, wall): 61.9" concrete needed, 116" present → PASS
- Point B (controlled, wall): 67.2" concrete needed, 151" present → PASS
- Point C (uncontrolled, wall): 25.9" concrete needed, 42" present → PASS
- Point D (uncontrolled, wall): 20.67" concrete needed, 39" present → PASS
- Point E (controlled, wall): 44.5" concrete needed, 44.5" present → PASS
- Point F (controlled, wall): 32.5" concrete needed, 63.8" present → PASS
- Point G (uncontrolled, wall): 27.4" concrete needed, 48" present → PASS
- Point H (uncontrolled, ceiling): 67.5" concrete needed, 80" present → PASS
- Point I (uncontrolled): 28.2" concrete needed, 44" present → PASS
- Door (controlled): 3.1" BPE + 0.86" Pb needed, 0" present → FAIL (door not installed at time of report)

Neutron check: Not needed for 6 MV (neutrons only for >10 MV).

Key finding: All barriers PASS with adequate margin except the door which required BPE + lead sandwich.`,
    tags: ["calculation example", "Varian", "6 MV", "concrete", "real project"],
    energyMin: 6, energyMax: 6,
  },
  {
    section: "McGinley Maze Transmission Formula",
    content: `McGinley Method for Maze Dose Calculation (NCRP 151 Appendix A).

Photon Dose at Maze Door:
D_maze = D_iso × (A_wall / A_mouth) × 10^(-d_maze / TVL_eff)

Where:
- D_iso = dose rate at isocenter (Gy/h)
- A_wall = cross-sectional area of the maze wall (m2)
- A_mouth = cross-sectional area of the maze entrance (m2)
- d_maze = maze path length (m)
- TVL_eff = effective TVL for multiple reflections

Neutron Dose at Maze Door:
D_n = 2.4 × 10^-15 × Phi × sqrt(A_mouth) × (1.64×10^-d1/5.4 + 10^-d2/5.4)

Where:
- Phi = neutron fluence rate at inner maze entrance (n/cm2/s)
- d1 = distance from maze entrance to midpoint of first leg (m)
- d2 = distance from midpoint of first leg to door (m)
- 5.4 m is the empirically determined TVL for maze neutrons

Single-leg maze: ~10x attenuation for neutrons
Two-leg maze: ~100x attenuation for neutrons

The McGinley method has been validated against Monte Carlo simulations and measurements for a wide range of maze configurations.`,
    tags: ["McGinley", "maze", "neutron", "photon", "formula", "NCRP 151"],
    energyMin: 10, energyMax: 24,
  },
  {
    section: "CyberKnife and Tomotherapy Shielding",
    content: `Specialized Radiotherapy Shielding: CyberKnife and Tomotherapy (NCRP 151).

CyberKnife (Robotic Arm LINAC):
- Uses only 6 MV photons
- No fixed isocenter — the robot moves around the patient
- ALL barriers except ceiling can be primary barriers
- Use factors must be calculated based on the beam delivery pattern
- Primary barrier transmission: B = P × d^2 / (W × T) — no use factor U since any wall can be primary
- Typical bunker: smaller than conventional linac, but ALL walls need primary barrier thickness

Helical Tomotherapy:
- Uses only 6 MV photons
- Beam stopper significantly reduces ceiling and wall scatter
- Primary barrier is the beam stopper itself
- Room shielding focuses on leakage and scatter from the gantry
- Typical TVL for 6 MV concrete: 37 cm primary, 33 cm equilibrium

Mevion S250 (Proton Therapy):
- 250 MeV proton beam with passive scattering
- Concrete walls: 2.0-3.5 m thick
- Neutron production is significant — requires extensive maze design
- Activation of air, components, and patient requires consideration`,
    tags: ["CyberKnife", "Tomotherapy", "proton", "specialized", "shielding"],
    energyMin: 6, energyMax: 250,
  },
];

// ─── Combine all chunks ───
async function buildAllChunks() {
  const chunks: Array<{
    source: string;
    section?: string;
    modality?: string;
    content: string;
    tags?: string[];
    energyMin?: number;
    energyMax?: number;
  }> = [];

  // TVL chunks
  for (const row of NCRP151_TVL) {
    chunks.push({
      source: "NCRP 151 Table B.1",
      section: `TVL — ${row.energy} ${row.mat}`,
      modality: row.modality,
      content: `NCRP 151 Table B.1: ${row.energy} ${row.mat} — TVL1 = ${row.tvl1} cm, TVLe = ${row.tvle} cm. The first tenth-value layer (TVL1) is used for the first TVL of thickness. Subsequent TVLs use the equilibrium value (TVLe) which accounts for spectral changes as radiation passes through the barrier. For quick estimates using n×TVL, use TVL1 for all TVLs (conservative).`,
      tags: ["TVL", "NCRP 151", "Table B.1", row.mat.toLowerCase(), "primary barrier"],
      energyMin: parseFloat(row.energy) || 1.25,
      energyMax: parseFloat(row.energy) || 1.25,
    });
  }

  // Occupancy chunks
  for (const occ of NCRP151_OCCUPANCY) {
    chunks.push({
      source: "NCRP 151 Table B.2",
      section: "Occupancy Factors",
      content: `NCRP 151 Table B.2: Occupancy factor T = ${occ.T} applies to: ${occ.area}. This is the fraction of time that a person is present in the area during beam-on time. Conservative values should be used when actual occupancy is uncertain.`,
      tags: ["occupancy", "T factor", "NCRP 151", "Table B.2"],
    });
  }

  // NCRP 151 sections
  for (const s of NCRP151_SECTIONS) {
    chunks.push({
      source: "NCRP 151",
      section: s.section,
      content: s.content,
      tags: s.tags,
      modality: "LINAC",
      energyMin: s.energyMin,
      energyMax: s.energyMax,
    });
  }

  // TG 108 sections
  for (const s of TG108_SECTIONS) {
    chunks.push({
      source: "AAPM TG 108",
      section: s.section,
      content: s.content,
      tags: s.tags,
      modality: "PET/CT",
    });
  }

  // NOM-008 sections
  for (const s of NOM008_SECTIONS) {
    chunks.push({
      source: "CNSNS / RGSR / NOM-008-NUCL-2024",
      section: s.section,
      content: s.content,
      tags: s.tags,
    });
  }

  // Calculation examples
  for (const s of CALCULATION_EXAMPLES) {
    chunks.push({
      source: "Shielding Calculation Examples",
      section: s.section,
      content: s.content,
      tags: s.tags,
      energyMin: s.energyMin,
      energyMax: s.energyMax,
    });
  }

  return chunks;
}

// ─── Main ───
async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  RadShield-MX v2 — Knowledge Ingestion");
  console.log("  (Enriched from real PDF sources)");
  console.log("═══════════════════════════════════════════════════\n");

  const existing = await countChunks();
  console.log(`Existing chunks: ${existing}`);
  if (existing > 0) {
    console.log("Resetting knowledge base...");
    await deleteAllChunks();
  }

  const chunks = await buildAllChunks();
  console.log(`Prepared ${chunks.length} enriched chunks\n`);

  let success = 0, failed = 0;
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    process.stdout.write(`  [${String(i + 1).padStart(2)}/${chunks.length}] ${c.source.substring(0, 30).padEnd(32)} ${c.section?.substring(0, 40) || ""}... `);
    try {
      await insertChunk(c);
      success++;
      process.stdout.write("OK\n");
    } catch (err) {
      failed++;
      process.stdout.write(`FAIL: ${(err as Error).message.substring(0, 50)}\n`);
    }
  }

  const final = await countChunks();
  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  Ingested: ${success} chunks  |  Failed: ${failed}`);
  console.log(`  Total DB: ${final} chunks`);
  console.log(`  Sources: NCRP 151, AAPM TG 108, CNSNS / NOM-008-NUCL-2024`);
  console.log(`  Modalities: LINAC, PET/CT, Co-60, Gamma Knife, HDR`);
  console.log(`═══════════════════════════════════════════════════`);
}

main().catch(console.error);
