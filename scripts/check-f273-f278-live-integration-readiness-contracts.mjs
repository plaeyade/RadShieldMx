import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f273_f278_live_integration_readiness/f273_f278_live_integration_readiness.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const evidence = read('src/lib/f125CalculationEvidenceGate.ts');
const lib = read('src/lib/f273ToF278LiveIntegrationReadiness.ts');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F273-F278 status', manifest.status === 'live-integration-readiness-gate');
expect('No secrets printed', manifest.secretsPrinted === false);
expect('All phases present', ['F273', 'F274', 'F275', 'F276', 'F277', 'F278'].every((phase) => manifest.phases.some((row) => row.phase === phase)));
expect('No OCR document processing by default', manifest.liveProviderCalls.googleDocumentAi === false && manifest.liveProviderCalls.amazonTextract === false);
expect('No APS conversion by default', manifest.liveProviderCalls.apsConversion === false);
expect('Geant4 deferred', manifest.credentials.runners.geant4Deferred === true);
expect('EGSnrc deferred', manifest.credentials.runners.egsnrcDeferred === true);
expect('Google env checked', Array.isArray(manifest.credentials.googleDocumentAi.env.configured));
expect('APS fixtures tracked', manifest.credentials.apsDesignAutomation.fixtures.length >= 1);
expect('Lib builder present', lib.includes('buildF273ToF278LiveIntegrationReadiness'));
expect('Update Center documents F273-F278', update.includes('F273-F278 Live integration readiness'));
expect('F125 summarizes F273-F278', evidence.includes('summarizeF273ToF278LiveIntegrationReadiness'));

if (failures.length) {
  console.error('F273-F278 live integration readiness contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F273-F278 live integration readiness contracts passed.');
