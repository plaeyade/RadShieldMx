#!/usr/bin/env tsx
/**
 * ═══════════════════════════════════════════════════════════
 * Knowledge Ingestion Script — Seed RAG Vector Database
 * Populates document_chunks with NCRP 151/147, TG 108 data
 * ═══════════════════════════════════════════════════════════
 * 
 * Usage: npx tsx scripts/ingest-knowledge.ts
 */

import { insertChunk, countChunks, deleteAllChunks } from "../api/lib/vectorStore";

// ─── NCRP 151 Table B.1 — TVL Values for Concrete ───
const NCRP151_TVL_CONCRETE = [
  { energy: 4, tvls: { concrete: 29, barite: 18, steel: 8.0, lead: 4.0 } },
  { energy: 6, tvls: { concrete: 34, barite: 21, steel: 9.5, lead: 5.7 } },
  { energy: 10, tvls: { concrete: 37, barite: 24, steel: 11.0, lead: 6.6 } },
  { energy: 15, tvls: { concrete: 43, barite: 28, steel: 13.0, lead: 8.1 } },
  { energy: 18, tvls: { concrete: 46, barite: 30, steel: 14.0, lead: 8.8 } },
  { energy: 20, tvls: { concrete: 48, barite: 32, steel: 15.0, lead: 9.2 } },
  { energy: 24, tvls: { concrete: 52, barite: 35, steel: 16.0, lead: 9.8 } },
];

// ─── NCRP 151 Table B.2 — Occupancy Factors ───
const NCRP151_OCCUPANCY = [
  { area: "Full occupancy (control room, office, nurse station)", T: 1.0 },
  { area: "Patient examination/treatment room", T: 0.5 },
  { area: "Corridor, patient waiting room, staff lounge", T: 0.2 },
  { area: "Public toilet, vending area, storage", T: 0.125 },
  { area: "Outdoor area with seating, unattended parking", T: 0.05 },
  { area: "Outdoor area with only transient pedestrian traffic", T: 0.025 },
];

// ─── NCRP 151 Key Sections ───
const NCRP151_SECTIONS = [
  {
    section: "Section 2.1.1 — Primary Barriers",
    content: `The primary barrier is any wall, ceiling, or floor that the useful beam can intercept. The transmission factor B is calculated as: B = P * d^2 / (W * U * T), where P is the design dose limit (mSv/week), d is the distance from the radiation source to the barrier (m), W is the workload (Gy/week at 1m), U is the use factor (fraction of time the beam is directed at the barrier), and T is the occupancy factor. The required number of tenth-value layers is n = -log10(B). The required barrier thickness is n * TVL, where TVL is the tenth-value layer for the material and energy.`,
    tags: ["primary barrier", "TVL", "transmission", "formula", "NCRP 151"],
    energyMin: 4, energyMax: 24,
  },
  {
    section: "Section 2.1.2 — Secondary Barriers (Scatter)",
    content: `Secondary barriers for scattered radiation: K_sec = a * (W_T * T) / (d_scatter^2 * d_sec^2), where a is the scatter fraction (Table B.4a), W_T is the workload at scatter angle Theta, T is the occupancy factor. The scatter fraction a depends on the scattering angle and beam energy. For 90-degree scatter, typical a values range from 0.0005 to 0.002 depending on energy. The TVL for scattered radiation is generally less than for primary beam at the same energy.`,
    tags: ["secondary barrier", "scatter", "leakage", "NCRP 151"],
    energyMin: 4, energyMax: 24,
  },
  {
    section: "Section 2.1.2 — Leakage Radiation",
    content: `Leakage radiation through the source head must not exceed 0.1% of the useful beam at 1 meter. For secondary barrier calculations, the leakage workload is W_L = 0.001 * W. The leakage barrier is calculated assuming the beam is always on (U=1). For energies >10 MV, neutron leakage must also be considered with an additional workload factor.`,
    tags: ["leakage", "secondary barrier", "head leakage", "NCRP 151"],
    energyMin: 4, energyMax: 24,
  },
  {
    section: "Section 5.4 — Neutron Shielding",
    content: `For photon energies greater than 10 MV, neutron production in the head and patient must be considered. Concrete provides both photon and neutron shielding. The neutron TVL in concrete is approximately 21 cm, which is less than the photon TVL for most energies. Borated polyethylene (5% boron, 2.5 cm) is commonly used for neutron doors. The neutron dose equivalent is calculated using the neutron source strength Q (n/Gy at isocenter) and the maze transmission factor. For a single-legged maze, the dose reduction factor is approximately 10 per leg.`,
    tags: ["neutron", " shielding", "borated polyethylene", "maze", "NCRP 151"],
    energyMin: 10, energyMax: 24,
  },
  {
    section: "Section 2.1.4 — Skyshine",
    content: `Skyshine (roof scatter) occurs when radiation exiting through the roof is scattered back to ground level. The skyshine dose is calculated using the Chilton-Huddleston formula or the NCRP 151 graphical method. Key factors: roof transmission, source-to-roof distance, and distance from building edge to point of interest. For facilities with no roof shielding, the skyshine contribution can be significant and must be evaluated. TVL for skyshine is typically the same as primary barrier TVL.`,
    tags: ["skyshine", "roof", "scatter", "Chilton", "NCRP 151"],
    energyMin: 4, energyMax: 24,
  },
  {
    section: "Section 4.2 — Workload and Use Factors",
    content: `Typical workload for a busy external beam therapy facility is 500-1000 Gy/week. Use factors: U=1 for the primary barrier (floor if isocentric), U=0.25 for walls (gantry rotation spreads beam over 4 walls), U depends on technique (IMRT has lower U due to beam modulation). IMRT can increase leakage workload by 2-3x due to extended beam-on time.`,
    tags: ["workload", "use factor", "IMRT", "NCRP 151"],
    energyMin: 4, energyMax: 24,
  },
];

// ─── NCRP 147 (Diagnostic Imaging) ───
const NCRP147_SECTIONS = [
  {
    section: "Section 4.2 — Radiographic Rooms",
    content: `For general radiographic rooms, the primary barrier thickness is determined by the maximum kVp and workload. Typical workloads: chest room 50 mA-min/week, general radiography 300 mA-min/week. For CT rooms, the dose per rotation (mGy/rotation) and weekly scan volume determine shielding requirements. CT shielding uses the summation of scatter from multiple slices.`,
    tags: ["diagnostic", "radiography", "CT", "workload", "NCRP 147"],
  },
  {
    section: "Section 4.3 — CT Shielding",
    content: `CT scanner shielding uses the isodose scatter method. Key parameters: dose per rotation (typical 10-20 mGy at isocenter), weekly patient volume, scatter fraction (isodose charts from CT manufacturer). The NCRP 147 method sums scatter contributions from all slices. Control panel must have 2.0 mm Pb equivalent minimum. Patient waiting area may need shielding depending on throughput.`,
    tags: ["CT", "scatter", "isodose", "control panel", "NCRP 147"],
  },
  {
    section: "Section 4.4 — Fluoroscopy",
    content: `Fluoroscopy shielding considers both the primary beam (when not intercepted by patient/image receptor) and scatter. Typical fluoroscopy workload: 60-120 min/week for a busy room. Under-table fluoroscopy has lower scatter to personnel than over-table. Image-intensified systems produce more scatter than flat-panel detectors.`,
    tags: ["fluoroscopy", "scatter", "workload", "NCRP 147"],
  },
];

// ─── AAPM TG 108 — PET/CT Shielding ───
const TG108_SECTIONS = [
  {
    section: "Section 3 — F-18 FDG Shielding",
    content: `PET/CT shielding for F-18 FDG uses the AAPM TG 108 methodology. Key parameters: gamma constant for F-18 is 0.143 mSv·m²/GBq·h (or 0.092 mR·hr⁻¹·mCi⁻¹·m² at 1m). The HVL in lead is 4.1 mm and the TVL in lead is 13.6 mm. The weekly kerma is calculated as: K = Γ × A × t / d², where Γ is the gamma constant, A is activity (GBq), t is exposure time (h), and d is distance (m). Self-shielding in the uptake room reduces dose to adjacent areas.`,
    tags: ["PET/CT", "F-18", "FDG", "gamma constant", "TG 108"],
  },
  {
    section: "Section 4 — Dose Limits and Calculations",
    content: `For PET/CT facilities, calculate dose at 30 cm beyond each barrier. Design goal for uncontrolled areas: 0.02 mSv/week (1 mSv/year). For controlled areas: 0.4 mSv/week (20 mSv/year). Account for decay of F-18 (T½ = 109.8 min) between injection and imaging. Typical administered activity: 370-555 MBq (10-15 mCi) per patient.`,
    tags: ["PET/CT", "dose limits", "F-18", "decay", "TG 108"],
  },
];

// ─── CNSNS Mexico ───
const CNSNS_SECTIONS = [
  {
    section: "Mexico — Dose limits and design goals (ICRP 103 / RGSR)",
    content: `Dose limits applied for Mexico (ICRP 103; the RGSR 1988 lists 50 mSv/y occupational and 5 mSv/y public as historic values; NOM-008-NUCL-2024 does not set dose limits): Occupational exposure (controlled areas): 20 mSv/year averaged over 5 years, not exceeding 50 mSv in any single year. Public exposure (uncontrolled areas): 1 mSv/year. For shielding design, the weekly design goals are: P = 0.4 mSv/week for controlled areas and P = 0.02 mSv/week for public/uncontrolled areas. These are consistent with ICRP 103 recommendations.`,
    tags: ["Mexico", "RGSR", "dose limits", "CNSNS"],
  },
  {
    section: "NOM-008-NUCL-2024 — Radioactive contamination limits and zone criteria",
    content: `NOM-008-NUCL-2024, "Límites de contaminación radiactiva y criterios para su control" (SENER/CNSNS, DOF 2024-05-24; in force 60 calendar days after publication). It supersedes NOM-008-NUCL-2011 "Control de la contaminación radiactiva" (DOF 2011-10-26). Scope: radioactive and nuclear facilities where radioactive contamination exists or may exist. It does NOT set dose limits or shielding design goals (those come from the RGSR 1988 and NCRP 147/151).

Zone criteria (unchanged from 2011): radiation zone = whole-body dose equivalent could exceed 0.05 mSv in one hour or 1 mSv in any 5 consecutive days (§3.11); high-radiation zone = could exceed 1 mSv in one hour (§3.12); zones are delimited and signposted inside the controlled zone (§4.1).

Contamination: presence above 0.4 Bq/cm² (beta-gamma) or 0.04 Bq/cm² (alpha) (§5.0); Appendix A beta-gamma limit 0.4 Bq/cm² removable and total (2011: 0.167 removable / 0.83 total). Airborne contamination is referred to NOM-041-NUCL-2013 (2011: NOM-005-NUCL-1994). Contamination-control effectiveness must be evaluated and documented at least monthly (§4.17; 2011: "periodically").`,
    tags: ["Mexico", "NOM-008-NUCL-2024", "contamination", "radiation zone", "CNSNS"],
  },
  {
    section: "CNSNS LA-007/01 — Shielding Requirements",
    content: `The CNSNS (Comision Nacional de Seguridad Nuclear y Salvaguardias) requires that shielding calculations for medical installations include: (1) Calculations for all barriers, (2) Consideration of worst-case scenarios, (3) Use of conservative occupancy factors, (4) Documentation of source parameters, (5) Independent verification by a qualified expert. The CNSNS LA-007/01 format requires a descriptive memory, calculation methodology, and results table.`,
    tags: ["Mexico", "CNSNS", "LA-007/01", "regulatory", "requirements"],
  },
];

// ─── Specific Equipment Data ───
const EQUIPMENT_DATA = [
  {
    section: "Gamma Knife Shielding",
    modality: "Gamma Knife",
    content: `Gamma Knife uses Co-60 sources (1.17 and 1.33 MeV gammas). TVL in concrete: 210 mm. TVL in lead: 55 mm. TVL in steel: 90 mm. The primary barrier is designed for the direct beam. Secondary barriers consider leakage through the helmet channels. Annual source activity decay (~12% per year for Co-60) must be accounted for in design.`,
    tags: ["Gamma Knife", "Co-60", "TVL", "primary barrier"],
    energyMin: 1.17, energyMax: 1.33,
  },
  {
    section: "HDR Brachytherapy — Ir-192",
    modality: "HDR",
    content: `HDR Ir-192 has average energy of 380 keV. TVL in lead: 7 mm. TVL in concrete: 61 mm. The source returns to a shielded safe when not in use. Room is a controlled area. Shielding is typically modest compared to external beam. Door requires lead equivalence of 3-6 mm depending on workload.`,
    tags: ["HDR", "Ir-192", "brachytherapy", "TVL"],
    energyMin: 0.38, energyMax: 0.38,
  },
  {
    section: "Cyclotron Neutron Shielding",
    modality: "Cyclotron",
    content: `Cyclotron facilities (e.g., 18 MeV proton for FDG production) require extensive neutron shielding. Concrete walls of 1.5-2.5 m thickness are typical. The maze design is critical for neutron attenuation. Neutron doors use borated polyethylene (5% B, 2.5-5 cm) backed by lead. Activation of air, water, and components must be considered. The neutron dose equivalent rate at 1 m from an 18 MeV cyclotron target can be 10-100 mSv/h during operation.`,
    tags: ["cyclotron", "neutron", "FDG", "maze", "borated polyethylene"],
    energyMin: 18, energyMax: 18,
  },
  {
    section: "LINAC Maze Design — McGinley Method",
    modality: "LINAC",
    content: `The McGinley method (NCRP 151 Appendix A) calculates maze transmission for photons and neutrons. For photons: D_maze = D_iso * (A_wall / A_mouth) * 10^(-d_maze/TVL_eff), where d_maze is the maze path length, TVL_eff accounts for multiple reflections. For neutrons: The attenuation follows an empirical formula based on cross-sectional area ratios. A single-legged maze typically provides 10-fold attenuation. Two-legged maze provides 100-fold.`,
    tags: ["LINAC", "maze", "McGinley", "neutron", "photon"],
    energyMin: 4, energyMax: 24,
  },
];

// ─── Build all chunks ───
async function buildChunks() {
  const allChunks: Array<{
    source: string;
    section?: string;
    modality?: string;
    content: string;
    tags?: string[];
    energyMin?: number;
    energyMax?: number;
  }> = [];

  // TVL table chunks
  for (const row of NCRP151_TVL_CONCRETE) {
    const materials = Object.entries(row.tvls)
      .map(([mat, tvls]) => `${mat}: ${tvls} cm`)
      .join(", ");
    allChunks.push({
      source: "NCRP 151 Table B.1",
      section: `TVL Values — ${row.energy} MV`,
      modality: "LINAC",
      content: `Tenth-Value Layers (TVL) for ${row.energy} MV photon beam: ${materials}. The TVL is the thickness required to reduce the radiation intensity to one-tenth. HVL (Half-Value Layer) = TVL * log10(2) ≈ TVL * 0.301.`,
      tags: ["TVL", "NCRP 151", "Table B.1", "concrete", "barite", "lead", "steel"],
      energyMin: row.energy,
      energyMax: row.energy,
    });
  }

  // Occupancy factors
  for (const occ of NCRP151_OCCUPANCY) {
    allChunks.push({
      source: "NCRP 151 Table B.2",
      section: "Occupancy Factors",
      content: `Occupancy factor T = ${occ.T} for: ${occ.area}. This is the fraction of time a person is present in the area during beam-on time.`,
      tags: ["occupancy", "T factor", "NCRP 151", "Table B.2"],
    });
  }

  // NCRP 151 sections
  for (const s of NCRP151_SECTIONS) {
    allChunks.push({
      source: "NCRP 151",
      section: s.section,
      content: s.content,
      tags: s.tags,
      energyMin: s.energyMin,
      energyMax: s.energyMax,
    });
  }

  // NCRP 147 sections
  for (const s of NCRP147_SECTIONS) {
    allChunks.push({
      source: "NCRP 147",
      section: s.section,
      content: s.content,
      tags: s.tags,
    });
  }

  // TG 108 sections
  for (const s of TG108_SECTIONS) {
    allChunks.push({
      source: "AAPM TG 108",
      section: s.section,
      content: s.content,
      tags: s.tags,
    });
  }

  // CNSNS sections
  for (const s of CNSNS_SECTIONS) {
    allChunks.push({
      source: "CNSNS / RGSR / NOM-008-NUCL-2024",
      section: s.section,
      content: s.content,
      tags: s.tags,
    });
  }

  // Equipment data
  for (const e of EQUIPMENT_DATA) {
    allChunks.push({
      source: "NCRP 151 / Equipment Guide",
      section: e.section,
      modality: e.modality,
      content: e.content,
      tags: e.tags,
      energyMin: e.energyMin,
      energyMax: e.energyMax,
    });
  }

  return allChunks;
}

// ─── Main ───
async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  RadShield-MX RAG Knowledge Ingestion");
  console.log("═══════════════════════════════════════════════\n");

  // Check existing
  const existing = await countChunks();
  console.log(`Existing chunks: ${existing}`);

  if (existing > 0) {
    console.log("Deleting existing chunks...");
    await deleteAllChunks();
  }

  // Build chunks
  const chunks = await buildChunks();
  console.log(`Built ${chunks.length} chunks\n`);

  // Insert with progress
  let success = 0;
  let failed = 0;
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    process.stdout.write(`  [${i + 1}/${chunks.length}] ${c.source} — ${c.section || "general"}... `);
    try {
      await insertChunk(c);
      success++;
      process.stdout.write("OK\n");
    } catch (err) {
      failed++;
      process.stdout.write(`FAIL: ${(err as Error).message}\n`);
    }
  }

  // Verify
  const final = await countChunks();
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  Ingested: ${success} chunks`);
  console.log(`  Failed:   ${failed} chunks`);
  console.log(`  Total DB: ${final} chunks`);
  console.log(`═══════════════════════════════════════════════`);
}

main().catch(console.error);
