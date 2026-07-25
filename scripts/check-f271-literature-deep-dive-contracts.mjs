import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f271_literature_deep_dive_gate/f271_literature_deep_dive_gate.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const evidence = read('src/lib/f125CalculationEvidenceGate.ts');
const lib = read('src/lib/f271LiteratureDeepDiveGate.ts');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F271 status', manifest.status === 'literature-deep-dive-gate-ready');
expect('No live queries', manifest.liveQueriesExecuted === false);
expect('Crossref provider present', manifest.providers.some((provider) => provider.id === 'crossref'));
expect('Semantic Scholar provider present', manifest.providers.some((provider) => provider.id === 'semantic-scholar'));
expect('Five literature topics', manifest.topics.length >= 5);
expect('Materials topic present', manifest.topics.some((topic) => topic.modality === 'MATERIALS'));
expect('Guardrail for no auto constants', manifest.guardrails.some((item) => item.includes('Calculation constants')));
expect('Lib builder present', lib.includes('buildF271LiteratureDeepDiveGate'));
expect('Update Center documents F271', update.includes('F271 Literature deep dive gate'));
expect('F125 summarizes F271', evidence.includes('summarizeF271LiteratureDeepDiveGate'));

if (failures.length) {
  console.error('F271 literature deep-dive contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F271 literature deep-dive contracts passed.');
