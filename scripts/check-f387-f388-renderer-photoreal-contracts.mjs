import { existsSync, readFileSync } from 'node:fs';

const files = {
  dynamicHelpers: 'src/lib/canvas/renderDynamicHelpers.ts',
  photoreal: 'src/lib/medical3D/photorealAdvanced.ts',
  useCanvas: 'src/hooks/useCanvas.ts',
  canvasArea: 'src/sections/CanvasArea.tsx',
  medical3D: 'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx',
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
  report: 'outputs/f387_f388_renderer_photoreal_audit/f387_f388_renderer_photoreal_audit.json',
};

const read = (file) => readFileSync(file, 'utf8');
const checks = [
  [files.dynamicHelpers, 'drawCanvasHeatmapLayer', 'F387 heatmap dynamic helper exists'],
  [files.dynamicHelpers, 'drawCanvasSampleLinesLayer', 'F387 sample-lines dynamic helper exists'],
  [files.dynamicHelpers, 'buildRendererBaseV2Summary', 'F387 summary exists'],
  [files.useCanvas, 'drawCanvasHeatmapLayer(ctx, heatmapData', 'useCanvas uses F387 heatmap helper'],
  [files.useCanvas, 'drawCanvasSampleLinesLayer(ctx, sampleLines', 'useCanvas uses F387 sample helper'],
  [files.canvasArea, 'f387-renderer-base-v2', 'Canvas exposes F387 row'],
  [files.canvasArea, 'eventControllerTouched: false', 'F387 does not rewrite events'],
  [files.photoreal, 'ACESFilmicToneMapping', 'F388 ACES profile exists'],
  [files.photoreal, 'PCFSoftShadowMap', 'F388 soft shadow profile exists'],
  [files.medical3D, 'f388-photoreal-advanced-profile', 'Medical 3D exposes F388 panel'],
  [files.medical3D, 'THREE.ACESFilmicToneMapping', 'Medical 3D applies ACES'],
  [files.medical3D, 'photorealAdvancedProfile.dpr', 'Medical 3D applies bounded DPR'],
  [files.packageJson, 'prepare:f387-f388:renderer-photoreal', 'Package exposes F387/F388 prepare'],
  [files.packageJson, 'test:f387-f388:renderer-photoreal', 'Package exposes F387/F388 contract'],
  [files.changelog, 'F387-F388', 'Changelog includes F387/F388'],
  [files.versions, 'F387-F388', 'Version manual includes F387/F388'],
  [files.manual, 'Addendum F387-F388', 'User manual includes F387/F388'],
  [files.update, 'F387-F388 Renderer v2 + Photoreal', 'Update Center includes F387/F388'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

if (!existsSync(files.report)) {
  failures.push([files.report, 'exists', 'F387/F388 report generated']);
} else {
  const report = JSON.parse(read(files.report));
  if (report.status !== 'renderer-v2-photoreal-ready') {
    failures.push([files.report, 'renderer-v2-photoreal-ready', 'F387/F388 report status ready']);
  }
  if (report.f378?.remainingMigrationCandidates?.length !== 3) {
    failures.push([files.report, '3 remaining candidates', 'F378 remaining migration candidates are accounted for']);
  }
}

if (failures.length) {
  console.error('F387-F388 renderer/photoreal contract failures:');
  for (const [file, needle, label] of failures) console.error(`- ${label}: missing "${needle}" in ${file}`);
  process.exit(1);
}

console.log(`F387-F388 renderer/photoreal contracts OK (${checks.length + 2} checks).`);
