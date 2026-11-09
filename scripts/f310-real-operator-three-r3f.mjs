import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readMedical3DDialogSource } from './medical3d-dialog-source.mjs';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f310_real_operator_trial_three_r3f');
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
const f200 = readJson('outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json');
const f294 = readJson('outputs/f294_real_guided_smoke/f294_real_guided_smoke.json');
const f307 = readJson('outputs/f307_f309_3d_engine_release/f307_f309_3d_engine_release.json');
const commitSha = git(['rev-parse', 'HEAD']);
const gitStatus = git(['status', '--short']);

const operatorRunSteps = [
  'Abrir el dist o URL publica vigente y confirmar menus/canvas visibles.',
  'Crear un proyecto nuevo o cargar un plano real aprobado para prueba.',
  'Calibrar escala del plano y confirmar unidades antes de medir barreras.',
  'Sembrar o validar equipo clinico: LINAC, CT, PET, Gamma Knife, HDR o ciclotron.',
  'Asignar materiales con TVL/densidad/peso/costo/fuente documental.',
  'Ejecutar calculo de blindaje y revisar advertencias clinicas.',
  'Abrir Medical 3D Floor Plan y mantener Three.js/R3F como motor activo.',
  'Revisar espesores, zona controlada, equipo, heatmap y recorrido visual.',
  'Exportar snapshot, OBJ, JSON de escena y handoff 3D.',
  'Generar Memoria IA, PDF y Evidence Pack con citas, inputs, outputs y hash.',
  'Registrar desviaciones antes de autorizar Babylon, Unity o deploy final.',
];

const futureEngineInstallLane = [
  {
    engine: 'Babylon.js',
    timing: 'Despues del ensayo operativo F310 y antes de Unity.',
    approach: 'Rama aislada o flag de engine, dynamic import, fallback automatico a Three/R3F, smoke visual y presupuesto de bundle.',
    risk: 'Medio: agrega peso y cambia runtime grafico, pero es web-native.',
  },
  {
    engine: 'Unity WebGL',
    timing: 'Al final del release grafico, nunca como sustituto inmediato del canvas clinico.',
    approach: 'Proyecto Unity separado, build WebGL externo, iframe/bridge JSON-GLTF, headers de compresion y solo rol de inspeccion visual.',
    risk: 'Alto: build pesado, toolchain externo y mas puntos de falla.',
  },
];

const gates = [
  {
    id: 'f307-f309-ready',
    pass: f307?.status === '3d-engine-release-ready',
    evidence: 'outputs/f307_f309_3d_engine_release/f307_f309_3d_engine_release.json',
  },
  {
    id: 'three-r3f-default-runtime',
    pass: strategy.includes("id: 'three-r3f'") && strategy.includes("status: 'active'") && dialog.includes("useState<Medical3DRenderEngine>('three-r3f')"),
    evidence: 'src/lib/medical3D/renderStrategy.ts + src/sections/dialogs/MedicalFloorPlan3DDialog.tsx',
  },
  {
    id: 'operator-export-paths',
    pass: dialog.includes('handleSnapshot') && dialog.includes('handleExportOBJ') && dialog.includes('handleExportReviewJSON') && dialog.includes('handleExportEngineHandoff') && dialog.includes('Exportar handoff 3D'),
    evidence: 'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx',
  },
  {
    id: 'real-guided-smoke-available',
    pass: Boolean(f294?.status),
    evidence: 'outputs/f294_real_guided_smoke/f294_real_guided_smoke.json',
  },
  {
    id: 'static-release-gate-available',
    pass: Boolean(f200?.status),
    evidence: 'outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json',
  },
  {
    id: 'no-new-runtime-engine-install',
    pass: !read('package.json').includes('"@babylonjs/core"') && !read('package.json').includes('"unity-webgl"'),
    evidence: 'package.json',
  },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);
const checklistCsv = [
  'step,status,owner,evidence',
  ...operatorRunSteps.map((step, index) => `"${index + 1}","pending-operator-run","fisico-medico/QA","${step.replaceAll('"', '""')}"`),
].join('\n');

fs.writeFileSync(path.join(outDir, 'f310_operator_checklist.csv'), `${checklistCsv}\n`, 'utf8');

const payload = {
  schema: 'radshield-mx.f310.real-operator-three-r3f.v1',
  generatedAt: new Date().toISOString(),
  commitSha,
  worktreeClean: gitStatus.length === 0,
  status: blockers.length === 0 ? 'real-operator-three-r3f-ready' : 'real-operator-three-r3f-gated',
  scope: 'Preparar el primer ensayo operativo real con Three/R3F activo, sin instalar Babylon ni Unity todavia.',
  operatorRunSteps,
  futureEngineInstallLane,
  gates,
  checklist: {
    path: 'outputs/f310_real_operator_trial_three_r3f/f310_operator_checklist.csv',
    sha256: sha256Text(checklistCsv),
  },
  nextRecommendedPhase: 'Ejecutar prueba con un proyecto real y capturas; instalar Babylon solo si F310 pasa sin regresiones.',
  blockers,
};

fs.writeFileSync(path.join(outDir, 'f310_real_operator_trial_three_r3f.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_310_real_operator_three_r3f.md'), [
  '# F310 Real Operator Trial Three/R3F',
  '',
  `Status: ${payload.status}`,
  `Commit: ${payload.commitSha}`,
  '',
  '## Gates',
  ...gates.map((gate) => `- ${gate.pass ? 'PASS' : 'FAIL'} ${gate.id}: ${gate.evidence}`),
  '',
  '## Checklist operativo',
  ...operatorRunSteps.map((step, index) => `${index + 1}. ${step}`),
  '',
  '## Motores futuros',
  ...futureEngineInstallLane.map((item) => `- ${item.engine}: ${item.timing} ${item.approach}`),
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({
  status: payload.status,
  gates: gates.map((gate) => `${gate.id}:${gate.pass ? 'pass' : 'fail'}`),
  blockers,
}, null, 2));

if (payload.status !== 'real-operator-three-r3f-ready') process.exit(1);
