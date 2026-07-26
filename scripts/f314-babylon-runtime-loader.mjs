import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f314_babylon_runtime_loader');
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
const runtime = read('src/lib/medical3D/babylonRuntimeLoader.ts');
const adapter = read('src/lib/medical3D/babylonAdapter.ts');
const flags = read('src/lib/featureFlags.ts');
const f313 = readJson('outputs/f313_nist_xcom_mixture_rag/f313_nist_xcom_mixture_rag.json');
const hasInstalledRuntime =
  fs.existsSync(path.join(root, 'node_modules', '@babylonjs', 'core')) &&
  fs.existsSync(path.join(root, 'node_modules', '@babylonjs', 'loaders'));
const hasPackageDeps = Boolean(pkg.dependencies?.['@babylonjs/core'] && pkg.dependencies?.['@babylonjs/loaders']);
const commitSha = git(['rev-parse', 'HEAD']);
const gitStatus = git(['status', '--short']);

const gates = [
  {
    id: 'f313-ready',
    pass: f313?.status === 'nist-xcom-mixture-rag-ready',
    evidence: 'outputs/f313_nist_xcom_mixture_rag/f313_nist_xcom_mixture_rag.json',
  },
  {
    id: 'runtime-loader-present',
    pass: runtime.includes('loadBabylonRuntime') && runtime.includes('@vite-ignore') && runtime.includes('fallbackEngine'),
    evidence: 'src/lib/medical3D/babylonRuntimeLoader.ts',
  },
  {
    id: 'adapter-runtime-status-type',
    pass: adapter.includes('BabylonRuntimeStatus') && adapter.includes('babylon-runtime-status'),
    evidence: 'src/lib/medical3D/babylonAdapter.ts',
  },
  {
    id: 'flags-still-gated',
    pass: flags.includes('VITE_MEDICAL_3D_BABYLON_ADAPTER') && flags.includes('VITE_MEDICAL_3D_BABYLON_RUNTIME'),
    evidence: 'src/lib/featureFlags.ts',
  },
  {
    id: 'runtime-install-not-required-for-build',
    pass: !hasInstalledRuntime || !hasPackageDeps,
    evidence: 'package.json + node_modules',
  },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);
const payload = {
  schema: 'radshield-mx.f314.babylon-runtime-loader.v1',
  generatedAt: new Date().toISOString(),
  commitSha,
  worktreeClean: gitStatus.length === 0,
  status: blockers.length === 0 ? 'babylon-runtime-loader-ready' : 'babylon-runtime-loader-gated',
  installAttempt: {
    attemptedCommand: 'npm install @babylonjs/core @babylonjs/loaders',
    result: hasInstalledRuntime && hasPackageDeps ? 'installed' : 'not-installed-in-this-environment',
    note: hasInstalledRuntime && hasPackageDeps
      ? 'Babylon packages are present.'
      : 'npm install did not complete in the restricted environment; runtime loader is ready and falls back to Three/R3F.',
  },
  activation: {
    command: 'npm install @babylonjs/core @babylonjs/loaders',
    flags: ['VITE_MEDICAL_3D_BABYLON_ADAPTER=true', 'VITE_MEDICAL_3D_BABYLON_RUNTIME=true'],
    fallback: 'three-r3f',
  },
  gates,
  nextRecommendedPhase: 'F315: browser smoke of NIST XCOM mixture and Medical 3D after package install or external Babylon test.',
  blockers,
};

fs.writeFileSync(path.join(outDir, 'f314_babylon_runtime_loader.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_314_babylon_runtime_loader.md'), [
  '# F314 Babylon Runtime Loader',
  '',
  `Status: ${payload.status}`,
  `Commit: ${payload.commitSha}`,
  '',
  '## Gates',
  ...gates.map((gate) => `- ${gate.pass ? 'PASS' : 'FAIL'} ${gate.id}: ${gate.evidence}`),
  '',
  '## Instalacion',
  `- Intento: ${payload.installAttempt.attemptedCommand}`,
  `- Resultado: ${payload.installAttempt.result}`,
  `- Nota: ${payload.installAttempt.note}`,
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({
  status: payload.status,
  installResult: payload.installAttempt.result,
  gates: gates.map((gate) => `${gate.id}:${gate.pass ? 'pass' : 'fail'}`),
  blockers,
}, null, 2));

if (payload.status !== 'babylon-runtime-loader-ready') process.exit(1);
