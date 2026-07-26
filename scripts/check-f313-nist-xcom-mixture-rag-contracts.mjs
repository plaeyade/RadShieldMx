import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f313_nist_xcom_mixture_rag/f313_nist_xcom_mixture_rag.json'));
const seed = read('outputs/f313_nist_xcom_mixture_rag/f313_xcom_rag_seed_candidate.jsonl');
const xcom = read('src/lib/xcomAttenuation.ts');
const dialog = read('src/sections/dialogs/NistXcomDialog.tsx');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const pkg = JSON.parse(read('package.json'));

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F313 ready', manifest.status === 'nist-xcom-mixture-rag-ready');
expect('No blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
expect('XCOM trace present', xcom.includes('XCOM_SOURCE_TRACE') && xcom.includes('NIST-XCOM-SRD8'));
expect('Mixture functions present', xcom.includes('buildXcomMixtureAttenuation') && xcom.includes('normalizeWeightFractions'));
expect('Dialog exposes mixture UI', dialog.includes('Mezcla XCOM por fraccion en peso') && dialog.includes('TVL mezcla'));
expect('Seed candidate has hashes', seed.includes('NIST-XCOM-SRD8') && seed.includes('sourceHash') && seed.includes('chunkHash'));
expect('Docs updated', update.includes('F313 NIST XCOM mixture') && changelog.includes('F313') && versions.includes('F313') && manual.includes('Addendum F313'));
expect('Package scripts F313', pkg.scripts?.['prepare:f313:nist-xcom-mixture-rag'] === 'node scripts/f313-nist-xcom-mixture-rag.mjs' && pkg.scripts?.['test:f313:nist-xcom-mixture-rag'] === 'node scripts/check-f313-nist-xcom-mixture-rag-contracts.mjs');

if (failures.length) {
  console.error('F313 NIST XCOM mixture RAG contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F313 NIST XCOM mixture RAG contracts passed.');
