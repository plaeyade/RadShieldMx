import fs from 'node:fs';

const materialDb = fs.readFileSync('src/lib/materialDatabase.ts', 'utf8');
const regulatoryDb = fs.readFileSync('src/lib/f491F498RegulatoryMaterialsDb.ts', 'utf8');

const materialCount = (materialDb.match(/\bid:\s*'/g) || []).length;
const hasReferenceConcrete = materialDb.includes("id: 'concrete-normal-235'") && materialDb.includes('isNCRP151: true');
const hasLead = materialDb.includes("id: 'lead-cast'") && materialDb.includes("'Co60': 1.13");
const hasTmNipoll = materialDb.includes('tm-nipoll') || materialDb.includes('TM Nipoll');
const hasReviewStates = ['approved-reference', 'review-required', 'candidate', 'blocked'].every((marker) => regulatoryDb.includes(marker));
const hasDbTables = ['regulatory_sources', 'material_constants', 'material_value_versions', 'material_source_links'].every((marker) => regulatoryDb.includes(marker));

const failures = [];
if (materialCount < 10) failures.push(`expected at least 10 materials, found ${materialCount}`);
if (!hasReferenceConcrete) failures.push('missing reference concrete');
if (!hasLead) failures.push('missing lead reference');
if (!hasTmNipoll) failures.push('missing TM Nipoll material family');
if (!hasReviewStates) failures.push('missing review states');
if (!hasDbTables) failures.push('missing DB table route');

if (failures.length) {
  console.error(`F491-F498 material values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`F491-F498 material values passed (${materialCount} materials detected).`);
