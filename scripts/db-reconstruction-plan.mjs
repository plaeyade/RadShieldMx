import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import net from "node:net";

function commandExists(command) {
  const lookup = process.platform === "win32" ? "where" : "command";
  const args = process.platform === "win32" ? [command] : ["-v", command];
  const result = spawnSync(lookup, args, { stdio: "ignore", shell: process.platform !== "win32" });
  return result.status === 0;
}

function read(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function includesAll(content, tokens) {
  return tokens.filter((token) => !content.includes(token));
}

function parseDatabaseUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return {
      protocol: url.protocol,
      host: url.hostname,
      port: Number(url.port || 3306),
      database: url.pathname.replace(/^\//, ""),
      username: url.username,
    };
  } catch {
    return null;
  }
}

function checkTcp(host, port, timeoutMs = 1500) {
  return new Promise((resolveCheck) => {
    const socket = net.createConnection({ host, port });
    const done = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolveCheck(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

const root = process.cwd();
const databaseUrl = process.env.DATABASE_URL ?? "";
const parsedDatabaseUrl = parseDatabaseUrl(databaseUrl);
const databaseTcpReachable = parsedDatabaseUrl
  ? await checkTcp(parsedDatabaseUrl.host, parsedDatabaseUrl.port)
  : false;
const dockerAvailable = commandExists("docker");
const mysqlCliAvailable = commandExists("mysql");

const files = {
  drizzleConfig: resolve(root, "drizzle.config.ts"),
  dockerComposeDb: resolve(root, "docker-compose.db.yml"),
  dockerComposeFull: resolve(root, "docker-compose.yml"),
  schema: resolve(root, "db/schema.ts"),
  seed: resolve(root, "db/seed.ts"),
  migration0000: resolve(root, "db/migrations/0000_pretty_bloodscream.sql"),
  migration0001: resolve(root, "db/migrations/0001_optimal_yellowjacket.sql"),
  migration0002: resolve(root, "db/migrations/0002_safe_gideon.sql"),
  journal: resolve(root, "db/migrations/meta/_journal.json"),
  runbook: resolve(root, "DB_RECONSTRUCTION_RUNBOOK.md"),
};

const requiredTables = [
  "dosimetry_references",
  "dosimetry_phantoms",
  "dosimetry_procedures",
  "dosimetry_effective_coefficients",
  "dosimetry_workspaces",
  "dosimetry_validation_attachments",
];

const requiredWorkflowTables = [
  "analytic_memory_snapshots",
  "controlled_zone_calculations",
  "controlled_zone_plans",
  "project_report_exports",
];

const requiredSeedTokens = [
  "buildInternalDosimetryDataset",
  "dosimetryReferences",
  "dosimetryPhantoms",
  "dosimetryProcedures",
  "dosimetryEffectiveCoefficients",
  "dosimetryWorkspaces",
];

const requiredScripts = [
  "db:preflight",
  "db:migrate",
  "db:seed",
  "db:validate:live",
  "build:backend",
  "test:backend:health",
];

const packageJson = JSON.parse(read(resolve(root, "package.json")) || "{}");
const migrationSql = read(files.migration0001);
const workflowMigrationSql = read(files.migration0002);
const seedSource = read(files.seed);
const schemaSource = read(files.schema);
const runbook = read(files.runbook);
const composeDb = read(files.dockerComposeDb);
const journal = read(files.journal);

const checks = [
  {
    name: "DATABASE_URL",
    ok: Boolean(parsedDatabaseUrl),
    detail: parsedDatabaseUrl
      ? `${parsedDatabaseUrl.username}@${parsedDatabaseUrl.host}:${parsedDatabaseUrl.port}/${parsedDatabaseUrl.database}`
      : "missing or invalid",
    requiredFor: ["db:migrate", "db:seed", "db health"],
  },
  {
    name: "Database TCP reachability",
    ok: databaseTcpReachable,
    detail: parsedDatabaseUrl ? `${parsedDatabaseUrl.host}:${parsedDatabaseUrl.port}` : "not checked",
    requiredFor: ["db:migrate", "db:seed", "db health"],
  },
  {
    name: "Docker CLI",
    ok: dockerAvailable,
    detail: dockerAvailable ? "available" : "not found in PATH",
    requiredFor: ["local MySQL via docker-compose.db.yml"],
  },
  {
    name: "MySQL CLI",
    ok: mysqlCliAvailable,
    detail: mysqlCliAvailable ? "available" : "not found in PATH",
    requiredFor: ["manual DB inspection only"],
  },
  ...Object.entries(files).map(([name, path]) => ({
    name: `file:${name}`,
    ok: existsSync(path),
    detail: path,
  })),
  {
    name: "F50 migration tables",
    ok: includesAll(migrationSql, requiredTables.map((table) => `\`${table}\``)).length === 0,
    detail: includesAll(migrationSql, requiredTables.map((table) => `\`${table}\``)).join(", ") || "all present",
  },
  {
    name: "F50 schema exports",
    ok: includesAll(schemaSource, requiredTables).length === 0,
    detail: includesAll(schemaSource, requiredTables).join(", ") || "all present",
  },
  {
    name: "F50 seed coverage",
    ok: includesAll(seedSource, requiredSeedTokens).length === 0,
    detail: includesAll(seedSource, requiredSeedTokens).join(", ") || "all present",
  },
  {
    name: "F69/F70 workflow migration tables",
    ok: includesAll(workflowMigrationSql, requiredWorkflowTables.map((table) => `\`${table}\``)).length === 0,
    detail: includesAll(workflowMigrationSql, requiredWorkflowTables.map((table) => `\`${table}\``)).join(", ") || "all present",
  },
  {
    name: "F69/F70 workflow schema exports",
    ok: includesAll(schemaSource, requiredWorkflowTables).length === 0,
    detail: includesAll(schemaSource, requiredWorkflowTables).join(", ") || "all present",
  },
  {
    name: "Migration journal includes 0002",
    ok: journal.includes("0002_safe_gideon"),
    detail: "db/migrations/meta/_journal.json",
  },
  {
    name: "DB compose defaults",
    ok:
      composeDb.includes("MYSQL_DATABASE: radshield_mx_test") &&
      composeDb.includes("MYSQL_USER: radshield") &&
      composeDb.includes("3306:3306"),
    detail: "mysql:8.0 radshield_mx_test on 127.0.0.1:3306",
  },
  {
    name: "package scripts",
    ok: requiredScripts.every((scriptName) => Boolean(packageJson.scripts?.[scriptName])),
    detail: requiredScripts.filter((scriptName) => !packageJson.scripts?.[scriptName]).join(", ") || "all present",
  },
  {
    name: "runbook F54",
    ok:
      runbook.includes("Fase 54") &&
      runbook.includes("dosimetry.upsertWorkspace") &&
      runbook.includes("radshield_internal_dosimetry_sync_queue_v1"),
    detail: "DB_RECONSTRUCTION_RUNBOOK.md",
  },
];

const blocking = checks.filter((check) => !check.ok && check.name !== "Docker CLI" && check.name !== "MySQL CLI");
const report = {
  ok: blocking.length === 0,
  databaseUrlConfigured: Boolean(parsedDatabaseUrl),
  databaseTcpReachable,
  canRunDatabaseNow: Boolean(parsedDatabaseUrl) && databaseTcpReachable,
  localDbCommand: "docker compose -f docker-compose.db.yml up -d",
  databaseUrl: databaseUrl ? "configured" : "mysql://radshield:radshield@127.0.0.1:3306/radshield_mx_test",
  migrationCommands: [
    "npm run db:preflight",
    "npm run db:migrate",
    "npm run db:seed",
    "npm run db:validate:live",
    "npm run build:backend",
    "npm run test:backend:health",
  ],
  checks,
  blockedBy: checks.filter((check) => !check.ok).map((check) => check.name),
};

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exitCode = 1;
}
