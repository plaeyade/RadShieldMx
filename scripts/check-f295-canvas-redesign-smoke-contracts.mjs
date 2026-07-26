import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f295_canvas_redesign_smoke/f295_canvas_redesign_smoke.json'));
const preview = read('outputs/f295_canvas_redesign_smoke/f295_medical_3d_preview.html');
const toolbar = read('src/sections/Toolbar.tsx');
const canvas = read('src/sections/CanvasArea.tsx');
const sidebar = read('src/sections/CanvasQuickActionsSidebar.tsx');
const mainSidebar = read('src/sections/Sidebar.tsx');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');
const pkg = JSON.parse(read('package.json'));

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F295 ready', manifest.status === 'canvas-redesign-smoke-ready');
expect('No blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
expect('Primary file menu before design', toolbar.indexOf('f295-primary-file-dropdown') > -1 && toolbar.indexOf('f295-primary-file-dropdown') < toolbar.indexOf('f96-migrated-design-dropdown'));
expect('Legacy menu hidden', toolbar.includes('data-testid="f114-deduped-legacy-menu-zone" className="hidden"'));
expect('Canvas clean storage key', canvas.includes('radshield_canvas_panels_f188_f295_clean_workspace'));
expect('Canvas clean defaults', canvas.includes('workflow: false') && canvas.includes('qa: false') && canvas.includes('continuity: false'));
expect('Quick sidebar collapsed by default', sidebar.includes('useState(true)'));
expect('Main sidebar visible by default and bounded', mainSidebar.includes('const [collapsed, setCollapsed] = useState(false)') && mainSidebar.includes('const DEFAULT_SIDEBAR_WIDTH = 260') && mainSidebar.includes('const MAX_SIDEBAR_WIDTH = 300'));
expect('Preview includes 3D concepts', preview.includes('Inspeccion 3D') && preview.includes('Barrera primaria') && preview.includes('GATE, EGSnrc, Geant4'));
expect('External engines listed', ['GATE / OpenGATE', 'EGSnrc / egs_brachy', 'Geant4 standalone', 'APS/ODA DWG conversion'].every((engine) => JSON.stringify(manifest).includes(engine)));
expect('Update Center documents F295', update.includes('F295 Canvas redesign smoke'));
expect('Manual documents F295', manual.includes('Addendum F295'));
expect('Version manual documents F295', versions.includes('F295'));
expect('Changelog documents F295', changelog.includes('F295'));
expect('Package scripts F295', pkg.scripts?.['prepare:f295:canvas-redesign-smoke'] === 'node scripts/f295-canvas-redesign-smoke.mjs' && pkg.scripts?.['test:f295:canvas-redesign-smoke'] === 'node scripts/check-f295-canvas-redesign-smoke-contracts.mjs');

if (failures.length) {
  console.error('F295 canvas redesign smoke contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F295 canvas redesign smoke contracts passed.');
