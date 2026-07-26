import fs from 'node:fs';
import crypto from 'node:crypto';

const outDir = 'outputs/f316_babylon_install_diagnostics';
fs.mkdirSync(outDir, { recursive: true });

const exists = (path) => fs.existsSync(path);
const read = (path) => exists(path) ? fs.readFileSync(path, 'utf8') : '';
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');

const packageJson = JSON.parse(read('package.json'));
const packageText = JSON.stringify(packageJson, null, 2);
const runtime = read('src/lib/medical3D/babylonRuntimeLoader.ts');
const adapter = read('src/lib/medical3D/babylonAdapter.ts');

const hasCore = exists('node_modules/@babylonjs/core');
const hasLoaders = exists('node_modules/@babylonjs/loaders');
const packageDeclaresBabylon = packageText.includes('@babylonjs/core') || packageText.includes('@babylonjs/loaders');

const manifest = {
  schema: 'radshield-mx.phase-manifest.v1',
  phase: 'F316',
  title: 'Babylon dependency activation diagnostics',
  status: hasCore && hasLoaders ? 'babylon-packages-installed' : 'babylon-install-blocked-by-npm-fetch',
  generatedAt: new Date().toISOString(),
  packageState: {
    declaresBabylonDependencies: packageDeclaresBabylon,
    nodeModulesCorePresent: hasCore,
    nodeModulesLoadersPresent: hasLoaders,
  },
  observedFailure: hasCore && hasLoaders ? null : {
    command: 'npm install @babylonjs/core @babylonjs/loaders --fetch-timeout=15000 --fetch-retries=0 --prefer-online --cache .npm-cache-babylon',
    errorCode: 'EACCES',
    failingEndpointPattern: 'https://registry.npmjs.org/*',
    interpretation:
      'npm can write a local cache log, but outbound package fetches are rejected by the environment/OS/network policy. Babylon runtime remains staged but not installed.',
  },
  stableFallback: {
    activeEngine: 'three-r3f',
    loaderPresent: runtime.includes('loadBabylonRuntime'),
    adapterPresent: adapter.includes('buildBabylonAdapterContract'),
    fallbackRequired: runtime.includes("fallbackEngine: 'three-r3f'"),
  },
  activationChecklist: [
    'Confirm PowerShell can reach https://registry.npmjs.org/@babylonjs%2fcore without EACCES.',
    'Run npm install using a writable cache, e.g. npm install @babylonjs/core @babylonjs/loaders --cache .npm-cache-babylon.',
    'Verify package.json and lockfile include @babylonjs/core and @babylonjs/loaders.',
    'Run npm run test:f314:babylon-runtime-loader and npm run build.',
    'Run a visual smoke in Medical 3D with Three/R3F fallback still available.',
  ],
  fileHashes: {
    packageJson: hash(packageText),
    babylonRuntimeLoader: hash(runtime),
    babylonAdapter: hash(adapter),
  },
  blockers: hasCore && hasLoaders ? [] : ['npm-registry-fetch-eacces'],
};

fs.writeFileSync(`${outDir}/f316_babylon_install_diagnostics.json`, JSON.stringify(manifest, null, 2));
fs.writeFileSync(
  'outputs/fase_316_babylon_install_diagnostics.md',
  `# F316 - Babylon install diagnostics\n\nStatus: ${manifest.status}\n\nBabylon runtime sigue preparado. La instalacion de paquetes queda bloqueada por EACCES al registry npm, no por el codigo del visor.\n`,
);

console.log(`F316 manifest written to ${outDir}/f316_babylon_install_diagnostics.json`);
