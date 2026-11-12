#!/usr/bin/env tsx
/**
 * ═══════════════════════════════════════════════════════════
 * Knowledge Ingestion v3 — From ORIGINAL PDFs
 * NCRP 151, NCRP 147, IAEA Safety Report 47
 * ═══════════════════════════════════════════════════════════
 */

import { insertChunk, countChunks } from "../api/lib/vectorStore";
// Objetivos de diseño P: fuente única src/lib/limitesDosis.ts (NCRP 147 §1.3 / NCRP 151 §1.2).
import { P_CONTROLADA_mSv_semana, P_NO_CONTROLADA_mSv_semana } from "../src/lib/limitesDosis";

const CHUNKS = [
  // ═══ NCRP 151 — ORIGINAL PDF EXTRACTS ═══
  {
    source: "NCRP 151 (Original PDF)",
    section: "Section 1.1 — Purpose and Scope",
    content: `The purpose of radiation shielding is to limit radiation exposures to members of the public and employees to an acceptable level. This Report presents recommendations and technical information related to the design and installation of structural shielding for megavoltage x- and gamma-ray radiotherapy facilities. This information supersedes the recommendations in NCRP Report No. 49 (1976) pertaining to such medical radiotherapy facilities. Since the publication of NCRP Report No. 49, many facilities have been designed for accelerating voltages greater than the 10 MV maximum that was covered in that report. Hence recent designs have had to refer to NCRP Report No. 51 (1977) and NCRP Report No. 79 (1984) in order to account for the higher accelerating voltages and the concomitant production of neutrons. In addition, the use of barriers constructed with composite materials has become commonplace. This Report includes the necessary information for these higher accelerating voltages as well as a discussion of the various factors to be considered in the selection of appropriate shielding materials and in the calculation and evaluation of barrier thicknesses.`,
    tags: ["NCRP 151", "purpose", "scope", "megavoltage", "neutrons"],
    energyMin: 4, energyMax: 24,
  },
  {
    source: "NCRP 151 (Original PDF)",
    section: "Section 1.4 — Shielding Design Goals",
    content: `In this Report, shielding design goals (P) are levels of dose equivalent (H) used in the design calculations and evaluation of barriers constructed for the protection of workers or members of the public. There are different shielding design goals for controlled and uncontrolled areas. For controlled areas: P = ${P_CONTROLADA_mSv_semana} mSv/week (5 mSv/year / 50 weeks). For uncontrolled areas: P = ${P_NO_CONTROLADA_mSv_semana} mSv/week (1 mSv/year / 50 weeks). The approach for structural shielding design for radiotherapy facilities uses shielding design goals and the NCRP recommended effective dose (E) limits for workers and members of the public. It is not practical to base shielding design directly on E. Determination of E is complex, and depends on the attenuation of photons and neutrons in the body. For the purposes of this Report, the shielding design goals are stated in terms of H (in millisievert) at the point of nearest occupancy beyond the barrier. For example, the distance of closest approach to a wall bounding a radiotherapy room can be assumed to be not less than 0.3 m.`,
    tags: ["NCRP 151", "design goals", "dose limits", "P value", "controlled", "uncontrolled"],
  },
  {
    source: "NCRP 151 (Original PDF)",
    section: "Section 1.7 — Occupancy Factor",
    content: `Occupancy factor (T) for a particular area is the fraction of the beam-on time during which a particular person or group of people will be present in that area. For example, if an office is occupied during all working hours and the radiation source operates during these hours, the occupancy factor for the office is unity (T = 1). If the radiation source operates only during a fraction of the working hours, the occupancy factor is correspondingly reduced. Typical values: T = 1 for full occupancy (offices, treatment planning areas, nurse stations, receptionist areas, wards, occupied work rooms); T = 1/2 for patient examination and treatment rooms; T = 1/5 for corridors, patient waiting areas, employee lounges, staff rest rooms; T = 1/8 for public toilets, vending areas, storage rooms, outdoor areas with seating; T = 1/20 for minimal occupancy (attics, stairways, unattended parking lots, unattended elevators, janitors closets); T = 1/40 for transient traffic only.`,
    tags: ["NCRP 151", "occupancy factor", "T factor", "full occupancy", "minimal occupancy"],
  },
  {
    source: "NCRP 151 (Original PDF)",
    section: "Section 2.2 — Primary Barriers",
    content: `The primary barrier transmission factor B_pri is: B_pri = (P * d_pri^2) / (W * U * T). Where P is shielding design goal (Sv/week), d_pri is distance from x-ray target to measurement point (meters), W is workload (Gy/week at 1m), U is use factor, and T is occupancy factor. The required number of TVLs is: n = -log10(B_pri). The barrier thickness is: t_barrier = TVL1 + (n-1) * TVLe. Where TVL1 is the first tenth-value layer and TVLe is the equilibrium TVL. TVLe is used after the first TVL to account for spectral changes as radiation passes through the barrier. This approach reduces concrete usage compared to using n x TVL1 for all TVLs. Barrier width should consider the maximum field size diagonal plus at least 30 cm to each side (total ~60 cm margin). For a 40x40 cm field, the diagonal is ~57 cm, so primary barrier width should be at least 117 cm.`,
    tags: ["NCRP 151", "primary barrier", "B_pri", "TVL1", "TVLe", "formula"],
    energyMin: 4, energyMax: 24,
  },
  {
    source: "NCRP 151 (Original PDF)",
    section: "Section 2.2.3 — Laminated Barriers",
    content: `Laminated barriers using layers of different materials are increasingly common. Composite barrier design allows optimization of each material for its specific radiation attenuation properties. Concrete provides the bulk of the shielding and is the most economical material for thick barriers. Lead sheets can be laminated to concrete to provide fine-tuning of shielding thickness or to compensate for construction tolerances. Steel plates may be embedded in concrete. When using laminated barriers, the TVL approach must be modified: each layer's attenuation is calculated separately, and the total is the sum of individual layers. For laminated barriers with lead and concrete: first convert lead thickness to concrete equivalent using density ratios (11.3/2.35 = 4.8 for lead to concrete), then apply TVL values. For borated polyethylene (BPE) used in neutron doors: 5% boron content, typical thickness 2.5-5 cm, backed by lead for capture gamma rays.`,
    tags: ["NCRP 151", "laminated barrier", "composite", "lead", "concrete", "BPE"],
  },
  {
    source: "NCRP 151 (Original PDF)",
    section: "Section 2.3 — Secondary Barriers",
    content: `Secondary barriers are designed for scattered radiation and leakage radiation. For scattered radiation: K_sec = a * (W_T * T) / (d_scatter^2 * d_sec^2), where a is scatter fraction from Table B.4a, W_T is workload, T is occupancy, d_scatter is distance target to scatterer, and d_sec is distance scatterer to measurement point. Scatter fraction a depends on angle theta and energy. For 90-degree scatter: a ~ 0.0005 (4 MV), 0.001 (6 MV), 0.0015 (10 MV), 0.002 (18 MV). For leakage radiation: Head leakage must not exceed 0.1% of useful beam at 1m (IEC 60601-2-1). K_leak = (0.001 * W * T) / d_leak^2. For IMRT: leakage workload increases 2-3x due to extended beam-on time. The required secondary barrier thickness is the larger of scatter and leakage requirements. For energies >10 MV, neutron leakage must also be considered (Section 5.4).`,
    tags: ["NCRP 151", "secondary barrier", "scatter", "leakage", "IMRT", "neutron"],
    energyMin: 4, energyMax: 24,
  },
  {
    source: "NCRP 151 (Original PDF)",
    section: "Section 2.4.2 — High-Energy Maze (McGinley)",
    content: `For high-energy accelerators (>10 MV), neutron dose at the maze door must be calculated. The McGinley method calculates: Photon dose at maze door D_photon = D_iso * f * 10^(-d/TVL), where f is a geometry factor. Neutron dose at maze door: D_n = 2.4E-15 * Phi * sqrt(S0) * (1.64*10^(-d1/5.4) + 10^(-d2/5.4)), where Phi is neutron fluence rate at inner maze entrance (n/cm2/s), S0 is cross-sectional area of maze entrance (cm2), d1 is distance from maze entrance to midpoint of first leg (m), d2 is distance from midpoint to door (m), and 5.4 m is the empirically determined TVL for maze neutrons. Single-leg maze provides ~10x neutron attenuation. Two-leg maze provides ~100x. Total dose at door = D_photon + D_neutron + D_capture_gamma. Door shielding for high-energy: borated polyethylene (BPE) 5% boron, 2.5-5 cm thickness, backed by 0.5-1.5 mm lead for capture gamma rays.`,
    tags: ["NCRP 151", "McGinley", "maze", "neutron", "high energy", "BPE door"],
    energyMin: 10, energyMax: 24,
  },
  {
    source: "NCRP 151 (Original PDF)",
    section: "Section 3.2.2 — IMRT Considerations",
    content: `Intensity Modulated Radiation Therapy (IMRT) has significant implications for shielding design. IMRT typically uses 6 MV photons. Key effects: (1) Primary workload may decrease due to beam modulation, but this is often offset by increased treatment complexity. (2) Leakage workload increases significantly because the beam is on for longer periods to deliver the same dose — leakage can be >50% of total workload for complex IMRT plans. (3) Scatter radiation increases due to longer beam-on times. (4) Maze entrance dose increases due to higher leakage. The IMRT leakage factor (L_IMRT) is defined as the ratio of actual monitor units (MUs) delivered to the MUs that would be delivered for an open field. Typical L_IMRT values range from 2 to 5, meaning the leakage workload must be multiplied by this factor. Some facilities use a beam stopper to reduce ceiling and wall scatter.`,
    tags: ["NCRP 151", "IMRT", "leakage", "workload increase", "beam stopper"],
    energyMin: 6, energyMax: 6,
  },
  {
    source: "NCRP 151 (Original PDF)",
    section: "Section 5.4 — Activation",
    content: `For photon and electron energies >10 MV, radionuclide production (activation) occurs in the accelerator components, the room air, and the shielding materials. The principal radionuclides produced in room air are N-13 (T1/2 = 9.96 min), O-15 (T1/2 = 2.03 min), C-11 (T1/2 = 20.4 min), and Ar-41 (T1/2 = 1.83 h). The short half-lives of these radionuclides mean that activation is primarily a concern during and shortly after beam operation. Adequate ventilation is required to prevent buildup of activated air. A ventilation rate of 6-8 air changes per hour is typically sufficient. Activation of concrete walls is generally not a significant concern for routine operation. However, for high-energy facilities (>18 MV), concrete activation near the target may produce measurable dose rates immediately after beam shutdown, requiring temporary posting of the treatment room.`,
    tags: ["NCRP 151", "activation", "radionuclides", "ventilation", "high energy"],
    energyMin: 10, energyMax: 24,
  },
  {
    source: "NCRP 151 (Original PDF)",
    section: "Section 5.7 — Robotic Arm (CyberKnife)",
    content: `Robotic arm stereotactic-radiosurgery systems (e.g., CyberKnife) present unique shielding challenges. These systems use 6 MV x rays and have no fixed isocenter — the robot moves the linac around the patient. This means that ALL barriers except the ceiling can be primary barriers at some point during treatment. Use factors must be calculated based on the specific beam delivery pattern for the unit. The primary barrier transmission formula becomes: B = P * d^2 / (W * T) — there is no use factor U since any wall can receive the primary beam. Typical bunker design for robotic arm systems is smaller than conventional linac rooms (source-to-barrier distances may be 3-4 m), but ALL walls require primary barrier thickness. Some robotic arm systems use a beam stopper to reduce ceiling scatter. The beam stopper must be accounted for in the use factor calculations — walls behind the stopper have reduced primary exposure.`,
    tags: ["NCRP 151", "CyberKnife", "robotic arm", "primary barrier", "no isocenter"],
    energyMin: 6, energyMax: 6,
  },
  {
    source: "NCRP 151 (Original PDF)",
    section: "Section 5.9 — Cobalt-60 Units",
    content: `Cobalt-60 units emit gamma rays with energies of 1.17 and 1.33 MeV (average 1.25 MeV). TVL values for Co-60: Concrete TVL1 = 21 cm, TVLe = 21 cm; Steel TVL1 = 7.0 cm, TVLe = 7.0 cm; Lead TVL1 = 4.0 cm, TVLe = 4.0 cm. Co-60 units do NOT produce neutrons, so neutron shielding is not required. The source is always on (decays continuously), but is retracted into a heavily shielded safe when not in use. The workload is determined by the actual treatment time. Head leakage for Co-60 units is typically higher than for modern linacs — verify manufacturer specifications. Room design considerations: Co-60 rooms are typically smaller than linac rooms; the source housing is very heavy and may require structural reinforcement of the floor. Because Co-60 sources decay (half-life 5.27 years), the workload decreases over time, and existing barriers become more adequate as the source ages.`,
    tags: ["NCRP 151", "Co-60", "cobalt", "gamma", "no neutrons"],
    energyMin: 1.17, energyMax: 1.33,
  },

  // ═══ NCRP 147 — ORIGINAL PDF EXTRACTS ═══
  {
    source: "NCRP 147 (Original PDF)",
    section: "Section 1.1 — Purpose and Scope",
    content: `This Report addresses the structural shielding design for medical x-ray imaging facilities and supersedes the parts that address such facilities in NCRP Report No. 49 (1976). It covers radiographic installations, fluoroscopic installations, interventional facilities, dedicated chest installations, mammographic installations, computed tomography (CT) installations, mobile radiography, dental x-ray facilities, bone mineral measurement equipment, and veterinary x-ray facilities. The shielding design goals are: P = ${P_CONTROLADA_mSv_semana} mSv/week (controlled areas) and P = ${P_NO_CONTROLADA_mSv_semana} mSv/week (uncontrolled areas), same as NCRP 151. For imaging facilities, the primary concern is scatter radiation from the patient and leakage from the x-ray tube housing. The use of Kerma (Ka) in air is the recommended quantity for shielding calculations, measured in gray (Gy).`,
    tags: ["NCRP 147", "imaging", "diagnostic", "CT", "fluoroscopy", "mammography"],
  },
  {
    source: "NCRP 147 (Original PDF)",
    section: "Section 2.2.6 — CT Installations",
    content: `Computed Tomography (CT) shielding is unique because the x-ray tube rotates around the patient, and scatter is produced in all directions. The scatter fraction from CT is much higher than from conventional radiography. CT shielding calculations use the isodose method: the weekly dose at a point is the sum of scatter from all slices. Key parameters: dose per rotation (mGy/rotation) typically 10-20 mGy at isocenter, weekly patient volume (scans/week), and scatter fraction from isodose charts (available from CT manufacturers). For a typical CT scanner (120 kVp, 200 mAs, 64-slice), the scatter dose at 1m from the gantry is approximately 0.1-0.2 mGy/exam. Shielding requirements: 2.0 mm Pb equivalent minimum for the control panel wall. Patient waiting areas adjacent to CT may require shielding depending on throughput. Floor and ceiling shielding may be needed for multi-story facilities.`,
    tags: ["NCRP 147", "CT", "computed tomography", "scatter", "isodose", "shielding"],
  },
  {
    source: "NCRP 147 (Original PDF)",
    section: "Section 2.2.3 — Interventional Facilities",
    content: `Interventional radiology and cardiology facilities present special shielding challenges because the x-ray beam is often NOT fully intercepted by the patient or image receptor. Fluoroscopy times can be very long (30-120 minutes per procedure), and the workload is correspondingly high. Typical workload for a busy interventional suite: 60-120 minutes of fluoroscopy per week at maximum technique. Primary barriers are needed for walls and ceiling where the beam can be directed. Secondary barriers (scatter + leakage) are needed for all other walls. The operator must be protected by a leaded barrier (0.5 mm Pb minimum) or leaded apron (0.5 mm Pb) with thyroid shield. Ceiling-suspended lead acrylic shields (0.5 mm Pb) are commonly used. Staff dose should be monitored with dosimeters worn outside the lead apron.`,
    tags: ["NCRP 147", "interventional", "fluoroscopy", "cardiology", "lead apron"],
  },
  {
    source: "NCRP 147 (Original PDF)",
    section: "Section 4.1 — Shielding Design Goals and Occupancy",
    content: `NCRP 147 shielding design goals: P = ${P_CONTROLADA_mSv_semana} mSv/week for controlled areas, P = ${P_NO_CONTROLADA_mSv_semana} mSv/week for uncontrolled areas. Occupancy factors for imaging facilities: Full occupancy (T=1.0): offices, nurses stations, control rooms, patient wards. Partial occupancy (T=0.5): patient examination rooms. Occasional occupancy (T=0.2): corridors, waiting rooms, lounges. Rare occupancy (T=0.05): public toilets, storage, outdoor seating. Workload definition for imaging: W = total mA-minutes per week. Typical workloads: Chest room 50 mA-min/week, general radiography 300 mA-min/week, busy fluoroscopy 500-1000 mA-min/week. Use factor U = 1 for floor (overhead tube), U = 0.25 for each wall (tube rotation), U = 0.05 for ceiling (rarely used overhead).`,
    tags: ["NCRP 147", "design goals", "occupancy", "workload", "use factor"],
  },

  // ═══ IAEA Safety Report 47 — EXTRACTS ═══
  {
    source: "IAEA Safety Report 47 (Original PDF)",
    section: "Section 2.1 — Radiation Sources and Facility Types",
    content: `IAEA Safety Report 47: Radiotherapy facilities use various radiation sources: (1) External beam therapy — linear accelerators (4-25 MV), Co-60 teletherapy units (1.25 MeV), proton and heavy ion facilities (50-250 MeV). (2) Brachytherapy — Ir-192 (380 keV average), Cs-137 (662 keV), I-125 (27 keV), Pd-103 (21 keV). (3) Simulator and CT scanners for treatment planning (100-140 kVp). Each source type requires specific shielding considerations. The IAEA Basic Safety Standards (BSS) require that shielding design be performed by qualified experts. The BSS dose limits: 20 mSv/year averaged over 5 years for workers, 1 mSv/year for the public. Design goals should be set at a fraction of these limits to account for contributions from other sources and uncertainties.`,
    tags: ["IAEA 47", "radiation sources", "BSS", "dose limits", "linac", "Co-60"],
  },
  {
    source: "IAEA Safety Report 47 (Original PDF)",
    section: "Section 2.3 — Shielding Materials and Construction",
    content: `IAEA Safety Report 47 recommendations for shielding materials: Ordinary concrete (density 2.35 g/cm3) is the most commonly used material due to availability, cost, and ease of construction. Heavy concrete (barite or magnetite, density 3.2-4.0 g/cm3) provides equivalent shielding with reduced thickness — typically 60-70% of ordinary concrete thickness. Lead (density 11.3 g/cm3) is used for doors, windows, and fine-tuning of barriers. Steel (density 7.8 g/cm3) is used in composite barriers and for structural elements. Borated polyethylene (BPE) is used for neutron shielding in high-energy facilities. Earth (density 1.5-2.0 g/cm3) can be used for above-ground barriers. The IAEA recommends laminated/composite barriers for space-constrained facilities, with layers of different materials optimized for specific radiation types. Minimum concrete density for shielding calculations: 2.35 g/cm3 (verify with testing).`,
    tags: ["IAEA 47", "materials", "concrete", "barite", "lead", "steel", "BPE"],
  },
  {
    source: "IAEA Safety Report 47 (Original PDF)",
    section: "Section 4.2 — Maze Design for Neutrons",
    content: `IAEA Safety Report 47 maze design for high-energy facilities: For photon energies >10 MV, neutrons are produced and must be considered in maze design. The maze serves two purposes: (1) attenuation of scattered photons, and (2) attenuation of neutrons. The IAEA recommends the following approach: Calculate photon dose at the maze door using the McGinley method or similar. Calculate neutron dose using the neutron source strength Q (n/Gy at isocenter) and maze transmission. Typical Q values: 10 MV: 0.5 x 10^12 n/Gy, 15 MV: 1.0 x 10^12 n/Gy, 18 MV: 3.0 x 10^12 n/Gy, 25 MV: 10 x 10^12 n/Gy. The neutron TVL in concrete is approximately 21 cm (for maze calculations, the empirical value of 5.4 m path length gives one TVL). For a single-leg maze with path length 6-8 m, neutron attenuation of 10-20 is typical. A two-leg maze provides attenuation of 100-400. The door must include borated polyethylene (2.5-5 cm, 5% boron) backed by lead for capture gamma rays.`,
    tags: ["IAEA 47", "maze", "neutron", "source strength", "Q value", "BPE door"],
    energyMin: 10, energyMax: 25,
  },
  {
    source: "IAEA Safety Report 47 (Original PDF)",
    section: "Section 5.1 — Quality Assurance for Shielding",
    content: `IAEA Safety Report 47 quality assurance requirements: After construction, a radiation survey must be performed to verify that the installed shielding meets the design goals. The survey should include: (1) Measurements at all barrier locations with the beam oriented to maximize dose at each measurement point. (2) Measurements at the maze entrance with the beam on. (3) For >10 MV facilities, neutron measurements at the maze entrance and in adjacent areas. (4) Measurements of skyshine and groundshine if applicable. (5) Documentation of all measurements with comparison to design goals. The survey should be performed by a qualified expert using calibrated instruments. If measured doses exceed design goals, corrective action must be taken (additional shielding, restricted access, or revised design goals with regulatory approval). The IAEA recommends that shielding surveys be repeated after any modification to the facility or equipment.`,
    tags: ["IAEA 47", "QA", "radiation survey", "verification", "neutron measurement"],
  },

  // ═══ FORMULA QUICK REFERENCE ═══
  {
    source: "Quick Reference Card",
    section: "NCRP 151 Formula Summary",
    content: `QUICK REFERENCE — NCRP 151 Shielding Formulas:\n\nPRIMARY BARRIER:\nB = P * d^2 / (W * U * T)\nn = -log10(B)\nt = TVL1 + (n-1) * TVLe\n\nSECONDARY — SCATTER:\nK_sec = a * W * T / (d_scatter^2 * d_sec^2)\n\nSECONDARY — LEAKAGE:\nK_leak = 0.001 * W * T / d_leak^2\n\nMAZE (McGinley):\nD_n = 2.4E-15 * Phi * sqrt(S0) * (1.64*10^(-d1/5.4) + 10^(-d2/5.4))\n\nTVL VALUES (concrete, cm):\nCo-60: 21 | 4 MV: 29 | 6 MV: 37 | 10 MV: 37 | 15 MV: 44 | 18 MV: 45 | 20 MV: 46 | 24 MV: 48\n\nOCCUPANCY (T):\nFull: 1.0 | Patient exam: 0.5 | Corridor: 0.2 | Public toilet: 0.125 | Outdoor seating: 0.05 | Transient: 0.025\n\nDESIGN GOALS (P):\nControlled: ${P_CONTROLADA_mSv_semana} mSv/wk | Uncontrolled: ${P_NO_CONTROLADA_mSv_semana} mSv/wk`,
    tags: ["quick reference", "formula", "NCRP 151", "summary", "cheatsheet"],
    energyMin: 1, energyMax: 24,
  },
];

// ═══ MAIN ═══
async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  RadShield-MX v3 — PDF Knowledge Ingestion");
  console.log("  Sources: NCRP 151, NCRP 147, IAEA 47");
  console.log("═══════════════════════════════════════════════════\n");

  const existing = await countChunks();
  console.log(`Existing chunks: ${existing}`);
  if (existing > 0) {
    console.log("Appending to existing knowledge base...");
  }

  console.log(`Prepared ${CHUNKS.length} chunks from original PDFs\n`);

  let success = 0, failed = 0;
  for (let i = 0; i < CHUNKS.length; i++) {
    const c = CHUNKS[i];
    process.stdout.write(`  [${String(i + 1).padStart(2)}/${CHUNKS.length}] ${c.source.substring(0, 25).padEnd(27)} ${c.section?.substring(0, 35) || ""}... `);
    try {
      await insertChunk(c);
      success++;
      process.stdout.write("OK\n");
    } catch {
      failed++;
      process.stdout.write(`FAIL\n`);
    }
  }

  const final = await countChunks();
  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  Ingested: ${success} chunks  |  Failed: ${failed}`);
  console.log(`  Total DB: ${final} chunks`);
  console.log(`  Sources: NCRP 151, NCRP 147, IAEA 47, QuickRef`);
  console.log(`═══════════════════════════════════════════════════`);
}

main().catch(console.error);
