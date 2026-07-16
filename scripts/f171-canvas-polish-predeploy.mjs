import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f171_canvas_polish_predeploy');
const jsonPath = path.join(outDir, 'f171_canvas_polish_predeploy.json');
const mdPath = path.join(root, 'outputs', 'fase_171_canvas_polish_predeploy.md');
mkdirSync(outDir, { recursive: true });

function read(file) {
  return readFileSync(path.join(root, file), 'utf8');
}

const canvasArea = read('src/sections/CanvasArea.tsx');
const lib = read('src/lib/f171CanvasPolishPredeploy.ts');
const f170 = JSON.parse(read('outputs/f170_rag_citation_governance/f170_rag_citation_governance.json'));

const requiredCanvasTokens = [
  'f171-canvas-polish-predeploy',
  'buildF171CanvasPolishPredeploy',
  'f171-polish-${item.id}',
  'Canvas polish',
];

const requiredCapabilities = ['grips', 'dimensions', 'snap', 'selection', 'heatmap', 'properties', 'export'];
const tokenResults = requiredCanvasTokens.map((token) => ({ token, present: canvasArea.includes(token) || lib.includes(token) }));
const capabilityResults = requiredCapabilities.map((token) => ({ token, present: lib.includes(`id: '${token}'`) }));

const gates = {
  f170Ready: f170.status === 'rag-citation-governance-ready',
  f170NoWarnings: Array.isArray(f170.releaseWarnings) && f170.releaseWarnings.length === 0,
  canvasTokensPresent: tokenResults.every((item) => item.present),
  capabilitiesPresent: capabilityResults.every((item) => item.present),
  noFormulaChange: !canvasArea.includes('calculatePrimaryBarrier') && !lib.includes('calculatePrimaryBarrier'),
};

const status = Object.values(gates).every(Boolean)
  ? 'canvas-polish-predeploy-ready'
  : 'canvas-polish-predeploy-gated';

const output = {
  phase: 'F171',
  title: 'Canvas polish predeploy',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.canvas-polish-predeploy.f171.v1',
  status,
  gates,
  tokenResults,
  capabilityResults,
  f170: {
    status: f170.status,
    contentTier: f170.contentTier,
    canonicalCoverage: f170.db?.canonicalCoverage ?? [],
    releaseWarnings: f170.releaseWarnings ?? [],
  },
  implementedNow: [
    'Visible F171 canvas polish panel added to CanvasArea.',
    'Canvas readiness summarizes grips, cotas, snap, selection, heatmap, properties and export.',
    'Predeploy gate links canvas polish to F170 citation governance without changing calculations.',
  ],
  remainingBacklog: [
    'Dense editable isocontours with draggable labels.',
    'Cursor snap glyphs for endpoint, midpoint, perpendicular, intersection and angle locks.',
    'Manufacturer SVG/PNG equipment catalog with clearance/collision validation.',
    'Round-trip visual QA between 2D floorplan and 3D medical inspection.',
  ],
};

writeFileSync(jsonPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, [
  '# F171 - Canvas Polish Predeploy',
  '',
  `Generado: ${output.generatedAt}`,
  `Estado: **${output.status}**`,
  '',
  '## Gates',
  '',
  ...Object.entries(gates).map(([key, value]) => `- ${key}: ${value ? 'OK' : 'FAIL'}`),
  '',
  '## Implementado',
  '',
  ...output.implementedNow.map((item) => `- ${item}`),
  '',
  '## Backlog controlado',
  '',
  ...output.remainingBacklog.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F171 canvas polish predeploy ${status}.`);
if (status !== 'canvas-polish-predeploy-ready') process.exit(1);
