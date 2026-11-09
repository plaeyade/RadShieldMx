import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readMedical3DDialogSource } from './medical3d-dialog-source.mjs';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f295_canvas_redesign_smoke');
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

const toolbar = read('src/sections/Toolbar.tsx');
const canvasArea = read('src/sections/CanvasArea.tsx');
const quickSidebar = read('src/sections/CanvasQuickActionsSidebar.tsx');
const sidebar = read('src/sections/Sidebar.tsx');
const medical3d = readMedical3DDialogSource();
const f294 = readJson('outputs/f294_real_guided_smoke/f294_real_guided_smoke.json');
const commitSha = git(['rev-parse', 'HEAD']);
const gitStatus = git(['status', '--short']);

const externalEngineConnections = [
  {
    engine: 'GATE / OpenGATE',
    role: 'Medicina nuclear, PET/SPECT y escenarios de radioterapia con Geant4 validado externamente.',
    connection: 'Exportar geometria/materiales/fuentes desde floorplan a paquete runner; recibir dose map, uncertainty y log versionado.',
    currentState: 'adapter-gated',
  },
  {
    engine: 'EGSnrc / egs_brachy',
    role: 'Fotones/electrones y braquiterapia con control fino de fuente, phantom y scoring.',
    connection: 'Generar input decks desde Memoria IA/canvas, ejecutar runner externo y anexar resultados como evidencia no automatica.',
    currentState: 'planned-runner',
  },
  {
    engine: 'Geant4 standalone',
    role: 'Casos avanzados, ciclotron, neutrones, activacion y validacion independiente del calculo analitico.',
    connection: 'Bridge CAD-to-MC con materiales versionados, macros, semillas y reporte de reproducibilidad.',
    currentState: 'deferred-runner',
  },
  {
    engine: 'APS/ODA DWG conversion',
    role: 'Conversion DWG nativa a formatos consumibles por canvas sin incrustar motor propietario en frontend.',
    connection: 'Subir DWG a proveedor, convertir a DXF/SVG/GLTF, importar al canvas y guardar hash del plano convertido.',
    currentState: 'provider-required',
  },
];

const canvasRedesignDecisions = [
  'Archivo se mueve al inicio de la toolbar como menu primario.',
  'Zona legacy de menus queda oculta para evitar duplicidad visual y conservar rollback.',
  'Canvas abre en modo limpio: workflow, QA y continuidad ocultos por defecto.',
  'Paneles pesados siguen recuperables desde chips compactos.',
  'Sidebar rapida CAD inicia colapsada para liberar area de plano.',
  'Sidebar principal inicia visible con ancho estable acotado al area de trabajo; conserva modo colapsado manual.',
  'Redisenio de renderer/eventos queda para F296-F300 con harness visual dedicado.',
];

const gates = [
  { id: 'f294-ready', pass: f294?.status === 'real-guided-smoke-ready', evidence: 'outputs/f294_real_guided_smoke/f294_real_guided_smoke.json' },
  { id: 'primary-file-menu-first', pass: toolbar.indexOf('f295-primary-file-dropdown') > -1 && toolbar.indexOf('f295-primary-file-dropdown') < toolbar.indexOf('f96-migrated-design-dropdown'), evidence: 'src/sections/Toolbar.tsx' },
  { id: 'legacy-menu-hidden', pass: toolbar.includes('data-testid="f114-deduped-legacy-menu-zone" className="hidden"'), evidence: 'src/sections/Toolbar.tsx' },
  { id: 'clean-canvas-defaults', pass: canvasArea.includes('radshield_canvas_panels_f188_f295_clean_workspace') && canvasArea.includes('workflow: false') && canvasArea.includes('qa: false') && canvasArea.includes('continuity: false'), evidence: 'src/sections/CanvasArea.tsx' },
  { id: 'quick-sidebar-collapsed-default', pass: quickSidebar.includes('useState(true)') && quickSidebar.includes('Colapsar herramientas CAD rapidas'), evidence: 'src/sections/CanvasQuickActionsSidebar.tsx' },
  { id: 'main-sidebar-visible-default', pass: sidebar.includes('const [collapsed, setCollapsed] = useState(false)') && sidebar.includes('const DEFAULT_SIDEBAR_WIDTH = 260') && sidebar.includes('const MAX_SIDEBAR_WIDTH = 300'), evidence: 'src/sections/Sidebar.tsx' },
  { id: 'advanced-3d-existing', pass: medical3d.includes('@react-three/fiber') && medical3d.includes('buildMedicalScene') && medical3d.includes('OrbitControls'), evidence: 'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx' },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);

const previewHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>F295 Medical 3D Preview</title>
  <style>
    body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:#eef2f5;color:#172033}
    .stage{min-height:100vh;display:grid;grid-template-columns:260px 1fr 300px;gap:0}
    aside{background:#fff;border-right:1px solid #d8dee7;padding:18px}
    main{position:relative;overflow:hidden;background:linear-gradient(145deg,#dfe7ec,#f8fafc)}
    .room{position:absolute;inset:9% 10%;transform:skewY(-8deg) rotateX(12deg);background:#d7dde4;border:14px solid #8b949e;box-shadow:0 30px 80px #71809666}
    .wall{position:absolute;background:#b8b7b1;border:2px solid #71717a}
    .north{left:0;right:0;top:0;height:44px}.south{left:0;right:0;bottom:0;height:44px}.west{top:0;bottom:0;left:0;width:44px}.east{top:0;bottom:0;right:0;width:44px}
    .linac{position:absolute;left:45%;top:42%;width:120px;height:64px;background:#f8fafc;border:2px solid #64748b;border-radius:12px;box-shadow:0 12px 24px #33415533}
    .beam{position:absolute;left:53%;top:44%;width:280px;height:60px;background:linear-gradient(90deg,#ef444466,#f9731600);clip-path:polygon(0 35%,100% 0,100% 100%,0 65%)}
    .zone{position:absolute;left:20%;top:18%;right:18%;bottom:18%;border:2px dashed #059669;background:#10b98118}
    .label{position:absolute;background:#fffffff2;border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px;font-size:12px;box-shadow:0 8px 18px #64748b22}
    .toolbar{position:absolute;left:16px;top:16px;right:16px;height:42px;border:1px solid #cbd5e1;background:#ffffffd9;border-radius:10px;display:flex;align-items:center;gap:8px;padding:0 10px}
    .tool{height:28px;min-width:28px;border-radius:7px;background:#f8fafc;border:1px solid #dbe2ea;display:grid;place-items:center;font-size:12px;font-weight:700}
    .panel{background:#fff;border-left:1px solid #d8dee7;padding:18px}
    h1{font-size:18px;margin:0 0 8px}.muted{font-size:12px;color:#64748b}.card{border:1px solid #dbe2ea;border-radius:10px;padding:12px;margin:10px 0;background:#fbfdff}.pill{display:inline-block;background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:99px;padding:3px 8px;font-size:11px;margin:2px}
  </style>
</head>
<body>
  <div class="stage">
    <aside>
      <h1>Canvas limpio</h1>
      <p class="muted">Toolbar compacta, Archivo al inicio, paneles recuperables y sidebar CAD colapsada.</p>
      <div class="card"><strong>Flujo</strong><br/>Plano -> escala -> equipo -> material -> calculo -> memoria.</div>
      <span class="pill">DX</span><span class="pill">TX</span><span class="pill">NM</span><span class="pill">CY</span>
    </aside>
    <main>
      <div class="toolbar"><div class="tool">A</div><div class="tool">Sel</div><div class="tool">Muro</div><div class="tool">Eq</div><div class="tool">3D</div><div class="tool">Iso</div></div>
      <div class="room"><div class="zone"></div><div class="wall north"></div><div class="wall south"></div><div class="wall west"></div><div class="wall east"></div><div class="beam"></div><div class="linac"></div></div>
      <div class="label" style="left:62%;top:31%">Barrera primaria<br/><strong>Concreto HD 1.85 m</strong></div>
      <div class="label" style="left:36%;top:58%">Isocentro / LINAC<br/><strong>TX 6 MV</strong></div>
    </main>
    <section class="panel">
      <h1>Inspeccion 3D</h1>
      <p class="muted">Ejemplo conceptual del visor: recorrido, espesores, equipo, zona controlada, materiales y export visual.</p>
      <div class="card"><strong>Motor:</strong> React Three Fiber + sceneBuilder</div>
      <div class="card"><strong>Export:</strong> snapshot / OBJ / evidencia</div>
      <div class="card"><strong>MC externo:</strong> GATE, EGSnrc, Geant4 por runner validado</div>
    </section>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'f295_medical_3d_preview.html'), previewHtml, 'utf8');

const payload = {
  schema: 'radshield-mx.f295.canvas-redesign-smoke.v1',
  phase: 'F295',
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? 'canvas-redesign-smoke-ready' : 'canvas-redesign-smoke-gated',
  commitSha,
  worktreeClean: gitStatus.length === 0,
  gates,
  canvasRedesignDecisions,
  externalEngineConnections,
  preview: {
    path: 'outputs/f295_canvas_redesign_smoke/f295_medical_3d_preview.html',
    sha256: sha256Text(previewHtml),
  },
  nextRecommendedPhase: blockers.length === 0
    ? 'F296 implement Canvas Workbench architecture: unified left tool rail, object inspector, bottom status bar and panel manager.'
    : 'Resolve F295 blockers before continuing canvas renderer/event redesign.',
  blockers,
};

fs.writeFileSync(path.join(outDir, 'f295_canvas_redesign_smoke.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_295_canvas_redesign_smoke.md'), [
  '# F295 Canvas Redesign Smoke',
  '',
  `Status: ${payload.status}`,
  `Commit: ${payload.commitSha}`,
  '',
  '## Gates',
  ...gates.map((gate) => `- ${gate.pass ? 'PASS' : 'FAIL'} ${gate.id}: ${gate.evidence}`),
  '',
  '## Canvas decisions',
  ...canvasRedesignDecisions.map((item) => `- ${item}`),
  '',
  '## External engines',
  ...externalEngineConnections.map((item) => `- ${item.engine}: ${item.connection}`),
  '',
  `Preview: ${payload.preview.path}`,
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({ status: payload.status, gates: gates.map((gate) => `${gate.id}:${gate.pass ? 'pass' : 'fail'}`), blockers }, null, 2));

if (payload.status !== 'canvas-redesign-smoke-ready') process.exit(1);
