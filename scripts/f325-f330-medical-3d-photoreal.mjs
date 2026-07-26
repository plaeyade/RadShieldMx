import fs from 'node:fs';
import crypto from 'node:crypto';

const outDir = 'outputs/f325_f330_medical_3d_photoreal';
fs.mkdirSync(outDir, { recursive: true });

const read = (file) => fs.readFileSync(file, 'utf8');
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const dialog = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');

const manifest = {
  schema: 'radshield-mx.phase-manifest.v1',
  phase: 'F325-F330',
  title: 'Medical 3D photoreal walkthrough readiness',
  status: 'three-r3f-photoreal-readiness-ready',
  generatedAt: new Date().toISOString(),
  scope:
    'Close the next safe visual layer before Babylon: collision-aware WASD, PBR material profiles, lighting presets, GLB asset pipeline contract and report-linked visual evidence.',
  implemented: [
    { phase: 'F325', item: 'Walkthrough collision volumes for walls and equipment.' },
    { phase: 'F326', item: 'Material PBR profiles for lead, steel, leaded glass, high-density masonry and concrete.' },
    { phase: 'F327', item: 'Clinical, inspection and warm lighting presets.' },
    { phase: 'F328', item: 'GLB/GLTF equipment asset pipeline contract in review JSON.' },
    { phase: 'F329', item: 'Photoreal walkthrough toggle on top of stable Three/R3F renderer.' },
    { phase: 'F330', item: 'Visual evidence contract with scene hash for Memoria IA, PDF and Evidence Pack.' },
  ],
  sourceChecks: {
    hasCollisionToggle: dialog.includes('collisionEnabled') && dialog.includes('isWalkthroughBlocked'),
    hasPbrProfiles: dialog.includes('medicalPbrProfile') && dialog.includes('high-density-masonry'),
    hasLightingPresets: dialog.includes('lightingPreset') && dialog.includes('lightingPresets'),
    hasAssetPipeline: dialog.includes('assetPipeline') && dialog.includes('acceptedStaticAssets'),
    hasPhotorealToggle: dialog.includes('photorealWalkthrough') && dialog.includes('Recorrido fotoreal'),
    hasVisualEvidence: dialog.includes('visualEvidence') && dialog.includes('sceneHash'),
    hasUiContract: dialog.includes('f325-f330-photoreal-controls'),
  },
  limitations: [
    'Photoreal mode is still Three/R3F procedural, not a Unity or Babylon renderer.',
    'GLB assets are contracted in exports; real vendor asset library can be added later without changing the scene schema.',
    'Visual evidence is for review and reporting support, not a substitute for calculation QA.',
  ],
  nextRecommendedPhase:
    'Retry Babylon install. If packages install, activate Babylon behind existing runtime gate and repeat Medical 3D visual smoke.',
  fileHashes: {
    medical3DDialog: hash(dialog),
  },
};

fs.writeFileSync(`${outDir}/f325_f330_medical_3d_photoreal.json`, JSON.stringify(manifest, null, 2));
fs.writeFileSync(
  'outputs/fase_325_330_medical_3d_photoreal.md',
  `# F325-F330 - Medical 3D photoreal walkthrough readiness\n\nStatus: ${manifest.status}\n\nSe agregan colisiones, perfiles PBR, presets de luz, contrato GLB/GLTF y evidencia visual con hash de escena para conectar capturas 3D con Memoria IA/PDF/Evidence Pack.\n`,
);

console.log(`F325-F330 manifest written to ${outDir}/f325_f330_medical_3d_photoreal.json`);
