import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const root = process.cwd();

function read(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const files = {
  canvas: resolve(root, 'src/sections/CanvasArea.tsx'),
  updateApp: resolve(root, 'src/sections/dialogs/UpdateAppDialog.tsx'),
  report: resolve(root, 'outputs/fase_83_canvas_continuity.md'),
  packageJson: resolve(root, 'package.json'),
};

const pkg = JSON.parse(read(files.packageJson) || '{}');
const canvas = read(files.canvas);
const updateApp = read(files.updateApp);
const report = read(files.report);

const checks = [
  {
    name: 'f83:canvas-offline-continuity-panel',
    ok:
      canvas.includes('f83-offline-continuity-panel') &&
      canvas.includes('F83 continuidad sin DB live') &&
      canvas.includes('offlineContinuitySteps'),
  },
  {
    name: 'f83:canvas-3d-rag-db-bridge',
    ok:
      canvas.includes('Inspeccion 3D') &&
      canvas.includes('Evidence/RAG') &&
      canvas.includes('DB diferida') &&
      canvas.includes('onOpenMedical3D || onOpen3DViewer') &&
      canvas.includes('onOpenEvidencePack'),
  },
  {
    name: 'f83:update-app-lists-phase',
    ok:
      updateApp.includes('F83 Canvas continuity panel') &&
      updateApp.includes('offline workflow visible'),
  },
  {
    name: 'f83:report-written',
    ok:
      report.includes('F83') &&
      report.includes('canvas/floorplan') &&
      report.includes('DB diferida') &&
      report.includes('F84'),
  },
  {
    name: 'f83:package-script-present',
    ok: pkg.scripts?.['test:f83:canvas-continuity'] === 'node scripts/check-f83-canvas-continuity-contracts.mjs',
  },
];

const failed = checks.filter((check) => !check.ok);
const output = {
  phase: 'F83',
  ok: failed.length === 0,
  checks,
  failed,
};

console.log(JSON.stringify(output, null, 2));

if (failed.length > 0) {
  process.exit(1);
}
