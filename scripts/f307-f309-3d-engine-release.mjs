import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readMedical3DDialogSource } from './medical3d-dialog-source.mjs';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f307_f309_3d_engine_release');
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

const strategy = read('src/lib/medical3D/renderStrategy.ts');
const dialog = readMedical3DDialogSource();
const f301 = readJson('outputs/f301_f306_functional_release_close/f301_f306_functional_release_close.json');
const commitSha = git(['rev-parse', 'HEAD']);
const gitStatus = git(['status', '--short']);

const phases = [
  {
    id: 'F307',
    name: 'Three/R3F active implementation',
    result: 'El visor Medical 3D usa React Three Fiber/Three.js como motor activo, con selector y export de handoff.',
  },
  {
    id: 'F308',
    name: 'Babylon PBR/WebGPU/WebXR adapter',
    result: 'Babylon queda como estrategia adapter-ready, no cargada en bundle principal hasta feature flag/E2E.',
  },
  {
    id: 'F309',
    name: 'Unity WebGL deferred external viewer',
    result: 'Unity WebGL queda al final como visor externo pesado con bridge JSON/GLTF y sin rol regulatorio automatico.',
  },
];

const implementationDecision = {
  activeEngine: 'three-r3f',
  adapterEngine: 'babylon-pbr-webgpu-webxr',
  finalExternalEngine: 'unity-webgl-external',
  rationale: [
    'Three/R3F ya existe en el proyecto y compila dentro del frontend React.',
    'Babylon agrega valor para PBR/WebGPU/WebXR, pero debe aislarse para no inflar ni romper el release estatico.',
    'Unity WebGL requiere build separado, headers/compresion y puente de datos; por eso queda al final.',
  ],
};

const previewHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RadShield-MX F307-F309 3D Engine Strategy</title>
  <style>
    body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:#eef2f6;color:#172033}
    .wrap{min-height:100vh;display:grid;grid-template-columns:280px 1fr;gap:18px;padding:18px}
    .panel{background:#fff;border:1px solid #d7dee8;border-radius:12px;padding:16px;box-shadow:0 14px 30px #33415518}
    h1{font-size:18px;margin:0 0 8px}.muted{font-size:12px;line-height:1.45;color:#64748b}
    .stack{display:grid;gap:10px}.engine{border:1px solid #cbd5e1;border-radius:10px;padding:12px;background:#f8fafc}.engine strong{display:block;font-size:13px}.engine span{display:inline-block;margin-top:6px;border-radius:99px;padding:3px 8px;font-size:11px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c}
    .scene{position:relative;min-height:520px;overflow:hidden;border:1px solid #cbd5e1;border-radius:12px;background:linear-gradient(145deg,#dbe5ec,#f8fafc);perspective:900px}
    .room{position:absolute;left:17%;right:12%;top:19%;bottom:16%;transform:rotateX(58deg) rotateZ(-32deg);background:#dbe1e7;border:18px solid #7c8794;box-shadow:0 34px 75px #33415555}
    .grid{position:absolute;inset:0;background-image:linear-gradient(#94a3b855 1px,transparent 1px),linear-gradient(90deg,#94a3b855 1px,transparent 1px);background-size:32px 32px}.zone{position:absolute;left:18%;top:18%;width:58%;height:54%;border:3px dashed #059669;background:#10b9811f}
    .heat{position:absolute;left:32%;top:25%;width:38%;height:34%;border-radius:50%;background:radial-gradient(circle,#dc262670 0,#f9731647 38%,#facc1534 58%,transparent 74%)}.beam{position:absolute;left:53%;top:42%;width:34%;height:14%;background:linear-gradient(90deg,#dc262666,#f9731600);clip-path:polygon(0 38%,100% 0,100% 100%,0 62%)}.eq{position:absolute;left:43%;top:39%;width:16%;height:13%;background:#fff;border:2px solid #475569;border-radius:14px}
    .badge{position:absolute;background:#fffffff0;border:1px solid #cbd5e1;border-radius:9px;padding:8px 10px;font-size:12px;box-shadow:0 12px 24px #33415522}.b1{left:24px;top:24px}.b2{right:24px;top:24px}.b3{right:24px;bottom:24px}
    @media(max-width:820px){.wrap{grid-template-columns:1fr}.scene{min-height:420px}}
  </style>
</head>
<body>
  <div class="wrap">
    <aside class="panel">
      <h1>Estrategia 3D</h1>
      <p class="muted">Orden de implementacion: motor integrado primero, motor web robusto despues, Unity al final.</p>
      <div class="stack">
        <div class="engine"><strong>Three.js / R3F</strong><p class="muted">Activo en Medical 3D.</p><span>F307</span></div>
        <div class="engine"><strong>Babylon PBR/WebGPU/WebXR</strong><p class="muted">Adapter futuro con fallback.</p><span>F308</span></div>
        <div class="engine"><strong>Unity WebGL</strong><p class="muted">Visor externo pesado.</p><span>F309</span></div>
      </div>
    </aside>
    <main class="scene">
      <div class="room"><div class="grid"></div><div class="zone"></div><div class="heat"></div><div class="beam"></div><div class="eq"></div></div>
      <div class="badge b1">R3F activo<br><strong>snapshot + OBJ + JSON</strong></div>
      <div class="badge b2">Babylon adapter<br><strong>PBR/WebGPU/WebXR</strong></div>
      <div class="badge b3">Unity final<br><strong>externo / no regulatorio</strong></div>
    </main>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'f307_f309_3d_engine_strategy_preview.html'), previewHtml, 'utf8');

const gates = [
  { id: 'f301-f306-ready', pass: f301?.status === 'functional-release-close-ready', evidence: 'outputs/f301_f306_functional_release_close/f301_f306_functional_release_close.json' },
  { id: 'three-r3f-active', pass: strategy.includes("id: 'three-r3f'") && strategy.includes("status: 'active'") && dialog.includes("useState<Medical3DRenderEngine>('three-r3f')"), evidence: 'src/lib/medical3D/renderStrategy.ts + MedicalFloorPlan3DDialog.tsx' },
  { id: 'babylon-adapter-ready', pass: strategy.includes("id: 'babylon-pbr-webgpu-webxr'") && strategy.includes("status: 'adapter-ready'") && strategy.includes('WebGPU/WebXR'), evidence: 'src/lib/medical3D/renderStrategy.ts' },
  { id: 'unity-deferred-final', pass: strategy.includes("id: 'unity-webgl-external'") && strategy.includes("status: 'deferred'") && strategy.includes('Ultima opcion'), evidence: 'src/lib/medical3D/renderStrategy.ts' },
  { id: 'dialog-selector-export', pass: dialog.includes('f307-f309-render-engine-selector') && dialog.includes('handleExportEngineHandoff') && dialog.includes('Exportar handoff 3D'), evidence: 'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx' },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);
const payload = {
  schema: 'radshield-mx.f307-f309.3d-engine-release.v1',
  generatedAt: new Date().toISOString(),
  commitSha,
  worktreeClean: gitStatus.length === 0,
  status: blockers.length === 0 ? '3d-engine-release-ready' : '3d-engine-release-gated',
  phases,
  implementationDecision,
  gates,
  preview: {
    path: 'outputs/f307_f309_3d_engine_release/f307_f309_3d_engine_strategy_preview.html',
    sha256: sha256Text(previewHtml),
  },
  nextRecommendedPhase: 'Real operator run: publish refreshed dist only after loading a real plan and exporting Memoria IA/PDF/Evidence Pack.',
  blockers,
};

fs.writeFileSync(path.join(outDir, 'f307_f309_3d_engine_release.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_307_309_3d_engine_release.md'), [
  '# F307-F309 3D Engine Release',
  '',
  `Status: ${payload.status}`,
  `Commit: ${payload.commitSha}`,
  '',
  '## Gates',
  ...gates.map((gate) => `- ${gate.pass ? 'PASS' : 'FAIL'} ${gate.id}: ${gate.evidence}`),
  '',
  '## Decision',
  ...implementationDecision.rationale.map((item) => `- ${item}`),
  '',
  `Preview: ${payload.preview.path}`,
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({
  status: payload.status,
  gates: gates.map((gate) => `${gate.id}:${gate.pass ? 'pass' : 'fail'}`),
  blockers,
}, null, 2));

if (payload.status !== '3d-engine-release-ready') process.exit(1);
