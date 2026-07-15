import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const checks = [];
const record = (name, ok, detail = '') => checks.push({ name, ok, detail });
const includesAll = (text, tokens) => tokens.every((token) => text.includes(token));

const canvas = read('src/sections/CanvasArea.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');
const connector = read('src/sections/dialogs/ExternalConnectorDialog.tsx');
const toolbar = read('src/sections/Toolbar.tsx');
const sidebar = read('src/sections/Sidebar.tsx');
const store = read('src/stores/appStore.ts');

const canvasButtons = [
  'Importar plano',
  'Smart rooms',
  'Capas del canvas',
  'Puntos de control',
  'Visor 3D',
  'Medical 3D Floor Plan',
  'Dose map 3D',
  'Monte Carlo',
  'Conexiones externas',
  'Evidence pack',
];

record(
  'canvas shortcut buttons',
  includesAll(canvas, canvasButtons.map((label) => `aria-label="${label}"`)),
  canvasButtons.filter((label) => !canvas.includes(`aria-label="${label}"`)).join(', ')
);

const canvasCallbacks = [
  'onOpenLayers',
  'onOpenRoomTemplates',
  'onOpen3DViewer',
  'onOpenDoseMap3D',
  'onOpenMonteCarlo',
  'onOpenExternalConnector',
  'onOpenEvidencePack',
  'onOpenMedical3D',
  'onOpenControlPoints',
];

record(
  'ShieldingDesigner wires canvas shortcuts',
  includesAll(designer, canvasCallbacks),
  canvasCallbacks.filter((token) => !designer.includes(token)).join(', ')
);

const externalConnectors = [
  "id: 'rayxpert'",
  "website: 'https://www.rayxpert.com/en/'",
  'Dose mapping benchmark',
  'Validation folder cross-check',
  "id: 'mosaicatomics'",
  "website: 'https://www.mosaicatomics.com/'",
  'Barrier assumption review',
  'Control point checklist',
  "category: 'Optimization'",
  'grid-cols-5',
  'value="optimization"',
];

record(
  'RayXpert and Mosaic connector entries',
  includesAll(connector, externalConnectors),
  externalConnectors.filter((token) => !connector.includes(token)).join(', ')
);

const requiredDialogs = [
  'viewer3d',
  'medicalFloorPlan3D',
  'spatialDoseMap',
  'monteCarloIntegration',
  'externalConnector',
  'evidencePack',
];

record(
  'store contains external/floorplan workflow dialogs',
  includesAll(store, requiredDialogs),
  requiredDialogs.filter((token) => !store.includes(token)).join(', ')
);

const menuLogicTokens = [
  'onMedicalFloorPlan3D',
  'onExternalSoftware',
  'onMonteCarlo',
  'onControlPoints',
  'onEvidencePack',
  'onDXFViewer',
  'onSTEPImporter',
  'onCADToMC',
  'onDoseMap',
];

record(
  'toolbar exposes floorplan/3D/MC/external workflow',
  includesAll(toolbar, menuLogicTokens),
  menuLogicTokens.filter((token) => !toolbar.includes(token)).join(', ')
);

const sidebarTokens = [
  'quickBarrier',
  'floorCeiling',
  'neutron',
  'geant4Mc',
  'dxf',
  'viewer3d',
  'projects',
  'medicalFloorPlan3D',
];

record(
  'sidebar keeps shielding methodology lanes',
  includesAll(sidebar, sidebarTokens),
  sidebarTokens.filter((token) => !sidebar.includes(token)).join(', ')
);

const competitiveCoverage = {
  mosaic: [
    'NCRP',
    'TG 108',
    'controlPoints',
    'EvidencePackDialog',
    'airKerma',
    'mosaicProjectManager',
  ],
  rayxpert: [
    'cadToMC',
    'spatialDoseMap',
    'monteCarloIntegration',
    'medicalFloorPlan3D',
    'neutronShielding',
    'experimentalValidation',
  ],
};

record(
  'Mosaic workflow concepts are represented',
  includesAll(`${designer}\n${store}\n${toolbar}`, competitiveCoverage.mosaic),
  competitiveCoverage.mosaic.filter((token) => !`${designer}\n${store}\n${toolbar}`.includes(token)).join(', ')
);

record(
  'RayXpert workflow concepts are represented',
  includesAll(`${designer}\n${store}\n${toolbar}`, competitiveCoverage.rayxpert),
  competitiveCoverage.rayxpert.filter((token) => !`${designer}\n${store}\n${toolbar}`.includes(token)).join(', ')
);

const report = {
  phase: 'F70 competitive UI contracts',
  generatedAt: new Date().toISOString(),
  checks,
  passed: checks.filter((c) => c.ok).length,
  failed: checks.filter((c) => !c.ok),
};

const outDir = path.join(root, 'outputs');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'f70_competitive_ui_contracts.json'), JSON.stringify(report, null, 2));

if (report.failed.length > 0) {
  console.error(JSON.stringify(report.failed, null, 2));
  process.exit(1);
}

console.log(`F70 competitive UI contracts OK (${report.passed}/${checks.length})`);
