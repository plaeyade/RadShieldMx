import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const lib = read('src/lib/f501F504HeavyAssetsDbPrep.ts');
const script = read('scripts/f501-f504-heavy-assets-db-prep.mjs');
const sql = read('db/f501_f504_regulatory_materials_schema.sql');
const assetManifest = read('public/medical3d/photoreal/ASSET_MANIFEST_F501_F504.json');
const unityReadme = read('public/unity/radshield-medical-3d/README_UNITY_WEBGL_BUILD.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const pkg = JSON.parse(read('package.json'));

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('exports F501-F504 builder', lib.includes('buildF501F504HeavyAssetsDbPrep'));
expect('schema marker', lib.includes('radshield-mx.release.f501-f504.heavy-assets-db-prep.v1'));
expect('SQL creates regulatory_sources', sql.includes('CREATE TABLE IF NOT EXISTS regulatory_sources'));
expect('SQL creates material_constants', sql.includes('CREATE TABLE IF NOT EXISTS material_constants'));
expect('SQL creates material_value_versions', sql.includes('CREATE TABLE IF NOT EXISTS material_value_versions'));
expect('SQL creates material_source_links', sql.includes('CREATE TABLE IF NOT EXISTS material_source_links'));
expect('script audits Unity build files', script.includes('Build/*.loader.js') && script.includes('TemplateData'));
expect('script audits photoreal assets', script.includes('clinical_softbox.hdr') && script.includes('radiation-warning.webp'));
expect('script writes output manifest', script.includes('f501_f504_heavy_assets_db_prep.json'));
expect('script does not seed live rows', !/\bINSERT\s+INTO\b/i.test(script) && !/\bDELETE\s+FROM\b/i.test(script));
expect('asset manifest present', assetManifest.includes('radshield-mx.medical3d.photoreal-assets.f501-f504.v1'));
expect('unity readme explains expected structure', unityReadme.includes('Build/*.loader.js') && unityReadme.includes('VITE_MEDICAL_3D_UNITY_LOCAL_BUILD'));
expect('package prepare script', pkg.scripts?.['prepare:f501-f504:heavy-assets-db'] === 'node scripts/f501-f504-heavy-assets-db-prep.mjs');
expect('package test script', pkg.scripts?.['test:f501-f504:heavy-assets-db'] === 'node scripts/check-f501-f504-heavy-assets-db-prep-contracts.mjs');
expect('Update Center documents F501-F504', update.includes('F501-F504 DB/assets pesados'));
expect('Changelog documents F501-F504', changelog.includes('F501-F504'));
expect('Version manual documents F501-F504', versions.includes('F501-F504'));
expect('User manual documents F501-F504', manual.includes('Addendum F501-F504'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F501-F504 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F501-F504 heavy assets/DB prep contracts passed.');
