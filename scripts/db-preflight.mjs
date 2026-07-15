import "dotenv/config";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function commandExists(command) {
  const lookup = process.platform === "win32" ? "where" : "command";
  const args = process.platform === "win32" ? [command] : ["-v", command];
  const result = spawnSync(lookup, args, { stdio: "ignore", shell: process.platform !== "win32" });
  return result.status === 0;
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
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

const databaseUrl = process.env.DATABASE_URL ?? "";
const parsed = parseDatabaseUrl(databaseUrl);
const dockerAvailable = commandExists("docker");
const mysqlCliAvailable = commandExists("mysql");
const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const dosimetryMigrationPath = resolve(projectRoot, "db/migrations/0001_optimal_yellowjacket.sql");
const workflowMigrationPath = resolve(projectRoot, "db/migrations/0002_safe_gideon.sql");
const dosimetryMigrationSql = existsSync(dosimetryMigrationPath)
  ? readFileSync(dosimetryMigrationPath, "utf8")
  : "";
const workflowMigrationSql = existsSync(workflowMigrationPath)
  ? readFileSync(workflowMigrationPath, "utf8")
  : "";
const requiredDosimetryTables = [
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
const missingDosimetryTables = requiredDosimetryTables.filter(
  (tableName) => !dosimetryMigrationSql.includes(`\`${tableName}\``),
);
const missingWorkflowTables = requiredWorkflowTables.filter(
  (tableName) => !workflowMigrationSql.includes(`\`${tableName}\``),
);

const checks = [
  { name: "Node runtime", ok: true, detail: process.version },
  { name: "Docker CLI", ok: dockerAvailable, detail: dockerAvailable ? "available" : "not found in PATH" },
  { name: "MySQL CLI", ok: mysqlCliAvailable, detail: mysqlCliAvailable ? "available" : "not found in PATH" },
  { name: "DATABASE_URL", ok: Boolean(parsed), detail: parsed ? `${parsed.username}@${parsed.host}:${parsed.port}/${parsed.database}` : "missing or invalid" },
  {
    name: "F50 dosimetry migration",
    ok: existsSync(dosimetryMigrationPath) && missingDosimetryTables.length === 0,
    detail: missingDosimetryTables.length > 0
      ? `missing tables: ${missingDosimetryTables.join(", ")}`
      : "0001 dosimetry migration present",
  },
  {
    name: "F69/F70 workflow migration",
    ok: existsSync(workflowMigrationPath) && missingWorkflowTables.length === 0,
    detail: missingWorkflowTables.length > 0
      ? `missing tables: ${missingWorkflowTables.join(", ")}`
      : "0002 workflow migration present",
  },
];

if (parsed) {
  checks.push({
    name: "DATABASE_URL dialect",
    ok: parsed.protocol === "mysql:",
    detail: parsed.protocol,
  });
  checks.push({
    name: "Database TCP reachability",
    ok: await checkTcp(parsed.host, parsed.port),
    detail: `${parsed.host}:${parsed.port}`,
  });
}

const report = {
  ok: Boolean(parsed) && checks.every((check) => check.ok || ["Docker CLI", "MySQL CLI"].includes(check.name)),
  checks,
  nextSteps: [],
};

if (!dockerAvailable && !parsed) {
  report.nextSteps.push("Install/start Docker Desktop or provide an existing local/test MySQL DATABASE_URL.");
  report.nextSteps.push("Run: npm run db:reconstruct:plan");
}
if (dockerAvailable && !parsed) {
  report.nextSteps.push("Run: npm run db:reconstruct:plan");
  report.nextSteps.push("Run: docker compose -f docker-compose.db.yml up -d");
  report.nextSteps.push("Set: DATABASE_URL=mysql://radshield:radshield@127.0.0.1:3306/radshield_mx_test");
}
if (parsed) {
  report.nextSteps.push("Run: npm run db:reconstruct:plan");
  report.nextSteps.push("Run: npm run db:migrate");
  report.nextSteps.push("Run: npm run db:seed");
  report.nextSteps.push("Run: npm run test:backend:health");
}

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exitCode = 1;
}
