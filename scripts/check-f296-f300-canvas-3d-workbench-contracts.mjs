import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f296_f300_canvas_3d_workbench/f296_f300_canvas_3d_workbench.json'));
const preview = read('outputs/f296_f300_canvas_3d_workbench/medical_3d_navigable_preview.html');
const sidebar = read('src/sections/Sidebar.tsx');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const pkg = JSON.parse(read('package.json'));

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F296-F300 ready', manifest.status === 'canvas-3d-workbench-ready');
expect('No blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
expect('All five phases documented', ['F296', 'F297', 'F298', 'F299', 'F300'].every((phase) => JSON.stringify(manifest.phases).includes(phase)));
expect('Sidebar visible bounded', sidebar.includes('const [collapsed, setCollapsed] = useState(false)') && sidebar.includes('const DEFAULT_SIDEBAR_WIDTH = 260') && sidebar.includes('const MAX_SIDEBAR_WIDTH = 300'));
expect('Preview is navigable', preview.includes('id="rot"') && preview.includes('id="tilt"') && preview.includes('updateCamera'));
expect('Preview includes medical 3D elements', ['Barrera primaria', 'LINAC footprint', 'Heatmap', 'GATE', 'EGSnrc', 'Geant4'].every((token) => preview.includes(token)));
expect('External runner contract complete', ['gate-opengate', 'egsnrc-egs-brachy', 'geant4-standalone', 'aps-oda-dwg'].every((token) => JSON.stringify(manifest.externalRunnerContract).includes(token)));
expect('Update Center documents F296-F300', update.includes('F296-F300 Canvas 3D workbench'));
expect('Changelog documents F296-F300', changelog.includes('F296-F300'));
expect('Version manual documents F296-F300', versions.includes('F296-F300'));
expect('User manual documents F296-F300', manual.includes('Addendum F296-F300'));
expect('Package scripts F296-F300', pkg.scripts?.['prepare:f296-f300:canvas-3d-workbench'] === 'node scripts/f296-f300-canvas-3d-workbench.mjs' && pkg.scripts?.['test:f296-f300:canvas-3d-workbench'] === 'node scripts/check-f296-f300-canvas-3d-workbench-contracts.mjs');

if (failures.length) {
  console.error('F296-F300 canvas 3D workbench contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F296-F300 canvas 3D workbench contracts passed.');
