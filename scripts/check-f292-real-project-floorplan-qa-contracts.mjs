import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f292_real_project_floorplan_qa/f292_real_project_floorplan_qa.json'));
const csv = read('outputs/f292_real_project_floorplan_qa/f292_floorplan_operator_checklist.csv');
const source = read('src/lib/f292RealProjectFloorplanQa.ts');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');
const pkg = JSON.parse(read('package.json'));

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F292 ready', manifest.status === 'real-project-floorplan-qa-ready');
expect('All items ready', manifest.guardedCount === 0 && manifest.readyCount >= 7);
expect('Entry order includes scale and export', manifest.realProjectEntryOrder.some((item) => item.includes('Calibrate scale')) && manifest.realProjectEntryOrder.some((item) => item.includes('Export Memoria')));
expect('Renderer decision blocks high risk rewrite', manifest.highRiskRendererDecision.includes('Do not replace renderer base'));
expect('CSV includes plan import and panel controls', csv.includes('plan-import') && csv.includes('panel-controls'));
expect('Source exports builder', source.includes('buildF292RealProjectFloorplanQa') && source.includes('real-project-floorplan-qa'));
expect('Update Center documents F292', update.includes('F292 Real project floorplan QA'));
expect('Manual documents F292', manual.includes('Addendum F292'));
expect('Version manual documents F292', versions.includes('F292'));
expect('Changelog documents F292', changelog.includes('F292'));
expect('Package scripts F292', pkg.scripts?.['prepare:f292:real-project-floorplan-qa'] === 'node scripts/f292-real-project-floorplan-qa.mjs');

if (failures.length) {
  console.error('F292 real project floorplan QA contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F292 real project floorplan QA contracts passed.');
