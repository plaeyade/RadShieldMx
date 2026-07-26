import fs from 'node:fs';
import crypto from 'node:crypto';

const outDir = 'outputs/f317_f323_medical_3d_release_line';
fs.mkdirSync(outDir, { recursive: true });

const read = (file) => fs.readFileSync(file, 'utf8');
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const dialog = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const sceneBuilder = read('src/lib/medical3D/sceneBuilder.ts');
const renderStrategy = read('src/lib/medical3D/renderStrategy.ts');
const babylonLoader = read('src/lib/medical3D/babylonRuntimeLoader.ts');
const unityBridge = read('src/lib/medical3D/unityExternalViewerBridge.ts');

const modalities = ['linac', 'petct', 'ct', 'gammaKnife', 'hdr', 'radiofarmacia'];
const modes = ['presentation', 'technical', 'dose'];

const phases = [
  {
    phase: 'F317',
    title: 'Three/R3F modality visual smoke matrix',
    status: 'ready-for-operator-visual-smoke',
    scope: 'Validate every room preset across presentation, technical and dose modes.',
    evidence: modalities.flatMap((modality) => modes.map((mode) => `${modality}:${mode}`)),
    passCriteria: [
      'Medical 3D opens without blank canvas.',
      'Preset selector contains all six modalities.',
      'Mode tabs render presentation, technical and dose.',
      'PNG/OBJ/JSON export actions remain available.',
    ],
  },
  {
    phase: 'F318',
    title: 'Babylon dependency unlock',
    status: 'blocked-by-npm-registry-eacces',
    scope: 'Resolve package installation before any Babylon runtime UI is activated.',
    evidence: ['F316 diagnostic', 'npm registry EACCES', 'no partial package mutation'],
    passCriteria: [
      'npm install @babylonjs/core @babylonjs/loaders completes.',
      'package.json and lockfile declare both packages.',
      'F314 and F316 pass after install.',
    ],
  },
  {
    phase: 'F319',
    title: 'Babylon prototype behind runtime gate',
    status: 'staged-not-active',
    scope: 'Render MedicalScene through Babylon only behind adapter/runtime flags.',
    evidence: ['MedicalScene shared contract', 'loadBabylonRuntime', 'fallbackEngine three-r3f'],
    passCriteria: [
      'Three/R3F remains default.',
      'Babylon failure falls back to Three/R3F.',
      'No clinical calculation originates from Babylon.',
    ],
  },
  {
    phase: 'F320',
    title: 'Babylon PBR material realism',
    status: 'planned-after-F319',
    scope: 'Map shielding materials to physically-based visual properties.',
    evidence: ['concreto', 'plomo', 'acero', 'vidrio plomado', 'tabique HD', 'TM Nipoll', 'Nelco', 'Verishield'],
    passCriteria: [
      'Every material has visual metadata separate from calculation constants.',
      'TVL/density/cost/citation remain owned by material toolbox and calculation engine.',
      'Snapshots show material legend and selected wall metadata.',
    ],
  },
  {
    phase: 'F321',
    title: 'WebGPU/WebXR capability gate',
    status: 'planned-after-F319',
    scope: 'Detect advanced browser/device support before offering XR or WebGPU.',
    evidence: ['navigator.gpu', 'immersive-vr support', 'device fallback policy'],
    passCriteria: [
      'Unsupported devices hide WebGPU/WebXR actions.',
      'Supported devices still expose Three/R3F fallback.',
      'Manual and Update Center explain limitations.',
    ],
  },
  {
    phase: 'F322',
    title: 'Unity external proof',
    status: 'ready-when-external-url-exists',
    scope: 'Validate a real Unity WebGL build through the F315 URL/handoff bridge.',
    evidence: ['VITE_MEDICAL_3D_UNITY_WEBGL_URL', 'Unity JSON handoff', 'external visual smoke'],
    passCriteria: [
      'Unity URL opens in new tab or iframe.',
      'Scene payload matches current room/equipment/walls/zones.',
      'Unity returns only visual evidence, never authoritative calculations.',
    ],
  },
  {
    phase: 'F323',
    title: '3D visual export to reports',
    status: 'ready-for-report-integration',
    scope: 'Bind 3D snapshots, camera bookmarks and scene hashes to Memoria IA, PDF and Evidence Pack.',
    evidence: ['PNG snapshot', 'OBJ export', 'review JSON', 'engine handoff JSON', 'Unity handoff JSON'],
    passCriteria: [
      'Each exported visual includes plan, preset, camera/state and scene hash.',
      'Evidence Pack can reference visual exports with source hash.',
      'Report text keeps visual-only clinical disclaimer.',
    ],
  },
];

const wasdImprovements = [
  'Shift sprint for faster walkthrough.',
  'Ctrl precision mode for tight inspection around barriers and equipment.',
  'R/F eye-height control.',
  'Camera bounds clamped to room footprint to reduce disorientation.',
  'Future collision mesh should prevent crossing walls, doors and equipment.',
  'Future pointer-lock mode should add mouse-look and minimap breadcrumb.',
];

const postF324PhotorealismRoadmap = [
  { phase: 'F324', title: 'Pointer-lock walkthrough', impact: 'Mouse-look, crosshair, minimap trail and exit hint for real inspection feel.' },
  { phase: 'F325', title: 'Collision and navigation mesh', impact: 'Prevent crossing walls/equipment and support door/opening traversal.' },
  { phase: 'F326', title: 'PBR material library', impact: 'Realistic concrete, lead, steel, glass, tabique HD, TM Nipoll, Nelco and Verishield appearances.' },
  { phase: 'F327', title: 'Lighting and baked ambience', impact: 'Clinical-room realism with fixtures, shadows and exposure presets.' },
  { phase: 'F328', title: 'Texture/asset pipeline', impact: 'GLB equipment models and validated material textures without inflating initial bundle.' },
  { phase: 'F329', title: 'Photoreal walkthrough mode', impact: 'Dedicated mode for presentation, operator training and inspection snapshots.' },
  { phase: 'F330', title: 'Report-linked visual evidence', impact: 'Camera bookmarks and snapshots linked to wall/equipment/material/citation records.' },
];

const manifest = {
  schema: 'radshield-mx.phase-manifest.v1',
  phases,
  generatedAt: new Date().toISOString(),
  status: 'f317-f323-release-line-ready',
  currentEngine: 'three-r3f',
  babylonState: 'prepared-but-dependency-install-blocked',
  unityState: 'external-bridge-ready',
  modalityCoverage: {
    modalities,
    modes,
    combinations: modalities.length * modes.length,
  },
  wasdImprovements,
  postF324PhotorealismRoadmap,
  sourceChecks: {
    presetSelector: modalities.every((modality) => dialog.includes(`value="${modality}"`) || dialog.includes(`value='${modality}'`)),
    modeSelector: modes.every((mode) => dialog.includes(`value="${mode}"`) || dialog.includes(`value='${mode}'`)),
    wasdEnhanced: ['shift', 'control', "keys.current.has('r')", "keys.current.has('f')", 'THREE.MathUtils.clamp'].every((needle) => dialog.includes(needle)),
    sceneBuilderModalities: modalities.every((modality) => sceneBuilder.includes(modality)),
    renderStrategies: ['three-r3f', 'babylon-pbr-webgpu-webxr', 'unity-webgl-external'].every((engine) => renderStrategy.includes(engine)),
    babylonRuntimeLoader: babylonLoader.includes('loadBabylonRuntime') && babylonLoader.includes("fallbackEngine: 'three-r3f'"),
    unityExternalBridge: unityBridge.includes('buildUnityExternalViewerLaunchPacket'),
  },
  fileHashes: {
    medical3DDialog: hash(dialog),
    sceneBuilder: hash(sceneBuilder),
    renderStrategy: hash(renderStrategy),
    babylonRuntimeLoader: hash(babylonLoader),
    unityExternalViewerBridge: hash(unityBridge),
  },
  blockers: ['F318 remains blocked until npm registry EACCES is resolved.'],
};

fs.writeFileSync(`${outDir}/f317_f323_medical_3d_release_line.json`, JSON.stringify(manifest, null, 2));
fs.writeFileSync(
  'outputs/fase_317_323_medical_3d_release_line.md',
  `# F317-F323 - Medical 3D release line\n\nStatus: ${manifest.status}\n\nThree/R3F queda estable; Babylon sigue preparado pero bloqueado por npm EACCES; Unity externo queda listo por URL/handoff. WASD mejora con Shift, Ctrl, R/F y limites de sala.\n`,
);

console.log(`F317-F323 manifest written to ${outDir}/f317_f323_medical_3d_release_line.json`);
