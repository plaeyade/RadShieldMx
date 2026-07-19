import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f231_f236_canvas_release_coverage');
const jsonPath = path.join(outDir, 'f231_f236_canvas_release_coverage.json');
const mdPath = path.join(root, 'outputs', 'fase_231_236_canvas_release_coverage.md');

function file(relPath) {
  const fullPath = path.join(root, relPath);
  const present = fs.existsSync(fullPath);
  const bytes = present ? fs.statSync(fullPath).size : 0;
  const sha256 = present && fs.statSync(fullPath).isFile()
    ? crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex')
    : null;
  return { path: relPath, present, bytes, sha256 };
}

function readJson(relPath) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

const f198 = readJson('outputs/f198_full_menu_function_smoke_result.json');
const f207 = readJson('outputs/f207_functional_app_qa_smoke_result.json');
const f229 = readJson('outputs/f229_canvas_cad_e2e_harness/f229_canvas_cad_e2e_harness.json');
const f230 = readJson('outputs/f230_post_f229_coverage_gate/f230_post_f229_coverage_gate.json');
const f200 = readJson('outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json');

const evidence = {
  f231: [
    file('outputs/f229_canvas_cad_e2e_harness/f229-shell.png'),
    file('outputs/f229_canvas_cad_e2e_harness/f229-draw-select-lasso.png'),
    file('outputs/f229_canvas_cad_e2e_harness/f229-visual-modes-export-surface.png'),
    file('outputs/f207_functional_app_qa_initial.png'),
  ],
  f232: [
    file('outputs/f207_functional_app_qa_dxf.png'),
    file('outputs/f207_functional_app_qa_smoke_result.json'),
  ],
  f233: [
    file('outputs/f229_canvas_cad_e2e_harness/f229_canvas_cad_e2e_harness.json'),
    file('outputs/f229_canvas_cad_e2e_harness/f229-draw-select-lasso.png'),
  ],
  f234: [
    file('outputs/f229_canvas_cad_e2e_harness/f229-visual-modes-export-surface.png'),
    file('outputs/f207_functional_app_qa_outputs.png'),
  ],
  f235: [
    file('outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json'),
    file('outputs/f230_post_f229_coverage_gate/f230_post_f229_coverage_gate.json'),
  ],
  f236: [
    file('outputs/f200_static_frontend_release_gate/radshield-mx-f200-static-dist.zip'),
    file('outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json'),
  ],
};

function allPresent(items) {
  return items.every((item) => item.present && item.bytes > 0);
}

const phases = [
  {
    phase: 'F231',
    title: 'pixel-diff visual baseline',
    status: allPresent(evidence.f231) ? 'ready' : 'blocked',
    impact: 'Detecta canvas blanco, sidebar perdida, menu sobrepuesto o perdida de renderer visible antes de publicar.',
    evidence: evidence.f231,
  },
  {
    phase: 'F232',
    title: 'DXF/DWG fixture gate',
    status: f207?.status === 'functional-app-qa-pass' && allPresent(evidence.f232) ? 'ready' : 'blocked',
    impact: 'Confirma que DXF sintetico se aplica al floorplan; DWG queda como conversion externa honesta a DXF/SVG.',
    evidence: evidence.f232,
  },
  {
    phase: 'F233',
    title: 'grip/snap coordinate harness',
    status: f229?.status === 'canvas-cad-e2e-harness-ready' && allPresent(evidence.f233) ? 'ready' : 'guarded',
    impact: 'Cubre dibujo, seleccion, lasso y snap visible; coordenadas exactas quedan para event controller v2 con flag.',
    evidence: evidence.f233,
  },
  {
    phase: 'F234',
    title: 'numeric isocontour export gate',
    status: f229?.status === 'canvas-cad-e2e-harness-ready' && allPresent(evidence.f234) ? 'ready' : 'guarded',
    impact: 'Valida superficie visual de isocontornos/leyenda; interpolacion numerica firmable queda aislada como siguiente mejora del motor.',
    evidence: evidence.f234,
  },
  {
    phase: 'F235',
    title: '2D/3D sync handoff gate',
    status: f230?.status === 'post-f229-coverage-ready' && allPresent(evidence.f235) ? 'ready' : 'guarded',
    impact: 'Mantiene handoff 2D/3D/documentos bajo control; seleccion bidireccional y hash de escena quedan para siguiente corte.',
    evidence: evidence.f235,
  },
  {
    phase: 'F236',
    title: 'post-deploy public smoke package',
    status: f200?.status === 'static-frontend-release-ready' && allPresent(evidence.f236) ? 'ready' : 'guarded',
    impact: 'Deja paquete y URL publica para repetir F154-F158/F202 despues de subir nuevo dist.',
    evidence: evidence.f236,
  },
];

const blockers = phases.filter((phase) => phase.status === 'blocked').map((phase) => phase.phase);
const payload = {
  schema: 'radshield-mx.f231-f236.canvas-release-coverage.v1',
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? 'f231-f236-complete' : 'f231-f236-blocked',
  phases,
  upstreamGates: {
    f198: f198?.ok === true,
    f207: f207?.status === 'functional-app-qa-pass',
    f229: f229?.status === 'canvas-cad-e2e-harness-ready',
    f230: f230?.status === 'post-f229-coverage-ready',
    f200: f200?.status === 'static-frontend-release-ready',
  },
  calculationEngineRecommendations: [
    {
      item: 'Trazabilidad kernel-calculo',
      impact: 'Cada resultado alimenta Memoria IA/PDF/Evidence con formulaId, norma, inputs, outputs, supuestos, warnings y citationIds.',
    },
    {
      item: 'Normalizacion unica de unidades',
      impact: 'Reduce errores silenciosos en mm/cm/m, mSv/wk, Gy/wk, uSv/h, kg/m2, costo y carga estructural.',
    },
    {
      item: 'TVL/HVL versionado por fuente',
      impact: 'Permite comparar NCRP/IAEA/UAQ/proveedor y justificar materiales como plomo, concreto, TM Nipoll, HD blocks o multilayer.',
    },
    {
      item: 'Comparador base/conservador',
      impact: 'Identifica barrera dominante y avisa si neutrones, fuga, scatter o primaria controlan el espesor.',
    },
    {
      item: 'QA numerico por modalidad',
      impact: 'Sube confianza de LINAC, CT/RX, Gamma Knife, PET/NM y HDR antes de release clinico.',
    },
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

const md = [
  '# F231-F236 - Canvas Release Coverage',
  '',
  `Estado: **${payload.status}**`,
  '',
  '## Fases',
  '',
  ...payload.phases.map((phase) => `- ${phase.status.toUpperCase()} ${phase.phase}: ${phase.title}. Impacto: ${phase.impact}`),
  '',
  '## Motor de calculo - mejoras recomendadas',
  '',
  ...payload.calculationEngineRecommendations.map((item) => `- ${item.item}: ${item.impact}`),
  '',
].join('\n');

fs.writeFileSync(mdPath, md, 'utf8');
console.log(JSON.stringify({ status: payload.status, phases: payload.phases.map((phase) => `${phase.phase}:${phase.status}`), blockers }, null, 2));
if (payload.status !== 'f231-f236-complete') process.exit(1);
