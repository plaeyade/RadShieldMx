import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");

const requiredTables = [
  "controlled_zone_plans",
  "controlled_zone_calculations",
  "analytic_memory_snapshots",
  "project_report_exports",
];

const files = {
  migration: resolve(projectRoot, "db", "migrations", "0002_safe_gideon.sql"),
  router: resolve(projectRoot, "api", "controlled-zone-router.ts"),
  mapper: resolve(projectRoot, "api", "controlled-zone-persistence.ts"),
  adapter: resolve(projectRoot, "src", "lib", "controlledZoneCalculationAdapter.ts"),
  ui: resolve(projectRoot, "src", "sections", "dialogs", "LayoutBunkerDialog.tsx"),
  smokeTest: resolve(projectRoot, "src", "lib", "__tests__", "controlledZonePersistenceSmoke.test.ts"),
};

function read(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file: ${path}`);
  }
  return readFileSync(path, "utf8");
}

const migrationSql = read(files.migration);
const routerSource = read(files.router);
const mapperSource = read(files.mapper);
const adapterSource = read(files.adapter);
const uiSource = read(files.ui);
const smokeTestSource = read(files.smokeTest);

const staticChecks = [
  ...requiredTables.map((table) => ({
    name: `migration:${table}`,
    ok: migrationSql.includes(`\`${table}\``),
  })),
  ...["persistDraft", "listPlans", "getPlan"].map((route) => ({
    name: `router:${route}`,
    ok: routerSource.includes(route),
  })),
  {
    name: "mapper:insertBundle",
    ok:
      mapperSource.includes("buildControlledZoneDbInsertBundle") &&
      mapperSource.includes("controlledZonePlans") === false &&
      mapperSource.includes("JSON.stringify(draft.plan.profile)") &&
      mapperSource.includes("analyticMemorySnapshot"),
  },
  {
    name: "adapter:dbDraft",
    ok:
      adapterSource.includes("buildControlledZoneDbPersistenceDraft") &&
      adapterSource.includes("radshield-controlled-zone-db-draft-v1") &&
      adapterSource.includes("plan.calculations.map"),
  },
  {
    name: "ui:Guardar DB",
    ok: uiSource.includes("Guardar DB") && uiSource.includes("buildControlledZoneDbPersistenceDraft"),
  },
  {
    name: "test:controlledZonePersistenceSmoke",
    ok:
      smokeTestSource.includes("buildControlledZoneDbInsertBundle") &&
      smokeTestSource.includes("calculateControlledZoneShieldingPlan") &&
      smokeTestSource.includes("smoke-project"),
  },
];

const failed = staticChecks.filter((check) => !check.ok);
if (failed.length) {
  console.error(JSON.stringify({ ok: false, failed }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  staticChecks: staticChecks.map((check) => check.name),
  smokeTest: "src/lib/__tests__/controlledZonePersistenceSmoke.test.ts",
  databaseTouched: false,
}, null, 2));
