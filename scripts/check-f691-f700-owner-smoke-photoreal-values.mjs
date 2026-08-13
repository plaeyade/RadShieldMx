import { buildF691F695RendererControlledOwnerSmoke } from '../src/lib/f691F695RendererControlledOwnerSmoke.ts';
import { buildF696F700PhotorealAssetReadiness } from '../src/lib/medical3D/f696F700PhotorealAssetReadiness.ts';

const beforeAfterReady = {
  schema: 'radshield-mx.canvas.renderer-owner-before-after-smoke.f686-f690.v1',
  phaseRange: 'F686-F690',
  status: 'before-after-smoke-ready',
  baseline: { phase: 'F686', owner: 'useCanvas', targetedClickReady: true, selectionAligned: true, evidence: 'fixture' },
  flagged: { phase: 'F687', candidateOwner: 'deep-renderer-v2', flagEnabled: true, ownerSmokeStatus: 'owner-smoke-preview', evidence: 'fixture' },
  parity: { phase: 'F688', observed: true, expected: 'same-selection', evidence: 'fixture' },
  gates: [],
  metrics: { passCount: 5, gateCount: 5, cacheKey: 'f686-ready' },
  decision: { recommendation: 'eligible-for-controlled-owner-smoke', reason: 'fixture ready' },
  rollback: ['Apagar flags.'],
};

const ownerReady = buildF691F695RendererControlledOwnerSmoke(beforeAfterReady, {
  highRiskRendererEnabled: true,
  eventControllerV2Enabled: true,
});
if (ownerReady.status !== 'controlled-owner-smoke-ready') throw new Error(`Expected controlled ready, got ${ownerReady.status}`);
if (ownerReady.decision.recommendation !== 'run-selection-owner-smoke') throw new Error(`Unexpected owner recommendation ${ownerReady.decision.recommendation}`);
if (ownerReady.scope.allowedWrites.length !== 0) throw new Error('Controlled owner smoke must not allow writes.');

const ownerPreview = buildF691F695RendererControlledOwnerSmoke(beforeAfterReady, {
  highRiskRendererEnabled: true,
  eventControllerV2Enabled: false,
});
if (ownerPreview.status !== 'controlled-owner-smoke-preview') throw new Error(`Expected controlled preview, got ${ownerPreview.status}`);

const photorealPack = {
  schema: 'radshield-mx.medical3d.advanced-photoreal-pack.f479-f483.v1',
  phaseRange: 'F479-F483',
  status: 'procedural-photoreal-ready',
  assetTier: 'procedural-safe',
  assetRoot: 'public/medical3d/photoreal',
  scene: { roomName: 'Fixture bunker', walls: 4, equipment: 3, zones: 2, materials: 5 },
  hdri: { mode: 'procedural-softbox', expectedPath: 'public/medical3d/photoreal/hdri/clinical_softbox.hdr', fallback: 'Three/R3F procedural lights' },
  textures: [],
  decals: [
    { id: 'radiation-warning', label: 'Radiacion', role: 'safety', placement: 'door' },
    { id: 'penetration-tag', label: 'Penetracion', role: 'mep', placement: 'wall' },
    { id: 'wall-role-label', label: 'Rol', role: 'evidence', placement: 'wall' },
    { id: 'equipment-footprint', label: 'Equipo', role: 'equipment', placement: 'floor' },
    { id: 'finish-swatch', label: 'Acabado', role: 'finish', placement: 'floor' },
  ],
  renderPresets: [
    { id: 'inspection', label: 'Inspeccion', use: 'qa', gated: false },
    { id: 'presentation', label: 'Presentacion', use: 'report', gated: false },
    { id: 'cinematic', label: 'Cine', use: 'render', gated: true },
  ],
  phases: [],
  warnings: [],
};

const photorealPreview = buildF696F700PhotorealAssetReadiness(photorealPack, {
  localManifestPresent: false,
  heavyAssetsPresent: false,
});
if (photorealPreview.status !== 'photoreal-assets-preview') throw new Error(`Expected photoreal preview, got ${photorealPreview.status}`);
if (photorealPreview.decision.recommendation !== 'ship-procedural-beta') throw new Error(`Unexpected photoreal recommendation ${photorealPreview.decision.recommendation}`);

const photorealReady = buildF696F700PhotorealAssetReadiness(photorealPack, {
  localManifestPresent: true,
  heavyAssetsPresent: true,
});
if (photorealReady.status !== 'photoreal-assets-ready') throw new Error(`Expected photoreal ready, got ${photorealReady.status}`);

console.log(`[F691-F700] Values OK (${ownerReady.status}, ${photorealPreview.status} -> ${photorealReady.status}).`);
