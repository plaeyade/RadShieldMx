import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readMedical3DDialogSource } from './medical3d-dialog-source.mjs';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f301_f306_functional_release_close');
fs.mkdirSync(outDir, { recursive: true });

const read = (relativePath) => {
  const fullPath = path.join(root, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
};

const readJson = (relativePath) => {
  const text = read(relativePath);
  return text ? JSON.parse(text) : null;
};

const git = (args) => {
  const gitExe = fs.existsSync('C:\\Program Files\\Git\\cmd\\git.exe') ? 'C:\\Program Files\\Git\\cmd\\git.exe' : 'git';
  return execFileSync(gitExe, args, { cwd: root, encoding: 'utf8' }).trim();
};

const sha256Text = (text) => crypto.createHash('sha256').update(text).digest('hex');

const f296 = readJson('outputs/f296_f300_canvas_3d_workbench/f296_f300_canvas_3d_workbench.json');
const f294 = readJson('outputs/f294_real_guided_smoke/f294_real_guided_smoke.json');
const f200 = readJson('outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json');
const canvasArea = read('src/sections/CanvasArea.tsx');
const sidebar = read('src/sections/Sidebar.tsx');
const medical3d = readMedical3DDialogSource();
const memoria = read('src/sections/dialogs/MemoriaAIWizard.tsx');
const evidence = read('src/sections/dialogs/EvidencePackDialog.tsx');
const packageJson = JSON.parse(read('package.json'));
const commitSha = git(['rev-parse', 'HEAD']);
const gitStatus = git(['status', '--short']);

const phases = [
  {
    id: 'F301',
    name: 'Panel docking real y persistente',
    status: 'ready-contract',
    acceptance: [
      'Workflow/QA/continuity panels start closed when appropriate.',
      'Panel visibility/dock state is persisted in localStorage.',
      'Main sidebar remains visible and bounded to workspace.',
    ],
  },
  {
    id: 'F302',
    name: 'Renderer/eventos base gate',
    status: 'guarded',
    acceptance: [
      'Renderer rewrite is not allowed without F229/F303 E2E before/after.',
      'Selection, drag, grips and snapping must be covered before switching controllers.',
      'Rollback remains current renderer/useCanvas path.',
    ],
  },
  {
    id: 'F303',
    name: 'E2E visual completo del canvas',
    status: 'ready-contract',
    acceptance: [
      'Toolbar Archivo first, sidebar visible, quick CAD rail available.',
      'DXF/floorplan, scale, layers, dimensions, equipment, heatmap and export must be checked.',
      'Smoke must be repeated before deploy.',
    ],
  },
  {
    id: 'F304',
    name: 'Memoria IA caso completo',
    status: 'ready-contract',
    acceptance: [
      'Plano -> equipo -> material -> calculation trace -> citations -> PDF/Evidence Pack.',
      'Every result needs formula, standard, inputs, outputs, warnings and citation ids.',
      'Signed clinical use requires professional review.',
    ],
  },
  {
    id: 'F305',
    name: 'DB/RAG readback final',
    status: 'db-gated',
    acceptance: [
      'Document chunks require hashes, page refs, dedupe state and source priority.',
      'OCR draft chunks remain excluded until approved.',
      'Private DB/readback must run before multiuser clinical release.',
    ],
  },
  {
    id: 'F306',
    name: 'Release/deploy final',
    status: 'static-ready-fullstack-gated',
    acceptance: [
      'Static frontend can be published after F200/F293/F294/F303 smoke.',
      'Fullstack requires DB restore probe, secrets, API health and RAG readback.',
      'Rollback package and manual/changelog/update center must be current.',
    ],
  },
];

const realistic3dOptions = [
  {
    engine: 'React Three Fiber / Three.js',
    recommendation: 'primary',
    why: 'Ya esta integrado, ligero para Vite/React, suficiente para inspeccion de sala, equipos, espesores, heatmaps y snapshots.',
    tradeoff: 'Realismo fisico limitado si se buscan materiales PBR complejos, luces globales o XR avanzado.',
  },
  {
    engine: 'Babylon.js + WebGPU/WebXR',
    recommendation: 'phase-2',
    why: 'Muy fuerte para escena web, PBR, WebXR y experiencias navegables; WebGPU esta ampliamente avanzado pero con caveats de navegador.',
    tradeoff: 'Implica coexistir o migrar una parte del visor 3D, no conviene mezclarlo con cambios de renderer 2D.',
  },
  {
    engine: 'Unity WebGL',
    recommendation: 'external-viewer',
    why: 'Permite realismo alto y pipeline familiar de tiempo real, pero se compila como build WebGL separado con assets propios.',
    tradeoff: 'Build pesado, headers/compresion de servidor, integracion React via iframe/bridge y mantenimiento doble.',
  },
  {
    engine: 'Unreal Pixel Streaming',
    recommendation: 'not-for-static-release',
    why: 'Maximo realismo y recorridos pesados.',
    tradeoff: 'Requiere GPU/servidor streaming; no encaja con frontend estatico ni release ligero.',
  },
];

const externalMotorFlow = [
  { step: '1 Floorplan', detail: 'Canvas exporta geometria, escala, capas, equipos y zonas.' },
  { step: '2 Materials', detail: 'Toolbox adjunta densidad, TVL/HVL, costo, carga, fuente y hash.' },
  { step: '3 Case Pack', detail: 'API crea paquete versionado con modalidad, fuente, scoring, seed y normas.' },
  { step: '4 Runner', detail: 'GATE/OpenGATE, EGSnrc, Geant4 o APS/ODA ejecutan fuera del frontend.' },
  { step: '5 Results', detail: 'Se importan dose grids, isocontornos, logs, incertidumbre y archivos convertidos.' },
  { step: '6 Evidence', detail: 'Memoria IA/PDF/Evidence Pack citan formula, pagina, hash, version y advertencias.' },
];

const previewHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RadShield-MX F301-F306 Motor Flow</title>
  <style>
    body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:#eef2f6;color:#172033}
    .wrap{min-height:100vh;display:grid;grid-template-columns:1.1fr .9fr;gap:18px;padding:18px}
    .panel{background:#fff;border:1px solid #d7dee8;border-radius:12px;padding:16px;box-shadow:0 14px 30px #33415518}
    h1{font-size:18px;margin:0 0 8px}.muted{color:#64748b;font-size:12px;line-height:1.45}
    .flow{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}.node{border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;padding:12px;min-height:104px}.node strong{display:block;font-size:13px}.node p{font-size:12px;color:#64748b;margin:7px 0 0;line-height:1.35}
    .scene{height:420px;position:relative;overflow:hidden;background:linear-gradient(145deg,#dae3ea,#f8fafc);border-radius:12px;border:1px solid #cbd5e1;perspective:900px}
    .room{position:absolute;left:12%;right:9%;top:19%;bottom:17%;transform:rotateX(58deg) rotateZ(-32deg);background:#d9dee5;border:16px solid #7c8794;box-shadow:0 34px 75px #33415555}
    .grid{position:absolute;inset:0;background-image:linear-gradient(#94a3b855 1px,transparent 1px),linear-gradient(90deg,#94a3b855 1px,transparent 1px);background-size:32px 32px}
    .zone{position:absolute;left:18%;top:18%;width:58%;height:54%;border:3px dashed #059669;background:#10b9811f}.beam{position:absolute;left:53%;top:42%;width:34%;height:14%;background:linear-gradient(90deg,#dc262666,#f9731600);clip-path:polygon(0 38%,100% 0,100% 100%,0 62%)}
    .eq{position:absolute;left:43%;top:39%;width:16%;height:13%;background:#fff;border:2px solid #475569;border-radius:14px}.heat{position:absolute;left:32%;top:25%;width:38%;height:34%;border-radius:50%;background:radial-gradient(circle,#dc262670 0,#f9731647 38%,#facc1534 58%,transparent 74%)}
    .badge{display:inline-block;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:99px;padding:4px 9px;font-size:11px;margin:2px}.table{width:100%;border-collapse:collapse;margin-top:12px}.table td{font-size:12px;border-bottom:1px solid #e2e8f0;padding:7px 2px}.table td:last-child{text-align:right;font-weight:700}
    @media(max-width:900px){.wrap{grid-template-columns:1fr}.flow{grid-template-columns:1fr 1fr}}@media(max-width:560px){.flow{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="wrap">
    <section class="panel">
      <h1>Proceso grafico de motores externos</h1>
      <p class="muted">El frontend no certifica Monte Carlo. Prepara paquetes reproducibles, ejecuta runners externos y reimporta resultados auditables.</p>
      <div class="flow">${externalMotorFlow.map((item) => `<div class="node"><strong>${item.step}</strong><p>${item.detail}</p></div>`).join('')}</div>
    </section>
    <section class="panel">
      <h1>Inspeccion 3D realista</h1>
      <p class="muted">La app debe mostrar sala, espesor, equipo, zonas, heatmap y snapshots; Unity puede ser visor externo si se requiere realismo pesado.</p>
      <div class="scene"><div class="room"><div class="grid"></div><div class="zone"></div><div class="heat"></div><div class="beam"></div><div class="eq"></div></div></div>
      <div><span class="badge">Three.js primary</span><span class="badge">Babylon phase-2</span><span class="badge">Unity external</span></div>
      <table class="table"><tbody><tr><td>Static release</td><td>Three.js</td></tr><tr><td>Realismo PBR/XR</td><td>Babylon/Unity</td></tr><tr><td>Clinico firmado</td><td>runner + QA</td></tr></tbody></table>
    </section>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'external_engines_3d_process_preview.html'), previewHtml, 'utf8');

const gates = [
  { id: 'f296-f300-ready', pass: f296?.status === 'canvas-3d-workbench-ready', evidence: 'outputs/f296_f300_canvas_3d_workbench/f296_f300_canvas_3d_workbench.json' },
  { id: 'f294-ready', pass: f294?.status === 'real-guided-smoke-ready', evidence: 'outputs/f294_real_guided_smoke/f294_real_guided_smoke.json' },
  { id: 'f200-static-ready', pass: f200?.status === 'static-frontend-release-ready', evidence: 'outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json' },
  { id: 'sidebar-visible-bounded', pass: sidebar.includes('const [collapsed, setCollapsed] = useState(false)') && sidebar.includes('const DEFAULT_SIDEBAR_WIDTH = 260'), evidence: 'src/sections/Sidebar.tsx' },
  { id: 'canvas-panel-persistence', pass: canvasArea.includes('localStorage') && canvasArea.includes('workflow: false') && canvasArea.includes('qa: false'), evidence: 'src/sections/CanvasArea.tsx' },
  { id: 'medical-3d-runtime', pass: medical3d.includes('@react-three/fiber') && medical3d.includes('OrbitControls'), evidence: 'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx' },
  { id: 'memoria-evidence-surfaces', pass: memoria.includes('citation') || memoria.includes('Citation') || evidence.includes('citation') || evidence.includes('Citation'), evidence: 'MemoriaAIWizard/EvidencePackDialog' },
  { id: 'package-scripts', pass: Boolean(packageJson.scripts?.['prepare:f296-f300:canvas-3d-workbench']), evidence: 'package.json' },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);
const payload = {
  schema: 'radshield-mx.f301-f306.functional-release-close.v1',
  generatedAt: new Date().toISOString(),
  commitSha,
  worktreeClean: gitStatus.length === 0,
  status: blockers.length === 0 ? 'functional-release-close-ready' : 'functional-release-close-gated',
  phases,
  realistic3dOptions,
  externalMotorFlow,
  gates,
  preview: {
    path: 'outputs/f301_f306_functional_release_close/external_engines_3d_process_preview.html',
    sha256: sha256Text(previewHtml),
  },
  releaseDecision: {
    staticFrontend: 'ready-after-smoke',
    fullstackClinical: 'gated-by-db-rag-readback-and-runner-validation',
    highRiskCad: 'post-release-or-feature-flag-only',
  },
  nextRecommendedPhase: 'F307: real operator test with one signed TX memory and one imported DXF/floorplan; record deviations before public refresh.',
  blockers,
};

fs.writeFileSync(path.join(outDir, 'f301_f306_functional_release_close.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_301_306_functional_release_close.md'), [
  '# F301-F306 Functional Release Close',
  '',
  `Status: ${payload.status}`,
  `Commit: ${payload.commitSha}`,
  '',
  '## Gates',
  ...gates.map((gate) => `- ${gate.pass ? 'PASS' : 'FAIL'} ${gate.id}: ${gate.evidence}`),
  '',
  '## 3D realistic options',
  ...realistic3dOptions.map((item) => `- ${item.engine}: ${item.recommendation}; ${item.why}`),
  '',
  '## External motor flow',
  ...externalMotorFlow.map((item) => `- ${item.step}: ${item.detail}`),
  '',
  `Preview: ${payload.preview.path}`,
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({
  status: payload.status,
  gates: gates.map((gate) => `${gate.id}:${gate.pass ? 'pass' : 'fail'}`),
  blockers,
}, null, 2));

if (payload.status !== 'functional-release-close-ready') process.exit(1);
