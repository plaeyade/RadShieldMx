import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f173_canvas_low_risk_polish');
const jsonPath = path.join(outDir, 'f173_canvas_low_risk_polish.json');
const mdPath = path.join(root, 'outputs', 'fase_173_canvas_low_risk_polish.md');
mkdirSync(outDir, { recursive: true });

const read = (file) => readFileSync(path.join(root, file), 'utf8');
const canvas = read('src/sections/CanvasArea.tsx');
const lib = read('src/lib/f173CanvasLowRiskPolish.ts');
const f172 = JSON.parse(read('outputs/f172_release_candidate_final/f172_release_candidate_final.json'));

const requiredSignals = ['selection', 'snap', 'objects', 'evidence', 'heatmap', 'export'];
const gates = {
  f172ControlledReady: ['controlled-offline-ready', 'public-deploy-ready'].includes(f172.status),
  canvasHudPresent: canvas.includes('f173-canvas-hud'),
  signalTokensPresent: requiredSignals.every((signal) => lib.includes(`id: '${signal}'`)),
  noCalculationChange: !lib.includes('calculate') && !canvas.includes('F173 changes calculation'),
};

const status = Object.values(gates).every(Boolean) ? 'canvas-low-risk-polish-ready' : 'canvas-low-risk-polish-gated';
const output = {
  phase: 'F173',
  title: 'Canvas low-risk polish',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.canvas-low-risk-polish.f173.v1',
  status,
  gates,
  signals: requiredSignals,
  releaseGuardrails: [
    'No formulas, material constants or regulatory limits changed.',
    'HUD only: selection, snap, object counts, evidence, heatmap and export readiness.',
    'Designed for local visual smoke before deploy target retry.',
  ],
  nextPhases: [
    'F174 deploy target retry + F154-F158 against final URL.',
    'F175 final handoff package and operator checklist.',
  ],
};

writeFileSync(jsonPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, [
  '# F173 - Canvas Low-Risk Polish',
  '',
  `Generado: ${output.generatedAt}`,
  `Estado: **${output.status}**`,
  '',
  '## Gates',
  '',
  ...Object.entries(gates).map(([key, value]) => `- ${key}: ${value ? 'OK' : 'FAIL'}`),
  '',
  '## Senales HUD',
  '',
  ...requiredSignals.map((signal) => `- ${signal}`),
  '',
  '## Guardrails',
  '',
  ...output.releaseGuardrails.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F173 canvas low-risk polish ${status}.`);
if (status !== 'canvas-low-risk-polish-ready') process.exit(1);
