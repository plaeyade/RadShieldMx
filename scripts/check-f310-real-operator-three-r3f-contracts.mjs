import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f310_real_operator_trial_three_r3f/f310_real_operator_trial_three_r3f.json'));
const checklist = read('outputs/f310_real_operator_trial_three_r3f/f310_operator_checklist.csv');
const strategy = read('src/lib/medical3D/renderStrategy.ts');
const dialog = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F310 ready', manifest.status === 'real-operator-three-r3f-ready');
expect('No blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
expect('Operator checklist covers real flow', checklist.includes('Calibrar escala') && checklist.includes('Memoria IA') && checklist.includes('Evidence Pack'));
expect('Three remains active default', strategy.includes("id: 'three-r3f'") && dialog.includes("useState<Medical3DRenderEngine>('three-r3f')"));
expect('Babylon and Unity are staged, not installed', manifest.futureEngineInstallLane.some((item) => item.engine === 'Babylon.js') && manifest.futureEngineInstallLane.some((item) => item.engine === 'Unity WebGL') && manifest.gates.some((gate) => gate.id === 'no-new-runtime-engine-install' && gate.pass));
expect('Exports remain wired', dialog.includes('handleSnapshot') && dialog.includes('handleExportOBJ') && dialog.includes('handleExportReviewJSON') && dialog.includes('handleExportEngineHandoff') && dialog.includes('Exportar handoff 3D'));
expect('Docs updated', update.includes('F310 Real operator Three/R3F') && changelog.includes('F310') && versions.includes('F310') && manual.includes('Addendum F310'));
expect('Package scripts F310', pkg.scripts?.['prepare:f310:real-operator-three-r3f'] === 'node scripts/f310-real-operator-three-r3f.mjs' && pkg.scripts?.['test:f310:real-operator-three-r3f'] === 'node scripts/check-f310-real-operator-three-r3f-contracts.mjs');

if (failures.length) {
  console.error('F310 real operator Three/R3F contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F310 real operator Three/R3F contracts passed.');
