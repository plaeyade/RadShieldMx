import { existsSync, readFileSync } from 'node:fs';

const files = {
  f385: 'scripts/f385-production-capability-audit.mjs',
  f386: 'scripts/f386-three-unity-productive-smoke.mjs',
  f385Report: 'outputs/f385_production_capability_audit/f385_production_capability_audit.json',
  f386Report: 'outputs/f386_three_unity_smoke/f386_three_unity_smoke.json',
  medical3D: 'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx',
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
};

const read = (file) => readFileSync(file, 'utf8');

const checks = [
  [files.f385, 'babylonCanBeInstalledHere', 'F385 audits Babylon installation reality'],
  [files.f385, 'Only Three/R3F Medical 3D is an active production visualization path', 'F385 prevents overclaims'],
  [files.f386, 'F386_REQUIRE_UNITY_LIVE', 'F386 supports strict Unity live gate'],
  [files.f386, 'three-ready-unity-gated', 'F386 can pass Three while gating Unity'],
  [files.medical3D, 'f385-f386-productive-capability-gate', 'Medical 3D shows productive capability gate'],
  [files.medical3D, 'Three/R3F productivo', 'Medical 3D labels Three as productive'],
  [files.medical3D, 'Babylon no instalado', 'Medical 3D labels Babylon honestly'],
  [files.medical3D, 'Unity URL', 'Medical 3D labels Unity URL gate'],
  [files.packageJson, 'prepare:f385:production-capability-audit', 'Package exposes F385 prepare'],
  [files.packageJson, 'prepare:f386:three-unity-smoke', 'Package exposes F386 prepare'],
  [files.packageJson, 'test:f385-f386:productive-capabilities', 'Package exposes F385/F386 test'],
  [files.changelog, 'F385', 'Changelog includes F385'],
  [files.changelog, 'F386', 'Changelog includes F386'],
  [files.versions, 'F385-F386', 'Version manual includes F385-F386'],
  [files.manual, 'Addendum F385-F386', 'User manual includes F385-F386'],
  [files.update, 'F385-F386 Productive 3D gate', 'Update Center includes F385/F386'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

for (const report of [files.f385Report, files.f386Report]) {
  if (!existsSync(report)) {
    failures.push([report, 'exists', `${report} generated`]);
  }
}

if (existsSync(files.f385Report)) {
  const manifest = JSON.parse(read(files.f385Report));
  if (!manifest.summary?.productionReady?.includes('three-r3f-medical-3d')) {
    failures.push([files.f385Report, 'three-r3f-medical-3d productionReady', 'F385 marks Three/R3F as production visual path']);
  }
  if (!manifest.summary?.gated?.includes('babylon-runtime')) {
    failures.push([files.f385Report, 'babylon-runtime gated', 'F385 does not overclaim Babylon']);
  }
}

if (existsSync(files.f386Report)) {
  const manifest = JSON.parse(read(files.f386Report));
  if (manifest.threeR3F?.status !== 'production-visual-path-ready') {
    failures.push([files.f386Report, 'production-visual-path-ready', 'F386 validates Three/R3F path']);
  }
}

if (failures.length) {
  console.error('F385-F386 productive capability contract failures:');
  for (const [file, needle, label] of failures) {
    console.error(`- ${label}: missing "${needle}" in ${file}`);
  }
  process.exit(1);
}

console.log(`F385-F386 productive capabilities contracts OK (${checks.length + 4} checks).`);
