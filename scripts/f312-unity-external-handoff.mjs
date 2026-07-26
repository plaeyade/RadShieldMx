import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f312_unity_external_handoff');
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

const pkg = JSON.parse(read('package.json'));
const unity = read('src/lib/medical3D/unityWebglHandoff.ts');
const flags = read('src/lib/featureFlags.ts');
const strategy = read('src/lib/medical3D/renderStrategy.ts');
const f311 = readJson('outputs/f311_babylon_safe_adapter/f311_babylon_safe_adapter.json');
const commitSha = git(['rev-parse', 'HEAD']);
const gitStatus = git(['status', '--short']);

const gates = [
  {
    id: 'f311-ready',
    pass: f311?.status === 'babylon-safe-adapter-ready',
    evidence: 'outputs/f311_babylon_safe_adapter/f311_babylon_safe_adapter.json',
  },
  {
    id: 'unity-contract-external-only',
    pass: unity.includes('buildUnityWebglExternalViewerContract') && unity.includes('iframe-or-new-tab') && unity.includes('RadShield remains source of truth'),
    evidence: 'src/lib/medical3D/unityWebglHandoff.ts',
  },
  {
    id: 'unity-flag-url-gated',
    pass: flags.includes('medical3DUnityExternalViewer') && flags.includes('VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER') && flags.includes('VITE_MEDICAL_3D_UNITY_WEBGL_URL'),
    evidence: 'src/lib/featureFlags.ts',
  },
  {
    id: 'no-unity-runtime-installed',
    pass: !JSON.stringify(pkg.dependencies || {}).toLowerCase().includes('unity') && !JSON.stringify(pkg.devDependencies || {}).toLowerCase().includes('unity'),
    evidence: 'package.json',
  },
  {
    id: 'three-remains-fallback',
    pass: strategy.includes("id: 'three-r3f'") && strategy.includes("status: 'active'") && unity.includes('Three/R3F remains the fallback'),
    evidence: 'src/lib/medical3D/renderStrategy.ts + unityWebglHandoff.ts',
  },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);
const payload = {
  schema: 'radshield-mx.f312.unity-external-handoff.v1',
  generatedAt: new Date().toISOString(),
  commitSha,
  worktreeClean: gitStatus.length === 0,
  status: blockers.length === 0 ? 'unity-external-handoff-ready' : 'unity-external-handoff-gated',
  policy: {
    now: 'No instalar Unity dentro del frontend. Solo preparar contrato externo.',
    later: 'Crear proyecto Unity separado, compilar WebGL, publicar URL y activar flag tras smoke visual.',
    flags: ['VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER', 'VITE_MEDICAL_3D_UNITY_WEBGL_URL'],
  },
  gates,
  nextRecommendedPhase: 'F313: smoke visual Three/R3F con proyecto real antes de instalar Babylon.',
  blockers,
};

fs.writeFileSync(path.join(outDir, 'f312_unity_external_handoff.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_312_unity_external_handoff.md'), [
  '# F312 Unity External Handoff',
  '',
  `Status: ${payload.status}`,
  `Commit: ${payload.commitSha}`,
  '',
  '## Gates',
  ...gates.map((gate) => `- ${gate.pass ? 'PASS' : 'FAIL'} ${gate.id}: ${gate.evidence}`),
  '',
  '## Politica',
  `- Ahora: ${payload.policy.now}`,
  `- Despues: ${payload.policy.later}`,
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({
  status: payload.status,
  gates: gates.map((gate) => `${gate.id}:${gate.pass ? 'pass' : 'fail'}`),
  blockers,
}, null, 2));

if (payload.status !== 'unity-external-handoff-ready') process.exit(1);
