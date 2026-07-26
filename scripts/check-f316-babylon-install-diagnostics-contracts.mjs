import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f316_babylon_install_diagnostics/f316_babylon_install_diagnostics.json'));
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F316 known status', ['babylon-packages-installed', 'babylon-install-blocked-by-npm-fetch'].includes(manifest.status));
expect('Stable fallback recorded', manifest.stableFallback?.activeEngine === 'three-r3f' && manifest.stableFallback?.fallbackRequired === true);
expect('Activation checklist present', Array.isArray(manifest.activationChecklist) && manifest.activationChecklist.length >= 5);
expect('Blocked state explicit', manifest.status === 'babylon-packages-installed' || manifest.blockers.includes('npm-registry-fetch-eacces'));
expect('Package scripts F316', pkg.scripts?.['prepare:f316:babylon-install-diagnostics'] === 'node scripts/f316-babylon-install-diagnostics.mjs' && pkg.scripts?.['test:f316:babylon-install-diagnostics'] === 'node scripts/check-f316-babylon-install-diagnostics-contracts.mjs');
expect('Docs updated', update.includes('F316 Babylon dependency diagnostics') && changelog.includes('F316') && versions.includes('F316') && manual.includes('Addendum F316'));

if (failures.length) {
  console.error('F316 Babylon install diagnostics contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F316 Babylon install diagnostics contracts passed.');
