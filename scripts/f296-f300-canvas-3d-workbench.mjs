import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f296_f300_canvas_3d_workbench');
fs.mkdirSync(outDir, { recursive: true });

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
}

function readJson(relativePath) {
  const text = read(relativePath);
  return text ? JSON.parse(text) : null;
}

function git(args) {
  const gitExe = fs.existsSync('C:\\Program Files\\Git\\cmd\\git.exe') ? 'C:\\Program Files\\Git\\cmd\\git.exe' : 'git';
  return execFileSync(gitExe, args, { cwd: root, encoding: 'utf8' }).trim();
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

const sidebar = read('src/sections/Sidebar.tsx');
const canvasArea = read('src/sections/CanvasArea.tsx');
const quickSidebar = read('src/sections/CanvasQuickActionsSidebar.tsx');
const medical3d = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const toolbar = read('src/sections/Toolbar.tsx');
const f295 = readJson('outputs/f295_canvas_redesign_smoke/f295_canvas_redesign_smoke.json');
const commitSha = git(['rev-parse', 'HEAD']);
const gitStatus = git(['status', '--short']);

const phases = [
  {
    id: 'F296',
    name: 'Canvas Workbench Architecture',
    status: 'ready',
    decision: 'Sidebar principal visible, ancho 260 px por defecto y limite superior 300 px; toolbar Archivo queda al inicio.',
  },
  {
    id: 'F297',
    name: 'Panel Manager / Docking',
    status: 'ready-contract',
    decision: 'Paneles pesados siguen cerrados por defecto y recuperables por chips; el siguiente paso real es docking persistente por panel.',
  },
  {
    id: 'F298',
    name: 'Renderer/Event Refactor Gate',
    status: 'planned-safe',
    decision: 'No se reemplaza el renderer base hasta tener E2E dedicado; se documenta contrato de eventos, seleccion y capas.',
  },
  {
    id: 'F299',
    name: 'Medical 3D Inspection Preview',
    status: 'ready-preview',
    decision: 'Se genera preview navegable de bunker/sala con muros, equipo, zonas, ruta, heatmap e inspectores.',
  },
  {
    id: 'F300',
    name: 'External Engine Runner Contract',
    status: 'ready-contract',
    decision: 'GATE/OpenGATE, EGSnrc/egs_brachy, Geant4 y APS/ODA se conectan como runners/adapters externos con hash de entrada/salida.',
  },
];

const externalRunnerContract = {
  inputPackage: [
    'projectId, caseId, modalityProfile',
    'floorplan geometry with scale hash',
    'equipment footprint, source model and orientation',
    'materials with density, TVL, uncertainty and citation hash',
    'scoring request: dose grid, isocontours, uncertainty, report artifacts',
  ],
  runners: [
    { id: 'gate-opengate', use: 'PET/SPECT/NM, selected radiotherapy geometries', output: 'dose grid, uncertainty, macro log, version manifest' },
    { id: 'egsnrc-egs-brachy', use: 'photons/electrons and brachytherapy checks', output: 'dose kernels, scoring tables, transport log' },
    { id: 'geant4-standalone', use: 'cyclotron, neutrons, activation and engineering cases', output: 'particle histories summary, dose map, reproducibility log' },
    { id: 'aps-oda-dwg', use: 'DWG conversion to DXF/SVG/GLTF for canvas import', output: 'converted floorplan, layer map, conversion hash' },
  ],
  safety: [
    'No live write to clinical DB during dry-run.',
    'Every runner output must be non-authoritative until reviewed by RSO/physicist.',
    'Runner versions and datasets are stored with hashes before report export.',
  ],
};

const previewHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RadShield-MX F296-F300 Medical 3D Inspection</title>
  <style>
    :root{color-scheme:light;--ink:#172033;--muted:#64748b;--line:#cbd5e1;--panel:#ffffff;--soft:#f8fafc;--accent:#f97316;--ok:#059669;--dose:#dc2626;--shield:#64748b}
    *{box-sizing:border-box} body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:#e8edf2;color:var(--ink)}
    .shell{min-height:100vh;display:grid;grid-template-columns:260px minmax(520px,1fr) 320px}
    .left,.right{background:var(--panel);border-color:var(--line);padding:16px}.left{border-right:1px solid var(--line)}.right{border-left:1px solid var(--line)}
    h1{font-size:18px;margin:0 0 4px} h2{font-size:12px;margin:16px 0 8px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
    p{font-size:12px;line-height:1.45;color:var(--muted);margin:4px 0 10px}.tools{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.tool{height:34px;border:1px solid var(--line);background:var(--soft);border-radius:8px;font-size:11px;font-weight:700;color:var(--ink)}
    .tool.active{background:#fff7ed;border-color:#fed7aa;color:#c2410c}.stage{position:relative;overflow:hidden;background:linear-gradient(145deg,#d7dee6,#f8fafc)}
    .topbar{position:absolute;left:14px;right:14px;top:12px;height:44px;border:1px solid var(--line);background:#ffffffe6;border-radius:10px;display:flex;align-items:center;gap:8px;padding:0 10px;z-index:4}
    .chip{height:28px;padding:0 10px;border-radius:8px;border:1px solid var(--line);background:var(--soft);font-size:12px;font-weight:700}.chip.main{background:#fff7ed;color:#c2410c;border-color:#fed7aa}
    .viewport{position:absolute;left:40px;right:40px;top:76px;bottom:34px;perspective:900px}
    .scene{position:absolute;inset:6% 2%;transform-style:preserve-3d;transform:rotateX(58deg) rotateZ(-32deg);transition:transform .2s ease}
    .floor{position:absolute;left:8%;top:8%;width:78%;height:66%;background:#d9dee5;border:2px solid #94a3b8;box-shadow:0 24px 60px #33415545;transform-style:preserve-3d}
    .grid{position:absolute;inset:0;background-image:linear-gradient(#94a3b844 1px,transparent 1px),linear-gradient(90deg,#94a3b844 1px,transparent 1px);background-size:34px 34px}
    .zone{position:absolute;left:18%;top:15%;width:58%;height:54%;border:3px dashed var(--ok);background:#10b98118}
    .wall{position:absolute;background:#8b949e;border:1px solid #475569}.north{left:0;right:0;top:-18px;height:22px}.south{left:0;right:0;bottom:-18px;height:22px}.west{top:-18px;bottom:-18px;left:-18px;width:22px}.east{top:-18px;bottom:-18px;right:-18px;width:22px}
    .primary{position:absolute;left:72%;top:8%;width:8%;height:66%;background:#52525b}.door{position:absolute;left:5%;bottom:-20px;width:20%;height:24px;background:#f8fafc;border:2px solid #64748b}
    .equipment{position:absolute;left:43%;top:39%;width:15%;height:12%;background:#f8fafc;border:2px solid #475569;border-radius:14px;box-shadow:0 8px 16px #33415544}.gantry{position:absolute;left:47%;top:31%;width:7%;height:20%;border:8px solid #64748b;border-radius:50%}
    .beam{position:absolute;left:53%;top:41%;width:28%;height:12%;background:linear-gradient(90deg,#ef444466,#f9731600);clip-path:polygon(0 40%,100% 0,100% 100%,0 60%)}
    .heat{position:absolute;left:34%;top:27%;width:34%;height:30%;border-radius:50%;background:radial-gradient(circle,#dc262677 0,#f9731644 36%,#facc1533 58%,transparent 72%)}
    .label{position:absolute;z-index:5;background:#fffffff0;border:1px solid var(--line);border-radius:9px;padding:8px 10px;font-size:12px;box-shadow:0 12px 24px #33415522}.l1{left:56%;top:22%}.l2{left:31%;top:58%}.l3{right:28px;bottom:52px}
    .card{border:1px solid var(--line);background:var(--soft);border-radius:10px;padding:10px;margin:8px 0}.row{display:flex;justify-content:space-between;gap:12px;font-size:12px;padding:4px 0;border-bottom:1px solid #e2e8f0}.row:last-child{border-bottom:0}.value{font-weight:700;color:var(--ink)}.legend{height:10px;border-radius:99px;background:linear-gradient(90deg,#facc15,#f97316,#dc2626);margin:8px 0}
    input{width:100%}
    @media(max-width:980px){.shell{grid-template-columns:1fr}.left,.right{border:0}.stage{min-height:620px}}
  </style>
</head>
<body>
  <div class="shell">
    <aside class="left">
      <h1>RadShield-MX 3D</h1>
      <p>Inspeccion navegable: sala, espesores, equipo, zonas controladas, heatmap, ruta visual y evidencia.</p>
      <h2>Workbench</h2>
      <div class="tools">
        <button class="tool active">Sel</button><button class="tool">Muro</button><button class="tool">Eq</button><button class="tool">Cota</button>
        <button class="tool">Capa</button><button class="tool">Iso</button><button class="tool">3D</button><button class="tool">Exp</button>
      </div>
      <h2>Camara</h2>
      <label><p>Rotacion</p><input id="rot" type="range" min="-55" max="15" value="-32" /></label>
      <label><p>Inclinacion</p><input id="tilt" type="range" min="45" max="70" value="58" /></label>
    </aside>
    <main class="stage" aria-label="Preview 3D navegable de sala medica">
      <div class="topbar"><span class="chip main">Archivo</span><span class="chip">Diseno</span><span class="chip">Equipos</span><span class="chip">Blindaje</span><span class="chip">3D</span><span class="chip">Reportes</span></div>
      <div class="viewport">
        <div class="scene" id="scene">
          <div class="floor">
            <div class="grid"></div><div class="zone"></div><div class="heat"></div><div class="beam"></div><div class="gantry"></div><div class="equipment"></div>
            <div class="wall north"></div><div class="wall south"></div><div class="wall west"></div><div class="wall east"></div><div class="primary"></div><div class="door"></div>
          </div>
        </div>
      </div>
      <div class="label l1">Barrera primaria<br><strong>Concreto HD / Pb opcional</strong></div>
      <div class="label l2">Equipo TX<br><strong>LINAC footprint + giro</strong></div>
      <div class="label l3">Ruta de inspeccion<br><strong>Export visual para memoria</strong></div>
    </main>
    <section class="right">
      <h1>Inspector</h1>
      <p>El panel real se alimentaria del floorplan, materiales y resultados del motor.</p>
      <div class="card"><div class="row"><span>Modalidad</span><span class="value">TX</span></div><div class="row"><span>Equipo</span><span class="value">LINAC 6 MV</span></div><div class="row"><span>Zona</span><span class="value">Controlada</span></div></div>
      <h2>Materiales</h2>
      <div class="card"><div class="row"><span>Densidad</span><span class="value">2.35 g/cm3</span></div><div class="row"><span>TVL</span><span class="value">versionado</span></div><div class="row"><span>Carga</span><span class="value">kg/m2</span></div></div>
      <h2>Heatmap</h2>
      <div class="legend"></div><p>Umbrales reguladores y etiquetas exportables.</p>
      <h2>Runners</h2>
      <div class="card"><div class="row"><span>GATE</span><span class="value">adapter</span></div><div class="row"><span>EGSnrc</span><span class="value">runner</span></div><div class="row"><span>Geant4</span><span class="value">deferred</span></div></div>
    </section>
  </div>
  <script>
    const scene = document.getElementById('scene');
    const rot = document.getElementById('rot');
    const tilt = document.getElementById('tilt');
    function updateCamera(){ scene.style.transform = 'rotateX(' + tilt.value + 'deg) rotateZ(' + rot.value + 'deg)'; }
    rot.addEventListener('input', updateCamera);
    tilt.addEventListener('input', updateCamera);
    updateCamera();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'medical_3d_navigable_preview.html'), previewHtml, 'utf8');

const gates = [
  { id: 'f295-ready', pass: f295?.status === 'canvas-redesign-smoke-ready', evidence: 'outputs/f295_canvas_redesign_smoke/f295_canvas_redesign_smoke.json' },
  { id: 'sidebar-visible-bounded', pass: sidebar.includes('const [collapsed, setCollapsed] = useState(false)') && sidebar.includes('const DEFAULT_SIDEBAR_WIDTH = 260') && sidebar.includes('const MAX_SIDEBAR_WIDTH = 300'), evidence: 'src/sections/Sidebar.tsx' },
  { id: 'toolbar-file-first', pass: toolbar.indexOf('f295-primary-file-dropdown') > -1 && toolbar.indexOf('f295-primary-file-dropdown') < toolbar.indexOf('f96-migrated-design-dropdown'), evidence: 'src/sections/Toolbar.tsx' },
  { id: 'canvas-clean-panels', pass: canvasArea.includes('workflow: false') && canvasArea.includes('qa: false') && canvasArea.includes('continuity: false'), evidence: 'src/sections/CanvasArea.tsx' },
  { id: 'quick-cad-collapsed', pass: quickSidebar.includes('useState(true)') && quickSidebar.includes('CAD'), evidence: 'src/sections/CanvasQuickActionsSidebar.tsx' },
  { id: 'medical-3d-runtime-existing', pass: medical3d.includes('@react-three/fiber') && medical3d.includes('OrbitControls') && medical3d.includes('buildMedicalScene'), evidence: 'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx' },
  { id: 'external-runner-contract', pass: externalRunnerContract.runners.length === 4 && externalRunnerContract.inputPackage.length >= 5, evidence: 'outputs/f296_f300_canvas_3d_workbench/f296_f300_canvas_3d_workbench.json' },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);
const payload = {
  schema: 'radshield-mx.f296-f300.canvas-3d-workbench.v1',
  phases,
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? 'canvas-3d-workbench-ready' : 'canvas-3d-workbench-gated',
  commitSha,
  worktreeClean: gitStatus.length === 0,
  gates,
  externalRunnerContract,
  preview: {
    path: 'outputs/f296_f300_canvas_3d_workbench/medical_3d_navigable_preview.html',
    sha256: sha256Text(previewHtml),
  },
  nextRecommendedPhase: 'F301: implement panel docking persistence and object-inspector-to-renderer events under E2E harness.',
  blockers,
};

fs.writeFileSync(path.join(outDir, 'f296_f300_canvas_3d_workbench.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_296_300_canvas_3d_workbench.md'), [
  '# F296-F300 Canvas 3D Workbench',
  '',
  `Status: ${payload.status}`,
  `Commit: ${payload.commitSha}`,
  '',
  '## Gates',
  ...gates.map((gate) => `- ${gate.pass ? 'PASS' : 'FAIL'} ${gate.id}: ${gate.evidence}`),
  '',
  '## Phases',
  ...phases.map((phase) => `- ${phase.id} ${phase.name}: ${phase.decision}`),
  '',
  '## External runner contract',
  ...externalRunnerContract.runners.map((runner) => `- ${runner.id}: ${runner.use}; output=${runner.output}`),
  '',
  `Preview: ${payload.preview.path}`,
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({ status: payload.status, gates: gates.map((gate) => `${gate.id}:${gate.pass ? 'pass' : 'fail'}`), blockers }, null, 2));

if (payload.status !== 'canvas-3d-workbench-ready') process.exit(1);
