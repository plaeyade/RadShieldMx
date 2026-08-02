import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join('outputs', 'f484_f490_normative_qa');
fs.mkdirSync(outDir, { recursive: true });

const read = (file) => fs.readFileSync(file, 'utf8');
const lib = read('src/lib/f484F490NormativeQa.ts');
const test = read('src/__tests__/lib/f484F490NormativeQa.test.ts');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const userManual = read('MANUAL_USUARIO_v99.md');
const pkg = JSON.parse(read('package.json'));

const markers = [
  ['schema marker', lib.includes('radshield-mx.calc.normative-qa.f484-f490.v1')],
  ['F484 LINAC 6MV', lib.includes('f484-linac-6mv-primary-ncrp151')],
  ['F485 neutron high energy', lib.includes('f485-linac-15mv-secondary-neutron')],
  ['F486 diagnostic CT', lib.includes('f486-diagnostic-ct-ncrp147')],
  ['F487 Gamma Knife', lib.includes('f487-gamma-knife-cobalt')],
  ['F488 PET/NM', lib.includes('f488-pet-nm-tg108')],
  ['F489 cyclotron', lib.includes('f489-cyclotron-18mev')],
  ['F490 release gate', lib.includes('releaseGate')],
  ['heavy asset route', lib.includes('public/unity/radshield-medical-3d') && lib.includes('public/medical3d/photoreal')],
  ['unit test exists', test.includes('F484-F490 normative calculation QA')],
  ['Update Center entry', update.includes('F484-F490 Motor calculo QA')],
  ['Changelog entry', changelog.includes('F484-F490')],
  ['Version manual entry', versions.includes('F484-F490')],
  ['User manual entry', userManual.includes('Addendum F484-F490')],
  ['prepare script', pkg.scripts?.['prepare:f484-f490:normative-qa'] === 'node scripts/f484-f490-normative-qa-audit.mjs'],
  ['contract script', pkg.scripts?.['test:f484-f490:normative-qa'] === 'node scripts/check-f484-f490-normative-qa-contracts.mjs'],
];

const failed = markers.filter(([, ok]) => !ok);
const audit = {
  phaseRange: 'F484-F490',
  generatedAt: new Date().toISOString(),
  status: failed.length ? 'review' : 'pass',
  markers: markers.map(([label, ok]) => ({ label, ok })),
  failed: failed.map(([label]) => label),
};

fs.writeFileSync(path.join(outDir, 'f484_f490_normative_qa_audit.json'), `${JSON.stringify(audit, null, 2)}\n`);

if (failed.length) {
  console.error(`F484-F490 audit failed: ${audit.failed.join(', ')}`);
  process.exit(1);
}

console.log('F484-F490 normative QA audit passed.');
