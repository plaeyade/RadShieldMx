import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join('outputs', 'f386_three_unity_smoke');
fs.mkdirSync(outDir, { recursive: true });

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const medical3D = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const unityBridge = read('src/lib/medical3D/unityExternalViewerBridge.ts');
const unityUrl = (process.env.F386_UNITY_WEBGL_URL || process.env.VITE_MEDICAL_3D_UNITY_WEBGL_URL || '').trim();
const requireUnityLive = process.env.F386_REQUIRE_UNITY_LIVE === 'true';
const unityUrlValid = /^https?:\/\//i.test(unityUrl);

const checks = [
  {
    id: 'three-canvas-present',
    pass: medical3D.includes('<Canvas') && medical3D.includes('@react-three/fiber'),
    evidence: 'MedicalFloorPlan3DDialog uses React Three Fiber Canvas.',
  },
  {
    id: 'three-photoreal-controls-present',
    pass: medical3D.includes('f325-f330-photoreal-controls') && medical3D.includes('photorealWalkthrough'),
    evidence: 'Photoreal walkthrough controls exist on stable Three/R3F path.',
  },
  {
    id: 'three-visual-evidence-present',
    pass: medical3D.includes('f365-f366-visual-evidence-pack') && medical3D.includes('handleSnapshot'),
    evidence: 'Visual evidence capture/export exists.',
  },
  {
    id: 'unity-bridge-present',
    pass: unityBridge.includes('buildUnityExternalViewerLaunchPacket') && unityBridge.includes('VITE_MEDICAL_3D_UNITY_WEBGL_URL'),
    evidence: 'Unity external viewer bridge is present.',
  },
  {
    id: 'unity-url-live-gate',
    pass: unityUrlValid || !requireUnityLive,
    evidence: unityUrlValid ? `Unity URL configured: ${unityUrl}` : 'Unity URL not configured; gate remains deferred.',
  },
];

const failures = checks.filter((check) => !check.pass);
const manifest = {
  phase: 'F386',
  generatedAt: new Date().toISOString(),
  status: failures.length === 0 ? (unityUrlValid ? 'three-and-unity-url-smoke-ready' : 'three-ready-unity-gated') : 'three-unity-smoke-failed',
  requireUnityLive,
  unity: {
    urlConfigured: unityUrlValid,
    url: unityUrlValid ? unityUrl : null,
    mode: unityUrlValid ? 'external-viewer-url-configured' : 'external-viewer-url-missing',
    productionClaim:
      unityUrlValid
        ? 'Unity external viewer can be smoke-tested by browser; it is not calculation authority.'
        : 'Unity remains bridge-ready only, not a production viewer.',
  },
  threeR3F: {
    status: checks.slice(0, 3).every((check) => check.pass) ? 'production-visual-path-ready' : 'blocked',
    productionClaim: 'Three/R3F remains the active production visual path.',
  },
  checks,
};

fs.writeFileSync(path.join(outDir, 'f386_three_unity_smoke.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(
  path.join(outDir, 'f386_three_unity_smoke.md'),
  [
    '# F386 Three/R3F + Unity External Smoke',
    '',
    `Status: ${manifest.status}`,
    `Unity URL configured: ${unityUrlValid ? 'yes' : 'no'}`,
    `Require Unity live: ${requireUnityLive ? 'yes' : 'no'}`,
    '',
    '## Checks',
    ...checks.map((check) => `- ${check.id}: ${check.pass ? 'pass' : 'fail'} - ${check.evidence}`),
    '',
  ].join('\n'),
);

if (failures.length) {
  console.error('F386 Three/Unity smoke failures:');
  for (const failure of failures) console.error(`- ${failure.id}: ${failure.evidence}`);
  process.exit(1);
}

console.log(`F386 Three/Unity smoke written to ${outDir}`);

