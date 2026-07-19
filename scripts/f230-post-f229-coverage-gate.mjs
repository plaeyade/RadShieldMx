import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f230_post_f229_coverage_gate');
const jsonPath = path.join(outDir, 'f230_post_f229_coverage_gate.json');
const mdPath = path.join(root, 'outputs', 'fase_230_post_f229_coverage_gate.md');

function readJson(relPath) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function read(relPath) {
  const fullPath = path.join(root, relPath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
}

const f198 = readJson('outputs/f198_full_menu_function_smoke_result.json');
const f207 = readJson('outputs/f207_functional_app_qa_smoke_result.json');
const f229 = readJson('outputs/f229_canvas_cad_e2e_harness/f229_canvas_cad_e2e_harness.json');
const f200 = readJson('outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json');

const docsText = [
  read('CHANGELOG.md'),
  read('MANUAL_USUARIO_v99.md'),
  read('MANUAL_VERSIONES_v50.md'),
  read('CONTROL_DE_CAMBIOS_v99.md'),
  read('public/manual_usuario.html'),
  read(path.join('src', 'sections', 'dialogs', 'UpdateAppDialog.tsx')),
].join('\n');

const gates = [
  {
    id: 'f198-menus-buttons',
    label: 'Menus y botones canonicos',
    pass: f198?.ok === true,
    evidence: 'outputs/f198_full_menu_function_smoke_result.json',
    detail: f198 ? `${(f198.checks ?? []).filter((check) => check.ok).length}/${(f198.checks ?? []).length} checks` : 'missing',
  },
  {
    id: 'f207-functional-app',
    label: 'Flujo funcional app/canvas/reportes',
    pass: f207?.status === 'functional-app-qa-pass',
    evidence: 'outputs/f207_functional_app_qa_smoke_result.json',
    detail: f207 ? `${(f207.checks ?? []).filter((check) => check.ok).length}/${(f207.checks ?? []).length} checks` : 'missing',
  },
  {
    id: 'f229-canvas-e2e',
    label: 'Canvas CAD E2E dedicado',
    pass: f229?.status === 'canvas-cad-e2e-harness-ready',
    evidence: 'outputs/f229_canvas_cad_e2e_harness/f229_canvas_cad_e2e_harness.json',
    detail: f229 ? `${(f229.checks ?? []).filter((check) => check.ready).length}/${(f229.checks ?? []).length} checks` : 'missing',
  },
  {
    id: 'f200-static-release',
    label: 'Release frontend estatico',
    pass: f200?.status === 'static-frontend-release-ready',
    evidence: 'outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json',
    detail: f200 ? `${(f200.gates ?? []).filter((gate) => gate.status === 'pass').length}/${(f200.gates ?? []).length} gates` : 'missing',
  },
  {
    id: 'docs-current',
    label: 'Documentacion y Update Center',
    pass: ['F230', 'post-f229', 'renderer/eventos', 'manual_usuario.html'].every((token) => docsText.includes(token)),
    evidence: 'CHANGELOG.md, MANUAL_USUARIO_v99.md, MANUAL_VERSIONES_v50.md, CONTROL_DE_CAMBIOS_v99.md, public/manual_usuario.html, UpdateAppDialog.tsx',
    detail: 'tokens F230/post-f229/renderer-eventos/manual HTML',
  },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `${gate.id}: ${gate.label}`);
const status = blockers.length === 0 ? 'post-f229-coverage-ready' : 'post-f229-coverage-gated';

const payload = {
  schema: 'radshield-mx.f230.post-f229-coverage-gate.v1',
  phase: 'F230',
  generatedAt: new Date().toISOString(),
  status,
  gates,
  blockers,
  rendererBaseDecision:
    status === 'post-f229-coverage-ready'
      ? 'Permitido iniciar cambios incrementales en renderer base/event controller solo con feature flag, rollback y repeticion de F198/F207/F229/F200.'
      : 'Bloqueado modificar renderer base o logica de eventos hasta cerrar todos los gates post-F229.',
  requiredBeforeRendererEvents: [
    'F198 menus/buttons smoke pass',
    'F207 functional app QA pass',
    'F229 canvas CAD E2E pass',
    'F200 static release gate pass',
    'Update Center/manuales/changelog/control de cambios/manual HTML actualizados',
  ],
  remainingCoverageAfterF229: [
    'F231 pixel-diff visual desktop/mobile del canvas',
    'F232 fixture DXF/DWG dedicado dentro del E2E CAD',
    'F233 grip drag/snap target por coordenadas exactas',
    'F234 isocontornos numericos con etiquetas y leyenda regulatoria exportable',
    'F235 sincronizacion bidireccional 2D/3D con hashes de escena',
    'F236 post-deploy public URL smoke F154-F158',
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

const markdown = [
  '# F230 - Post-F229 Coverage Gate',
  '',
  `Estado: **${payload.status}**`,
  '',
  '## Decision renderer/eventos',
  '',
  payload.rendererBaseDecision,
  '',
  '## Gates',
  '',
  ...payload.gates.map((gate) => `- ${gate.pass ? 'PASS' : 'FAIL'} ${gate.id}: ${gate.label} (${gate.detail}) - ${gate.evidence}`),
  '',
  '## Requerido antes de tocar renderer base/eventos',
  '',
  ...payload.requiredBeforeRendererEvents.map((item) => `- ${item}`),
  '',
  '## Cobertura pendiente despues de F229',
  '',
  ...payload.remainingCoverageAfterF229.map((item) => `- ${item}`),
  '',
].join('\n');

fs.writeFileSync(mdPath, markdown, 'utf8');

console.log(JSON.stringify({ status, blockers, gates: gates.map((gate) => `${gate.id}:${gate.pass ? 'pass' : 'fail'}`) }, null, 2));
if (status !== 'post-f229-coverage-ready') process.exit(1);
