import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f501_f504_heavy_assets_db_prep');
const photorealRoot = path.join(root, 'public', 'medical3d', 'photoreal');
const unityRoot = path.join(root, 'public', 'unity', 'radshield-medical-3d');
const unityBuild = path.join(unityRoot, 'Build');
const unityTemplate = path.join(unityRoot, 'TemplateData');
const schemaDraft = path.join(root, 'db', 'f501_f504_regulatory_materials_schema.sql');
fs.mkdirSync(outDir, { recursive: true });

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function listSafe(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).map((entry) => entry.name);
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

const buildFiles = listSafe(unityBuild);
const unityChecks = [
  { id: 'index-html', expected: 'public/unity/radshield-medical-3d/index.html', pass: fs.existsSync(path.join(unityRoot, 'index.html')) },
  { id: 'loader-js', expected: 'Build/*.loader.js', pass: buildFiles.some((file) => file.endsWith('.loader.js')) },
  { id: 'framework-js', expected: 'Build/*.framework.js(.gz|.br)', pass: buildFiles.some((file) => /\.framework\.js(\.gz|\.br)?$/.test(file)) },
  { id: 'data', expected: 'Build/*.data(.gz|.br)', pass: buildFiles.some((file) => /\.data(\.gz|\.br)?$/.test(file)) },
  { id: 'wasm', expected: 'Build/*.wasm(.gz|.br)', pass: buildFiles.some((file) => /\.wasm(\.gz|\.br)?$/.test(file)) },
  { id: 'template-data', expected: 'TemplateData/*', pass: fs.existsSync(unityTemplate) && listSafe(unityTemplate).length > 0 },
];

const photorealChecks = [
  { id: 'manifest', expected: 'ASSET_MANIFEST_F501_F504.json', pass: exists('public/medical3d/photoreal/ASSET_MANIFEST_F501_F504.json') },
  { id: 'hdri-folder', expected: 'hdri/', pass: exists('public/medical3d/photoreal/hdri/.gitkeep') || fs.existsSync(path.join(photorealRoot, 'hdri')) },
  { id: 'textures-folder', expected: 'textures/', pass: exists('public/medical3d/photoreal/textures/.gitkeep') || fs.existsSync(path.join(photorealRoot, 'textures')) },
  { id: 'decals-folder', expected: 'decals/', pass: exists('public/medical3d/photoreal/decals/.gitkeep') || fs.existsSync(path.join(photorealRoot, 'decals')) },
  { id: 'clinical-hdri-real', expected: 'hdri/clinical_softbox.hdr', pass: exists('public/medical3d/photoreal/hdri/clinical_softbox.hdr') },
  { id: 'concrete-albedo-real', expected: 'textures/hd-concrete/albedo.webp', pass: exists('public/medical3d/photoreal/textures/hd-concrete/albedo.webp') },
  { id: 'radiation-decal-real', expected: 'decals/radiation-warning.webp', pass: exists('public/medical3d/photoreal/decals/radiation-warning.webp') },
];

const sql = fs.existsSync(schemaDraft) ? fs.readFileSync(schemaDraft, 'utf8') : '';
const sqlChecks = [
  { id: 'schema-draft-file', pass: Boolean(sql), expected: 'db/f501_f504_regulatory_materials_schema.sql' },
  { id: 'regulatory-sources-table', pass: sql.includes('CREATE TABLE IF NOT EXISTS regulatory_sources'), expected: 'regulatory_sources' },
  { id: 'material-constants-table', pass: sql.includes('CREATE TABLE IF NOT EXISTS material_constants'), expected: 'material_constants' },
  { id: 'material-value-versions-table', pass: sql.includes('CREATE TABLE IF NOT EXISTS material_value_versions'), expected: 'material_value_versions' },
  { id: 'material-source-links-table', pass: sql.includes('CREATE TABLE IF NOT EXISTS material_source_links'), expected: 'material_source_links' },
  { id: 'foreign-keys', pass: sql.includes('FOREIGN KEY'), expected: 'FK material/source relations' },
];

const f500 = readJson(path.join(root, 'outputs', 'f500_regulatory_materials_live_gate', 'f500_live_gate_manifest.json'));
const unityReady = unityChecks.every((check) => check.pass);
const photorealFoldersReady = photorealChecks.filter((check) => ['manifest', 'hdri-folder', 'textures-folder', 'decals-folder'].includes(check.id)).every((check) => check.pass);
const realHeavyAssetsPresent = photorealChecks.filter((check) => check.id.endsWith('-real')).every((check) => check.pass);
const schemaReady = sqlChecks.every((check) => check.pass);

const blockers = [
  ...(!schemaReady ? ['F501 SQL schema draft incomplete.'] : []),
  ...(f500?.dbReadback?.missingTables?.length ? [`F500 readback still reports missing tables: ${f500.dbReadback.missingTables.join(', ')}`] : []),
  ...(!realHeavyAssetsPresent ? ['Real HDRI/PBR/decal heavy assets are not copied yet; only intake folders are ready.'] : []),
  ...(!unityReady ? [`Unity WebGL real build missing: ${unityChecks.filter((check) => !check.pass).map((check) => check.expected).join(', ')}`] : []),
];

const manifest = {
  schema: 'radshield-mx.release.f501-f504.heavy-assets-db-prep.v1',
  phaseRange: 'F501-F504',
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? 'heavy-assets-db-live-ready' : 'prepared-gated',
  phases: {
    F501: 'Regulatory/material schema draft ready for reviewed migration.',
    F502: 'Photoreal heavy asset intake folders/manifest ready.',
    F503: unityReady ? 'Unity WebGL exported build present.' : 'Unity WebGL build folder prepared; real export missing.',
    F504: 'Post-copy audit/build/readback gate.',
  },
  database: {
    schemaDraft: path.relative(root, schemaDraft).replace(/\\/g, '/'),
    sqlChecks,
    f500Status: f500?.status ?? 'missing',
    f500MissingTables: f500?.dbReadback?.missingTables ?? [],
    liveSeedPolicy: 'Do not seed until schema is applied, F500 passes readback and F501 flags are explicit.',
  },
  photoreal: {
    root: path.relative(root, photorealRoot).replace(/\\/g, '/'),
    foldersReady: photorealFoldersReady,
    realHeavyAssetsPresent,
    checks: photorealChecks,
  },
  unity: {
    root: path.relative(root, unityRoot).replace(/\\/g, '/'),
    ready: unityReady,
    buildFiles,
    checks: unityChecks,
    missing: unityChecks.filter((check) => !check.pass).map((check) => check.expected),
    activation: [
      'Copy Unity WebGL export into public/unity/radshield-medical-3d.',
      'Set VITE_MEDICAL_3D_UNITY_LOCAL_BUILD=true for local static route or VITE_MEDICAL_3D_UNITY_WEBGL_URL for hosted route.',
      'Run prepare/test/e2e F475-F478 and F501-F504.',
    ],
  },
  blockers,
};

const md = [
  '# F501-F504 HEAVY ASSETS + DB PREP',
  '',
  `Estado: ${manifest.status}`,
  '',
  '## DB',
  `Schema draft: ${manifest.database.schemaDraft}`,
  `F500 status: ${manifest.database.f500Status}`,
  `Tablas faltantes F500: ${manifest.database.f500MissingTables.join(', ') || 'ninguna reportada'}`,
  '',
  '## Photoreal',
  `Root: ${manifest.photoreal.root}`,
  `Folders ready: ${manifest.photoreal.foldersReady ? 'yes' : 'no'}`,
  `Real heavy assets present: ${manifest.photoreal.realHeavyAssetsPresent ? 'yes' : 'no'}`,
  ...manifest.photoreal.checks.map((check) => `- ${check.id}: ${check.pass ? 'ok' : 'missing'} (${check.expected})`),
  '',
  '## Unity WebGL',
  `Root: ${manifest.unity.root}`,
  `Ready: ${manifest.unity.ready ? 'yes' : 'no'}`,
  ...manifest.unity.checks.map((check) => `- ${check.id}: ${check.pass ? 'ok' : 'missing'} (${check.expected})`),
  '',
  '## Bloqueos',
  ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- Ninguno.']),
  '',
].join('\n');

fs.writeFileSync(path.join(outDir, 'f501_f504_heavy_assets_db_prep.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f501_f504_heavy_assets_db_prep.md'), md, 'utf8');

console.log(`F501-F504 heavy assets/DB prep generated. status=${manifest.status} blockers=${blockers.length} unityReady=${unityReady} heavyAssets=${realHeavyAssetsPresent}`);
