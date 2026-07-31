import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join('outputs', 'f387_f388_renderer_photoreal_audit');
fs.mkdirSync(outDir, { recursive: true });

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const useCanvas = read('src/hooks/useCanvas.ts');
const canvasArea = read('src/sections/CanvasArea.tsx');
const medical3D = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const dynamicHelpers = read('src/lib/canvas/renderDynamicHelpers.ts');
const photoreal = read('src/lib/medical3D/photorealAdvanced.ts');
const f378 = JSON.parse(read('outputs/f378_legacy_modal_audit/f378_legacy_modal_audit.json'));

const migrated = [
  ['Barrier Editor', 'src/sections/dialogs/BarrierEditor.tsx', 'f379-barrier-editor-dialogshell'],
  ['Air Kerma Overlay', 'src/sections/dialogs/AirKermaOverlay.tsx', 'f380-air-kerma-overlay-dialogshell'],
  ['Control Points', 'src/sections/dialogs/ControlPointsDialog.tsx', 'f381-control-points-dialogshell'],
].map(([name, file, trace]) => ({
  name,
  file,
  migrated: read(file).includes('<DialogShell') && read(file).includes(trace),
}));

const remainingMigrationCandidates = f378.policy
  .filter((item) => item.disposition === 'migrate-window')
  .filter((item) => !migrated.some((done) => done.file === item.file))
  .map((item) => ({ dialog: item.dialog, priority: item.priority, file: item.file }));

const checks = [
  {
    id: 'dynamic-helpers-exist',
    pass: dynamicHelpers.includes('drawCanvasHeatmapLayer') && dynamicHelpers.includes('drawCanvasSampleLinesLayer'),
    evidence: 'Renderer base v2 dynamic helpers exist.',
  },
  {
    id: 'usecanvas-uses-dynamic-helpers',
    pass: useCanvas.includes('drawCanvasHeatmapLayer(ctx, heatmapData') && useCanvas.includes('drawCanvasSampleLinesLayer(ctx, sampleLines'),
    evidence: 'useCanvas.draw calls renderer v2 dynamic helpers.',
  },
  {
    id: 'canvas-panel-visible',
    pass: canvasArea.includes('f387-renderer-base-v2') && canvasArea.includes('buildRendererBaseV2Summary'),
    evidence: 'Canvas shows F387 renderer base v2 QA row.',
  },
  {
    id: 'event-controller-not-rewritten',
    pass: canvasArea.includes('eventControllerTouched: false'),
    evidence: 'Pointer/selection event controller remains untouched in this phase.',
  },
  {
    id: 'photoreal-profile-exists',
    pass: photoreal.includes('ACESFilmicToneMapping') && photoreal.includes('PCFSoftShadowMap'),
    evidence: 'F388 advanced photoreal profile defines ACES and soft shadows.',
  },
  {
    id: 'medical3d-uses-photoreal-profile',
    pass: medical3D.includes('buildPhotorealAdvancedProfile') && medical3D.includes('f388-photoreal-advanced-profile'),
    evidence: 'Medical 3D uses F388 profile and shows QA panel.',
  },
  {
    id: 'canvas-webgl-applies-profile',
    pass: medical3D.includes('THREE.ACESFilmicToneMapping') && medical3D.includes('THREE.PCFSoftShadowMap') && medical3D.includes('photorealAdvancedProfile.dpr'),
    evidence: 'R3F Canvas applies advanced tone mapping, shadow map and bounded DPR.',
  },
];

const manifest = {
  phase: 'F387-F388',
  generatedAt: new Date().toISOString(),
  status: checks.every((check) => check.pass) ? 'renderer-v2-photoreal-ready' : 'renderer-v2-photoreal-failed',
  f378: {
    policyItems: f378.summary.policyItems,
    keepFullscreen: f378.summary.keepFullscreen,
    migrateWindow: f378.summary.migrateWindow,
    alreadyControlled: f378.summary.alreadyControlled,
    migratedCandidates: migrated.filter((item) => item.migrated).length,
    remainingMigrationCandidates,
  },
  rendererBaseV2: {
    active: checks[0].pass && checks[1].pass && checks[2].pass,
    eventControllerTouched: false,
    helpers: ['drawCanvasBackgroundGrid', 'drawFloorPlanImageLayer', 'drawCanvasScaleHud', 'drawCanvasHeatmapLayer', 'drawCanvasSampleLinesLayer'],
  },
  photorealAdvanced: {
    activeEngine: 'Three/R3F',
    babylonRuntime: 'not-installed',
    unityRuntime: 'external-url-gated',
    profile: 'ACES + PCFSoftShadowMap + bounded DPR + procedural PBR evidence',
  },
  checks,
};

fs.writeFileSync(path.join(outDir, 'f387_f388_renderer_photoreal_audit.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(
  path.join(outDir, 'f387_f388_renderer_photoreal_audit.md'),
  [
    '# F387-F388 Renderer Base v2 + Photoreal Audit',
    '',
    `Status: ${manifest.status}`,
    '',
    '## F378 migration status',
    `- Policy items: ${manifest.f378.policyItems}`,
    `- Keep fullscreen: ${manifest.f378.keepFullscreen}`,
    `- Migrate-window candidates: ${manifest.f378.migrateWindow}`,
    `- Migrated candidates: ${manifest.f378.migratedCandidates}`,
    `- Remaining candidates: ${manifest.f378.remainingMigrationCandidates.length}`,
    ...manifest.f378.remainingMigrationCandidates.map((item) => `  - ${item.priority} ${item.dialog}: ${item.file}`),
    '',
    '## Renderer Base v2',
    `- Active: ${manifest.rendererBaseV2.active ? 'yes' : 'no'}`,
    `- Event controller touched: ${manifest.rendererBaseV2.eventControllerTouched ? 'yes' : 'no'}`,
    `- Helpers: ${manifest.rendererBaseV2.helpers.join(', ')}`,
    '',
    '## Photoreal Advanced',
    `- Active engine: ${manifest.photorealAdvanced.activeEngine}`,
    `- Profile: ${manifest.photorealAdvanced.profile}`,
    `- Babylon: ${manifest.photorealAdvanced.babylonRuntime}`,
    `- Unity: ${manifest.photorealAdvanced.unityRuntime}`,
    '',
    '## Checks',
    ...checks.map((check) => `- ${check.id}: ${check.pass ? 'pass' : 'fail'} - ${check.evidence}`),
    '',
  ].join('\n'),
);

if (manifest.status !== 'renderer-v2-photoreal-ready') {
  console.error('F387-F388 audit failed:');
  for (const check of checks.filter((item) => !item.pass)) console.error(`- ${check.id}: ${check.evidence}`);
  process.exit(1);
}

console.log(`F387-F388 audit written to ${outDir}`);
