import fs from 'node:fs';
import crypto from 'node:crypto';

const outDir = 'outputs/f315_unity_external_viewer_bridge';
fs.mkdirSync(outDir, { recursive: true });

const files = [
  'src/lib/medical3D/unityExternalViewerBridge.ts',
  'src/lib/medical3D/unityWebglHandoff.ts',
  'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx',
];

const fileHashes = Object.fromEntries(files.map((file) => [
  file,
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
]));

const manifest = {
  schema: 'radshield-mx.phase-manifest.v1',
  phase: 'F315',
  title: 'Unity external viewer bridge',
  status: 'unity-external-viewer-bridge-ready',
  generatedAt: new Date().toISOString(),
  intent: 'Expose a practical Unity WebGL handoff/export and optional external viewer launcher without bundling Unity into the stable frontend.',
  activation: {
    requiredFlag: 'VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER=true',
    requiredUrl: 'VITE_MEDICAL_3D_UNITY_WEBGL_URL=<unity-webgl-public-url>',
    fallbackEngine: 'three-r3f',
  },
  uiContracts: [
    'Medical 3D engine panel displays Unity external viewer readiness.',
    'Operator can export a Unity handoff JSON from the current scene.',
    'Operator can open the configured Unity URL only when the URL exists.',
  ],
  safetyRules: [
    'Unity remains outside the React bundle.',
    'Unity is visualization only, not calculation authority.',
    'Three/R3F remains the stable visual fallback.',
    'No live DB writes are required.',
  ],
  fileHashes,
  blockers: [],
};

fs.writeFileSync(`${outDir}/f315_unity_external_viewer_bridge.json`, JSON.stringify(manifest, null, 2));
fs.writeFileSync(
  'outputs/fase_315_unity_external_viewer_bridge.md',
  `# F315 - Unity external viewer bridge\n\nStatus: ${manifest.status}\n\nUnity queda conectado como visor externo configurable por URL y export JSON, sin instalar runtime dentro del frontend estable.\n`,
);

console.log(`F315 manifest written to ${outDir}/f315_unity_external_viewer_bridge.json`);
