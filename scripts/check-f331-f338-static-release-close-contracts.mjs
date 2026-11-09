import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { readMedical3DDialogSource } from './medical3d-dialog-source.mjs';

execFileSync(process.execPath, ['scripts/f331-f338-static-release-close.mjs'], { stdio: 'pipe' });

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file);
const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

const manifestPath = 'outputs/f331_f338_static_release_close/f331_f338_static_release_close.json';
const manifest = exists(manifestPath) ? JSON.parse(read(manifestPath)) : null;
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const dialog = readMedical3DDialogSource();

expect('manifest exists', Boolean(manifest));
if (manifest) {
  expect('schema matches', manifest.schema === 'radshield-mx.f331-f338.static-release-close.v1');
  expect('status ready', manifest.status === 'f331-f338-static-release-close-ready');
  expect('8 phases present', manifest.phases?.length === 8);
  for (const phase of ['F331', 'F332', 'F333', 'F334', 'F335', 'F336', 'F337', 'F338']) {
    expect(`${phase} ready`, manifest.phases?.some((item) => item.phase === phase && item.status === 'ready'));
  }
  expect('6 modality rows', manifest.modalityMatrix?.length === 6);
  expect('visual evidence present', manifest.visualEvidence?.every((item) => item.present && item.bytes > 1000));
  expect('release package present', manifest.releasePackage?.present && manifest.releasePackage?.bytes > 1000);
  expect('public URL present', String(manifest.publicDeployUrl).startsWith('https://'));
}

expect('3D export has visual evidence', dialog.includes('visualEvidence') && dialog.includes('sceneHash') && dialog.includes('assetPipeline'));
expect('package exposes prepare script', pkg.scripts?.['prepare:f331-f338:static-release-close'] === 'node scripts/f331-f338-static-release-close.mjs');
expect('package exposes test script', pkg.scripts?.['test:f331-f338:static-release-close'] === 'node scripts/check-f331-f338-static-release-close-contracts.mjs');
expect('docs updated', update.includes('F331-F338 Static release close') && changelog.includes('F331-F338') && versions.includes('F331-F338') && manual.includes('Addendum F331-F338'));

for (const file of [
  'outputs/f331_f338_static_release_close/f331_f338_static_release_close.json',
  'outputs/f331_f338_static_release_close/f331_f338_modality_visual_qa.csv',
  'outputs/f331_f338_static_release_close/radshield-mx-f338-static-release.zip',
  'outputs/fase_331_338_static_release_close.md',
]) {
  expect(`required output ${file}`, exists(file));
}

if (failures.length) {
  console.error('F331-F338 static release close contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F331-F338 static release close contracts passed.');
