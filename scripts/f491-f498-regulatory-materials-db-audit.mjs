import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join('outputs', 'f491_f498_regulatory_materials_db');
fs.mkdirSync(outDir, { recursive: true });

const read = (file) => fs.readFileSync(file, 'utf8');
const lib = read('src/lib/f491F498RegulatoryMaterialsDb.ts');
const test = read('src/__tests__/lib/f491F498RegulatoryMaterialsDb.test.ts');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const pkg = JSON.parse(read('package.json'));

const checks = [
  ['schema marker', lib.includes('radshield-mx.db.regulatory-materials.f491-f498.v1')],
  ['phase range', lib.includes("phaseRange: 'F491-F498'")],
  ['source table route', lib.includes('regulatory_sources')],
  ['material constants table route', lib.includes('material_constants')],
  ['value versions table route', lib.includes('material_value_versions')],
  ['source links table route', lib.includes('material_source_links')],
  ['document chunks route', lib.includes('document_chunks')],
  ['F484-F490 calculation gate link', lib.includes('buildF484F490NormativeQa')],
  ['vendor/lab review guardrail', lib.includes('Vendor data is evidence') || lib.includes('review-required')],
  ['test coverage exists', test.includes('F491-F498 regulatory materials DB')],
  ['Update Center entry', update.includes('F491-F498 DB regulatoria/materiales')],
  ['Changelog entry', changelog.includes('F491-F498')],
  ['Version manual entry', versions.includes('F491-F498')],
  ['User manual entry', manual.includes('Addendum F491-F498')],
  ['prepare script', pkg.scripts?.['prepare:f491-f498:regulatory-materials-db'] === 'node scripts/f491-f498-regulatory-materials-db-audit.mjs'],
  ['contract script', pkg.scripts?.['test:f491-f498:regulatory-materials-db'] === 'node scripts/check-f491-f498-regulatory-materials-db-contracts.mjs'],
];

const failed = checks.filter(([, ok]) => !ok);
const output = {
  phaseRange: 'F491-F498',
  generatedAt: new Date().toISOString(),
  status: failed.length ? 'review' : 'pass',
  checks: checks.map(([label, ok]) => ({ label, ok })),
  failed: failed.map(([label]) => label),
};

fs.writeFileSync(path.join(outDir, 'f491_f498_regulatory_materials_db_audit.json'), `${JSON.stringify(output, null, 2)}\n`);

if (failed.length) {
  console.error(`F491-F498 audit failed: ${output.failed.join(', ')}`);
  process.exit(1);
}

console.log('F491-F498 regulatory materials DB audit passed.');
