import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f289_memoria_ia_rag_handoff/f289_memoria_ia_rag_handoff.json'));
const bundles = JSON.parse(read('outputs/f289_memoria_ia_rag_handoff/f289_profile_bundles.json'));
const citations = read('outputs/f289_memoria_ia_rag_handoff/f289_citation_index.jsonl')
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F289 ready', manifest.status === 'memoria-ia-rag-handoff-ready');
expect('No live DB write', manifest.seedDbAutomatically === false && manifest.liveDbWritePerformed === false);
expect('Citation index mirrors F287 rows', citations.length === 1545 && manifest.totals.citationCount === citations.length);
expect('Citations have traceability', citations.every((item) => item.citationId && item.pageRef && item.sourceHash && item.chunkHash));
expect('TX bundle has citations', bundles.TX.citationCount > 0);
expect('CY bundle has citations', bundles.CY.citationCount > 0);
expect('Policy keeps canonical priority', manifest.citationPolicy.some((item) => item.includes('NCRP/IAEA/UAQ')));
expect('Workflow covers floorplan and report', manifest.workflow.some((item) => item.includes('floorplan')) && manifest.workflow.some((item) => item.includes('Evidence Pack')));
expect('Update Center documents F289', update.includes('F289 Memoria IA RAG handoff'));
expect('Manual documents F289', manual.includes('Addendum F289'));
expect('Version manual documents F289', versions.includes('F289'));
expect('Changelog documents F289', changelog.includes('F289'));

if (failures.length) {
  console.error('F289 Memoria IA RAG handoff contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F289 Memoria IA RAG handoff contracts passed.');
