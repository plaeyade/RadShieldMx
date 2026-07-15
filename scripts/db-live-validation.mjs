import "dotenv/config";
import mysql from "mysql2/promise";

const requiredTables = [
  "users",
  "projects",
  "calculations",
  "custom_materials",
  "document_chunks",
  "reports",
  "simulation_jobs",
  "chat_messages",
  "audit_trail",
  "ml_training_data",
  "collaboration_locks",
  "dosimetry_references",
  "dosimetry_phantoms",
  "dosimetry_procedures",
  "dosimetry_effective_coefficients",
  "dosimetry_workspaces",
  "dosimetry_validation_attachments",
  "analytic_memory_snapshots",
  "controlled_zone_calculations",
  "controlled_zone_plans",
  "project_report_exports",
];

const seedExpectations = [
  { name: "seed-admin user", sql: "select count(*) as count from users where unionId = ?", params: ["seed-admin"], min: 1 },
  { name: "seed project", sql: "select count(*) as count from projects where userId = ? and name = ?", params: ["seed-admin", "Seed - LINAC demo bunker"], min: 1 },
  { name: "seed custom material", sql: "select count(*) as count from custom_materials where userId = ?", params: ["seed-admin"], min: 1 },
  { name: "seed calculation", sql: "select count(*) as count from calculations where userId = ?", params: ["seed-admin"], min: 1 },
  { name: "seed report", sql: "select count(*) as count from reports where userId = ?", params: ["seed-admin"], min: 1 },
  { name: "seed RAG chunks", sql: "select count(*) as count from document_chunks where source in (?, ?)", params: ["seed-ncrp151", "seed-cnsns"], min: 2 },
  { name: "dosimetry references", sql: "select count(*) as count from dosimetry_references", params: [], min: 2 },
  { name: "dosimetry phantoms", sql: "select count(*) as count from dosimetry_phantoms", params: [], min: 15 },
  { name: "dosimetry procedures", sql: "select count(*) as count from dosimetry_procedures", params: [], min: 3 },
  { name: "dosimetry coefficients", sql: "select count(*) as count from dosimetry_effective_coefficients", params: [], min: 20 },
  { name: "seed dosimetry workspace", sql: "select count(*) as count from dosimetry_workspaces where workspace_id = ?", params: ["seed-internal-dosimetry-workspace"], min: 1 },
];

function parseDatabaseName(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return parsed.pathname.replace(/^\//, "");
}

function publicDatabaseUrl(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return `${parsed.protocol}//${parsed.username ? `${parsed.username}@` : ""}${parsed.hostname}:${parsed.port || 3306}/${parsed.pathname.replace(/^\//, "")}`;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log(JSON.stringify({
    ok: false,
    phase: "F71",
    reason: "DATABASE_URL is required for live DB validation",
  }, null, 2));
  process.exit(1);
}

let connection;
try {
  const database = parseDatabaseName(databaseUrl);
  connection = await mysql.createConnection(databaseUrl);

  const [tableRows] = await connection.execute(
    "select table_name as tableName from information_schema.tables where table_schema = ?",
    [database],
  );
  const presentTables = new Set(tableRows.map((row) => row.tableName));
  const tableChecks = requiredTables.map((table) => ({
    name: `table:${table}`,
    ok: presentTables.has(table),
  }));

  const seedChecks = [];
  for (const expectation of seedExpectations) {
    const [rows] = await connection.execute(expectation.sql, expectation.params);
    const count = Number(rows[0]?.count ?? 0);
    seedChecks.push({
      name: expectation.name,
      ok: count >= expectation.min,
      count,
      min: expectation.min,
    });
  }

  const checks = [...tableChecks, ...seedChecks];
  const report = {
    ok: checks.every((check) => check.ok),
    phase: "F71",
    databaseUrl: publicDatabaseUrl(databaseUrl),
    checks,
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
} catch (error) {
  console.log(JSON.stringify({
    ok: false,
    phase: "F81",
    databaseUrl: publicDatabaseUrl(databaseUrl),
    reason: error instanceof Error ? error.message : String(error),
    nextSteps: [
      "Start a MySQL server matching DATABASE_URL.",
      "Run npm run db:migrate.",
      "Run npm run db:seed.",
      "Run npm run db:validate:live.",
    ],
  }, null, 2));
  process.exitCode = 1;
} finally {
  await connection?.end();
}
