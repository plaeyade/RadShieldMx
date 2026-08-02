import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const unityDir = path.join(root, 'public', 'unity', 'radshield-medical-3d');
const buildDir = path.join(unityDir, 'Build');
const templateDir = path.join(unityDir, 'TemplateData');

function listSafe(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).map((entry) => entry.name);
}

const buildFiles = listSafe(buildDir);
const requiredBuildPatterns = [
  { id: 'index-html', pass: fs.existsSync(path.join(unityDir, 'index.html')), expected: 'index.html' },
  { id: 'loader-js', pass: buildFiles.some((file) => file.endsWith('.loader.js')), expected: 'Build/*.loader.js' },
  { id: 'framework-js', pass: buildFiles.some((file) => file.endsWith('.framework.js') || file.endsWith('.framework.js.gz') || file.endsWith('.framework.js.br')), expected: 'Build/*.framework.js' },
  { id: 'data', pass: buildFiles.some((file) => file.endsWith('.data') || file.endsWith('.data.gz') || file.endsWith('.data.br')), expected: 'Build/*.data' },
  { id: 'wasm', pass: buildFiles.some((file) => file.endsWith('.wasm') || file.endsWith('.wasm.gz') || file.endsWith('.wasm.br')), expected: 'Build/*.wasm' },
  { id: 'template-data', pass: fs.existsSync(templateDir), expected: 'TemplateData/*' },
];

const markerChecks = [
  ['src/lib/medical3D/unityWebglExportedBuild.ts', 'radshield-mx.medical3d.unity-webgl-exported-build.f475-f478.v1'],
  ['src/lib/medical3D/unityWebglExportedBuild.ts', 'VITE_MEDICAL_3D_UNITY_LOCAL_BUILD'],
  ['src/lib/medical3D/unityWebglExportedBuild.ts', 'public/unity/radshield-medical-3d'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f475-f478-unity-webgl-exported-build'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f476-unity-webgl-iframe'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f477-unity-case-bridge'],
  ['e2e/f475-f478-unity-webgl-exported-build.spec.ts', 'f475-f478-unity-webgl-exported-build'],
  ['CHANGELOG.md', 'F475-F478'],
  ['MANUAL_VERSIONES_v50.md', 'F475-F478'],
  ['MANUAL_USUARIO_v99.md', 'F475-F478'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F475-F478 Unity WebGL real'],
  ['package.json', 'prepare:f475-f478:unity-webgl'],
  ['package.json', 'test:f475-f478:unity-webgl'],
  ['package.json', 'test:f475-f478:unity-webgl:e2e'],
];

const markerFailures = [];
for (const [relativePath, marker] of markerChecks) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    markerFailures.push(`${relativePath}: missing file`);
    continue;
  }
  const text = fs.readFileSync(fullPath, 'utf8');
  if (!text.includes(marker)) markerFailures.push(`${relativePath}: missing marker "${marker}"`);
}

const liveBuildReady = requiredBuildPatterns.every((item) => item.pass);
const outputDir = path.join(root, 'outputs', 'f475_f478_unity_webgl_exported_build');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, 'f475_f478_unity_webgl_exported_build_audit.json'),
  `${JSON.stringify({
    schema: 'radshield-mx.f475-f478.unity-webgl-exported-build-audit.v1',
    generatedAt: new Date().toISOString(),
    status: markerFailures.length ? 'failed' : liveBuildReady ? 'unity-build-live-ready' : 'unity-build-folder-prepared',
    unityFolder: path.relative(root, unityDir).replace(/\\/g, '/'),
    buildFiles,
    requiredBuildPatterns,
    markerChecks: markerChecks.map(([relativePath, marker]) => ({ relativePath, marker })),
    markerFailures,
    releaseRule: 'If liveBuildReady is false, Unity support is integrated but not a live embedded Unity viewer yet. Copy the real exported build before claiming Unity runtime.',
  }, null, 2)}\n`,
  'utf8',
);

if (markerFailures.length) {
  console.error('F475-F478 Unity WebGL exported build audit failed:');
  for (const failure of markerFailures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(liveBuildReady ? 'F475-F478 Unity WebGL live build ready.' : 'F475-F478 Unity WebGL folder prepared; real Unity export still missing.');
