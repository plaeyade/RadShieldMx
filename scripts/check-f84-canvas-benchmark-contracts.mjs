import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const root = process.cwd();

function read(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const files = {
  report: resolve(root, 'outputs/fase_84_canvas_external_benchmark.md'),
  updateApp: resolve(root, 'src/sections/dialogs/UpdateAppDialog.tsx'),
  packageJson: resolve(root, 'package.json'),
};

const report = read(files.report);
const updateApp = read(files.updateApp);
const pkg = JSON.parse(read(files.packageJson) || '{}');

const requiredReportTerms = [
  'IDEA StatiCa',
  'pyrateShield',
  'MedicalShielding.ai',
  'RS Designer',
  'calibracion de escala',
  'punto critico',
  'presets de blindaje',
  'heatmap/isocontornos',
  'Snapshot auditable',
  'GPLv3',
  'No se recomienda integrar codigo de pyrateShield directamente',
];

const checks = [
  {
    name: 'f84:benchmark-report-written',
    ok: requiredReportTerms.every((term) => report.includes(term)),
  },
  {
    name: 'f84:update-app-lists-benchmark',
    ok:
      updateApp.includes('F84 External canvas benchmark') &&
      updateApp.includes('scale calibration') &&
      updateApp.includes('heatmap/isocontours'),
  },
  {
    name: 'f84:roadmap-next-phases',
    ok:
      report.includes('F85 deberia implementar primero') &&
      report.includes('F86 deberia implementar') &&
      report.includes('F87 deberia implementar') &&
      report.includes('F88'),
  },
  {
    name: 'f84:package-script-present',
    ok: pkg.scripts?.['test:f84:canvas-benchmark'] === 'node scripts/check-f84-canvas-benchmark-contracts.mjs',
  },
];

const failed = checks.filter((check) => !check.ok);
const output = {
  phase: 'F84',
  ok: failed.length === 0,
  checks,
  failed,
};

console.log(JSON.stringify(output, null, 2));

if (failed.length > 0) {
  process.exit(1);
}
