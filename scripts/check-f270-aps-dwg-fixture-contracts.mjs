import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f270_aps_dwg_fixture_smoke/f270_aps_dwg_fixture_smoke.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const evidence = read('src/lib/f125CalculationEvidenceGate.ts');
const lib = read('src/lib/f270ApsDwgFixtureSmoke.ts');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F270 status', manifest.status === 'aps-dwg-fixture-smoke-ready');
expect('No live conversion calls', manifest.liveConversionExecuted === false);
expect('APS provider present', manifest.provider === 'autodesk-aps-design-automation');
expect('ODA fallback tracked', manifest.fallbackProvider === 'oda-drawings-sdk-deferred');
expect('At least one fixture available', manifest.fixtures.some((fixture) => fixture.status === 'available'));
expect('Layer map output expected', manifest.expectedOutputs.includes('layer-map.json'));
expect('Static secret control present', manifest.acceptanceCriteria.some((item) => item.includes('VITE')));
expect('Lib builder present', lib.includes('buildF270ApsDwgFixtureSmoke'));
expect('Update Center documents F270', update.includes('F270 APS DWG fixture smoke'));
expect('F125 summarizes F270', evidence.includes('summarizeF270ApsDwgFixtureSmoke'));

if (failures.length) {
  console.error('F270 APS DWG fixture contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F270 APS DWG fixture contracts passed.');
