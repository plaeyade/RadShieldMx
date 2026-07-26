import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f312_unity_external_handoff/f312_unity_external_handoff.json'));
const unity = read('src/lib/medical3D/unityWebglHandoff.ts');
const flags = read('src/lib/featureFlags.ts');
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F312 ready', manifest.status === 'unity-external-handoff-ready');
expect('No blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
expect('Unity contract exists', unity.includes('buildUnityWebglExternalViewerContract') && unity.includes('buildUnityWebglHandoff'));
expect('Unity is external only', unity.includes('iframe-or-new-tab') && unity.includes('Unity WebGL runs outside the main React bundle.'));
expect('Clinical source of truth protected', unity.includes('RadShield remains source of truth for calculations, citations, warnings and reports.'));
expect('Flags are explicit', flags.includes('medical3DUnityExternalViewer') && flags.includes('VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER') && flags.includes('VITE_MEDICAL_3D_UNITY_WEBGL_URL'));
expect('No Unity runtime installed', !JSON.stringify(pkg.dependencies || {}).toLowerCase().includes('unity') && !JSON.stringify(pkg.devDependencies || {}).toLowerCase().includes('unity'));
expect('Docs updated', update.includes('F312 Unity external handoff') && changelog.includes('F312') && versions.includes('F312') && manual.includes('Addendum F312'));
expect('Package scripts F312', pkg.scripts?.['prepare:f312:unity-external-handoff'] === 'node scripts/f312-unity-external-handoff.mjs' && pkg.scripts?.['test:f312:unity-external-handoff'] === 'node scripts/check-f312-unity-external-handoff-contracts.mjs');

if (failures.length) {
  console.error('F312 Unity external handoff contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F312 Unity external handoff contracts passed.');
