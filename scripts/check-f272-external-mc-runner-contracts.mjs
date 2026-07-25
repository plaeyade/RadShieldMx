import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f272_external_mc_runner_gate/f272_external_mc_runner_gate.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const evidence = read('src/lib/f125CalculationEvidenceGate.ts');
const lib = read('src/lib/f272ExternalMonteCarloRunnerGate.ts');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F272 status', manifest.status === 'external-monte-carlo-runner-contract-ready');
expect('No live runner calls', manifest.liveRunnerCallsExecuted === false);
expect('GATE/OpenGATE present', manifest.engines.some((engine) => engine.id === 'gate-opengate'));
expect('Geant4 present', manifest.engines.some((engine) => engine.id === 'geant4'));
expect('EGSnrc present', manifest.engines.some((engine) => engine.id === 'egsnrc-egs-brachy'));
expect('Forward MC control present', manifest.clinicalControls.some((item) => item.includes('Forward MC')));
expect('Reverse MC control present', manifest.clinicalControls.some((item) => item.includes('Reverse MC')));
expect('No certification claim', manifest.clinicalControls.some((item) => item.includes('not a certified clinical engine')));
expect('Lib builder present', lib.includes('buildF272ExternalMonteCarloRunnerGate'));
expect('Update Center documents F272', update.includes('F272 External Monte Carlo runner gate'));
expect('F125 summarizes F272', evidence.includes('summarizeF272ExternalMonteCarloRunnerGate'));

if (failures.length) {
  console.error('F272 external MC runner contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F272 external MC runner contracts passed.');
