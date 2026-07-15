import { existsSync, readdirSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const projectRoot = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const outputDir = resolve(projectRoot, "outputs");

function pathOf(...parts) {
  return resolve(projectRoot, ...parts);
}

function read(...parts) {
  const file = pathOf(...parts);
  if (!existsSync(file)) throw new Error(`Missing required file: ${file}`);
  return readFileSync(file, "utf8");
}

function walk(dir, accept, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", "dist", "outputs", ".git"].includes(entry.name)) walk(full, accept, files);
      continue;
    }
    if (accept(full)) files.push(full);
  }
  return files;
}

function assertCheck(name, ok, details = {}) {
  return { name, ok: Boolean(ok), ...details };
}

function extractBlock(text, marker) {
  const start = text.indexOf(marker);
  if (start === -1) return "";
  const open = text.indexOf("[", start);
  if (open === -1) return "";
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "[") depth += 1;
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return "";
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

await mkdir(outputDir, { recursive: true });

const toolbar = read("src", "sections", "Toolbar.tsx");
const sidebar = read("src", "sections", "Sidebar.tsx");
const designer = read("src", "pages", "ShieldingDesigner.tsx");
const appStore = read("src", "stores", "appStore.ts");
const cnsnsReport = read("src", "hooks", "useCNSNSReport.ts");
const controlledZoneCalc = read("src", "lib", "controlledZoneCalculationAdapter.ts");
const sourceManager = read("src", "hooks", "useSourceManager.ts");
const canvasArea = read("src", "sections", "CanvasArea.tsx");

const dialogBlock = extractBlock(appStore, "const DIALOG_NAMES");
const dialogNames = new Set([...dialogBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]));

const toolbarItemHandlers = unique([...toolbar.matchAll(/<SmartItem[\s\S]*?onClick=\{([^}]+)\}/g)].map((match) => match[1].trim()));
const toolbarPropNames = unique([...toolbar.matchAll(/\b(on[A-Z][A-Za-z0-9]+)\??:/g)].map((match) => match[1]));
const designerToolbarProps = unique([...designer.matchAll(/\b(on[A-Z][A-Za-z0-9]+)=\{/g)].map((match) => match[1]));
const localToolbarHandlers = new Set([
  ...toolbarPropNames,
  ...unique([...toolbar.matchAll(/\bconst\s+(on[A-Z][A-Za-z0-9]+)\s*=/g)].map((match) => match[1])),
]);

const missingToolbarProps = toolbarItemHandlers.filter((handler) => /^on[A-Z]/.test(handler) && !localToolbarHandlers.has(handler));
const usedPropHandlers = toolbarItemHandlers.filter((handler) => toolbarPropNames.includes(handler));
const missingDesignerConnections = usedPropHandlers.filter((handler) => !designerToolbarProps.includes(handler));

const sidebarDialogIds = unique([...sidebar.matchAll(/dialog:\s*'([^']+)'/g)].map((match) => match[1]));
const missingSidebarDialogs = sidebarDialogIds.filter((name) => !dialogNames.has(name));

const sourceFiles = walk(pathOf("src"), (file) => /\.(ts|tsx)$/.test(file));
const sourceCorpus = sourceFiles.map((file) => readFileSync(file, "utf8")).join("\n");

const requiredTraceability = [
  {
    name: "calculation:ncrp147-main-canvas-results",
    ok:
      designer.includes("calculateAllBarriers") &&
      designer.includes("runCalculations") &&
      canvasArea.includes("Resultados") &&
      canvasArea.includes("NCRP 147"),
    evidence: ["runCalculations", "calculateAllBarriers", "CanvasArea NCRP 147 results"],
  },
  {
    name: "calculation:async-radshield-engine",
    ok:
      designer.includes("runRadShieldCalculations") &&
      designer.includes("asyncEngineRef") &&
      designer.includes("persistCalculationResults"),
    evidence: ["runRadShieldCalculations", "AsyncEngine", "backend persistence non-blocking"],
  },
  {
    name: "memory:cnsns-analytic-report-standards",
    ok:
      cnsnsReport.includes("memoria analitica") &&
      cnsnsReport.includes("NCRP Report 147") &&
      cnsnsReport.includes("NCRP Report 151") &&
      cnsnsReport.includes("AAPM TG 108") &&
      cnsnsReport.includes("IAEA SRS 47"),
    evidence: ["useCNSNSReport", "NCRP 147/151", "AAPM TG 108", "IAEA SRS 47"],
  },
  {
    name: "controlled-zone:calculation-family-routing",
    ok:
      controlledZoneCalc.includes("NCRP151-primary") &&
      controlledZoneCalc.includes("NCRP151-secondary") &&
      controlledZoneCalc.includes("TG108-PETCT") &&
      controlledZoneCalc.includes("Criterio CNSNS"),
    evidence: ["controlledZoneCalculationAdapter", "NCRP151", "TG108", "CNSNS"],
  },
  {
    name: "sources:standard-routing",
    ok:
      sourceManager.includes("NCRP") &&
      sourceManager.includes("IAEA") &&
      sourceManager.includes("CNSNS") &&
      sourceManager.includes("AAPM"),
    evidence: ["useSourceManager maps sources to standards"],
  },
  {
    name: "canvas:buttons-contract",
    ok:
      canvasArea.includes("Lineas 0.3m") &&
      canvasArea.includes("Puntos") &&
      canvasArea.includes("Maximos") &&
      canvasArea.includes("Zoom to fit") &&
      canvasArea.includes("Toggle snap") &&
      canvasArea.includes("Export PNG") &&
      canvasArea.includes("onRunCalculations"),
    evidence: ["overlay toggles", "zoom", "snap", "png export", "canvas calculation button"],
  },
];

const normativePatterns = [
  { id: "NCRP-147", regex: /NCRP(?: Report)?\s*(?:No\.\s*)?147|NCRP-147/i },
  { id: "NCRP-151", regex: /NCRP(?: Report)?\s*(?:No\.\s*)?151|NCRP-151/i },
  { id: "IAEA-OIEA", regex: /IAEA|OIEA|Safety Reports Series|SRS\s*47/i },
  { id: "IAEA-SSG-SSR", regex: /SSG-?98|SSG-?46|SSR-?6/i },
  { id: "UAQ", regex: /UAQ|Universidad Autonoma de Queretaro|Gonz[aá]lez Aguilar/i },
  { id: "CNSNS", regex: /CNSNS|NOM-0(?:08|12|40)-NUCL/i },
  { id: "AAPM-TG108", regex: /AAPM\s*TG\s*-?\s*108|TG108|TG-108/i },
  { id: "IPEM-109", regex: /IPEM\s*(?:Report)?\s*109|IPEM-109/i },
];

const normativeCoverage = normativePatterns.map((pattern) => ({
  id: pattern.id,
  ok: pattern.regex.test(sourceCorpus),
  hits: (sourceCorpus.match(new RegExp(pattern.regex.source, "gi")) || []).length,
}));

const menuGroups = {
  Archivo: ["onNewProject", "onProjects", "onSaveProject", "onBatchImport", "onDXFViewer", "onSTEPImporter", "onExport", "onPDF", "onCNSNS"],
  Diseno: ["on3D", "onMedicalFloorPlan3D", "onDXFViewer", "onPointCloud", "onAutoBarrier", "onShapesReconstruction", "onRealTime3D"],
  Calcular: ["onCalculate", "onShieldingCalculator", "onEquipmentShieldingWizard", "onQuick", "onFloorCeiling", "onCostOptimizer", "onNCRPValidation"],
  Fisica: ["onMonteCarlo", "onMonteCarloSim", "onNeutronShielding", "onPHITSGenerator", "onDCHAINCalc", "onCADToMC", "onJENDL5Viewer"],
  "Med. Nuclear": ["onGammaKnife", "onBraquiCo60", "onCBCTIGRT", "onAAPMTG108PET", "onIPEM109", "onTherapyDosimetry"],
  Normativa: ["onInternationalRegulations", "onRegulatoryComparison", "onComplianceCertification", "onCNSNSReport", "onNCRP151Detail", "onNCRPValidation"],
  Reportes: ["onDashboard", "onCostDashboard", "onCNSNSReportChecklist", "onEvidencePack"],
  Herramientas: ["onAIShielding", "onAutoFillEquipo", "onCloudSync", "onDICOMRTSTRUCT", "onCNSNSDigital", "onEmergency"],
  Eficiencia: ["onPerformanceDashboard", "onCADGeometryConverter", "onDesignAgent", "onPerformanceRecommendations", "onNCRPValidation"],
};

const menuGroupCoverage = Object.entries(menuGroups).map(([group, handlers]) => {
  const missing = handlers.filter((handler) => !toolbarItemHandlers.includes(handler));
  return assertCheck(`menu-group:${group}`, missing.length === 0, { missing });
});

const checks = [
  assertCheck("toolbar:smart-items-have-local-handlers", missingToolbarProps.length === 0, {
    checked: toolbarItemHandlers.length,
    missing: missingToolbarProps,
  }),
  assertCheck("toolbar:props-connected-from-shielding-designer", missingDesignerConnections.length === 0, {
    checked: usedPropHandlers.length,
    missing: missingDesignerConnections,
  }),
  assertCheck("sidebar:dialog-ids-exist-in-app-store", missingSidebarDialogs.length === 0, {
    checked: sidebarDialogIds.length,
    missing: missingSidebarDialogs,
  }),
  ...menuGroupCoverage,
  ...requiredTraceability.map((item) => assertCheck(item.name, item.ok, { evidence: item.evidence })),
  assertCheck("normative:coverage-required-families", normativeCoverage.every((item) => item.ok), { normativeCoverage }),
];

const failed = checks.filter((check) => !check.ok);
const output = {
  ok: failed.length === 0,
  checkedAt: new Date().toISOString(),
  summary: {
    toolbarItemHandlers: toolbarItemHandlers.length,
    toolbarProps: toolbarPropNames.length,
    designerToolbarProps: designerToolbarProps.length,
    sidebarDialogIds: sidebarDialogIds.length,
    sourceFiles: sourceFiles.length,
  },
  normativeCoverage,
  checks,
  failed,
  databaseTouched: false,
};

await writeFile(resolve(outputDir, "f69_menu_logic_contracts.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify(output, null, 2));

if (!output.ok) process.exitCode = 1;
