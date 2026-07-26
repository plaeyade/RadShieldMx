import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f315_unity_external_viewer_bridge/f315_unity_external_viewer_bridge.json'));
const bridge = read('src/lib/medical3D/unityExternalViewerBridge.ts');
const handoff = read('src/lib/medical3D/unityWebglHandoff.ts');
const dialog = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F315 ready', manifest.status === 'unity-external-viewer-bridge-ready');
expect('No blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
expect('Launch packet builder', bridge.includes('buildUnityExternalViewerLaunchPacket'));
expect('Env URL supported', bridge.includes('VITE_MEDICAL_3D_UNITY_WEBGL_URL'));
expect('Fallback preserved', bridge.includes("fallbackEngine: 'three-r3f'"));
expect('Existing handoff reused', handoff.includes('buildUnityWebglHandoff'));
expect('Dialog bridge visible', dialog.includes('f315-unity-external-viewer-bridge'));
expect('Unity export action', dialog.includes('handleExportUnityHandoff') && dialog.includes('Unity JSON'));
expect('Unity launch action', dialog.includes('handleOpenUnityExternalViewer') && dialog.includes('Abrir Unity'));
expect('Package scripts F315', pkg.scripts?.['prepare:f315:unity-external-viewer-bridge'] === 'node scripts/f315-unity-external-viewer-bridge.mjs' && pkg.scripts?.['test:f315:unity-external-viewer-bridge'] === 'node scripts/check-f315-unity-external-viewer-bridge-contracts.mjs');
expect('Docs updated', update.includes('F315 Unity external viewer bridge') && changelog.includes('F315') && versions.includes('F315') && manual.includes('Addendum F315'));

if (failures.length) {
  console.error('F315 Unity external viewer bridge contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F315 Unity external viewer bridge contracts passed.');
