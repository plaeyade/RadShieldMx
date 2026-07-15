import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const medical3d = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const sceneBuilder = read('src/lib/medical3D/sceneBuilder.ts');
const preloaded = read('src/lib/rag/preloadedDocuments.ts');
const dbValidator = read('scripts/db-live-validation.mjs');

const checks = [
  {
    name: 'medical3d:walkthrough-mode',
    ok: medical3d.includes('WalkthroughRig') && medical3d.includes('Recorrido WASD') && medical3d.includes('Q/E: girar'),
  },
  {
    name: 'medical3d:inspection-target-panel',
    ok: medical3d.includes('InspectionTarget') && medical3d.includes('inspectionTarget') && medical3d.includes('Inspeccion visual'),
  },
  {
    name: 'medical3d:zones-and-thickness-overlays',
    ok: medical3d.includes('ZoneOverlays') && medical3d.includes('requiredThickness_mm') && sceneBuilder.includes('MedicalZone'),
  },
  {
    name: 'medical3d:review-json-exports-zones',
    ok: medical3d.includes('zones: scene.zones.map'),
  },
  {
    name: 'rag:ncrp-versioning-visible',
    ok: preloaded.includes("standard: 'NCRP-151'") && preloaded.includes("year: 2005") && preloaded.includes("docId: 'ncrp-151-v2'"),
  },
  {
    name: 'db:live-validator-expects-rag-and-memory-tables',
    ok: dbValidator.includes('document_chunks') && dbValidator.includes('analytic_memory_snapshots'),
  },
];

const failed = checks.filter((check) => !check.ok);
const output = {
  phase: 'F74',
  ok: failed.length === 0,
  checks,
  failed,
  generatedAt: new Date().toISOString(),
};

mkdirSync(join(root, 'outputs'), { recursive: true });
writeFileSync(join(root, 'outputs', 'f74_render_doc_readiness_contracts.json'), `${JSON.stringify(output, null, 2)}\n`);

if (failed.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log('F74 render/doc-readiness contracts passed');
