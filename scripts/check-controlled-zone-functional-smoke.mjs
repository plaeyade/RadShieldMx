import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");

const files = {
  functionalTest: resolve(projectRoot, "src", "lib", "tests", "controlledZoneFunctionalFlow.test.ts"),
  floorPlanAdapter: resolve(projectRoot, "src", "lib", "controlledZoneFloorPlanAdapter.ts"),
  reportAdapter: resolve(projectRoot, "src", "lib", "controlledZoneReportAdapter.ts"),
  cnsnsReport: resolve(projectRoot, "src", "hooks", "useCNSNSReport.ts"),
  vitestConfig: resolve(projectRoot, "vitest.config.ts"),
};

function read(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file: ${path}`);
  }
  return readFileSync(path, "utf8");
}

const sources = Object.fromEntries(
  Object.entries(files).map(([name, path]) => [name, read(path)]),
);

const checks = [
  {
    name: "functional-test:layout",
    ok:
      sources.functionalTest.includes("generateControlledZoneFeasibility") &&
      sources.functionalTest.includes("bestOption.rooms.length"),
  },
  {
    name: "functional-test:calculation",
    ok:
      sources.functionalTest.includes("calculateControlledZoneShieldingPlan") &&
      sources.functionalTest.includes("analyticMemoryDraft"),
  },
  {
    name: "functional-test:canvas",
    ok:
      sources.functionalTest.includes("applyControlledZoneShieldingPlanToFloorPlan") &&
      sources.functionalTest.includes("addedBarriers"),
  },
  {
    name: "functional-test:report",
    ok:
      sources.functionalTest.includes("extractControlledZoneReportContext") &&
      sources.functionalTest.includes("generateCNSNSReport") &&
      sources.cnsnsReport.includes("3.1 ZONA CONTROLADA GENERADA DESDE FACTIBILIDAD"),
  },
  {
    name: "functional-test:export-import",
    ok:
      sources.functionalTest.includes("exportControlledZoneShieldingPlan") &&
      sources.functionalTest.includes("parseControlledZoneShieldingPlanJson") &&
      sources.functionalTest.includes("exportControlledZoneDbPersistenceDraft"),
  },
  {
    name: "functional-test:snapshot",
    ok:
      sources.functionalTest.includes("saveControlledZoneShieldingPlanSnapshot") &&
      sources.functionalTest.includes("loadControlledZoneShieldingPlanSnapshot"),
  },
  {
    name: "floorplan-adapter:generated-canvas-objects",
    ok:
      sources.floorPlanAdapter.includes("buildBarrier") &&
      sources.floorPlanAdapter.includes("buildControlledRegion") &&
      sources.floorPlanAdapter.includes("buildSource"),
  },
  {
    name: "report-adapter:controlled-zone-context",
    ok:
      sources.reportAdapter.includes("extractControlledZoneReportContext") &&
      sources.reportAdapter.includes("wallCount") &&
      sources.reportAdapter.includes("ceilingCount"),
  },
  {
    name: "vitest:outputs-excluded",
    ok: sources.vitestConfig.includes("'outputs/**'"),
  },
];

const failed = checks.filter((check) => !check.ok);
if (failed.length) {
  console.error(JSON.stringify({ ok: false, failed }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  checks: checks.map((check) => check.name),
  functionalTest: "src/lib/tests/controlledZoneFunctionalFlow.test.ts",
  databaseTouched: false,
}, null, 2));
