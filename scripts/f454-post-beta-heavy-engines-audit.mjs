import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  ['src/lib/f454PostBetaHeavyEngines.ts', 'radshield-mx.f454.post-beta-heavy-engines.v1'],
  ['src/lib/f454PostBetaHeavyEngines.ts', 'Three/R3F estable'],
  ['src/lib/f454PostBetaHeavyEngines.ts', 'Babylon real PBR/WebGPU/WebXR'],
  ['src/lib/f454PostBetaHeavyEngines.ts', 'Unity WebGL avanzado'],
  ['src/lib/f454PostBetaHeavyEngines.ts', 'Fotorrealismo pesado'],
  ['src/lib/f454PostBetaHeavyEngines.ts', 'F455 Babylon local dependency probe'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F454 Post-beta heavy engines'],
  ['CHANGELOG.md', 'F454'],
  ['MANUAL_VERSIONES_v50.md', 'F454'],
  ['MANUAL_USUARIO_v99.md', 'F454'],
  ['package.json', 'prepare:f454:post-beta-engines'],
  ['package.json', 'test:f454:post-beta-engines'],
];

const failures = [];

for (const [relativePath, marker] of checks) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${relativePath}: missing file`);
    continue;
  }
  const text = fs.readFileSync(fullPath, 'utf8');
  if (!text.includes(marker)) failures.push(`${relativePath}: missing marker "${marker}"`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const dependencies = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const probe = {
  schema: 'radshield-mx.f454.local-dependency-probe.v1',
  generatedAt: new Date().toISOString(),
  packageJson: {
    babylonCore: dependencies['@babylonjs/core'] || null,
    babylonLoaders: dependencies['@babylonjs/loaders'] || null,
    reactUnityWebgl: dependencies['react-unity-webgl'] || null,
  },
  nodeModules: {
    babylonCoreLocal: fs.existsSync(path.join(root, 'node_modules', '@babylonjs', 'core')),
    babylonLoadersLocal: fs.existsSync(path.join(root, 'node_modules', '@babylonjs', 'loaders')),
    unityPackageLocal: fs.existsSync(path.join(root, 'node_modules', 'react-unity-webgl')),
  },
  recommendation:
    'Para empaquetar Babylon/Unity en Vite, instalar dependencias en este repo o configurar Unity como URL externa. Three/R3F sigue como fallback estable.',
};

const outputDir = path.join(root, 'outputs', 'f454_post_beta_heavy_engines');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'f454_local_dependency_probe.json'), `${JSON.stringify(probe, null, 2)}\n`, 'utf8');

if (failures.length) {
  console.error('F454 post-beta heavy engines audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F454 post-beta heavy engines audit passed.');
