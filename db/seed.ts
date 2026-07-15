import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import { buildInternalDosimetryDataset } from "../src/lib/internalDosimetryDataset";
import {
  calculations,
  chatMessages,
  customMaterials,
  documentChunks,
  dosimetryEffectiveCoefficients,
  dosimetryPhantoms,
  dosimetryProcedures,
  dosimetryReferences,
  dosimetryValidationAttachments,
  dosimetryWorkspaces,
  mlTrainingData,
  projects,
  reports,
  simulationJobs,
  users,
} from "./schema";

const seedUserId = "seed-admin";
const seedProjectName = "Seed - LINAC demo bunker";
const seedSources = ["seed-ncrp151", "seed-cnsns"];
const seedDosimetryReferenceIds = ["ref-idac-dose-2-2-2025", "ref-idac-dose-software"];
const seedDosimetryWorkspaceId = "seed-internal-dosimetry-workspace";

function toDbDosimetrySourceType(sourceType: string) {
  if (sourceType === "peerReviewed") return "peer_reviewed" as const;
  if (sourceType === "icrp") return "icrp" as const;
  if (sourceType === "software") return "software" as const;
  return "institutional" as const;
}

function toDbPhantomSex(sex: string) {
  if (sex === "male") return "male" as const;
  if (sex === "female") return "female" as const;
  return "reference_person" as const;
}

function toDbDosimetryValidationStatus(status: string) {
  if (status === "paper-example") return "paper_example" as const;
  if (status === "validated-external-output") return "seeded" as const;
  return "needs_review" as const;
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed the database");
  }

  const db = getDb();
  console.log("Seeding RadShield-MX database...");
  const dosimetryDataset = buildInternalDosimetryDataset(new Date("2026-07-11T12:00:00.000Z"));
  const seedProcedureIds = dosimetryDataset.procedures.map((procedure) => procedure.id);
  const seedPhantomIds = dosimetryDataset.phantoms.map((phantom) => phantom.id);
  const seedCoefficientIds = dosimetryDataset.effectiveDoseCoefficients.map(
    (coefficient) => coefficient.id,
  );

  await db.delete(chatMessages).where(eq(chatMessages.userId, seedUserId));
  await db.delete(simulationJobs).where(eq(simulationJobs.userId, seedUserId));
  await db.delete(reports).where(eq(reports.userId, seedUserId));
  await db.delete(calculations).where(eq(calculations.userId, seedUserId));
  await db.delete(mlTrainingData).where(eq(mlTrainingData.userId, seedUserId));
  await db.delete(customMaterials).where(eq(customMaterials.userId, seedUserId));
  await db
    .delete(dosimetryValidationAttachments)
    .where(eq(dosimetryValidationAttachments.workspaceId, seedDosimetryWorkspaceId));
  await db
    .delete(dosimetryWorkspaces)
    .where(eq(dosimetryWorkspaces.workspaceId, seedDosimetryWorkspaceId));
  await db
    .delete(dosimetryEffectiveCoefficients)
    .where(inArray(dosimetryEffectiveCoefficients.coefficientId, seedCoefficientIds));
  await db
    .delete(dosimetryProcedures)
    .where(inArray(dosimetryProcedures.procedureId, seedProcedureIds));
  await db
    .delete(dosimetryPhantoms)
    .where(inArray(dosimetryPhantoms.phantomId, seedPhantomIds));
  await db
    .delete(dosimetryReferences)
    .where(inArray(dosimetryReferences.referenceId, seedDosimetryReferenceIds));
  await db.delete(projects).where(
    and(eq(projects.userId, seedUserId), eq(projects.name, seedProjectName)),
  );
  await db.delete(documentChunks).where(inArray(documentChunks.source, seedSources));

  await db
    .insert(users)
    .values({
      unionId: seedUserId,
      name: "RadShield Seed Admin",
      email: "seed-admin@radshield.local",
      role: "admin",
      lastSignInAt: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        name: "RadShield Seed Admin",
        email: "seed-admin@radshield.local",
        role: "admin",
        lastSignInAt: new Date(),
      },
    });

  await db.insert(projects).values({
    userId: seedUserId,
    name: seedProjectName,
    description: "Minimal local/test project for backend and DB smoke tests.",
    floorPlanJson: JSON.stringify({
      rooms: [{ id: "room-1", name: "LINAC bunker", width: 8, height: 7 }],
      barriers: [{ id: "barrier-1", material: "concrete", thicknessCm: 180 }],
      sources: [{ id: "source-1", type: "LINAC", energy: "6 MV" }],
    }),
    version: "1.0",
    modality: "LINAC",
    numSources: "1",
    numBarriers: "1",
    maxKerma: "0.02 mSv/week",
  });

  await db.insert(customMaterials).values({
    userId: seedUserId,
    name: "Seed high-density concrete",
    category: "concrete",
    density_g_cm3: "2.40",
    tvlJson: JSON.stringify({ "6MV": 36, "10MV": 37, "15MV": 44 }),
    cost_MXN_per_m3: "4200",
    notes: "Seed material for local/test validation.",
  });

  await db.insert(calculations).values({
    userId: seedUserId,
    type: "ncrp151",
    equipment: "LINAC",
    modality: "LINAC",
    energy: "6 MV",
    parametersJson: JSON.stringify({
      workloadGyWeek: 500,
      distanceM: 6,
      occupancy: 0.25,
      useFactor: 0.25,
    }),
    resultsJson: JSON.stringify({
      material: "concrete",
      thicknessCm: 180,
      status: "seed",
    }),
    materialId: "seed-concrete",
    passes: "pass",
  });

  await db.insert(reports).values({
    userId: seedUserId,
    title: "Seed CNSNS analytical memory",
    installation: "RadShield local test",
    equipment: "LINAC",
    modality: "LINAC",
    content: "Seed report used to verify report persistence.",
    format: "txt",
  });

  await db.insert(documentChunks).values([
    {
      source: "seed-ncrp151",
      section: "Barrier design smoke",
      modality: "LINAC",
      content: "Seed chunk: primary barrier transmission depends on workload, use factor, occupancy and distance.",
      embedding: JSON.stringify([]),
      tags: JSON.stringify(["seed", "LINAC", "barrier"]),
      energyMin: 4,
      energyMax: 18,
      pageRef: "seed",
    },
    {
      source: "seed-cnsns",
      section: "Documentation smoke",
      modality: "General",
      content: "Seed chunk: CNSNS reports should preserve assumptions, calculation parameters and final shielding recommendations.",
      embedding: JSON.stringify([]),
      tags: JSON.stringify(["seed", "CNSNS", "report"]),
      pageRef: "seed",
    },
  ]);

  await db.insert(mlTrainingData).values({
    userId: seedUserId,
    energy: "6 MV",
    distance: "6",
    workload: "500",
    occupancy: "0.25",
    goalDose: "0.02",
    useFactor: "0.25",
    material: "concrete",
    thickness: "180",
    method: "ncrp151",
  });

  await db.insert(dosimetryReferences).values(
    dosimetryDataset.references.map((reference) => ({
      referenceId: reference.id,
      title: reference.title,
      doi: reference.doi ?? null,
      url: reference.url,
      year: reference.year,
      sourceType: toDbDosimetrySourceType(reference.sourceType),
      notes: reference.notes,
    })),
  );

  await db.insert(dosimetryPhantoms).values(
    dosimetryDataset.phantoms.map((phantom) => ({
      phantomId: phantom.id,
      label: phantom.label,
      ageGroup: phantom.ageGroup,
      sex: toDbPhantomSex(phantom.sex),
      sourcePublication: phantom.sourcePublication,
      interpolationEligible: phantom.interpolationEligible ? 1 : 0,
      metadataJson: JSON.stringify({ source: "phase-48-internal-dosimetry-dataset" }),
    })),
  );

  await db.insert(dosimetryProcedures).values(
    dosimetryDataset.procedures.map((procedure) => ({
      procedureId: procedure.id,
      displayName: procedure.displayName,
      modality: "Diagnostic nuclear medicine",
      radionuclideSymbol: procedure.radionuclideSymbol,
      administeredActivityUnit: procedure.unit,
      route: procedure.route,
      coefficientSource: procedure.coefficientSource,
      criticalOrgansJson: JSON.stringify(procedure.criticalOrgans),
      validationStatus: toDbDosimetryValidationStatus(procedure.validationStatus),
      notes: procedure.notes,
    })),
  );

  await db.insert(dosimetryEffectiveCoefficients).values(
    dosimetryDataset.effectiveDoseCoefficients.map((coefficient) => ({
      coefficientId: coefficient.id,
      procedureId: coefficient.procedureId,
      phantomAgeGroup: coefficient.phantomAgeGroup,
      coefficientMSvPerMBq: coefficient.coefficient_mSv_per_MBq,
      unit: coefficient.unit,
      sexAveragedEffectiveDose: coefficient.sexAveragedEffectiveDose ? 1 : 0,
      sourceReferenceId: coefficient.sourceReferenceId,
      validationStatus: toDbDosimetryValidationStatus(coefficient.validationStatus),
      notes: null,
    })),
  );

  await db.insert(dosimetryWorkspaces).values({
    workspaceId: seedDosimetryWorkspaceId,
    userId: seedUserId,
    projectId: null,
    projectName: "Seed - Medicina Nuclear IDAC/ICRP",
    datasetVersion: dosimetryDataset.schemaVersion,
    datasetJson: JSON.stringify(dosimetryDataset),
    evidencePackJson: JSON.stringify({
      source: "phase-50-seed",
      references: seedDosimetryReferenceIds,
      pendingAttachments: [],
    }),
    migrationPlanJson: JSON.stringify(dosimetryDataset.dbRoadmap),
  });

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
