import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f268a_api_readiness/f268a_api_readiness.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const lib = read('src/lib/f268aExternalApiReadiness.ts');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

const required = [
  'google-document-ai',
  'amazon-textract',
  'crossref',
  'semantic-scholar',
  'oda-drawings-sdk',
  'aps-design-automation',
  'gate-opengate',
  'geant4',
  'egsnrc-egs-brachy',
];

expect('F268A status implemented', manifest.status === 'api-readiness-gate-implemented');
for (const id of required) expect(`provider ${id}`, manifest.providers.some((provider) => provider.id === id));
expect('No secret frontend control present', manifest.nonNegotiableControls.some((item) => item.includes('No secrets in VITE')));
expect('Next phase F269 present', manifest.nextPhases.some((item) => item.includes('F269')));
expect('Next phase F270 present', manifest.nextPhases.some((item) => item.includes('F270')));
expect('Next phase F271 present', manifest.nextPhases.some((item) => item.includes('F271')));
expect('Next phase F272 present', manifest.nextPhases.some((item) => item.includes('F272')));
expect('Lib exposes builder', lib.includes('buildF268aExternalApiReadiness'));
expect('Update Center documents F268A', update.includes('F268A External API readiness'));
expect('Changelog documents F268A', changelog.includes('F268A'));
expect('Manual versions documents F268A', versions.includes('F268A'));
expect('User manual documents F268A', manual.includes('F268A'));

if (failures.length) {
  console.error('F268A API readiness contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F268A API readiness contracts passed.');
