import { readFileSync, writeFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const files = {
  equipmentVisuals: read("src/lib/equipmentVisuals.ts"),
  canvasRenderer: read("src/lib/canvas/CanvasRenderer.ts"),
  sceneBuilder: read("src/lib/medical3D/sceneBuilder.ts"),
  medical3d: read("src/sections/dialogs/MedicalFloorPlan3DDialog.tsx"),
  cadCapabilities: read("src/lib/cadImportCapabilities.ts"),
  ragPlan: read("src/lib/rag/ragImprovementPlan.ts"),
  canvasSmoke: read("scripts/check-f69-canvas-buttons-smoke.mjs"),
  packageJson: read("package.json"),
};

const checks = [
  {
    name: "equipment:visual-profiles-cover-clinical-sources",
    ok: ["linac", "gammaKnife", "petct", "ct", "hdr", "cyclotron", "spect", "mammography"].every((token) =>
      files.equipmentVisuals.includes(token),
    ),
  },
  {
    name: "canvas:source-renderer-uses-equipment-icons-and-footprints",
    ok:
      files.canvasRenderer.includes("getEquipmentVisualProfile") &&
      files.canvasRenderer.includes("drawEquipmentFootprint") &&
      files.canvasRenderer.includes("drawEquipmentIcon") &&
      files.canvasRenderer.includes("profile.shortLabel"),
  },
  {
    name: "medical3d:scene-carries-equipment-footprint-assets-rag-tags",
    ok:
      files.sceneBuilder.includes("footprint_m") &&
      files.sceneBuilder.includes("assetHint") &&
      files.sceneBuilder.includes("ragTags") &&
      files.medical3d.includes("scaleX") &&
      files.medical3d.includes("assetHint"),
  },
  {
    name: "cad:dwg-is-external-conversion-not-fake-native",
    ok:
      files.cadCapabilities.includes("format: 'dwg'") &&
      files.cadCapabilities.includes("external-conversion") &&
      files.cadCapabilities.includes("AutoCAD") &&
      files.cadCapabilities.includes("LibreDWG"),
  },
  {
    name: "cad:svg-png-overlays-are-supported",
    ok:
      files.cadCapabilities.includes("format: 'svg'") &&
      files.cadCapabilities.includes("format: 'png'") &&
      files.cadCapabilities.includes("reference-overlay"),
  },
  {
    name: "rag:improvement-plan-has-immediate-deep-dive-items",
    ok:
      files.ragPlan.includes("hybrid-search") &&
      files.ragPlan.includes("citation-ledger") &&
      files.ragPlan.includes("regulatory-rerank") &&
      files.ragPlan.includes("deep-dive-queries") &&
      files.ragPlan.includes("external-browser-connector"),
  },
  {
    name: "canvas:button-smoke-remains-available",
    ok:
      files.canvasSmoke.includes("tool:source") &&
      files.canvasSmoke.includes("floating:zoom-to-fit") &&
      files.canvasSmoke.includes("canvas:bottom-calculate-button"),
  },
  {
    name: "package:f72-contract-script-registered",
    ok: files.packageJson.includes("test:f72:rag-dwg-canvas3d"),
  },
];

const failed = checks.filter((check) => !check.ok);
const output = {
  ok: failed.length === 0,
  phase: "F72",
  checks,
  failed,
  databaseTouched: false,
};

writeFileSync("outputs/f72_rag_dwg_canvas3d_contracts.json", `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (!output.ok) process.exitCode = 1;
