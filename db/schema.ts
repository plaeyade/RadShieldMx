import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  float,
  int,
  index,
  // bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Fase 5+6: Saved shielding projects
export const projects = mysqlTable("projects", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(), // unionId from auth
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // FloorPlan JSON snapshot
  floorPlanJson: text("floorPlanJson").notNull(),
  version: varchar("version", { length: 10 }).default("1.2").notNull(),
  // Metadata
  modality: varchar("modality", { length: 50 }), // 'LINAC', 'PET-CT', 'GammaKnife', etc.
  numSources: varchar("numSources", { length: 10 }),
  numBarriers: varchar("numBarriers", { length: 10 }),
  maxKerma: varchar("maxKerma", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// Batch 1: Audit trail for regulatory compliance (CNSNS requirement)
export const auditTrail = mysqlTable("audit_trail", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  projectId: varchar("projectId", { length: 50 }).notNull(),
  action: mysqlEnum("action", ["create", "update", "delete", "calculate", "export", "generate_report", "login", "logout"]).notNull(),
  fieldName: varchar("fieldName", { length: 100 }), // which field changed
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditTrail = typeof auditTrail.$inferSelect;
export type InsertAuditTrail = typeof auditTrail.$inferInsert;

// Batch 1: Collaboration locks for team editing
export const collaborationLocks = mysqlTable("collaboration_locks", {
  id: serial("id").primaryKey(),
  projectId: varchar("projectId", { length: 50 }).notNull(),
  userId: varchar("userId", { length: 255 }).notNull(),
  userName: varchar("userName", { length: 255 }),
  lockedAt: timestamp("lockedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // auto-expire after 5 min
});

export type CollaborationLock = typeof collaborationLocks.$inferSelect;
export type InsertCollaborationLock = typeof collaborationLocks.$inferInsert;
// Batch 8: Simulation jobs for Monte Carlo dual-output (CSV / ROOT / BOTH)
export const simulationJobs = mysqlTable("simulation_jobs", {
  id: serial("id").primaryKey(),
  projectId: varchar("project_id", { length: 50 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  format: mysqlEnum("format", ["csv", "root", "both"]).notNull().default("csv"),
  status: mysqlEnum("status", ["pending", "running", "done", "failed", "cancelled"]).notNull().default("pending"),
  particles: varchar("particles", { length: 20 }).notNull(),
  geometryJson: text("geometry_json").notNull(),
  modality: varchar("modality", { length: 50 }),
  energy: varchar("energy", { length: 20 }),
  resultCsvUrl: varchar("result_csv_url", { length: 500 }),
  resultRootUrl: varchar("result_root_url", { length: 500 }),
  resultSummaryJson: text("result_summary_json"), // parsed metrics
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SimulationJob = typeof simulationJobs.$inferSelect;
export type InsertSimulationJob = typeof simulationJobs.$inferInsert;

// ═══════════════════════════════════════════════════════════
// Capa 2: RAG — Vector Knowledge Base (LLM Integration)
// ═══════════════════════════════════════════════════════════

export const documentChunks = mysqlTable(
  "document_chunks",
  {
    id: serial("id").primaryKey(),
    source: varchar("source", { length: 255 }).notNull(), // "NCRP 151", "NCRP 147", "REF075"
    section: varchar("section", { length: 255 }), // "Table B.1", "Section 5.4"
    modality: varchar("modality", { length: 100 }), // "LINAC", "PET/CT", "Gamma Knife"
    content: text("content").notNull(), // Chunk de texto
    embedding: text("embedding").notNull(), // JSON array de 1536 floats
    tags: text("tags"), // JSON array: ["TVL", "concrete", "primary barrier"]
    energyMin: float("energy_min"), // Para filtrado por energía (MeV)
    energyMax: float("energy_max"),
    pageRef: varchar("page_ref", { length: 50 }), // Página del documento
    usage: int("usage_count").default(0), // Veces usado en RAG
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_source").on(table.source),
    index("idx_modality").on(table.modality),
    index("idx_section").on(table.section),
  ]
);

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type InsertDocumentChunk = typeof documentChunks.$inferInsert;

// Chat history for LLM conversations
export const chatMessages = mysqlTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }),
    sessionId: varchar("session_id", { length: 255 }).notNull(),
    role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
    content: text("content").notNull(),
    sources: text("sources"), // JSON: ["NCRP 151 Table B.1", "REF075"]
    modelUsed: varchar("model_used", { length: 50 }), // "gpt-4o-mini", "llama3.3"
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_session").on(table.sessionId),
    index("idx_user").on(table.userId),
  ]
);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// ═══════════════════════════════════════════════════════════
// v88: Backend persistence tables
// ═══════════════════════════════════════════════════════════

// Calculation history for audit trail and reproducibility
export const calculations = mysqlTable("calculations", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'ncrp147', 'ncrp151', 'neutron', 'skyshine'
  equipment: varchar("equipment", { length: 100 }),
  modality: varchar("modality", { length: 50 }),
  energy: varchar("energy", { length: 20 }),
  parametersJson: text("parametersJson").notNull(), // JSON: { distance, workload, occupancy, useFactor }
  resultsJson: text("resultsJson").notNull(), // JSON: { kermaRate, thicknessLead, thicknessConcrete, passes }
  materialId: varchar("materialId", { length: 50 }),
  passes: mysqlEnum("passes", ["pass", "fail", "warning"]).default("pass"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Calculation = typeof calculations.$inferSelect;
export type InsertCalculation = typeof calculations.$inferInsert;

// Custom materials defined by users
export const customMaterials = mysqlTable("custom_materials", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  category: mysqlEnum("category", ["concrete", "steel", "lead", "composite", "barite", "borated", "special"]).notNull(),
  density_g_cm3: varchar("density_g_cm3", { length: 20 }).notNull(),
  tvlJson: text("tvlJson"), // JSON: { "6MV": 37, "10MV": 37, ... }
  cost_MXN_per_m3: varchar("cost_MXN_per_m3", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomMaterial = typeof customMaterials.$inferSelect;
export type InsertCustomMaterial = typeof customMaterials.$inferInsert;

// Analytical reports / memorias
export const reports = mysqlTable("reports", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  installation: varchar("installation", { length: 255 }),
  equipment: varchar("equipment", { length: 100 }),
  modality: varchar("modality", { length: 50 }),
  content: text("content").notNull(),
  format: mysqlEnum("format", ["txt", "pdf", "json"]).default("txt").notNull(),
  projectId: varchar("projectId", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// ML training data for predictive models
export const mlTrainingData = mysqlTable("ml_training_data", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 255 }),
  energy: varchar("energy", { length: 20 }).notNull(),
  distance: varchar("distance", { length: 20 }).notNull(),
  workload: varchar("workload", { length: 20 }).notNull(),
  occupancy: varchar("occupancy", { length: 20 }).notNull(),
  goalDose: varchar("goalDose", { length: 20 }).notNull(),
  useFactor: varchar("useFactor", { length: 20 }).notNull(),
  material: varchar("material", { length: 50 }).notNull(),
  thickness: varchar("thickness", { length: 20 }).notNull(),
  method: mysqlEnum("method", ["ncrp151", "ncrp147", "ml", "user"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MlTrainingDatum = typeof mlTrainingData.$inferSelect;
export type InsertMlTrainingDatum = typeof mlTrainingData.$inferInsert;

// Phase 50: internal dosimetry persistence, evidence and validation bridge.
export const dosimetryReferences = mysqlTable(
  "dosimetry_references",
  {
    id: serial("id").primaryKey(),
    referenceId: varchar("reference_id", { length: 120 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    doi: varchar("doi", { length: 120 }),
    url: varchar("url", { length: 500 }).notNull(),
    year: int("year").notNull(),
    sourceType: mysqlEnum("source_type", [
      "peer_reviewed",
      "icrp",
      "software",
      "institutional",
    ]).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_dosimetry_references_ref").on(table.referenceId),
    index("idx_dosimetry_references_type").on(table.sourceType),
  ],
);

export type DosimetryReference = typeof dosimetryReferences.$inferSelect;
export type InsertDosimetryReference = typeof dosimetryReferences.$inferInsert;

export const dosimetryPhantoms = mysqlTable(
  "dosimetry_phantoms",
  {
    id: serial("id").primaryKey(),
    phantomId: varchar("phantom_id", { length: 120 }).notNull().unique(),
    label: varchar("label", { length: 255 }).notNull(),
    ageGroup: varchar("age_group", { length: 40 }).notNull(),
    sex: mysqlEnum("sex", ["male", "female", "reference_person"]).notNull(),
    sourcePublication: varchar("source_publication", { length: 120 }).notNull(),
    interpolationEligible: int("interpolation_eligible").default(0).notNull(),
    metadataJson: text("metadata_json"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_dosimetry_phantoms_age").on(table.ageGroup),
    index("idx_dosimetry_phantoms_source").on(table.sourcePublication),
  ],
);

export type DosimetryPhantom = typeof dosimetryPhantoms.$inferSelect;
export type InsertDosimetryPhantom = typeof dosimetryPhantoms.$inferInsert;

export const dosimetryProcedures = mysqlTable(
  "dosimetry_procedures",
  {
    id: serial("id").primaryKey(),
    procedureId: varchar("procedure_id", { length: 120 }).notNull().unique(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    modality: varchar("modality", { length: 80 }).notNull(),
    radionuclideSymbol: varchar("radionuclide_symbol", { length: 50 }).notNull(),
    administeredActivityUnit: varchar("administered_activity_unit", { length: 40 }).notNull(),
    route: mysqlEnum("route", ["intravenous", "oral", "inhalation", "other"]).notNull(),
    coefficientSource: varchar("coefficient_source", { length: 255 }).notNull(),
    criticalOrgansJson: text("critical_organs_json").notNull(),
    validationStatus: mysqlEnum("procedure_validation_status", [
      "paper_example",
      "seeded",
      "needs_review",
    ]).default("seeded").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_dosimetry_procedures_modality").on(table.modality),
    index("idx_dosimetry_procedures_radionuclide").on(table.radionuclideSymbol),
  ],
);

export type DosimetryProcedure = typeof dosimetryProcedures.$inferSelect;
export type InsertDosimetryProcedure = typeof dosimetryProcedures.$inferInsert;

export const dosimetryEffectiveCoefficients = mysqlTable(
  "dosimetry_effective_coefficients",
  {
    id: serial("id").primaryKey(),
    coefficientId: varchar("coefficient_id", { length: 160 }).notNull().unique(),
    procedureId: varchar("procedure_id", { length: 120 }).notNull(),
    phantomAgeGroup: varchar("phantom_age_group", { length: 40 }).notNull(),
    coefficientMSvPerMBq: float("coefficient_msv_per_mbq").notNull(),
    unit: varchar("unit", { length: 40 }).default("mSv/MBq").notNull(),
    sexAveragedEffectiveDose: int("sex_averaged_effective_dose").default(1).notNull(),
    sourceReferenceId: varchar("source_reference_id", { length: 120 }).notNull(),
    validationStatus: mysqlEnum("coefficient_validation_status", [
      "paper_example",
      "seeded",
      "needs_review",
    ]).default("paper_example").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_dosimetry_coefficients_procedure").on(table.procedureId),
    index("idx_dosimetry_coefficients_phantom").on(table.phantomAgeGroup),
    index("idx_dosimetry_coefficients_reference").on(table.sourceReferenceId),
  ],
);

export type DosimetryEffectiveCoefficient = typeof dosimetryEffectiveCoefficients.$inferSelect;
export type InsertDosimetryEffectiveCoefficient = typeof dosimetryEffectiveCoefficients.$inferInsert;

export const dosimetryWorkspaces = mysqlTable(
  "dosimetry_workspaces",
  {
    id: serial("id").primaryKey(),
    workspaceId: varchar("workspace_id", { length: 120 }).notNull().unique(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    projectId: varchar("project_id", { length: 120 }),
    projectName: varchar("project_name", { length: 255 }).notNull(),
    datasetVersion: varchar("dataset_version", { length: 80 }).notNull(),
    datasetJson: text("dataset_json").notNull(),
    evidencePackJson: text("evidence_pack_json"),
    migrationPlanJson: text("migration_plan_json"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_dosimetry_workspaces_user").on(table.userId),
    index("idx_dosimetry_workspaces_project").on(table.projectId),
  ],
);

export type DosimetryWorkspaceRecord = typeof dosimetryWorkspaces.$inferSelect;
export type InsertDosimetryWorkspaceRecord = typeof dosimetryWorkspaces.$inferInsert;

export const dosimetryValidationAttachments = mysqlTable(
  "dosimetry_validation_attachments",
  {
    id: serial("id").primaryKey(),
    attachmentId: varchar("attachment_id", { length: 160 }).notNull().unique(),
    workspaceId: varchar("workspace_id", { length: 120 }),
    projectId: varchar("project_id", { length: 120 }),
    procedureId: varchar("procedure_id", { length: 120 }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    sizeBytes: varchar("size_bytes", { length: 40 }).notNull(),
    hashSha256: varchar("hash_sha256", { length: 128 }).notNull(),
    storageUri: varchar("storage_uri", { length: 500 }),
    reviewStatus: mysqlEnum("review_status", ["pending", "accepted", "rejected"])
      .default("pending")
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_dosimetry_attachments_workspace").on(table.workspaceId),
    index("idx_dosimetry_attachments_project").on(table.projectId),
    index("idx_dosimetry_attachments_procedure").on(table.procedureId),
    index("idx_dosimetry_attachments_hash").on(table.hashSha256),
  ],
);

export type DosimetryValidationAttachment = typeof dosimetryValidationAttachments.$inferSelect;
export type InsertDosimetryValidationAttachment =
  typeof dosimetryValidationAttachments.$inferInsert;

// Phase 61: controlled-zone layout, shielding-plan and report persistence.
export const controlledZonePlans = mysqlTable(
  "controlled_zone_plans",
  {
    id: serial("id").primaryKey(),
    planKey: varchar("plan_key", { length: 255 }).notNull().unique(),
    projectId: varchar("project_id", { length: 120 }),
    userId: varchar("user_id", { length: 255 }).notNull(),
    optionId: varchar("option_id", { length: 160 }).notNull(),
    optionName: varchar("option_name", { length: 255 }).notNull(),
    modality: varchar("modality", { length: 80 }).notNull(),
    schemaVersion: varchar("schema_version", { length: 120 }).notNull(),
    generatedAt: timestamp("generated_at"),
    profileJson: text("profile_json").notNull(),
    assumptionsJson: text("assumptions_json").notNull(),
    summaryJson: text("summary_json").notNull(),
    missingInputsJson: text("missing_inputs_json"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_controlled_zone_plans_project").on(table.projectId),
    index("idx_controlled_zone_plans_user").on(table.userId),
    index("idx_controlled_zone_plans_modality").on(table.modality),
  ],
);

export type ControlledZonePlanRecord = typeof controlledZonePlans.$inferSelect;
export type InsertControlledZonePlanRecord = typeof controlledZonePlans.$inferInsert;

export const controlledZoneCalculations = mysqlTable(
  "controlled_zone_calculations",
  {
    id: serial("id").primaryKey(),
    planKey: varchar("plan_key", { length: 255 }).notNull(),
    seedId: varchar("seed_id", { length: 160 }).notNull(),
    barrier: varchar("barrier", { length: 80 }).notNull(),
    adjacentZone: varchar("adjacent_zone", { length: 40 }).notNull(),
    calculationFamily: varchar("calculation_family", { length: 80 }).notNull(),
    method: varchar("method", { length: 80 }).notNull(),
    distanceM: float("distance_m").notNull(),
    occupancyFactor: float("occupancy_factor").notNull(),
    designGoalMSvWeek: float("design_goal_msv_week").notNull(),
    unshieldedMSvWeek: float("unshielded_msv_week").notNull(),
    requiredThicknessMm: float("required_thickness_mm").notNull(),
    materialCode: varchar("material_code", { length: 80 }).notNull(),
    status: varchar("status", { length: 40 }).notNull(),
    sortOrder: int("sort_order").notNull(),
    notesJson: text("notes_json"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_controlled_zone_calcs_plan").on(table.planKey),
    index("idx_controlled_zone_calcs_barrier").on(table.barrier),
    index("idx_controlled_zone_calcs_status").on(table.status),
  ],
);

export type ControlledZoneCalculationRecord = typeof controlledZoneCalculations.$inferSelect;
export type InsertControlledZoneCalculationRecord = typeof controlledZoneCalculations.$inferInsert;

export const analyticMemorySnapshots = mysqlTable(
  "analytic_memory_snapshots",
  {
    id: serial("id").primaryKey(),
    snapshotId: varchar("snapshot_id", { length: 255 }).notNull().unique(),
    projectId: varchar("project_id", { length: 120 }),
    planKey: varchar("plan_key", { length: 255 }),
    userId: varchar("user_id", { length: 255 }).notNull(),
    format: varchar("format", { length: 40 }).notNull(),
    status: varchar("status", { length: 40 }).notNull(),
    contentJson: text("content_json").notNull(),
    evidenceLinksJson: text("evidence_links_json"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_analytic_memory_project").on(table.projectId),
    index("idx_analytic_memory_plan").on(table.planKey),
  ],
);

export type AnalyticMemorySnapshotRecord = typeof analyticMemorySnapshots.$inferSelect;
export type InsertAnalyticMemorySnapshotRecord = typeof analyticMemorySnapshots.$inferInsert;

export const projectReportExports = mysqlTable(
  "project_report_exports",
  {
    id: serial("id").primaryKey(),
    exportId: varchar("export_id", { length: 255 }).notNull().unique(),
    projectId: varchar("project_id", { length: 120 }),
    planKey: varchar("plan_key", { length: 255 }),
    userId: varchar("user_id", { length: 255 }).notNull(),
    reportType: varchar("report_type", { length: 80 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    hashSha256: varchar("hash_sha256", { length: 128 }).notNull(),
    metadataJson: text("metadata_json"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_project_report_exports_project").on(table.projectId),
    index("idx_project_report_exports_plan").on(table.planKey),
    index("idx_project_report_exports_hash").on(table.hashSha256),
  ],
);

export type ProjectReportExportRecord = typeof projectReportExports.$inferSelect;
export type InsertProjectReportExportRecord = typeof projectReportExports.$inferInsert;
