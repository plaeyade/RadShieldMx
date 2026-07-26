import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f311_babylon_safe_adapter');
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
const adapter = read('src/lib/medical3D/babylonAdapter.ts');
const flags = read('src/lib/featureFlags.ts');
const strategy = read('src/lib/medical3D/renderStrategy.ts');
const f310 = readJson('outputs/f310_real_operator_trial_three_r3f/f310_real_operator_trial_three_r3f.json');
const commitSha = git(['rev-parse', 'HEAD']);
const gitStatus = git(['status', '--short']);

const gates = [
  {
    id: 'f310-ready',
    pass: f310?.status === 'real-operator-three-r3f-ready',
    evidence: 'outputs/f310_real_operator_trial_three_r3f/f310_real_operator_trial_three_r3f.json',
  },
  {
    id: 'babylon-contract-without-runtime-import',
    pass:
      adapter.includes('buildBabylonAdapterContract') &&
      adapter.includes('requiredPackages') &&
      adapter.includes('@babylonjs/core') &&
      !adapter.includes("from '@babylonjs/core'") &&
      !adapter.includes('from "@babylonjs/core"'),
    evidence: 'src/lib/medical3D/babylonAdapter.ts',
  },
  {
    id: 'feature-flags-off-by-default',
    pass:
      flags.includes('medical3DBabylonAdapter') &&
      flags.includes('VITE_MEDICAL_3D_BABYLON_ADAPTER') &&
      flags.includes('VITE_MEDICAL_3D_BABYLON_RUNTIME'),
    evidence: 'src/lib/featureFlags.ts',
  },
  {
    id: 'no-babylon-runtime-installed',
    pass: !pkg.dependencies?.['@babylonjs/core'] && !pkg.devDependencies?.['@babylonjs/core'],
    evidence: 'package.json',
  },
  {
    id: 'three-remains-default',
    pass: strategy.includes("id: 'three-r3f'") && strategy.includes("status: 'active'"),
    evidence: 'src/lib/medical3D/renderStrategy.ts',
  },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);
const payload = {
  schema: 'radshield-mx.f311.babylon-safe-adapter.v1',
  generatedAt: new Date().toISOString(),
  commitSha,
  worktreeClean: gitStatus.length === 0,
  status: blockers.length === 0 ? 'babylon-safe-adapter-ready' : 'babylon-safe-adapter-gated',
  installPolicy: {
    now: 'No instalar paquetes Babylon en el release estable.',
    later: 'Instalar @babylonjs/core y @babylonjs/loaders solo en rama/flag con smoke visual y fallback a Three/R3F.',
    command: 'npm install @babylonjs/core @babylonjs/loaders',
  },
  gates,
  nextRecommendedPhase: 'F312: Unity WebGL external handoff contract, sin instalar Unity en el frontend.',
  blockers,
};

fs.writeFileSync(path.join(outDir, 'f311_babylon_safe_adapter.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_311_babylon_safe_adapter.md'), [
  '# F311 Babylon Safe Adapter',
  '',
  `Status: ${payload.status}`,
  `Commit: ${payload.commitSha}`,
  '',
  '## Gates',
  ...gates.map((gate) => `- ${gate.pass ? 'PASS' : 'FAIL'} ${gate.id}: ${gate.evidence}`),
  '',
  '## Politica de instalacion',
  `- Ahora: ${payload.installPolicy.now}`,
  `- Despues: ${payload.installPolicy.later}`,
  `- Comando futuro: ${payload.installPolicy.command}`,
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({
  status: payload.status,
  gates: gates.map((gate) => `${gate.id}:${gate.pass ? 'pass' : 'fail'}`),
  blockers,
}, null, 2));

if (payload.status !== 'babylon-safe-adapter-ready') process.exit(1);
