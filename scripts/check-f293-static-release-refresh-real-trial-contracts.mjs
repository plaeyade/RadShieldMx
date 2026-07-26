import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f293_static_release_refresh_real_trial/f293_static_release_refresh_real_trial.json'));
const csv = read('outputs/f293_static_release_refresh_real_trial/f293_real_trial_operator_protocol.csv');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');
const pkg = JSON.parse(read('package.json'));

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F293 ready', manifest.status === 'static-release-refresh-real-trial-ready');
expect('No blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
expect('F291/F292/F200 gates pass', ['f291-ready', 'f292-ready', 'f200-static-ready'].every((id) => manifest.gates.some((gate) => gate.id === id && gate.pass === true)));
expect('Archive artifact present', manifest.artifacts.some((artifact) => artifact.path.includes('radshield-mx-f200-static-dist.zip') && artifact.present && artifact.bytes > 0));
expect('Protocol has 10 steps', manifest.realTrialProtocol.length >= 10);
expect('Protocol CSV includes deviation close', csv.includes('Close deviations') && csv.includes('RSO/physicist'));
expect('Publish instruction keeps smoke gate', manifest.publishInstruction.includes('repeat public smoke'));
expect('Update Center documents F293', update.includes('F293 Static release refresh'));
expect('Manual documents F293', manual.includes('Addendum F293'));
expect('Version manual documents F293', versions.includes('F293'));
expect('Changelog documents F293', changelog.includes('F293'));
expect('Package scripts F293', pkg.scripts?.['prepare:f293:static-release-refresh'] === 'node scripts/f293-static-release-refresh-real-trial.mjs');

if (failures.length) {
  console.error('F293 static release refresh contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F293 static release refresh contracts passed.');
